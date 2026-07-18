export const PROGRESS_STATUS = {
  NOT_STARTED: "not-started",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
};

const exerciseEntry = () => ({ status: PROGRESS_STATUS.NOT_STARTED });

function exerciseMap(ids) {
  return Object.fromEntries(
    ids.filter(Boolean).map((id) => [id, exerciseEntry()]),
  );
}

function taskIds(tasks) {
  return Array.isArray(tasks) ? tasks.map((task) => task?.id).filter(Boolean) : [];
}

function readingTaskIds(reading) {
  if (!reading) return [];
  const blocks = Array.isArray(reading) ? reading : [reading];
  return blocks.flatMap((block) => taskIds(block?.tasks));
}

export function buildProgressSections(lesson = {}) {
  const sections = {};

  if (
    lesson.vocabulary &&
    !Array.isArray(lesson.vocabulary) &&
    typeof lesson.vocabulary === "object"
  ) {
    const topics = Object.fromEntries(
      Object.keys(lesson.vocabulary).map((topicId) => [
        topicId,
        {
          status: PROGRESS_STATUS.NOT_STARTED,
          exercises: exerciseMap([`quiz-${topicId}`, `write-${topicId}`]),
        },
      ]),
    );

    if (Object.keys(topics).length > 0) {
      sections.vocabulary = {
        status: PROGRESS_STATUS.NOT_STARTED,
        topics,
      };
    }
  }

  const grammarSections = Array.isArray(lesson.grammar?.sections)
    ? lesson.grammar.sections
    : [];
  const grammar = Object.fromEntries(
    grammarSections
      .filter((section) => section?.id)
      .map((section) => [
        section.id,
        {
          status: PROGRESS_STATUS.NOT_STARTED,
          exercises: exerciseMap(taskIds(section.exercises)),
        },
      ])
      .filter(([, section]) => Object.keys(section.exercises).length > 0),
  );

  if (Object.keys(grammar).length > 0) {
    sections.grammar = {
      status: PROGRESS_STATUS.NOT_STARTED,
      sections: grammar,
    };
  }

  const regularSections = {
    listening: taskIds(lesson.listening?.tasks),
    speaking: taskIds(lesson.speaking),
    writing: taskIds(lesson.writing),
    reading: readingTaskIds(lesson.reading),
  };

  Object.entries(regularSections).forEach(([sectionId, ids]) => {
    if (ids.length > 0) {
      sections[sectionId] = {
        status: PROGRESS_STATUS.NOT_STARTED,
        exercises: exerciseMap(ids),
      };
    }
  });

  return sections;
}

export function calculateStatus(statuses) {
  if (!statuses.length) return PROGRESS_STATUS.NOT_STARTED;
  if (statuses.every((status) => status === PROGRESS_STATUS.COMPLETED)) {
    return PROGRESS_STATUS.COMPLETED;
  }
  if (
    statuses.some(
      (status) =>
        status === PROGRESS_STATUS.IN_PROGRESS ||
        status === PROGRESS_STATUS.COMPLETED,
    )
  ) {
    return PROGRESS_STATUS.IN_PROGRESS;
  }
  return PROGRESS_STATUS.NOT_STARTED;
}

function mergeExercises(expected, existing = {}) {
  return Object.fromEntries(
    Object.entries(expected).map(([exerciseId, template]) => [
      exerciseId,
      existing[exerciseId] ? { ...template, ...existing[exerciseId] } : template,
    ]),
  );
}

export function normalizeProgress(lesson, existing = {}) {
  const expectedSections = buildProgressSections(lesson);
  const currentSections = existing.sections || {};

  const sections = Object.fromEntries(
    Object.entries(expectedSections).map(([sectionId, template]) => {
      const current = currentSections[sectionId] || {};

      if (template.topics) {
        const topics = Object.fromEntries(
          Object.entries(template.topics).map(([topicId, topicTemplate]) => {
            const currentTopic = current.topics?.[topicId] || {};
            const exercises = mergeExercises(
              topicTemplate.exercises,
              currentTopic.exercises,
            );
            return [
              topicId,
              {
                ...topicTemplate,
                ...currentTopic,
                exercises,
                status: calculateStatus(
                  Object.values(exercises).map((item) => item.status),
                ),
              },
            ];
          }),
        );
        return [
          sectionId,
          {
            ...template,
            ...current,
            topics,
            status: calculateStatus(
              Object.values(topics).map((item) => item.status),
            ),
          },
        ];
      }

      if (template.sections) {
        const nestedSections = Object.fromEntries(
          Object.entries(template.sections).map(
            ([nestedSectionId, nestedTemplate]) => {
              const currentNested = current.sections?.[nestedSectionId] || {};
              const exercises = mergeExercises(
                nestedTemplate.exercises,
                currentNested.exercises,
              );
              return [
                nestedSectionId,
                {
                  ...nestedTemplate,
                  ...currentNested,
                  exercises,
                  status: calculateStatus(
                    Object.values(exercises).map((item) => item.status),
                  ),
                },
              ];
            },
          ),
        );
        return [
          sectionId,
          {
            ...template,
            ...current,
            sections: nestedSections,
            status: calculateStatus(
              Object.values(nestedSections).map((item) => item.status),
            ),
          },
        ];
      }

      const exercises = mergeExercises(template.exercises, current.exercises);
      return [
        sectionId,
        {
          ...template,
          ...current,
          exercises,
          status: calculateStatus(
            Object.values(exercises).map((item) => item.status),
          ),
        },
      ];
    }),
  );

  return {
    ...existing,
    lessonId: lesson.id || existing.lessonId,
    sections,
    status: calculateStatus(
      Object.values(sections).map((section) => section.status),
    ),
  };
}

export function getExercise(progress, sectionId, exerciseId, topicId = null) {
  const section = progress.sections?.[sectionId];
  if (!section) return null;
  if (sectionId === "vocabulary" && topicId) {
    return section.topics?.[topicId]?.exercises?.[exerciseId] || null;
  }
  if (sectionId === "grammar" && topicId) {
    return section.sections?.[topicId]?.exercises?.[exerciseId] || null;
  }
  return section.exercises?.[exerciseId] || null;
}

export function recalculateProgress(progress) {
  const sections = progress.sections || {};

  Object.values(sections).forEach((section) => {
    if (section.topics) {
      Object.values(section.topics).forEach((topic) => {
        topic.status = calculateStatus(
          Object.values(topic.exercises || {}).map((item) => item.status),
        );
      });
      section.status = calculateStatus(
        Object.values(section.topics).map((item) => item.status),
      );
    } else if (section.sections) {
      Object.values(section.sections).forEach((nestedSection) => {
        nestedSection.status = calculateStatus(
          Object.values(nestedSection.exercises || {}).map(
            (item) => item.status,
          ),
        );
      });
      section.status = calculateStatus(
        Object.values(section.sections).map((item) => item.status),
      );
    } else {
      section.status = calculateStatus(
        Object.values(section.exercises || {}).map((item) => item.status),
      );
    }
  });

  progress.status = calculateStatus(
    Object.values(sections).map((section) => section.status),
  );
  return progress;
}
