function AlphabetBlock({ words }) {
  const playAudio = (letter) => {
    const audio = new Audio(`/audio/A1-1/alphabet/${letter}.mp3`);
    audio.play().catch((err) => {
      console.error(`⚠️ Аудио для "${letter}" не найдено`, err);
    });
  };

  return (
    <div style={styles.container}>
      {words.map((w, i) => (
        <div key={i} style={styles.row}>
          <span
            style={styles.fi}
            onClick={() => playAudio(w.fi)}
            title="Нажми для прослушивания"
          >
            🔊 {w.fi}
          </span>
          <span style={styles.trans}>{w.translations?.ru}</span>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    border: "2px solid #0077cc",
    borderRadius: "8px",
    padding: "16px",
    backgroundColor: "#f1f9ff",
    maxWidth: "600px",
    marginBottom: "30px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
    borderBottom: "1px solid #ddd",
    cursor: "pointer",
  },
  fi: {
    fontWeight: "bold",
    color: "#0077cc",
  },
  trans: {
    color: "#333",
  },
};

export default AlphabetBlock;
