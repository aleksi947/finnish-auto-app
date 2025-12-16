const fs = require('fs');

const lesson = JSON.parse(fs.readFileSync('upload-lessons/lessons/A2/lesson1.json', 'utf8'));
const queue = JSON.parse(fs.readFileSync('tts-queue.json', 'utf8'));

const existingOuts = new Set(queue.items.map(item => item.out));
const newItems = [];

lesson.speaking.forEach(exercise => {
  exercise.items.forEach(item => {
    const outPath = 'stripe-test/public' + item.audioUrl;
    if (!existingOuts.has(outPath)) {
      newItems.push({
        text: item.answer[0],
        out: outPath
      });
    }
  });
});

console.log('Найдено новых элементов:', newItems.length);

if (newItems.length > 0) {
  queue.items.push(...newItems);
  fs.writeFileSync('tts-queue.json', JSON.stringify(queue, null, 2), 'utf8');
  console.log('Добавлено', newItems.length, 'элементов в очередь');
} else {
  console.log('Все элементы уже есть в очереди');
}

