import { Link, useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import { Button } from "../components/ui/button";
import { useAuthDialog } from "../hooks/useAuthDialog";

const lessonDirections = [
  { icon: "🗂️", title: "Новые слова", text: "Полезная лексика для повседневных ситуаций." },
  { icon: "📘", title: "Грамматика", text: "Понятные объяснения правил на русском языке." },
  { icon: "🎧", title: "Аудирование", text: "Задания для понимания финской речи на слух." },
  { icon: "🎙️", title: "Говорение", text: "Практика произношения и разговорных фраз." },
  { icon: "✍️", title: "Письмо", text: "Упражнения на составление слов и предложений." },
  { icon: "📖", title: "Чтение", text: "Тексты и вопросы для проверки понимания." },
];

function HomePage() {
  const navigate = useNavigate();
  const { user, authLoading, openAuth } = useAuthDialog();

  const startFirstLesson = () => {
    if (user) {
      navigate("/lesson/A1-1");
      return;
    }

    openAuth({
      mode: "register",
      reason: "lesson",
      returnTo: "/lesson/A1-1",
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-screen min-h-[500px] sm:min-h-[600px]">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/images/finland.png')` }}
        >
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Navigation */}
        <Navigation />

        {/* Hero Content */}
        <div className="relative z-10 flex h-full items-center justify-center px-4 sm:px-6 pt-20 pb-8">
          <div className="max-w-4xl text-center w-full">
            <h1 className="mb-4 sm:mb-6 text-2xl sm:text-[36px] md:text-5xl lg:text-6xl xl:text-7xl font-normal not-italic text-white leading-tight sm:leading-normal">
              Финский язык для жизни в Финляндии
            </h1>
            <p className="mx-auto mb-6 sm:mb-10 max-w-2xl text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 px-2">
              Понятные объяснения на русском, слова, грамматика, аудирование и
              разговорная практика. Курс поможет подготовиться к тесту YKI.
            </p>

            <div className="flex flex-col items-stretch sm:items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0 sm:flex-row">
              <Button
                type="button"
                disabled={authLoading}
                onClick={startFirstLesson}
                className="w-full sm:w-auto bg-blue-600 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg text-white hover:bg-blue-700"
              >
                🚀 Начать обучение
              </Button>
              <Link to="/lessons" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-white bg-white/10 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg text-white backdrop-blur-sm hover:bg-white/20"
                >
                  📘 Посмотреть уроки
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson directions */}
      <section className="bg-slate-50 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
            <h2 className="mb-4 text-3xl font-semibold text-slate-900 sm:text-4xl">
              Что есть внутри урока
            </h2>
            <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
              Каждый урок сочетает разные виды практики, чтобы вы не только
              запоминали правила, но и учились использовать финский язык.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {lessonDirections.map((direction) => (
              <article
                key={direction.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
              >
                <div className="mb-4 text-4xl" aria-hidden="true">
                  {direction.icon}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">
                  {direction.title}
                </h3>
                <p className="leading-relaxed text-slate-600">{direction.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="mb-4 sm:mb-6 text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white leading-tight px-2">
            Начните с первого урока прямо сейчас
          </h2>
          <p className="mb-6 sm:mb-10 text-base sm:text-lg md:text-xl text-white/90 px-2">
            Выберите свой уровень и занимайтесь в удобном темпе
          </p>
          <Button
            type="button"
            size="lg"
            disabled={authLoading}
            onClick={startFirstLesson}
            className="bg-white px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6 text-base sm:text-lg text-blue-700 hover:bg-gray-100 w-full sm:w-auto"
          >
            🚀 Начать бесплатно
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 sm:py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <Link
            to="/feedback"
            className="mb-5 inline-block text-sm text-slate-300 transition-colors hover:text-white hover:underline sm:text-base"
          >
            Оставить отзыв или задать вопрос
          </Link>
          <p className="text-sm sm:text-base text-gray-400">© 2026 FinnishFlow. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
