import { useEffect, useState } from "react";
import { useParams, Navigate, Outlet } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useSubscription } from "../hooks/useSubscription";
import Navigation from "../components/Navigation";

export default function LessonGuard() {
  const { lessonId } = useParams();
  const { hasSubscription, loading: subLoading } = useSubscription();
  const [isAllowed, setIsAllowed] = useState(null); // null = loading, true = allowed, false = denied
  const [error, setError] = useState("");

  useEffect(() => {
    if (subLoading) return;

    async function checkAccess() {
      try {
        // 1. Получаем данные урока, чтобы узнать, премиум он или нет
        const ref = doc(db, "lessons", lessonId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setError("Урок не найден");
          setIsAllowed(false);
          return;
        }

        const lesson = snap.data();

        // 2. Если урок премиум и нет подписки -> запретить
        if (lesson.premium && !hasSubscription) {
          setError("Этот урок доступен только по подписке");
          setIsAllowed(false);
        } else {
          setIsAllowed(true);
        }
      } catch (e) {
        console.error(e);
        setError("Ошибка проверки доступа");
        setIsAllowed(false); // На всякий случай блокируем при ошибке
      }
    }

    checkAccess();
  }, [lessonId, hasSubscription, subLoading]);

  if (subLoading || isAllowed === null) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <Navigation />
        <div className="pt-32 px-6 text-center text-gray-500">
          Проверка доступа...
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <Navigation />
        <div className="pt-32 px-6 max-w-4xl mx-auto text-center">
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-100">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Доступ ограничен</h2>
            <p className="text-gray-600 mb-8 text-lg">
              {error || "Для доступа к этому уроку требуется подписка"}
            </p>
            <a
              href="/profile"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
            >
              Перейти в профиль
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Если доступ разрешен, рендерим дочерние маршруты
  return <Outlet />;
}

