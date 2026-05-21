/* jshint esversion: 11 */
/* jshint ignore:start */
import { useMemo, useState, useEffect } from "react";

function ReadingMultipleChoice({ task, onComplete, onMarkStarted, onMarkCompleted }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [answers, setAnswers] = useState([]); // Array tracking answer correctness
  const [hasMarkedStarted, setHasMarkedStarted] = useState(false); // Flag tracking first answer

  const totalQuestions = task.questions.length;
  const current = task.questions[currentIndex];
  const isFinished = currentIndex >= totalQuestions;

  const progress = useMemo(() => {
    const answeredCount = checked ? currentIndex + 1 : currentIndex;
    return totalQuestions === 0 ? 0 : (answeredCount / totalQuestions) * 100;
  }, [checked, currentIndex, totalQuestions]);

  const handleCheck = () => {
    if (selected === null) return;

    const isCorrect = selected === current.answer;

    // Mark exercise started on first answer
    if (!hasMarkedStarted && onMarkStarted) {
      onMarkStarted();
      setHasMarkedStarted(true);
    }

    // Save answer result
    setAnswers((prev) => [...prev, { questionIndex: currentIndex, isCorrect }]);

    if (isCorrect) {
      setScore((prev) => prev + 1);
    } else {
      setMistakes((prev) => prev + 1);
    }
    setChecked(true);
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelected(null);
      setChecked(false);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Check all answers correct on finish
  // IMPORTANT: this useEffect must run BEFORE any early return
  useEffect(() => {
    if (isFinished && answers.length === totalQuestions && totalQuestions > 0) {
      const allCorrect = answers.every(a => a.isCorrect);
      if (onMarkCompleted) {
        onMarkCompleted(allCorrect);
      }
    }
  }, [isFinished, answers, totalQuestions, onMarkCompleted]);

  if (isFinished) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-inner">
        <div className="mb-6 text-4xl text-emerald-600">Готово</div>
        <h2 className="text-2xl font-semibold text-emerald-900">
          Упражнение завершено!
        </h2>

        <div className="mt-6 space-y-3 rounded-2xl border-2 border-emerald-300 bg-white p-6 text-lg text-emerald-800">
          <p className="font-semibold">
            Правильных ответов: {score} из {totalQuestions}
          </p>
          <p>Ошибок: {mistakes}</p>
          <p>
            Процент успешности: {totalQuestions ? Math.round((score / totalQuestions) * 100) : 0}%
          </p>
        </div>

        {onComplete && (
          <button
            type="button"
            onClick={onComplete}
            className="mt-6 w-full rounded-2xl bg-[#030113] px-5 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-black"
          >
            Завершить
          </button>
        )}
      </div>
    );
  }

  if (!current) {
    return null;
  }

  const getOptionClasses = (index) => {
    const base =
      "w-full rounded-2xl border-2 px-5 py-4 text-left text-lg font-medium transition-all";

    if (!checked) {
      if (selected === index) {
        return `${base} border-[#1E64F0] bg-[#E4EFFF] text-[#0F172A] shadow-lg`;
      }
      return `${base} border-slate-200 bg-white text-slate-700 hover:border-[#1E64F0] hover:bg-[#F5F8FF]`;
    }

    const isCorrectOption = index === current.answer;
    const isWrongSelection = selected === index && selected !== current.answer;

    if (isCorrectOption) {
      return `${base} border-emerald-500 bg-emerald-50 text-emerald-700`;
    }

    if (isWrongSelection) {
      return `${base} border-rose-500 bg-rose-50 text-rose-700`;
    }

    return `${base} border-slate-200 bg-slate-50 text-slate-400`;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between text-sm font-medium text-slate-500">
          <span>
            Вопрос {checked ? currentIndex + 1 : currentIndex + 1} из {totalQuestions}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-[#030113]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[#d9e8ff] bg-[#f7f9ff] p-6">
        <p className="text-2xl font-semibold text-[#0f172a]">
          {current.question}
        </p>
      </div>

      <div className="space-y-4">
        {current.options.map((option, index) => (
          <button
            key={index}
            type="button"
            className={getOptionClasses(index)}
            onClick={() => !checked && setSelected(index)}
            disabled={checked}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {!checked ? (
          <button
            type="button"
            onClick={handleCheck}
            disabled={selected === null}
            className="w-full rounded-2xl bg-[#1E64F0] px-5 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-[#1550c8] disabled:cursor-not-allowed disabled:bg-[#9dbbff] disabled:opacity-70"
          >
            Проверить ответ
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="w-full rounded-2xl bg-[#030113] px-5 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-black"
          >
            {currentIndex < totalQuestions - 1
              ? "Следующий вопрос"
              : "Показать результат"}
          </button>
        )}

        {checked && (
          <div
            className={`rounded-2xl border-2 px-5 py-4 text-center text-lg font-medium ${
              selected === current.answer
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-rose-400 bg-rose-50 text-rose-700"
            }`}
          >
            {selected === current.answer ? (
              <span>Ответ верный. Отличная работа!</span>
            ) : (
              <span>
                Ответ неверный. Правильный ответ: <strong>{current.options[current.answer]}</strong>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReadingMultipleChoice;
/* jshint ignore:end */
