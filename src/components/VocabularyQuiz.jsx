import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "./ui/button";

function VocabularyQuiz({ words, lang, onFinish, onMarkStarted, onMarkCompleted }) {
  const [shuffledWords, setShuffledWords] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [mistakes, setMistakes] = useState([]);
  const [options, setOptions] = useState([]);
  const [answers, setAnswers] = useState([]); // Массив для отслеживания правильности ответов
  const [hasMarkedStarted, setHasMarkedStarted] = useState(false); // Флаг для отслеживания первого ответа

  useEffect(() => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    setAnswers([]);
    setHasMarkedStarted(false);
  }, [words]);

  const currentWord = shuffledWords[current];

  const generateOptions = (correct) => {
    const translations = words
      .map((w) => w.translations?.[lang])
      .filter((t) => t && t !== correct);
    const random = translations.sort(() => 0.5 - Math.random()).slice(0, 2);
    return [correct, ...random].sort(() => 0.5 - Math.random());
  };

  useEffect(() => {
    if (currentWord) {
      const newOptions = generateOptions(currentWord.translations[lang]);
      setOptions(newOptions);
    }
  }, [currentWord]);

  const handleAnswer = (option) => {
    if (selected !== null) return;
    setSelected(option);

    const correct = currentWord.translations[lang];
    const isCorrect = option === correct;

    // Отмечаем упражнение как начатое при первом ответе
    if (!hasMarkedStarted && onMarkStarted) {
      onMarkStarted();
      setHasMarkedStarted(true);
    }

    // Сохраняем результат ответа
    setAnswers((prev) => [...prev, { wordIndex: current, isCorrect }]);

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    } else {
      setWrongCount((w) => w + 1);
      setMistakes((m) => [...m, currentWord]);
    }
  };

  const handleNext = () => {
    if (current + 1 < shuffledWords.length) {
      setCurrent((prev) => prev + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  };

  const restartMistakes = () => {
    if (mistakes.length === 0) return;
    const reshuffled = [...mistakes].sort(() => Math.random() - 0.5);
    setShuffledWords(reshuffled);
    setCurrent(0);
    setSelected(null);
    setCorrectCount(0);
    setWrongCount(0);
    setMistakes([]);
    setFinished(false);
    setAnswers([]);
    setHasMarkedStarted(false);
  };

  // Проверяем все ли ответы правильные при завершении
  // ВАЖНО: этот useEffect должен быть ДО любого раннего возврата
  useEffect(() => {
    if (finished && answers.length === shuffledWords.length && shuffledWords.length > 0) {
      const allCorrect = answers.every(a => a.isCorrect);
      if (onMarkCompleted) {
        onMarkCompleted(allCorrect);
      }
    }
  }, [finished, answers, shuffledWords.length, onMarkCompleted]);

  const getOptionClassName = (option) => {
    const baseClasses = "w-full py-6 px-6 rounded-xl border-2 transition-all cursor-pointer text-center text-gray-800 text-xl";
    
    if (selected === null) {
      return `${baseClasses} border-blue-400 bg-white hover:bg-blue-50`;
    }

    const isCorrect = option === currentWord?.translations[lang];
    const isWrong = option === selected && !isCorrect;

    if (isCorrect) {
      return `${baseClasses} border-green-400 bg-green-50`;
    }

    if (isWrong) {
      return `${baseClasses} border-red-400 bg-red-50`;
    }

    return `${baseClasses} border-blue-400 bg-white opacity-50`;
  };

  if (finished) {
    return (
      <div className="mt-8">
        <div className="bg-white border-2 border-blue-400 rounded-2xl p-8 mb-6">
          <h3 className="text-gray-800 text-2xl mb-4">Результат:</h3>
          <p className="text-gray-800 text-lg mb-2">✅ Правильных: {correctCount}</p>
          <p className="text-gray-800 text-lg mb-6">❌ Ошибок: {wrongCount}</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={onFinish}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              Завершить
            </Button>
            {mistakes.length > 0 && (
              <Button
                onClick={restartMistakes}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                🔁 Повторить ошибки
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {/* Progress Indicator */}
      <div className="mb-6">
        <p className="text-gray-800 text-2xl">
          {current + 1}/{shuffledWords.length} — Что значит: {currentWord?.fi}?
        </p>
      </div>

      {/* Example Box */}
      {currentWord?.example && (
        <div className="bg-white border-2 border-blue-400 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500 rounded-lg p-2 flex-shrink-0">
              <FileText className="size-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-gray-800 text-lg mb-2">
                <span className="font-semibold">Пример:</span> {currentWord.example.fi}
              </p>
              <p className="text-gray-600 text-lg">
                {currentWord.example[lang]}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Answer Options */}
      <div className="space-y-4 mb-8">
        {options.map((option, i) => {
          const isCorrect = option === currentWord?.translations[lang];
          const isWrong = option === selected && !isCorrect;

          return (
            <button
              key={i}
              onClick={() => handleAnswer(option)}
              disabled={selected !== null}
              className={getOptionClassName(option)}
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* Next Button (appears after answering) */}
      {selected !== null && (
        <div className="flex justify-center">
          <Button
            onClick={handleNext}
            className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 text-lg"
          >
            {current < shuffledWords.length - 1 ? "Следующий вопрос" : "Завершить"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default VocabularyQuiz;
