import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import ListeningMultipleChoice from "../components/ListeningMultipleChoice";
import ListeningWrite from "../components/ListeningWrite";
import ListeningFillInText from "../components/ListeningFillInText";
import Navigation from "../components/Navigation";
import { useProgress } from "../hooks/useProgress";

function ListeningExercisePage() {
  const { lessonId, taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Answered question count
  const [roundTotalQuestions, setRoundTotalQuestions] = useState(0);
  
  // Hook for progress tracking
  const { markExerciseStarted, markExerciseCompleted } = useProgress(lessonId);

  // Reset progress on new task load
  useEffect(() => {
    const total =
      task?.questions?.length || task?.items?.length || task?.gaps?.length || 0;
    setRoundTotalQuestions(total);
    setCurrentQuestionIndex(0);
  }, [task]);

  useEffect(() => {
    async function load() {
      try {
        const ref = doc(db, "lessons", lessonId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setError("Урок не найден");
          return;
        }

        const data = snap.data();
        const found = data.listening?.tasks.find((t) => t.id === taskId);

        if (!found) {
          setError("Упражнение не найдено");
          return;
        }

        setTask(found);
      } catch (err) {
        setError("Ошибка загрузки");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [lessonId, taskId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <Navigation
          onNavigateHome={() => navigate("/")}
          onNavigateProfile={() => navigate("/profile")}
        />
        <div className="pt-32 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-600">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <Navigation
          onNavigateHome={() => navigate("/")}
          onNavigateProfile={() => navigate("/profile")}
        />
        <div className="pt-32 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Total questions for progress
  const totalQuestions = roundTotalQuestions;
 
  // Guard invalid progress values
  // Progress based on answered questions, not current index
  // Ensure 0 answered questions => 0% progress
  const progressPercentage = totalQuestions > 0 && currentQuestionIndex > 0
    ? Math.min(Math.max((currentQuestionIndex / totalQuestions) * 100, 0), 100)
    : 0;

  // Force 0% when currentQuestionIndex is 0
  const finalProgressPercentage = currentQuestionIndex === 0 ? 0 : progressPercentage;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Navigation
        onNavigateHome={() => navigate("/")}
        onNavigateProfile={() => navigate("/profile")}
      />
      <div className="pt-20 md:pt-32 pb-12 md:pb-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto relative">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute left-0 md:left-0 -top-10 md:-top-12 flex items-center gap-2 text-[#1E64F0] text-base md:text-lg font-normal hover:opacity-80 transition-opacity z-10 mb-6 md:mb-8"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 20 20" 
              fill="none"
              className="flex-shrink-0"
            >
              <path 
                d="M12 5L7 10L12 15" 
                stroke="currentColor" 
                strokeWidth="1.67" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M7 10L15 10" 
                stroke="currentColor" 
                strokeWidth="1.67" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <span>Назад</span>
          </button>

          {/* White content card */}
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-100 p-4 md:p-8 lg:p-12">
            {/* Title with icon */}
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
              {/* Listening icon in blue square */}
              <div className="w-[44px] h-[44px] md:w-[52px] md:h-[52px] bg-[#1471F6] rounded-[12px] md:rounded-[14px] flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 md:w-7 md:h-7" viewBox="0 0 28 28" fill="none">
                  <path 
                    d="M14 7L7 10.5V17.5L14 21L21 17.5V10.5L14 7Z" 
                    stroke="white" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M7 10.5L14 14L21 10.5" 
                    stroke="white" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M14 14V21" 
                    stroke="white" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              
              {/* "Listening" heading */}
              <h1 className="text-2xl md:text-[36px] font-normal text-[#1E293B] leading-tight md:leading-[40px]">
                Аудирование
              </h1>
            </div>

            {/* Progress counter and bar */}
            {totalQuestions > 0 && (
              <div className="mb-4 md:mb-6">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <span className="text-base md:text-lg font-normal text-[#4A5568] leading-[24px] md:leading-[28px]">
                    {currentQuestionIndex} / {totalQuestions}
                  </span>
                </div>
                {/* Progress bar — fills only when questions are answered */}
                <div className="w-full h-2 rounded-full overflow-hidden bg-gray-200">
                  {currentQuestionIndex > 0 && finalProgressPercentage > 0 ? (
                    <div 
                      className="h-full transition-all duration-500 rounded-full bg-[#030113]"
                      style={{ 
                        width: `${finalProgressPercentage}%`,
                        maxWidth: '100%'
                      }}
                    />
                  ) : (
                    <div className="h-full w-0" />
                  )}
                </div>
              </div>
            )}

            {/* Instruction text */}
            <p className="text-base md:text-xl font-normal text-[#1E293B] leading-[24px] md:leading-[28px] mb-6 md:mb-8">
              {task.type === "write-group" 
                ? "Прослушайте фразу и напишите, что вы услышали"
                : "Прослушайте фразу и выберите правильный ответ"
              }
            </p>

            {/* Exercise components */}
            {task.type === "multiple-choice" && (
              <ListeningMultipleChoice
                task={task}
                currentQuestionIndex={currentQuestionIndex}
                onQuestionChange={setCurrentQuestionIndex}
                onTotalChange={setRoundTotalQuestions}
                onComplete={() => navigate(-1)}
                onMarkStarted={() => markExerciseStarted("listening", taskId)}
                onMarkCompleted={(allCorrect) => {
                  if (allCorrect) {
                    markExerciseCompleted("listening", taskId);
                  }
                }}
              />
            )}

            {task.type === "write-group" && (
              <ListeningWrite 
                task={task}
                currentQuestionIndex={currentQuestionIndex}
                onQuestionChange={setCurrentQuestionIndex}
                onTotalChange={setRoundTotalQuestions}
                onComplete={() => navigate(-1)}
                onMarkStarted={() => markExerciseStarted("listening", taskId)}
                onMarkCompleted={(allCorrect) => {
                  if (allCorrect) {
                    markExerciseCompleted("listening", taskId);
                  }
                }}
              />
            )}

            {task.type === "fill-in-the-text" && (
              <ListeningFillInText 
                task={task}
                currentQuestionIndex={currentQuestionIndex}
                onQuestionChange={setCurrentQuestionIndex}
                onMarkStarted={() => markExerciseStarted("listening", taskId)}
                onMarkCompleted={() =>
                  markExerciseCompleted("listening", taskId)
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListeningExercisePage;
