import { Fragment, useEffect, useState } from "react";
import DOMPurify from "dompurify";
import "../styles/grammar.scss";
import ResponsiveConjugationTable from "./ResponsiveConjugationTable";
import StructuredExplanation from "./StructuredExplanation";
import { Input } from "./ui/Input";
import { Progress } from "./ui/Progress";

// --- helpers ---
function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

// Extract verb list from legacy HTML explanation (if still used)
function extractVerbsFromExplanation(explanationHtml) {
  if (!explanationHtml) return [];
  let match =
    explanationHtml.match(
      /<p>[\s\S]*?<b>Примеры(?:\s+глаголов)?:<\/b>\s*([^<]+?)(?:\s+В\s+спряжении|\.\s*В|<\/p>)/is
    ) ||
    explanationHtml.match(
      /<b>Примеры(?:\s+глаголов)?:<\/b>\s*([^<]+?)(?:\s+В\s+спряжении|\.\s|<\/p>)/is
    ) ||
    explanationHtml.match(/<b>Примеры(?:\s+глаголов)?:<\/b>\s*([^<]+)/is);
  if (!match || !match[1]) return [];
  let verbsText = match[1].trim();
  verbsText = verbsText.split(/\.\s*В\s+спряжении/i)[0];

  const verbs = [];
  let currentPos = 0;
  let inBrackets = false;
  let bracketDepth = 0;
  let currentVerb = "";

  while (currentPos < verbsText.length) {
    const char = verbsText[currentPos];
    if (char === "(" || char === "（") {
      bracketDepth++;
      inBrackets = true;
      currentVerb += char;
    } else if (char === ")" || char === "）") {
      bracketDepth--;
      currentVerb += char;
      if (bracketDepth === 0) inBrackets = false;
    } else if (char === "," && !inBrackets) {
      const trimmed = currentVerb.trim();
      if (trimmed) {
        const verbMatch = trimmed.match(
          /^([а-яёА-ЯЁa-zA-ZäöüÄÖÜåÅ-]+)\s*[()（](.*?)[）)]/
        );
        if (verbMatch) {
          const verb = verbMatch[1].trim();
          const translations = verbMatch[2]
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
          verbs.push({ verb, translation: translations.join(", ") });
        } else {
          const verbOnly = trimmed.split(/[()（]/)[0].trim();
          if (verbOnly) verbs.push({ verb: verbOnly, translation: null });
        }
      }
      currentVerb = "";
    } else {
      currentVerb += char;
    }
    currentPos++;
  }
  if (currentVerb.trim()) {
    const trimmed = currentVerb.trim();
    const verbMatch = trimmed.match(
      /^([а-яёА-ЯЁa-zA-ZäöüÄÖÜåÅ-]+)\s*[()（](.*?)[）)]/
    );
    if (verbMatch) {
      const verb = verbMatch[1].trim();
      const translations = verbMatch[2]
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      verbs.push({ verb, translation: translations.join(", ") });
    } else {
      const verbOnly = trimmed.split(/[()（]/)[0].trim();
      if (verbOnly) verbs.push({ verb: verbOnly, translation: null });
    }
  }

  return verbs
    .filter(
      (it) =>
        it.verb &&
        it.verb.length >= 3 &&
        it.verb.length <= 15 &&
        !/^[\d\s.-]+$/.test(it.verb) &&
        /[а-яёА-ЯЁa-zA-ZäöüÄÖÜåÅ]/.test(it.verb) &&
        !it.verb.toLowerCase().includes("спряжении")
    )
    .slice(0, 13);
}

export default function FillInBlank({ exercise, onStageComplete, onComplete, stageIndex, onMarkStarted, onMarkCompleted, onTotalQuestionsChange }) {
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [mistakes, setMistakes] = useState([]);
  const [answers, setAnswers] = useState([]); // Array tracking answer correctness
  const [hasMarkedStarted, setHasMarkedStarted] = useState(false); // Flag tracking first answer

  // Legacy HTML explanations
  const exampleVerbs = extractVerbsFromExplanation(
    exercise?.explanation?.ru || ""
  );


  useEffect(() => {
    if (!exercise?.items) return;
    const shuffled = shuffle(exercise.items);
    setItems(shuffled);
    setCurrentIndex(0);
    setInput("");
    setFeedback("");
    setFeedbackTone("");
    setCorrectCount(0);
    setWrongCount(0);
    setFinished(false);
    setMistakes([]);
    setAnswers([]);
    setHasMarkedStarted(false);
    // Notify parent of total question count
    if (onTotalQuestionsChange) {
      onTotalQuestionsChange(shuffled.length);
    }
  }, [exercise, onTotalQuestionsChange]);

  const currentItem = items[currentIndex];
  const correctAnswer = currentItem?.answer?.trim().toLowerCase();

  const handleCheck = () => {
    if (!currentItem) return;
    const userAnswer = input.trim().toLowerCase();
    const isCorrect = userAnswer === correctAnswer;

    // Mark exercise started on first answer
    if (!hasMarkedStarted && onMarkStarted) {
      onMarkStarted();
      setHasMarkedStarted(true);
    }

    // Save answer result
    const newAnswers = [...answers, { questionIndex: currentIndex, isCorrect }];
    setAnswers(newAnswers);

    if (isCorrect) {
      setFeedback(currentItem.feedbackCorrect || "✅ Правильно!");
      setFeedbackTone("success");
      setCorrectCount((p) => p + 1);
    } else {
      const fb =
        currentItem.feedbackWrong ||
        `❌ Неправильно. Правильный ответ: ${currentItem.answer}`;
      const needsAppend = !fb.includes(currentItem.answer);
      setFeedback(
        needsAppend
          ? `${fb}<br/><strong>Правильно:</strong> ${currentItem.answer}`
          : fb
      );
      setFeedbackTone("error");
      setWrongCount((p) => p + 1);
      setMistakes((p) => [...p, currentItem]);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < items.length) {
      setCurrentIndex((p) => p + 1);
      setInput("");
      setFeedback("");
      setFeedbackTone("");
    } else {
      setFinished(true);
    }
  };

  // Check all answers correct on finish
  // IMPORTANT: this useEffect must run BEFORE any early return
  useEffect(() => {
    if (finished && answers.length === items.length && items.length > 0) {
      const allCorrect = answers.every(a => a.isCorrect);
      if (onMarkCompleted) {
        onMarkCompleted(allCorrect);
      }
    }
  }, [finished, answers, items.length, onMarkCompleted]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!feedback) {
        if (input.trim() !== "") handleCheck();
      } else {
        handleNext();
      }
    }
  };

  // --- results screen ---
  if (finished) {
    return (
      <div className="relative w-full max-w-[768px] mx-auto min-h-[713.78px] px-4 md:px-0">
        <h1 className="absolute left-1/2 -translate-x-1/2 top-0 w-full md:w-[306px] text-center text-3xl md:text-[48px] leading-tight md:leading-[48px] font-semibold text-[#0A0A0A]">
          Результаты
        </h1>
        <div className="absolute left-4 md:left-0 right-4 md:right-0 top-[80px] box-border flex flex-col items-start px-4 md:px-[49.78px] pt-6 md:pt-[49.78px] pb-[1.78px] w-auto md:w-full min-h-[569.78px] bg-white border-[1.78px] border-[#3C84F8] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] rounded-[24px]">
          <div className="w-full mb-6 box-border flex flex-col items-start px-4 md:px-[25.78px] pt-4 md:pt-[25.78px] pb-[1.78px] min-h-[107.56px] bg-[#F0FDF4] border-[1.78px] border-[#7BF1A8] rounded-[16px]">
            <div className="flex flex-row items-center gap-3 w-full">
              <span className="text-2xl md:text-[36px] leading-tight md:leading-[40px]">
                ✅
              </span>
              <div className="flex flex-col items-start gap-0">
                <p className="text-xs md:text-sm leading-5 text-[#4A5565]">
                  Правильных:
                </p>
                <p className="text-2xl md:text-[30px] leading-7 md:leading-9 text-[#00A63E]">
                  {correctCount}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full mb-6 box-border flex flex-col items-start px-4 md:px-[25.78px] pt-4 md:pt-[25.78px] pb-[1.78px] min-h-[107.56px] bg-[#FEF2F2] border-[1.78px] border-[#FFA2A2] rounded-[16px]">
            <div className="flex flex-row items-center gap-3 w-full">
              <span className="text-2xl md:text-[36px] leading-tight md:leading-[40px]">
                ❌
              </span>
              <div className="flex flex-col items-start gap-0">
                <p className="text-xs md:text-sm leading-5 text-[#4A5565]">
                  Ошибок:
                </p>
                <p className="text-2xl md:text-[30px] leading-7 md:leading-9 text-[#E7000B]">
                  {wrongCount}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col gap-4">
            {mistakes.length > 0 && (
              <button
                onClick={() => {
                  setItems(mistakes);
                  setCurrentIndex(0);
                  setInput("");
                  setFeedback("");
                  setFeedbackTone("");
                  setCorrectCount(0);
                  setWrongCount(0);
                  setFinished(false);
                  setMistakes([]);
                  setAnswers([]);
                  setHasMarkedStarted(false);
                  // Notify parent when question count changes
                  if (onTotalQuestionsChange) {
                    onTotalQuestionsChange(mistakes.length);
                  }

                  // Scroll to exercise after state update
                  setTimeout(() => {
                    const element = document.getElementById("exercise-start-anchor");
                    if (element) {
                      const rect = element.getBoundingClientRect();
                      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                      const navHeight = 100; // approximate navbar height with padding
                      // Scroll so exercise start sits just below navbar
                      window.scrollTo({
                        top: rect.top + scrollTop - navHeight,
                        behavior: "smooth"
                      });
                    }
                  }, 100);
                }}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg transition-all font-medium text-lg"
              >
                🔄 Повторить ошибки
              </button>
            )}

            {onStageComplete && (
              <button
                onClick={() => onStageComplete && onStageComplete()}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg transition-all font-medium text-lg"
              >
                Следующий этап →
              </button>
            )}

            {onComplete && (
              <button
                onClick={() => onComplete && onComplete()}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg transition-all font-medium text-lg"
              >
                Завершить
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const parts = currentItem?.sentence?.split("___");
  if (!currentItem || !parts) {
    return <p className="text-red-600">❌ Ошибка загрузки задания</p>;
  }

  const S = exercise?.explanationStructured;

  return (
    <div className="w-full">
        {/* Explanation: structured first, then HTML fallback */}
        {(S || exercise?.explanation?.ru) && (
          <div className="mb-6">
            {/* === Structured first === */}
            {S && <StructuredExplanation structured={{...S, stageIndex}} lang="ru" />}

            {/* === Fallback: legacy HTML (no structured) === */}
            {!S && exercise?.explanation?.ru && (
              <div className="mb-6">
                {/* Title */}
                <div className="mb-4">
                  <h2 
                    id={`stage-title-${stageIndex ?? 0}`}
                    className="text-2xl sm:text-3xl font-semibold text-[#1E64F0] scroll-mt-20"
                  >
                    {(() => {
                      const h3Match =
                        exercise?.explanation?.ru?.match(/<h3>(.*?)<\/h3>/);
                      return (
                        h3Match?.[1]?.replace(/🔹\s*/g, "").trim() || "Глаголы"
                      );
                    })()}
                  </h2>
                </div>

                {/* First paragraph */}
                {(() => {
                  const htmlContent = exercise?.explanation?.ru || "";
                  const firstP =
                    htmlContent.match(/<p>([\s\S]*?)<\/p>/i)?.[1] || "";
                  const cleaned = firstP.replace(/<br\s*\/?>/g, " ").trim();
                  return cleaned ? (
                    <p
                      className="text-gray-700 mb-6"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(cleaned.replace(
                          /<b>(.*?)<\/b>/g,
                          "<strong>$1</strong>"
                        )),
                      }}
                    />
                  ) : null;
                })()}

                {/* Verb cards */}
                {exampleVerbs.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">🍃</span>
                      <h4 className="text-lg font-semibold text-green-700">
                        Общие примеры
                      </h4>
                    </div>
                    <div className="bg-[#E9F1FF] rounded-xl p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {exampleVerbs.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-shadow border border-[#CFE0FF]"
                          >
                            <div className="font-semibold text-gray-900 text-base mb-1">
                              {item.verb || item}
                            </div>
                            {item.translation && (
                              <div className="text-xs text-gray-600 mt-1">
                                {item.translation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tables from HTML */}
                {(() => {
                  const htmlContent = exercise?.explanation?.ru || "";
                  const tables =
                    htmlContent.match(/<table>[\s\S]*?<\/table>/g) || [];
                  return (
                    <div className="space-y-6">
                      {tables.map((tableHtml, idx) => {
                        const before = htmlContent.substring(
                          0,
                          htmlContent.indexOf(tableHtml)
                        );
                        const h4Match = before.match(/<h4>(.*?)<\/h4>/);
                        const tableTitle = h4Match
                          ? h4Match[1]
                          : `Таблица ${idx + 1}`;
                        const isException =
                          tableTitle.toLowerCase().includes("kirjoittaa") ||
                          tableTitle.toLowerCase().includes("tehdä") ||
                          tableTitle.toLowerCase().includes("nähdä");

                        return (
                          <div
                            key={idx}
                            className="bg-white rounded-3xl shadow-lg border-2 border-[#3C84F8] p-6 sm:p-8"
                          >
                            <h3 className="text-2xl mb-6 flex items-center gap-2">
                              <span>📊</span>
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: DOMPurify.sanitize(tableTitle.replace(
                                    /<i>(.*?)<\/i>/,
                                    '<span class="text-blue-600">$1</span>'
                                  )),
                                }}
                              />
                            </h3>
                            <ResponsiveConjugationTable
                              htmlContent={tableHtml}
                              isException={isException}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Instruction and exercise */}
        <div className="w-full" id="exercise-start-anchor">
          <h3 className="text-2xl mb-6 flex items-center gap-2">
            <span>⚡</span>
            {exercise.instruction?.title?.ru || "Упражнение"}
          </h3>

          {exercise.instruction?.ru && (
            <div className="bg-gradient-to-r from-[#EFF6FF] to-[#F8FAFC] border-l-4 border-[#1471F6] rounded-r-xl p-6 md:p-7 mb-6 shadow-sm">
              <div>
                <h3 className="text-lg font-semibold text-[#1471F6] mb-2">Инструкция</h3>
                <div className="text-base md:text-lg text-[#1E293B] leading-relaxed whitespace-pre-line">
                  {exercise.instruction.ru.replace(/✍️\s*/, "").trim()}
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <Progress
              value={((currentIndex + 1) / (items.length || 1)) * 100}
              className="h-3 mb-2"
            />
            <p className="text-center text-sm text-gray-600">
              {currentIndex + 1} / {items.length || 0} выполнено
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <p className="text-base sm:text-xl md:text-3xl mb-6 text-center">
              {parts[0]}
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!!feedback}
                aria-label="Введите ответ"
                placeholder=""
                style={{ width: `${Math.max(input.length, 1) + 4}ch` }}
                className={[
                  "inline-block w-auto min-w-[60px] mx-1 sm:mx-2 text-center text-base sm:text-xl md:text-2xl py-3 sm:py-5 md:py-6 transition-all duration-200",
                  !feedback
                    ? ""
                    : feedbackTone === "success"
                    ? "border-green-500 bg-green-50 focus-visible:ring-green-500"
                    : "border-red-500 bg-red-50 focus-visible:ring-red-500",
                ].join(" ")}
              />
              {parts[1]}
            </p>

            {currentItem.translation && (
              <p className="text-lg text-gray-600 mb-4 text-center">
                {currentItem.translation}
              </p>
            )}

            {feedback && (
              <div
                className={`mt-4 p-4 rounded-xl text-center ${
                  feedbackTone === "success"
                    ? "bg-green-50 border-2 border-green-300 text-green-600"
                    : "bg-red-50 border-2 border-red-300 text-red-600"
                }`}
              >
                <p className="text-lg" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(feedback || "") }} />
              </div>
            )}
          </div>

          <div className="flex gap-4">
            {!feedback ? (
              <button
                onClick={handleCheck}
                disabled={!input.trim()}
                className="flex-1 py-6 text-xl rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                ✅ Проверить ответ
              </button>
            ) : currentIndex < items.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex-1 py-6 text-xl rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all"
              >
                Далее →
              </button>
            ) : (
              <button
                onClick={() => setFinished(true)}
                className="flex-1 py-6 text-xl rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all font-medium"
              >
                Завершить
              </button>
            )}
          </div>
        </div>
    </div>
  );
}
