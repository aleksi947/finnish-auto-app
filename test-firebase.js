import admin from "firebase-admin";
import { readFile } from "fs/promises";
import process from "process";

async function testFirebaseConnection() {
  try {
    // Загружаем ключ
    const serviceAccount = JSON.parse(
      await readFile("./service-account-key.json", "utf-8")
    );

    console.log("🔑 Ключ сервисного аккаунта загружен");
    console.log("📧 Email:", serviceAccount.client_email);
    console.log("🏗️  Project ID:", serviceAccount.project_id);

    // Инициализируем Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });

    console.log("✅ Firebase Admin инициализирован");

    const db = admin.firestore();
    
    // Пробуем прочитать коллекцию lessons
    console.log("📖 Пробуем прочитать коллекцию lessons...");
    const lessonsSnapshot = await db.collection("lessons").limit(1).get();
    
    console.log("✅ Подключение к Firestore успешно!");
    console.log(`📊 Найдено документов: ${lessonsSnapshot.size}`);

    // Пробуем создать тестовый документ
    console.log("✍️  Пробуем создать тестовый документ...");
    const testDoc = {
      test: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      message: "Тестовый документ для проверки подключения"
    };

    await db.collection("test").doc("connection-test").set(testDoc);
    console.log("✅ Тестовый документ создан успешно!");

    // Удаляем тестовый документ
    await db.collection("test").doc("connection-test").delete();
    console.log("🗑️  Тестовый документ удален");

    console.log("🎉 Все тесты пройдены успешно!");
    process.exit(0);

  } catch (error) {
    console.error("❌ Ошибка при тестировании Firebase:", error);
    console.error("🔍 Детали ошибки:", {
      code: error.code,
      message: error.message,
      details: error.details
    });
    process.exit(1);
  }
}

testFirebaseConnection(); 