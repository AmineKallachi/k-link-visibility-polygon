// Blocks 3 and 5: visibility without the mirror.

/**
 * Block 3: V_P(q), the region of polygon P visible from point q.
 * Plan: own angular sweep (or Lee 1983 + Joe & Simpson 1987 for linear time).
 * Returns a polygon (counterclockwise).
 */
export function visibilityPolygon(polygon, q) {
  throw new Error('TODO block 3: visibilityPolygon');
}

/**
 * Block 5: WV_P(s), the region of P visible from at least one point of segment s.
 * Source: Guibas et al. 1987 (still to get). First version may sample points on s.
 */
export function segmentVisibilityPolygon(polygon, s) {
  throw new Error('TODO block 5: segmentVisibilityPolygon');
}
