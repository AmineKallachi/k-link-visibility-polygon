// AI GENERATED: this whole file.
import { describe, it, expect } from 'vitest';
import { makeRoom, reflexVertices } from '../src/geometry/room.js';
import { rayCast } from '../src/geometry/raycast.js';
import { visibilityPolygon } from '../src/geometry/visibility.js';
import { windows } from '../src/geometry/pockets.js';
import { mirrorRegion, mirrorVisibilityPolygon, visibleMirrorPart } from '../src/geometry/mirror.js';
import { kLinkRegion, kLinkMirrorRegion, kLinkMirrorEveryLevel, twoLinkMirrorRegion } from '../src/geometry/klink.js';
import { gridPoints, isVisible, isVisibleThroughMirror, linkDistances } from '../src/verify/bruteforce.js';
import { EXAMPLES } from '../src/ui/examples.js';

const { comb, notch } = EXAMPLES;

// Floating-point helpers for the checks: inside a computed region, and distance to its edges.
function inside(point, polygon) {
  let c = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < a.x + ((point.y - a.y) / (b.y - a.y)) * (b.x - a.x)) c = !c;
  }
  return c;
}
const inRegion = (point, region) => region.some((part) => inside(point, part));
function nearEdge(point, polygon, r) {
  return polygon.some((a, i) => {
    const b = polygon[(i + 1) % polygon.length];
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy) < r;
  });
}
const area = (region) => region.reduce((s, r) => s + r.reduce((t, v, i) => t + v.x * r[(i + 1) % r.length].y - r[(i + 1) % r.length].x * v.y, 0) / 2, 0);

describe('makeRoom and reflexVertices', () => {
  it('rounds, drops repeated points and turns the room counterclockwise', () => {
    const room = makeRoom([{ x: 0, y: 0 }, { x: 0, y: 10.2 }, { x: 0, y: 10 }, { x: 10, y: 10 }, { x: 10, y: 0 }]);
    expect(room).toEqual([{ x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 0, y: 0 }]);
  });
  it('rejects crossing walls and rooms without area', () => {
    expect(() => makeRoom([{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 10, y: 0 }, { x: 0, y: 10 }])).toThrow();
    expect(() => makeRoom([{ x: 0, y: 0 }, { x: 5, y: 0 }])).toThrow();
  });
  it('finds the reflex corners as indices', () => {
    expect(reflexVertices(comb.room)).toEqual([4, 5, 8, 9]);
  });
});

describe('rayCast', () => {
  const room = comb.room;
  it('stops at the first wall', () => {
    expect(rayCast(room, { x: 110, y: 300 }, { x: 110, y: 400 })).toMatchObject({ x: 110, y: 360, wall: 10 });
  });
  it('stops in a convex corner, where the ray would leave the room', () => {
    expect(rayCast(room, { x: 110, y: 300 }, { x: 40, y: 360 })).toMatchObject({ x: 40, y: 360, vertex: 11 });
  });
  it('passes a reflex corner that it only grazes', () => {
    expect(rayCast(room, { x: 300, y: 300 }, { x: 280, y: 140 })).toMatchObject({ x: 267.5, y: 40, wall: 0 });
  });
  it('runs along walls and past several corners on one line', () => {
    expect(rayCast(room, { x: 120, y: 140 }, { x: 200, y: 140 })).toMatchObject({ x: 600, y: 140, wall: 1 });
  });
});

describe('visibilityPolygon', () => {
  it('agrees with the brute force on both example rooms', () => {
    for (const { room, q } of [comb, notch]) {
      const region = visibilityPolygon(room, q);
      for (const point of gridPoints(room, 9)) {
        if (nearEdge(point, region, 0.5) || nearEdge(point, room, 0.5)) continue;
        expect(inside(point, region), JSON.stringify(point)).toBe(isVisible(room, q, point));
      }
    }
  });
  it('throws for a sensor outside the room or on a wall', () => {
    expect(() => visibilityPolygon(comb.room, { x: 5, y: 5 })).toThrow('strictly inside');
    expect(() => visibilityPolygon(comb.room, { x: 60, y: 40 })).toThrow('strictly inside');
  });
  it('keeps a corner in line with q, so a window does not cover a wall', () => {
    // Sensor exactly in line with the wall from (400,480) to (400,640).
    const room = makeRoom([{ x: 600, y: 360 }, { x: 400, y: 360 }, { x: 440, y: 440 }, { x: 400, y: 480 }, { x: 400, y: 640 },
      { x: 320, y: 440 }, { x: 240, y: 520 }, { x: 280, y: 360 }, { x: 120, y: 400 }, { x: 200, y: 320 }, { x: 80, y: 280 },
      { x: 120, y: 200 }, { x: 120, y: 120 }, { x: 240, y: 160 }, { x: 280, y: 120 }, { x: 320, y: 240 }, { x: 400, y: 160 },
      { x: 360, y: 280 }, { x: 480, y: 240 }, { x: 400, y: 320 }]);
    const region = visibilityPolygon(room, { x: 400, y: 280 });
    const onWall3 = windows(room, region).filter(([a, b]) => a.x === 400 && b.x === 400 && Math.min(a.y, b.y) >= 480);
    expect(onWall3).toEqual([]);
  });
});

describe('windows', () => {
  it('finds the one window of each example room', () => {
    expect(windows(notch.room, visibilityPolygon(notch.room, notch.q)).length).toBe(1);
    expect(windows(comb.room, visibilityPolygon(comb.room, comb.q)).length).toBe(1);
  });
});

describe('mirrorRegion', () => {
  it('agrees with the brute force for every wall as the mirror', () => {
    for (const { room, q } of [comb, notch]) {
      for (let m = 0; m < room.length; m++) {
        const region = mirrorRegion(room, m, q);
        for (const point of gridPoints(room, 11)) {
          if (nearEdge(point, room, 0.5) || (region.length && nearEdge(point, region, 0.5))) continue;
          const expected = isVisibleThroughMirror(room, m, q, point);
          expect(region.length > 0 && inside(point, region), `mirror ${m} ${JSON.stringify(point)}`).toBe(expected);
        }
      }
    }
  });
  it('is empty when q does not see the mirror', () => {
    const m = comb.room.findIndex((v, i) => !visibleMirrorPart(comb.room, i, visibilityPolygon(comb.room, comb.q)));
    expect(m).toBeGreaterThanOrEqual(0);
    expect(mirrorRegion(comb.room, m, comb.q)).toEqual([]);
  });
  it('V_P,e(q) contains V_P(q)', () => {
    expect(area(mirrorVisibilityPolygon(comb.room, 0, comb.q))).toBeGreaterThan(area([visibilityPolygon(comb.room, comb.q)]));
  });
});

describe('k-link regions', () => {
  it('level 1 is the visibility polygon and the levels only grow', () => {
    const levels = kLinkRegion(comb.room, comb.q, 4);
    expect(area(levels[0])).toBeCloseTo(area([visibilityPolygon(comb.room, comb.q)]), 6);
    for (let k = 1; k < levels.length; k++) expect(area(levels[k])).toBeGreaterThanOrEqual(area(levels[k - 1]) - 1e-6);
  });
  it('contains every grid point the brute force reaches', () => {
    const levels = kLinkRegion(notch.room, notch.q, 3);
    const points = gridPoints(notch.room, 20);
    const distance = linkDistances(notch.room, notch.q, points, 3);
    points.forEach((point, i) => {
      if (distance[i] > 3 || levels.some((level) => level.some((part) => nearEdge(point, part, 1.5)))) return;
      expect(inRegion(point, levels[distance[i] - 1]), JSON.stringify(point)).toBe(true);
    });
  });
  it('finds ℓ and uses the mirror only at levels ℓ and ℓ + 1 (Lemma 8)', () => {
    const levels = kLinkMirrorRegion(comb.room, 0, comb.q, 4);
    const every = kLinkMirrorEveryLevel(comb.room, 0, comb.q, 4);
    expect(levels.ell).toBe(1);
    levels.forEach((level, i) => expect(Math.abs(area(level) - area(every[i]))).toBeLessThan(0.001 * area(level)));
  });
  it('without reaching the mirror within k links it is the ordinary k-link region', () => {
    const m = 6; // a wall of the comb room that q does not see directly
    const levels = kLinkMirrorRegion(comb.room, m, comb.q, 1);
    expect(levels.ell).toBe(Infinity);
    expect(area(levels[0])).toBeCloseTo(area(kLinkRegion(comb.room, comb.q, 1)[0]), 6);
  });
  it('the windows of V_P(O) (Algorithm 3 as written) miss points in the comb room', () => {
    const withMirrorWindows = twoLinkMirrorRegion(comb.room, 0, comb.q)[1];
    const withDirectWindows = twoLinkMirrorRegion(comb.room, 0, comb.q, { windowsOf: 'direct' })[1];
    expect(area(withDirectWindows)).toBeLessThan(area(withMirrorWindows) - 1000);
  });
});
