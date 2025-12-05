import MultipleChoiceGroup from "./MultipleChoiceGroup";
import FillInBlank from "./FillInBlank";

function ExerciseRenderer({ exercise, section, currentQuestionIndex, onQuestionChange, onTotalQuestionsChange, onComplete, onMarkStarted, onMarkCompleted }) {
  switch (exercise.type) {
    case "multiple-choice-group":
      return (
        <MultipleChoiceGroup 
          exercise={exercise} 
          section={section} 
          currentQuestionIndex={currentQuestionIndex}
          onQuestionChange={onQuestionChange}
          onTotalQuestionsChange={onTotalQuestionsChange}
          onComplete={onComplete}
          onMarkStarted={onMarkStarted}
          onMarkCompleted={onMarkCompleted}
        />
      );
    case "fill-in-the-blank":
      return (
        <FillInBlank 
          exercise={exercise} 
          onTotalQuestionsChange={onTotalQuestionsChange}
          onComplete={onComplete}
          onMarkStarted={onMarkStarted}
          onMarkCompleted={onMarkCompleted}
        />
      );
    default:
      return (
        <p style={{ color: "red" }}>
          ❌ Неизвестный тип упражнения: {exercise.type}
        </p>
      );
  }
}

export default ExerciseRenderer;
