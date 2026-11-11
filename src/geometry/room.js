// Block 1: turning clicked points into a valid room.
import { orientation, segmentsIntersect, twiceSignedArea, onSegment, ON, RIGHT } from './primitives.js';

const same = (a, b) => a.x === b.x && a.y === b.y;

// AI GENERATED: makeRoom, checkWalls, foldsBack
/**
 * Turns clicked points into a valid room: whole-number coordinates, no two consecutive points equal,
 * counterclockwise, at least 3 corners and no walls that cross or touch.
 * Throws an Error with a short reason (shown to the reader) if that is not possible.
 */
export function makeRoom(points) {
  const room = [];
  for (const p of points) {
    const point = { x: Math.round(p.x), y: Math.round(p.y) };
    if (room.length === 0 || !same(point, room[room.length - 1])) room.push(point);
  }
  while (room.length > 1 && same(room[0], room[room.length - 1])) room.pop();

  if (room.length < 3) throw new Error('a room needs at least 3 corners');
  checkWalls(room);

  const area = twiceSignedArea(room);
  if (area === 0) throw new Error('the room has no area');
  if (area < 0) room.reverse();
  return room;
}

/** Throws if two walls cross or touch, or if a wall folds back over the previous one. */
function checkWalls(room) {
  const n = room.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = room[i], b = room[(i + 1) % n];
      const c = room[j], d = room[(j + 1) % n];
      if (j === i + 1) {
        if (foldsBack(a, b, d)) throw new Error('a wall folds back');
      } else if (i === 0 && j === n - 1) {
        if (foldsBack(c, a, b)) throw new Error('a wall folds back');
      } else if (segmentsIntersect(a, b, c, d)) {
        throw new Error('walls cross or touch');
      }
    }
  }
}

/** Walls a → b and b → c lie on one line and the second one goes back over the first. */
function foldsBack(a, b, c) {
  return orientation(a, b, c) === ON && (onSegment(a, b, c) || onSegment(b, c, a));
}

/** Indices of the reflex corners (inside angle larger than 180°) of a counterclockwise room. */
export function reflexVertices(room) {
  const n = room.length;
  const reflexvertices = []
  for (let i = 0; i < n; i++) {
    const previous = room[(i-1 + n) % n];
    const next = room[(i+1) % n];
    if (orientation(previous, room[i], next) === RIGHT)
      reflexvertices.push(room[i])
  }
  return reflexvertices;

}
