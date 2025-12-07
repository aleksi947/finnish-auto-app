import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export function useSubscription() {
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const ref = doc(db, "subscriptions", currentUser.uid);
          const snap = await getDoc(ref);
          if (snap.exists() && snap.data().active === true) {
            setHasSubscription(true);
            setSubscriptionData(snap.data());
          } else {
            setHasSubscription(false);
            setSubscriptionData(null);
          }
        } catch (error) {
          console.error("Ошибка проверки подписки:", error);
          setHasSubscription(false);
          setSubscriptionData(null);
        }
      } else {
        setHasSubscription(false);
        setSubscriptionData(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { hasSubscription, subscriptionData, loading, user };
}
