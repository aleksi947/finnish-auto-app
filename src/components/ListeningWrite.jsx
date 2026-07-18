import { useEffect, useState, useRef } from "react";
import { Volume2, Pause, RotateCcw, Check } from "lucide-react";
import { useCompletionReporter } from "../hooks/useCompletionReporter";

// Shuffles array
function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function ListeningWrite({ 
  task, 
  currentQuestionIndex, 
  onQuestionChange, 
  onTotalChange,
  onComplete,
  onMarkStarted,
  onMarkCompleted,
}) {
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [mistakes, setMistakes] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [answers, setAnswers] = useState([]); // Array tracking answer correctness
  const [hasMarkedStarted, setHasMarkedStarted] = useState(false); // Flag tracking first answer
  const audioRef = useRef(null);

  useEffect(() => {
    if (!task?.items) return;
    const shuffled = shuffle(task.items);
    setItems(shuffled);
    setCurrentIndex(0);
    setInput("");
    setChecked(false);
    setIsCorrect(false);
    setCorrectAnswer("");
    setScore(0);
    setFinished(false);
    setMistakes([]);
    setIsPlaying(false);
    setAnsweredCount(0);
    setAnswers([]);
    setHasMarkedStarted(false);
    if (onQuestionChange) {
      onQuestionChange(0);
    }
    if (onTotalChange) {
      onTotalChange(shuffled.length);
    }
  }, [task, onQuestionChange, onTotalChange]);

  useCompletionReporter({
    finished,
    answers,
    total: items.length,
    onMarkCompleted,
  });

  const currentItem = items[currentIndex];

  if (!currentItem) {
    return <p className="text-red-600">❌ Вопросы не загружены</p>;
  }

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  const handleCheck = () => {
    if (checked || input.trim() === "") return;

    const normalize = (str) =>
      (str || "")
        .trim()
        .toLowerCase()
        .replace(/[.,!?;:]/g, "")
        .replace(/\s+/g, " ");

    const userAnswer = normalize(input);
    const correctAnswers = Array.isArray(currentItem.answers)
      ? currentItem.answers.map(normalize)
      : [];

    const isAnswerCorrect = correctAnswers.includes(userAnswer);
    setIsCorrect(isAnswerCorrect);
    setChecked(true);
    setCorrectAnswer(currentItem.answers?.[0] || "");

    // Mark exercise started on first answer
    if (!hasMarkedStarted && onMarkStarted) {
      onMarkStarted();
      setHasMarkedStarted(true);
    }

    // Save answer result
    const newAnswers = [...answers, { questionIndex: currentIndex, isCorrect: isAnswerCorrect }];
    setAnswers(newAnswers);

    if (isAnswerCorrect) {
      setScore((prev) => prev + 1);
    } else {
      setMistakes((prev) => [...prev, currentItem]);
    }

    // Increment answered count and update progress
    const newAnsweredCount = answeredCount + 1;
    setAnsweredCount(newAnsweredCount);
    if (onQuestionChange) {
      onQuestionChange(newAnsweredCount);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < items.length) {
      setCurrentIndex((prev) => prev + 1);
      setInput("");
      setChecked(false);
      setIsCorrect(false);
      setCorrectAnswer("");
      setIsPlaying(false);
    } else {
      setFinished(true);
    }
  };

  const restartMistakes = () => {
    if (mistakes.length === 0) return;
    const reshuffled = shuffle(mistakes);
    setItems(reshuffled);
    setCurrentIndex(0);
    setInput("");
    setChecked(false);
    setIsCorrect(false);
    setCorrectAnswer("");
    setScore(0);
    setFinished(false);
    setMistakes([]);
    setIsPlaying(false);
    setAnsweredCount(0);
    setAnswers([]);
    setHasMarkedStarted(false);
    if (onQuestionChange) {
      onQuestionChange(0);
    }
    if (onTotalChange) {
      onTotalChange(reshuffled.length);
    }
  };

  if (finished) {
    const totalAnswered = items.length;
    const successRate = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
    
    return (
      <div className="w-full">
        {/* Results card */}
        <div className="bg-white rounded-xl md:rounded-2xl border-2 border-[#E5E7EB] shadow-lg p-4 md:p-6 lg:p-8 mb-4 md:mb-6">
          <h3 className="text-xl md:text-2xl font-semibold text-[#1E293B] mb-4 md:mb-6 text-center">
            Результаты упражнения
          </h3>
          
          {/* Statistics */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
            {/* Correct answers */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 text-center">
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-green-600 mb-1 md:mb-2">{score}</div>
              <div className="text-xs md:text-sm lg:text-lg text-green-700 font-medium">Правильных</div>
            </div>
            
            {/* Mistakes */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 text-center">
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-red-600 mb-1 md:mb-2">{items.length - score}</div>
              <div className="text-xs md:text-sm lg:text-lg text-red-700 font-medium">Ошибок</div>
            </div>
          </div>
          
          {/* Success rate */}
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
          
          {/* Action buttons */}
          <div className="flex flex-col gap-2 md:gap-3">
            {/* Retry mistakes button */}
            {mistakes.length > 0 && (
              <button 
                onClick={restartMistakes}
                className="w-full bg-[#1471F6] hover:bg-[#0E5CD4] active:bg-[#0D52C0] text-white font-medium py-3 md:py-4 px-4 md:px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 text-sm md:text-base active:scale-95"
              >
                <RotateCcw className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="truncate">Повторить ошибки ({mistakes.length})</span>
              </button>
            )}
            
            {/* Finish button */}
            <button 
              onClick={() => {
                if (onComplete) {
                  onComplete();
                }
              }}
              className={`w-full font-medium py-3 md:py-4 px-4 md:px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 text-sm md:text-base active:scale-95 ${
                mistakes.length > 0 
                  ? 'bg-white border-2 border-[#1471F6] text-[#1471F6] hover:bg-[#F0F7FF] active:bg-[#E5F0FF]' 
                  : 'bg-[#1471F6] hover:bg-[#0E5CD4] active:bg-[#0D52C0] text-white'
              }`}
            >
              <Check className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <span>Завершить</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Play audio button */}
      <div className="flex justify-center mb-6 md:mb-8">
        <button
          onClick={handlePlay}
          className="w-16 h-16 md:w-20 md:h-20 bg-[#1471F6] hover:bg-[#0E5CD4] rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95"
          style={{
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1), 0px 10px 15px rgba(0, 0, 0, 0.1)'
          }}
        >
          {isPlaying ? (
            <Pause className="size-6 md:size-8 text-white" />
          ) : (
            <Volume2 className="size-6 md:size-8 text-white" />
          )}
        </button>
        <audio
          ref={audioRef}
          src={currentItem.audioUrl}
          onEnded={handleAudioEnd}
          style={{ display: 'none' }}
        />
      </div>

      {/* Input field */}
      <div className="mb-4 md:mb-6">
        <div className={`
          w-full bg-white rounded-xl md:rounded-2xl border-2 transition-all duration-200
          ${!checked 
            ? 'border-[#D1D5DB] focus-within:border-[#1471F6]' 
            : isCorrect
            ? 'border-green-500 bg-green-50'
            : 'border-red-500 bg-red-50'
          }
        `}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={checked}
            placeholder="Напишите фразу, которую вы услышали"
            className={`
              w-full px-4 py-3 md:px-5 md:py-4 text-base md:text-lg text-[#1E293B] bg-transparent border-none outline-none
              placeholder:text-[#9CA3AF]
              ${checked && !isCorrect ? 'line-through' : ''}
            `}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !checked && input.trim() !== '') {
                handleCheck();
              }
            }}
          />
        </div>

        {/* Show correct answer on mistake */}
        {checked && !isCorrect && correctAnswer && (
          <div className="mt-2 md:mt-3 px-3 py-2 md:px-4 bg-green-50 border border-green-200 rounded-lg md:rounded-xl">
            <p className="text-xs md:text-sm text-green-700 font-medium mb-1">Правильный ответ:</p>
            <p className="text-sm md:text-base text-green-800 break-words">{correctAnswer}</p>
          </div>
        )}
      </div>

      {/* Check or next question button */}
      {!checked ? (
        <button
          onClick={handleCheck}
          disabled={input.trim() === ""}
          className={`
            w-full px-4 py-3 md:px-6 md:py-3 rounded-xl font-medium transition-colors duration-200 text-base md:text-lg
            active:scale-95
            ${input.trim() === ""
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[#1471F6] hover:bg-[#0E5CD4] active:bg-[#0D52C0] text-white cursor-pointer'
            }
          `}
        >
          Проверить
        </button>
      ) : (
        <button
          onClick={handleNext}
          className="w-full px-4 py-3 md:px-6 md:py-3 bg-[#1471F6] text-white rounded-xl cursor-pointer hover:bg-[#0E5CD4] active:bg-[#0D52C0] transition-colors font-medium text-base md:text-lg mt-4 md:mt-6 active:scale-95"
        >
          {currentIndex + 1 === items.length
            ? "Показать результат"
            : "Следующий вопрос →"}
        </button>
      )}
    </div>
  );
}

export default ListeningWrite;
