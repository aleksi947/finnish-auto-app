import test from "node:test";
import assert from "node:assert/strict";
import {
  buildProgressSections,
  getExercise,
  normalizeProgress,
  recalculateProgress,
} from "./progressModel.js";

const lesson = {
  id: "A1-1",
  vocabulary: {
    greetings: { words: [{ fi: "hei" }] },
  },
  grammar: {
    sections: [
      {
        id: "olla",
        exercises: [{ id: "olla-1" }, { id: "olla-2" }],
      },
    ],
  },
  listening: {
    tasks: [
      { id: "listen-1", type: "multiple-choice" },
      { id: "listen-2", type: "fill-in-the-text" },
    ],
  },
  reading: {
    tasks: [{ id: "read-1", type: "sort-dialogue" }],
  },
};

test("builds progress entries for every supported lesson exercise", () => {
  const sections = buildProgressSections(lesson);

  assert.deepEqual(Object.keys(sections).sort(), [
    "grammar",
    "listening",
    "reading",
    "vocabulary",
  ]);
  assert.deepEqual(
    Object.keys(sections.vocabulary.topics.greetings.exercises).sort(),
    ["quiz-greetings", "write-greetings"],
  );
  assert.deepEqual(Object.keys(sections.listening.exercises).sort(), [
    "listen-1",
    "listen-2",
  ]);
});

test("one completed exercise cannot complete its section or lesson", () => {
  const existing = {
    lessonId: lesson.id,
    status: "completed",
    sections: {
      listening: {
        status: "completed",
        exercises: {
          "listen-1": { status: "completed" },
        },
      },
    },
  };

  const progress = normalizeProgress(lesson, existing);

  assert.equal(progress.sections.listening.status, "in-progress");
  assert.equal(progress.sections.listening.exercises["listen-2"].status, "not-started");
  assert.equal(progress.status, "in-progress");
});

test("lesson completes only when every expected exercise is completed", () => {
  const progress = normalizeProgress(lesson);

  Object.values(progress.sections).forEach((section) => {
    if (section.topics) {
      Object.values(section.topics).forEach((topic) => {
        Object.values(topic.exercises).forEach((exercise) => {
          exercise.status = "completed";
        });
      });
    } else if (section.sections) {
      Object.values(section.sections).forEach((nestedSection) => {
        Object.values(nestedSection.exercises).forEach((exercise) => {
          exercise.status = "completed";
        });
      });
    } else {
      Object.values(section.exercises).forEach((exercise) => {
        exercise.status = "completed";
      });
    }
  });

  recalculateProgress(progress);

  assert.equal(progress.status, "completed");
  assert.equal(
    getExercise(progress, "reading", "read-1").status,
    "completed",
  );
});

test("removed exercises do not block current lesson completion", () => {
  const progress = normalizeProgress(lesson, {
    lessonId: lesson.id,
    sections: {
      listening: {
        exercises: {
          obsolete: { status: "in-progress" },
        },
      },
    },
  });

  assert.equal(progress.sections.listening.exercises.obsolete, undefined);
});
