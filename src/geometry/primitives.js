// Block 1: basic geometry.
// Conventions used everywhere in this project:
//   point   = { x, y }
//   segment = [a, b]            (two points)
//   polygon = [p0, p1, ..., pn-1] in COUNTERCLOCKWISE order, no repeated last point
//   edge i  = segment from polygon[i] to polygon[(i + 1) % n]
import { orient2d } from 'robust-predicates';

/**
 * > 0 if a, b, c make a left turn (counterclockwise),
 * < 0 if they make a right turn (clockwise),
 * = 0 if they are collinear.
 * Exact (no rounding errors) thanks to robust-predicates.
 * Note: robust-predicates itself uses the OPPOSITE sign, hence the minus.
 */
export function orient(a, b, c) {
  return -orient2d(a.x, a.y, b.x, b.y, c.x, c.y);
}

/** Do segments [p, q] and [r, s] intersect (touching counts)? */
export function segmentsIntersect(p, q, r, s) {
  throw new Error('TODO block 1: segmentsIntersect');
}

/** Intersection point of segment [p, q] with segment [r, s], or null. */
export function segmentIntersection(p, q, r, s) {
  throw new Error('TODO block 1: segmentIntersection');
}

/** First point where the ray from `origin` in direction `dir` hits the polygon boundary. */
export function rayCast(origin, dir, polygon) {
  throw new Error('TODO block 1: rayCast');
}

/** Is point p inside (or on the boundary of) the polygon? */
export function pointInPolygon(p, polygon) {
  throw new Error('TODO block 1: pointInPolygon');
}

/** Mirror image of point p across the line through a and b (used for q' in block 7). */
export function reflectPoint(p, a, b) {
  throw new Error('TODO block 1: reflectPoint');
}
