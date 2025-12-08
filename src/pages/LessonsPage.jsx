import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import { db, auth } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { getLessonProgress } from "../services/progressService";
import { Badge } from "../components/ui/badge";

/* --- Level card с hover эффектом --- */
function LevelCard({ level, color, completed = 0, total = 0 }) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const completedText =
    total > 0 && completed >= total ? "Completed" : `${completed} / ${total} • ${percent}%`;

  return (
    <div
      className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-4">
        <div
          className="h-12 w-12 rounded-lg transition-transform duration-300 hover:scale-105"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <div className="text-3xl font-semibold text-gray-900">{level}</div>
      </div>

      <div className="ml-6 flex w-full max-w-[520px] items-center gap-4">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-2 rounded-full transition-all duration-300`}
            style={{
              width: `${Math.min(percent, 100)}%`,
              backgroundColor: completedText === "Completed" ? "#2E7D32" : "#3B82F6",
            }}
          />
        </div>
        <div
          className={`w-28 text-right text-sm ${
            completedText === "Completed" ? "text-green-700" : "text-gray-500"
          }`}
        >
          {completedText}
        </div>
      </div>
    </div>
  );
}

/* --- Page --- */
export default function LessonsPage() {
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progressMap, setProgressMap] = useState({}); // Карта прогресса: { lessonId: progress }
  const [openLevel, setOpenLevel] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      setError(null);
      try {
        // Загружаем информацию о подписке (не критично, если ошибка)
        try {
          if (user) {
            const ref = doc(db, "subscriptions", user.uid);
            const snap = await getDoc(ref);
            setHasSubscription(snap.exists() && snap.data().active === true);
          } else {
            setHasSubscription(false);
          }
        } catch (subError) {
          console.warn("Ошибка загрузки подписки:", subError);
          setHasSubscription(false);
        }

        // Загружаем уроки (критично)
        const snap = await getDocs(collection(db, "lessons"));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        data.sort((a, b) => {
          const [la, na] = String(a.id).split("-");
          const [lb, nb] = String(b.id).split("-");
          if (la < lb) return -1;
          if (la > lb) return 1;
          return Number(na) - Number(nb);
        });

        setLessons(data);

        // Загружаем прогресс всех уроков для пользователя (не критично, если ошибка)
        if (user) {
          try {
            const progressPromises = data.map(async (lesson) => {
              const progress = await getLessonProgress(user.uid, lesson.id);
              return { lessonId: lesson.id, progress };
            });
            
            const progressResults = await Promise.all(progressPromises);
            const progressMapObj = {};
            progressResults.forEach(({ lessonId, progress }) => {
              progressMapObj[lessonId] = progress;
            });
            setProgressMap(progressMapObj);
          } catch (progressError) {
            console.warn("Ошибка загрузки прогресса:", progressError);
            // Продолжаем работу без прогресса
          }
        }
      } catch (e) {
        console.error("Ошибка загрузки уроков:", e);
        setError("Ошибка загрузки уроков");
      } finally {
        setIsLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const grouped = useMemo(() => {
    const g = {};
    for (const l of lessons) {
      const level = l.level || String(l.id).split("-")[0] || "UNKNOWN";
      (g[level] ||= []).push(l);
    }
    return g;
  }, [lessons]);

  const levelColors = {
    A1: "#1E88E5",
    A2: "#43A047",
    B1: "#FB8C00",
    B2: "#E53935",
    C1: "#7B1FA2",
    C2: "#6D4C41",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <Navigation />
        <div className="px-6 pt-32">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow">Загрузка…</div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <Navigation />
        <div className="px-6 pt-32">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 text-red-600 shadow">{error}</div>
        </div>
      </div>
    );
  }

  const levels = Object.keys(grouped).sort();
  
  // Рассчитываем количество завершенных уроков для уровня
  const getCompletedForLevel = (level) => {
    const levelLessons = grouped[level] || [];
    return levelLessons.filter((lesson) => {
      const progress = progressMap[lesson.id];
      return progress?.status === "completed";
    }).length;
  };

  const getLessonStatus = (lessonId) => {
    const progress = progressMap[lessonId];
    return progress?.status || "not-started";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "not-started":
        return (
          <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border-red-200 border">
            Не начато
          </Badge>
        );
      case "in-progress":
        return (
          <Badge className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200 border">
            В процессе
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200 border">
            Выполнено
          </Badge>
        );
      default:
        return (
          <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border-red-200 border">
            Не начато
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Navigation />
      <div className="px-6 pb-20 pt-32">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-10 text-3xl font-semibold text-gray-800">УРОВНИ КУРСОВ</h1>

          <div className="space-y-6">
            {levels.map((level) => {
              const items = grouped[level] || [];
              const total = items.length;
              const completed = getCompletedForLevel(level);

              return (
                <div key={level} className="rounded-2xl">
                  {/* Level Header */}
                  <button
                    className="w-full text-left focus:outline-none"
                    onClick={() => setOpenLevel((v) => (v === level ? null : level))}
                  >
                    <LevelCard
                      level={level}
                      color={levelColors[level] || "#1E88E5"}
                      completed={completed}
                      total={total}
                    />
                  </button>

                  {/* Lessons List */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openLevel === level ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="mt-4 rounded-2xl bg-white p-4 shadow">
                      <div className="space-y-2">
                        {items.map((lesson) => {
                          const isLocked = lesson.premium && !hasSubscription;
                          const title =
                            typeof lesson.title === "string"
                              ? lesson.title
                              : lesson.title?.ru || "Без названия";
                          const lessonStatus = getLessonStatus(lesson.id);

                          const rowClasses = isLocked
                            ? "cursor-not-allowed bg-gray-50 text-gray-400"
                            : "cursor-pointer text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:translate-x-1 hover:shadow-sm";

                          return (
                            <div
                              key={lesson.id}
                              className={`rounded-lg border border-transparent px-4 py-3 transition-all duration-300 flex items-center justify-between gap-4 ${rowClasses}`}
                              onClick={() => {
                                if (!isLocked) navigate(`/lesson/${lesson.id}`);
                              }}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (!isLocked && (e.key === "Enter" || e.key === " ")) {
                                  navigate(`/lesson/${lesson.id}`);
                                }
                              }}
                            >
                              <span>{isLocked ? `🔒 ${title} (по подписке)` : title}</span>
                              {!isLocked && (
                                <div className="flex-shrink-0">
                                  {getStatusBadge(lessonStatus)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
