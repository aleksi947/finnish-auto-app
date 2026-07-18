import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import Navigation from "../components/Navigation";
import ReadingContent from "../components/ReadingContent";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useProgress } from "../hooks/useProgress";

function LessonReadingPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [reading, setReading] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { getExerciseStatus } = useProgress(lessonId);

  const statusText = (status) => {
    if (status === "completed") return "Выполнено";
    if (status === "in-progress") return "В процессе";
    return "Не начато";
  };

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
        if (!data.reading) {
          setError("Раздел 'Чтение' не найден");
          return;
        }

        // Ensure array
        setReading(Array.isArray(data.reading) ? data.reading : [data.reading]);
      } catch (err) {
        console.error(err);
        setError("Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [lessonId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EAF5FF] to-[#CDE8FF]">
        <Navigation
          onNavigateHome={() => navigate("/")}
          onNavigateProfile={() => navigate("/profile")}
        />
        <div className="pt-24 pb-12 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-5xl mb-4">📚</div>
              <div className="text-lg text-gray-700">Загрузка...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EAF5FF] to-[#CDE8FF]">
        <Navigation
          onNavigateHome={() => navigate("/")}
          onNavigateProfile={() => navigate("/profile")}
        />
        <div className="pt-24 pb-12 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-5xl mb-4">❌</div>
              <div className="text-lg text-red-600">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EAF5FF] to-[#CDE8FF]">
      {/* Navigation */}
      <Navigation
        onNavigateHome={() => navigate("/")}
        onNavigateProfile={() => navigate("/profile")}
      />

      {/* Main Content */}
      <div className="pt-20 md:pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-xl border-2 border-[#1E64F0] text-[#1E64F0] hover:bg-[#1E64F0] hover:text-white transition-all mb-6 px-4 py-2 md:px-6 md:py-3 text-base md:text-lg group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
            <span>Назад</span>
          </button>

          {/* Page Title */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl inline-flex items-center gap-3 justify-center font-normal text-gray-800">
              Чтение 📖
            </h1>
          </div>

          {reading.map((block) => (
            <div key={block.id}>
              {/* Reading Text Container */}
              <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg border-2 border-[#3C84F8] p-6 sm:p-8 md:p-10 mt-6 md:mt-8 mb-10 md:mb-12">
                <h2 className="text-2xl md:text-3xl mb-5 md:mb-6 text-gray-900 font-semibold">
                  {block.title}
                </h2>
                
                <div className="space-y-5">
                  {block.explanation?.description && (
                    <p className="text-lg md:text-xl text-gray-600 mb-6 leading-7 font-medium">
                      {block.explanation.description}
                    </p>
                  )}
                  
                  <div className="mt-6">
                    <ReadingContent
                      title={block.title}
                      text={block.explanation?.text || ""}
                    />
                  </div>
                </div>
              </div>

              {/* Exercise Cards */}
              {block.tasks?.length > 0 && (
                <div className="space-y-4">
                  {block.tasks.map((task, i) => (
                    <Link
                      key={task.id}
                      to={`/lesson/${lessonId}/reading/exercise/${task.id}`}
                      className="bg-white rounded-2xl md:rounded-3xl shadow-lg border-2 border-[#3C84F8] p-6 sm:p-8 hover:border-blue-400 transition-colors cursor-pointer block"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-[#1471F6] flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-6 h-6 md:w-7 md:h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl md:text-2xl text-gray-800 font-normal">
                            Упражнение {i + 1}
                          </h3>
                          {task.instruction?.ru && (
                            <p className="text-base md:text-lg text-gray-600 mt-1">
                              {task.instruction.ru}
                            </p>
                          )}
                        </div>
                        <span className="flex-shrink-0 text-sm text-slate-500">
                          {statusText(
                            getExerciseStatus("reading", task.id),
                          )}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LessonReadingPage;
