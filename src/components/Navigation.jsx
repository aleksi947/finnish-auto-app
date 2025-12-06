// src/components/Navigation.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { FinnishFlagLogo } from "./ui/FinnishFlagLogo";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

import { auth } from "../firebase";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import toast from "react-hot-toast";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [user, setUser] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  
  // Проверяем, находимся ли мы на главной странице
  const isHomePage = location.pathname === "/";

  // следим за авторизацией
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("🚪 Вы вышли из аккаунта");
      setIsMenuOpen(false);
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Не удалось выйти");
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        toast.success("✅ Вход выполнен");
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        toast.success("🎉 Регистрация выполнена");
      }
      setIsLoginOpen(false);
      setEmail("");
      setPassword("");
      setIsMenuOpen(false);
      navigate("/profile");
    } catch (err) {
      console.error(err);
      // Firebase возвращает код ошибки — можно показать его пользователю
      toast.error(err?.message || "Ошибка авторизации");
    }
  };

  return (
    <nav className={`absolute inset-x-0 top-0 z-50 transition-all duration-300 ${
      isHomePage 
        ? "bg-black/20 backdrop-blur-sm" 
        : "bg-gradient-to-r from-[#5B9BD5] to-[#4A90E2] shadow-lg shadow-blue-500/30"
    }`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Логотип → главная */}
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
            <Link to="/profile" className="text-white/90 transition-colors hover:text-white">
              Профиль
            </Link>
            
            <Link to="/subscription" className="text-white/90 transition-colors hover:text-white">
              Подписка
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button className="text-white transition-colors">RU</button>
              <span className="text-white/50">/</span>
              <button className="text-white/90 transition-colors hover:text-white">
                EN
              </button>
            </div>

            {!user ? (
              <Button
                variant="outline"
                className="border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                onClick={() => {
                  setAuthMode("login");
                  setIsLoginOpen(true);
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
                setAuthMode("login");
                setIsLoginOpen(true);
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
            aria-label="Toggle menu"
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
            <Link
              to="/profile"
              className="py-2 text-white/90 transition-colors hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Профиль
            </Link>
            <Link
              to="/subscription"
              className="py-2 text-white/90 transition-colors hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Подписка
            </Link>
            <div className="mt-2 flex items-center gap-2 border-t border-white/20 pt-4">
              <button className="text-white transition-colors">RU</button>
              <span className="text-white/50">/</span>
              <button className="text-white/90 transition-colors hover:text-white">
                EN
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Login/Register modal */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              {authMode === "login" ? "Вход" : "Регистрация"}
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-500">
              {authMode === "login"
                ? "Введите свой email и пароль, чтобы войти"
                : "Создайте аккаунт, указав email и пароль"}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-2" onSubmit={handleAuthSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@mail.com"
                className="w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700">
              {authMode === "login" ? "Войти" : "Зарегистрироваться"}
            </Button>

            <div className="pt-2 text-center text-sm">
              {authMode === "login" ? (
                <>
                  Нет аккаунта?{" "}
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                    onClick={() => setAuthMode("register")}
                  >
                    Регистрация
                  </button>
                </>
              ) : (
                <>
                  Уже есть аккаунт?{" "}
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                    onClick={() => setAuthMode("login")}
                  >
                    Войти
                  </button>
                </>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
