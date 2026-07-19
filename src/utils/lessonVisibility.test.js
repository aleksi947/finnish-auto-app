import test from "node:test";
import assert from "node:assert/strict";
import { isLessonPublished } from "./lessonVisibility.js";

test("existing lessons without a published field stay visible", () => {
  assert.equal(isLessonPublished({ id: "A1-1" }), true);
});

test("lesson is hidden only when published is explicitly false", () => {
  assert.equal(isLessonPublished({ id: "A1-10", published: false }), false);
  assert.equal(isLessonPublished({ id: "A1-1", published: true }), true);
});
