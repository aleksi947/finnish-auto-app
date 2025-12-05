// src/pages/LessonSpeakingPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import Navigation from "../components/Navigation";
import { ArrowLeft, UserCircle, Mic } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { useProgress } from "../hooks/useProgress";

const lang = "ru";

export default function LessonSpeakingPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
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
      } catch (e) {
        console.error(e);
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
        return (
          <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border-red-200 border">
            Не начато
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <Navigation />
        <div className="px-6 pt-32">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow">
            Загрузка…
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <Navigation />
        <div className="px-6 pt-32">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 text-red-600 shadow">
            {error}
          </div>
        </div>
      </div>
    );
  }
  const exercises = lesson?.speaking || [];
  if (!exercises.length) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <Navigation />
        <div className="px-6 pt-32">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow">
            Нет заданий
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Fixed Navigation */}
      <Navigation
        onNavigateHome={() => navigate("/")}
        onNavigateProfile={() => navigate("/profile")}
      />

      {/* Main Content */}
      <div className="px-6 pb-20 pt-32">
        <div className="mx-auto max-w-4xl">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="group mb-8 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-6 py-3 text-blue-600 transition-all hover:bg-blue-600 hover:text-white"
          >
            <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-1" />
            <span className="text-lg">Назад</span>
          </button>

          {/* Page Title with Icon */}
          <div className="mb-6 flex items-center gap-4">
            <UserCircle className="size-16 text-gray-800" strokeWidth={1.5} />
            <h1 className="text-3xl font-semibold text-gray-800">Говорение</h1>
          </div>

          {/* Instruction */}
          <p className="mb-8 text-lg text-gray-700">
            Выберите упражнение и произнесите ответ на финском языке.
          </p>

          {/* Exercise Cards */}
          <div className="space-y-4">
            {exercises.map((exercise, index) => {
              const exerciseStatus = getExerciseStatus("speaking", exercise.id);
              return (
                <Link
                  key={exercise.id}
                  to={`/lesson/${lessonId}/speaking/exercise/${exercise.id}`}
                  className="group block rounded-2xl border-2 border-blue-400 bg-white p-6 shadow-sm transition-all duration-300 hover:border-blue-500 hover:bg-blue-50/30 hover:shadow-md overflow-hidden"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    {/* Left: icon + title */}
                    <div className="min-w-0 flex items-center gap-4">
                      <div className="flex-shrink-0 rounded-full bg-blue-500 p-3 transition-transform duration-300 group-hover:scale-105">
                        <Mic className="size-6 text-white" />
                      </div>
                      <div className="truncate text-xl text-gray-800 transition-colors group-hover:text-blue-700">
                        {`Упражнение ${index + 1}`}
                      </div>
                    </div>

                    {/* Right: status */}
                    <div className="sm:flex-shrink-0">
                      {getStatusBadge(exerciseStatus)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          
        </div>
      </div>
    </div>
  );
}
