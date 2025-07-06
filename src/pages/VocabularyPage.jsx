import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import VocabularyQuiz from "../components/VocabularyQuiz";
import VocabularyWrite from "../components/VocabularyWrite";

const lang = "ru";

function VocabularyPage() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("Вы не авторизованы");
        setLoading(false);
        return;
      }

      try {
        const subRef = doc(db, "subscriptions", user.uid);
        const subSnap = await getDoc(subRef);
        const hasAccess = subSnap.exists() && subSnap.data().active;

        const lessonRef = doc(db, "lessons", lessonId);
        const lessonSnap = await getDoc(lessonRef);

        if (!lessonSnap.exists()) {
          setError("Урок не найден");
          setLoading(false);
          return;
        }

        const data = lessonSnap.data();

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

  return (
    <div style={{ padding: 20 }}>
      <h1>{lesson.topic?.[lang]}</h1>
      <h2>🟦 Слова</h2>

      {mode === "" && (
        <>
          <ul>
            {lesson.vocabulary?.map((word, i) => (
              <li key={i}>
                <strong>{word.fi}</strong> — {word.translations?.[lang]}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 20 }}>
            <button onClick={() => setMode("quiz")} style={{ marginRight: 10 }}>
              🚀 Упражнение: выбрать перевод
            </button>
            <button onClick={() => setMode("write")}>
              ✍️ Упражнение: написать по-фински
            </button>
          </div>
        </>
      )}

      {mode === "quiz" && (
        <VocabularyQuiz
          words={lesson.vocabulary}
          lang={lang}
          onFinish={() => setMode("")}
        />
      )}

      {mode === "write" && (
        <VocabularyWrite
          words={lesson.vocabulary}
          lang={lang}
          onFinish={() => setMode("")}
        />
      )}
    </div>
  );
}

export default VocabularyPage;
