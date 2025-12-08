import { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navigation from "../components/Navigation";

export default function AdminGuard() {
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Force refresh token to get latest claims
          const tokenResult = await user.getIdTokenResult(true);
          // Check for admin claim
          if (tokenResult.claims.admin === true) {
            setIsAdmin(true);
          } else {
            console.warn("User is not admin");
            setIsAdmin(false);
          }
        } catch (e) {
          console.error("Error checking admin status:", e);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <Navigation />
        <div className="pt-32 px-6 text-center text-gray-500">
          Проверка прав администратора...
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    // Redirect to home if not admin
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

