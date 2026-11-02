// Blocks 9 to 12: k-link visibility.

/**
 * Block 9: V^k_P(q), k-link region without mirror:
 * repeat block 5 from every window into its pocket.
 * Mahdavi et al. 2011, Lemma 7; Maheshwari, Sack & Djidjev 2000, §2.1.1.
 */
export function kLinkRegion(polygon, q, k) {
  throw new Error('TODO block 9: kLinkRegion');
}

/**
 * Block 10: link distance m from the sensor to the mirror (first level that sees it).
 * Mahdavi et al. 2011, §4.1.
 */
export function linkDistanceToMirror(polygon, mirrorIndex, q) {
  throw new Error('TODO block 10: linkDistanceToMirror');
}

/**
 * Block 11: V^2_{P,e}(q). Mahdavi et al. 2011, §3, Lemmas 3–5, Algorithm 3.
 * Watch out: step 2 uses the windows of the region WITHOUT mirror,
 * Lemmas 3–5 use the region WITH mirror. Decide and test.
 */
export function twoLinkMirrorRegion(polygon, mirrorIndex, q) {
  throw new Error('TODO block 11: twoLinkMirrorRegion');
}

/**
 * Block 12 (the goal): V^k_{P,e}(q). Mahdavi et al. 2011, §4.2, Lemma 8, Algorithm 4.2.
 * Watch out for m >= 2 (sensor cannot see the mirror directly).
 */
export function kLinkMirrorRegion(polygon, mirrorIndex, q, k) {
  throw new Error('TODO block 12: kLinkMirrorRegion');
}
