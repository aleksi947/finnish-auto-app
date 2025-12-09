import { Fragment } from "react";
import { Lightbulb } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  renderInlineContent,
  normalizeColumns,
  cellValueByColumn,
} from "./structuredExplanationUtils.jsx";

// Рендеринг богатых параграфов (с поддержкой статусов, подсказок и т.д.)
const renderRichParagraph = (paragraph, idx) => {
  if (!paragraph?.trim()) return null;
  const lines = paragraph
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return null;

  const allStatusLines = lines.every((line) => /^[❌✅]/u.test(line));
  if (allStatusLines) {
    return (
      <div key={`status-${idx}`} className="grid gap-3 sm:grid-cols-2">
        {lines.map((line, lineIdx) => {
          const iconMatch = line.match(/^[^\p{L}\p{N}]+/u);
          const icon = iconMatch ? iconMatch[0].trim() : "";
          const content = line.replace(/^[^\p{L}\p{N}]+/u, "").trim();
          const isPositive = icon.includes("✅");
          const toneClasses = isPositive
            ? "border-[#34D399] bg-[#ECFDF5]"
            : "border-[#FCA5A5] bg-[#FEF2F2]";
          const textColor = isPositive ? "text-[#047857]" : "text-[#B91C1C]";
          return (
            <div
              key={`status-line-${lineIdx}`}
              className={[
                "flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-sm",
                toneClasses,
              ].join(" ")}
            >
              {icon && <span className="text-2xl leading-none">{icon}</span>}
              <p
                className={[
                  "text-sm sm:text-base font-medium",
                  textColor,
                ].join(" ")}
              >
                {renderInlineContent(content)}
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  const firstLine = lines[0] || "";
  if (/^[👉💡🔔]/u.test(firstLine)) {
    const iconMatch = firstLine.match(/^[^\p{L}\p{N}]+/u);
    const icon = iconMatch ? iconMatch[0].trim() : "👉";
    const content = firstLine.replace(/^[^\p{L}\p{N}]+/u, "").trim();
    const remaining = lines.slice(1);

    return (
      <div
        key={`hint-${idx}`}
        className="rounded-2xl border border-[#3C84F8]/40 bg-[#EEF5FF] p-5 shadow-inner space-y-3"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none">{icon}</span>
          <p className="text-sm sm:text-base font-semibold text-[#1E3A8A]">
            {renderInlineContent(content)}
          </p>
        </div>
        {remaining.length > 0 && (
          <div className="space-y-2 pl-9">
            {remaining.map((line, lineIdx) => (
              <p
                key={`hint-line-${lineIdx}`}
                className="text-sm sm:text-base text-[#334155]"
              >
                {renderInlineContent(line)}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      key={`paragraph-${idx}`}
      className={[
        "space-y-2 text-base sm:text-lg text-[#334155]",
        lines.length > 1 ? "leading-relaxed" : "leading-relaxed",
      ].join(" ")}
    >
      {lines.map((line, lineIdx) => (
        <p
          key={`paragraph-line-${lineIdx}`}
          className="text-base sm:text-lg leading-relaxed"
        >
          {renderInlineContent(line)}
        </p>
      ))}
    </div>
  );
};

// Основной компонент для рендеринга структурированного объяснения
export default function StructuredExplanation({ 
  structured, 
  lang = "ru",
  className = "" 
}) {
  if (!structured) return null;

  const S = structured;

  // Проверяем, есть ли хотя бы один элемент для отображения
  const hasContent =
    S.title?.[lang] ||
    S.subtitle?.[lang] ||
    (S.intro?.[lang] && S.intro[lang].trim()) ||
    (Array.isArray(S.definitions) && S.definitions.length > 0) ||
    S.gradationTable ||
    (Array.isArray(S.examplesByType) && S.examplesByType.length > 0) ||
    S.note ||
    S.summary ||
    S.memory ||
    (Array.isArray(S.examples) && S.examples.length > 0) ||
    (Array.isArray(S.conjugationTables) && S.conjugationTables.length > 0) ||
    (Array.isArray(S.conjugationExamples) && S.conjugationExamples.length > 0) ||
    (Array.isArray(S.verbsExamples) && S.verbsExamples.length > 0) ||
    S.negativeParticles ||
    S.important ||
    S.questions;

  if (!hasContent) return null;

  // Обработка intro с извлечением окончаний и примеров
  const processIntro = (introRaw) => {
    if (!introRaw?.trim()) return null;

    const paragraphs = introRaw
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean);
    
    if (paragraphs.length === 0) return null;

    // Ищем только явные фразы типа "заканчиваются на" или "окончания:" (с двоеточием)
    // Игнорируем просто слово "окончание" в другом контексте
    const endingsLine = paragraphs.find((block) =>
      /заканчиваются\s+на|окончания\s*:/i.test(block)
    );
    const endings =
      endingsLine
        ?.match(/-[^,\.\s]+(?:\s*\/\s*-[^,\.\s]+)?/g)
        ?.map((token) => token.replace(/\s+/g, ""))
        ?.filter((token) =>
          /^-[A-Za-zÅÄÖåäö]+(?:\/-[A-Za-zÅÄÖåäö]+)?$/u.test(token)
        ) || [];

    const examplesLine = paragraphs.find((block) =>
      /^примеры:/i.test(block)
    );
    const examples = (() => {
      if (!examplesLine) return [];
      const raw = examplesLine.replace(/^примеры:\s*/i, "");
      const items = [];
      let buffer = "";
      let depth = 0;

      for (const char of raw) {
        if (char === "(") depth += 1;
        else if (char === ")") depth = Math.max(0, depth - 1);

        if (char === "," && depth === 0) {
          if (buffer.trim()) items.push(buffer.trim());
          buffer = "";
          continue;
        }
        buffer += char;
      }
      if (buffer.trim()) items.push(buffer.trim());
      return items
        .map((x) => x.replace(/\.\s*$/, ""))
        .filter(Boolean);
    })();

    const restParagraphs = paragraphs.filter(
      (block) => block !== endingsLine && block !== examplesLine
    );

    let renderedParagraphs = restParagraphs
      .map((paragraph, idx) => renderRichParagraph(paragraph, idx))
      .filter(Boolean);

    // Если ничего не отрендерилось, но есть текст - используем fallback
    // Это гарантирует, что простой текст всегда будет отображен
    if (renderedParagraphs.length === 0) {
      if (restParagraphs.length > 0) {
        // Используем первый параграф из restParagraphs для fallback
        const fallbackText = restParagraphs[0];
        renderedParagraphs = [
          <p
            key="intro-fallback"
            className="text-base sm:text-lg leading-relaxed text-[#334155]"
          >
            {renderInlineContent(fallbackText)}
          </p>
        ];
      } else if (introRaw && introRaw.trim()) {
        // Если restParagraphs пуст, но есть introRaw - используем его
        renderedParagraphs = [
          <p
            key="intro-fallback-full"
            className="text-base sm:text-lg leading-relaxed text-[#334155]"
          >
            {renderInlineContent(introRaw.trim())}
          </p>
        ];
      }
    }

    if (
      renderedParagraphs.length === 0 &&
      endings.length === 0 &&
      examples.length === 0
    ) {
      return null;
    }

    return { renderedParagraphs, endings, examples };
  };

  const introData = processIntro(S.intro?.[lang]);

  return (
    <div className={`space-y-6 ${className} max-w-full overflow-hidden`}>
      {/* Stage Title */}
      {S.title?.[lang] && (
        <h2 
          id={S.stageId || `stage-title-${S.stageIndex ?? 0}`}
          className="text-xl sm:text-3xl font-semibold text-[#1E64F0] text-center scroll-mt-20"
        >
          {S.title[lang].replace(/^[^\p{L}\p{N}]+/u, "")}
        </h2>
      )}

      {/* Subtitle */}
      {S.subtitle?.[lang] && (
        <div className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50/40 p-4 sm:p-6">
          <p className="text-xl text-gray-700">{S.subtitle[lang]}</p>
        </div>
      )}

      {/* Intro */}
      {introData && (
        <div className="relative overflow-hidden rounded-3xl border-2 border-[#CFE0FF] bg-white shadow-[0_16px_38px_-18px_rgba(60,132,248,0.55)]">
          <div
            className="absolute -top-20 -left-24 h-60 w-60 rounded-full bg-[#E9F1FF] blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-[#CDE8FF] blur-3xl"
            aria-hidden="true"
          />
          <div className="relative p-6 sm:p-8 rounded-[26px] bg-gradient-to-br from-white via-[#F4F8FF] to-white">
            <div aria-hidden="true" className="mb-4" />

            <div className="space-y-4 text-left text-base sm:text-lg text-[#334155] leading-relaxed">
              {introData.endings.length > 0 && (
                <div>
                  <p className="font-medium text-[#1E3A8A]">
                    Чаще всего такие слова оканчиваются на:
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {introData.endings.map((token, idx) => (
                      <span
                        key={`${token}-${idx}`}
                        className="rounded-2xl border border-[#3C84F8]/30 bg-[#EBF3FF] px-3 py-1 text-sm font-semibold text-[#1E64F0]"
                      >
                        {token}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {introData.renderedParagraphs}

              {introData.examples.length > 0 && (
                <div>
                  <p className="font-medium text-[#1E3A8A]">Примеры:</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {introData.examples.map((example, idx) => {
                      const cleaned = example.trim();
                      const match = cleaned.match(
                        /^([^()]+?)(?:\s*\(([^)]*)\))?$/
                      );
                      const fi = match ? match[1].trim() : cleaned;
                      const ru = match?.[2]?.trim();
                      return (
                        <div
                          key={`${example}-${idx}`}
                          className="flex items-center gap-3 rounded-2xl border border-[#CFE0FF] bg-white/80 px-4 py-3 shadow-sm"
                        >
                          <span className="text-lg font-semibold text-[#1E64F0]">
                            {fi?.trim()}
                          </span>
                          {ru && (
                            <span className="text-sm text-[#475569]">
                              ({ru})
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Questions */}
      {S.questions?.items?.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-blue-300 p-5">
          <h3 className="text-xl font-semibold text-blue-600 mb-3">
            {(S.questions.title?.[lang] || "Вопросы").replace(
              /^[^\p{L}\p{N}]+/u,
              ""
            )}
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {S.questions.items.map((q, i) => (
              <li
                key={i}
                className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2"
              >
                <b>{q.fi}</b>
                {q[lang] ? ` — ${q[lang]}` : q.ru ? ` — ${q.ru}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Important highlight */}
      {(() => {
        const importantRaw =
          typeof S.important === "string"
            ? S.important
            : typeof S.important?.body?.[lang] === "string"
            ? S.important.body[lang]
            : typeof S.important?.[lang] === "string"
            ? S.important[lang]
            : S.important?.body?.ru || S.important?.ru || "";

        if (!importantRaw?.trim()) return null;

        const trimmed = importantRaw.trim();
        const [firstSymbol = ""] = Array.from(trimmed);
        const hasIcon =
          firstSymbol && !/[\p{L}\p{N}]/u.test(firstSymbol);
        const icon = hasIcon ? firstSymbol : "✨";
        const content = trimmed
          .replace(/^[^\p{L}\p{N}]+/u, "")
          .trim();

        const importantTitle =
          S.important?.title?.[lang] ||
          S.important?.title?.ru ||
          "💡 Важно";

        return (
          <div className="relative overflow-hidden rounded-3xl border-2 border-[#3C84F8] bg-white shadow-[0_18px_42px_-22px_rgba(30,100,240,0.55)]">
            <div
              className="absolute -top-16 -right-12 h-40 w-40 rounded-full bg-[#3C84F8]/20 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-[#1E64F0]/15 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative bg-gradient-to-br from-white/95 via-[#F4F9FF] to-[#E9F2FF] p-6 sm:p-8 rounded-[26px] border-l-4 border-[#1E64F0]">
              <div className="flex items-start gap-4 mb-4">
                <span className="text-3xl leading-none">{icon}</span>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1E64F0]">
                    Важный акцент
                  </p>
                  <h3 className="text-xl sm:text-2xl font-semibold text-[#0B1F44]">
                    {importantTitle.replace(/^[^\p{L}\p{N}]+/u, "")}
                  </h3>
                </div>
              </div>
              <p className="text-base sm:text-lg leading-relaxed text-[#334155] whitespace-pre-line">
                {content}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Gradation table */}
      {S.gradationTable?.rows?.length > 0 && (
        <div className="bg-white rounded-3xl shadow-lg border-2 border-[#3C84F8] p-6 sm:p-8">
          <h3 className="text-2xl mb-6 flex items-center gap-2">
            <span className="text-[#1E64F0]">
              {(
                S.gradationTable.title?.[lang] ||
                S.gradationTable.title?.ru ||
                "Таблица сильных и слабых форм"
              ).replace(/^[^\p{L}\p{N}]+/u, "")}
            </span>
          </h3>

          <Table
            className="w-full text-[13px] sm:text-base"
            wrapperClassName="overflow-visible"
          >
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-[#E9F1FF] to-[#CDE8FF]">
                {(S.gradationTable.columns || []).map((col, i) => (
                  <TableHead
                    key={i}
                    className="whitespace-normal px-1.5 py-2 text-[7px] font-semibold uppercase tracking-[0.18em] text-[#1E64F0] sm:px-4 sm:py-3 sm:text-lg sm:tracking-normal sm:text-[#0B1F44] sm:uppercase"
                  >
                    {typeof col === "string" ? col : col?.[lang] || col?.ru || col?.en || ""}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {S.gradationTable.rows.map((row, idxRow) => (
                <TableRow
                  key={idxRow}
                  className={
                    idxRow % 2 === 0 ? "bg-gray-50" : "bg-white"
                  }
                >
                  <TableCell className="px-1.5 py-1.5 text-[11px] font-semibold leading-tight text-gray-900 whitespace-normal break-words sm:px-4 sm:py-3 sm:text-lg">
                    {row.normal}
                  </TableCell>
                  <TableCell className="px-1.5 py-1.5 text-[11px] leading-tight text-gray-900 whitespace-normal break-words sm:px-4 sm:py-3 sm:text-lg">
                    {row.type3}
                  </TableCell>
                  <TableCell className="px-1.5 py-1.5 text-[11px] leading-tight text-gray-900 whitespace-normal break-words sm:px-4 sm:py-3 sm:text-lg">
                    {row.example1}
                  </TableCell>
                  <TableCell className="px-1.5 py-1.5 text-[11px] leading-tight text-gray-700 whitespace-normal break-words sm:px-4 sm:py-3 sm:text-lg">
                    {row.translation?.[lang] || row.translation?.ru || row.translation}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Negative particles */}
      {(() => {
        const negative = S.negativeParticles;
        const rows = Array.isArray(negative)
          ? negative
          : negative?.rows;
        if (!Array.isArray(rows) || rows.length === 0) return null;
        const negativeTitle = Array.isArray(negative)
          ? "Отрицательная частица"
          : negative?.title?.[lang] || negative?.title?.ru || "Отрицательная частица";
        return (
          <div className="bg-white rounded-3xl shadow-lg border-2 border-[#3C84F8] p-6 sm:p-8">
            <h3 className="text-2xl mb-4 flex items-center gap-2">
              <span>🚫</span>
              <span className="text-[#1E64F0]">
                {negativeTitle.replace(/^[🚫👉]\s*/, "")}
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rows.map((it, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4 bg-[#E9F1FF] border border-[#CFE0FF]"
                >
                  <div className="text-base">
                    <b>{it.person}</b> → {it.particle || it.form}
                  </div>
                  {it.note?.[lang] && (
                    <div className="text-sm text-gray-600 mt-1">
                      {it.note[lang]}
                    </div>
                  )}
                  {it.note?.ru && !it.note?.[lang] && (
                    <div className="text-sm text-gray-600 mt-1">
                      {it.note.ru}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Примеры по типам */}
      {Array.isArray(S.examplesByType) &&
        S.examplesByType.length > 0 && (
          <div className="bg-white rounded-3xl shadow-lg border-2 border-[#3C84F8] p-6 sm:p-8">
            <h3 className="text-2xl mb-4 flex items-center gap-2">
              <span>📚</span>
              <span className="text-[#1E64F0]">Примеры по типам</span>
            </h3>
            <div className="space-y-6">
              {S.examplesByType.map((block, idx) => {
                const blockTitle =
                  block.title?.[lang] ||
                  block.title?.ru ||
                  (block.type
                    ? `Тип ${block.type}`
                    : block.verb?.fi || `Группа ${idx + 1}`);
                return (
                  <div
                    key={idx}
                    className="bg-[#E9F1FF] rounded-xl p-4 border border-[#CFE0FF]"
                  >
                    <div className="text-lg font-semibold text-[#1E64F0] mb-2">
                      {blockTitle.replace(/^[👉🔹📘]\s*/, "")}
                      {block.verb?.fi && !block.title?.[lang] && !block.title?.ru
                        ? ` (${block.verb.fi}${
                            block.verb?.[lang]
                              ? ` — ${block.verb[lang]}`
                              : block.verb?.ru
                              ? ` — ${block.verb.ru}`
                              : ""
                          })`
                        : ""}
                    </div>
                    <ul className="space-y-2 text-lg list-disc ml-6">
                      {block.examples?.map((ex, i2) => (
                        <li key={i2}>
                          <strong>{ex.fi}</strong>
                          {ex[lang]
                            ? ` — ${ex[lang]}`
                            : ex.ru
                            ? ` — ${ex.ru}`
                            : ex.translations?.[lang]
                            ? ` — ${ex.translations[lang]}`
                            : ex.translations?.ru
                            ? ` — ${ex.translations.ru}`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Verbs examples */}
      {Array.isArray(S.verbsExamples) &&
        S.verbsExamples.length > 0 && (
          <div className="bg-white rounded-3xl shadow-lg border-2 border-[#3C84F8] p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🍃</span>
              <h4 className="text-lg font-semibold text-green-700">
                {S.verbsExamplesTitle?.[lang] || S.verbsExamplesTitle?.ru || "Общие примеры"}
              </h4>
            </div>
            <div className="bg-[#E9F1FF] rounded-xl p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {S.verbsExamples.map((v, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-shadow border border-[#CFE0FF]"
                  >
                    <div className="font-semibold text-gray-900 text-base mb-1">
                      {v.fi}
                    </div>
                    {v.translations?.[lang] && (
                      <div className="text-xs text-gray-600 mt-1">
                        {v.translations[lang]}
                      </div>
                    )}
                    {v.translations?.ru && !v.translations?.[lang] && (
                      <div className="text-xs text-gray-600 mt-1">
                        {v.translations.ru}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

          {/* Conjugation tables — УНИВЕРСАЛЬНЫЙ РЕНДЕРЕР */}
          {Array.isArray(S.conjugationTables) &&
            S.conjugationTables.length > 0 && (
              <div className="space-y-6">
                {S.conjugationTables.map((tbl, i) => {
                  const cols = normalizeColumns(tbl.columns, lang);
                  const compactHeaderSet = new Set([
                    "местоимение",
                    "окончание",
                    "пример (puhua)",
                    "пример (kysyä)",
                  ]);
                  
                  // Проверка, является ли это таблицей с порядковыми числительными
                  const tableTitle = tbl.title?.[lang] || tbl.title?.ru || "";
                  const isOrdinalNumbersTable = tableTitle.includes("Порядковые числительные") || 
                    (cols.length === 4 && cols[0]?.includes("Число") && cols[1]?.includes("Перевод") && cols[2]?.includes("Число") && cols[3]?.includes("Перевод"));
                  
                  // Если это таблица с порядковыми числительными, разделяем на две таблицы для мобильных
                  if (isOrdinalNumbersTable && cols.length === 4) {
                    const firstTwoCols = cols.slice(0, 2);
                    const lastTwoCols = cols.slice(2, 4);
                    
                    return (
                      <div key={i} className="bg-white rounded-3xl shadow-lg border-2 border-[#3C84F8] p-6 sm:p-8">
                        <h3 className="text-2xl mb-6 flex items-center gap-2">
                          <span>📊</span>
                          <span className="text-blue-600">
                            {tableTitle || `Таблица ${i + 1}`}
                          </span>
                        </h3>
                        
                        {/* Мобильная версия: две таблицы */}
                        <div className="block sm:hidden space-y-6">
                          {/* Первая таблица: колонки 0-1 */}
                          <div>
                            <Table className="w-full table-auto text-xs" wrapperClassName="overflow-visible">
                              <TableHeader>
                                <TableRow className="bg-gradient-to-r from-[#E9F1FF] to-[#CDE8FF]">
                                  {firstTwoCols.map((col, ci) => {
                                    const colStr = typeof col === "string" ? col : "";
                                    const hasQuotes = colStr.includes('"') || colStr.includes('«') || colStr.includes('»');
                                    const isLongHeader = colStr.length > 12;
                                    const useNormalCase = isLongHeader || hasQuotes;
                                    
                                    return (
                                      <TableHead
                                        key={ci}
                                        className={`font-semibold text-[#1E64F0] px-1.5 py-1.5 text-[9px] tracking-normal normal-case whitespace-normal break-words`}
                                      >
                                        {col}
                                      </TableHead>
                                    );
                                  })}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(tbl.rows || []).map((row, ri) => (
                                  <TableRow key={ri} className={ri % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                                    {firstTwoCols.map((col, ci) => (
                                      <TableCell
                                        key={ci}
                                        className="px-1.5 py-1.5 text-[9px] leading-tight text-gray-900 whitespace-normal break-words align-top"
                                      >
                                        {cellValueByColumn(col, row, lang, ci)}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          
                          {/* Вторая таблица: колонки 2-3 */}
                          <div>
                            <Table className="w-full table-auto text-xs" wrapperClassName="overflow-visible">
                              <TableHeader>
                                <TableRow className="bg-gradient-to-r from-[#E9F1FF] to-[#CDE8FF]">
                                  {lastTwoCols.map((col, ci) => {
                                    const colStr = typeof col === "string" ? col : "";
                                    const hasQuotes = colStr.includes('"') || colStr.includes('«') || colStr.includes('»');
                                    const isLongHeader = colStr.length > 12;
                                    const useNormalCase = isLongHeader || hasQuotes;
                                    
                                    return (
                                      <TableHead
                                        key={ci}
                                        className={`font-semibold text-[#1E64F0] px-1.5 py-1.5 text-[9px] tracking-normal normal-case whitespace-normal break-words`}
                                      >
                                        {col}
                                      </TableHead>
                                    );
                                  })}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(tbl.rows || []).map((row, ri) => (
                                  <TableRow key={ri} className={ri % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                                    {lastTwoCols.map((col, ci) => (
                                      <TableCell
                                        key={ci}
                                        className="px-1.5 py-1.5 text-[9px] leading-tight text-gray-900 whitespace-normal break-words align-top"
                                      >
                                        {cellValueByColumn(col, row, lang, ci + 2)}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                        
                        {/* Десктопная версия: одна таблица с 4 колонками */}
                        <div className="hidden sm:block">
                          <Table
                            className="w-full table-auto text-xs sm:text-base"
                            wrapperClassName="overflow-visible"
                          >
                            <TableHeader>
                              <TableRow className="bg-gradient-to-r from-[#E9F1FF] to-[#CDE8FF]">
                                {cols.map((col, ci) => {
                                  const colStr = typeof col === "string" ? col : "";
                                  const isCompact = compactHeaderSet.has(colStr.toLowerCase());
                                  const hasQuotes = colStr.includes('"') || colStr.includes('«') || colStr.includes('»');
                                  const isLongHeader = colStr.length > 12;
                                  const useNormalCase = isLongHeader || hasQuotes;
                                  
                                  return (
                                    <TableHead
                                      key={ci}
                                      className={`font-semibold text-[#1E64F0] px-1.5 py-1.5 sm:px-4 sm:py-3 sm:text-lg sm:tracking-normal sm:text-[#0B1F44] ${
                                        isCompact
                                          ? "text-[7px] tracking-[0.05em] uppercase leading-snug"
                                          : useNormalCase
                                          ? "text-[9px] sm:text-sm tracking-normal normal-case whitespace-normal break-words"
                                          : "text-[9px] sm:text-sm uppercase tracking-[0.1em] whitespace-normal break-words"
                                      }`}
                                    >
                                      {col}
                                    </TableHead>
                                  );
                                })}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(tbl.rows || []).map((row, ri) => (
                                <TableRow
                                  key={ri}
                                  className={
                                    ri % 2 === 0 ? "bg-gray-50" : "bg-white"
                                  }
                                >
                                  {cols.map((col, ci) => (
                                    <TableCell
                                      key={ci}
                                      className="px-1.5 py-1.5 text-[9px] sm:text-base leading-tight text-gray-900 whitespace-normal break-words align-top sm:px-4 sm:py-3"
                                    >
                                      {cellValueByColumn(col, row, lang, ci)}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    );
                  }
                  
                  // Обычная таблица (не порядковые числительные)
                  return (
                <div
                  key={i}
                  className="bg-white rounded-3xl shadow-lg border-2 border-[#3C84F8] p-6 sm:p-8"
                >
                  <h3 className="text-2xl mb-6 flex items-center gap-2">
                    <span>📊</span>
                    <span className="text-blue-600">
                      {tbl.title?.[lang] || tbl.title?.ru || `Таблица ${i + 1}`}
                    </span>
                  </h3>

                  <Table
                    className="w-full table-auto text-xs sm:text-base"
                    wrapperClassName="overflow-visible"
                  >
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-[#E9F1FF] to-[#CDE8FF]">
                        {cols.map((col, ci) => {
                          const colStr = typeof col === "string" ? col : "";
                          const isCompact = compactHeaderSet.has(colStr.toLowerCase());
                          // Для длинных заголовков или заголовков с кавычками используем normal-case
                          const hasQuotes = colStr.includes('"') || colStr.includes('«') || colStr.includes('»');
                          const isLongHeader = colStr.length > 12;
                          const useNormalCase = isLongHeader || hasQuotes;
                          
                          return (
                            <TableHead
                              key={ci}
                              className={`font-semibold text-[#1E64F0] px-1.5 py-1.5 sm:px-4 sm:py-3 sm:text-lg sm:tracking-normal sm:text-[#0B1F44] ${
                                isCompact
                                  ? "text-[7px] tracking-[0.05em] uppercase leading-snug"
                                  : useNormalCase
                                  ? "text-[9px] sm:text-sm tracking-normal normal-case whitespace-normal break-words"
                                  : "text-[9px] sm:text-sm uppercase tracking-[0.1em] whitespace-normal break-words"
                              }`}
                            >
                              {col}
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(tbl.rows || []).map((row, ri) => (
                        <TableRow
                          key={ri}
                          className={
                            ri % 2 === 0 ? "bg-gray-50" : "bg-white"
                          }
                        >
                          {cols.map((col, ci) => (
                            <TableCell
                              key={ci}
                              className="px-1.5 py-1.5 text-[9px] sm:text-base leading-tight text-gray-900 whitespace-normal break-words align-top sm:px-4 sm:py-3"
                            >
                              {cellValueByColumn(col, row, lang, ci)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })}
          </div>
        )}

      {/* Conjugation examples */}
      {Array.isArray(S.conjugationExamples) &&
        S.conjugationExamples.length > 0 && (
          <div className="space-y-6">
            {S.conjugationExamples.map((example, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl shadow-lg border-2 border-[#3C84F8] p-6 sm:p-8"
              >
                <h3 className="text-2xl mb-4 flex items-center gap-2">
                  <span>📄</span>
                  <span className="text-[#1E64F0]">
                    {example.title?.[lang] ||
                      example.title?.ru ||
                      (example.verb?.fi || `Пример ${idx + 1}`) +
                        (example.verb?.[lang]
                          ? ` (${example.verb[lang]})`
                          : example.verb?.ru
                          ? ` (${example.verb.ru})`
                          : "")}
                  </span>
                </h3>
                <Table
                  className="w-full table-fixed text-[13px] sm:text-base"
                  wrapperClassName="overflow-visible"
                >
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-[#E9F1FF] to-[#CDE8FF]">
                      {["Основа", "Форма", "Перевод"].map(
                        (col, idxHead) => (
                          <TableHead
                            key={idxHead}
                            className={`whitespace-normal font-semibold text-[#1E64F0] sm:whitespace-nowrap sm:px-4 sm:py-3 sm:text-lg sm:tracking-normal sm:text-[#0B1F44] sm:uppercase ${
                              col.toLowerCase() === "основа"
                                ? "px-1.5 py-1.5 text-[7px] tracking-[0.05em] uppercase leading-snug"
                                : "px-2 py-2 text-[11px] uppercase tracking-[0.12em]"
                            }`}
                          >
                            {col}
                          </TableHead>
                        )
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {example.rows?.map((row, rowIdx) => (
                      <TableRow
                        key={rowIdx}
                        className={
                          rowIdx % 2 === 0 ? "bg-gray-50" : "bg-white"
                        }
                      >
                        <TableCell className="px-1.5 py-1.5 text-[11px] leading-tight text-gray-900 whitespace-normal break-words align-top sm:px-4 sm:py-3 sm:text-lg">
                          {row.base || row.person || row.topic}
                        </TableCell>
                        <TableCell className="px-1.5 py-1.5 text-[11px] font-semibold leading-tight text-gray-900 whitespace-normal break-words align-top sm:px-4 sm:py-3 sm:text-lg">
                          {row.form}
                        </TableCell>
                        <TableCell className="px-1.5 py-1.5 text-[11px] leading-tight text-gray-900 whitespace-normal break-words align-top sm:px-4 sm:py-3 sm:text-lg">
                          {row[lang] ||
                            row.ru ||
                            row.translation?.[lang] ||
                            row.translation?.ru ||
                            row.translation}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {example.hint && (
                  <p className="mt-4 text-sm text-gray-600">
                    {example.hint.replace(/^[^\p{L}\p{N}]+/u, "")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

      {/* Definitions */}
      {Array.isArray(S.definitions) && S.definitions.length > 0 && (
        <div className="bg-white rounded-3xl shadow-lg border-2 border-blue-300 p-6 sm:p-8">
          {S.definitions.map((def, di) => (
            <div key={di} className="space-y-4">
              {def.title?.[lang] && (
                <h3 className="text-2xl font-semibold text-blue-600 mb-3">
                  {def.title[lang].replace(/^[^\p{L}\p{N}]+/u, "")}
                </h3>
              )}
              {def.title?.ru && !def.title?.[lang] && (
                <h3 className="text-2xl font-semibold text-blue-600 mb-3">
                  {def.title.ru.replace(/^[^\p{L}\p{N}]+/u, "")}
                </h3>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {def.items?.map((item, ii) => (
                  <div
                    key={ii}
                    className="rounded-2xl border-2 border-blue-200 bg-blue-50/80 p-4"
                  >
                    <p className="text-lg">
                      <b>{item.fi}</b> — {item[lang] || item.ru}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note */}
      {S.note &&
        (S.note.title?.[lang] ||
          S.note.title?.ru ||
          S.note.body?.[lang] ||
          S.note.body?.ru ||
          Array.isArray(S.note.examples)) && (
          <div className="bg-white rounded-3xl shadow-lg border-2 border-[#3C84F8] p-6 sm:p-8">
            <div className="bg-gradient-to-br from-[#E9F1FF] to-[#CFE0FF] rounded-2xl p-6 border-2 border-blue-300">
              <div className="flex items-start gap-4">
                <Lightbulb className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  {(S.note.title?.[lang] || S.note.title?.ru) && (
                    <h4 className="text-2xl mb-4">
                      {(S.note.title?.[lang] || S.note.title?.ru).replace(
                        /^[^\p{L}\p{N}]+/u,
                        ""
                      )}
                    </h4>
                  )}
                  {(S.note.body?.[lang] || S.note.body?.ru) && (
                    <p className="text-lg mb-4">
                      {S.note.body?.[lang] || S.note.body?.ru}
                    </p>
                  )}
                  {Array.isArray(S.note.examples) && (
                    <div className="bg-white rounded-xl p-4 mt-4">
                      <ul className="space-y-2 text-lg">
                        {S.note.examples.map((ex, idx) => (
                          <li key={idx}>
                            • <strong>{ex.fi}</strong> — {ex[lang] || ex.ru}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Memory */}
      {S.memory &&
        (S.memory.title?.[lang] ||
          S.memory.title?.ru ||
          S.memory.body?.[lang] ||
          S.memory.body?.ru ||
          Array.isArray(S.memory.steps) ||
          Array.isArray(S.memory.examples)) && (
          <div className="bg-white rounded-2xl border-2 border-blue-300 p-6">
            {(S.memory.title?.[lang] || S.memory.title?.ru) && (
              <h4 className="text-xl font-semibold text-blue-600 mb-2">
                {(S.memory.title?.[lang] || S.memory.title?.ru).replace(
                  /^[^\p{L}\p{N}]+/u,
                  ""
                )}
              </h4>
            )}
            {(S.memory.body?.[lang] || S.memory.body?.ru) && (
              <p className="text-base sm:text-lg text-gray-800 whitespace-pre-line mb-4">
                {S.memory.body?.[lang] || S.memory.body?.ru}
              </p>
            )}
            {Array.isArray(S.memory.steps) &&
              S.memory.steps.length > 0 && (
                <ol className="list-decimal ml-6 space-y-2 text-base sm:text-lg text-slate-700 mb-4">
                  {S.memory.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              )}
            {Array.isArray(S.memory.examples) &&
              S.memory.examples.length > 0 && (
                <ul className="list-disc ml-6 space-y-2 text-base sm:text-lg text-slate-700">
                  {S.memory.examples.map((ex, i2) => (
                    <li key={i2}>
                      <b>{ex.fi}</b>
                      {ex[lang] ? ` — ${ex[lang]}` : ex.ru ? ` — ${ex.ru}` : ""}
                    </li>
                  ))}
                </ul>
              )}
          </div>
        )}

      {/* Examples (общий блок) */}
      {Array.isArray(S.examples) &&
        S.examples.length > 0 &&
        (() => {
          const isBlocks = S.examples.some((x) =>
            Array.isArray(x?.examples)
          );

          const flatExamples = isBlocks
            ? S.examples.flatMap((blk) => blk.examples || [])
            : S.examples;

          const title = isBlocks
            ? S.examples[0]?.title?.[lang] ||
              S.examples[0]?.title?.ru ||
              ""
            : S.examplesTitle?.[lang] || S.examplesTitle?.ru || "";

          return (
            <div className="bg-white rounded-2xl border-2 border-blue-200 p-6">
              {title && (
                <h4 className="text-xl font-semibold text-blue-600 mb-2">
                  {title.replace(/^[^\p{L}\p{N}]+/u, "")}
                </h4>
              )}
              <ul className="space-y-2">
                {flatExamples.map((ex, i2) => (
                  <li key={i2} className="text-base sm:text-lg">
                    <b>{ex.fi}</b>
                    {ex[lang]
                      ? ` — ${ex[lang]}`
                      : ex.ru
                      ? ` — ${ex.ru}`
                      : ex.translation?.[lang]
                      ? ` — ${ex.translation[lang]}`
                      : ex.translation?.ru
                      ? ` — ${ex.translation.ru}`
                      : ""}
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}

      {/* Summary */}
      {S.summary && (
        <div className="bg-white rounded-3xl shadow-lg border-2 border-[#3C84F8] p-4 sm:p-6 md:p-8 overflow-hidden">
          <div className="bg-gradient-to-br from-[#E9F1FF] to-[#CFE0FF] rounded-2xl p-4 sm:p-6 border-2 border-blue-300 overflow-hidden">
            <div className="flex items-start gap-3 sm:gap-4">
              <Lightbulb className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                {(S.summary.title?.[lang] || S.summary.title?.ru) && (
                  <h4 className="text-xl sm:text-2xl mb-3 break-words overflow-wrap-anywhere">
                    {(S.summary.title?.[lang] || S.summary.title?.ru).replace(
                      /^[^\p{L}\p{N}]+/u,
                      ""
                    )}
                  </h4>
                )}
                {(S.summary.body?.[lang] || S.summary.body?.ru) && (
                  <div className="text-sm sm:text-base md:text-lg text-gray-700 space-y-3 break-words overflow-wrap-anywhere max-w-full">
                    {((S.summary.body?.[lang] || S.summary.body?.ru).replace(
                      /^[^\p{L}\p{N}]+/u,
                      ""
                    ) || "")
                      .split(/\n\n+/)
                      .filter(Boolean)
                      .map((paragraph, pIdx) => {
                        const trimmed = paragraph.trim();
                        
                        // Если параграф начинается с маркера списка
                        if (/^[•\*\-]\s/.test(trimmed)) {
                          const lines = trimmed.split(/\n/).filter(Boolean);
                          return (
                            <ul key={`summary-p-${pIdx}`} className="space-y-2 list-none pl-0 max-w-full">
                              {lines.map((line, lIdx) => {
                                const cleanLine = line.replace(/^[•\*\-]\s+/, "").trim();
                                return (
                                  <li key={`summary-l-${lIdx}`} className="flex items-start gap-2 break-words max-w-full">
                                    <span className="text-blue-600 mt-1 flex-shrink-0">•</span>
                                    <span className="flex-1 break-words overflow-wrap-anywhere min-w-0 max-w-full">
                                      {renderInlineContent(cleanLine)}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          );
                        }
                        
                        // Если параграф содержит только одну строку и начинается с эмодзи или содержит заголовок
                        if (trimmed.split(/\n/).length === 1 && (/^[^\p{L}\p{N}]+/u.test(trimmed) || trimmed.includes("**"))) {
                          return (
                            <p key={`summary-p-${pIdx}`} className="break-words overflow-wrap-anywhere font-semibold max-w-full">
                              {renderInlineContent(trimmed)}
                            </p>
                          );
                        }
                        
                        // Обычный параграф (может содержать несколько строк)
                        const lines = trimmed.split(/\n/).filter(Boolean);
                        return (
                          <div key={`summary-p-${pIdx}`} className="space-y-2 max-w-full">
                            {lines.map((line, lIdx) => (
                              <p key={`summary-line-${lIdx}`} className="break-words overflow-wrap-anywhere max-w-full">
                                {renderInlineContent(line.trim())}
                              </p>
                            ))}
                          </div>
                        );
                      })}
                  </div>
                )}
                {Array.isArray(S.summary.examples) &&
                  S.summary.examples.length > 0 && (
                    <div className="bg-white rounded-xl p-4 mt-4">
                      <ul className="space-y-2 text-lg">
                        {S.summary.examples.map((ex, idx) => (
                          <li key={idx}>
                            • <strong>{ex.fi}</strong> — {ex[lang] || ex.ru}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

