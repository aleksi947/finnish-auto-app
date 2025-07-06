function SpeakingBlock({ data }) {
  return (
    <div>
      <p>💬 {data.question.ru}</p>
      {/* Здесь можно добавить запись голоса, если будет такая функция */}
    </div>
  );
}

export default SpeakingBlock;
