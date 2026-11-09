// Block 13: verification.
// Idea: sample a grid of points inside P and decide for each one, by brute force,
// whether it is in the region. Then compare with the output of the real algorithm.
// polygon-clipping (already installed) can compute areas of union/difference
// to measure how far two regions are apart.

/** Grid points inside the polygon, spaced `step` apart. */
export function gridPoints(polygon, step) {
  throw new Error('TODO block 13: gridPoints');
}

/** Does q see p, that is: does the segment from q to p stay inside the polygon? */
export function isVisible(polygon, q, p) {
  throw new Error('TODO block 13: isVisible');
}
