import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth"; // ⬅️ Добавлено

const lang = "ru";

function LessonOverview() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setError("Вы не авторизованы");
          setLoading(false);
          return;
        }

        // Проверка подписки
        const subRef = doc(db, "subscriptions", user.uid);
        const subSnap = await getDoc(subRef);
        const hasAccess = subSnap.exists() && subSnap.data().active;

        // Получение урока по полному id (например, "A1-1")
        const lessonRef = doc(db, "lessons", lessonId);
        const lessonSnap = await getDoc(lessonRef);

        if (!lessonSnap.exists()) {
          setError("Урок не найден");
          setLoading(false);
          return;
        }

        const data = lessonSnap.data();

        // Проверка подписки, если урок премиум
        if (data.premium && !hasAccess) {
          setError("Этот урок доступен только по подписке");
          setLoading(false);
          return;
        }

        setLesson(data);
      } catch (err) {
        console.error("Ошибка загрузки урока:", err);
        setError("Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [lessonId]);

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!lesson) return null;

  const sections = [
    { key: "vocabulary", label: "🟦 Слова" },
    { key: "grammar", label: "📘 Грамматика" },
    { key: "listening", label: "🎧 Аудирование" },
    { key: "speaking", label: "🗣️ Говорение" },
  ];

  return (
    <div style={{ padding: 20 }}>
      <h1>{lesson.topic?.[lang]}</h1>
      <p>
        <strong>Цель:</strong> {lesson.goal?.[lang]}
      </p>

      <h3>Разделы:</h3>
      <ul>
        {sections.map((s) => (
          <li key={s.key}>
            <Link to={`/lesson/${lessonId}/${s.key}`}>{s.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LessonOverview;
