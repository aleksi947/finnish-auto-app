import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

import Navigation from "../components/Navigation";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, Circle } from "lucide-react";

import MultiStepFillInBlank from "../components/MultiStepFillInBlank";
import StructuredExplanation from "../components/StructuredExplanation";
import { useProgress } from "../hooks/useProgress";

const lang = "ru";

export default function LessonGrammarSectionPage() {
  const { lessonId, sectionId } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Hook для работы с прогрессом
  const { getExerciseStatus } = useProgress(lessonId);

  useEffect(() => {
    async function fetchSection() {
      try {
        const ref = doc(db, "lessons", lessonId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setError("Урок не найден");
          return;
        }
        const lessonData = snap.data();
        const found = lessonData.grammar?.sections?.find(
          (s) => s.id === sectionId
        );

        if (!found) {
          setError("Раздел не найден");
          return;
        }
        setSection(found);
      } catch (err) {
        console.error(err);
        setError("Ошибка загрузки раздела");
      } finally {
        setLoading(false);
      }
    }
    fetchSection();
  }, [lessonId, sectionId]);

  const Screen = ({ children }) => (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-white">
      <div
        className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full blur-3xl"
        style={{ backgroundColor: "rgb(227, 236, 255)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-20 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: "rgb(205, 229, 255)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 translate-y-1/3 rounded-full blur-3xl"
        style={{ backgroundColor: "rgb(234, 243, 255)" }}
        aria-hidden="true"
      />
      <Navigation onNavigateHome={() => {}} onNavigateProfile={() => {}} />
      <div className="relative pt-[calc(7rem+env(safe-area-inset-top))] sm:pt-24 pb-16 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">{children}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Screen>
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-40 rounded-xl border-2 border-blue-200 bg-white/70" />
          <div className="h-12 w-3/4 rounded-2xl border-2 border-blue-200 bg-white" />
          <div className="h-64 w-full rounded-3xl border-2 border-blue-200 bg-white" />
        </div>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <div className="mb-6">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            size="lg"
            className="gap-2 rounded-2xl border bg-white/70 text-blue-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-600 hover:text-white"
            style={{ borderColor: "rgba(37, 99, 235, 0.8)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
        </div>
        <div className="bg-white rounded-2xl p-6 border-2 border-red-300 text-red-700">
          {error}
        </div>
      </Screen>
    );
  }

  if (!section) {
    return (
      <Screen>
        <div className="bg-white rounded-2xl p-6 border-2 border-red-300 text-red-700">
          Раздел не найден
        </div>
      </Screen>
    );
  }

  const hasExercises = section?.exercises?.length > 0;
  const hasExamples = section?.examples?.length > 0;

  const multiStepExercises =
    section.exercises?.filter((ex) => ex.multiStep) || [];
  const regularExercises =
    section.exercises?.filter((ex) => !ex.multiStep) || [];
  const cleanTitle = section.title?.[lang]
    ? section.title[lang].replace(/📘\s*/g, "").trim()
    : "Типы спряжения глаголов";

  const getStatusBadge = (status) => {
    // Для упражнений грамматики показываем только два статуса: "выполнено" или "не выполнено"
    if (status === "completed") {
      return (
        <Circle className="size-5 fill-green-500 text-green-500" />
      );
    }
    // "not-started" и "in-progress" показываем как "не выполнено"
    return (
      <Circle className="size-5 fill-red-500 text-red-500" />
    );
  };

  return (
    <Screen>
      {/* Back */}
      <div className="mb-6">
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          size="lg"
          className="gap-2 rounded-2xl border bg-white/70 text-blue-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-600 hover:text-white"
          style={{ borderColor: "rgba(37, 99, 235, 0.8)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Button>
      </div>

      {/* Header with icon */}
      <div className="text-center mb-8">
        <div
          className="relative overflow-hidden rounded-3xl border bg-white/80 p-8 sm:p-12 text-left backdrop-blur"
          style={{
            borderColor: "rgb(207, 224, 255)",
            boxShadow: "0 24px 60px -30px rgba(30, 100, 240, 0.6)",
          }}
        >
          <div
            className="pointer-events-none absolute -top-20 -right-10 h-48 w-48 rounded-full blur-3xl"
            style={{ backgroundColor: "rgb(224, 236, 255)" }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-12 h-56 w-56 rounded-full blur-3xl"
            style={{ backgroundColor: "rgb(203, 228, 255)" }}
            aria-hidden="true"
          />
          <div className="relative z-10 space-y-6">
            <span
              className="inline-flex items-center gap-2 self-start rounded-full border px-4 py-2 text-xs font-semibold uppercase text-blue-600"
              style={{
                borderColor: "rgba(37, 99, 235, 0.2)",
                backgroundColor: "rgba(234, 242, 255, 0.85)",
                letterSpacing: "0.18em",
              }}
            >
              Грамматика урока
            </span>
            <h1 className="text-3xl sm:text-4xl leading-tight font-semibold text-slate-900">
              {cleanTitle}
            </h1>
            {section.goal?.[lang] && (
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
                {section.goal[lang]}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Examples */}
      {hasExamples && (
        <div
          className="relative mb-10 overflow-hidden rounded-3xl border bg-white/85 p-6 sm:p-8"
          style={{
            borderColor: "rgba(60, 132, 248, 0.4)",
            boxShadow: "0 20px 45px -28px rgba(60, 132, 248, 0.65)",
          }}
        >
          <div
            className="pointer-events-none absolute -top-10 right-6 h-28 w-28 rounded-full blur-2xl"
            style={{ backgroundColor: "#E7F0FF" }}
            aria-hidden="true"
          />
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="flex items-center gap-3 text-2xl font-semibold text-blue-600">
                <span
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                  style={{ backgroundColor: "rgb(234, 242, 255)" }}
                >
                  📚
                </span>
                Полезные примеры
              </h3>
              <span
                className="self-start rounded-full border px-4 py-1 text-xs font-semibold uppercase text-blue-600"
                style={{
                  borderColor: "rgba(37, 99, 235, 0.2)",
                  backgroundColor: "rgb(240, 247, 255)",
                  letterSpacing: "0.16em",
                }}
              >
                {section.examples?.length || 0} шт.
              </span>
            </div>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {section.examples?.map((ex, i) => (
                <li
                  key={i}
                  className="rounded-2xl border bg-white/90 p-4 text-lg shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                  style={{ borderColor: "rgb(207, 224, 255)" }}
                >
                  <b>{ex.fi}</b>
                  {ex.translations?.[lang] && (
                    <span className="text-gray-700">
                      {" "}
                      — {ex.translations[lang]}
                    </span>
                  )}
                </li>
              )) || []}
            </ul>
          </div>
        </div>
      )}

      {/* Global structured explanation (shows once before stages) */}
      {section.explanationStructured && (
            <div className="mb-8">
          <StructuredExplanation structured={section.explanationStructured} lang={lang} />
                </div>
              )}

      {/* Exercises */}
      {hasExercises && (
        <div className="space-y-8">
          {/* Multi-step - объяснение теперь внутри каждого упражнения */}
          {multiStepExercises.length > 0 && (
            <div>
              <MultiStepFillInBlank exercises={multiStepExercises} />
            </div>
          )}

          {/* Additional Exercises */}
          {regularExercises.length > 0 && (
            <div className="bg-white rounded-3xl shadow-lg border-2 border-blue-200 p-6 sm:p-8">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                <span className="text-2xl">📘</span>
                <h3 className="text-2xl font-semibold text-blue-600">
                  Упражнения
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {regularExercises.map((exercise, i) => {
                  const exerciseStatus = getExerciseStatus("grammar", exercise.id, sectionId);
                  return (
                    <Link
                      key={exercise.id || i}
                      to={`/lesson/${lessonId}/grammar/${sectionId}/exercise/${exercise.id}`}
                      className="rounded-xl bg-blue-600 text-white transition-all px-5 py-4 font-medium hover:bg-blue-700 flex items-center justify-between gap-3 group"
                    >
                      <span className="flex-1 text-center">Упражнение {i + 1}</span>
                      <div className="flex-shrink-0">
                        {getStatusBadge(exerciseStatus)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Screen>
  );
}
