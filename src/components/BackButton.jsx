import { useNavigate } from "react-router-dom";

function BackButton({ label = "⬅ Назад", style = {} }) {
  const navigate = useNavigate();

  const defaultStyle = {
    display: "inline-block", // ⬅️ ключевая строка
    maxWidth: "200px", // ⬅️ ограничиваем ширину
    padding: "8px 18px",
    fontSize: "14px",
    backgroundColor: "#003E7E", // финский синий
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "20px",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
    whiteSpace: "nowrap", // ⬅️ не переносить текст
  };

  const hoverStyle = {
    backgroundColor: "#0055b8",
  };

  return (
    <button
      onClick={() => navigate(-1)}
      style={{ ...defaultStyle, ...style }}
      onMouseOver={(e) => Object.assign(e.target.style, hoverStyle)}
      onMouseOut={(e) => Object.assign(e.target.style, defaultStyle)}
    >
      {label}
    </button>
  );
}

export default BackButton;
