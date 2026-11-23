// Block 13: verification.
// Idea: sample a grid of points inside P and decide for each one, by brute force,
// whether it is in the region. Then compare with the output of the real algorithm.
// These checks are slow on purpose: simple, and independent of the algorithms they check.
// isVisibleThroughMirror casts rays towards the computed bounce point r (floating point), so near region edges it is
// not exact; the tests skip points within 0.5 px of an edge.

import { orientation, pointInPolygon, RIGHT, reflectPoint, segmentsIntersect, segmentIntersection } from '../geometry/primitives.js';
import { rayCast } from '../geometry/raycast.js';

/** Grid points inside the polygon, spaced `step` apart. O(g · n) for g grid points (one point-in-polygon test each). */
export function gridPoints(polygon, step) {
  const minX= Math.min(...polygon.map((p) => p.x))
  const maxX= Math.max(...polygon.map((p) => p.x))
  const minY= Math.min(...polygon.map((p) => p.y))
  const maxY= Math.max(...polygon.map((p) => p.y))
  const points = []
  for (let x = Math.ceil(minX / step) * step; x <= maxX; x += step) {
    for (let y = Math.ceil(minY / step) * step; y <= maxY; y += step) {
      if (pointInPolygon({x, y}, polygon)){
        points.push({x, y})
      }
    }
  }
  return points
}

/** Does q see p, that is: does the segment from q to p stay inside the polygon? O(n): one ray. */
export function isVisible(polygon, q, p) {
  if(p.x === q.x && p.y === q.y) return true

  const hit = rayCast(polygon, q, p)
  if (hit == null) return false
  if (hit.vertex !== undefined){
    const v = polygon[hit.vertex]
    return (p.x - q.x) ** 2 + (p.y - q.y) ** 2 <= (v.x - q.x) ** 2 + (v.y - q.y) ** 2;
  }
  const a = polygon[hit.wall]
  const b = polygon[(hit.wall + 1) % polygon.length]
  return orientation(a, b, p) !== RIGHT

}

/**
 * Does q see p by way of the mirror (wall mirrorIndex)? Used on Figure 3 to check mirrorRegion.
 * Reflect p in the mirror line; the line of sight from q to that image must cross the mirror at a point r,
 * and both q → r and r → p must stay inside the room.
 * O(n): one reflection and two rays.
 */
export function isVisibleThroughMirror(polygon, mirrorIndex, q, p) {
  const a = polygon[mirrorIndex]
  const b = polygon[(mirrorIndex + 1)%polygon.length]
  const pp = reflectPoint(p, a, b)

  if(!segmentsIntersect(q, pp, a, b)) return false
  const r = segmentIntersection(q, pp, a, b)
  if ((r.x === p.x && r.y === p.y) || (r.x === q.x && r.y === q.y)) return false   // p or q lies on the mirror itself
  return rayCast(polygon, q, r)?.wall === mirrorIndex && rayCast(polygon, p, r)?.wall === mirrorIndex
}

/**
 * Brute-force link distance from q to each of the given points, up to maxK (Figure 4).
 * Level 1: the points q sees. Level i + 1: the points not reached yet that some point of level i sees.
 * With a mirror (mirrorIndex given), "sees" means directly or by way of the mirror; a bounce is not a link.
 * Only grid points serve as bends, so this can need more links than the real link distance near region edges.
 * O(k · g² · n) in the worst case for g points: every level tests every unreached point against the previous level.
 * @returns {number[]} for each point its link distance, or Infinity if it is not reached within maxK links
 */
// AI GENERATED: linkDistances.
export function linkDistances(polygon, q, points, maxK, mirrorIndex = null) {
  const sees = (f, p) =>
    isVisible(polygon, f, p) || (mirrorIndex !== null && isVisibleThroughMirror(polygon, mirrorIndex, f, p))
  const distance = points.map(() => Infinity)
  let frontier = [q]
  for (let level = 1; level <= maxK; level++) {
    const next = []
    points.forEach((p, i) => {
      if (distance[i] !== Infinity) return
      if (frontier.some((f) => sees(f, p))) {
        distance[i] = level
        next.push(p)
      }
    })
    if (next.length === 0) break
    frontier = next
  }
  return distance
}
