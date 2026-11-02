// Blocks 2, 4 and 6: windows, pockets and union of visible regions.

/**
 * Block 2: the windows of a visible region = its edges that are not (part of) walls of P.
 * Returns an array of segments.
 */
export function windows(polygon, region) {
  throw new Error('TODO block 2: windows');
}

/**
 * Block 4: the pocket behind a window = the part of P on the other side of the window.
 * Mahdavi et al. 2011, §2 (a window can bend, Fig. 2).
 */
export function pocket(polygon, window) {
  throw new Error('TODO block 4: pocket');
}

/**
 * Block 6: union of two visible regions by walking the boundary in order
 * (Order Property, Kouhestani et al. 2010, §3.1, Lemma 1).
 */
export function unionOfVisibleRegions(polygon, regionA, regionB) {
  throw new Error('TODO block 6: unionOfVisibleRegions');
}
