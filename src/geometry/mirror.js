// Blocks 7 and 8: visibility with the mirror edge.
// The mirror is given by its edge index: edge i goes from polygon[i] to polygon[i + 1].
import { reflectPoint } from './primitives.js';
import { visibilityPolygon } from './visibility.js';
import { unionOfVisibleRegions } from './pockets.js';

// AI GENERATED: visibleMirrorPart, mirrorRegion, mirrorVisibilityPolygon and their helpers.
// The mirror image q′ does not have whole-number coordinates, so the part seen through the mirror is
// computed in floating point, with the tolerance EPS. The direct part, V_P(q), stays exact.

const EPS = 1e-9;

const sub = (p, q) => ({ x: p.x - q.x, y: p.y - q.y });
const cross = (u, v) => u.x * v.y - u.y * v.x;
const dot = (u, v) => u.x * v.x + u.y * v.y;
const along = (from, dir, t) => ({ x: from.x + t * dir.x, y: from.y + t * dir.y });

/**
 * The part of the mirror that q sees directly, as [m1, m2] in the direction of the wall, or null.
 * q sees one connected piece of any wall, so it is read off V_P(q): the run of its points that lie on the mirror.
 * @param {Point[]} direct  V_P(q) from visibilityPolygon (its points record their wall or corner).
 * O(m) for the m points of V_P(q).
 */
export function visibleMirrorPart(polygon, mirrorIndex, direct) {
  const n = polygon.length;
  const k = direct.length;
  const onMirror = (p) => p.wall === mirrorIndex || p.vertex === mirrorIndex || p.vertex === (mirrorIndex + 1) % n;
  const start = direct.findIndex((p, i) => onMirror(p) && !onMirror(direct[(i - 1 + k) % k]));
  if (start < 0) return null;
  let end = start;
  while (onMirror(direct[(end + 1) % k]) && (end + 1) % k !== start) end = (end + 1) % k;
  const m1 = direct[start], m2 = direct[end];
  return m1.x === m2.x && m1.y === m2.y ? null : [m1, m2];
}

/**
 * Block 7, reflected part: the points of P that q sees by way of the mirror e.
 * Kouhestani et al. 2010, Theorem 2: these are the points that the mirror image q′ sees through the part of e
 * that q sees directly.
 * Method: rays from q′ through both ends of that part and through every corner beyond it, in order of angle,
 * each one only counted from the mirror on (the ray casting of de Berg et al. 2008, §15.2).
 * O(n²): n rays, each tested against n walls.
 * The paper (Theorem 2) takes O(n): it builds the helper polygon P′ and runs a linear-time visibility algorithm
 * from q′. Not used: the corners of P′ are not whole numbers and P′ is degenerate by construction (q′ is one of its
 * corners); see DESIGN-NOTES, 20 Nov. An exact sweep from q′ would give O(n log n).
 * @returns {Point[]} a polygon (counterclockwise), or [] if q does not see the mirror.
 */
export function mirrorRegion(polygon, mirrorIndex, q, direct = visibilityPolygon(polygon, q)) {
  const part = visibleMirrorPart(polygon, mirrorIndex, direct);
  if (!part) return [];
  const [m1, m2] = part;
  const n = polygon.length;
  const a = polygon[mirrorIndex];
  const b = polygon[(mirrorIndex + 1) % n];
  const image = reflectPoint(q, a, b);
  const turn = Math.sign(cross(sub(m1, image), sub(m2, image)));
  if (turn === 0) return [];

  const length = (u) => Math.hypot(u.x, u.y);
  const sideOf = (dir, u) => {
    const c = cross(dir, u);
    return Math.abs(c) <= EPS * length(dir) * length(u) ? 0 : Math.sign(c);
  };

  /** Does a ray that reaches corner i along dir go on inside the room? Running along a wall counts as inside. */
  function continuesAt(i, dir) {
    const into = sub(polygon[(i + 1) % n], polygon[i]);
    const back = sub(polygon[(i - 1 + n) % n], polygon[i]);
    if (cross(into, back) > 0) return sideOf(into, dir) >= 0 && sideOf(dir, back) >= 0;
    return !(sideOf(back, dir) > 0 && sideOf(dir, into) > 0);
  }

  /** Where the ray image + t·dir, followed from parameter tMin on, is stopped by the room (the mirror is skipped). */
  function stopOf(dir, tMin) {
    let best = { t: Infinity };
    const consider = (t, point) => {
      if (t > tMin * (1 + EPS) + EPS && t < best.t) best = { t, point };
    };
    const onRay = polygon.map((v) => sideOf(dir, sub(v, image)) === 0 && dot(dir, sub(v, image)) > 0);
    polygon.forEach((v, i) => {
      if (onRay[i] && !continuesAt(i, dir)) consider(dot(sub(v, image), dir) / dot(dir, dir), v);
    });
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      if (i === mirrorIndex || onRay[i] || onRay[j]) continue;
      const wall = sub(polygon[j], polygon[i]);
      const denom = cross(dir, wall);
      if (denom === 0) continue;
      const toWall = sub(polygon[i], image);
      const u = cross(toWall, dir) / denom;
      if (u >= 0 && u <= 1) consider(cross(toWall, wall) / denom, along(image, dir, cross(toWall, wall) / denom));
    }
    return best;
  }

  // Directions of the sweep: the ends of the visible part of the mirror and every corner in between,
  // beyond the mirror line. Corners on one ray form one group.
  const mirrorLine = sub(b, a);
  const toM1 = sub(m1, image), toM2 = sub(m2, image);
  const angle = (dir) => turn * Math.atan2(cross(toM1, dir), dot(toM1, dir));
  const groups = [{ dir: toM1, corners: [], first: true }, { dir: toM2, corners: [], last: true }];
  polygon.forEach((v, i) => {
    const dir = sub(v, image);
    if (cross(mirrorLine, sub(v, a)) <= 0) return;
    if (sideOf(toM1, dir) === -turn || sideOf(dir, toM2) === -turn) return;
    let group = groups.find((g) => sideOf(g.dir, dir) === 0 && dot(g.dir, dir) > 0);
    if (!group) groups.push((group = { dir, corners: [] }));
    group.corners.push({ v, i, t: dot(dir, group.dir) / dot(group.dir, group.dir) });
  });
  groups.sort((g1, g2) => (g1.first ? -1 : g2.first ? 1 : g1.last ? 1 : g2.last ? -1 : angle(g1.dir) - angle(g2.dir)));

  const region = [m1];
  for (const { dir, corners, first, last } of groups) {
    const start = first || last ? 1 : cross(sub(a, image), mirrorLine) / cross(dir, mirrorLine);
    const end = first ? m1 : last ? m2 : null;
    if (end && end.vertex !== undefined && !continuesAt(end.vertex, dir)) continue;

    // What the rays just before and just after this direction hit: the nearest corner whose walls lie
    // on that side, or else the point where this ray itself is stopped.
    const stop = stopOf(dir, start);
    let before = null, after = null;
    for (const { v, i, t } of corners.sort((c1, c2) => c1.t - c2.t)) {
      if (t <= start || t > stop.t * (1 + EPS)) continue;
      const sides = [polygon[(i - 1 + n) % n], polygon[(i + 1) % n]].map((w) => sideOf(dir, sub(w, v)));
      if (!continuesAt(i, dir)) {
        before ??= v;
        after ??= v;
        break;
      }
      if (sides.includes(-turn)) before ??= v;
      if (sides.includes(turn)) after ??= v;
    }
    if (stop.point) {
      before ??= stop.point;
      after ??= stop.point;
    }
    const points = first ? [after] : last ? [before] : [before, after];
    for (const p of points) {
      const previous = region[region.length - 1];
      if (p && (p.x !== previous.x || p.y !== previous.y)) region.push(p);
    }
  }
  const previous = region[region.length - 1];
  if (previous.x !== m2.x || previous.y !== m2.y) region.push(m2);

  const area = region.reduce((sum, p, i) => sum + cross(p, region[(i + 1) % region.length]), 0);
  return area < 0 ? region.reverse() : region;
}

/**
 * Block 7: V_{P,e}(q), everything q sees directly or by way of the mirror (Kouhestani et al. 2010, Theorem 2).
 * The union of V_P(q) and mirrorRegion, with unionOfVisibleRegions (Clipper) instead of the paper's linear-time
 * merge (Lemma 1); the result keeps the corner/wall labels, so windows() works on it.
 * O(n log n) for V_P(q) + O(n²) for mirrorRegion + the union. The paper: O(n) (Theorem 2 with Lemma 1).
 * @returns {Point[][]} a list of polygons (outer boundaries, counterclockwise); usually just one.
 */
export function mirrorVisibilityPolygon(polygon, mirrorIndex, q, direct = visibilityPolygon(polygon, q)) {
  const reflected = mirrorRegion(polygon, mirrorIndex, q, direct);
  return reflected.length < 3 ? [direct] : unionOfVisibleRegions(polygon, [direct, reflected]);
}

/**
 * Block 8: WV_{P,e}(s), region visible from segment s with the mirror.
 * Kouhestani et al. 2010, §3.3, Theorem 3.
 */
export function mirrorSegmentVisibilityPolygon(polygon, mirrorIndex, s) {
  throw new Error('TODO block 8: mirrorSegmentVisibilityPolygon');
}
