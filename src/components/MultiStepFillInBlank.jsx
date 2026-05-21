import { useState, useMemo, useEffect } from "react";
import FillInBlank from "./FillInBlank";
import { Progress } from "./ui/Progress";

export default function MultiStepFillInBlank({ exercises = [] }) {
  const [step, setStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const safeExercises = useMemo(() => {
    if (!Array.isArray(exercises)) return [];
    return exercises.filter((exercise) => exercise && exercise.multiStep === true);
  }, [exercises]);

  useEffect(() => {
    if (step >= safeExercises.length) setStep(0);
  }, [safeExercises.length, step]);

  if (!safeExercises.length) {
    return (
      <div className="text-center text-gray-600 bg-gray-50 rounded-xl p-6 border">
        ❌ Нет упражнений для показа
      </div>
    );
  }

  const current = safeExercises[step];

  const handleStepChange = (newStep) => {
    if (newStep >= 0 && newStep < safeExercises.length && newStep !== step) {
      setIsTransitioning(true);
      setTimeout(() => {
        setStep(newStep);
        setTimeout(() => {
          setIsTransitioning(false);
          // Smooth scroll to MultiStepFillInBlank, not above nav
          const componentElement = document.querySelector('[data-multistep-container]');
          if (componentElement) {
            const rect = componentElement.getBoundingClientRect();
            const navHeight = 120; // Nav height with padding
            const viewportTop = window.pageYOffset;
            
            // Scroll only if component is above viewport or too low
            if (rect.top < navHeight || rect.top > window.innerHeight * 0.7) {
              const elementTop = rect.top + viewportTop;
              const offsetPosition = elementTop - navHeight;
              window.scrollTo({
                top: Math.max(0, offsetPosition),
                behavior: "smooth"
              });
            }
          }
        }, 150);
      }, 150);
    }
  };

  const getStageName = (exercise, index) => {
    if (exercise?.explanationStructured?.title?.ru) {
      return exercise.explanationStructured.title.ru.replace(/^[^\p{L}\p{N}]+/u, "").trim();
    }
    // 1) Structured intro → short title
    if (exercise?.explanationStructured?.intro?.ru) {
      const intro = exercise.explanationStructured.intro.ru;
      const typeMatch = intro.match(/Глаголы\s+(\d+)-го\s+типа/);
      if (typeMatch) return `Глаголы ${typeMatch[1]}-го типа`;
      const shortTitle = intro.split(".")[0].trim();
      if (shortTitle && shortTitle.length <= 60) return shortTitle;
    }
    // 2) HTML <h3> as before
    if (exercise?.explanation?.ru) {
      const h3Match = exercise.explanation.ru.match(/<h3>(.*?)<\/h3>/);
      if (h3Match) return h3Match[1].replace(/🔹\s*/g, "").trim();
    }
    return `Этап ${index + 1}`;
  };

  return (
    <div className="space-y-5" data-multistep-container>
      <div className="bg-white rounded-2xl shadow-lg border-2 border-[#CFE0FF] p-6">
        <div className="mb-6">
          <Progress
            value={((step + 1) / safeExercises.length) * 100}
            className="h-3 transition-all duration-500 ease-in-out"
          />
        </div>

        <p className="text-center text-lg mb-4 text-gray-700">Перемещение между этапами:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
          {safeExercises.map((ex, i) => (
            <button
              key={i}
              onClick={() => handleStepChange(i)}
              className={[
                "py-4 px-4 rounded-xl transition-all text-left min-w-0",
                i === step
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200",
              ].join(" ")}
            >
              <div className="font-semibold text-base mb-1">Этап {i + 1}</div>
              <div className={["text-sm leading-tight break-words", i === step ? "opacity-95" : "opacity-90"].join(" ")}>
                {getStageName(ex, i)}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-0">
        <div className={`transition-opacity duration-300 ease-in-out ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
          <FillInBlank
            key={current.id || step}
            exercise={current}
            stageIndex={step}
            onStageComplete={() => {
              if (step < safeExercises.length - 1) {
                handleStepChange(step + 1);
              } else {
                handleStepChange(0);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
