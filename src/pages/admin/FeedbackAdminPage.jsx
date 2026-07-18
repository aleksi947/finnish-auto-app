import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import Navigation from "../../components/Navigation";
import { Button } from "../../components/ui/button";
import { CheckCircle2, Mail, MessageCircle, Star } from "lucide-react";
import toast from "react-hot-toast";

const statusLabels = {
  new: "Новое",
  read: "Прочитано",
  answered: "Отвечено",
};

export default function FeedbackAdminPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const feedbackQuery = query(
      collection(db, "feedback"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(
      feedbackQuery,
      (snapshot) => {
        setItems(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("Ошибка загрузки обращений:", error);
        toast.error("Не удалось загрузить обращения");
        setLoading(false);
      }
    );
  }, []);

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "review" || filter === "question") {
      return items.filter((item) => item.type === filter);
    }
    return items.filter((item) => item.status === filter);
  }, [filter, items]);

  const setStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "feedback", id), { status });
      toast.success("Статус обновлён");
    } catch (error) {
      console.error("Ошибка обновления статуса:", error);
      toast.error("Не удалось изменить статус");
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const date = value.toDate ? value.toDate() : new Date(value);
    return date.toLocaleString("ru-RU");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-28 sm:px-6 sm:pt-32">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Обратная связь</h1>
            <p className="mt-2 text-slate-600">Отзывы и вопросы пользователей</p>
          </div>
          <div className="rounded-xl bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            Новых: <strong>{items.filter((item) => item.status === "new").length}</strong>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {[
            ["all", "Все"],
            ["new", "Новые"],
            ["review", "Отзывы"],
            ["question", "Вопросы"],
            ["answered", "Отвеченные"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-700 hover:bg-blue-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-slate-500">
            Загрузка...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-slate-500">
            Обращений пока нет
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.type === "review"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {item.type === "review" ? "Отзыв" : "Вопрос"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {statusLabels[item.status] || item.status}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {item.subject || (item.type === "review" ? "Отзыв о приложении" : "Вопрос")}
                    </h2>
                  </div>
                  <time className="text-sm text-slate-500">{formatDate(item.createdAt)}</time>
                </div>

                {item.type === "review" && (
                  <div className="mb-3 flex items-center gap-1 text-amber-400">
                    {Array.from({ length: item.rating || 0 }).map((_, index) => (
                      <Star key={index} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                )}

                <p className="whitespace-pre-wrap text-slate-700">{item.message}</p>

                <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <MessageCircle className="h-4 w-4" />
                      {item.name || "Без имени"}
                    </span>
                    {item.email && (
                      <a className="inline-flex items-center gap-1.5 text-blue-700 hover:underline" href={`mailto:${item.email}?subject=${encodeURIComponent(`Ответ: ${item.subject || "обратная связь"}`)}`}>
                        <Mail className="h-4 w-4" />
                        {item.email}
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {item.status === "new" && (
                      <Button variant="outline" onClick={() => setStatus(item.id, "read")}>
                        Прочитано
                      </Button>
                    )}
                    {item.status !== "answered" && (
                      <Button onClick={() => setStatus(item.id, "answered")} className="bg-green-600 text-white hover:bg-green-700">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Отвечено
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
