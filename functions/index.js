const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(functions.config().stripe.secret);
const cors = require("cors");

admin.initializeApp();

const allowedOrigins = [
  "https://finnish-auto-new.web.app",
  "https://finnish-auto-new.firebaseapp.com", // fallback URL
  "http://localhost:5173",
  "http://localhost:4173", // Vite preview
  "http://localhost:5000" // Emulators
];

const corsHandler = cors({
  origin: (origin, callback) => {
    // Allow no-origin (server-to-server) or whitelist
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
});

// Create Checkout session
exports.startCheckoutSession = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    // Check request method
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) return res.status(401).send("Unauthorized");

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // Read params from request body
      // mode: 'subscription' (default) or 'payment'
      // priceId from client or default subscription from config
      const { mode = "subscription", priceId } = req.body;

      // Resolve price ID.
      // Use priceId from frontend if provided.
      // Else default subscription ID from Firebase config.
      const finalPriceId = priceId || functions.config().stripe.price_id;

      const sessionParams = {
        mode: mode, // 'subscription' or 'payment'
        payment_method_types: ["card"],
        line_items: [
          {
            price: finalPriceId,
            quantity: 1,
          },
        ],
        metadata: { 
          uid, 
          type: mode // Add type to metadata for webhook context
        },
        success_url: "https://finnish-auto-new.web.app/success",
        cancel_url: "https://finnish-auto-new.web.app/profile", // Can change to /subscription if needed
      };

      // For one-time payments Stripe may require invoice_creation, but checkout usually does not need it,
      // unless B2B. Just create the session.

      const session = await stripe.checkout.sessions.create(sessionParams);

      res.json({ url: session.url });
    } catch (error) {
      console.error("❌ Ошибка создания Checkout Session:", error);
      const message = error.raw?.message || error.message || "Неизвестная ошибка";
      res.status(400).send(message);
    }
  });
});

// Cancel subscription
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
        return res.status(400).send("subscriptionId отсутствует. Возможно, это разовый платеж, который нельзя отменить.");

      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      // Keep active until period end
      // Mark as cancelled
      await subRef.set({ canceledAtPeriodEnd: true }, { merge: true });

      res.status(200).send("Подписка отменена");
    } catch (error) {
      console.error("❌ Ошибка отмены подписки:", error.message);
      res.status(500).send("Internal Server Error");
    }
  });
});

// Resume subscription
exports.resumeSubscription = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) return res.status(401).send("Unauthorized");

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      const subRef = admin.firestore().collection("subscriptions").doc(uid);
      const docSnap = await subRef.get();

      if (!docSnap.exists) return res.status(404).send("Подписка не найдена");

      const { subscriptionId, canceledAtPeriodEnd } = docSnap.data();
      
      if (!subscriptionId) {
        return res.status(400).send("Невозможно возобновить: отсутствует ID подписки.");
      }

      if (!canceledAtPeriodEnd) {
        return res.status(400).send("Подписка уже активна и не была отменена.");
      }

      // Resume in Stripe
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      // Update Firestore
      await subRef.set({ canceledAtPeriodEnd: false }, { merge: true });

      res.status(200).send("Подписка возобновлена");
    } catch (error) {
      console.error("❌ Ошибка возобновления подписки:", error.message);
      res.status(500).send("Internal Server Error");
    }
  });
});

// Webhook with rawBody support
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const endpointSecret = functions.config().stripe.webhook_secret;
  const sig = req.headers["stripe-signature"];

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
    const mode = session.mode; // 'subscription' or 'payment'

    if (uid) {
      const ref = admin.firestore().collection("subscriptions").doc(uid);
      
      let updateData = { active: true };

      if (mode === "subscription") {
        // Save subscription ID for subscriptions
        updateData.subscriptionId = session.subscription;
        updateData.type = 'monthly';
        // Clear one-time payment fields if any
        updateData.validUntil = admin.firestore.FieldValue.delete(); 
      } else if (mode === "payment") {
        // One-time: expiry = now + 30 days
        const now = new Date();
        const days30 = 30 * 24 * 60 * 60 * 1000;
        const validUntilDate = new Date(now.getTime() + days30);

        updateData.validUntil = admin.firestore.Timestamp.fromDate(validUntilDate);
        updateData.type = 'one_time';
        // Remove subscriptionId — not a subscription
        updateData.subscriptionId = admin.firestore.FieldValue.delete();
      }

      await ref.set(updateData, { merge: true });
      console.log(`✅ Подписка/Оплата записана для пользователя: ${uid}, Тип: ${mode}`);
    }
  }

  // Handle subscription deleted/expired
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    // Find user by subscriptionId
    const snapshot = await admin.firestore()
      .collection("subscriptions")
      .where("subscriptionId", "==", subscription.id)
      .get();

    snapshot.forEach(async (doc) => {
      await doc.ref.set({ active: false }, { merge: true });
      console.log(`🚫 Подписка истекла для пользователя: ${doc.id}`);
    });
  }

  res.status(200).send("✅ Webhook получен");
});
