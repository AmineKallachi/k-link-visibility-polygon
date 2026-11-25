// Blocks 3 and 5: visibility without the mirror.
import { OrderedSet } from 'js-sdsl';
import { calculateDeterminant, orientation, segmentIntersection, onSegment, pointInPolygon, LEFT, RIGHT, ON } from './primitives.js';
import { unionOfVisibleRegions } from './pockets.js';

const FAR = 10000;

// AI GENERATED: visibilityPolygon and its helpers.

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

/**
 * Where the ray from q through w meets wall [a, b]. The point records where it lies, like rayCast:
 * `vertex: i` for corner i of the room, `wall: i` for a point inside wall i.
 */
function meet(q, w, wall) {
  const [a, b] = wall;
  if (sameDirection(q, w, a)) return { x: a.x, y: a.y, vertex: wall.index };
  if (sameDirection(q, w, b)) return { x: b.x, y: b.y, vertex: wall.next };
  const hit = segmentIntersection(q, farPoint(q, w), a, b);
  return { x: hit.x, y: hit.y, wall: wall.index };
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
 * The corners of a group (all on one ray from q, nearest first) that lie strictly between where the ray meets wall
 * `from` and where it meets wall `to`, in the order from `from` to `to`. Exact: only the corners and walls are
 * tested, never the computed meeting points.
 */
function cornersBetween(q, group, from, to) {
  const fromIsNear = inFront(from, to, q);
  const [near, far] = fromIsNear ? [from, to] : [to, from];
  const beyond = ([a, b], v) => sign(a, b, v) !== 0 && sign(a, b, v) !== sign(a, b, q);
  const before = ([a, b], v) => sign(a, b, v) !== 0 && sign(a, b, v) === sign(a, b, q);
  const between = group.filter(({ v }) => beyond(near, v) && before(far, v));
  return fromIsNear ? between : between.reverse();
}

/**
 * Block 3: V_P(q), the region of polygon P visible from point q (q strictly inside P).
 * Rotational sweep: de Berg et al. 2008, §15.2, pp. 326–329, applied to exercise 3.14 (p. 61); Asano 1985.
 * O(n log n): sorting the corners, and each wall is inserted and removed once in a balanced tree.
 * The paper uses a linear-time algorithm, O(n) (Lee 1983, corrected by Joe & Simpson 1987). Not implemented: it is a
 * subroutine from earlier work, not the paper's contribution, and the goal here is to illustrate the paper's
 * algorithms, not to reach their optimal running time. The sweep is the textbook method and gives the same region;
 * the extra log n comes from sorting.
 * Returns a polygon (counterclockwise). Each point records the corner (`vertex`) or wall (`wall`) it lies on,
 * so a window (an edge that is not on a wall) can be found without testing computed points again.
 * Corners that lie on a window, in line with q, are kept as points of the polygon: where the ray runs along a
 * wall, that part of the edge is then recognised as wall and not as window.
 * Throws if q is not strictly inside the room (outside, on a wall or on a corner).
 */
export function visibilityPolygon(polygon, q) {
  const n = polygon.length;
  const onWall = polygon.some((a, i) => orientation(a, polygon[(i + 1) % n], q) === ON && onSegment(a, polygon[(i + 1) % n], q));
  if (onWall || !pointInPolygon(q, polygon)) throw new Error('visibilityPolygon: the sensor must lie strictly inside the room');
  const walls = polygon.map((a, i) => Object.assign([a, polygon[(i + 1) % n]], { index: i, next: (i + 1) % n }));
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
      for (const { v, i } of cornersBetween(q, group, before, after)) add({ x: v.x, y: v.y, vertex: i });
      add(meet(q, w, after));
    }
  }

  const first = region[0], last = region[region.length - 1];
  if (region.length > 1 && first.x === last.x && first.y === last.y) region.pop();
  return region;
}

/**
 * Block 5: WV_P(s), the region of P visible from at least one point of segment s (not its endpoints).
 * The exact linear-time algorithm is Guibas et al. 1987. Here it is approximated: points every `step` units
 * along s each get their visibility polygon, and the union of those is the result.
 * Each sample point is rounded to 1/GRID unit and the room is scaled by GRID, so visibilityPolygon gets
 * whole-number input and stays exact; the only approximations are the sampling and this rounding.
 * Complexity: O(s · n log n) for the s = length / step sample points, plus the union (see unionOfVisibleRegions);
 * s depends on the length of the segment in pixels, not on n. Guibas et al. 1987 compute the exact region in O(n)
 * on a triangulated room, with shortest-path trees. Not implemented: it is a subroutine from earlier work, not the
 * paper's contribution, and sampling is enough to illustrate the paper's algorithms. The tests check that the
 * k-link regions contain every grid point that the brute force reaches.
 * @returns {Point[][]} the region as a list of polygons, counterclockwise
 */
// AI GENERATED: segmentVisibilityPolygon, visibleFromSamples and their helpers.
const GRID = 8;
const scaledRooms = new WeakMap();

export function segmentVisibilityPolygon(polygon, s, step = 2) {
  return unionOfVisibleRegions(polygon, visibleFromSamples(polygon, samplesOn(s, step)));
}

/** Points every `step` units along segment [a, b], without its endpoints. */
export function samplesOn([a, b], step = 2) {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const count = Math.max(1, Math.floor(length / step));
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count;
    return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
  });
}

/** The visibility polygon of each sample point that lies strictly inside the room (see GRID above). */
export function visibleFromSamples(polygon, samples) {
  return viewsFromSamples(polygon, samples).map(({ view }) => view);
}

/** Like visibleFromSamples, but also returns each sample point as it was used (rounded to 1/GRID). */
export function viewsFromSamples(polygon, samples) {
  if (!scaledRooms.has(polygon)) scaledRooms.set(polygon, polygon.map((v) => ({ x: v.x * GRID, y: v.y * GRID })));
  const room = scaledRooms.get(polygon);
  const n = room.length;
  const views = [];
  for (const p of samples) {
    const q = { x: Math.round(p.x * GRID), y: Math.round(p.y * GRID) };
    const onWall = room.some((a, i) => orientation(a, room[(i + 1) % n], q) === ON && onSegment(a, room[(i + 1) % n], q));
    if (onWall || !pointInPolygon(q, room)) continue;
    const view = visibilityPolygon(room, q).map((v) => ({ ...v, x: v.x / GRID, y: v.y / GRID }));
    views.push({ point: { x: q.x / GRID, y: q.y / GRID }, view });
  }
  return views;
}
