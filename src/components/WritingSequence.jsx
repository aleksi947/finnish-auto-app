import { useState, useEffect } from "react";

// Перемешивание массива
function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

// Нормализация строки и сравнение
const isCorrect = (input, answer) => {
  const normalize = (str) =>
    (str ?? "")
      .trim()
      .toLowerCase()
      .replace(/\.+$/, "") // убрать финальные точки для гибкости
      .replace(/\s+/g, " ");

  const user = normalize(input);

  if (typeof answer === "string") {
    return user === normalize(answer);
  }

  if (Array.isArray(answer)) {
    return answer.some((a) => user === normalize(a));
  }

  return false;
};

function WritingSequence({ task, onMarkStarted, onMarkCompleted }) {
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [mistakes, setMistakes] = useState([]);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState([]); // Массив для отслеживания правильности ответов
  const [hasMarkedStarted, setHasMarkedStarted] = useState(false); // Флаг для отслеживания первого ответа

  // Новое состояние: показывать ли варианты ответов
  const [showChoices, setShowChoices] = useState(false);

  useEffect(() => {
    if (!task?.items) return;
    setItems(shuffle(task.items));
    setIndex(0);
    setInput("");
    setChecked(false);
    setShowResult(false);
    setCorrectCount(0);
    setWrongCount(0);
    setMistakes([]);
    setFinished(false);
    setShowChoices(false); // сбрасываем список вариантов при старте/смене задания
    setAnswers([]);
    setHasMarkedStarted(false);
  }, [task]);

  // Проверяем все ли ответы правильные при завершении
  // ВАЖНО: этот useEffect должен быть ДО любого раннего возврата
  useEffect(() => {
    if (finished && answers.length === items.length && items.length > 0) {
      const allCorrect = answers.every(a => a.isCorrect);
      if (onMarkCompleted) {
        onMarkCompleted(allCorrect);
      }
    }
  }, [finished, answers, items.length, onMarkCompleted]);

  const current = items[index];
  const correctAnswers = Array.isArray(current?.answer)
    ? current.answer
    : current?.answer
    ? [current.answer]
    : [];

  const correct = isCorrect(input, current?.answer);

  const handleCheck = () => {
    if (!current) return;
    
    // Отмечаем упражнение как начатое при первом ответе
    if (!hasMarkedStarted && onMarkStarted) {
      onMarkStarted();
      setHasMarkedStarted(true);
    }

    // Сохраняем результат ответа
    setAnswers((prev) => [...prev, { questionIndex: index, isCorrect: correct }]);

    if (correct) {
      setCorrectCount((c) => c + 1);
    } else {
      setWrongCount((w) => w + 1);
      setMistakes((m) => [...m, current]);
    }
    setChecked(true);
    setShowResult(true);
  };

  const handleNext = () => {
    setInput("");
    setChecked(false);
    setShowResult(false);
    setShowChoices(false);
    if (index < items.length - 1) {
      setIndex((i) => i + 1);
    } else {
      setFinished(true);
    }
  };

  const restartMistakes = () => {
    const reshuffled = shuffle(mistakes);
    setItems(reshuffled);
    setIndex(0);
    setInput("");
    setChecked(false);
    setShowResult(false);
    setCorrectCount(0);
    setWrongCount(0);
    setMistakes([]);
    setFinished(false);
    setShowChoices(false);
    setAnswers([]);
    setHasMarkedStarted(false);
  };

  const totalQuestions = items.length;
  const progressPercentage = totalQuestions > 0 ? ((index + 1) / totalQuestions) * 100 : 0;

  // Ранний возврат должен быть ПОСЛЕ всех хуков
  if (finished) {
    const successRate = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    
    return (
      <div className="w-full">
        {/* Карточка результатов */}
        <div className="bg-white rounded-xl md:rounded-2xl border-2 border-[#E5E7EB] shadow-lg p-4 md:p-6 lg:p-8 mb-4 md:mb-6">
          <h3 className="text-xl md:text-2xl font-semibold text-[#1E293B] mb-4 md:mb-6 text-center">
            Результаты упражнения
          </h3>
          
          {/* Статистика */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
            {/* Правильные ответы */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 text-center">
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-green-600 mb-1 md:mb-2">{correctCount}</div>
              <div className="text-xs md:text-sm lg:text-lg text-green-700 font-medium">Правильных</div>
            </div>
            
            {/* Ошибки */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 text-center">
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-red-600 mb-1 md:mb-2">{wrongCount}</div>
              <div className="text-xs md:text-sm lg:text-lg text-red-700 font-medium">Ошибок</div>
            </div>
          </div>
          
          {/* Процент успеха */}
          <div className="mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base md:text-lg text-[#4A5568] font-medium">Процент успеха</span>
              <span className="text-lg md:text-xl font-bold text-[#1E293B]">{successRate}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  successRate >= 70 ? 'bg-green-500' : successRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>
          
          {/* Кнопки действий */}
          <div className="flex flex-col gap-2 md:gap-3">
            {/* Кнопка повторить ошибки */}
            {mistakes.length > 0 && (
              <button 
                onClick={restartMistakes}
                className="w-full bg-[#1471F6] hover:bg-[#0E5CD4] active:bg-[#0D52C0] text-white font-medium py-3 md:py-4 px-4 md:px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 text-sm md:text-base active:scale-95"
              >
                <span>🔁</span>
                <span className="truncate">Повторить ошибки ({mistakes.length})</span>
              </button>
            )}
            
            {/* Кнопка завершить */}
            <button 
              onClick={() => window.history.back()}
              className={`w-full font-medium py-3 md:py-4 px-4 md:px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 text-sm md:text-base active:scale-95 ${
                mistakes.length > 0 
                  ? 'bg-white border-2 border-[#1471F6] text-[#1471F6] hover:bg-[#F0F7FF] active:bg-[#E5F0FF]' 
                  : 'bg-[#1471F6] hover:bg-[#0E5CD4] active:bg-[#0D52C0] text-white'
              }`}
            >
              <span>✓</span>
              <span>Завершить</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!current) {
    return <p className="text-red-600">❌ Ошибка загрузки задания</p>;
  }

  return (
    <div className="w-full">
      {/* Header with Title and Progress */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-gray-800 text-xl md:text-2xl lg:text-3xl font-normal">Упражнение на письмо</h1>
        <span className="text-gray-600 text-lg md:text-xl lg:text-2xl whitespace-nowrap ml-4">
          {index + 1}/{totalQuestions}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 md:mb-8">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-500 rounded-full bg-[#1471F6]"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Instruction */}
      <p className="text-gray-800 text-lg md:text-xl lg:text-2xl mb-4 font-normal">Переведите на финский:</p>

      {/* Russian Phrase */}
      <p className="text-gray-800 text-xl md:text-2xl lg:text-3xl mb-6 md:mb-8 font-normal">
        {current.prompt}
      </p>

      {/* Input Field */}
      <div className="mb-4 md:mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !checked && input.trim()) {
              handleCheck();
            }
          }}
          disabled={checked}
          placeholder="Введите перевод..."
          className={`
            w-full py-4 md:py-6 px-4 md:px-6 text-lg md:text-xl rounded-xl border-2 transition-all duration-200
            ${checked 
              ? correct 
                ? 'border-green-500 bg-green-50' 
                : 'border-red-500 bg-red-50'
              : 'border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200'
            }
            disabled:opacity-70
          `}
        />
      </div>

      {/* Hints Section */}
      {showChoices && correctAnswers.length > 0 && !checked && (
        <div className="mb-4 md:mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-gray-700 text-base md:text-lg mb-2 font-medium">Подсказки:</p>
          <p className="text-gray-800 text-lg md:text-xl">
            {correctAnswers.map((a, i) => (
              <span key={i}>
                {a}
                {i < correctAnswers.length - 1 && " • "}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {!checked ? (
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <button
            onClick={() => setShowChoices((v) => !v)}
            className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 px-6 md:px-8 py-4 md:py-6 text-lg md:text-xl rounded-xl transition-colors duration-200 active:scale-95"
          >
            {showChoices ? "Скрыть варианты" : "Показать варианты"}
          </button>
          
          <button
            onClick={handleCheck}
            disabled={!input.trim()}
            className="bg-[#1471F6] hover:bg-[#0E5CD4] active:bg-[#0D52C0] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 md:px-8 py-4 md:py-6 text-lg md:text-xl rounded-xl transition-colors duration-200 flex-1 active:scale-95"
          >
            Проверить
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Feedback Message */}
          <div className="text-center py-4">
            {correct ? (
              <p className="text-green-600 text-xl md:text-2xl font-semibold">✅ Правильно!</p>
            ) : (
              <div>
                <p className="text-red-600 text-xl md:text-2xl mb-2 font-semibold">❌ Неправильно</p>
                <p className="text-gray-700 text-lg md:text-xl">
                  Правильный ответ: <span className="font-semibold">
                    {Array.isArray(current.answer) ? current.answer[0] : current.answer}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="bg-[#1471F6] hover:bg-[#0E5CD4] active:bg-[#0D52C0] text-white px-6 md:px-8 py-4 md:py-6 text-lg md:text-xl rounded-xl transition-colors duration-200 active:scale-95"
          >
            {index + 1 < items.length ? "Дальше" : "Завершить"}
          </button>
        </div>
      )}
    </div>
  );
}

export default WritingSequence;
