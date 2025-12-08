const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(functions.config().stripe.secret);
const cors = require("cors");

admin.initializeApp();

const allowedOrigins = [
  "https://finnish-auto-new.web.app",
  "https://finnish-auto-new.firebaseapp.com", // На всякий случай
  "http://localhost:5173",
  "http://localhost:4173", // Vite preview
  "http://localhost:5000" // Emulators
];

const corsHandler = cors({
  origin: (origin, callback) => {
    // Разрешаем запросы без origin (например, server-to-server) или из белого списка
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
});

// ✅ СОЗДАНИЕ Checkout-сессии
exports.startCheckoutSession = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    // Проверяем метод запроса (на всякий случай)
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) return res.status(401).send("Unauthorized");

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // Получаем параметры из тела запроса
      // mode: 'subscription' (по умолчанию) или 'payment'
      // priceId: если передан, используем его, иначе берем из конфига (дефолтная подписка)
      const { mode = "subscription", priceId } = req.body;

      // Определяем ID цены.
      // Если priceId пришел с фронтенда - берем его.
      // Если нет - берем дефолтный ID подписки из конфига Firebase.
      const finalPriceId = priceId || functions.config().stripe.price_id;

      const sessionParams = {
        mode: mode, // 'subscription' или 'payment'
        payment_method_types: ["card"],
        line_items: [
          {
            price: finalPriceId,
            quantity: 1,
          },
        ],
        metadata: { 
          uid, 
          type: mode // Добавляем тип в метаданные, чтобы в вебхуке понимать контекст
        },
        success_url: "https://finnish-auto-new.web.app/success",
        cancel_url: "https://finnish-auto-new.web.app/profile", // Можно поменять на /subscription если нужно
      };

      // Для разовых платежей Stripe иногда требует creation of invoice_creation, но для checkout это обычно не нужно,
      // если это не B2B. Просто создаем сессию.

      const session = await stripe.checkout.sessions.create(sessionParams);

      res.json({ url: session.url });
    } catch (error) {
      console.error("❌ Ошибка создания Checkout Session:", error);
      const message = error.raw?.message || error.message || "Неизвестная ошибка";
      res.status(400).send(message);
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
        return res.status(400).send("subscriptionId отсутствует. Возможно, это разовый платеж, который нельзя отменить.");

      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      // Не меняем active на false сразу, так как она действует до конца периода
      // Но можем пометить, что она отменена
      await subRef.set({ canceledAtPeriodEnd: true }, { merge: true });

      res.status(200).send("Подписка отменена");
    } catch (error) {
      console.error("❌ Ошибка отмены подписки:", error.message);
      res.status(500).send("Internal Server Error");
    }
  });
});

// ✅ ВОЗОБНОВЛЕНИЕ подписки
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

      // Возобновляем в Stripe
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      // Обновляем Firestore
      await subRef.set({ canceledAtPeriodEnd: false }, { merge: true });

      res.status(200).send("Подписка возобновлена");
    } catch (error) {
      console.error("❌ Ошибка возобновления подписки:", error.message);
      res.status(500).send("Internal Server Error");
    }
  });
});

// ✅ WEBHOOK с поддержкой rawBody
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
    const mode = session.mode; // 'subscription' или 'payment'

    if (uid) {
      const ref = admin.firestore().collection("subscriptions").doc(uid);
      
      let updateData = { active: true };

      if (mode === "subscription") {
        // Для подписки сохраняем ID подписки
        updateData.subscriptionId = session.subscription;
        updateData.type = 'monthly';
        // Можно убрать поля разового платежа, если они были
        updateData.validUntil = admin.firestore.FieldValue.delete(); 
      } else if (mode === "payment") {
        // Для разового платежа вычисляем дату окончания (текущая дата + 30 дней)
        const now = new Date();
        const days30 = 30 * 24 * 60 * 60 * 1000;
        const validUntilDate = new Date(now.getTime() + days30);

        updateData.validUntil = admin.firestore.Timestamp.fromDate(validUntilDate);
        updateData.type = 'one_time';
        // Убираем subscriptionId, так как это не подписка
        updateData.subscriptionId = admin.firestore.FieldValue.delete();
      }

      await ref.set(updateData, { merge: true });
      console.log(`✅ Подписка/Оплата записана для пользователя: ${uid}, Тип: ${mode}`);
    }
  }

  // Обработка события, когда подписка удаляется или истекает
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    // Нам нужно найти пользователя с этим subscriptionId
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
