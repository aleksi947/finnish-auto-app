import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import Navigation from "../components/Navigation";
import ReadingMultipleChoice from "../components/ReadingMultipleChoice";
import SortDialogueExercise from "../components/SortDialogueExercise";
import { ArrowLeft } from "lucide-react";
import { useProgress } from "../hooks/useProgress";

function LessonReadingExercisePage() {
  const { lessonId, taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Hook for progress tracking
  const { markExerciseStarted, markExerciseCompleted } = useProgress(lessonId);

  useEffect(() => {
    async function load() {
      try {
        const ref = doc(db, "lessons", lessonId);
        const snap = await getDoc(ref);

        if (!snap.exists()) throw new Error("Урок не найден");

        const data = snap.data();

        // Ensure array
        const readings = Array.isArray(data.reading)
          ? data.reading
          : [data.reading];
        const allTasks = readings.flatMap((r) => r.tasks || []);
        const found = allTasks.find((t) => t.id === taskId);

        if (!found) throw new Error("Упражнение не найдено");

        setTask(found);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [lessonId, taskId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EAF5FF] to-[#CDE8FF]">
        <Navigation
          onNavigateHome={() => navigate("/")}
          onNavigateProfile={() => navigate("/profile")}
        />
        <div className="pt-24 pb-12 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center text-lg text-gray-700">
            <div className="mb-4 text-5xl">📝</div>
            Загрузка упражнения...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EAF5FF] to-[#CDE8FF]">
        <Navigation
          onNavigateHome={() => navigate("/")}
          onNavigateProfile={() => navigate("/profile")}
        />
        <div className="pt-24 pb-12 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center text-lg text-red-600">
            <div className="mb-4 text-5xl">❌</div>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EAF5FF] to-[#CDE8FF]">
      <Navigation
        onNavigateHome={() => navigate("/")}
        onNavigateProfile={() => navigate("/profile")}
      />

      <div className="px-4 pt-20 pb-12 sm:px-6 md:pt-24">
        <div className="mx-auto max-w-5xl">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 rounded-xl border-2 border-[#1E64F0] px-4 py-2 text-base text-[#1E64F0] transition-all hover:-translate-x-1 hover:bg-[#1E64F0] hover:text-white md:mb-8 md:px-6 md:py-3 md:text-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </button>

          <div className="rounded-[28px] border-2 border-[#3C84F8]/60 bg-white p-6 shadow-xl sm:p-10">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-wide text-slate-500">
                Раздел «Чтение»
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-gray-900 sm:text-4xl">
                📖 Упражнение по чтению
              </h1>
              <p className="mt-3 text-lg text-slate-600">
                {task.instruction?.ru ||
                  "Ответьте на вопросы после прочтения текста."}
              </p>
            </div>

            <div className="space-y-6">
              {task.type === "multiple-choice" && (
                <ReadingMultipleChoice 
                  task={task} 
                  onComplete={() => navigate(-1)}
                  onMarkStarted={() => markExerciseStarted("reading", taskId)}
                  onMarkCompleted={(allCorrect) => {
                    if (allCorrect) {
                      markExerciseCompleted("reading", taskId);
                    }
                  }}
                />
              )}

              {task.type === "sort-dialogue" && (
                <SortDialogueExercise
                  task={task}
                  onMarkStarted={() => markExerciseStarted("reading", taskId)}
                  onMarkCompleted={() =>
                    markExerciseCompleted("reading", taskId)
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LessonReadingExercisePage;
