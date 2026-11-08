import { calculateDeterminant, orientation, segmentIntersection, twiceSignedArea, onSegment, ON, RIGHT } from "./primitives.js";


//AI GENERATED


// Far enough that q + FAR·(via − q) lies outside any room up to 10000 units wide,
// small enough that every determinant stays a whole number below 2^53 for coordinates up to about 1000.
const FAR = 10000;


/**
 * Does the direction from v towards `far` point into the outside of the room at vertex v?
 * The inside of the room at v is the angle from the outgoing wall (v → w) counterclockwise
 * to the incoming wall (v → u). Directions along a wall count as inside (they follow the boundary).
 * Same local test as line 1 of VISIBLE in de Berg et al. (2008), p. 329, applied to the part of the ray after v.
 */
function pointsOutside(u, v, w, far) {
  const turn = calculateDeterminant(v, w, u);      // > 0: convex corner, < 0: reflex corner
  const fromOut = calculateDeterminant(v, w, far);  // > 0: ray is counterclockwise from wall v → w
  const fromIn = calculateDeterminant(v, u, far);   // < 0: ray is clockwise from wall v → u
  if (turn > 0) return !(fromOut >= 0 && fromIn <= 0);   // convex: inside is the narrow angle
  if (turn < 0) return fromIn > 0 && fromOut < 0;         // reflex: outside is the narrow angle
  return fromOut < 0;                                      // u, v, w on one line: inside is left of v → w
}

/**
 * Shoots a ray from q through `via` and returns the first point where the room stops it.
 *
 * Based on de Berg et al., Computational Geometry (3rd ed., 2008), §15.2, pp. 327–329:
 * the half-line from p through w, and the local test at a vertex (line 1 of VISIBLE).
 * Own adaptation: one ray at a time instead of the rotational sweep (O(n) per ray),
 * the ray as a long segment with whole-number coordinates, and the case where the ray
 * runs along a wall (which the book leaves out on p. 327).
 *
 * @param {Point[]} room  Vertices counterclockwise, whole-number coordinates, no two consecutive vertices equal.
 * @param {Point} q  Start point, inside the room or on its boundary, whole-number coordinates.
 * @param {Point} via  A point the ray passes through, different from q, whole-number coordinates.
 * @returns {{x: number, y: number, t: number, wall?: number, vertex?: number} | null}
 *   The stopping point; t = distance along the ray as a fraction of q → far (only for comparing).
 *   `wall: i` if it stops inside wall room[i] → room[i+1], `vertex: i` if it stops in corner room[i].
 *   null if nothing stops the ray (q is outside the room).
 */
export function rayCast(room, q, via) {
  if (via.x === q.x && via.y === q.y) throw new Error("rayCast: via must differ from q");
  const n = room.length;
  const far = { x: q.x + FAR * (via.x - q.x), y: q.y + FAR * (via.y - q.y) };
  const dx = far.x - q.x, dy = far.y - q.y;
  if (twiceSignedArea(room) <= 0) throw new Error("rayCast: room must be counterclockwise");
  let best = null;

  // 0. q on the boundary and the ray points straight outside: stopped at q itself.
  for (let i = 0; i < n; i++) {
    const a = room[i], b = room[(i + 1) % n];
    if (a.x === q.x && a.y === q.y) {
      if (pointsOutside(room[(i - 1 + n) % n], a, b, far)) return { x: q.x, y: q.y, t: 0, vertex: i };
    } else if (!(b.x === q.x && b.y === q.y) && orientation(a, b, q) === ON && onSegment(a, b, q)
               && orientation(a, b, far) === RIGHT) {
      return { x: q.x, y: q.y, t: 0, wall: i };
    }
  }

  // 1. Walls that the ray crosses in their interior (both ends strictly on different sides).
  for (let i = 0; i < n; i++) {
    const a = room[i], b = room[(i + 1) % n];
    const sa = orientation(q, far, a), sb = orientation(q, far, b);
    if (sa === ON || sb === ON || sa === sb) continue;
    const hit = segmentIntersection(q, far, a, b);
    if (hit.t > 0 && (best === null || hit.t < best.t)) best = { x: hit.x, y: hit.y, t: hit.t, wall: i };
  }

  // 2. Corners on the ray, in front of q: the ray stops there if it continues into the outside.
  for (let i = 0; i < n; i++) {
    const v = room[i];
    if (orientation(q, far, v) !== ON) continue;
    const along = (v.x - q.x) * dx + (v.y - q.y) * dy;
    if (along <= 0) continue;                                   // at q or behind it
    const u = room[(i - 1 + n) % n], w = room[(i + 1) % n];
    if (!pointsOutside(u, v, w, far)) continue;                 // ray passes the corner
    const t = along / (dx * dx + dy * dy);
    if (best === null || t < best.t) best = { x: v.x, y: v.y, t, vertex: i };
  }

  return best;
}