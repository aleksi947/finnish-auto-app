import React from "react";

function ReadingContent({ title = "📘 Текст для чтения", text = "" }) {
  if (!text) return null;

  const isHtml = /<\/?[a-z][\s\S]*>/i.test(text);

  return (
    <div className="text-gray-800">
      {isHtml ? (
        <div
          className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-p:text-gray-800 prose-p:text-lg prose-p:leading-8 prose-p:mb-5 prose-strong:text-gray-900 prose-strong:font-semibold"
          dangerouslySetInnerHTML={{ __html: text }}
          style={{
            lineHeight: "1.75",
            fontSize: "1.125rem",
          }}
        />
      ) : (
        <div className="space-y-5">
          {text.split(/(?<=[.!?])\s+/).map((sentence, i) => (
            <p 
              key={i} 
              className="text-lg md:text-xl text-gray-800 leading-8 font-normal"
              style={{ 
                lineHeight: "1.75",
                marginBottom: "1.25rem"
              }}
            >
              {sentence}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReadingContent;
