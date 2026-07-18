import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  PROGRESS_STATUS,
  getExercise,
  normalizeProgress,
  recalculateProgress,
} from "./progressModel";

function lessonWithId(snapshot) {
  return { ...snapshot.data(), id: snapshot.id };
}

/**
 * Get lesson progress normalized against every exercise in the current lesson.
 */
export async function getLessonProgress(userId, lessonId) {
  try {
    if (!userId || !lessonId) return null;

    const progressRef = doc(db, "users", userId, "progress", lessonId);
    const lessonRef = doc(db, "lessons", lessonId);
    const [progressSnap, lessonSnap] = await Promise.all([
      getDoc(progressRef),
      getDoc(lessonRef),
    ]);

    if (!progressSnap.exists()) return null;
    if (!lessonSnap.exists()) {
      console.warn(`Урок ${lessonId} не найден при загрузке прогресса`);
      return progressSnap.data();
    }

    return normalizeProgress(lessonWithId(lessonSnap), progressSnap.data());
  } catch (error) {
    if (
      error.code === "permission-denied" ||
      error.message?.includes("permissions")
    ) {
      console.warn("Нет доступа к прогрессу:", error.message);
      return null;
    }
    console.error("Ошибка загрузки прогресса:", error);
    return null;
  }
}

function progressSnapshot(progress) {
  return JSON.stringify({
    lessonId: progress.lessonId,
    status: progress.status,
    sections: progress.sections,
  });
}

async function updateExerciseStatus(
  userId,
  lessonId,
  sectionId,
  exerciseId,
  topicId,
  targetStatus,
) {
  if (!userId || !lessonId || !sectionId || !exerciseId) {
    throw new Error("Недостаточно данных для сохранения прогресса");
  }

  const progressRef = doc(db, "users", userId, "progress", lessonId);
  const lessonRef = doc(db, "lessons", lessonId);

  return runTransaction(db, async (transaction) => {
    const [lessonSnap, progressSnap] = await Promise.all([
      transaction.get(lessonRef),
      transaction.get(progressRef),
    ]);

    if (!lessonSnap.exists()) {
      throw new Error(`Урок ${lessonId} не найден`);
    }

    const existing = progressSnap.exists()
      ? progressSnap.data()
      : { lessonId, status: PROGRESS_STATUS.NOT_STARTED, sections: {} };
    const progress = normalizeProgress(lessonWithId(lessonSnap), existing);
    const before = progressSnapshot(existing);
    const exercise = getExercise(
      progress,
      sectionId,
      exerciseId,
      topicId,
    );

    if (!exercise) {
      throw new Error(
        `Упражнение ${sectionId}/${topicId || "-"}/${exerciseId} не найдено`,
      );
    }

    if (
      targetStatus === PROGRESS_STATUS.IN_PROGRESS &&
      exercise.status === PROGRESS_STATUS.NOT_STARTED
    ) {
      exercise.status = PROGRESS_STATUS.IN_PROGRESS;
    }

    if (
      targetStatus === PROGRESS_STATUS.COMPLETED &&
      exercise.status !== PROGRESS_STATUS.COMPLETED
    ) {
      exercise.status = PROGRESS_STATUS.COMPLETED;
      exercise.completedAt = serverTimestamp();
    }

    recalculateProgress(progress);

    // A repeated completion report is intentionally a no-op. This prevents
    // render/subscription cycles from producing duplicate Firestore writes.
    if (before === progressSnapshot(progress)) {
      return { success: true, changed: false };
    }

    transaction.set(progressRef, {
      ...progress,
      updatedAt: serverTimestamp(),
    });

    return { success: true, changed: true };
  });
}

export async function markExerciseStarted(
  userId,
  lessonId,
  sectionId,
  exerciseId,
  topicId = null,
) {
  try {
    return await updateExerciseStatus(
      userId,
      lessonId,
      sectionId,
      exerciseId,
      topicId,
      PROGRESS_STATUS.IN_PROGRESS,
    );
  } catch (error) {
    console.error("Ошибка отметки упражнения как начатого:", error);
    return { success: false, error };
  }
}

export async function markExerciseCompleted(
  userId,
  lessonId,
  sectionId,
  exerciseId,
  topicId = null,
) {
  try {
    return await updateExerciseStatus(
      userId,
      lessonId,
      sectionId,
      exerciseId,
      topicId,
      PROGRESS_STATUS.COMPLETED,
    );
  } catch (error) {
    console.error("Ошибка отметки упражнения как завершённого:", error);
    return { success: false, error };
  }
}

export function getSectionStatus(progress, sectionId) {
  return progress?.sections?.[sectionId]?.status || PROGRESS_STATUS.NOT_STARTED;
}

export function getExerciseStatus(
  progress,
  sectionId,
  exerciseId,
  topicId = null,
) {
  return (
    getExercise(progress || {}, sectionId, exerciseId, topicId)?.status ||
    PROGRESS_STATUS.NOT_STARTED
  );
}

export function getVocabularyTopicStatus(progress, topicId) {
  return (
    progress?.sections?.vocabulary?.topics?.[topicId]?.status ||
    PROGRESS_STATUS.NOT_STARTED
  );
}

export function getGrammarSectionStatus(progress, grammarSectionId) {
  return (
    progress?.sections?.grammar?.sections?.[grammarSectionId]?.status ||
    PROGRESS_STATUS.NOT_STARTED
  );
}
