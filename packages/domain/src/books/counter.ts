/** The count after one tap. It runs past the target: the Believer decides when to stop. */
export const tapCounter = (count: number) => count + 1;

/** How much of the target the count has reached, from 0 to 1. */
export const counterProgress = (count: number, target: number) =>
  target > 0 ? Math.min(1, count / target) : 0;
