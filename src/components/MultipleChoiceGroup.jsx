import { useEffect, useState } from "react";

// Перемешивание массива
function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function MultipleChoiceGroup({ exercise, section, currentQuestionIndex, onQuestionChange, onTotalQuestionsChange, lang = "ru", onMarkStarted, onMarkCompleted, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [mistakes, setMistakes] = useState([]);
  const [feedback, setFeedback] = useState(""); // пояснение по выбору
  const [answers, setAnswers] = useState([]); // Массив для отслеживания правильности ответов
  const [hasMarkedStarted, setHasMarkedStarted] = useState(false); // Флаг для отслеживания первого ответа

  // 🔹 Универсальный геттер локализованного текста (строка или {ru, fi, ...})
  const t = (val) => (typeof val === "string" ? val : val?.[lang] || "");

  useEffect(() => {
    if (!exercise?.questions) return;
    const shuffled = shuffle(exercise.questions);
    setQuestions(shuffled);
    setCurrent(0);
    setSelected(null);
    setFinished(false);
    setCorrectCount(0);
    setWrongCount(0);
    setMistakes([]);
    setFeedback("");
    setAnswers([]);
    setHasMarkedStarted(false);
    // Устанавливаем начальный прогресс на 1
    if (onQuestionChange) {
      onQuestionChange(1);
    }
    // Уведомляем родительский компонент об общем количестве вопросов
    if (onTotalQuestionsChange) {
      onTotalQuestionsChange(shuffled.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise]);

  // Обновляем прогресс при изменении текущего вопроса
  useEffect(() => {
    if (onQuestionChange && questions.length > 0) {
      onQuestionChange(current + 1);
    }
  }, [current, questions.length, onQuestionChange]);

  // Проверяем все ли ответы правильные при завершении
  // ВАЖНО: этот useEffect должен быть ДО любого раннего возврата
  useEffect(() => {
    if (finished && answers.length === questions.length && questions.length > 0) {
      const allCorrect = answers.every(a => a.isCorrect);
      if (onMarkCompleted) {
        onMarkCompleted(allCorrect);
      }
    }
  }, [finished, answers, questions.length, onMarkCompleted]);

  const currentQuestion = questions[current];

  if (!currentQuestion) {
    return <p style={{ color: "red" }}>❌ Вопросы не загружены</p>;
  }

  const handleAnswer = (index) => {
    if (selected !== null) return;
    setSelected(index);

    const isCorrect = index === currentQuestion.answer;

    // Отмечаем упражнение как начатое при первом ответе
    if (!hasMarkedStarted && onMarkStarted) {
      onMarkStarted();
      setHasMarkedStarted(true);
    }

    // Сохраняем результат ответа
    const newAnswers = [...answers, { questionIndex: current, isCorrect }];
    setAnswers(newAnswers);

    // 1) Пробуем взять question-level feedback (локализованный)
    let fb = isCorrect
      ? t(currentQuestion.feedbackCorrect)
      : t(currentQuestion.feedbackWrong);

    // 2) Если ничего нет, fallback на per-option пояснения (если переданы)
    if (!fb) {
      const optExpl = currentQuestion.explanations?.[index];
      fb = t(optExpl) || "";
    }

    setFeedback(fb);

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    } else {
      setWrongCount((w) => w + 1);
      setMistakes((m) => [...m, currentQuestion]);
    }
  };

  const handleNext = () => {
    if (current + 1 < questions.length) {
      setCurrent((prev) => prev + 1);
      setSelected(null);
      setFeedback("");
      // Прогресс обновится автоматически через useEffect при изменении current
    } else {
      setFinished(true);
      // При завершении устанавливаем прогресс на максимальное значение
      if (onQuestionChange && questions.length > 0) {
        onQuestionChange(questions.length);
      }
    }
  };

  const restartMistakes = () => {
    if (mistakes.length === 0) return;
    const reshuffled = shuffle(mistakes);
    setQuestions(reshuffled);
    setCurrent(0);
    setSelected(null);
    setCorrectCount(0);
    setWrongCount(0);
    setMistakes([]);
    setFeedback("");
    setFinished(false);
    setAnswers([]);
    setHasMarkedStarted(false);
    // Сбрасываем прогресс на 1 при повторении ошибок
    if (onQuestionChange) {
      onQuestionChange(1);
    }
    // Уведомляем родительский компонент об изменении количества вопросов
    if (onTotalQuestionsChange) {
      onTotalQuestionsChange(reshuffled.length);
    }
  };

  if (finished) {
    const totalAnswered = correctCount + wrongCount;
    const successRate = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    
    return (
      <div className="w-full">
        {/* Карточка результатов */}
        <div className="bg-white rounded-2xl border-2 border-[#E5E7EB] shadow-lg p-8 mb-6">
          <h3 className="text-2xl font-semibold text-[#1E293B] mb-6 text-center">
            Результаты упражнения
          </h3>
          
          {/* Статистика */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Правильные ответы */}
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 md:p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">{correctCount}</div>
              <div className="text-sm md:text-lg text-green-700 font-medium">Правильных</div>
            </div>
            
            {/* Ошибки */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 md:p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-red-600 mb-2">{wrongCount}</div>
              <div className="text-sm md:text-lg text-red-700 font-medium">Ошибок</div>
            </div>
          </div>
          
          {/* Процент успеха */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg text-[#4A5568] font-medium">Процент успеха</span>
              <span className="text-xl font-bold text-[#1E293B]">{successRate}%</span>
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
          <div className="flex flex-col gap-3">
            {/* Кнопка повторить ошибки */}
            {mistakes.length > 0 && (
              <button 
                onClick={restartMistakes}
                className="w-full bg-[#1471F6] hover:bg-[#0E5CD4] text-white font-medium py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path 
                    d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" 
                    fill="currentColor"
                  />
                </svg>
                <span>Повторить ошибки ({mistakes.length})</span>
              </button>
            )}
            
            {/* Кнопка завершить */}
            {onComplete && (
              <button 
                onClick={() => onComplete && onComplete()}
                className={`w-full font-medium py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 ${
                  mistakes.length > 0 
                    ? 'bg-white border-2 border-[#1471F6] text-[#1471F6] hover:bg-[#F0F7FF]' 
                    : 'bg-[#1471F6] hover:bg-[#0E5CD4] text-white'
                }`}
              >
                <span>✓</span>
                <span>Завершить</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Карточка вопроса с голубым фоном */}
      <div className="bg-[#EFF6FF] rounded-2xl border-2 border-[#BED5FF] p-6 md:p-7 mb-6">
        {/* Текст вопроса */}
        <p className="text-2xl text-[#1E293B] leading-[32px] mb-2">
          {currentQuestion.question.replace("___", "____")}
        </p>
        {/* Перевод */}
        {currentQuestion.translation && (
          <p className="text-lg italic text-[#4A5568] leading-[28px]">
            Перевод: {currentQuestion.translation}
          </p>
        )}
      </div>

      {/* Варианты ответов */}
      <div className="flex flex-col gap-3 mb-6">
        {currentQuestion.options.map((opt, i) => {
          const isCorrect = i === currentQuestion.answer;
          const isWrong = i === selected && selected !== currentQuestion.answer;
          const isSelected = selected === i;

          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={selected !== null}
              className={`
                w-full min-h-[72px] bg-white rounded-2xl border-2 flex items-center gap-4 px-5 py-4
                transition-all duration-200
                ${selected === null 
                  ? 'border-[#D1D5DB] hover:border-[#9CA3AF] cursor-pointer' 
                  : isCorrect
                  ? 'border-green-500 bg-green-50'
                  : isWrong
                  ? 'border-red-500 bg-red-50'
                  : 'border-[#D1D5DB] opacity-60'
                }
                ${selected !== null && !isSelected && !isCorrect ? 'cursor-not-allowed' : ''}
              `}
            >
              {/* Радио-кнопка - круг с рамкой */}
              <div className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                ${selected === null 
                  ? 'border-[#9CA3AF] bg-transparent' 
                  : isCorrect
                  ? 'border-green-500 bg-green-500'
                  : isWrong
                  ? 'border-red-500 bg-transparent'
                  : 'border-[#9CA3AF] bg-transparent'
                }
              `}>
                {isSelected && (
                  <div className={`
                    w-3 h-3 rounded-full
                    ${isCorrect ? 'bg-white' : isWrong ? 'bg-red-500' : 'bg-[#9CA3AF]'}
                  `} />
                )}
              </div>
              
              {/* Текст ответа */}
              <span className={`
                text-lg text-[#1E293B] leading-[28px] text-left flex-1
                ${isWrong ? 'line-through' : ''}
                ${isCorrect && selected !== null ? 'font-semibold' : ''}
              `}>
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {/* 👉 Пояснение после выбора */}
      {selected !== null && feedback && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 p-4 border-l-4 border-[#d97706] bg-[#FFF7ED] rounded-lg text-[#7a4a00]"
        >
          {feedback}
        </div>
      )}

      {selected !== null && (
        <button
          onClick={handleNext}
          className="mt-6 px-6 py-3 bg-[#1471F6] text-white rounded-xl cursor-pointer hover:bg-[#0E5CD4] transition-colors font-medium"
        >
          {current + 1 === questions.length
            ? "Показать результат"
            : "Следующий вопрос →"}
        </button>
      )}
    </div>
  );
}

export default MultipleChoiceGroup;
