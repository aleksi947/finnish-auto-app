import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Navigation from "../components/Navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { useProgress } from "../hooks/useProgress";

const lang = "ru";

export default function VocabularyPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Hook для работы с прогрессом
  const { getVocabularyTopicStatus } = useProgress(lessonId);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("Вы не авторизованы");
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "lessons", lessonId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError("Урок не найден");
          setLoading(false);
          return;
        }

        setLesson(snap.data());
      } catch (err) {
        console.error(err);
        setError("Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [lessonId]);

  if (loading) return <p className="p-6">Загрузка...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!lesson) return null;

  // Сортировка — алфавит первым
  const orderedBlocks = Object.entries(lesson.vocabulary || {}).sort(
    ([a], [b]) => {
      if (lesson.vocabulary[a].title === "Aakkoset – Финский алфавит") return -1;
      if (lesson.vocabulary[b].title === "Aakkoset – Финский алфавит") return 1;
      return 0;
    }
  );

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
          <Badge className="bg-red-50 text-red-700 border-red-200 border">
            Не начато
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Навигация */}
      <Navigation
        onNavigateHome={() => navigate("/")}
        onNavigateProfile={() => navigate("/profile")}
      />

      {/* Основной контент */}
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Назад */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:bg-blue-600 hover:text-white transition-all px-6 py-3 rounded-xl mb-8 group bg-blue-50"
          >
            <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-lg">Назад</span>
          </button>

          {/* Заголовок */}
          <h1 className="text-gray-800 mb-8 text-3xl font-semibold">Слова</h1>

          {/* Список блоков */}
          <div className="space-y-4">
            {orderedBlocks.map(([blockId, block]) => (
              <div
                key={blockId}
                onClick={() =>
                  navigate(`/lesson/${lessonId}/vocabulary/${blockId}`)
                }
                className="bg-white rounded-2xl p-6 border-2 border-blue-400 hover:border-blue-500 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-6">
                  {/* Заголовок блока */}
                  <div className="flex-1 text-xl text-gray-800 group-hover:text-blue-700 transition-colors">
                    {block.title}
                  </div>

                  {/* Статус */}
                  <div className="flex-shrink-0">
                    {getStatusBadge(getVocabularyTopicStatus(blockId))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
