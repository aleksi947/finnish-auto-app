import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import SubscribeButton from "../components/SubscribeButton";

function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("👤 Состояние авторизации изменилось:", currentUser);
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ padding: 20 }}>Загрузка...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🌟 Добро пожаловать!</h1>
      
      {user ? (
        <div style={{ marginBottom: 20, padding: 10, backgroundColor: "#f0f0f0", borderRadius: 5 }}>
          <p>✅ Вы вошли как: <strong>{user.email}</strong></p>
          <p>🆔 UID: {user.uid}</p>
        </div>
      ) : (
        <div style={{ marginBottom: 20, padding: 10, backgroundColor: "#fff3cd", borderRadius: 5 }}>
          <p>⚠️ Вы не вошли в систему</p>
        </div>
      )}

      <p>Выберите действие:</p>
      <ul>
        {!user ? (
          <>
            <li>
              <Link to="/register">📝 Регистрация</Link>
            </li>
            <li>
              <Link to="/login">🔐 Вход</Link>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/profile">👤 Профиль</Link>
            </li>
            <li>
              <button onClick={() => auth.signOut()}>🚪 Выйти</button>
            </li>
          </>
        )}
        <li>
          <Link to="/lessons">📚 Уроки</Link>
        </li>
      </ul>
      
      {user && <SubscribeButton />}
    </div>
  );
}

export default HomePage;
