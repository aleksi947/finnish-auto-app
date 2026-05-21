import { Fragment } from "react";

// Markdown render utility (bold, italic, code)
export const renderInlineContent = (text) => {
  if (!text) return null;
  const tokens =
    typeof text === "string"
      ? text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).filter(Boolean)
      : [text];

  return tokens.map((token, idx) => {
    if (typeof token !== "string") {
      return <Fragment key={`node-${idx}`}>{token}</Fragment>;
    }

    const trimmed = token.trim();
    if (
      token.startsWith("**") &&
      token.endsWith("**") &&
      trimmed.length > 4
    ) {
      return (
        <strong key={`bold-${idx}`} className="break-words overflow-wrap-anywhere">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("*") && token.endsWith("*") && trimmed.length > 2) {
      return (
        <em key={`italic-${idx}`} className="break-words overflow-wrap-anywhere">
          {token.slice(1, -1)}
        </em>
      );
    }
    if (token.startsWith("`") && token.endsWith("`") && token.length >= 2) {
      return (
        <code
          key={`code-${idx}`}
          className="rounded bg-slate-100 px-1 py-0.5 text-sm text-slate-700 break-words overflow-wrap-anywhere"
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    return (
      <span key={`plain-${idx}`} className="break-words overflow-wrap-anywhere">
        {token}
      </span>
    );
  });
};

// Column normalization utility
export const normalizeColumns = (cols, lang = "ru") =>
  (cols && cols.length
    ? cols
    : ["Лицо", "Местоимение", "Форма «ei»", "Форма", "Перевод"]
  ).map((c) =>
    typeof c === "string" ? c : c?.[lang] || c?.ru || c?.en || ""
  );

// Universal table cell value resolver
export const cellValueByColumn = (col, row, lang = "ru", colIndex = null) => {
  const norm = (col || "").toLowerCase().trim();
  
  // Repeated columns by index
  // Column "Number + Finnish" at index 2 — use row.example
  if (colIndex !== null && norm.includes("число") && norm.includes("финск")) {
    if (colIndex === 2) {
      return row.example ?? row.example1 ?? "";
    }
    // First column (index 0) — row.form
    if (colIndex === 0) {
      return row.form ?? "";
    }
  }
  // Column "Translation" as a repeated column (ordinal numerals)
  // Only when translation2 exists (marks a repeated column)
  if (colIndex !== null && norm.includes("перевод")) {
    // Fourth column (index 3) with translation2 — use it
    if (colIndex === 3 && (row.translation2 || row.ru)) {
      return row.translation2?.ru ?? row.translation2 ?? row.ru ?? "";
    }
    // Second column (index 1) with translation — use it
    if (colIndex === 1 && row.translation) {
      return row.translation?.[lang] ?? row.translation?.ru ?? row.translation ?? "";
    }
    // Not a repeated column — skip and use general logic below
  }

  // Transitive/intransitive verb columns
  // IMPORTANT: check intransitiiviverbit first because the word
  // "intransitiiviverbit" CONTAINS substring "transitiiviverbit".
  // Otherwise both columns would match transitiiviverbit.
  if (
    norm.includes("intransitiiviverbit") ||
    norm.includes("нет объекта") ||
    (norm.includes("непереходн") && !norm.includes("пример"))
  ) {
    // right column — intransitive verbs
    return row.form ?? row.person ?? "";
  }
  if (
    norm.includes("transitiiviverbit") ||
    norm.includes("есть объект") ||
    (norm.includes("переходн") && !norm.includes("пример"))
  ) {
    // left column — transitive verbs
    return row.person ?? row.form ?? "";
  }
  
  // Specific checks first
  if (norm.includes("инфинитив")) return row.base ?? row.stem ?? "";
  if (norm.includes("глагол")) return row.base ?? row.stem ?? "";
  if (norm.includes("форма") && norm.includes("minä")) return row.person ?? "";
  if (norm.includes("убираем") || (norm.includes("основа") && norm.includes("→"))) return row.ending ?? row.suffix ?? "";
  if (norm.includes("imperatiivi") || norm === "imperatiivi") return row.form ?? "";
  
  // Postpositio (postposition)
  if (norm.includes("postpositio") || norm === "postpositio") return row.form ?? "";
  
  // Consonant gradation table: "Strong" and "Weak"
  if (norm.includes("сильн")) return row.form ?? "";
  if (norm.includes("слаб")) return row.ending ?? row.suffix ?? "";
  
  if (norm.includes("лицо")) return row.person ?? "";
  if (norm.includes("падеж")) return row.person ?? "";
  if (norm.includes("местоим")) return row.pronoun ?? row.person ?? "";
  
  // Pronoun name columns
  if (norm.includes("minä") || norm === "minä (я)") return row.pronoun ?? "";
  if (norm.includes("sinä") || norm === "sinä (ты)") return row.pronoun2 ?? "";
  if (norm.includes("hän") || norm === "hän (он/она)") return row.pronoun3 ?? "";
  if (norm === "me (мы)") return row.pronoun4 ?? "";
  if (norm === "te (вы)") return row.pronoun5 ?? "";
  if (norm === "he (они)") return row.pronoun6 ?? "";
  if (norm.includes("окончан")) return row.ending ?? row.suffix ?? "";
  if (norm.includes("час")) return row.person ?? row.base ?? "";
  if (norm.includes("ответ")) return row.ending ?? row.form ?? "";

  // New column synonyms
  if (norm.includes("финск")) {
    return row.example ?? row.example1 ?? row.examplePuhua ?? row.fi ?? "";
  }
  if (norm.includes("вопрос")) {
    if ((norm.includes("ru") || norm.includes("ру")) && (row.questionRU || row.question_ru)) {
      return row.questionRU ?? row.question_ru;
    }
    if ((norm.includes("fi") || norm.includes("фи")) && (row.questionFI || row.question_fi)) {
      return row.questionFI ?? row.question_fi;
    }
    return row.base ?? row.question ?? row.fi ?? "";
  }
  if (norm.includes("объект")) {
    return row.example1 ?? row.form ?? row.object ?? "";
  }
  if (norm.includes("поясн") || norm.includes("примеч") || norm.includes("объясн")) {
    return row.note?.ru ?? row.note ?? row.comment?.ru ?? row.comment ?? "";
  }
  
  // Example translation (before "example" check)
  if (norm.includes("перевод примера")) {
    return row.note?.ru ?? row.note ?? row.comment?.ru ?? row.comment ?? "";
  }

  // puhui/kysyä columns (before "example" check)
  if (norm.includes("puhu")) {
    return (
      row.examplePuhua ??
      row.example ??
      row.example1 ??
      (Array.isArray(row.examples) ? row.examples[0] : "") ??
      ""
    );
  }
  if (norm.includes("kysy")) {
    return (
      row.exampleKysya ??
      row.example2 ??
      (Array.isArray(row.examples) ? row.examples[1] : "") ??
      ""
    );
  }

  // ei / negation
  if (
    norm.includes("«ei»") ||
    norm.includes('"ei"') ||
    norm.includes(" ei") ||
    norm === "ei" ||
    norm.includes("отриц")
  ) {
    return row.ei_form ?? row.particle ?? row.form ?? "";
  }

  // Stem / base / condition (not "remove n → stem")
  if (
    (norm.includes("основа") || norm.includes("stem") || norm.includes("base")) &&
    !norm.includes("→")
  ) {
    return row.base ?? row.stem ?? row.condition ?? row.topic ?? "";
  }

  // "Example + Translation" — special column (before plain "example" check)
  if (norm.includes("пример") && norm.includes("перевод")) {
    return row.note?.ru ?? row.note ?? row.comment?.ru ?? row.comment ?? "";
  }

  // Example(s) — not "Example + Translation" or "Example (puhua)" / "Example (kysyä)"
  // Skip special puhua/kysyä columns
  if (norm.includes("пример") && !norm.includes("puhu") && !norm.includes("kysy")) {
    // Column contains "intransitive" — use example2
    if (norm.includes("непереходн") && row.example2) {
      return row.example2;
    }
    // example2 on column index 2 or 3 — use example2
    if (colIndex !== null && colIndex >= 2 && row.example2) {
      return row.example2;
    }
    // First example column (index 1) — use example
    if (colIndex === 1 && row.example) {
      return row.example;
    }
    return row.examples ?? row.example ?? row.example1 ?? row.example2 ?? "";
  }

  if (norm.includes("форма")) return row.form ?? "";
  if (norm.includes("утвердит")) return row.form ?? "";
  if (norm.includes("отрицат")) return row.ei_form ?? row.particle ?? "";

  if (norm.includes("перевод")) {
    return row.translation?.[lang] ?? row.ru ?? row.translation ?? "";
  }

  // fallback
  return row[col] ?? row[norm] ?? "";
};

