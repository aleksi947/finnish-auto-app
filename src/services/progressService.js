import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Get lesson progress for a user
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
    
    // Empty progress if no document
    return null;
  } catch (error) {
    // permissions error may mean rules not deployed or doc missing
    // Not critical — return null
    if (error.code === "permission-denied" || error.message?.includes("permissions")) {
      console.warn("Нет доступа к прогрессу (возможно правила не применены или документ не существует):", error.message);
      return null;
    }
    console.error("Ошибка загрузки прогресса:", error);
    return null;
  }
}

/**
 * Initialize lesson progress (create document if missing)
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
    // On read permissions error, try creating document
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
 * Compute status from exercise statuses
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
 * Mark exercise as started (on first answer)
 */
export async function markExerciseStarted(userId, lessonId, sectionId, exerciseId, topicId = null) {
  try {
    const progressRef = await ensureProgressDoc(userId, lessonId);
    const progressSnap = await getDoc(progressRef);
    const progress = progressSnap.exists() ? progressSnap.data() : {};
    
    const updateData = {
      updatedAt: serverTimestamp(),
    };
    
    // Init section structure if missing
    if (!progress.sections) {
      progress.sections = {};
    }
    if (!progress.sections[sectionId]) {
      progress.sections[sectionId] = {};
    }
    
    // Vocabulary with topics
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
      
      // Set exercise status
      if (!progress.sections[sectionId].topics[topicId].exercises[exerciseId]) {
        progress.sections[sectionId].topics[topicId].exercises[exerciseId] = {
          status: "in-progress",
        };
      } else if (progress.sections[sectionId].topics[topicId].exercises[exerciseId].status === "not-started") {
        progress.sections[sectionId].topics[topicId].exercises[exerciseId].status = "in-progress";
      }
      
      // Recompute topic status
      const topicExercises = Object.values(progress.sections[sectionId].topics[topicId].exercises);
      const topicStatuses = topicExercises.map(e => e.status);
      progress.sections[sectionId].topics[topicId].status = calculateStatus(topicStatuses);
      
      updateData[`sections.${sectionId}.topics.${topicId}`] = progress.sections[sectionId].topics[topicId];
    }
    // Grammar with sections
    else if (sectionId === "grammar" && topicId) {
      // topicId here is grammar sectionId
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
      
      // Recompute grammar section status
      const grammarSectionExercises = Object.values(progress.sections[sectionId].sections[topicId].exercises);
      const grammarSectionStatuses = grammarSectionExercises.map(e => e.status);
      progress.sections[sectionId].sections[topicId].status = calculateStatus(grammarSectionStatuses);
      
      updateData[`sections.${sectionId}.sections.${topicId}`] = progress.sections[sectionId].sections[topicId];
    }
    // Other sections (listening, speaking, writing, reading)
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
    
    // Recompute section status
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
    
    // Recompute lesson status
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
 * Mark exercise as completed (all questions answered correctly)
 */
export async function markExerciseCompleted(userId, lessonId, sectionId, exerciseId, topicId = null) {
  try {
    const progressRef = await ensureProgressDoc(userId, lessonId);
    const progressSnap = await getDoc(progressRef);
    const progress = progressSnap.exists() ? progressSnap.data() : {};
    
    const updateData = {
      updatedAt: serverTimestamp(),
    };
    
    // Init section structure if missing
    if (!progress.sections) {
      progress.sections = {};
    }
    if (!progress.sections[sectionId]) {
      progress.sections[sectionId] = {};
    }
    
    // Vocabulary with topics
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
      
      // Set exercise status to completed
      progress.sections[sectionId].topics[topicId].exercises[exerciseId] = {
        status: "completed",
        completedAt: serverTimestamp(),
      };
      
      // Recompute topic status
      const topicExercises = Object.values(progress.sections[sectionId].topics[topicId].exercises);
      const topicStatuses = topicExercises.map(e => e.status);
      progress.sections[sectionId].topics[topicId].status = calculateStatus(topicStatuses);
      
      updateData[`sections.${sectionId}.topics.${topicId}`] = progress.sections[sectionId].topics[topicId];
    }
    // Grammar with sections
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
      
      // Recompute grammar section status
      const grammarSectionExercises = Object.values(progress.sections[sectionId].sections[topicId].exercises);
      const grammarSectionStatuses = grammarSectionExercises.map(e => e.status);
      progress.sections[sectionId].sections[topicId].status = calculateStatus(grammarSectionStatuses);
      
      updateData[`sections.${sectionId}.sections.${topicId}`] = progress.sections[sectionId].sections[topicId];
    }
    // Other sections
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
    
    // Recompute section status
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
    
    // Recompute lesson status
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
 * Get section status
 */
export function getSectionStatus(progress, sectionId) {
  if (!progress || !progress.sections || !progress.sections[sectionId]) {
    return "not-started";
  }
  
  return progress.sections[sectionId].status || "not-started";
}

/**
 * Get exercise status
 */
export function getExerciseStatus(progress, sectionId, exerciseId, topicId = null) {
  if (!progress || !progress.sections || !progress.sections[sectionId]) {
    return "not-started";
  }
  
  const section = progress.sections[sectionId];
  
  // Vocabulary with topics
  if (sectionId === "vocabulary" && topicId && section.topics && section.topics[topicId]) {
    const exercise = section.topics[topicId].exercises?.[exerciseId];
    return exercise?.status || "not-started";
  }
  
  // Grammar with sections
  if (sectionId === "grammar" && topicId && section.sections && section.sections[topicId]) {
    const exercise = section.sections[topicId].exercises?.[exerciseId];
    return exercise?.status || "not-started";
  }
  
  // Other sections
  if (section.exercises && section.exercises[exerciseId]) {
    return section.exercises[exerciseId].status || "not-started";
  }
  
  return "not-started";
}

/**
 * Get vocabulary topic status
 */
export function getVocabularyTopicStatus(progress, topicId) {
  if (!progress || !progress.sections || !progress.sections.vocabulary || !progress.sections.vocabulary.topics) {
    return "not-started";
  }
  
  const topic = progress.sections.vocabulary.topics[topicId];
  return topic?.status || "not-started";
}

/**
 * Get grammar section status
 */
export function getGrammarSectionStatus(progress, grammarSectionId) {
  if (!progress || !progress.sections || !progress.sections.grammar || !progress.sections.grammar.sections) {
    return "not-started";
  }
  
  const grammarSection = progress.sections.grammar.sections[grammarSectionId];
  return grammarSection?.status || "not-started";
}

