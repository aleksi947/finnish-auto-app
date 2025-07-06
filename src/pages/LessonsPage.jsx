import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function LessonsPage() {
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      setError(null);

      try {
        // Проверка подписки
        if (user) {
          const ref = doc(db, "subscriptions", user.uid);
          const docSnap = await getDoc(ref);
          if (docSnap.exists() && docSnap.data().active === true) {
            setHasSubscription(true);
            console.log("✅ Подписка активна");
          } else {
            setHasSubscription(false);
            console.log("❌ Подписка не найдена");
          }
        }

        // Получение всех уроков
        const lessonsSnapshot = await getDocs(collection(db, "lessons"));
        const allLessons = lessonsSnapshot.docs.map((doc) => doc.data());

        // Правильная сортировка по уровню и номеру
        allLessons.sort((a, b) => {
          const [levelA, numA] = String(a.id).split("-");
          const [levelB, numB] = String(b.id).split("-");

          if (levelA < levelB) return -1;
          if (levelA > levelB) return 1;
          return Number(numA) - Number(numB);
        });

        setLessons(allLessons);
      } catch (err) {
        console.error("❌ Ошибка загрузки:", err);
        setError("Ошибка загрузки уроков");
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Группировка по уровню
  const grouped = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.level]) acc[lesson.level] = [];
    acc[lesson.level].push(lesson);
    return acc;
  }, {});

  if (isLoading) return <div className="lessons-page">Загрузка...</div>;
  if (error) return <div className="lessons-page">Ошибка: {error}</div>;

  return (
    <div className="lessons-page">
      <h1>Уроки</h1>
      {Object.keys(grouped)
        .sort()
        .map((level) => (
          <div key={level} className="level-block">
            <h2>Уровень {level}</h2>
            <ul>
              {grouped[level].map((lesson) => (
                <li key={lesson.id}>
                  {lesson.premium && !hasSubscription ? (
                    <span style={{ color: "gray" }}>
                      🔒 {lesson.title} (по подписке)
                    </span>
                  ) : (
                    <Link to={`/lesson/${lesson.id}`}>{lesson.title}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
}

export default LessonsPage;
