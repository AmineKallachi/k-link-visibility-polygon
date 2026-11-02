// Blocks 7 and 8: visibility with the mirror edge.
// The mirror is given by its edge index: edge i goes from polygon[i] to polygon[i + 1].

/**
 * Block 7: V_{P,e}(q) = direct view + what the mirror image q' sees
 * through the visible part of the mirror.
 * Kouhestani et al. 2010, §3.2, Theorem 2.
 */
export function mirrorVisibilityPolygon(polygon, mirrorIndex, q) {
  throw new Error('TODO block 7: mirrorVisibilityPolygon');
}

/**
 * Block 8: WV_{P,e}(s), region visible from segment s with the mirror.
 * Kouhestani et al. 2010, §3.3, Theorem 3.
 */
export function mirrorSegmentVisibilityPolygon(polygon, mirrorIndex, s) {
  throw new Error('TODO block 8: mirrorSegmentVisibilityPolygon');
}
