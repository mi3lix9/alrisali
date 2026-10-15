/** A copy of `items` with the one at `from` moved to `to`. */
export const moveItem = <T>(
  items: readonly T[],
  from: number,
  to: number
): T[] => {
  const moved = [...items];
  const [item] = moved.splice(from, 1);
  if (item !== undefined) {
    moved.splice(to, 0, item);
  }
  return moved;
};
