import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { getIdToken } from "firebase/auth";
import axios from "axios";
import toast from "react-hot-toast";

const startUrl = import.meta.env.VITE_FUNCTIONS_START_CHECKOUT;
const stopUrl = import.meta.env.VITE_FUNCTIONS_STOP_SUBSCRIPTION;

function SubscribeButton() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const ref = doc(db, "subscriptions", firebaseUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().active) {
          setIsSubscribed(true);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubscribe = async () => {
    if (!user) return toast.error("❗ Войдите в аккаунт.");
    try {
      const idToken = await getIdToken(user, true);
      toast.loading("⏳ Перенаправляем в Stripe...");
      const res = await axios.post(
        startUrl,
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      toast.dismiss();
      toast.success("✅ Перенаправление...");
      window.location.href = res.data.url;
    } catch (err) {
      toast.dismiss();
      console.error("Ошибка запуска Stripe Checkout:", err);
      toast.error("❌ Ошибка оформления подписки");
    }
  };

  const handleCancel = async () => {
    if (!user) return toast.error("❗ Войдите в аккаунт.");
    try {
      const idToken = await getIdToken(user, true);
      await axios.post(
        stopUrl,
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      toast.success("📅 Подписка отменена, действует до конца периода.");
      setIsSubscribed(false);
    } catch (err) {
      console.error("Ошибка отмены подписки:", err);
      toast.error("❌ Не удалось отменить подписку");
    }
  };

  if (loading) return <p>Загрузка...</p>;

  return isSubscribed ? (
    <button onClick={handleCancel}>❌ Отменить подписку</button>
  ) : (
    <button onClick={handleSubscribe}>🔥 Оформить подписку</button>
  );
}

export default SubscribeButton;
