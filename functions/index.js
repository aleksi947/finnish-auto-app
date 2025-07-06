const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(functions.config().stripe.secret);
const cors = require("cors");
const corsHandler = cors({ origin: true });

admin.initializeApp();

// ✅ СОЗДАНИЕ Checkout-сессии
exports.startCheckoutSession = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) return res.status(401).send("Unauthorized");

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: functions.config().stripe.price_id,
            quantity: 1,
          },
        ],
        metadata: { uid },
        success_url: "http://localhost:5173/success",
        cancel_url: "http://localhost:5173/profile",
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("❌ Ошибка создания Checkout Session:", error);
      res.status(400).send(error.message || "Unknown error");
    }
  });
});

// ✅ ОТМЕНА подписки
exports.stopSubscription = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) return res.status(401).send("Unauthorized");

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      const subRef = admin.firestore().collection("subscriptions").doc(uid);
      const docSnap = await subRef.get();

      if (!docSnap.exists) return res.status(404).send("Подписка не найдена");

      const { subscriptionId } = docSnap.data();
      if (!subscriptionId)
        return res.status(400).send("subscriptionId отсутствует");

      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      await subRef.set({ active: false }, { merge: true });

      res.status(200).send("Подписка отменена");
    } catch (error) {
      console.error("❌ Ошибка отмены подписки:", error.message);
      res.status(500).send("Internal Server Error");
    }
  });
});

// ✅ WEBHOOK
exports.stripeWebhook = functions.https.onRequest((req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = functions.config().stripe.webhook_secret;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Ошибка подписи Webhook:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const uid = session.metadata.uid;
    const subscriptionId = session.subscription;

    if (uid) {
      const ref = admin.firestore().collection("subscriptions").doc(uid);
      ref.set({ active: true, subscriptionId }, { merge: true });
    }
  }

  res.status(200).send("✅ Webhook получен");
});
