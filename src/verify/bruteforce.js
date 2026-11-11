// Block 13: verification.
// Idea: sample a grid of points inside P and decide for each one, by brute force,
// whether it is in the region. Then compare with the output of the real algorithm.
// polygon-clipping (already installed) can compute areas of union/difference
// to measure how far two regions are apart.

import { orientation, pointInPolygon, RIGHT } from '../geometry/primitives.js';
import { rayCast } from '../geometry/raycast.js';

/** Grid points inside the polygon, spaced `step` apart. */
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

/** Does q see p, that is: does the segment from q to p stay inside the polygon? */
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
