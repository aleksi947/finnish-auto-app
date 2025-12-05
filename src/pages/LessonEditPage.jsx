import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

function LessonEditPage() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jsonText, setJsonText] = useState("");

  useEffect(() => {
    const fetchLesson = async () => {
      const docRef = doc(db, "lessons", lessonId);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        setLesson(data);
        setJsonText(JSON.stringify(data, null, 2));
      } else {
        setError("Урок не найден");
      }

      setLoading(false);
    };

    fetchLesson();
  }, [lessonId]);

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      const docRef = doc(db, "lessons", lessonId);
      await updateDoc(docRef, parsed);
      alert("✅ Урок обновлён");
    } catch (err) {
      console.error(err);
      alert("❌ Ошибка при сохранении. Проверь JSON.");
    }
  };

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>✏️ Редактирование урока {lessonId}</h2>

      <textarea
        rows={30}
        cols={100}
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        style={{ fontFamily: "monospace" }}
      />

      <br />
      <button onClick={handleSave} style={{ marginTop: 10 }}>
        💾 Сохранить
      </button>
    </div>
  );
}

export default LessonEditPage;
