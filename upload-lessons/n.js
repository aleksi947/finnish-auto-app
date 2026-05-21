require("dotenv").config(); // Load .env
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Secret key path from .env
const serviceAccountPath =
  process.env.SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json";

// Check key exists
if (!fs.existsSync(serviceAccountPath)) {
  console.error(
    "❌ Файл serviceAccountKey.json не найден:",
    serviceAccountPath
  );
  process.exit(1);
}

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require(path.resolve(serviceAccountPath))),
});

const db = admin.firestore();

// Base lessons folder (by level)
const basePath = path.join(__dirname, "lessons");

async function uploadAllLessons() {
  const levels = fs.readdirSync(basePath);

  for (const level of levels) {
    const levelPath = path.join(basePath, level);
    const files = fs.readdirSync(levelPath);

    for (const file of files) {
      const fullPath = path.join(levelPath, file);
      
      // Skip directories (e.g. A2-1, A2-2)
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

      const lessonId = `${level}-${match[1]}`; // e.g. A1-1, B2-3

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
