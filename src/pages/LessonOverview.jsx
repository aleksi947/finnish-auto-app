// src/pages/LessonOverview.jsx
import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Book,
  FileText,
  Headphones,
  MessageCircle,
  BookOpen,
  PenTool,
} from "lucide-react";
import Navigation from "../components/Navigation";
import { db, auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useProgress } from "../hooks/useProgress";

// Простой бэйдж без отдельного файла
function Badge({ className = "", children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

const lang = "ru";

export default function LessonOverview() {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Hook для работы с прогрессом
  const { getSectionStatus } = useProgress(lessonId);

  // Загрузка урока + проверка подписки (логика как в старой версии)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setError("Вы не авторизованы");
          setLoading(false);
          return;
        }

        const subRef = doc(db, "subscriptions", user.uid);
        const subSnap = await getDoc(subRef);
        const hasAccess = subSnap.exists() && subSnap.data().active;

        const lessonRef = doc(db, "lessons", lessonId);
        const lessonSnap = await getDoc(lessonRef);
        if (!lessonSnap.exists()) {
          setError("Урок не найден");
          setLoading(false);
          return;
        }

        const data = lessonSnap.data();
        if (data.premium && !hasAccess) {
          setError("Этот урок доступен только по подписке");
          setLoading(false);
          return;
        }

        setLesson(data);
      } catch (err) {
        console.error("Ошибка загрузки урока:", err);
        setError("Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [lessonId]);

  // Карточки разделов как в макете
  const sections = useMemo(
    () => [
      {
        id: "vocabulary",
        title: "Слова",
        icon: <Book className="size-8 text-blue-600" />,
      },
      {
        id: "grammar",
        title: "Грамматика",
        icon: <FileText className="size-8 text-blue-600" />,
      },
      {
        id: "listening",
        title: "Аудирование",
        icon: <Headphones className="size-8 text-blue-600" />,
      },
      {
        id: "speaking",
        title: "Говорение",
        icon: <MessageCircle className="size-8 text-blue-600" />,
      },
      {
        id: "writing",
        title: "Письмо",
        icon: <PenTool className="size-8 text-blue-600" />,
      },
      {
        id: "reading",
        title: "Чтение",
        icon: <BookOpen className="size-8 text-blue-600" />,
      },
    ],
    []
  );

  const getStatusBadge = (status) => {
    if (status === "not-started") {
      return (
        <Badge className="bg-red-50 text-red-700 border border-red-200">
          Не начато
        </Badge>
      );
    }
    if (status === "in-progress") {
      return (
        <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200">
          В процессе
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-50 text-green-700 border border-green-200">
        Выполнено
      </Badge>
    );
  };

  // Состояния загрузки/ошибки с аккуратным оформлением
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="pt-32 px-6">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow">
            Загрузка...
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="pt-32 px-6">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow text-red-600">
            {error}
          </div>
        </div>
      </div>
    );
  }
  if (!lesson) return null;

  const lessonTitle = lesson.topic?.[lang] || `Урок ${lessonId}`;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Fixed Navigation (как в макете) */}
      <Navigation />

      {/* Main Content */}
      <div className="px-6 pb-20 pt-32">
        <div className="mx-auto max-w-4xl">
          {/* Back Button */}
          <button
            onClick={() => navigate("/lessons")}
            className="group mb-8 flex items-center gap-2 text-blue-600 transition-colors hover:text-blue-700"
          >
            <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-1" />
            <span className="text-lg">Назад к урокам</span>
          </button>

          {/* Lesson Title */}
          <h1 className="mb-12 text-3xl font-semibold text-gray-800">
            {lessonTitle}
          </h1>

          {/* Section Cards */}
          <div className="space-y-4">
            {sections.map((section) => {
              const sectionStatus = getSectionStatus(section.id);
              return (
                <Link
                  key={section.id}
                  to={`/lesson/${lessonId}/${section.id}`}
                  className="group block rounded-2xl bg-white p-6 shadow-md transition-all duration-300 hover:bg-blue-50/30 hover:shadow-xl overflow-hidden"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    {/* Левый блок: иконка + заголовок */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex-shrink-0">{section.icon}</div>
                      <div className="text-2xl text-gray-800 transition-colors group-hover:text-blue-700 truncate">
                        {section.title}
                      </div>
                    </div>

                    {/* Правый блок: бейдж статуса */}
                    <div className="sm:flex-shrink-0">
                      {getStatusBadge(sectionStatus)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Дополнительная информация об уроке (если есть в БД) */}
          {lesson.info?.overview?.[lang] && (
            <div className="mt-8 rounded-2xl bg-white p-6 shadow">
              <h3 className="mb-2 text-lg font-semibold">
                ℹ️ Как проходить урок
              </h3>
              <p className="text-gray-700">{lesson.info.overview[lang]}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
