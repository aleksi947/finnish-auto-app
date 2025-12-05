import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import VocabularyBlock from "../components/VocabularyBlock";
import AlphabetBlock from "../components/AlphabetBlock";
import VocabularyQuiz from "../components/VocabularyQuiz";
import VocabularyWrite from "../components/VocabularyWrite";
import Navigation from "../components/Navigation";
import { useProgress } from "../hooks/useProgress";
import { Badge } from "../components/ui/badge";
import { Circle } from "lucide-react";

const lang = "ru";

function VocabularyBlockPage() {
  const { lessonId, blockId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(""); // quiz | write | ""
  const [lessonBlock, setLessonBlock] = useState([]);
  
  // Hook для работы с прогрессом
  const { markExerciseStarted, markExerciseCompleted, getExerciseStatus } = useProgress(lessonId);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("Вы не авторизованы");
        setLoading(false);
        return;
      }

      try {
        const lessonRef = doc(db, "lessons", lessonId);
        const lessonSnap = await getDoc(lessonRef);
        if (!lessonSnap.exists()) {
          setError("Урок не найден");
          setLoading(false);
          return;
        }

        setLesson(lessonSnap.data());
      } catch (err) {
        setError("Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [lessonId]);

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

  if (!lesson || !lesson.vocabulary?.[blockId]) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <Navigation
          onNavigateHome={() => navigate("/")}
          onNavigateProfile={() => navigate("/profile")}
        />
        <div className="pt-32 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-600">Блок не найден</p>
          </div>
        </div>
      </div>
    );
  }

  const block = lesson.vocabulary[blockId];
  const words = block.words;

  const getStatusBadge = (status) => {
    // Для упражнений Vocabulary показываем только два статуса: "выполнено" или "не выполнено"
    if (status === "completed") {
      return (
        <Circle className="size-5 fill-green-500 text-green-500" />
      );
    }
    // "not-started" и "in-progress" показываем как "не выполнено"
    return (
      <Circle className="size-5 fill-red-500 text-red-500" />
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Navigation
        onNavigateHome={() => navigate("/")}
        onNavigateProfile={() => navigate("/profile")}
      />
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto relative">
          {/* Кнопка "Назад" */}
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

          {/* Белая карточка с контентом */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12">
            {/* Заголовок с иконкой */}
            <div className="flex items-center gap-4 mb-6">
              {/* Иконка словаря в синем квадрате */}
              <div className="w-[72px] h-[72px] bg-[#1471F6] rounded-[14px] flex items-center justify-center flex-shrink-0">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path 
                    d="M20 10L10 15V25L20 30L30 25V15L20 10Z" 
                    stroke="white" 
                    strokeWidth="3.33" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M10 15L20 20L30 15" 
                    stroke="white" 
                    strokeWidth="3.33" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M20 20V30" 
                    stroke="white" 
                    strokeWidth="3.33" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              
              {/* Заголовок "Слова" */}
              <div className="flex-1">
                <h1 className="text-base font-normal text-[#1E293B] leading-6 mb-1">
                  Слова
                </h1>
                <h2 className="text-xl font-normal text-[#4A5568] leading-7">
                  {block.title}
                </h2>
              </div>
            </div>

            {mode === "" && (
              <>
                {block.title.includes("Aakkoset") ? (
                  <AlphabetBlock words={words} />
                ) : (
                  <>
                    <VocabularyBlock words={words} lang={lang} />
                    {/* Кнопки упражнений */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                      <button
                        onClick={() => {
                          setLessonBlock(words);
                          setMode("quiz");
                        }}
                        className="flex-1 bg-[#1471F6] hover:bg-[#0E5CD4] text-white font-medium py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <span>🚀</span>
                          <span>Упражнение: выбрать перевод</span>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(getExerciseStatus("vocabulary", `quiz-${blockId}`, blockId))}
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setLessonBlock(words);
                          setMode("write");
                        }}
                        className="flex-1 bg-[#1471F6] hover:bg-[#0E5CD4] text-white font-medium py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <span>✍️</span>
                          <span>Упражнение: написать по-фински</span>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(getExerciseStatus("vocabulary", `write-${blockId}`, blockId))}
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {mode === "quiz" && (
              <VocabularyQuiz
                words={lessonBlock}
                lang={lang}
                onFinish={() => {
                  setMode("");
                  setLessonBlock([]);
                }}
                onMarkStarted={() => markExerciseStarted("vocabulary", `quiz-${blockId}`, blockId)}
                onMarkCompleted={(allCorrect) => {
                  if (allCorrect) {
                    markExerciseCompleted("vocabulary", `quiz-${blockId}`, blockId);
                  }
                }}
              />
            )}

            {mode === "write" && (
              <VocabularyWrite
                words={lessonBlock}
                lang={lang}
                onFinish={() => {
                  setMode("");
                  setLessonBlock([]);
                }}
                onMarkStarted={() => markExerciseStarted("vocabulary", `write-${blockId}`, blockId)}
                onMarkCompleted={(allCorrect) => {
                  if (allCorrect) {
                    markExerciseCompleted("vocabulary", `write-${blockId}`, blockId);
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VocabularyBlockPage;
