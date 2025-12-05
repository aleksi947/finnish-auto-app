import { useState } from "react";

function ListeningFillInText({ task }) {
  const [inputs, setInputs] = useState(Array(task.gaps.length).fill(""));
  const [checked, setChecked] = useState(false);
  const [mistakes, setMistakes] = useState([]);
  const [showRetry, setShowRetry] = useState(false);

  // 🔧 Функция нормализации текста
  const normalize = (str) =>
    str
      .trim()
      .toLowerCase()
      .replace(/[.,!?;:]/g, "");

  const handleChange = (index, value) => {
    const updated = [...inputs];
    updated[index] = value;
    setInputs(updated);
  };

  const handleCheck = () => {
    const wrong = [];
    task.gaps.forEach((gap, i) => {
      if (normalize(inputs[i]) !== normalize(gap)) {
        wrong.push(i);
      }
    });
    setMistakes(wrong);
    setChecked(true);
    setShowRetry(wrong.length > 0);
  };

  const handleRetry = () => {
    const updated = [...inputs];
    mistakes.forEach((i) => {
      updated[i] = "";
    });
    setInputs(updated);
    setChecked(false);
    setMistakes([]);
    setShowRetry(false);
  };

  const parts = task.sentence.split("___");

  return (
    <div style={{ maxWidth: 800, lineHeight: 1.8 }}>
      <h3>{task.title}</h3>

      {task.audioUrl && (
        <audio controls src={task.audioUrl} style={{ marginBottom: 20 }} />
      )}

      <p>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < task.gaps.length && (
              <input
                type="text"
                value={inputs[i]}
                onChange={(e) => handleChange(i, e.target.value)}
                disabled={checked && !mistakes.includes(i)}
                style={{
                  width: task.gaps[i].length * 10 + 40,
                  margin: "0 6px",
                  padding: "4px 6px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  backgroundColor: checked
                    ? normalize(inputs[i]) === normalize(task.gaps[i])
                      ? "#d4edda"
                      : "#f8d7da"
                    : "white",
                }}
              />
            )}
          </span>
        ))}
      </p>

      {!checked ? (
        <button
          onClick={handleCheck}
          disabled={inputs.some((v) => v.trim() === "")}
          style={{ marginTop: 20 }}
        >
          Проверить
        </button>
      ) : (
        <div style={{ marginTop: 20 }}>
          <p>
            ✅ Правильных: {task.gaps.length - mistakes.length} /{" "}
            {task.gaps.length}
          </p>
          <p>❌ Ошибок: {mistakes.length}</p>
          {showRetry && (
            <button onClick={handleRetry}>🔁 Повторить ошибки</button>
          )}
        </div>
      )}
    </div>
  );
}

export default ListeningFillInText;
