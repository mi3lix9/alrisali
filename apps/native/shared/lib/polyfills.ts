// Hermes (React Native 0.88) has no `Array.prototype.toSorted` yet, and the
// domain and data code use it (oxlint's unicorn/no-array-sort forbids the
// mutating `sort`). Imported first by app/_layout.tsx, before anything renders.
// Remove once Hermes ships it.

if (!Array.prototype.toSorted) {
  // oxlint-disable-next-line no-extend-native -- the standard method, missing in Hermes
  Object.defineProperty(Array.prototype, "toSorted", {
    configurable: true,
    writable: true,
    value<T>(this: T[], compareFn?: (a: T, b: T) => number): T[] {
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts a fresh copy, as toSorted does
      return [...this].sort(compareFn);
    },
  });
}
