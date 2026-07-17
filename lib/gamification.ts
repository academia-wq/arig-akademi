export const LESSONS_PER_LEVEL = 10;

export function computeLevel(totalCompletedLessons: number) {
  const level = Math.floor(totalCompletedLessons / LESSONS_PER_LEVEL) + 1;
  const intoLevel = totalCompletedLessons % LESSONS_PER_LEVEL;
  return {
    level,
    lessonsIntoLevel: intoLevel,
    lessonsToNextLevel: LESSONS_PER_LEVEL - intoLevel,
    progressPercent: Math.round((intoLevel / LESSONS_PER_LEVEL) * 100),
  };
}
