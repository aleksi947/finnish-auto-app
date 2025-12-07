import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";

export function useSubscription() {
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let unsubscribeDoc = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        setLoading(true);
        const ref = doc(db, "subscriptions", currentUser.uid);
        
        // Подписываемся на изменения документа в реальном времени
        unsubscribeDoc = onSnapshot(ref, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            let isActive = data.active === true;

            // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА ДЛЯ РАЗОВЫХ ПЛАТЕЖЕЙ
            // Если это разовый платеж и срок истек -> считаем неактивной
            if (isActive && data.type === 'one_time' && data.validUntil) {
              const now = new Date();
              const validUntilDate = data.validUntil.toDate ? data.validUntil.toDate() : new Date(data.validUntil);
              
              if (validUntilDate < now) {
                isActive = false;
              }
            }

            setHasSubscription(isActive);
            setSubscriptionData(data);
          } else {
            setHasSubscription(false);
            setSubscriptionData(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Ошибка подписки на данные:", error);
          setHasSubscription(false);
          setSubscriptionData(null);
          setLoading(false);
        });
      } else {
        setHasSubscription(false);
        setSubscriptionData(null);
        setLoading(false);
        unsubscribeDoc(); // Отписываемся, если вышли
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDoc();
    };
  }, []);

  return { hasSubscription, subscriptionData, loading, user };
}
