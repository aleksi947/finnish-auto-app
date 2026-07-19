import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import toast from "react-hot-toast";
import { auth } from "../firebase";
import { AuthDialogContext } from "../contexts/AuthDialogContext";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/Input";
import { Label } from "./ui/label";

function getAuthErrorMessage(error) {
  switch (error.code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Неверная электронная почта или пароль";
    case "auth/email-already-in-use":
      return "Эта электронная почта уже зарегистрирована";
    case "auth/too-many-requests":
      return "Слишком много попыток. Попробуйте позже";
    case "auth/weak-password":
      return "Слишком простой пароль — нужно минимум 6 символов";
    case "auth/invalid-email":
      return "Неверный формат электронной почты";
    default:
      return "Ошибка авторизации. Попробуйте ещё раз";
  }
}

export default function AuthDialogProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("login");
  const [reason, setReason] = useState("default");
  const [returnTo, setReturnTo] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
      }),
    [],
  );

  const openAuth = useCallback(
    ({ mode: nextMode = "login", reason: nextReason = "default", returnTo: nextReturnTo = null } = {}) => {
      setMode(nextMode);
      setReason(nextReason);
      setReturnTo(nextReturnTo);
      setIsOpen(true);
    },
    [],
  );

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) setPassword("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      let credential;
      if (mode === "login") {
        credential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        toast.success("Вход выполнен");
      } else {
        credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        toast.success("Регистрация завершена");
      }

      const target = returnTo || "/profile";
      setUser(credential.user);
      setIsOpen(false);
      setEmail("");
      setPassword("");
      setReturnTo(null);
      navigate(target, { replace: true });
    } catch (error) {
      console.error("Ошибка авторизации:", error);
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLessonReason = reason === "lesson";
  const title =
    mode === "register"
      ? "Создайте бесплатный аккаунт"
      : isLessonReason
        ? "Войдите, чтобы начать урок"
        : "Вход";
  const description = isLessonReason
    ? mode === "register"
      ? "Все уроки сейчас бесплатные. Аккаунт нужен, чтобы проходить их и сохранять прогресс."
      : "Войдите, чтобы открыть урок и продолжить обучение с сохранённого места."
    : mode === "register"
      ? "Создайте аккаунт, чтобы сохранять прогресс"
      : "Введите электронную почту и пароль";

  const value = useMemo(
    () => ({ user, authLoading, openAuth }),
    [authLoading, openAuth, user],
  );

  return (
    <AuthDialogContext.Provider value={value}>
      {children}

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">{title}</DialogTitle>
            <DialogDescription className="text-center text-sm leading-6 text-gray-500">
              {description}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="auth-email">Электронная почта</Label>
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="example@mail.com"
                className="w-full"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-password">Пароль</Label>
              <Input
                id="auth-password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="Минимум 6 символов"
                className="w-full"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              {isSubmitting
                ? "Подождите..."
                : mode === "login"
                  ? "Войти"
                  : "Зарегистрироваться"}
            </Button>

            <div className="pt-2 text-center text-sm">
              {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
              <button
                type="button"
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
              >
                {mode === "login" ? "Зарегистрироваться" : "Войти"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AuthDialogContext.Provider>
  );
}
