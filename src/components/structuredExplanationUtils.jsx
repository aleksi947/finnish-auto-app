import { Fragment } from "react";

// Утилита для рендеринга markdown (жирный, курсив, код)
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

// Утилита для нормализации колонок
export const normalizeColumns = (cols, lang = "ru") =>
  (cols && cols.length
    ? cols
    : ["Лицо", "Местоимение", "Форма «ei»", "Форма", "Перевод"]
  ).map((c) =>
    typeof c === "string" ? c : c?.[lang] || c?.ru || c?.en || ""
  );

// Универсальный резолвер значений ячеек таблицы
export const cellValueByColumn = (col, row, lang = "ru", colIndex = null) => {
  const norm = (col || "").toLowerCase().trim();
  
  // Обработка повторяющихся колонок через индекс
  // Если колонка "Число + Финский" и это третья колонка (индекс 2), используем row.example
  if (colIndex !== null && norm.includes("число") && norm.includes("финск")) {
    if (colIndex === 2) {
      return row.example ?? row.example1 ?? "";
    }
    // Для первой колонки (индекс 0) используем row.form
    if (colIndex === 0) {
      return row.form ?? "";
    }
  }
  // Если колонка "Перевод" и это повторяющаяся колонка (для порядковых числительных)
  // Проверяем только если есть translation2 (признак повторяющейся колонки)
  if (colIndex !== null && norm.includes("перевод")) {
    // Если это четвертая колонка (индекс 3) и есть translation2, используем его
    if (colIndex === 3 && (row.translation2 || row.ru)) {
      return row.translation2?.ru ?? row.translation2 ?? row.ru ?? "";
    }
    // Если это вторая колонка (индекс 1) и есть translation, используем его
    if (colIndex === 1 && row.translation) {
      return row.translation?.[lang] ?? row.translation?.ru ?? row.translation ?? "";
    }
    // Если это не повторяющаяся колонка, пропускаем эту проверку и используем общую логику ниже
  }

  // Обработка колонок для транзитивных/интранзитивных глаголов
  // ВАЖНО: сначала проверяем intransitiiviverbit, потому что слово
  // "intransitiiviverbit" СОДЕРЖИТ подстроку "transitiiviverbit".
  // Иначе обе колонки будут считаться transitiiviverbit.
  if (
    norm.includes("intransitiiviverbit") ||
    norm.includes("нет объекта") ||
    (norm.includes("непереходн") && !norm.includes("пример"))
  ) {
    // правая колонка — непереходные глаголы
    return row.form ?? row.person ?? "";
  }
  if (
    norm.includes("transitiiviverbit") ||
    norm.includes("есть объект") ||
    (norm.includes("переходн") && !norm.includes("пример"))
  ) {
    // левая колонка — переходные глаголы
    return row.person ?? row.form ?? "";
  }
  
  // Специфичные проверки (должны быть первыми)
  if (norm.includes("инфинитив")) return row.base ?? row.stem ?? "";
  if (norm.includes("глагол")) return row.base ?? row.stem ?? "";
  if (norm.includes("форма") && norm.includes("minä")) return row.person ?? "";
  if (norm.includes("убираем") || (norm.includes("основа") && norm.includes("→"))) return row.ending ?? row.suffix ?? "";
  if (norm.includes("imperatiivi") || norm === "imperatiivi") return row.form ?? "";
  
  // Postpositio (послелог)
  if (norm.includes("postpositio") || norm === "postpositio") return row.form ?? "";
  
  // Таблица чередования согласных: "Сильная" и "Слабая"
  if (norm.includes("сильн")) return row.form ?? "";
  if (norm.includes("слаб")) return row.ending ?? row.suffix ?? "";
  
  if (norm.includes("лицо")) return row.person ?? "";
  if (norm.includes("падеж")) return row.person ?? "";
  if (norm.includes("местоим")) return row.pronoun ?? row.person ?? "";
  
  // Обработка колонок с названиями местоимений
  if (norm.includes("minä") || norm === "minä (я)") return row.pronoun ?? "";
  if (norm.includes("sinä") || norm === "sinä (ты)") return row.pronoun2 ?? "";
  if (norm.includes("hän") || norm === "hän (он/она)") return row.pronoun3 ?? "";
  if (norm === "me (мы)") return row.pronoun4 ?? "";
  if (norm === "te (вы)") return row.pronoun5 ?? "";
  if (norm === "he (они)") return row.pronoun6 ?? "";
  if (norm.includes("окончан")) return row.ending ?? row.suffix ?? "";
  if (norm.includes("час")) return row.person ?? row.base ?? "";
  if (norm.includes("ответ")) return row.ending ?? row.form ?? "";

  // Новые синонимы колонок
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
  
  // Перевод примера (должно быть до проверки "пример")
  if (norm.includes("перевод примера")) {
    return row.note?.ru ?? row.note ?? row.comment?.ru ?? row.comment ?? "";
  }

  // puhui/kysyä колонки (должны быть ДО проверки "пример")
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

  // ei / отрицание
  if (
    norm.includes("«ei»") ||
    norm.includes('"ei"') ||
    norm.includes(" ei") ||
    norm === "ei" ||
    norm.includes("отриц")
  ) {
    return row.ei_form ?? row.particle ?? row.form ?? "";
  }

  // Основа / stem / base / условие (но не "убираем n → основа")
  if (
    (norm.includes("основа") || norm.includes("stem") || norm.includes("base")) &&
    !norm.includes("→")
  ) {
    return row.base ?? row.stem ?? row.condition ?? row.topic ?? "";
  }

  // "Пример + Перевод" - специальная колонка (должна быть до проверки просто "пример")
  if (norm.includes("пример") && norm.includes("перевод")) {
    return row.note?.ru ?? row.note ?? row.comment?.ru ?? row.comment ?? "";
  }

  // Пример(ы) - но не "Пример + Перевод" и не "Пример (puhua)" / "Пример (kysyä)"
  // Проверяем, что это не специальные колонки с puhua/kysyä
  if (norm.includes("пример") && !norm.includes("puhu") && !norm.includes("kysy")) {
    // Если колонка содержит "непереходный", используем example2
    if (norm.includes("непереходн") && row.example2) {
      return row.example2;
    }
    // Если есть example2 и это третья или четвертая колонка (индекс 2 или 3), используем example2
    if (colIndex !== null && colIndex >= 2 && row.example2) {
      return row.example2;
    }
    // Для первой колонки с примером (индекс 1) используем example
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

