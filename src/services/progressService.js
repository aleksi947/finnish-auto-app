import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Получить прогресс урока для пользователя
 */
export async function getLessonProgress(userId, lessonId) {
  try {
    if (!userId || !lessonId) {
      return null;
    }
    
    const progressRef = doc(db, "users", userId, "progress", lessonId);
    const progressSnap = await getDoc(progressRef);
    
    if (progressSnap.exists()) {
      return progressSnap.data();
    }
    
    // Возвращаем пустой прогресс если документа нет
    return null;
  } catch (error) {
    // Если ошибка permissions, это может означать что правила не применены или документ не существует
    // Не логируем как критическую ошибку, просто возвращаем null
    if (error.code === "permission-denied" || error.message?.includes("permissions")) {
      console.warn("Нет доступа к прогрессу (возможно правила не применены или документ не существует):", error.message);
      return null;
    }
    console.error("Ошибка загрузки прогресса:", error);
    return null;
  }
}

/**
 * Инициализировать прогресс урока (создать документ если его нет)
 */
async function ensureProgressDoc(userId, lessonId) {
  if (!userId || !lessonId) {
    throw new Error("userId и lessonId обязательны");
  }
  
  const progressRef = doc(db, "users", userId, "progress", lessonId);
  
  try {
    const progressSnap = await getDoc(progressRef);
    
    if (!progressSnap.exists()) {
      await setDoc(progressRef, {
        lessonId,
        status: "not-started",
        sections: {},
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    // Если ошибка permissions при чтении, пробуем создать документ
    if (error.code === "permission-denied" || error.message?.includes("permissions")) {
      console.warn("Ошибка доступа при проверке прогресса, пробуем создать:", error.message);
      try {
        await setDoc(progressRef, {
          lessonId,
          status: "not-started",
          sections: {},
          updatedAt: serverTimestamp(),
        });
      } catch (writeError) {
        console.error("Ошибка создания документа прогресса:", writeError);
        throw writeError;
      }
    } else {
      throw error;
    }
  }
  
  return progressRef;
}

/**
 * Рассчитать статус на основе статусов упражнений
 */
function calculateStatus(exerciseStatuses) {
  if (!exerciseStatuses || exerciseStatuses.length === 0) {
    return "not-started";
  }
  
  const allCompleted = exerciseStatuses.every(s => s === "completed");
  const hasInProgress = exerciseStatuses.some(s => s === "in-progress" || s === "completed");
  
  if (allCompleted) {
    return "completed";
  }
  
  if (hasInProgress) {
    return "in-progress";
  }
  
  return "not-started";
}

/**
 * Отметить упражнение как начатое (при первом ответе)
 */
export async function markExerciseStarted(userId, lessonId, sectionId, exerciseId, topicId = null) {
  try {
    const progressRef = await ensureProgressDoc(userId, lessonId);
    const progressSnap = await getDoc(progressRef);
    const progress = progressSnap.exists() ? progressSnap.data() : {};
    
    const updateData = {
      updatedAt: serverTimestamp(),
    };
    
    // Инициализируем структуру раздела если её нет
    if (!progress.sections) {
      progress.sections = {};
    }
    if (!progress.sections[sectionId]) {
      progress.sections[sectionId] = {};
    }
    
    // Для vocabulary с темами
    if (sectionId === "vocabulary" && topicId) {
      if (!progress.sections[sectionId].topics) {
        progress.sections[sectionId].topics = {};
      }
      if (!progress.sections[sectionId].topics[topicId]) {
        progress.sections[sectionId].topics[topicId] = {
          status: "not-started",
          exercises: {},
        };
      }
      if (!progress.sections[sectionId].topics[topicId].exercises) {
        progress.sections[sectionId].topics[topicId].exercises = {};
      }
      
      // Устанавливаем статус упражнения
      if (!progress.sections[sectionId].topics[topicId].exercises[exerciseId]) {
        progress.sections[sectionId].topics[topicId].exercises[exerciseId] = {
          status: "in-progress",
        };
      } else if (progress.sections[sectionId].topics[topicId].exercises[exerciseId].status === "not-started") {
        progress.sections[sectionId].topics[topicId].exercises[exerciseId].status = "in-progress";
      }
      
      // Пересчитываем статус темы
      const topicExercises = Object.values(progress.sections[sectionId].topics[topicId].exercises);
      const topicStatuses = topicExercises.map(e => e.status);
      progress.sections[sectionId].topics[topicId].status = calculateStatus(topicStatuses);
      
      updateData[`sections.${sectionId}.topics.${topicId}`] = progress.sections[sectionId].topics[topicId];
    }
    // Для grammar с секциями
    else if (sectionId === "grammar" && topicId) {
      // topicId здесь это sectionId грамматики
      if (!progress.sections[sectionId].sections) {
        progress.sections[sectionId].sections = {};
      }
      if (!progress.sections[sectionId].sections[topicId]) {
        progress.sections[sectionId].sections[topicId] = {
          status: "not-started",
          exercises: {},
        };
      }
      if (!progress.sections[sectionId].sections[topicId].exercises) {
        progress.sections[sectionId].sections[topicId].exercises = {};
      }
      
      if (!progress.sections[sectionId].sections[topicId].exercises[exerciseId]) {
        progress.sections[sectionId].sections[topicId].exercises[exerciseId] = {
          status: "in-progress",
        };
      } else if (progress.sections[sectionId].sections[topicId].exercises[exerciseId].status === "not-started") {
        progress.sections[sectionId].sections[topicId].exercises[exerciseId].status = "in-progress";
      }
      
      // Пересчитываем статус секции грамматики
      const grammarSectionExercises = Object.values(progress.sections[sectionId].sections[topicId].exercises);
      const grammarSectionStatuses = grammarSectionExercises.map(e => e.status);
      progress.sections[sectionId].sections[topicId].status = calculateStatus(grammarSectionStatuses);
      
      updateData[`sections.${sectionId}.sections.${topicId}`] = progress.sections[sectionId].sections[topicId];
    }
    // Для остальных разделов (listening, speaking, writing, reading)
    else {
      if (!progress.sections[sectionId].exercises) {
        progress.sections[sectionId].exercises = {};
      }
      
      if (!progress.sections[sectionId].exercises[exerciseId]) {
        progress.sections[sectionId].exercises[exerciseId] = {
          status: "in-progress",
        };
      } else if (progress.sections[sectionId].exercises[exerciseId].status === "not-started") {
        progress.sections[sectionId].exercises[exerciseId].status = "in-progress";
      }
      
      updateData[`sections.${sectionId}.exercises.${exerciseId}`] = progress.sections[sectionId].exercises[exerciseId];
    }
    
    // Пересчитываем статус раздела
    let sectionStatuses = [];
    
    if (sectionId === "vocabulary" && progress.sections[sectionId].topics) {
      sectionStatuses = Object.values(progress.sections[sectionId].topics).map(t => t.status);
    } else if (sectionId === "grammar" && progress.sections[sectionId].sections) {
      sectionStatuses = Object.values(progress.sections[sectionId].sections).map(s => s.status);
    } else if (progress.sections[sectionId].exercises) {
      sectionStatuses = Object.values(progress.sections[sectionId].exercises).map(e => e.status);
    }
    
    const sectionStatus = calculateStatus(sectionStatuses);
    progress.sections[sectionId].status = sectionStatus;
    updateData[`sections.${sectionId}.status`] = sectionStatus;
    
    // Пересчитываем статус урока
    const lessonSectionStatuses = Object.values(progress.sections).map(s => s.status);
    const lessonStatus = calculateStatus(lessonSectionStatuses);
    updateData.status = lessonStatus;
    
    await updateDoc(progressRef, updateData);
    
    return { success: true };
  } catch (error) {
    console.error("Ошибка отметки упражнения как начатого:", error);
    return { success: false, error };
  }
}

/**
 * Отметить упражнение как завершенное (когда все вопросы отвечены правильно)
 */
export async function markExerciseCompleted(userId, lessonId, sectionId, exerciseId, topicId = null) {
  try {
    const progressRef = await ensureProgressDoc(userId, lessonId);
    const progressSnap = await getDoc(progressRef);
    const progress = progressSnap.exists() ? progressSnap.data() : {};
    
    const updateData = {
      updatedAt: serverTimestamp(),
    };
    
    // Инициализируем структуру раздела если её нет
    if (!progress.sections) {
      progress.sections = {};
    }
    if (!progress.sections[sectionId]) {
      progress.sections[sectionId] = {};
    }
    
    // Для vocabulary с темами
    if (sectionId === "vocabulary" && topicId) {
      if (!progress.sections[sectionId].topics) {
        progress.sections[sectionId].topics = {};
      }
      if (!progress.sections[sectionId].topics[topicId]) {
        progress.sections[sectionId].topics[topicId] = {
          status: "not-started",
          exercises: {},
        };
      }
      if (!progress.sections[sectionId].topics[topicId].exercises) {
        progress.sections[sectionId].topics[topicId].exercises = {};
      }
      
      // Устанавливаем статус упражнения как завершенное
      progress.sections[sectionId].topics[topicId].exercises[exerciseId] = {
        status: "completed",
        completedAt: serverTimestamp(),
      };
      
      // Пересчитываем статус темы
      const topicExercises = Object.values(progress.sections[sectionId].topics[topicId].exercises);
      const topicStatuses = topicExercises.map(e => e.status);
      progress.sections[sectionId].topics[topicId].status = calculateStatus(topicStatuses);
      
      updateData[`sections.${sectionId}.topics.${topicId}`] = progress.sections[sectionId].topics[topicId];
    }
    // Для grammar с секциями
    else if (sectionId === "grammar" && topicId) {
      if (!progress.sections[sectionId].sections) {
        progress.sections[sectionId].sections = {};
      }
      if (!progress.sections[sectionId].sections[topicId]) {
        progress.sections[sectionId].sections[topicId] = {
          status: "not-started",
          exercises: {},
        };
      }
      if (!progress.sections[sectionId].sections[topicId].exercises) {
        progress.sections[sectionId].sections[topicId].exercises = {};
      }
      
      progress.sections[sectionId].sections[topicId].exercises[exerciseId] = {
        status: "completed",
        completedAt: serverTimestamp(),
      };
      
      // Пересчитываем статус секции грамматики
      const grammarSectionExercises = Object.values(progress.sections[sectionId].sections[topicId].exercises);
      const grammarSectionStatuses = grammarSectionExercises.map(e => e.status);
      progress.sections[sectionId].sections[topicId].status = calculateStatus(grammarSectionStatuses);
      
      updateData[`sections.${sectionId}.sections.${topicId}`] = progress.sections[sectionId].sections[topicId];
    }
    // Для остальных разделов
    else {
      if (!progress.sections[sectionId].exercises) {
        progress.sections[sectionId].exercises = {};
      }
      
      progress.sections[sectionId].exercises[exerciseId] = {
        status: "completed",
        completedAt: serverTimestamp(),
      };
      
      updateData[`sections.${sectionId}.exercises.${exerciseId}`] = progress.sections[sectionId].exercises[exerciseId];
    }
    
    // Пересчитываем статус раздела
    let sectionStatuses = [];
    
    if (sectionId === "vocabulary" && progress.sections[sectionId].topics) {
      sectionStatuses = Object.values(progress.sections[sectionId].topics).map(t => t.status);
    } else if (sectionId === "grammar" && progress.sections[sectionId].sections) {
      sectionStatuses = Object.values(progress.sections[sectionId].sections).map(s => s.status);
    } else if (progress.sections[sectionId].exercises) {
      sectionStatuses = Object.values(progress.sections[sectionId].exercises).map(e => e.status);
    }
    
    const sectionStatus = calculateStatus(sectionStatuses);
    progress.sections[sectionId].status = sectionStatus;
    updateData[`sections.${sectionId}.status`] = sectionStatus;
    
    // Пересчитываем статус урока
    const lessonSectionStatuses = Object.values(progress.sections).map(s => s.status);
    const lessonStatus = calculateStatus(lessonSectionStatuses);
    updateData.status = lessonStatus;
    
    await updateDoc(progressRef, updateData);
    
    return { success: true };
  } catch (error) {
    console.error("Ошибка отметки упражнения как завершенного:", error);
    return { success: false, error };
  }
}

/**
 * Получить статус раздела
 */
export function getSectionStatus(progress, sectionId) {
  if (!progress || !progress.sections || !progress.sections[sectionId]) {
    return "not-started";
  }
  
  return progress.sections[sectionId].status || "not-started";
}

/**
 * Получить статус упражнения
 */
export function getExerciseStatus(progress, sectionId, exerciseId, topicId = null) {
  if (!progress || !progress.sections || !progress.sections[sectionId]) {
    return "not-started";
  }
  
  const section = progress.sections[sectionId];
  
  // Для vocabulary с темами
  if (sectionId === "vocabulary" && topicId && section.topics && section.topics[topicId]) {
    const exercise = section.topics[topicId].exercises?.[exerciseId];
    return exercise?.status || "not-started";
  }
  
  // Для grammar с секциями
  if (sectionId === "grammar" && topicId && section.sections && section.sections[topicId]) {
    const exercise = section.sections[topicId].exercises?.[exerciseId];
    return exercise?.status || "not-started";
  }
  
  // Для остальных разделов
  if (section.exercises && section.exercises[exerciseId]) {
    return section.exercises[exerciseId].status || "not-started";
  }
  
  return "not-started";
}

/**
 * Получить статус темы vocabulary
 */
export function getVocabularyTopicStatus(progress, topicId) {
  if (!progress || !progress.sections || !progress.sections.vocabulary || !progress.sections.vocabulary.topics) {
    return "not-started";
  }
  
  const topic = progress.sections.vocabulary.topics[topicId];
  return topic?.status || "not-started";
}

/**
 * Получить статус секции grammar
 */
export function getGrammarSectionStatus(progress, grammarSectionId) {
  if (!progress || !progress.sections || !progress.sections.grammar || !progress.sections.grammar.sections) {
    return "not-started";
  }
  
  const grammarSection = progress.sections.grammar.sections[grammarSectionId];
  return grammarSection?.status || "not-started";
}

