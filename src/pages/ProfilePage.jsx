import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import Navigation from "../components/Navigation";
import { Button } from "../components/ui/button";
import { User, Mail, CheckCircle, Clock, BarChart3, Info, Pen } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getLessonProgress } from "../services/progressService";

const stopUrl = import.meta.env.VITE_FUNCTIONS_STOP_SUBSCRIPTION;
const startUrl = import.meta.env.VITE_FUNCTIONS_START_CHECKOUT;

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [hasSubscription, setHasSubscription] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [lessonsCompleted, setLessonsCompleted] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoadingStats(true);
      if (currentUser) {
        try {
          const subRef = doc(db, "subscriptions", currentUser.uid);
          const subSnap = await getDoc(subRef);
          const subData = subSnap.exists() ? subSnap.data() : null;
          setHasSubscription(subData?.active === true);
          setSubscriptionData(subData);

          // Загружаем статистику прогресса
          const lessonsSnap = await getDocs(collection(db, "lessons"));
          const lessons = lessonsSnap.docs.map((d) => d.id);
          
          const progressPromises = lessons.map(async (lessonId) => {
            const progress = await getLessonProgress(currentUser.uid, lessonId);
            return progress?.status === "completed";
          });
          
          const completedResults = await Promise.all(progressPromises);
          const completedCount = completedResults.filter(Boolean).length;
          setLessonsCompleted(completedCount);
        } catch (err) {
          console.error("❌ Ошибка чтения данных:", err);
          setHasSubscription(false);
          setSubscriptionData(null);
          setLessonsCompleted(0);
        } finally {
          setIsLoadingStats(false);
        }
      } else {
        setHasSubscription(false);
        setSubscriptionData(null);
        setLessonsCompleted(0);
        setIsLoadingStats(false);
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    toast.success("🚪 Выход выполнен");
    navigate("/");
  };

  const handleCancelSubscription = async () => {
    if (!user) return toast.error("❗ Войдите в аккаунт.");
    if (!window.confirm("Вы уверены, что хотите отменить подписку?")) return;
    
    try {
      const idToken = await getIdToken(user, true);
      await axios.post(
        stopUrl,
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      toast.success("📅 Подписка отменена, действует до конца периода.");
      setHasSubscription(false);
      // Обновляем данные подписки
      const subRef = doc(db, "subscriptions", user.uid);
      const subSnap = await getDoc(subRef);
      setSubscriptionData(subSnap.exists() ? subSnap.data() : null);
    } catch (err) {
      console.error("Ошибка отмены подписки:", err);
      toast.error("❌ Не удалось отменить подписку");
    }
  };

  const handleSubscribe = async () => {
    if (!user) return toast.error("❗ Войдите в аккаунт.");
    try {
      const idToken = await getIdToken(user, true);
      toast.loading("⏳ Перенаправляем в Stripe...");
      const res = await axios.post(
        startUrl,
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      toast.dismiss();
      toast.success("✅ Перенаправление...");
      window.location.href = res.data.url;
    } catch (err) {
      toast.dismiss();
      console.error("Ошибка запуска Stripe Checkout:", err);
      toast.error("❌ Ошибка оформления подписки");
    }
  };

  // Форматирование даты окончания подписки (если есть)
  const formatValidUntil = () => {
    if (!subscriptionData?.validUntil && !subscriptionData?.endDate) {
      return "—";
    }
    const date = subscriptionData.validUntil || subscriptionData.endDate;
    if (date?.toDate) {
      return date.toDate().toLocaleDateString("ru-RU");
    }
    if (date instanceof Date) {
      return date.toLocaleDateString("ru-RU");
    }
    return date;
  };

  // Получение имени пользователя (если есть в профиле)
  const getUserName = () => {
    return user?.displayName || user?.email?.split("@")[0] || "Пользователь";
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EAF5FF] to-[#CDE8FF]">
        <Navigation />
        <div className="pt-24 pb-12 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-lg border-2 border-[#3C84F8] p-8 sm:p-10 md:p-12">
              <h1 className="text-4xl mb-4">Профиль</h1>
              <p className="text-lg text-gray-800">
                Пожалуйста, войдите в систему для просмотра профиля.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EAF5FF] to-[#CDE8FF]">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <div className="pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-3xl shadow-lg border-2 border-[#3C84F8] p-8 sm:p-10 md:p-12">
            {/* Main Title */}
            <h1 className="text-4xl mb-10 text-gray-800">Профиль</h1>

            {/* Profile Information */}
            <div className="space-y-5 mb-8">
              {/* Name */}
              <div className="flex items-center gap-4">
                <User className="w-6 h-6 text-gray-500 flex-shrink-0" />
                <p className="text-lg text-gray-800">
                  <span className="font-semibold">Имя:</span> {getUserName()}
                </p>
              </div>

              {/* Email */}
              <div className="flex items-center gap-4">
                <Mail className="w-6 h-6 text-gray-500 flex-shrink-0" />
                <p className="text-lg text-gray-800">
                  <span className="font-semibold">Email:</span> {user.email}
                </p>
              </div>

              {/* Subscription Status */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {hasSubscription ? (
                    <div className="bg-green-500 rounded-md p-1">
                      <CheckCircle className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="bg-gray-400 rounded-md p-1">
                      <CheckCircle className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p className="text-lg text-gray-800">
                  <span className="font-semibold">Статус подписки:</span>{" "}
                  {hasSubscription === null
                    ? "Загрузка..."
                    : hasSubscription
                    ? "Активна"
                    : "Неактивна"}
                </p>
              </div>

              {/* Valid Until */}
              {hasSubscription && (
                <div className="flex items-center gap-4">
                  <Clock className="w-6 h-6 text-gray-500 flex-shrink-0" />
                  <p className="text-lg text-gray-800">
                    <span className="font-semibold">Действует до:</span> {formatValidUntil()}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Button
                onClick={() => {
                  // Логика изменения профиля
                  toast.info("Функция изменения профиля будет реализована");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-6 text-lg rounded-xl flex items-center justify-center gap-2"
              >
                <Pen className="w-5 h-5" />
                Изменить профиль
              </Button>
              {hasSubscription && (
                <Button
                  onClick={handleCancelSubscription}
                  variant="outline"
                  className="border-2 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-600 px-6 py-6 text-lg rounded-xl bg-white"
                >
                  Отменить подписку
                </Button>
              )}
              {!hasSubscription && (
                <Button
                  onClick={handleSubscribe}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-6 text-lg rounded-xl flex items-center justify-center gap-2 flex-1"
                >
                  🔥 Оформить подписку
                </Button>
              )}
            </div>

            {/* User Statistics */}
            <div className="space-y-5">
              {/* Lessons Completed */}
              <div className="flex items-center gap-4">
                <BarChart3 className="w-6 h-6 text-gray-500 flex-shrink-0" />
                <p className="text-lg text-gray-800">
                  <span className="font-semibold">Пройдено уроков:</span>{" "}
                  {isLoadingStats ? "Загрузка..." : lessonsCompleted}
                </p>
              </div>

              {/* Learning Time - можно добавить реальную статистику позже */}
              <div className="flex items-center gap-4">
                <Info className="w-6 h-6 text-gray-500 flex-shrink-0" />
                <p className="text-lg text-gray-800">
                  <span className="font-semibold">Время обучения:</span> 0 ч 0 мин
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 px-6 py-6 text-lg rounded-xl bg-white w-full sm:w-auto"
              >
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
