import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { auth } from "../firebase";
import toast from "react-hot-toast";
import {
  getLessonProgress,
  markExerciseStarted,
  markExerciseCompleted,
  getSectionStatus,
  getExerciseStatus,
  getVocabularyTopicStatus,
  getGrammarSectionStatus,
} from "../services/progressService";
import { normalizeProgress } from "../services/progressModel";

/**
 * Hook for lesson progress
 */
export function useProgress(lessonId) {
  const [progress, setProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!lessonId) {
      setIsLoading(false);
      return;
    }

    let unsubscribeProgress = null;

    // Use onAuthStateChanged for reliable auth check
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      // Unsubscribe from previous subscription if any
      if (unsubscribeProgress) {
        unsubscribeProgress();
        unsubscribeProgress = null;
      }

      if (!user) {
        setIsLoading(false);
        setError("Пользователь не авторизован");
        setProgress(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Real-time progress subscription
        const progressRef = doc(db, "users", user.uid, "progress", lessonId);
        const lessonRef = doc(db, "lessons", lessonId);
        const lessonPromise = getDoc(lessonRef);
        
        unsubscribeProgress = onSnapshot(
          progressRef,
          async (snapshot) => {
            if (snapshot.exists()) {
              try {
                const lessonSnapshot = await lessonPromise;
                setProgress(
                  lessonSnapshot.exists()
                    ? normalizeProgress(
                        { ...lessonSnapshot.data(), id: lessonSnapshot.id },
                        snapshot.data(),
                      )
                    : snapshot.data(),
                );
              } catch (lessonError) {
                console.warn(
                  "Не удалось нормализовать прогресс по структуре урока:",
                  lessonError,
                );
                setProgress(snapshot.data());
              }
            } else {
              setProgress(null);
            }
            setIsLoading(false);
          },
          (err) => {
            console.error("Ошибка подписки на прогресс:", err);
            // On permissions error, try one-time getDoc load
            if (err.code === "permission-denied" || err.message.includes("permissions")) {
              console.warn("Проблема с правами доступа, пробуем альтернативный способ загрузки");
              // Load once without subscription
              getLessonProgress(user.uid, lessonId).then((progressData) => {
                setProgress(progressData);
                setIsLoading(false);
              }).catch((loadErr) => {
                console.error("Ошибка загрузки прогресса:", loadErr);
                setError("Не удалось загрузить прогресс. Проверьте правила Firestore.");
                setIsLoading(false);
              });
            } else {
              setError(err.message);
              setIsLoading(false);
            }
          }
        );
      } catch (err) {
        console.error("Ошибка инициализации подписки:", err);
        setError(err.message);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProgress) {
        unsubscribeProgress();
      }
    };
  }, [lessonId]);

  // Mark exercise started
  const handleMarkStarted = useCallback(
    async (sectionId, exerciseId, topicId = null) => {
      const user = auth.currentUser;
      if (!user) {
        console.error("Пользователь не авторизован");
        return { success: false, error: "Не авторизован" };
      }

      const result = await markExerciseStarted(
        user.uid,
        lessonId,
        sectionId,
        exerciseId,
        topicId,
      );
      if (!result.success) {
        toast.error("Не удалось сохранить прогресс. Попробуйте ещё раз.");
      }
      return result;
    },
    [lessonId]
  );

  // Mark exercise completed
  const handleMarkCompleted = useCallback(
    async (sectionId, exerciseId, topicId = null) => {
      const user = auth.currentUser;
      if (!user) {
        console.error("Пользователь не авторизован");
        return { success: false, error: "Не авторизован" };
      }

      const result = await markExerciseCompleted(
        user.uid,
        lessonId,
        sectionId,
        exerciseId,
        topicId,
      );
      if (!result.success) {
        toast.error("Не удалось сохранить прогресс. Попробуйте ещё раз.");
      }
      return result;
    },
    [lessonId]
  );

  // Get section status
  const getSectionStatusValue = useCallback(
    (sectionId) => {
      return getSectionStatus(progress, sectionId);
    },
    [progress]
  );

  // Get exercise status
  const getExerciseStatusValue = useCallback(
    (sectionId, exerciseId, topicId = null) => {
      return getExerciseStatus(progress, sectionId, exerciseId, topicId);
    },
    [progress]
  );

  // Get vocabulary topic status
  const getVocabularyTopicStatusValue = useCallback(
    (topicId) => {
      return getVocabularyTopicStatus(progress, topicId);
    },
    [progress]
  );

  // Get grammar section status
  const getGrammarSectionStatusValue = useCallback(
    (grammarSectionId) => {
      return getGrammarSectionStatus(progress, grammarSectionId);
    },
    [progress]
  );

  return {
    progress,
    isLoading,
    error,
    markExerciseStarted: handleMarkStarted,
    markExerciseCompleted: handleMarkCompleted,
    getSectionStatus: getSectionStatusValue,
    getExerciseStatus: getExerciseStatusValue,
    getVocabularyTopicStatus: getVocabularyTopicStatusValue,
    getGrammarSectionStatus: getGrammarSectionStatusValue,
  };
}
