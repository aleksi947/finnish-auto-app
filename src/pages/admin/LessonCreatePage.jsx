import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";

function LessonCreatePage() {
  const [id, setId] = useState("");
  const [level, setLevel] = useState("A1");
  const [title, setTitle] = useState("");
  const [premium, setPremium] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleCreate = async () => {
    try {
      const fullId = id.trim();
      const fullLevel = level.trim().toUpperCase();

      if (!fullId || !fullLevel || !title) {
        setError("Пожалуйста, заполните все обязательные поля.");
        return;
      }

      let fullData = {
        id: fullId,
        level: fullLevel,
        title: title,
        premium: premium,
      };

      if (jsonText.trim()) {
        const parsed = JSON.parse(jsonText);
        fullData = { ...fullData, ...parsed };
      }

      const docRef = doc(db, "lessons", fullId);
      await setDoc(docRef, fullData);
      navigate("/admin/lessons");
    } catch (err) {
      console.error("Ошибка при создании урока:", err);
      setError("❌ Ошибка при создании урока. Проверьте JSON.");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>➕ Добавить новый урок</h2>

      <div style={{ marginBottom: 10 }}>
        <label>
          ID урока (например, A1-2):{" "}
          <input value={id} onChange={(e) => setId(e.target.value)} />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Уровень:{" "}
          <input value={level} onChange={(e) => setLevel(e.target.value)} />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Название:{" "}
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          По подписке?{" "}
          <input
            type="checkbox"
            checked={premium}
            onChange={(e) => setPremium(e.target.checked)}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>Дополнительные данные (в виде JSON):</label>
        <textarea
          rows={10}
          cols={80}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
        />
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button onClick={handleCreate}>💾 Создать урок</button>
    </div>
  );
}

export default LessonCreatePage;
