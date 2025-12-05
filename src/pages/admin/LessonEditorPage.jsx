import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { db } from "../../firebase";

function LessonEditorPage() {
  const { level, lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [title, setTitle] = useState("");
  const [goalFi, setGoalFi] = useState("");
  const [goalRu, setGoalRu] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLesson = async () => {
      const ref = doc(db, "lessons", `${level}-${lessonId}`);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setLesson(data);
        setTitle(data.title || "");
        setGoalFi(data.goal?.fi || "");
        setGoalRu(data.goal?.ru || "");
      }
      setLoading(false);
    };
    fetchLesson();
  }, [level, lessonId]);

  const handleSave = async () => {
    const ref = doc(db, "lessons", `${level}-${lessonId}`);
    await updateDoc(ref, {
      title,
      goal: { fi: goalFi, ru: goalRu },
    });
    alert("✅ Урок обновлён!");
  };

  if (loading) return <p>Загрузка...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>
        ✏️ Редактирование урока: {level}/{lessonId}
      </h2>

      <label>
        <strong>Название урока:</strong>
        <br />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%" }}
        />
      </label>

      <br />
      <br />

      <label>
        <strong>Цель (фин.):</strong>
        <br />
        <textarea
          value={goalFi}
          onChange={(e) => setGoalFi(e.target.value)}
          style={{ width: "100%" }}
        />
      </label>

      <br />
      <br />

      <label>
        <strong>Цель (рус.):</strong>
        <br />
        <textarea
          value={goalRu}
          onChange={(e) => setGoalRu(e.target.value)}
          style={{ width: "100%" }}
        />
      </label>

      <br />
      <br />

      <button onClick={handleSave}>💾 Сохранить</button>
    </div>
  );
}

export default LessonEditorPage;
