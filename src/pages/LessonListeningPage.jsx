import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import Navigation from "../components/Navigation";
import { ArrowLeft, Headphones, Square } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { useProgress } from "../hooks/useProgress";

const lang = "ru";

export default function LessonListeningPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Hook для работы с прогрессом
  const { getExerciseStatus } = useProgress(lessonId);

  useEffect(() => {
    async function fetchLesson() {
      try {
        const ref = doc(db, "lessons", lessonId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError("Урок не найден");
          return;
        }
        setLesson(snap.data());
      } catch (err) {
        console.error(err);
        setError("Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [lessonId]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "not-started":
        return (
          <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border-red-200 border">
            Не начато
          </Badge>
        );
      case "in-progress":
        return (
          <Badge className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200 border">
            В процессе
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200 border">
            Выполнено
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!lesson) return null;

  const exercises = lesson.listening?.tasks || [];

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Fixed Navigation */}
      <Navigation
        onNavigateHome={() => navigate("/")}
        onNavigateProfile={() => navigate("/profile")}
      />

      {/* Main Content */}
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors mb-8 group"
          >
            <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-lg">Назад</span>
          </button>

          {/* Topic Title */}
          <h1 className="text-gray-800 mb-6">
            {lesson.topic?.[lang] || "Аудирование"}
          </h1>

          {/* Section Title with Icon */}
          <div className="flex items-center gap-3 mb-4">
            <Headphones className="size-8 text-gray-800" />
            <h2 className="text-gray-800">Аудирование</h2>
          </div>

          {/* Instruction Text */}
          <p className="text-gray-700 text-lg mb-8">
            Выберите упражнение и выполните его после прослушивания аудио.
          </p>

          {/* Exercise Cards */}
          <div className="space-y-4">
            {exercises.map((exercise, index) => {
              const exerciseStatus = getExerciseStatus("listening", exercise.id);
              return (
                <div
                  key={exercise.id}
                  onClick={() =>
                    navigate(
                      `/lesson/${lessonId}/listening/exercise/${exercise.id}`
                    )
                  }
                  className="bg-white rounded-2xl p-6 border-2 border-blue-400 hover:border-blue-500 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    {/* Left: Icon + Title */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="bg-blue-500 rounded-lg p-3 flex-shrink-0">
                        <Square className="size-6 text-white fill-white" />
                      </div>
                      <div className="text-xl text-gray-800 group-hover:text-blue-700 transition-colors truncate">
                        {`Упражнение ${index + 1}`}
                      </div>
                    </div>

                    {/* Right: Status Badge */}
                    <div className="sm:flex-shrink-0">
                      {getStatusBadge(exerciseStatus)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
