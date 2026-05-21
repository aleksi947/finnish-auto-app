const fs = require('fs');
const path = require('path');

const lessonPath = path.join(__dirname, 'upload-lessons', 'lessons', 'A2', 'lesson1.json');
const queuePath = path.join(__dirname, 'tts-queue.json');

const lesson = JSON.parse(fs.readFileSync(lessonPath, 'utf8'));
const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));

const items = [];

lesson.speaking.forEach(seq => {
  seq.items.forEach(item => {
    if (item.audioUrl && item.answer && item.answer.length > 0) {
      items.push({
        text: item.answer[0],
        out: 'stripe-test/public' + item.audioUrl
      });
    }
  });
});

queue.items = items;

fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));
console.log(`Добавлено ${items.length} элементов в очередь`);

