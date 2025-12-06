import Navigation from "../components/Navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

export default function SubscriptionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EAF5FF] to-[#CDE8FF]">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <div className="pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[#1E64F0] text-[#1E64F0] hover:bg-[#1E64F0] hover:text-white transition-all mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад</span>
          </button>

          {/* White Container */}
          <div className="bg-white rounded-3xl shadow-lg border-2 border-[#3C84F8] p-8 sm:p-10 md:p-12">
            {/* Header Section */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl leading-none">💎</span>
                <h1 className="text-4xl leading-none font-bold text-gray-900">Подписка</h1>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                Открой полный доступ ко всем урокам и новым обновлениям
              </p>
            </div>

            {/* Benefits List */}
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

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subscription Card */}
              <div className="border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-400 transition-colors flex flex-col h-full bg-gray-50/50">
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
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg rounded-xl mt-6 cursor-pointer">
                  Оформить подписку
                </Button>
              </div>

              {/* One-time Payment Card */}
              <div className="border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-400 transition-colors flex flex-col h-full bg-gray-50/50">
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
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg rounded-xl mt-6 cursor-pointer">
                  Оплатить разово
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

