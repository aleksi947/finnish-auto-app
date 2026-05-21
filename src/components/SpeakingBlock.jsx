function SpeakingBlock({ data }) {
  return (
    <div>
      <p>💬 {data.question.ru}</p>
      {/* Voice recording can be added here if needed */}
    </div>
  );
}

export default SpeakingBlock;
