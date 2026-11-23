// Blocks 9 to 12: k-link visibility.
import { visibilityPolygon, samplesOn, visibleFromSamples, viewsFromSamples } from './visibility.js';
import { windows, unionOfVisibleRegions } from './pockets.js';
import { mirrorRegion, mirrorVisibilityPolygon, visibleMirrorPart } from './mirror.js';

/**
 * Block 9: V^k_P(q), k-link region without mirror, built level by level:
 * V^1 = V_P(q), and V^(i+1) adds what the windows of V^i see (block 5). A point that sees something new
 * from inside V^i also sees it from the window it looks through, so the windows are enough (Lemma 3 argument);
 * and what a window sees beyond V^i lies in its pocket, so no pocket has to be computed (block 4).
 * Mahdavi et al. 2011, Lemma 7; Maheshwari, Sack & Djidjev 2000, §2.1.1 (window partition).
 * Approximate: visibility from a window is sampled (see segmentVisibilityPolygon).
 * Complexity: per level O(s · n log n) for the s sample points on its windows, plus the union; k levels in total.
 * s grows with the total length of the windows in pixels. The paper computes V^k in O(n) for every k (Lemma 7):
 * the window partition handles each pocket once, with linear-time visibility from a segment (Guibas et al. 1987)
 * and link distances (Suri 1986). Not used: those need a triangulated room and shortest-path trees, too much before
 * the deadline. So our time grows with k, theirs does not.
 * @returns {Point[][][]} [V^1, ..., V^k], each a list of polygons (counterclockwise)
 */
// AI GENERATED: kLinkRegion and growLevel.
export function kLinkRegion(polygon, q, k, step = 2) {
  const levels = [[visibilityPolygon(polygon, q)]];
  while (levels.length < k) levels.push(growLevel(polygon, levels[levels.length - 1], step));
  return levels;
}

/** V^(i+1) from V^i: add what every window of V^i sees. */
function growLevel(polygon, region, step) {
  const samples = region.flatMap((part) => windows(polygon, part)).flatMap((w) => samplesOn(w, step));
  if (samples.length === 0) return region;
  return unionOfVisibleRegions(polygon, [...region, ...visibleFromSamples(polygon, samples)]);
}

// AI GENERATED: blocks 10 to 12 below (linkDistanceToMirror, twoLinkMirrorRegion, kLinkMirrorRegion,
// kLinkMirrorEveryLevel and their helpers).
//
// Where the mirror matters (Mahdavi et al. 2011, §4.2): let ℓ be the link distance from q to the mirror.
// Below level ℓ no path reaches the mirror; at levels ℓ and ℓ + 1 a link may bounce; from ℓ + 2 on the whole
// mirror is already reached, so a bounce at r can be replaced by going to r and looking straight on (Lemma 8).

/** All windows of a region (a list of polygons) with sample points every `step` units. */
const samplesOnWindows = (polygon, region, step) =>
  region.flatMap((part) => windows(polygon, part)).flatMap((w) => samplesOn(w, step));

/** Does the region touch the mirror along a piece of positive length? */
const touchesMirror = (polygon, mirrorIndex, region) =>
  region.some((part) => visibleMirrorPart(polygon, mirrorIndex, part) !== null);

/**
 * V_{P,e} of an object: what it sees directly or by way of the mirror.
 * The object is the sensor q (a point) or a region that does not touch the mirror. For a region it is enough to look
 * from its windows: a path that leaves the region crosses a window, also on its way to the mirror.
 * Each sample point sees V_P(s) ∪ mirrorRegion(s), Kouhestani et al. 2010, Theorem 2.
 */
function seenWithMirror(polygon, mirrorIndex, object, step) {
  if (!Array.isArray(object)) return mirrorVisibilityPolygon(polygon, mirrorIndex, object);
  return addViewsWithMirror(polygon, mirrorIndex, object, samplesOnWindows(polygon, object, step));
}

/** The region plus everything the sample points see directly or by way of the mirror. */
function addViewsWithMirror(polygon, mirrorIndex, region, samples) {
  const views = viewsFromSamples(polygon, samples).flatMap(({ point, view }) => [view, mirrorRegion(polygon, mirrorIndex, point, view)]);
  return unionOfVisibleRegions(polygon, [...region, ...views]);
}

/** V_P of an object without the mirror: the sensor's visibility polygon, or the next ordinary level of a region. */
const seenDirectly = (polygon, object, step) =>
  Array.isArray(object) ? growLevel(polygon, object, step) : [visibilityPolygon(polygon, object)];

/**
 * Block 10: ℓ, the link distance from the sensor to the mirror: the first level V^ℓ_P(q) that touches the mirror.
 * Mahdavi et al. 2011, §4.1 (link distance between an object and a segment).
 * Returns { ell, levels } with the ordinary levels V^1 .. V^ℓ, so they do not have to be computed twice.
 * Stops after maxLevel levels: then ell is Infinity, meaning ℓ > maxLevel.
 * Complexity: min(ℓ, maxLevel) ordinary levels (see kLinkRegion). The paper: O(n) with Suri's linear-time link
 * distance (1986).
 */
export function linkDistanceToMirror(polygon, mirrorIndex, q, step = 2, maxLevel = polygon.length + 1) {
  const levels = [[visibilityPolygon(polygon, q)]];
  while (!touchesMirror(polygon, mirrorIndex, levels[levels.length - 1])) {
    if (levels.length >= maxLevel) return { ell: Infinity, levels };
    levels.push(growLevel(polygon, levels[levels.length - 1], step));
  }
  return { ell: levels.length, levels };
}

/**
 * Block 11: Algorithm 3 for an object O (the sensor, or the region V^(ℓ−1)_P(q)): returns [V_{P,e}(O), V²_{P,e}(O)].
 * 1. V_{P,e}(O). 2. The windows w_i: of V_P(O) as the algorithm says (windowsOf: 'direct'), or of V_{P,e}(O)
 * as Lemmas 3–5 use them (windowsOf: 'mirror'). 3. Add what each window sees, directly or by way of the mirror.
 * Difference with the paper: each window point may use the whole mirror, not only the part e_i inside its pocket.
 * Every point added is still reached with one more link, so this can only add correct points.
 * Mahdavi et al. 2011, §3, Lemmas 3–5, Algorithm 3, Theorem 6.
 * Complexity: one level of sampling, with a visibility polygon and a mirror region per sample point, both
 * O(n log n): O(s · n log n) for s samples, plus the union. The paper: O(n + m) (Theorem 6).
 */
export function twoLinkMirrorRegion(polygon, mirrorIndex, object, { windowsOf = 'mirror', step = 2 } = {}) {
  const first = seenWithMirror(polygon, mirrorIndex, object, step);
  const windowRegion = windowsOf === 'direct' ? seenDirectly(polygon, object, step) : first;
  const second = addViewsWithMirror(polygon, mirrorIndex, first, samplesOnWindows(polygon, windowRegion, step));
  return [first, second];
}

/**
 * Block 12 (the goal): V^k_{P,e}(q), Algorithm 4.2 of Mahdavi et al. 2011, §4.2:
 * 1. ℓ = link distance to the mirror. 2. Levels below ℓ: ordinary k-link visibility.
 * 3. Level ℓ: V_{P,e}(Q) with Q = V^(ℓ−1)_P(q) (Q = q if ℓ = 1). Level ℓ + 1: Algorithm 3 on Q.
 * Further levels: ordinary growth through the windows, without the mirror (Lemma 8).
 * @returns {Point[][][]} [V^1, ..., V^k] with the mirror; the array also has a property `ell` (ℓ, or Infinity
 *   when ℓ > k: then the mirror is not used).
 * Complexity: k levels, each O(s · n log n) for the s sample points on its windows, plus the union; at levels ℓ and
 * ℓ + 1 every sample point also gets a mirror region, also O(n log n). So O(k · s · n log n) plus the unions, where
 * s grows with the length of the windows in pixels (see segmentVisibilityPolygon); with the windows-of-V_P variant
 * one ordinary level more. The paper: O(n + m) for every k (Theorem 9); see kLinkRegion for why we grow level by
 * level instead.
 */
export function kLinkMirrorRegion(polygon, mirrorIndex, q, k, { windowsOf = 'mirror', step = 2 } = {}) {
  const { ell, levels: direct } = linkDistanceToMirror(polygon, mirrorIndex, q, step, k);
  const levels = direct.slice(0, Math.min(k, ell - 1));
  if (k >= ell) {
    const object = ell === 1 ? q : direct[ell - 2];
    levels.push(...twoLinkMirrorRegion(polygon, mirrorIndex, object, { windowsOf, step }).slice(0, k - ell + 1));
  }
  while (levels.length < k) levels.push(growLevel(polygon, levels[levels.length - 1], step));
  levels.ell = ell;
  return levels;
}

/**
 * Check for Lemma 8: the mirror used at every level instead of only at levels ℓ and ℓ + 1.
 * If the paper is right, this gives the same regions as kLinkMirrorRegion.
 * Complexity: also O(k · s · n log n) plus the unions, but with a mirror region per sample point at every level.
 */
export function kLinkMirrorEveryLevel(polygon, mirrorIndex, q, k, step = 2) {
  const levels = [mirrorVisibilityPolygon(polygon, mirrorIndex, q)];
  while (levels.length < k) {
    const last = levels[levels.length - 1];
    levels.push(addViewsWithMirror(polygon, mirrorIndex, last, samplesOnWindows(polygon, last, step)));
  }
  return levels;
}
