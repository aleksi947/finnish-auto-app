import InfoSidebar from "./InfoSidebar";

function LessonInfoBlock({
  lesson,
  sectionId,
  lang = "ru",
  title = "Полезно знать",
}) {
  if (!lesson?.info || !sectionId) return null;

  const infoKey = sectionId + "Info";
  const text = lesson.info[infoKey]?.[lang];

  if (!text) return null;

  return (
    <InfoSidebar title={title}>
      {text.split("\n").map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </InfoSidebar>
  );
}

export default LessonInfoBlock;
