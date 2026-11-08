// Block 1: basic geometry.
// Conventions used everywhere in this project:
//   point   = { x, y }
//   segment = [a, b]            (two points)
//   polygon = [p0, p1, ..., pn-1] in COUNTERCLOCKWISE order, no repeated last point
//   edge i  = segment from polygon[i] to polygon[(i + 1) % n]


export const LEFT = "left", RIGHT = "right", ON = "on";
/**
 * > 0 if a, b, c make a left turn (counterclockwise),
 * < 0 if they make a right turn (clockwise),
 * = 0 if they are collinear.
 */
export function calculateDeterminant(p, q, r){
  return (q.x - p.x)*(r.y - p.y) - (r.x-p.x)*(q.y-p.y);
}
export function orientation(a, b, c) {
  const d = calculateDeterminant(a, b, c);
  if (d > 0) return LEFT;
  if (d < 0) return RIGHT;
  if (d === 0) return ON;
  throw new Error("orientation: a point has a missing coordinate");
}

/** Do segments [p, q] and [r, s] intersect? 
 * Returns true when segments intersect, or lie on one line and overlap.
*/
export function segmentsIntersect(p, q, r, s) {
  if (orientation(p, q, r) === ON && orientation(p, q, s) === ON && segmentsOverlap(p, q, r, s)) return true;
  if ((orientation(p, q, r) !== orientation(p, q, s)) && (orientation(r, s, p) !== orientation(r, s, q))) return true;
  return false;
}
export function segmentsOverlap(p, q, r, s) {
  const lo1 = Math.min(p.x, q.x);
  const hi1 = Math.max(p.x, q.x);
  const lo2 = Math.min(r.x, s.x);
  const hi2 = Math.max(r.x, s.x);
  const lo1y = Math.min(p.y, q.y);
  const hi1y = Math.max(p.y, q.y);
  const lo2y = Math.min(r.y, s.y);
  const hi2y = Math.max(r.y, s.y);
  if ((Math.max(lo1, lo2) <= Math.min(hi1, hi2)) && (Math.max(lo1y, lo2y) <= Math.min(hi1y, hi2y))) return true ;
  return false;
}

/** Intersection point of segment [p, q] with segment [r, s], only call if segmentsIntersect returns true and segments are not parallel */
export function segmentIntersection(p, q, r, s) {
  const Dp = calculateDeterminant(r, s, p);
  const Dq = calculateDeterminant(r, s, q);
  // parallel or on the same line
  if (Dp === Dq) throw new Error("segmentIntersection: segments are parallel or on one line");

  const t = Dp / (Dp - Dq)
  //r or s fall on pq
  if (orientation(p, q, r) === ON) return { x: r.x, y: r.y, t };
  if (orientation(p, q, s) === ON) return { x: s.x, y: s.y, t };

  //base case 
  const x = p.x + t*(q.x - p.x);
  const y = p.y + t*(q.y - p.y);
  return {x, y, t};
}

/** Twice the signed area of the room: > 0 if its vertices are counterclockwise. */
export function twiceSignedArea(room) {
  let sum = 0;
  for (let i = 0; i < room.length; i++) {
    const a = room[i], b = room[(i + 1) % room.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum;
}

/** Is p, which lies on the line through a and b, between a and b? */
export function onSegment(a, b, p) {
  return Math.min(a.x, b.x) <= p.x && p.x <= Math.max(a.x, b.x) &&
         Math.min(a.y, b.y) <= p.y && p.y <= Math.max(a.y, b.y);
}

/** Is point p inside (or on the boundary of) the polygon? */
export function pointInPolygon(p, polygon) {
  const n = polygon.length
  let cross = 0
  for (let i = 0; i < n; i++){ //for each wall
    const a = polygon[i], b = polygon[(i + 1) % n]
    if(orientation(a, b, p) === ON && onSegment(a, b, p)) return true
    if((a.y > p.y) !== (b.y > p.y)) { //XOR
      if(a.y > b.y) {
        if(orientation(a, b, p) === RIGHT) cross +=1 
      } else {
        if(orientation(a, b, p) === LEFT) cross +=1 
      }  
    }
  }
  if(cross % 2 == 0) return false
  else return true  
}

/** Mirror image of point p across the line through a and b (used for q' in block 7). */
export function reflectPoint(p, a, b) {
  throw new Error('TODO block 1: reflectPoint');
}
