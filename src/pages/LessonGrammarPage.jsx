import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import Navigation from "../components/Navigation";
import { ArrowLeft, Book } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { useProgress } from "../hooks/useProgress";

const lang = "ru";

function LessonGrammarPage() {
  const { lessonId } = useParams();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  // Hook для работы с прогрессом
  const { getGrammarSectionStatus } = useProgress(lessonId);

  useEffect(() => {
    async function fetchGrammarSections() {
      try {
        const ref = doc(db, "lessons", lessonId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError("Урок не найден");
          return;
        }

        const lesson = snap.data();
        if (!lesson.grammar?.sections) {
          setError("Нет грамматических разделов");
          return;
        }

        setSections(lesson.grammar.sections);
      } catch (err) {
        console.error(err);
        setError("Ошибка загрузки грамматики");
      } finally {
        setLoading(false);
      }
    }

    fetchGrammarSections();
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

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Навигация */}
      <Navigation
        onNavigateHome={() => navigate("/")}
        onNavigateProfile={() => navigate("/profile")}
      />

      <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        {/* Кнопка назад */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:bg-blue-600 hover:text-white transition-all px-6 py-3 rounded-xl mb-8 group bg-blue-50"
        >
          <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-lg">Назад</span>
        </button>

        {/* Заголовок */}
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-blue-500 p-4 rounded-xl">
            <Book className="size-10 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-gray-800">Грамматика</h1>
        </div>

        {/* Список разделов */}
        <div className="space-y-4">
          {sections.map((s) => {
            const sectionStatus = getGrammarSectionStatus(s.id);
            return (
              <div
                key={s.id}
                onClick={() => navigate(`/lesson/${lessonId}/grammar/${s.id}`)}
                className="bg-white rounded-2xl p-6 border-2 border-blue-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-6">
                  {/* Название раздела */}
                  <div className="flex-1 text-xl text-gray-800 group-hover:text-blue-700 transition-colors">
                    {s.title?.[lang] || "Без названия"}
                  </div>

                  {/* Статус */}
                  <div className="flex-shrink-0">
                    {getStatusBadge(sectionStatus)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default LessonGrammarPage;
