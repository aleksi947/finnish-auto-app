import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { doc, collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import Navigation from "../components/Navigation";
import { Button } from "../components/ui/button";
import { User, Mail, CheckCircle, Clock, BarChart3, Info, Pen } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getLessonProgress } from "../services/progressService";
import { useSubscription } from "../hooks/useSubscription";

const stopUrl = import.meta.env.VITE_FUNCTIONS_STOP_SUBSCRIPTION;
const startUrl = import.meta.env.VITE_FUNCTIONS_START_CHECKOUT;
// Добавляем URL для возобновления (предполагаем, что ты добавишь переменную в .env, или я захардкожу путь пока что)
// Лучше использовать тот же домен, что и stopUrl, просто меняем endpoint
const resumeUrl = stopUrl.replace("stopSubscription", "resumeSubscription");

function ProfilePage() {
  // Используем наш обновленный хук (теперь он real-time!)
  const { user, hasSubscription, subscriptionData, loading: subLoading } = useSubscription();
  
  const [lessonsCompleted, setLessonsCompleted] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const navigate = useNavigate();

  // Загрузка статистики уроков
  useEffect(() => {
    if (!user) return;
    
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const lessonsSnap = await getDocs(collection(db, "lessons"));
        const lessons = lessonsSnap.docs.map((d) => d.id);
        
        const progressPromises = lessons.map(async (lessonId) => {
          const progress = await getLessonProgress(user.uid, lessonId);
          return progress?.status === "completed";
        });
        
        const completedResults = await Promise.all(progressPromises);
        const completedCount = completedResults.filter(Boolean).length;
        setLessonsCompleted(completedCount);
      } catch (err) {
        console.error("Ошибка загрузки статистики:", err);
        setLessonsCompleted(0);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [user]);

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
      toast.success("📅 Подписка отменена. Доступ сохранится до конца периода.");
    } catch (err) {
      console.error("Ошибка отмены подписки:", err);
      toast.error("❌ Не удалось отменить подписку");
    }
  };

  const handleResumeSubscription = async () => {
    if (!user) return toast.error("❗ Войдите в аккаунт.");
    if (!window.confirm("Возобновить подписку? Списания продолжатся в обычном режиме.")) return;

    try {
      const idToken = await getIdToken(user, true);
      await axios.post(
        resumeUrl,
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      toast.success("✅ Подписка успешно возобновлена!");
    } catch (err) {
      console.error("Ошибка возобновления подписки:", err);
      toast.error("❌ Не удалось возобновить подписку");
    }
  };

  const handleSubscribe = () => {
    navigate("/subscription");
  };

  // Форматирование даты окончания подписки
  const formatValidUntil = () => {
    if (!subscriptionData) return "—";

    // Если это подписка с автопродлением
    if (subscriptionData.type === 'monthly') {
        if (subscriptionData.canceledAtPeriodEnd) {
            return "Отменена (доступ до конца периода)";
        }
        return "Автопродление";
    }
    
    const date = subscriptionData.validUntil || subscriptionData.endDate;
    
    if (!date) return "—";

    if (date?.toDate) {
      return date.toDate().toLocaleDateString("ru-RU");
    }
    if (date instanceof Date) {
      return date.toLocaleDateString("ru-RU");
    }
    return date;
  };

  // Текст статуса подписки
  const getSubscriptionStatusText = () => {
      if (subLoading) return "Загрузка...";
      
      if (!hasSubscription) return "Неактивна";

      if (subscriptionData?.canceledAtPeriodEnd) {
          return <span className="text-orange-600 font-medium">Отменена</span>;
      }
      return <span className="text-green-600 font-medium">Активна</span>;
  };

  // Получение имени пользователя
  const getUserName = () => {
    return user?.displayName || user?.email?.split("@")[0] || "Пользователь";
  };

  if (!user && !subLoading) {
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
      <Navigation />

      <div className="pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-lg border-2 border-[#3C84F8] p-8 sm:p-10 md:p-12">
            <h1 className="text-4xl mb-10 text-gray-800">Профиль</h1>

            <div className="space-y-5 mb-8">
              <div className="flex items-center gap-4">
                <User className="w-6 h-6 text-gray-500 flex-shrink-0" />
                <p className="text-lg text-gray-800">
                  <span className="font-semibold">Имя:</span> {getUserName()}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Mail className="w-6 h-6 text-gray-500 flex-shrink-0" />
                <p className="text-lg text-gray-800">
                  <span className="font-semibold">Email:</span> {user?.email}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {hasSubscription ? (
                    <div className={`rounded-md p-1 ${subscriptionData?.canceledAtPeriodEnd ? "bg-orange-500" : "bg-green-500"}`}>
                      <CheckCircle className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="bg-gray-400 rounded-md p-1">
                      <CheckCircle className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-lg text-gray-800">
                    <span className="font-semibold">Статус подписки:</span>{" "}
                    {getSubscriptionStatusText()}
                  </p>
                  {hasSubscription && (
                    <p className="text-sm text-gray-500 mt-1">
                       Тип: {subscriptionData?.type === 'monthly' ? 'Ежемесячная подписка' : (subscriptionData?.type === 'one_time' ? 'Разовый доступ' : 'Неопределен')}
                    </p>
                  )}
                </div>
              </div>

              {hasSubscription && (
                <div className="flex items-center gap-4">
                  <Clock className="w-6 h-6 text-gray-500 flex-shrink-0" />
                  <p className="text-lg text-gray-800">
                    <span className="font-semibold">
                        {subscriptionData?.type === 'monthly' && !subscriptionData?.canceledAtPeriodEnd ? 'Статус продления:' : 'Действует до:'}
                    </span>{" "}
                    {formatValidUntil()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Button
                onClick={() => {
                  toast.info("Функция изменения профиля будет реализована");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-6 text-lg rounded-xl flex items-center justify-center gap-2"
              >
                <Pen className="w-5 h-5" />
                Изменить профиль
              </Button>
              
              {/* Кнопка отмены (только если активна и не отменена) */}
              {hasSubscription && subscriptionData?.type === 'monthly' && !subscriptionData?.canceledAtPeriodEnd && (
                <Button
                  onClick={handleCancelSubscription}
                  variant="outline"
                  className="border-2 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-600 px-6 py-6 text-lg rounded-xl bg-white"
                >
                  Отменить подписку
                </Button>
              )}

              {/* Кнопка ВОЗОБНОВЛЕНИЯ (только если отменена) */}
              {hasSubscription && subscriptionData?.type === 'monthly' && subscriptionData?.canceledAtPeriodEnd && (
                <Button
                  onClick={handleResumeSubscription}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-6 text-lg rounded-xl flex items-center justify-center gap-2"
                >
                  🔄 Возобновить подписку
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

            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <BarChart3 className="w-6 h-6 text-gray-500 flex-shrink-0" />
                <p className="text-lg text-gray-800">
                  <span className="font-semibold">Пройдено уроков:</span>{" "}
                  {isLoadingStats ? "Загрузка..." : lessonsCompleted}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Info className="w-6 h-6 text-gray-500 flex-shrink-0" />
                <p className="text-lg text-gray-800">
                  <span className="font-semibold">Время обучения:</span> 0 ч 0 мин
                </p>
              </div>
            </div>

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
