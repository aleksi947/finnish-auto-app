function VocabularyBlock({ words, lang = "ru" }) {
  const playAudio = (audioPath) => {
    if (audioPath) {
      const audio = new Audio(audioPath);
      audio.play().catch((err) => {
        console.error("Ошибка воспроизведения аудио:", err);
      });
    }
  };

  // Проверяем, есть ли хотя бы у одного слова поле "milloin"
  const hasMilloin = words.some((word) => word.milloin);

  return (
    <div className="w-full">
      {/* Таблица со словами */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
        {/* Заголовки таблицы */}
        <div className="flex items-center border-b border-[#E5E7EB] bg-white">
          <div className="flex-1 px-6 py-4">
            <span className="text-base font-bold text-[#1E293B] leading-6">Финский</span>
          </div>
          <div className="flex-1 px-6 py-4 border-l border-[#E5E7EB]">
            <span className="text-base font-bold text-[#1E293B] leading-6">Русский</span>
          </div>
          {hasMilloin && (
            <div className="flex-1 px-6 py-4 border-l border-[#E5E7EB]">
              <span className="text-base font-bold text-[#1E293B] leading-6">Когда?</span>
            </div>
          )}
        </div>

        {/* Список слов */}
        {words.map((word, index) => (
          <div 
            key={index} 
            className={`flex items-center border-b border-[#E5E7EB] ${
              index === words.length - 1 ? '' : 'border-b'
            }`}
          >
            {/* Ячейка с финским словом */}
            <div className="flex-1 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="text-base font-normal text-[#1E293B] leading-6">
                  {word.fi}
                </span>
                {word.audio && (
                  <button
                    onClick={() => playAudio(word.audio)}
                    className="bg-transparent border-none cursor-pointer text-base hover:opacity-70 transition-opacity"
                    title="Прослушать"
                  >
                    🔊
                  </button>
                )}
              </div>
            </div>
            
            {/* Ячейка с переводом */}
            <div className="flex-1 px-6 py-4 border-l border-[#E5E7EB]">
              <span className="text-base font-normal text-[#1E293B] leading-6">
                {word.translations?.[lang]}
              </span>
            </div>
            
            {/* Ячейка с "Когда?" если есть */}
            {hasMilloin && (
              <div className="flex-1 px-6 py-4 border-l border-[#E5E7EB]">
                <span className="text-base font-normal text-[#1E293B] leading-6">
                  {word.milloin || ""}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VocabularyBlock;
