function VocabularyBlock({ words, lang = "ru" }) {
  const playAudio = (audioPath) => {
    if (audioPath) {
      const audio = new Audio(audioPath);
      audio.play().catch((err) => {
        console.error("Ошибка воспроизведения аудио:", err);
      });
    }
  };

  // Check if any word has "milloin" field
  const hasMilloin = words.some((word) => word.milloin);

  return (
    <div className="w-full">
      {/* Word table */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
        {/* Table headers */}
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

        {/* Word list */}
        {words.map((word, index) => (
          <div 
            key={index} 
            className={`flex items-center border-b border-[#E5E7EB] ${
              index === words.length - 1 ? '' : 'border-b'
            }`}
          >
            {/* Finnish word cell */}
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
            
            {/* Translation cell */}
            <div className="flex-1 px-6 py-4 border-l border-[#E5E7EB]">
              <span className="text-base font-normal text-[#1E293B] leading-6">
                {word.translations?.[lang]}
              </span>
            </div>
            
            {/* "When?" cell if present */}
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
