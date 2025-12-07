import { useState } from "react";
import Navigation from "../components/Navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { getIdToken } from "firebase/auth";
import axios from "axios";
import toast from "react-hot-toast";
import { useSubscription } from "../hooks/useSubscription";

// Получаем URL функции из переменных окружения
const startUrl = import.meta.env.VITE_FUNCTIONS_START_CHECKOUT;

// ID цен
const MONTHLY_PRICE_ID = null; 
const ONE_TIME_PRICE_ID = "price_1SbRYLG13irHLXe7P0GM2nvC";

export default function SubscriptionPage() {
  const navigate = useNavigate();
  // Добавляем subscriptionData
  const { hasSubscription, subscriptionData, loading: subLoading, user } = useSubscription();
  
  // Храним тип загрузки: 'monthly' | 'one_time' | null
  const [loadingType, setLoadingType] = useState(null);

  const handleSubscribe = async (type) => {
    if (!user) {
      toast.error("Пожалуйста, войдите или зарегистрируйтесь");
      return;
    }

    if (hasSubscription) {
      toast.success("У вас уже есть активная подписка!");
      navigate("/profile");
      return;
    }

    setLoadingType(type);
    try {
      const idToken = await getIdToken(user, true);
      
      let payload = {};
      
      if (type === 'monthly') {
        payload = {
          mode: 'subscription',
          priceId: MONTHLY_PRICE_ID 
        };
      } else {
        payload = {
          mode: 'payment',
          priceId: ONE_TIME_PRICE_ID
        };
      }

      toast.loading("Перенаправляем на оплату...");
      
      const res = await axios.post(
        startUrl,
        payload,
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      toast.dismiss();
      window.location.href = res.data.url;

    } catch (error) {
      console.error("Ошибка при создании платежа:", error);
      toast.dismiss();
      toast.error("Не удалось перейти к оплате. Попробуйте позже.");
      setLoadingType(null);
    }
  };

  // Вспомогательная функция для текста кнопки
  const getButtonText = (cardType) => {
    // Показываем спиннер ТОЛЬКО на той кнопке, которую нажали
    if (loadingType === cardType) return <Loader2 className="animate-spin" />;
    
    if (!hasSubscription) {
        return cardType === 'monthly' ? "Оформить подписку" : "Оплатить разово";
    }

    // Умная логика определения типа подписки
    let currentType = subscriptionData?.type;
    
    if (!currentType) {
        if (subscriptionData?.subscriptionId) {
            currentType = 'monthly';
        } else if (subscriptionData?.validUntil) {
            currentType = 'one_time';
        } else {
            currentType = 'monthly';
        }
    }

    if (currentType === cardType) {
        return "Уже активно";
    } else {
        return "У вас уже есть доступ";
    }
  };

  // Вспомогательная функция для стиля карточки
  const getCardStyle = (cardType) => {
     const baseStyle = "border-2 rounded-2xl p-6 transition-all flex flex-col h-full bg-gray-50/50";
     
     if (!hasSubscription) {
         return `${baseStyle} border-gray-200 hover:border-blue-400`;
     }

     let currentType = subscriptionData?.type;
     if (!currentType) {
         if (subscriptionData?.subscriptionId) {
             currentType = 'monthly';
         } else if (subscriptionData?.validUntil) {
             currentType = 'one_time';
         } else {
             currentType = 'monthly';
         }
     }
     
     if (currentType === cardType) {
         return `${baseStyle} border-green-500 bg-green-50`;
     } else {
         return `${baseStyle} border-gray-200 opacity-60`;
     }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EAF5FF] to-[#CDE8FF]">
      <Navigation />

      <div className="pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[#1E64F0] text-[#1E64F0] hover:bg-[#1E64F0] hover:text-white transition-all mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад</span>
          </button>

          <div className="bg-white rounded-3xl shadow-lg border-2 border-[#3C84F8] p-8 sm:p-10 md:p-12">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl leading-none">💎</span>
                <h1 className="text-4xl leading-none font-bold text-gray-900">Подписка</h1>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                Открой полный доступ ко всем урокам и новым обновлениям
              </p>
            </div>

            <div className="space-y-5 mb-12">
              <div className="flex items-center gap-4">
                <span className="text-2xl leading-none flex-shrink-0">📖</span>
                <p className="text-lg text-gray-800 leading-tight">
                  Доступ ко всем уровням и урокам
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl leading-none flex-shrink-0">🆕</span>
                <p className="text-lg text-gray-800 leading-tight">
                  Новые упражнения и обновления
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl leading-none flex-shrink-0">⏱️</span>
                <p className="text-lg text-gray-800 leading-tight">
                  Доступ без ограничений
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subscription Card (Monthly) */}
              <div className={getCardStyle('monthly')}>
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-2xl leading-none">💳</span>
                  <h3 className="text-2xl leading-none font-semibold">Подписка</h3>
                </div>
                <div className="mb-auto">
                  <div className="mb-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-[#1E64F0]">5,99 €</span>
                    <span className="text-xl text-gray-600">/мес.</span>
                  </div>
                  <p className="text-gray-600 leading-snug">
                    Автопродление, можно отменить
                  </p>
                </div>
                <Button 
                  onClick={() => handleSubscribe('monthly')}
                  // Блокируем, если идет любая загрузка или есть подписка
                  disabled={loadingType !== null || subLoading || hasSubscription}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg rounded-xl mt-6 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {getButtonText('monthly')}
                </Button>
              </div>

              {/* One-time Payment Card */}
              <div className={getCardStyle('one_time')}>
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-2xl leading-none">💰</span>
                  <h3 className="text-2xl leading-none font-semibold">Разовый платёж</h3>
                </div>
                <div className="mb-auto">
                  <div className="mb-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-[#1E64F0]">5,99 €</span>
                  </div>
                  <p className="text-gray-600 leading-snug">
                    Доступ на месяц ко всем урокам. Можно продлить позже
                  </p>
                </div>
                <Button 
                  onClick={() => handleSubscribe('one_time')}
                  // Блокируем, если идет любая загрузка или есть подписка
                  disabled={loadingType !== null || subLoading || hasSubscription}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg rounded-xl mt-6 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {getButtonText('one_time')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
