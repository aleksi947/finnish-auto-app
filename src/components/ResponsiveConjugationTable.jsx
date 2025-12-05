import { User, Hash, Edit3, MessageCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

// Парсинг HTML таблицы в массив данных
function parseTableFromHtml(htmlString) {
  if (!htmlString) return [];
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const tables = doc.querySelectorAll("table");
  
  const result = [];
  
  tables.forEach((table) => {
    const rows = [];
    // Ищем tbody, если его нет - берем все tr из table (кроме заголовков)
    const tbody = table.querySelector("tbody");
    const trs = tbody ? tbody.querySelectorAll("tr") : table.querySelectorAll("tr");
    
    trs.forEach((tr) => {
      // Пропускаем строки заголовков (они содержат th)
      const ths = tr.querySelectorAll("th");
      if (ths.length > 0) return;
      
      const tds = tr.querySelectorAll("td");
      // Поддерживаем как 3 колонки (без окончания), так и 4 (с окончанием)
      if (tds.length >= 3) {
        rows.push({
          person: tds[0]?.textContent.trim() || "",
          ending: tds.length >= 4 && tds[1]?.textContent.trim() ? tds[1].textContent.trim() : "",
          form: tds[tds.length >= 4 ? 2 : 1]?.textContent.trim() || "",
          translation: tds[tds.length >= 4 ? 3 : 2]?.textContent.trim() || "",
        });
      }
    });
    
    if (rows.length > 0) {
      result.push(rows);
    }
  });
  
  return result;
}

// Компонент для отображения одной таблицы
function ConjugationTable({ data, isException = false }) {
  if (!data || data.length === 0) return null;

  return (
    <>
      {/* Desktop/Tablet Table View */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-[#E9F1FF] to-[#CDE8FF]">
              <TableHead className="text-lg">Лицо</TableHead>
              <TableHead className="text-lg">Окончание</TableHead>
              <TableHead className="text-lg">Форма</TableHead>
              <TableHead className="text-lg">Перевод</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow
                key={idx}
                className={
                  idx % 2 === 0
                    ? isException
                      ? "bg-amber-50"
                      : "bg-gray-50"
                    : "bg-white"
                }
              >
                <TableCell className="text-lg">{row.person}</TableCell>
                <TableCell className="text-lg">{row.ending}</TableCell>
                <TableCell className="text-lg">{row.form}</TableCell>
                <TableCell className="text-lg">{row.translation}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {data.map((row, idx) => (
          <div
            key={idx}
            className={`rounded-xl p-4 shadow-sm border-2 ${
              isException
                ? "bg-amber-50 border-amber-200"
                : "bg-white border-[#CFE0FF]"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-sm text-gray-600">Лицо:</span>
                  <span className="ml-2 text-base font-medium">{row.person}</span>
                </div>
              </div>
              {row.ending && (
                <>
                  <div className="h-px bg-gray-200"></div>
                  <div className="flex items-center gap-3">
                    <Hash className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm text-gray-600">Окончание:</span>
                      <span className="ml-2 text-base font-medium">{row.ending}</span>
                    </div>
                  </div>
                </>
              )}
              <div className="h-px bg-gray-200"></div>
              <div className="flex items-center gap-3">
                <Edit3 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-sm text-gray-600">Форма:</span>
                  <span className="ml-2 text-base font-medium">{row.form}</span>
                </div>
              </div>
              <div className="h-px bg-gray-200"></div>
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-sm text-gray-600">Перевод:</span>
                  <span className="ml-2 text-base font-medium">{row.translation}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// Главный компонент - парсит HTML и отображает таблицы
export default function ResponsiveConjugationTable({ htmlContent, isException = false }) {
  if (!htmlContent) return null;
  
  const tables = parseTableFromHtml(htmlContent);

  // Если таблицы не найдены, возвращаем null
  if (tables.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {tables.map((tableData, idx) => (
        <ConjugationTable key={idx} data={tableData} isException={isException} />
      ))}
    </div>
  );
}

