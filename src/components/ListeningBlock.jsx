function ListeningBlock({ data }) {
  return (
    <div>
      <audio controls src={data.audioUrl}>
        Ваш браузер не поддерживает аудио элемент.
      </audio>
      <p>
        <em>{data.task.ru}</em>
      </p>
    </div>
  );
}

export default ListeningBlock;
