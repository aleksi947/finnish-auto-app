import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import Navigation from "../components/Navigation";
import SpeakingSequence from "../components/SpeakingSequence";
import { ArrowLeft } from "lucide-react";
import { useProgress } from "../hooks/useProgress";

function LessonSpeakingExercisePage() {
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

        if (!snap.exists()) {
          setError("Урок не найден");
          return;
        }

        const data = snap.data();
        const found = data.speaking?.find((t) => t.id === taskId);

        if (!found) {
          setError("Упражнение не найдено");
          return;
        }

        setTask(found);
      } catch (err) {
        console.error(err);
        setError("Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [lessonId, taskId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <Navigation
          onNavigateHome={() => navigate("/")}
          onNavigateProfile={() => navigate("/profile")}
        />
        <div className="pt-32 pb-20 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-gray-600">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <Navigation
          onNavigateHome={() => navigate("/")}
          onNavigateProfile={() => navigate("/profile")}
        />
        <div className="pt-32 pb-20 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Navigation
        onNavigateHome={() => navigate("/")}
        onNavigateProfile={() => navigate("/profile")}
      />
      <div className="pt-20 md:pt-32 pb-12 md:pb-20 px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#1471F6] hover:text-[#0E5CD4] transition-colors mb-6 md:mb-8 group"
          >
            <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
            <span className="text-base md:text-lg">Назад</span>
          </button>

          {/* Exercise Card */}
          <div className="bg-white rounded-2xl md:rounded-3xl border-2 border-blue-300 shadow-sm p-4 md:p-8">
            {task.type === "speaking-sequence" && (
              <SpeakingSequence 
                task={task}
                onMarkStarted={() => markExerciseStarted("speaking", taskId)}
                onMarkCompleted={(allCorrect) => {
                  if (allCorrect) {
                    markExerciseCompleted("speaking", taskId);
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LessonSpeakingExercisePage;
