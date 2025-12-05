import React from "react";

function ReadingTextCard({ title = "Текст для чтения", text = "" }) {
  if (!text) return null;

  const sentences = text.split(/(?<=[.!?])\s+/);

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div
        style={{
          border: "1px solid #e0e0e0",
          borderRadius: 12,
          padding: 24,
          backgroundColor: "#fefefe",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          maxWidth: 800,
          width: "100%",
          marginTop: 20,
          lineHeight: 0.8,
        }}
      >
        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span role="img" aria-label="book">
            📘
          </span>{" "}
          {title}
        </h3>
        {sentences.map((sentence, i) => (
          <p key={i} style={{ marginBottom: 12, fontSize: "1.1rem" }}>
            {sentence}
          </p>
        ))}
      </div>
    </div>
  );
}

export default ReadingTextCard;
