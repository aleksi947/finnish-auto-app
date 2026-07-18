/* jshint esversion: 11 */
import { useRef, useState } from "react";
import { ArrowUp, ArrowDown, Check, X } from "lucide-react";

function SortDialogueExercise({ task, onMarkStarted, onMarkCompleted }) {
  const [items, setItems] = useState(shuffle([...task.lines]));
  const [checked, setChecked] = useState(false);
  const hasMarkedStarted = useRef(false);

  const markStarted = () => {
    if (!hasMarkedStarted.current) {
      hasMarkedStarted.current = true;
      onMarkStarted?.();
    }
  };

  const handleCheck = () => {
    markStarted();
    setChecked(true);
    if (isCorrect) onMarkCompleted?.(true);
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const copy = [...items];
    [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
    setItems(copy);
    setChecked(false);
    markStarted();
  };

  const moveDown = (index) => {
    if (index === items.length - 1) return;
    const copy = [...items];
    [copy[index + 1], copy[index]] = [copy[index], copy[index + 1]];
    setItems(copy);
    setChecked(false);
    markStarted();
  };

  const isCorrect =
    JSON.stringify(items) ===
    JSON.stringify(task.answer.map((i) => task.lines[i]));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-500">
          Задание
        </p>
        <p className="text-xl font-semibold text-slate-900">{task.title}</p>
      </div>

      <ul className="space-y-3">
        {items.map((line, index) => (
          <li
            key={`${line}-${index}`}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <span className="text-lg text-slate-800">{line}</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => moveUp(index)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-[#1E64F0] hover:text-[#1E64F0]"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveDown(index)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-[#1E64F0] hover:text-[#1E64F0]"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={handleCheck}
        className="w-full rounded-2xl bg-[#1E64F0] px-5 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-[#1550c8]"
      >
        {checked ? "Проверить ещё раз" : "Проверить порядок"}
      </button>

      {checked && (
        <div
          className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-4 text-lg font-semibold ${
            isCorrect
              ? "border-emerald-400 bg-emerald-50 text-emerald-700"
              : "border-rose-400 bg-rose-50 text-rose-700"
          }`}
        >
          {isCorrect ? (
            <>
              <Check className="h-6 w-6" />
              <span>Всё правильно! Отличная работа.</span>
            </>
          ) : (
            <>
              <X className="h-6 w-6" />
              <span>Есть ошибки. Попробуйте ещё раз.</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function shuffle(arr) {
  return arr
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

export default SortDialogueExercise;
