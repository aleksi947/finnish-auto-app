import { useState, useEffect } from "react";

function VocabularyWrite({ words, lang, onFinish }) {
  const [shuffled, setShuffled] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);

  useEffect(() => {
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    setShuffled(shuffledWords);
  }, [words]);

  const handleAnswer = () => {
    const currentWord = shuffled[currentIndex];
    if (!currentWord) return;

    const correctAnswer = currentWord.fi.trim().toLowerCase();
    const userAnswer = answer.trim().toLowerCase();

    if (userAnswer === correctAnswer) {
      setFeedback("✅ Правильно!");
      setCorrectCount((prev) => prev + 1);
    } else {
      setFeedback(`❌ Неправильно. Правильно: ${currentWord.fi}`);
      setIncorrectCount((prev) => prev + 1);
    }

    setTimeout(() => {
      setAnswer("");
      setFeedback("");
      setCurrentIndex((prev) => prev + 1);
    }, 1000);
  };

  const currentWord = shuffled[currentIndex];

  if (currentIndex >= shuffled.length) {
    return (
      <div>
        <h3>Результаты</h3>
        <p>✅ Правильных: {correctCount}</p>
        <p>❌ Неправильных: {incorrectCount}</p>
        <button onClick={onFinish}>Вернуться</button>
      </div>
    );
  }

  return (
    <div>
      <p>
        Переведите: <strong>{currentWord?.translations?.[lang]}</strong>
      </p>
      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Напишите по-фински"
      />
      <button onClick={handleAnswer}>Ответить</button>
      {feedback && <p>{feedback}</p>}
    </div>
  );
}

export default VocabularyWrite;
