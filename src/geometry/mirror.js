// Block 7: visibility with the mirror edge.
// The mirror is given by its edge index: edge i goes from polygon[i] to polygon[i + 1].
import { OrderedSet } from 'js-sdsl';
import { orient2d } from 'robust-predicates';
import { visibilityPolygon } from './visibility.js';
import { unionOfVisibleRegions } from './pockets.js';

// AI GENERATED: visibleMirrorPart, mirrorRegion, mirrorVisibilityPolygon and their helpers.
// The mirror image q′ does not have whole-number coordinates. mirrorRegion scales the room so that it does,
// and then decides every orientation exactly (Shewchuk's adaptive predicates, from robust-predicates). Only the
// points it outputs (where a ray stops on a wall) are rounded; they record their wall or corner, like
// visibilityPolygon's points.

const sub = (p, q) => ({ x: p.x - q.x, y: p.y - q.y });
const dot = (u, v) => u.x * v.x + u.y * v.y;

/** Same sign as calculateDeterminant in primitives.js (robust-predicates counts the other way round), exact. */
const det = (p, q, r) => -orient2d(p.x, p.y, q.x, q.y, r.x, r.y);
const orient = (p, q, r) => Math.sign(det(p, q, r));
/** For two vectors on one line: do they point the same way? */
const sameWay = (u, v) => Math.sign(u.x) === Math.sign(v.x) && Math.sign(u.y) === Math.sign(v.y);

/** Indices in V_P(q) of the first and last point of its run on the mirror, or null if q does not see the mirror. */
function mirrorRun(polygon, mirrorIndex, direct) {
  const n = polygon.length;
  const k = direct.length;
  const onMirror = (p) => p.wall === mirrorIndex || p.vertex === mirrorIndex || p.vertex === (mirrorIndex + 1) % n;
  const start = direct.findIndex((p, i) => onMirror(p) && !onMirror(direct[(i - 1 + k) % k]));
  if (start < 0) return null;
  let end = start;
  while (onMirror(direct[(end + 1) % k]) && (end + 1) % k !== start) end = (end + 1) % k;
  const m1 = direct[start], m2 = direct[end];
  return m1.x === m2.x && m1.y === m2.y ? null : { start, end };
}

/**
 * The part of the mirror that q sees directly, as [m1, m2] in the direction of the wall, or null.
 * q sees one connected piece of any wall, so it is read off V_P(q): the run of its points that lie on the mirror.
 * @param {Point[]} direct  V_P(q) from visibilityPolygon (its points record their wall or corner).
 * O(m) for the m points of V_P(q).
 */
export function visibleMirrorPart(polygon, mirrorIndex, direct) {
  const run = mirrorRun(polygon, mirrorIndex, direct);
  return run && [direct[run.start], direct[run.end]];
}

/** Smallest power of two g such that g·q has whole-number coordinates (q: a corner, the sensor or a sample point). */
function denominator(q) {
  let g = 1;
  while (!Number.isInteger(q.x * g) || !Number.isInteger(q.y * g)) {
    g *= 2;
    if (g > 2 ** 16) throw new Error('mirrorRegion: q must have whole-number or binary-fraction coordinates');
  }
  return g;
}

/**
 * Block 7, reflected part: the points of P that q sees by way of the mirror e.
 * Kouhestani et al. 2010, Theorem 2: these are the points that the mirror image q′ sees through the part [m1, m2]
 * of e that q sees directly.
 * Method: a rotational sweep from q′ over the wedge through [m1, m2] (de Berg et al. 2008, §15.2, as in
 * visibilityPolygon). The status holds every wall crossing the current ray, the mirror included, ordered along the
 * ray; the ray stops at the wall right after the mirror, so walls in front of the mirror need no clipping.
 * Exact: the room is scaled by g·|e|², which makes q′ and the reflected corners whole numbers (below 2^53 for
 * rooms up to about 10 000 px), and every orientation test is exact. The wedge's edges go through whole-number
 * points too: a mirror end, or the reflection of the corner that casts the shadow ending at m1 or m2.
 * O(n log n): sorting the corners in the wedge, and each wall is inserted and removed once in a balanced tree.
 * The paper (Theorem 2) takes O(n): it builds the helper polygon P′ and runs a linear-time visibility algorithm
 * from q′; the log n comes from the sweep, as for visibilityPolygon. Not P′: its corners are not whole numbers and
 * q′ lies on its boundary; one sweep from q′ is simpler and exact on integer input.
 * @returns {Point[]} a polygon (counterclockwise), or [] if q does not see the mirror.
 */
export function mirrorRegion(polygon, mirrorIndex, q, direct = visibilityPolygon(polygon, q)) {
  const run = mirrorRun(polygon, mirrorIndex, direct);
  if (!run) return [];
  const n = polygon.length;
  const k = direct.length;
  const a = polygon[mirrorIndex];
  const normal = { x: a.y - polygon[(mirrorIndex + 1) % n].y, y: polygon[(mirrorIndex + 1) % n].x - a.x };
  const g = denominator(q), L = dot(normal, normal), scale = g * L;

  // Scaled room, and the scaled mirror image of a point p (p·g whole): g·(L·p − 2((p − a)·normal)·normal).
  const P = polygon.map((v) => ({ x: scale * v.x, y: scale * v.y }));
  const mirrored = (p) => {
    const t = 2 * (g * (p.x - a.x) * normal.x + g * (p.y - a.y) * normal.y);
    return { x: L * g * p.x - t * normal.x, y: L * g * p.y - t * normal.y };
  };
  const image = mirrored(q);

  // The two edges of the wedge, each as a point it goes through. A shadow edge of V_P(q) runs from the corner
  // that casts it to m1 (or m2); reflected, that corner lies on the ray from q′ to m1.
  const edgeThrough = (m, neighbour) =>
    m.vertex !== undefined ? P[m.vertex]
      : neighbour.vertex !== undefined ? mirrored(polygon[neighbour.vertex])
        : { x: Math.round(scale * m.x), y: Math.round(scale * m.y) };   // not expected: V_P(q) always has the corner
  let m1 = direct[run.start], m2 = direct[run.end];
  let e1 = edgeThrough(m1, direct[(run.start - 1 + k) % k]), e2 = edgeThrough(m2, direct[(run.end + 1) % k]);
  const turn = orient(image, e1, e2);
  if (turn === 0) return [];
  if (turn < 0) [m1, m2, e1, e2] = [m2, m1, e2, e1];   // sweep counterclockwise, from e1 to e2

  // The walls that can stop a ray after the mirror: at least one end strictly on the room's side of the mirror
  // line, and not on a line through q′ (a ray could only run along such a wall). Plus the mirror itself.
  const walls = P.map((u, i) => Object.assign([u, P[(i + 1) % n]], { index: i, next: (i + 1) % n }));
  const mirror = walls[mirrorIndex];
  const roomSide = P.map((v) => orient(mirror[0], mirror[1], v) > 0);
  const used = walls.map((w, i) =>
    i === mirrorIndex || ((roomSide[i] || roomSide[w.next]) && orient(w[0], w[1], image) !== 0));

  /** Is wall s1 closer to q′ than wall s2 along the ray? Both cross the ray and they do not cross each other. */
  function inFront([p, r], [c, e]) {
    const sc = orient(p, r, c), se = orient(p, r, e);
    if (sc * se >= 0) return (sc !== 0 ? sc : se) !== orient(p, r, image);
    const sp = orient(c, e, p), sr = orient(c, e, r);
    return (sp !== 0 ? sp : sr) === orient(c, e, image);
  }
  const status = new OrderedSet([], (s1, s2) => (s1 === s2 ? 0 : inFront(s1, s2) ? -1 : 1));
  /** The wall where the current ray stops: the first one after the mirror. */
  const stop = () => {
    const it = status.upperBound(mirror);
    return it.equals(status.end()) ? null : it.pointer;
  };

  /** Where the ray from q′ through e meets wall w, with its corner or wall recorded (rounded, original scale). */
  function meet(e, w) {
    for (const [end, index] of [[w[0], w.index], [w[1], w.next]]) {
      if (orient(image, e, end) === 0 && sameWay(sub(end, image), sub(e, image))) return { ...polygon[index], vertex: index };
    }
    const du = det(image, e, w[0]), dv = det(image, e, w[1]);
    const t = du / (du - dv), u = polygon[w.index], v = polygon[w.next];
    return { x: u.x + t * (v.x - u.x), y: u.y + t * (v.y - u.y), wall: w.index };
  }

  // Status just after the first edge of the wedge: walls crossing it after q′, and walls that start on it.
  for (const w of walls) {
    if (!used[w.index]) continue;
    const su = orient(image, e1, w[0]), sv = orient(image, e1, w[1]);
    const crosses = su * sv < 0 && orient(image, w[0], w[1]) * su < 0;
    const startsOn = (su === 0 && sv > 0 && sameWay(sub(w[0], image), sub(e1, image))) ||
                     (sv === 0 && su > 0 && sameWay(sub(w[1], image), sub(e1, image)));
    if (crosses || startsOn || w === mirror) status.insert(w);
  }

  const region = [];
  const add = (p) => {
    const last = region[region.length - 1];
    if (p && (!last || last.x !== p.x || last.y !== p.y)) region.push(p);
  };
  add(m1);
  if (stop()) add(meet(e1, stop()));

  // The corners strictly inside the wedge, counterclockwise; corners on one ray form one group.
  const corners = P.map((v, i) => i).filter((i) =>
    (used[i] || used[(i - 1 + n) % n]) && orient(image, e1, P[i]) > 0 && orient(image, P[i], e2) > 0);
  corners.sort((i, j) => -orient(image, P[i], P[j]));
  for (let c = 0; c < corners.length; ) {
    const ray = P[corners[c]];
    const group = [];
    while (c < corners.length && orient(image, ray, P[corners[c]]) === 0) group.push(corners[c++]);
    const incident = group.flatMap((i) => [
      { wall: walls[(i - 1 + n) % n], other: P[(i - 1 + n) % n], v: P[i] },
      { wall: walls[i], other: P[(i + 1) % n], v: P[i] },
    ]).filter(({ wall }) => used[wall.index]);
    const before = stop();
    for (const { wall, other, v } of incident) if (orient(image, v, other) < 0) status.eraseElementByKey(wall);
    for (const { wall, other, v } of incident) if (orient(image, v, other) > 0) status.insert(wall);
    const after = stop();
    if (before !== after) {
      if (before) add(meet(ray, before));
      if (after) add(meet(ray, after));
    }
  }
  if (stop()) add(meet(e2, stop()));
  add(m2);

  const area = region.reduce((sum, p, i) => sum + p.x * region[(i + 1) % region.length].y - region[(i + 1) % region.length].x * p.y, 0);
  return area < 0 ? region.reverse() : region;
}

/**
 * Block 7: V_{P,e}(q), everything q sees directly or by way of the mirror (Kouhestani et al. 2010, Theorem 2).
 * The union of V_P(q) and mirrorRegion, with unionOfVisibleRegions (Clipper) instead of Kouhestani et al.'s
 * linear-time merge (their Lemma 1); the result keeps the corner/wall labels, so windows() works on it.
 * O(n log n) for V_P(q) and for mirrorRegion, plus the union. Kouhestani et al.: O(n) (their Theorem 2 with their
 * Lemma 1). Visibility from a segment with the mirror (their Theorem 3) is not needed: the k-link code samples
 * each window and gives every sample point its own mirrorRegion.
 * @returns {Point[][]} a list of polygons (outer boundaries, counterclockwise); usually just one.
 */
export function mirrorVisibilityPolygon(polygon, mirrorIndex, q, direct = visibilityPolygon(polygon, q)) {
  const reflected = mirrorRegion(polygon, mirrorIndex, q, direct);
  return reflected.length < 3 ? [direct] : unionOfVisibleRegions(polygon, [direct, reflected]);
}
