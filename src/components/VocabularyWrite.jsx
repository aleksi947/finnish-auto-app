import { useState, useEffect } from "react";
import { Input } from "./ui/Input";
import { Button } from "./ui/button";

function normalize(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[!?.…]/g, "");
}

function VocabularyWrite({ words, lang, onFinish, onMarkStarted, onMarkCompleted }) {
  const [shuffled, setShuffled] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [showNext, setShowNext] = useState(false);
  const [inputColor, setInputColor] = useState("");
  const [mistakes, setMistakes] = useState([]);
  const [repeatingMistakes, setRepeatingMistakes] = useState(false);
  const [answers, setAnswers] = useState([]); // Array tracking answer correctness
  const [hasMarkedStarted, setHasMarkedStarted] = useState(false); // Flag tracking first answer

  useEffect(() => {
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    setShuffled(shuffledWords);
    setAnswers([]);
    setHasMarkedStarted(false);
  }, [words]);

  const currentWord = shuffled[currentIndex];

  const handleAnswer = () => {
    if (!currentWord) return;

    const correctAnswer = normalize(currentWord.fi);
    const userAnswer = normalize(answer);
    const isCorrect = userAnswer === correctAnswer;

    // Mark exercise started on first answer
    if (!hasMarkedStarted && onMarkStarted) {
      onMarkStarted();
      setHasMarkedStarted(true);
    }

    // Save answer result
    setAnswers((prev) => [...prev, { wordIndex: currentIndex, isCorrect }]);

    if (isCorrect) {
      setFeedback("✅ Правильно!");
      setCorrectCount((prev) => prev + 1);
      setInputColor("green");
    } else {
      setFeedback(`❌ Неправильно. Правильно: ${currentWord.fi}`);
      setIncorrectCount((prev) => prev + 1);
      setMistakes((prev) => [...prev, currentWord]);
      setInputColor("red");
    }

    setShowNext(true);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => prev + 1);
    setAnswer("");
    setFeedback("");
    setShowNext(false);
    setInputColor("");
  };

  const handleRepeatMistakes = () => {
    setShuffled(mistakes.sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setAnswer("");
    setFeedback("");
    setCorrectCount(0);
    setIncorrectCount(0);
    setMistakes([]);
    setShowNext(false);
    setRepeatingMistakes(true);
    setAnswers([]);
    setHasMarkedStarted(false);
  };

  // Check all answers correct on finish
  // IMPORTANT: this useEffect must run BEFORE any early return
  useEffect(() => {
    if (currentIndex >= shuffled.length && answers.length === shuffled.length && shuffled.length > 0) {
      const allCorrect = answers.every(a => a.isCorrect);
      if (onMarkCompleted) {
        onMarkCompleted(allCorrect);
      }
    }
  }, [currentIndex, shuffled.length, answers, onMarkCompleted]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !showNext && answer.trim()) {
      handleAnswer();
    }
  };

  if (currentIndex >= shuffled.length) {
    return (
      <div className="mt-8">
        <div className="bg-white border-2 border-blue-400 rounded-2xl p-8 mb-6">
          <h3 className="text-gray-800 text-2xl mb-4">Результаты</h3>
          <p className="text-gray-800 text-lg mb-2">✅ Правильных: {correctCount}</p>
          <p className="text-gray-800 text-lg mb-6">❌ Неправильных: {incorrectCount}</p>
          <div className="flex flex-col sm:flex-row gap-4">
            {!repeatingMistakes && mistakes.length > 0 && (
              <Button
                onClick={handleRepeatMistakes}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                🔁 Повторить ошибки ({mistakes.length})
              </Button>
            )}
            <Button
              onClick={onFinish}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              Вернуться
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isCorrect = inputColor === "green";
  const isIncorrect = inputColor === "red";

  return (
    <div className="mt-8">
      {/* Progress Indicator */}
      <div className="mb-6">
        <p className="text-gray-800 text-2xl">
          {currentIndex + 1}/{shuffled.length} — Переведите: {currentWord?.translations?.[lang]}
        </p>
      </div>

      {/* Input Field */}
      <div className="mb-6">
        <Input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={showNext}
          placeholder="Введите перевод на финском..."
          className={`w-full py-6 px-6 text-xl rounded-xl border-2 transition-all ${
            isCorrect
              ? "border-green-400 focus:border-green-600 focus:ring-2 focus:ring-green-200"
              : isIncorrect
              ? "border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-200"
              : "border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
          }`}
        />
      </div>

      {/* Check Button */}
      {!showNext ? (
        <div className="flex justify-center mb-6">
          <Button
            onClick={handleAnswer}
            disabled={!answer.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Проверить
          </Button>
        </div>
      ) : (
        <div className="flex justify-center mb-6">
          <Button
            onClick={handleNext}
            className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 text-lg"
          >
            {currentIndex < shuffled.length - 1 ? "Следующий вопрос" : "Завершить"}
          </Button>
        </div>
      )}

      {/* Feedback Message */}
      {showNext && feedback && (
        <div className="text-center mt-6">
          {isCorrect ? (
            <p className="text-green-600 text-2xl">✅ Правильно!</p>
          ) : (
            <div>
              <p className="text-red-600 text-2xl mb-2">❌ Неправильно</p>
              <p className="text-gray-700 text-xl">
                Правильный ответ: <span className="font-semibold">{currentWord.fi}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VocabularyWrite;
