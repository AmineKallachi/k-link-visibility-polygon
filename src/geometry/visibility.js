// Blocks 3 and 5: visibility without the mirror.
import { OrderedSet } from 'js-sdsl';
import { calculateDeterminant, orientation, segmentIntersection, LEFT, RIGHT, ON } from './primitives.js';

const FAR = 10000;

const sign = (a, b, p) => Math.sign(calculateDeterminant(a, b, p));
const dist2 = (q, p) => (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
const farPoint = (q, w) => ({ x: q.x + FAR * (w.x - q.x), y: q.y + FAR * (w.y - q.y) });
const sameDirection = (q, a, b) =>
  orientation(q, a, b) === ON && (a.x - q.x) * (b.x - q.x) + (a.y - q.y) * (b.y - q.y) > 0;

/** Is wall s1 closer to q than wall s2 along the ray? Both cross the ray and they do not cross each other. */
function inFront(s1, s2, q) {
  const [a, b] = s1;
  const [c, d] = s2;
  const sc = sign(a, b, c), sd = sign(a, b, d);
  if (sc * sd >= 0) return (sc !== 0 ? sc : sd) !== sign(a, b, q);
  const sa = sign(c, d, a), sb = sign(c, d, b);
  return (sa !== 0 ? sa : sb) === sign(c, d, q);
}

/** Where the ray from q through w meets wall [a, b]. */
function meet(q, w, [a, b]) {
  if (sameDirection(q, w, a)) return a;
  if (sameDirection(q, w, b)) return b;
  const hit = segmentIntersection(q, farPoint(q, w), a, b);
  return { x: hit.x, y: hit.y };
}

/** Does wall [a, b] cross the ray from q through w between its endpoints, in front of q? */
function crossesRay(q, w, [a, b]) {
  const sa = orientation(q, w, a), sb = orientation(q, w, b);
  return sa !== ON && sb !== ON && sa !== sb && segmentIntersection(q, farPoint(q, w), a, b).t > 0;
}

/** Does wall [a, b] end on the ray from q through w, coming from the right (clockwise) side? */
function endsOnRayFromRight(q, w, [a, b]) {
  return (sameDirection(q, w, a) && orientation(q, w, b) === RIGHT) ||
         (sameDirection(q, w, b) && orientation(q, w, a) === RIGHT);
}

/**
 * Block 3: V_P(q), the region of polygon P visible from point q (q strictly inside P).
 * Rotational sweep: de Berg et al. 2008, §15.2, pp. 326–329, applied to exercise 3.14 (p. 61); Asano 1985.
 * O(n log n): sorting the corners, and each wall is inserted and removed once in a balanced tree.
 * Returns a polygon (counterclockwise).
 */
export function visibilityPolygon(polygon, q) {
  const n = polygon.length;
  const walls = polygon.map((a, i) => [a, polygon[(i + 1) % n]]);
  const corners = polygon
    .map((v, i) => ({ v, i, angle: Math.atan2(v.y - q.y, v.x - q.x), d: dist2(q, v) }))
    .sort((e, f) => e.angle - f.angle || e.d - f.d);

  const status = new OrderedSet([], (s1, s2) => (s1 === s2 ? 0 : inFront(s1, s2, q) ? -1 : 1));
  const w0 = corners[0].v;
  for (const wall of walls) {
    if (crossesRay(q, w0, wall) || endsOnRayFromRight(q, w0, wall)) status.insert(wall);
  }

  const region = [];
  const add = (p) => {
    const last = region[region.length - 1];
    if (!last || last.x !== p.x || last.y !== p.y) region.push(p);
  };

  for (let k = 0; k < corners.length; ) {
    const w = corners[k].v;
    const group = [];
    while (k < corners.length && sameDirection(q, w, corners[k].v)) group.push(corners[k++]);

    const incident = group.flatMap(({ v, i }) => [
      { v, wall: walls[(i - 1 + n) % n], other: polygon[(i - 1 + n) % n] },
      { v, wall: walls[i], other: polygon[(i + 1) % n] },
    ]);
    const before = status.front();
    for (const { v, wall, other } of incident) if (orientation(q, v, other) === RIGHT) status.eraseElementByKey(wall);
    for (const { v, wall, other } of incident) if (orientation(q, v, other) === LEFT) status.insert(wall);
    const after = status.front();

    if (before !== after) {
      add(meet(q, w, before));
      add(meet(q, w, after));
    }
  }

  const first = region[0], last = region[region.length - 1];
  if (region.length > 1 && first.x === last.x && first.y === last.y) region.pop();
  return region;
}

/**
 * Block 5: WV_P(s), the region of P visible from at least one point of segment s.
 * Source: Guibas et al. 1987 (still to get). First version may sample points on s.
 */
export function segmentVisibilityPolygon(polygon, s) {
  throw new Error('TODO block 5: segmentVisibilityPolygon');
}
