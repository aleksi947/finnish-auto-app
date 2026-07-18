import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import Navigation from "../components/Navigation";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/label";
import { MessageCircle, Send, Star } from "lucide-react";
import toast from "react-hot-toast";

const initialForm = {
  type: "review",
  name: "",
  email: "",
  subject: "",
  message: "",
  rating: 5,
  website: "",
  privacyAccepted: false,
};

export default function FeedbackPage() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.type === "question" && !form.email.trim()) {
      toast.error("Укажите электронную почту, чтобы мы могли ответить");
      return;
    }

    if (form.message.trim().length < 10) {
      toast.error("Напишите сообщение длиной не менее 10 символов");
      return;
    }

    setSubmitting(true);
    try {
      const submitFeedback = httpsCallable(functions, "submitFeedback");
      await submitFeedback(form);
      toast.success("Спасибо! Сообщение отправлено");
      setForm(initialForm);
    } catch (error) {
      console.error("Ошибка отправки обратной связи:", error);
      const message = error?.message?.includes("resource-exhausted")
        ? "Слишком много сообщений. Попробуйте позже"
        : "Не удалось отправить сообщение. Попробуйте ещё раз";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EAF5FF] to-[#CDE8FF]">
      <Navigation />

      <main className="px-4 pb-16 pt-28 sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <MessageCircle className="h-7 w-7" />
            </div>
            <h1 className="mb-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
              Обратная связь
            </h1>
            <p className="mx-auto max-w-2xl text-slate-600 sm:text-lg">
              Поделитесь впечатлениями о приложении или задайте вопрос.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-blue-200 bg-white p-6 shadow-xl sm:p-9"
          >
            <div className="mb-7 grid grid-cols-2 gap-3 rounded-2xl bg-slate-100 p-1.5">
              {[
                ["review", "Оставить отзыв"],
                ["question", "Задать вопрос"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateField("type", value)}
                  className={`rounded-xl px-3 py-3 text-sm font-medium transition-colors sm:text-base ${
                    form.type === value
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {form.type === "review" && (
              <fieldset className="mb-6">
                <legend className="mb-2 text-sm font-medium text-slate-800">
                  Ваша оценка
                </legend>
                <div className="flex gap-1" aria-label="Оценка от 1 до 5">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateField("rating", value)}
                      className="rounded-lg p-1.5 transition-transform hover:scale-110"
                      aria-label={`${value} из 5`}
                    >
                      <Star
                        className={`h-8 w-8 ${
                          value <= form.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="feedback-name">Имя (необязательно)</Label>
                <Input
                  id="feedback-name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  maxLength={80}
                  placeholder="Как к вам обращаться"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-email">
                  Электронная почта {form.type === "question" ? "*" : "(необязательно)"}
                </Label>
                <Input
                  id="feedback-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  maxLength={254}
                  required={form.type === "question"}
                  placeholder="example@mail.com"
                />
              </div>
            </div>

            {form.type === "question" && (
              <div className="mt-5 space-y-2">
                <Label htmlFor="feedback-subject">Тема вопроса *</Label>
                <Input
                  id="feedback-subject"
                  value={form.subject}
                  onChange={(event) => updateField("subject", event.target.value)}
                  minLength={3}
                  maxLength={120}
                  required
                  placeholder="Кратко опишите тему"
                />
              </div>
            )}

            <div className="mt-5 space-y-2">
              <Label htmlFor="feedback-message">
                {form.type === "review" ? "Ваш отзыв *" : "Ваш вопрос *"}
              </Label>
              <textarea
                id="feedback-message"
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                minLength={10}
                maxLength={2000}
                required
                rows={7}
                placeholder={
                  form.type === "review"
                    ? "Что вам понравилось или что можно улучшить?"
                    : "Опишите ваш вопрос подробнее"
                }
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <div className="text-right text-xs text-slate-500">
                {form.message.length} / 2000
              </div>
            </div>

            <div className="absolute -left-[10000px]" aria-hidden="true">
              <Label htmlFor="feedback-website">Сайт</Label>
              <Input
                id="feedback-website"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(event) => updateField("website", event.target.value)}
              />
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.privacyAccepted}
                onChange={(event) => updateField("privacyAccepted", event.target.checked)}
                required
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span>
                Я согласен на обработку указанных данных для рассмотрения моего сообщения.
              </span>
            </label>

            <Button
              type="submit"
              disabled={submitting}
              className="mt-7 w-full bg-blue-600 py-6 text-base text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <Send className="mr-2 h-5 w-5" />
              {submitting ? "Отправляем..." : "Отправить"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
