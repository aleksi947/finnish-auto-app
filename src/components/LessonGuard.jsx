import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, Outlet } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useSubscription } from "../hooks/useSubscription";
import Navigation from "../components/Navigation";
import { SUBSCRIPTIONS_ENABLED } from "../config/features";
import { useAuthDialog } from "../hooks/useAuthDialog";

export default function LessonGuard() {
  const { lessonId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, authLoading, openAuth } = useAuthDialog();
  const { hasSubscription, loading: subLoading } = useSubscription();
  const [isAllowed, setIsAllowed] = useState(null); // null = loading, true = allowed, false = denied
  const [error, setError] = useState("");
  const [denialReason, setDenialReason] = useState(null);
  const authPromptShown = useRef(false);

  useEffect(() => {
    if (user) {
      authPromptShown.current = false;
      return;
    }

    if (!authLoading && !authPromptShown.current) {
      authPromptShown.current = true;
      openAuth({
        mode: "register",
        reason: "lesson",
        returnTo: location.pathname,
      });
    }
  }, [authLoading, location.pathname, openAuth, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setDenialReason("auth");
      setError("");
      setIsAllowed(false);
      return;
    }
    if (subLoading) return;

    setIsAllowed(null);
    setDenialReason(null);

    async function checkAccess() {
      try {
        // 1. Load lesson to check if premium
        const ref = doc(db, "lessons", lessonId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setError("Урок не найден");
          setDenialReason("lesson");
          setIsAllowed(false);
          return;
        }

        const lesson = snap.data();

        // 2. Premium lesson without subscription -> deny
        if (SUBSCRIPTIONS_ENABLED && lesson.premium && !hasSubscription) {
          setError("Этот урок доступен только по подписке");
          setDenialReason("subscription");
          setIsAllowed(false);
        } else {
          setIsAllowed(true);
        }
      } catch (e) {
        console.error(e);
        setError("Ошибка проверки доступа");
        setDenialReason("lesson");
        setIsAllowed(false); // Block on error as fallback
      }
    }

    checkAccess();
  }, [authLoading, lessonId, hasSubscription, subLoading, user]);

  if (authLoading || (user && subLoading) || isAllowed === null) {
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
    if (denialReason === "auth") {
      return (
        <div className="min-h-screen bg-[#F5F7FA]">
          <Navigation />
          <div className="mx-auto max-w-2xl px-6 pt-32 text-center">
            <div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-lg">
              <div className="mb-4 text-5xl">📘</div>
              <h2 className="mb-3 text-2xl font-bold text-gray-800">
                Войдите, чтобы начать урок
              </h2>
              <p className="mb-8 text-lg leading-7 text-gray-600">
                Все уроки сейчас бесплатные. Аккаунт нужен, чтобы сохранять
                ваш прогресс.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    openAuth({
                      mode: "register",
                      reason: "lesson",
                      returnTo: location.pathname,
                    })
                  }
                  className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Зарегистрироваться
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openAuth({
                      mode: "login",
                      reason: "lesson",
                      returnTo: location.pathname,
                    })
                  }
                  className="rounded-xl border border-blue-600 px-6 py-3 font-semibold text-blue-700 transition-colors hover:bg-blue-50"
                >
                  Войти
                </button>
              </div>
              <button
                type="button"
                onClick={() => navigate("/lessons")}
                className="mt-5 text-sm text-gray-500 hover:text-blue-700 hover:underline"
              >
                Вернуться к урокам
              </button>
            </div>
          </div>
        </div>
      );
    }

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

  // Allowed — render child routes
  return <Outlet />;
}
