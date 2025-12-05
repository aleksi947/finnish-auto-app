// tts-batch.mjs
// Запуск из папки проекта:  node stripe-test/tts-batch.mjs
// Требует: npm i node-fetch@3 p-limit dotenv

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import pLimit from "p-limit";
import dotenv from "dotenv";

// --- базовые пути (скрипт и .env/queue лежат в stripe-test/) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// грузим .env именно из stripe-test/.env
dotenv.config({ path: path.join(__dirname, ".env") });

const EMAIL = process.env.ZV_EMAIL;
const TOKEN = process.env.ZV_TOKEN;

if (!EMAIL || !TOKEN) {
  console.error("✖ Не найден ZV_EMAIL или ZV_TOKEN в .env (stripe-test/.env).");
  process.exit(1);
}

// --- файл очереди находится рядом: stripe-test/tts-queue.json ---
const QUEUE_PATH = path.join(__dirname, "tts-queue.json");

// ---------- утилиты ----------
function ensureDirSync(p) { fs.mkdirSync(p, { recursive: true }); }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function now() {
  const d = new Date();
  return d.toISOString().replace("T"," ").replace(/\..+/, "");
}

function humanBytes(n) {
  const u = ["B","KB","MB","GB"]; let i = 0;
  while (n >= 1024 && i < u.length-1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${u[i]}`;
}

// ---------- API ----------
async function ttsShort({ text, voice, format, speed, pitch, emotion, pause_sentence, pause_paragraph }) {
  const body = new URLSearchParams({
    token: TOKEN,
    email: EMAIL,
    voice,
    text,
    format,
    ...(speed ? { speed } : {}),
    ...(pitch ? { pitch } : {}),
    ...(emotion ? { emotion } : {}),
    ...(pause_sentence ? { pause_sentence } : {}),
    ...(pause_paragraph ? { pause_paragraph } : {})
  });

  const resp = await fetch("https://zvukogram.com/index.php?r=api/text", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  let json;
  try { json = await resp.json(); }
  catch { throw new Error(`Неверный JSON ответа (HTTP ${resp.status})`); }

  if (json.status !== 1) {
    throw new Error(json.error || "TTS error");
  }

  // json.file (обычно без CORS), json.file_cors (если нужно в браузер)
  const audioResp = await fetch(json.file);
  const buf = Buffer.from(await audioResp.arrayBuffer());
  return buf;
}

async function withRetry(fn, { tries = 5, baseDelay = 800 } = {}) {
  let attempt = 0, lastErr;
  while (attempt < tries) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      attempt++;
      if (attempt >= tries) break;
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
      console.log(`  ↺ retry ${attempt}/${tries - 1} after ${delay}ms: ${e.message}`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

// ---------- основная логика ----------
async function main() {
  // читаем очередь
  let cfg;
  try {
    const raw = await fs.promises.readFile(QUEUE_PATH, "utf8");
    cfg = JSON.parse(raw);
  } catch (e) {
    console.error(`✖ Не удалось прочитать ${QUEUE_PATH}: ${e.message}`);
    process.exit(1);
  }

  const def = {
    voice: "Suvi plus",
    format: "mp3",
    speed: "1.0",
    pitch: "0",
    emotion: "good",
    pause_sentence: undefined,
    pause_paragraph: undefined,
    concurrency: 3,
    ...(cfg.defaults || {})
  };

  const items = (cfg.items || []).filter(i => i && typeof i.text === "string" && typeof i.out === "string");
  if (!items.length) {
    console.log("⚠ В очереди нет задач (items[] пуст).");
    return;
  }

  console.log(`\n[${now()}] Старт. Задач: ${items.length}. Голос по умолчанию: ${def.voice}. Параллельно: ${def.concurrency}\n`);

  const limit = pLimit(Number(def.concurrency) || 3);
  let created = 0, skipped = 0, failed = 0;
  let totalBytes = 0;

  await Promise.all(items.map((it, idx) => limit(async () => {
    const opts = { ...def, ...it };
    const relOrAbsOut = opts.out.trim();
    const outPath = path.isAbsolute(relOrAbsOut) ? relOrAbsOut : path.join(__dirname, "..", relOrAbsOut); 
    // ↑ сохраняем относительно корня проекта (поднялись из stripe-test на уровень выше),
    // т.е. "public/..." создастся в scloud_1.2/public/...

    try {
      if (fs.existsSync(outPath)) {
        skipped++;
        console.log(`✓ Уже есть (#${idx+1}): ${relOrAbsOut}`);
        return;
      }

      console.log(`→ [#${idx+1}] ${opts.text}  ⇒  ${relOrAbsOut}`);
      const buf = await withRetry(() => ttsShort(opts));

      ensureDirSync(path.dirname(outPath));
      await fs.promises.writeFile(outPath, buf);
      created++;
      totalBytes += buf.length;
      console.log(`✔ Сохранено: ${relOrAbsOut} (${humanBytes(buf.length)})`);
    } catch (e) {
      failed++;
      console.error(`✖ Ошибка для #${idx+1}: ${e.message}`);
    }
  })));

  console.log(`\n[${now()}] Готово. Создано: ${created}, пропущено: ${skipped}, ошибок: ${failed}. Объём: ${humanBytes(totalBytes)}\n`);
}

main().catch(e => {
  console.error("Фатальная ошибка:", e);
  process.exit(1);
});
