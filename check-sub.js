const admin = require("firebase-admin");
const path = require("path");

// Key path (up one level into upload-lessons)
const serviceAccountPath = path.resolve(__dirname, "../upload-lessons/serviceAccountKey.json");

console.log("🔑 Используем ключ:", serviceAccountPath);

try {
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();

  async function checkSubscriptions() {
    console.log("⏳ Чтение коллекции subscriptions...");
    const snapshot = await db.collection("subscriptions").get();

    if (snapshot.empty) {
      console.log("❌ Коллекция subscriptions пуста.");
      return;
    }

    console.log(`✅ Найдено документов: ${snapshot.size}\n`);

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`🆔 UID: ${doc.id}`);
      console.log(JSON.stringify(data, null, 2));
      
      // Debug interpretation
      if (data.active) {
          let type = "Неопределен";
          if (data.type) type = data.type;
          else if (data.subscriptionId) type = "Monthly (по id)";
          else if (data.validUntil) type = "One-time (по дате)";
          
          console.log(`👉 Интерпретация кодом: ${type}`);
          
          if (data.validUntil) {
             const date = data.validUntil.toDate ? data.validUntil.toDate() : new Date(data.validUntil);
             console.log(`📅 Действует до: ${date.toLocaleString()}`);
          }
      } else {
          console.log("👉 Подписка неактивна");
      }
      console.log("-".repeat(40));
    });
  }

  checkSubscriptions().catch(console.error);

} catch (err) {
  console.error("❌ Ошибка инициализации:", err.message);
  console.log("Убедитесь, что файл ключа существует по указанному пути.");
}

