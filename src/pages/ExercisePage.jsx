import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import ExerciseRenderer from "../components/ExerciseRenderer";
import Navigation from "../components/Navigation";
import { useProgress } from "../hooks/useProgress";

function ExercisePage() {
  const { lessonId, sectionId, exerciseId } = useParams();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [section, setSection] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0); // Динамическое количество вопросов
  
  // Hook для работы с прогрессом
  const { markExerciseStarted, markExerciseCompleted } = useProgress(lessonId);

  useEffect(() => {
    async function loadExercise() {
      try {
        const ref = doc(db, "lessons", lessonId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError("Урок не найден");
          return;
        }

        const lesson = snap.data();
        const foundSection = lesson.grammar?.sections.find(
          (s) => s.id === sectionId
        );
        if (!foundSection) {
          setError("Раздел не найден");
          return;
        }

        const found = foundSection.exercises?.find((e) => e.id === exerciseId);
        if (!found) {
          setError("Упражнение не найдено");
          return;
        }

        setSection(foundSection);
        setExercise(found);
        // Устанавливаем начальное количество вопросов
        if (found?.questions?.length) {
          setTotalQuestions(found.questions.length);
        } else if (found?.items?.length) {
          setTotalQuestions(found.items.length);
        }
      } catch (err) {
        console.error(err);
        setError("Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    }

    loadExercise();
  }, [lessonId, sectionId, exerciseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <Navigation
          onNavigateHome={() => navigate("/")}
          onNavigateProfile={() => navigate("/profile")}
        />
        <div className="px-6 pt-32">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow">
            Загрузка...
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
        <div className="px-6 pt-32">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 text-red-600 shadow">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Navigation
        onNavigateHome={() => navigate("/")}
        onNavigateProfile={() => navigate("/profile")}
      />
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto relative">
          {/* Кнопка "Назад" - всегда видна */}
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 md:left-0 -top-12 flex items-center gap-2 text-[#1E64F0] text-lg font-normal hover:opacity-80 transition-opacity z-10 mb-8"
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
          
          {/* Белая карточка с тенью */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12">
            {/* Заголовок "Грамматика" */}
            <div className="mb-8">
              <div className="mb-6">
                <h1 className="text-[36px] font-semibold bg-gradient-to-r from-[#1471F6] to-[#1E64F0] bg-clip-text text-transparent leading-[40px]">
                  Грамматика
                </h1>
              </div>
            </div>

            {/* Заголовок упражнения */}
            {section?.title && (
              <h2 className="text-2xl font-semibold text-[#1E293B] leading-[32px] mb-6">
                {typeof section.title === 'string' ? section.title : section.title.ru}
              </h2>
            )}

            {/* Инструкция - показываем только для multiple-choice-group, для fill-in-the-blank инструкция уже есть внутри компонента */}
            {exercise?.instruction && exercise?.type === 'multiple-choice-group' && (
              <div className="bg-gradient-to-r from-[#EFF6FF] to-[#F8FAFC] border-l-4 border-[#1471F6] rounded-r-xl p-6 md:p-7 mb-8 shadow-sm">
                <div>
                  <h3 className="text-lg font-semibold text-[#1471F6] mb-2">Инструкция</h3>
                  <p className="text-base md:text-lg text-[#1E293B] leading-relaxed whitespace-pre-line">
                    {typeof exercise.instruction === 'string' 
                      ? exercise.instruction.replace(/✍️\s*|👥\s*/, '').trim() 
                      : (exercise.instruction.ru || '').replace(/✍️\s*|👥\s*/, '').trim()}
                  </p>
                </div>
              </div>
            )}
          
            <ExerciseRenderer
              exercise={exercise}
              section={section}
              currentQuestionIndex={currentQuestionIndex}
              onQuestionChange={setCurrentQuestionIndex}
              onTotalQuestionsChange={setTotalQuestions}
              onComplete={() => navigate(`/lesson/${lessonId}/grammar/${sectionId}`)}
              onMarkStarted={() => markExerciseStarted("grammar", exerciseId, sectionId)}
              onMarkCompleted={(allCorrect) => {
                if (allCorrect) {
                  markExerciseCompleted("grammar", exerciseId, sectionId);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExercisePage;
