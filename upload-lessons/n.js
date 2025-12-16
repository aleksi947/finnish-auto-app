require("dotenv").config(); // Загружаем .env
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// 🔐 Путь к секретному ключу из .env
const serviceAccountPath =
  process.env.SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json";

// 🔐 Проверка, существует ли ключ
if (!fs.existsSync(serviceAccountPath)) {
  console.error(
    "❌ Файл serviceAccountKey.json не найден:",
    serviceAccountPath
  );
  process.exit(1);
}

// 🔐 Инициализация Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require(path.resolve(serviceAccountPath))),
});

const db = admin.firestore();

// 📁 Базовая папка с уроками (по уровням)
const basePath = path.join(__dirname, "lessons");

async function uploadAllLessons() {
  const levels = fs.readdirSync(basePath);

  for (const level of levels) {
    const levelPath = path.join(basePath, level);
    const files = fs.readdirSync(levelPath);

    for (const file of files) {
      const fullPath = path.join(levelPath, file);
      
      // Пропускаем директории (например, A2-1, A2-2 и т.д.)
      const stats = fs.statSync(fullPath);
      if (!stats.isFile()) {
        continue;
      }
      
      const lessonData = JSON.parse(fs.readFileSync(fullPath, "utf-8"));

      const match = file.match(/lesson(\d+)\.json/);
      if (!match) {
        console.warn(`⚠ Пропущен файл без правильного имени: ${file}`);
        continue;
      }

      const lessonId = `${level}-${match[1]}`; // Пример: A1-1, B2-3 и т.д.

      try {
        await db.collection("lessons").doc(lessonId).set(lessonData);
        console.log(`✅ Урок ${lessonId} загружен`);
      } catch (err) {
        console.error(`❌ Ошибка при загрузке ${lessonId}:`, err.message);
      }
    }
  }

  console.log("🎉 Все уроки загружены!");
  process.exit(0);
}

uploadAllLessons();
