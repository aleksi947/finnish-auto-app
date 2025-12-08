import { useEffect, useState, useRef } from "react";
import { Volume2, Pause } from "lucide-react";

// Перемешивание массива
function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function ListeningMultipleChoice({
  task,
  currentQuestionIndex,
  onQuestionChange,
  onComplete,
  onTotalChange,
  onMarkStarted,
  onMarkCompleted,
}) {
  const [questions, setQuestions] = useState([]);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [mistakes, setMistakes] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0); // Количество отвеченных вопросов
  const [answers, setAnswers] = useState([]); // Массив для отслеживания правильности ответов
  const [hasMarkedStarted, setHasMarkedStarted] = useState(false); // Флаг для отслеживания первого ответа
  const audioRef = useRef(null);

  useEffect(() => {
    if (!task?.questions) return;
    const shuffled = shuffle(task.questions);
    setQuestions(shuffled);
    setStep(0);
    setSelected(null);
    setChecked(false);
    setScore(0);
    setFinished(false);
    setMistakes([]);
    setAnsweredCount(0);
    setAnswers([]);
    setHasMarkedStarted(false);
    // Устанавливаем начальный прогресс на 0 (ничего не отвечено)
    if (onQuestionChange) {
      onQuestionChange(0);
    }
    if (onTotalChange) {
      onTotalChange(shuffled.length);
    }
  }, [task]); // Убрали onQuestionChange из зависимостей, чтобы избежать лишних вызовов

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

  const question = questions[step];

  if (!question) {
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

  const handleAnswer = (index) => {
    if (checked) return;
    setSelected(index);
    setChecked(true);
    
    const isCorrect = index === question.answer;
    
    // Отмечаем упражнение как начатое при первом ответе
    if (!hasMarkedStarted && onMarkStarted) {
      onMarkStarted();
      setHasMarkedStarted(true);
    }
    
    // Сохраняем результат ответа
    const newAnswers = [...answers, { questionIndex: step, isCorrect }];
    setAnswers(newAnswers);
    
    // Увеличиваем количество отвеченных вопросов и обновляем прогресс
    const newAnsweredCount = answeredCount + 1;
    setAnsweredCount(newAnsweredCount);
    
    // Обновляем прогресс только после ответа
    if (onQuestionChange && questions.length > 0) {
      onQuestionChange(newAnsweredCount);
    }
    
    if (isCorrect) {
      setScore((prev) => prev + 1);
    } else {
      setMistakes((prev) => [...prev, question]);
    }
  };

  const handleNext = () => {
    if (step + 1 < questions.length) {
      setStep((prev) => prev + 1);
      setSelected(null);
      setChecked(false);
      setIsPlaying(false);
      // Прогресс не меняется при переходе к следующему вопросу, остается на уровне отвеченных
    } else {
      setFinished(true);
    }
  };

  const restartMistakes = () => {
    if (mistakes.length === 0) return;
    const reshuffled = shuffle(mistakes);
    setQuestions(reshuffled);
    setStep(0);
    setSelected(null);
    setChecked(false);
    setScore(0);
    setFinished(false);
    setMistakes([]);
    setIsPlaying(false);
    setAnsweredCount(0);
    setAnswers([]);
    setHasMarkedStarted(false);
    // Сбрасываем прогресс на 0 при повторении ошибок
    if (onQuestionChange) {
      onQuestionChange(0);
    }
    if (onTotalChange) {
      onTotalChange(reshuffled.length);
    }
  };

  if (finished) {
    const totalAnswered = questions.length;
    const successRate = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
    
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
              <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">{score}</div>
              <div className="text-sm md:text-lg text-green-700 font-medium">Правильных</div>
            </div>
            
            {/* Ошибки */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 md:p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-red-600 mb-2">{questions.length - score}</div>
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
            <button 
              onClick={() => {
                if (onComplete) {
                  onComplete();
                }
              }}
              className={`w-full font-medium py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 ${
                mistakes.length > 0 
                  ? 'bg-white border-2 border-[#1471F6] text-[#1471F6] hover:bg-[#F0F7FF]' 
                  : 'bg-[#1471F6] hover:bg-[#0E5CD4] text-white'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path 
                  d="M16.7071 5.29289C17.0976 5.68342 17.0976 6.31658 16.7071 6.70711L8.70711 14.7071C8.31658 15.0976 7.68342 15.0976 7.29289 14.7071L3.29289 10.7071C2.90237 10.3166 2.90237 9.68342 3.29289 9.29289C3.68342 8.90237 4.31658 8.90237 4.70711 9.29289L8 12.5858L15.2929 5.29289C15.6834 4.90237 16.3166 4.90237 16.7071 5.29289Z" 
                  fill="currentColor"
                />
              </svg>
              <span>Завершить</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Кнопка воспроизведения аудио */}
      <div className="flex justify-center mb-8">
        <button
          onClick={handlePlay}
          className="w-20 h-20 bg-[#1471F6] hover:bg-[#0E5CD4] rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:shadow-xl"
          style={{
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1), 0px 10px 15px rgba(0, 0, 0, 0.1)'
          }}
        >
          {isPlaying ? (
            <Pause className="size-8 text-white" />
          ) : (
            <Volume2 className="size-8 text-white" />
          )}
        </button>
        <audio
          ref={audioRef}
          src={question.audioUrl}
          onEnded={handleAudioEnd}
          style={{ display: 'none' }}
        />
      </div>

      {/* Варианты ответов */}
      <div className="flex flex-col gap-3 mb-6">
        {question.options.map((opt, i) => {
          const isCorrect = i === question.answer;
          const isWrong = i === selected && selected !== question.answer;
          const isSelected = selected === i;

          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={checked}
              className={`
                w-full min-h-[72px] bg-white rounded-2xl border-2 flex items-center gap-4 px-5 py-2
                transition-all duration-200
                ${!checked 
                  ? 'border-[#D1D5DB] hover:border-[#9CA3AF] cursor-pointer' 
                  : isCorrect
                  ? 'border-green-500 bg-green-50'
                  : isWrong
                  ? 'border-red-500 bg-red-50'
                  : 'border-[#D1D5DB] opacity-60'
                }
                ${checked && !isSelected && !isCorrect ? 'cursor-not-allowed' : ''}
              `}
            >
              {/* Радио-кнопка */}
              <div className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                ${!checked 
                  ? 'border-[#9CA3AF]' 
                  : isCorrect
                  ? 'border-green-500 bg-green-500'
                  : isWrong
                  ? 'border-red-500'
                  : 'border-[#9CA3AF]'
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
                ${isCorrect && checked ? 'font-semibold' : ''}
              `}>
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Кнопка "Следующий вопрос" */}
      {checked && (
        <button
          onClick={handleNext}
          className="mt-6 px-6 py-3 bg-[#1471F6] text-white rounded-xl cursor-pointer hover:bg-[#0E5CD4] transition-colors font-medium w-full"
        >
          {step + 1 === questions.length
            ? "Показать результат"
            : "Следующий вопрос →"}
        </button>
      )}
    </div>
  );
}

export default ListeningMultipleChoice;
