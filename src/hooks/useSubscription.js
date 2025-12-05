import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export function useSubscription() {
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const ref = doc(db, "subscriptions", currentUser.uid);
          const snap = await getDoc(ref);
          setHasSubscription(snap.exists() && snap.data().active === true);
        } catch (error) {
          console.error("Ошибка проверки подписки:", error);
          setHasSubscription(false);
        }
      } else {
        setHasSubscription(false);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { hasSubscription, loading, user };
}

