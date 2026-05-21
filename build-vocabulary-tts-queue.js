// build-vocabulary-tts-queue.js
// Usage examples:
// node build-vocabulary-tts-queue.js --level=A1
// node build-vocabulary-tts-queue.js --level=A1 --lesson=lesson9.json
// node build-vocabulary-tts-queue.js --level=A2 --lesson=lesson2.json

import fs from "fs";
import path from "path";

const LESSONS_DIR = path.resolve("upload-lessons/lessons");
const QUEUE_PATH = path.resolve("tts-vocabulary-queue.json");

const VOICES = ["Харри", "Сельма", "Нора"];

// ------------------------
// Arguments
// ------------------------
const levelArg = process.argv.find((arg) => arg.startsWith("--level="));
const lessonArg = process.argv.find((arg) => arg.startsWith("--lesson="));

const LEVEL = levelArg ? levelArg.split("=")[1].trim().toUpperCase() : null;
const LESSON_NAME = lessonArg ? lessonArg.split("=")[1].trim() : null;

if (!LEVEL) {
  console.error("❌ Укажи уровень, например: --level=A1");
  process.exit(1);
}

// ------------------------
// Stable voice selection
// ------------------------
function pickVoiceStable(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return VOICES[h % VOICES.length];
}

// ------------------------
// Queue path
// ------------------------
function normalizeOutPath(audioPath) {
  if (typeof audioPath !== "string" || !audioPath.trim()) return null;
  return `stripe-test/public${audioPath}`;
}

// ------------------------
// Absolute mp3 path on disk
// ------------------------
function toAbsoluteAudioFilePath(audioPath) {
  if (typeof audioPath !== "string" || !audioPath.trim()) return null;

  const relativePath = audioPath.startsWith("/")
    ? audioPath.slice(1)
    : audioPath;

  return path.resolve("stripe-test/public", relativePath);
}

// ------------------------
// Find all lesson*.json
// ------------------------
function findLessonFiles(dir) {
  const results = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...findLessonFiles(fullPath));
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.toLowerCase().endsWith(".json") &&
      entry.name.toLowerCase().startsWith("lesson")
    ) {
      results.push(fullPath);
    }
  }

  return results;
}

// ------------------------
// Safe JSON read
// ------------------------
function readJsonSafe(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.error(`❌ Ошибка чтения JSON: ${filePath}`);
    console.error(error.message);
    return null;
  }
}

// ------------------------
// Load queue
// ------------------------
function loadQueue(queuePath) {
  if (!fs.existsSync(queuePath)) {
    return {
      defaults: {
        voice: "Харри",
        format: "mp3",
        speed: "1.0",
        pitch: "0",
        emotion: "good",
        concurrency: 4,
      },
      items: [],
    };
  }

  try {
    return JSON.parse(fs.readFileSync(queuePath, "utf8"));
  } catch (error) {
    console.error(`❌ Не удалось прочитать файл очереди: ${queuePath}`);
    console.error(error.message);
    process.exit(1);
  }
}

// ------------------------
// Level check
// ------------------------
const levelPath = path.join(LESSONS_DIR, LEVEL);

if (!fs.existsSync(levelPath)) {
  console.error(`❌ Папка уровня не найдена: ${levelPath}`);
  process.exit(1);
}

// ------------------------
// Lesson file list
// ------------------------
let lessonFiles = [];

if (LESSON_NAME) {
  const lessonPath = path.join(levelPath, LESSON_NAME);

  if (!fs.existsSync(lessonPath)) {
    console.error(`❌ Урок не найден: ${lessonPath}`);
    process.exit(1);
  }

  lessonFiles = [lessonPath];
} else {
  lessonFiles = findLessonFiles(levelPath);
}

if (!lessonFiles.length) {
  console.log(`⚠ Не найдено ни одного lesson*.json`);
  process.exit(0);
}

const queue = loadQueue(QUEUE_PATH);
const existingKeys = new Set(
  (queue.items ?? []).map((item) => `${item.out}::${item.text}`)
);

const newItems = [];

let lessonsChecked = 0;
let vocabularyBlocksChecked = 0;
let wordsChecked = 0;
let addedCount = 0;
let skippedInvalidCount = 0;
let skippedDuplicateCount = 0;
let skippedExistingAudioCount = 0;

function addItem(text, audioPath) {
  if (typeof text !== "string" || !text.trim()) {
    skippedInvalidCount++;
    return false;
  }

  if (typeof audioPath !== "string" || !audioPath.trim()) {
    skippedInvalidCount++;
    return false;
  }

  const cleanText = text.trim();
  const out = normalizeOutPath(audioPath);
  const absAudioPath = toAbsoluteAudioFilePath(audioPath);

  if (!out || !absAudioPath) {
    skippedInvalidCount++;
    return false;
  }

  // Skip if mp3 already on disk
  if (fs.existsSync(absAudioPath)) {
    skippedExistingAudioCount++;
    return false;
  }

  // Skip if already in queue
  const key = `${out}::${cleanText}`;
  if (existingKeys.has(key)) {
    skippedDuplicateCount++;
    return false;
  }

  existingKeys.add(key);

  newItems.push({
    text: cleanText,
    out,
    voice: pickVoiceStable(audioPath),
  });

  addedCount++;
  return true;
}

// ------------------------
// Main pass
// ------------------------
for (const lessonFile of lessonFiles) {
  const lesson = readJsonSafe(lessonFile);
  if (!lesson) continue;

  lessonsChecked++;

  if (!lesson.vocabulary || typeof lesson.vocabulary !== "object") {
    continue;
  }

  for (const [, vocabBlock] of Object.entries(lesson.vocabulary)) {
    if (!vocabBlock || typeof vocabBlock !== "object") continue;

    vocabularyBlocksChecked++;

    const words = Array.isArray(vocabBlock.words) ? vocabBlock.words : [];

    for (const word of words) {
      wordsChecked++;

      if (!word || typeof word !== "object") {
        skippedInvalidCount++;
        continue;
      }

      addItem(word.fi, word.audio);
    }
  }
}

if (!newItems.length) {
  console.log("⚠ Ничего нового не найдено");
  console.log(`Уровень: ${LEVEL}`);
  console.log(`Урок: ${LESSON_NAME ?? "все уроки уровня"}`);
  console.log(`Проверено уроков: ${lessonsChecked}`);
  console.log(`Проверено блоков vocabulary: ${vocabularyBlocksChecked}`);
  console.log(`Проверено слов: ${wordsChecked}`);
  console.log(`Пропущено как некорректные: ${skippedInvalidCount}`);
  console.log(`Пропущено как дубли в очереди: ${skippedDuplicateCount}`);
  console.log(`Пропущено потому что mp3 уже существует: ${skippedExistingAudioCount}`);
  process.exit(0);
}

queue.items.push(...newItems);

fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2), "utf8");

console.log("✅ Готово");
console.log(`Уровень: ${LEVEL}`);
console.log(`Урок: ${LESSON_NAME ?? "все уроки уровня"}`);
console.log(`Проверено уроков: ${lessonsChecked}`);
console.log(`Проверено блоков vocabulary: ${vocabularyBlocksChecked}`);
console.log(`Проверено слов: ${wordsChecked}`);
console.log(`Добавлено новых задач: ${addedCount}`);
console.log(`Пропущено как некорректные: ${skippedInvalidCount}`);
console.log(`Пропущено как дубли в очереди: ${skippedDuplicateCount}`);
console.log(`Пропущено потому что mp3 уже существует: ${skippedExistingAudioCount}`);
console.log(`Файл очереди: ${QUEUE_PATH}`);