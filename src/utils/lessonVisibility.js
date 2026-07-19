/**
 * Existing lessons remain visible until they are explicitly unpublished.
 * This keeps the change backward-compatible with documents that do not yet
 * contain the `published` field.
 */
export function isLessonPublished(lesson) {
  return lesson?.published !== false;
}
