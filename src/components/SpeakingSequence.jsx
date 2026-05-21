import { useState, useEffect, useRef } from "react";
import { Mic, Volume2 } from "lucide-react";

/* ---------- NUMBER DICTIONARIES ---------- */
const UNITS = {
  nolla: 0,
  yksi: 1,
  kaksi: 2,
  kolme: 3,
  nelja: 4,
  neljä: 4,
  viisi: 5,
  kuusi: 6,
  seitseman: 7,
  seitsemän: 7,
  kahdeksan: 8,
  yhdeksan: 9,
  yhdeksän: 9,
};
const TEENS = {
  kymmenen: 10,
  yksitoista: 11,
  kaksitoista: 12,
  kolmetoista: 13,
  neljatoista: 14,
  neljätoista: 14,
  viisitoista: 15,
  kuusitoista: 16,
  seitsemantoista: 17,
  seitsemäntoista: 17,
  kahdeksantoista: 18,
  yhdeksantoista: 19,
  yhdeksäntoista: 19,
};
const TENS = {
  kaksikymmenta: 20,
  kaksikymmentä: 20,
  kolmekymmenta: 30,
  kolmekymmentä: 30,
  neljakymmenta: 40,
  neljäkymmentä: 40,
  viisikymmenta: 50,
  viisikymmentä: 50,
  kuusikymmenta: 60,
  kuusikymmentä: 60,
  seitsemankymmenta: 70,
  seitsemänkymmentä: 70,
  kahdeksankymmenta: 80,
  kahdeksankymmentä: 80,
  yhdeksankymmenta: 90,
  yhdeksänkymmentä: 90,
};

/* ---------- COMPARISON UTILITIES ---------- */
function toNumberFi(raw) {
  if (!raw) return NaN;
  const s = String(raw)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

  const digits = s.match(/\d+/);
  if (digits) return Number(digits[0]);

  if (UNITS[s] != null) return UNITS[s];
  if (TEENS[s] != null) return TEENS[s];
  if (TENS[s] != null) return TENS[s];

  const parts = s.split(" ");
  if (parts.length === 2 && TENS[parts[0]] != null && UNITS[parts[1]] != null) {
    return TENS[parts[0]] + UNITS[parts[1]];
  }
  return NaN;
}

function normalize(str) {
  return (str ?? "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^mina\s+/, "")
    .replace(/^han\s+/, "")
    .replace(/[^a-z0-9\s-]/gi, "")
    .replace(/\s+/g, " ");
}

function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}
function allowedEdits(a, b) {
  const L = Math.max(a.length, b.length);
  if (L <= 3) return 0;
  if (L <= 6) return 1;
  return 2;
}
function parseAnyNumber(s) {
  const n = toNumberFi(s);
  return Number.isInteger(n) ? n : NaN;
}
function isCorrectAnswer(user, answerList, answerNumber) {
  const nUser = parseAnyNumber(user);

  if (Number.isInteger(answerNumber) && Number.isInteger(nUser)) {
    return nUser === answerNumber;
  }

  for (const a of answerList) {
    const nA = parseAnyNumber(a);
    if (Number.isInteger(nUser) || Number.isInteger(nA)) {
      if (Number.isInteger(nUser) && Number.isInteger(nA) && nUser === nA) {
        return true;
      }
      continue;
    }
    const sUser = normalize(user);
    const sAns = normalize(a);
    if (!sUser || !sAns) continue;

    const dist = levenshteinDistance(sUser, sAns);
    if (sUser === sAns || dist <= allowedEdits(sUser, sAns)) {
      return true;
    }
  }
  return false;
}

/* ---------- COMPONENT ---------- */
function SpeakingSequence({ task, onMarkStarted, onMarkCompleted }) {
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [spokenText, setSpokenText] = useState("");
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState("");
  const [finished, setFinished] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [mistakes, setMistakes] = useState([]);
  const [answers, setAnswers] = useState([]); // Array tracking answer correctness
  const [hasMarkedStarted, setHasMarkedStarted] = useState(false); // Flag tracking first answer

  // Audio / speech
  const audioRef = useRef(null);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const isMountedRef = useRef(true);

  /* --- Init from task --- */
  useEffect(() => {
    if (!task?.items) return;
    setItems([...task.items].sort(() => Math.random() - 0.5));
    setIndex(0);
    setSpokenText("");
    setListening(false);
    setResult("");
    setFinished(false);
    setCorrectCount(0);
    setWrongCount(0);
    setMistakes([]);
    setAnswers([]);
    setHasMarkedStarted(false);
  }, [task]);

  /* --- Cleanup on unmount --- */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
          audioRef.current.load?.();
          audioRef.current = null;
        }
      } catch {}
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  const current = items[index];

  /* ---------- Speech recognition ---------- */
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      // optional: show subtle text instead of alerting
      setResult("⚠️ Ваш браузер не поддерживает распознавание речи.");
      return;
    }

    const recognition = new SR();
    recognition.lang = "fi-FI";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSpokenText(transcript);

      const answerList = Array.isArray(current.answer)
        ? current.answer
        : [current.answer];

      const ok = isCorrectAnswer(transcript, answerList, current.answerNumber);

      // Mark exercise started on first answer
      if (!hasMarkedStarted && onMarkStarted) {
        onMarkStarted();
        setHasMarkedStarted(true);
      }

      // Save answer result
      setAnswers((prev) => [...prev, { questionIndex: index, isCorrect: ok }]);

      if (ok) {
        setResult("✅ Правильно!");
        setCorrectCount((c) => c + 1);
      } else {
        const correctShow =
          current.correctDisplay ||
          (Array.isArray(current.answer)
            ? current.answer.join(" / ")
            : String(current.answer));
        setResult(`❌ Неправильно. Правильный ответ: ${correctShow}`);
        setWrongCount((w) => w + 1);
        setMistakes((m) => [...m, current]);
      }

      setListening(false);
    };

    recognition.onerror = () => {
      setResult("⚠️ Ошибка распознавания. Попробуйте ещё раз.");
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
    setResult("");
  };

  /* ---------- Question navigation ---------- */
  const handleNext = () => {
    stopSpeaking();
    setSpokenText("");
    setResult("");
    if (index < items.length - 1) setIndex((i) => i + 1);
    else setFinished(true);
  };

  const restartMistakes = () => {
    stopSpeaking();
    const reshuffled = [...mistakes].sort(() => Math.random() - 0.5);
    setItems(reshuffled);
    setIndex(0);
    setSpokenText("");
    setListening(false);
    setResult("");
    setFinished(false);
    setCorrectCount(0);
    setWrongCount(0);
    setMistakes([]);
    setAnswers([]);
    setHasMarkedStarted(false);
  };

  // Check all answers correct on finish
  // IMPORTANT: this useEffect must run BEFORE any early return
  useEffect(() => {
    if (finished && answers.length === items.length && items.length > 0) {
      const allCorrect = answers.every(a => a.isCorrect);
      if (onMarkCompleted) {
        onMarkCompleted(allCorrect);
      }
    }
  }, [finished, answers, items.length, onMarkCompleted]);

  /* ---------- Model answer playback ---------- */
  function getModelAnswerText(it) {
    if (!it) return "";
    if (it.audioText) return it.audioText;
    const answers = Array.isArray(it.answer) ? it.answer : [it.answer];
    return answers.filter(Boolean)[0] || "";
  }

  function stopSpeaking() {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch {}
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }

  // path with BASE_URL
  function resolveAudioPath(p) {
    if (!p) return "";
    try {
      return new URL(
        p,
        window.location.origin + (import.meta.env.BASE_URL || "/")
      ).href;
    } catch {
      return p;
    }
  }

  async function playModelAnswer() {
    stopSpeaking();

    // 1) try local audio file
    if (current?.audioUrl) {
      try {
        if (!audioRef.current) {
          const a = new Audio();
          a.preload = "auto";
          a.onended = () => {
            if (isMountedRef.current) setSpeaking(false);
          };
          a.onerror = () => {
            // silently ignore abort on navigation/unmount
            if (isMountedRef.current) setSpeaking(false);
          };
          audioRef.current = a;
        }
        const a = audioRef.current;
        a.src = resolveAudioPath(current.audioUrl);
        a.load();
        setSpeaking(true);
        await a.play();
        return;
      } catch (err) {
        // Ignore system aborts and fall back to TTS
        if (isMountedRef.current) setSpeaking(false);
      }
    }

    // 2) fallback: TTS
    if (!("speechSynthesis" in window)) {
      return;
    }
    const text = getModelAnswerText(current);
    if (!text) return;

    const utter = new SpeechSynthesisUtterance(text);
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices() || [];
      return (
        voices.find((v) => v.lang?.toLowerCase().startsWith("fi")) ||
        voices.find((v) => v.lang?.toLowerCase().includes("fi")) ||
        null
      );
    };

    let voice = pickVoice();
    if (!voice) {
      await new Promise((res) => {
        const id = setInterval(() => {
          const v = pickVoice();
          if (v) {
            voice = v;
            clearInterval(id);
            res(null);
          }
        }, 100);
        setTimeout(() => {
          clearInterval(id);
          res(null);
        }, 1500);
      });
    }
    if (voice) utter.voice = voice;
    utter.lang = "fi-FI";
    utter.rate = 0.95;
    utter.onend = () => {
      if (isMountedRef.current) setSpeaking(false);
    };
    utter.onerror = () => {
      if (isMountedRef.current) setSpeaking(false);
    };

    setSpeaking(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  /* ---------- RENDER ---------- */
  const totalQuestions = items.length;
  const progressPercentage = totalQuestions > 0 ? ((index + 1) / totalQuestions) * 100 : 0;

  if (finished) {
    const successRate = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    
    return (
      <div className="w-full">
        {/* Results card */}
        <div className="bg-white rounded-xl md:rounded-2xl border-2 border-[#E5E7EB] shadow-lg p-4 md:p-6 lg:p-8 mb-4 md:mb-6">
          <h3 className="text-xl md:text-2xl font-semibold text-[#1E293B] mb-4 md:mb-6 text-center">
            Результаты упражнения
          </h3>
          
          {/* Statistics */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
            {/* Correct answers */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 text-center">
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-green-600 mb-1 md:mb-2">{correctCount}</div>
              <div className="text-xs md:text-sm lg:text-lg text-green-700 font-medium">Правильных</div>
            </div>
            
            {/* Mistakes */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 text-center">
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-red-600 mb-1 md:mb-2">{wrongCount}</div>
              <div className="text-xs md:text-sm lg:text-lg text-red-700 font-medium">Ошибок</div>
            </div>
          </div>
          
          {/* Success rate */}
          <div className="mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base md:text-lg text-[#4A5568] font-medium">Процент успеха</span>
              <span className="text-lg md:text-xl font-bold text-[#1E293B]">{successRate}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  successRate >= 70 ? 'bg-green-500' : successRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col gap-2 md:gap-3">
            {/* Retry mistakes button */}
            {mistakes.length > 0 && (
              <button 
                onClick={restartMistakes}
                className="w-full bg-[#1471F6] hover:bg-[#0E5CD4] active:bg-[#0D52C0] text-white font-medium py-3 md:py-4 px-4 md:px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 text-sm md:text-base active:scale-95"
              >
                <span>🔁</span>
                <span className="truncate">Повторить ошибки ({mistakes.length})</span>
              </button>
            )}
            
            {/* Finish button */}
            <button 
              onClick={() => window.history.back()}
              className={`w-full font-medium py-3 md:py-4 px-4 md:px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 text-sm md:text-base active:scale-95 ${
                mistakes.length > 0 
                  ? 'bg-white border-2 border-[#1471F6] text-[#1471F6] hover:bg-[#F0F7FF] active:bg-[#E5F0FF]' 
                  : 'bg-[#1471F6] hover:bg-[#0E5CD4] active:bg-[#0D52C0] text-white'
              }`}
            >
              <span>✓</span>
              <span>Завершить</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!current) {
    return <p className="text-red-600">❌ Ошибка загрузки задания</p>;
  }

  return (
    <div className="w-full">
      {/* Header with Title and Progress */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-gray-800 text-xl md:text-2xl lg:text-3xl font-normal">Упражнение на говорение</h1>
        <span className="text-gray-600 text-lg md:text-xl lg:text-2xl whitespace-nowrap ml-4">
          {index + 1}/{totalQuestions}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 md:mb-8">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-500 rounded-full bg-[#1471F6]"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Instruction with Icon */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl md:text-3xl">📢</span>
          <p className="text-gray-800 text-lg md:text-xl lg:text-2xl font-normal">Скажите по-фински:</p>
        </div>
        
        {/* Phrase to Translate */}
        <p className="text-gray-800 text-xl md:text-2xl lg:text-3xl ml-8 md:ml-12 font-normal">
          {current.prompt}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 md:mb-8 mt-6 md:mt-8">
        <button
          onClick={startListening}
          disabled={listening || speaking}
          className="bg-[#1471F6] hover:bg-[#0E5CD4] active:bg-[#0D52C0] disabled:opacity-70 disabled:cursor-not-allowed text-white px-6 md:px-8 py-4 md:py-6 text-lg md:text-xl rounded-xl md:rounded-2xl flex items-center justify-center gap-3 flex-1 transition-colors duration-200 active:scale-95"
        >
          <Mic className="size-5 md:size-6 flex-shrink-0" />
          {listening ? "Запись..." : "Говорить"}
        </button>
        
        <button
          onClick={playModelAnswer}
          disabled={listening || speaking}
          className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-70 disabled:cursor-not-allowed text-gray-800 px-6 md:px-8 py-4 md:py-6 text-lg md:text-xl rounded-xl md:rounded-2xl flex items-center justify-center gap-3 transition-colors duration-200 active:scale-95"
        >
          <Volume2 className="size-5 md:size-6 flex-shrink-0" />
          Прослушать фразу
        </button>
      </div>

      {/* Stop button when speaking */}
      {speaking && (
        <button
          onClick={stopSpeaking}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 text-base md:text-lg rounded-xl transition-colors duration-200 mb-4 active:scale-95"
        >
          ⏹ Остановить
        </button>
      )}

      {/* Spoken text and result */}
      {spokenText && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-700 font-medium mb-1">Вы сказали:</p>
          <p className="text-base md:text-lg text-blue-900 font-semibold">{spokenText}</p>
        </div>
      )}
      
      {result && (
        <div className={`mb-4 p-4 rounded-xl border-2 ${
          result.includes("✅") 
            ? "bg-green-50 border-green-200" 
            : result.includes("❌")
            ? "bg-red-50 border-red-200"
            : "bg-yellow-50 border-yellow-200"
        }`}>
          <p className={`text-base md:text-lg ${
            result.includes("✅") 
              ? "text-green-800" 
              : result.includes("❌")
              ? "text-red-800"
              : "text-yellow-800"
          }`}>
            {result}
          </p>
        </div>
      )}

      {/* Next button */}
      {result && (
        <button
          onClick={handleNext}
          className="w-full px-6 py-3 md:px-8 md:py-4 bg-[#1471F6] hover:bg-[#0E5CD4] active:bg-[#0D52C0] text-white rounded-xl md:rounded-2xl cursor-pointer transition-colors font-medium text-base md:text-lg mt-4 md:mt-6 active:scale-95"
        >
          {index + 1 === items.length ? "Завершить" : "Следующий вопрос →"}
        </button>
      )}

      {/* Tips Section */}
      <div className="mt-6 md:mt-8">
        <h3 className="text-gray-800 text-lg md:text-xl mb-3 font-medium">Советы:</h3>
        <div className="space-y-2 text-gray-700 text-base md:text-lg">
          <p>– Постарайтесь произнести фразу полностью</p>
          <p>– Слушайте оригинал и повторяйте</p>
        </div>
      </div>
    </div>
  );
}

export default SpeakingSequence;
