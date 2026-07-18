import { useEffect, useState } from "react";
import { useCompletionReporter } from "../hooks/useCompletionReporter";

// Shuffle array
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
  const [feedback, setFeedback] = useState(""); // feedback for selection
  const [answers, setAnswers] = useState([]); // Array tracking answer correctness
  const [hasMarkedStarted, setHasMarkedStarted] = useState(false); // Flag tracking first answer

  // Localized text getter (string or {ru, fi, ...})
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
    // Initial progress = 1
    if (onQuestionChange) {
      onQuestionChange(1);
    }
    // Notify parent of total question count
    if (onTotalQuestionsChange) {
      onTotalQuestionsChange(shuffled.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise]);

  // Update progress when current question changes
  useEffect(() => {
    if (onQuestionChange && questions.length > 0) {
      onQuestionChange(current + 1);
    }
  }, [current, questions.length, onQuestionChange]);

  useCompletionReporter({
    finished,
    answers,
    total: questions.length,
    onMarkCompleted,
  });

  const currentQuestion = questions[current];

  if (!currentQuestion) {
    return <p style={{ color: "red" }}>❌ Вопросы не загружены</p>;
  }

  const handleAnswer = (index) => {
    if (selected !== null) return;
    setSelected(index);

    const isCorrect = index === currentQuestion.answer;

    // Mark exercise started on first answer
    if (!hasMarkedStarted && onMarkStarted) {
      onMarkStarted();
      setHasMarkedStarted(true);
    }

    // Save answer result
    const newAnswers = [...answers, { questionIndex: current, isCorrect }];
    setAnswers(newAnswers);

    // 1) Try question-level feedback (localized)
    let fb = isCorrect
      ? t(currentQuestion.feedbackCorrect)
      : t(currentQuestion.feedbackWrong);

    // 2) Fallback to per-option explanations if provided
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
      // Progress updates via useEffect when current changes
    } else {
      setFinished(true);
      // On completion set progress to maximum
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
    // Reset progress to 1 when retrying mistakes
    if (onQuestionChange) {
      onQuestionChange(1);
    }
    // Notify parent when question count changes
    if (onTotalQuestionsChange) {
      onTotalQuestionsChange(reshuffled.length);
    }
  };

  if (finished) {
    const totalAnswered = correctCount + wrongCount;
    const successRate = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    
    return (
      <div className="w-full">
        {/* Results card */}
        <div className="bg-white rounded-2xl border-2 border-[#E5E7EB] shadow-lg p-8 mb-6">
          <h3 className="text-2xl font-semibold text-[#1E293B] mb-6 text-center">
            Результаты упражнения
          </h3>
          
          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Correct answers */}
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 md:p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">{correctCount}</div>
              <div className="text-sm md:text-lg text-green-700 font-medium">Правильных</div>
            </div>
            
            {/* Mistakes */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 md:p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-red-600 mb-2">{wrongCount}</div>
              <div className="text-sm md:text-lg text-red-700 font-medium">Ошибок</div>
            </div>
          </div>
          
          {/* Success rate */}
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
          
          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            {/* Retry mistakes button */}
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
            
            {/* Finish button */}
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
      {/* Question card with blue background */}
      <div className="bg-[#EFF6FF] rounded-2xl border-2 border-[#BED5FF] p-6 md:p-7 mb-6">
        {/* Question text */}
        <p className="text-2xl text-[#1E293B] leading-[32px] mb-2">
          {currentQuestion.question.replace("___", "____")}
        </p>
        {/* Translation */}
        {currentQuestion.translation && (
          <p className="text-lg italic text-[#4A5568] leading-[28px]">
            Перевод: {currentQuestion.translation}
          </p>
        )}
      </div>

      {/* Answer options */}
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
              {/* Radio button — circle with border */}
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
              
              {/* Answer text */}
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

      {/* Explanation after selection */}
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
