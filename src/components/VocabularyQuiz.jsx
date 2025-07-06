import { useState } from "react";


function VocabularyQuiz({ words, lang, onFinish }) {
  const [current, setCurrent] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const generateOptions = (correct) => {
    const translations = words
      .map((w) => w.translations[lang])
      .filter((t) => t !== correct);
    const random = translations.sort(() => 0.5 - Math.random()).slice(0, 2);
    return [correct, ...random].sort(() => 0.5 - Math.random());
  };

  const handleAnswer = (selected) => {
    const correct = words[current].translations[lang];
    if (selected === correct) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setWrongCount((prev) => prev + 1);
    }

    if (current + 1 < words.length) {
      setCurrent((prev) => prev + 1);
    } else {
      setFinished(true);
    }
  };

  return (
    <div style={{ marginTop: 30 }}>
      {finished ? (
        <div>
          <h3>Результат:</h3>
          <p>✅ Правильных: {correctCount}</p>
          <p>❌ Ошибок: {wrongCount}</p>
          <button onClick={onFinish}>Завершить</button>
        </div>
      ) : (
        <div>
          <h3>
            {current + 1}/{words.length} — Что значит:{" "}
            <strong>{words[current].fi}</strong>?
          </h3>
          {generateOptions(words[current].translations[lang]).map(
            (option, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(option)}
                style={{ display: "block", margin: "5px 0" }}
              >
                {option}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default VocabularyQuiz;
