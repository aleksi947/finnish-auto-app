// src/components/Navigation.jsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { FinnishFlagLogo } from "./ui/FinnishFlagLogo";
import { Button } from "./ui/button";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import toast from "react-hot-toast";
import { SUBSCRIPTIONS_ENABLED } from "../config/features";
import { useAuthDialog } from "../hooks/useAuthDialog";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, openAuth } = useAuthDialog();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if on home page
  const isHomePage = location.pathname === "/";

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("🚪 Вы вышли из аккаунта");
      setIsMenuOpen(false);
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Не удалось выйти из аккаунта");
    }
  };

  const handleProfileClick = () => {
    if (user) {
      navigate("/profile");
    } else {
      openAuth({ mode: "login", returnTo: "/profile" });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className={`absolute inset-x-0 top-0 z-50 transition-all duration-300 ${
      isHomePage 
        ? "bg-black/20 backdrop-blur-sm" 
        : "bg-gradient-to-r from-[#5B9BD5] to-[#4A90E2] shadow-lg shadow-blue-500/30"
    }`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo → home */}
        <Link to="/" className="flex items-center gap-2">
          <FinnishFlagLogo />
        </Link>

        {/* Desktop menu */}
        <div className="hidden items-center gap-8 md:flex">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-white/90 transition-colors hover:text-white">
              Главная
            </Link>
            <Link to="/lessons" className="text-white/90 transition-colors hover:text-white">
              Уроки
            </Link>
            <button
              type="button"
              onClick={handleProfileClick}
              className="text-white/90 transition-colors hover:text-white"
            >
              Профиль
            </button>
            <Link to="/feedback" className="text-white/90 transition-colors hover:text-white">
              Обратная связь
            </Link>
            
            {SUBSCRIPTIONS_ENABLED && (
              <Link to="/subscription" className="text-white/90 transition-colors hover:text-white">
                Подписка
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-white/90">Русский</span>

            {!user ? (
              <Button
                variant="outline"
                className="border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                onClick={() => {
                  openAuth({ mode: "login" });
                }}
              >
                Войти
              </Button>
            ) : (
              <Button
                variant="outline"
                className="border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                onClick={handleLogout}
              >
                Выйти
              </Button>
            )}
          </div>
        </div>

        {/* Mobile bar */}
        <div className="flex items-center gap-3 md:hidden">
          {!user ? (
            <Button
              variant="outline"
              size="sm"
              className="border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
              onClick={() => {
                openAuth({ mode: "login" });
              }}
            >
              Войти
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
              onClick={handleLogout}
            >
              Выйти
            </Button>
          )}

          <button
            className="p-2 text-white"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-label="Открыть меню"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className={`px-6 py-4 ${
          isHomePage 
            ? "bg-black/30 backdrop-blur-sm" 
            : "bg-gradient-to-r from-[#5B9BD5] to-[#4A90E2]"
        }`}>
          <div className="flex flex-col gap-4">
            <Link
              to="/"
              className="py-2 text-white/90 transition-colors hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Главная
            </Link>
            <Link
              to="/lessons"
              className="py-2 text-white/90 transition-colors hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Уроки
            </Link>
            <button
              type="button"
              className="py-2 text-white/90 transition-colors hover:text-white"
              onClick={handleProfileClick}
            >
              Профиль
            </button>
            <Link
              to="/feedback"
              className="py-2 text-white/90 transition-colors hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Обратная связь
            </Link>
            {SUBSCRIPTIONS_ENABLED && (
              <Link
                to="/subscription"
                className="py-2 text-white/90 transition-colors hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Подписка
              </Link>
            )}
            <div className="mt-2 border-t border-white/20 pt-4 text-white/90">
              Русский язык
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
