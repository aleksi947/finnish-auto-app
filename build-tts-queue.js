// build-tts-queue.js
// Run: node build-tts-queue.js upload-lessons/lessons/A2/lesson2.json

import fs from "fs";
import path from "path";

const lessonPath = process.argv[2];
if (!lessonPath) {
  console.error("❌ Укажи путь к lesson.json");
  process.exit(1);
}

const VOICES = ["Харри", "Сельма", "Нора"];

// stable voice selection (consistent across runs)
function pickVoiceStable(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return VOICES[h % VOICES.length];
}

function pickAnswer(arr) {
  if (!Array.isArray(arr)) return null;
  return arr.find(s => typeof s === "string" && s.trim())?.trim() ?? null;
}

const lesson = JSON.parse(fs.readFileSync(lessonPath, "utf8"));

const items = [];

for (const block of lesson.speaking ?? []) {
  for (const it of block.items ?? []) {
    if (!it.audioUrl || !it.answer) continue;

    const text = pickAnswer(it.answer);
    if (!text) continue;

    const out = `stripe-test/public${it.audioUrl}`;

    items.push({
      text,
      out,
      voice: pickVoiceStable(it.audioUrl)
    });
  }
}

if (!items.length) {
  console.log("⚠ Ничего не найдено");
  process.exit(0);
}

const queuePath = path.resolve("tts-queue.json");

const queue = fs.existsSync(queuePath)
  ? JSON.parse(fs.readFileSync(queuePath, "utf8"))
  : { defaults: {}, items: [] };

queue.items.push(...items);

fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2), "utf8");

console.log(`✅ Добавлено в tts-queue.json: ${items.length} задач`);
