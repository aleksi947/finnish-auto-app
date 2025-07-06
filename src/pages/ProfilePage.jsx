import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import SubscribeButton from "../components/SubscribeButton";
import toast from "react-hot-toast";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [hasSubscription, setHasSubscription] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const subRef = doc(db, "subscriptions", currentUser.uid);
          const subSnap = await getDoc(subRef);
          setHasSubscription(
            subSnap.exists() && subSnap.data().active === true
          );
        } catch (err) {
          console.error("❌ Ошибка чтения подписки:", err);
          setHasSubscription(false);
        }
      } else {
        setHasSubscription(false);
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    toast.success("🚪 Выход выполнен");
  };

  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Профиль</h1>
        <p>Пожалуйста, войдите в систему для просмотра профиля.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Профиль</h1>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Статус подписки:</strong>{" "}
        {hasSubscription === null
          ? "Загрузка..."
          : hasSubscription
          ? "✅ Активна"
          : "❌ Неактивна"}
      </p>
      <button onClick={handleLogout}>Выйти</button>
      <SubscribeButton />
    </div>
  );
}

export default ProfilePage;
