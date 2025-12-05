import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

function LessonAdminPage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessons = async () => {
      const querySnapshot = await getDocs(collection(db, "lessons"));
      const data = querySnapshot.docs.map((doc) => {
        const pathParts = doc.ref.path.split("/");
        return {
          id: doc.id,
          level: pathParts[pathParts.length - 2],
          ...doc.data(),
        };
      });
      setLessons(data);
      setLoading(false);
    };

    fetchLessons();
  }, []);

  if (loading) return <p>Загрузка...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📚 Администрирование уроков</h2>
      <ul>
        {lessons.map((lesson) => (
          <li key={`${lesson.level}-${lesson.id}`}>
            <strong>
              {lesson.level}/{lesson.id}
            </strong>{" "}
            —{" "}
            {typeof lesson.title === "object"
              ? lesson.title.ru
              : lesson.title || "Без названия"}
            <Link to={`/admin/lesson/${lesson.level}/${lesson.id}`}>
              ✏️ Редактировать
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/admin/lessons/new">
        <button style={{ marginTop: 20 }}>➕ Добавить урок</button>
      </Link>
    </div>
  );
}

export default LessonAdminPage;
