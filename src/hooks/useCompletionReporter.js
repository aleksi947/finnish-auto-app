import { useEffect, useRef } from "react";

export function useCompletionReporter({
  finished,
  answers,
  total,
  onMarkCompleted,
}) {
  const callbackRef = useRef(onMarkCompleted);
  const reportedRef = useRef(false);

  useEffect(() => {
    callbackRef.current = onMarkCompleted;
  }, [onMarkCompleted]);

  useEffect(() => {
    if (!finished) {
      reportedRef.current = false;
      return;
    }

    if (
      !reportedRef.current &&
      total > 0 &&
      answers.length === total
    ) {
      reportedRef.current = true;
      callbackRef.current?.(answers.every((answer) => answer.isCorrect));
    }
  }, [answers, finished, total]);
}
