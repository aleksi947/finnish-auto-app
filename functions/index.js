const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(functions.config().stripe.secret);
const cors = require("cors");
const crypto = require("crypto");

admin.initializeApp();

const FEEDBACK_LIMIT = 5;
const FEEDBACK_WINDOW_MS = 60 * 60 * 1000;

function cleanText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Public feedback endpoint. Direct client writes to Firestore stay disabled.
exports.submitFeedback = functions.https.onCall(async (data, context) => {
  const type = data?.type === "question" ? "question" : "review";
  const name = cleanText(data?.name, 80);
  const email = cleanText(data?.email, 254).toLowerCase();
  const subject = cleanText(data?.subject, 120);
  const message = cleanText(data?.message, 2000);
  const website = cleanText(data?.website, 200);
  const privacyAccepted = data?.privacyAccepted === true;
  const rating = Number(data?.rating);

  // Honeypot: return success without saving bot submissions.
  if (website) return { ok: true };

  if (!privacyAccepted) {
    throw new functions.https.HttpsError("failed-precondition", "Consent is required");
  }
  if (message.length < 10) {
    throw new functions.https.HttpsError("invalid-argument", "Message is too short");
  }
  if (email && !isValidEmail(email)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid email");
  }
  if (type === "question" && (!email || subject.length < 3)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Email and subject are required for questions"
    );
  }
  if (type === "review" && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    throw new functions.https.HttpsError("invalid-argument", "Rating must be between 1 and 5");
  }

  const rawIp = context.rawRequest?.ip || "unknown";
  const ipHash = crypto.createHash("sha256").update(rawIp).digest("hex");
  const rateRef = admin.firestore().collection("feedbackRateLimits").doc(ipHash);
  const now = Date.now();

  await admin.firestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(rateRef);
    const current = snapshot.exists ? snapshot.data() : null;
    const windowStart = current?.windowStart?.toMillis?.() || 0;
    const inCurrentWindow = now - windowStart < FEEDBACK_WINDOW_MS;
    const count = inCurrentWindow ? Number(current?.count || 0) : 0;

    if (count >= FEEDBACK_LIMIT) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Too many feedback submissions"
      );
    }

    transaction.set(rateRef, {
      count: count + 1,
      windowStart: inCurrentWindow
        ? current.windowStart
        : admin.firestore.Timestamp.fromMillis(now),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  const feedbackRef = admin.firestore().collection("feedback").doc();
  await feedbackRef.set({
    type,
    name: name || null,
    email: email || null,
    subject: type === "question" ? subject : null,
    message,
    rating: type === "review" ? rating : null,
    status: "new",
    userId: context.auth?.uid || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true, id: feedbackRef.id };
});

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
