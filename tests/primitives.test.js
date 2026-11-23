import { describe, it, expect } from 'vitest';
import {
  calculateDeterminant, orientation, segmentsIntersect, segmentIntersection, pointInPolygon, onSegment,
  twiceSignedArea, reflectPoint, LEFT, RIGHT, ON,
} from '../src/geometry/primitives.js';

const p = (x, y) => ({ x, y });

describe('calculateDeterminant and orientation', () => {
  const a = p(0, 0), b = p(4, 0);

  it('gives twice the signed area of the triangle', () => {
    expect(calculateDeterminant(a, b, p(0, 3))).toBe(12);
    expect(calculateDeterminant(a, b, p(0, -3))).toBe(-12);
  });

  it('returns LEFT, RIGHT and ON', () => {
    expect(orientation(a, b, p(1, 1))).toBe(LEFT);
    expect(orientation(a, b, p(1, -1))).toBe(RIGHT);
    expect(orientation(a, p(2, 1), p(6, 3))).toBe(ON);
  });

  it('is exact for large whole numbers that are almost on one line', () => {
    expect(orientation(p(0, 0), p(30000000, 30000001), p(60000000, 60000002))).toBe(ON);
    expect(orientation(p(0, 0), p(30000000, 30000001), p(60000000, 60000003))).toBe(LEFT);
  });

  it('throws for a point without coordinates', () => {
    expect(() => orientation(a, b, [1, 2])).toThrow();
  });
});

describe('segmentsIntersect', () => {
  it('finds crossing segments', () => {
    expect(segmentsIntersect(p(0, 0), p(4, 4), p(0, 4), p(4, 0))).toBe(true);
  });
  it('counts touching at an endpoint (closed segments)', () => {
    expect(segmentsIntersect(p(0, 0), p(4, 0), p(2, 0), p(2, 5))).toBe(true);
  });
  it('handles segments on one line', () => {
    expect(segmentsIntersect(p(0, 0), p(4, 0), p(3, 0), p(8, 0))).toBe(true);
    expect(segmentsIntersect(p(0, 0), p(4, 0), p(5, 0), p(8, 0))).toBe(false);
  });
  it('rejects parallel and separate segments', () => {
    expect(segmentsIntersect(p(0, 0), p(4, 0), p(0, 1), p(4, 1))).toBe(false);
    expect(segmentsIntersect(p(0, 0), p(1, 1), p(3, 0), p(2, 1))).toBe(false);
  });
});

describe('segmentIntersection', () => {
  it('returns the point and how far along the first segment it is', () => {
    expect(segmentIntersection(p(0, 0), p(4, 4), p(0, 4), p(4, 0))).toEqual({ x: 2, y: 2, t: 0.5 });
  });
  it('returns an endpoint of the second segment exactly when it lies on the first', () => {
    const hit = segmentIntersection(p(0, 0), p(3, 0), p(1, 0), p(1, 7));
    expect([hit.x, hit.y]).toEqual([1, 0]);
  });
  it('throws for parallel segments', () => {
    expect(() => segmentIntersection(p(0, 0), p(4, 0), p(0, 1), p(4, 1))).toThrow();
  });
});

describe('pointInPolygon, onSegment, twiceSignedArea', () => {
  const square = [p(0, 0), p(10, 0), p(10, 10), p(0, 10)];
  const ell = [p(0, 0), p(10, 0), p(10, 4), p(4, 4), p(4, 10), p(0, 10)];

  it('tells inside from outside, also in a non-convex room', () => {
    expect(pointInPolygon(p(5, 5), square)).toBe(true);
    expect(pointInPolygon(p(11, 5), square)).toBe(false);
    expect(pointInPolygon(p(2, 8), ell)).toBe(true);
    expect(pointInPolygon(p(8, 8), ell)).toBe(false);
  });
  it('counts the boundary as inside', () => {
    expect(pointInPolygon(p(10, 5), square)).toBe(true);
    expect(pointInPolygon(p(0, 0), square)).toBe(true);
  });
  it('onSegment checks the bounding box of a point on the line', () => {
    expect(onSegment(p(0, 0), p(4, 4), p(2, 2))).toBe(true);
    expect(onSegment(p(0, 0), p(4, 4), p(5, 5))).toBe(false);
  });
  it('twiceSignedArea is positive for a counterclockwise room', () => {
    expect(twiceSignedArea(square)).toBe(200);
    expect(twiceSignedArea([...square].reverse())).toBe(-200);
  });
});

describe('reflectPoint', () => {
  it('reflects in horizontal, vertical and slanted lines', () => {
    expect(reflectPoint(p(3, 5), p(0, 0), p(10, 0))).toEqual({ x: 3, y: -5 });
    expect(reflectPoint(p(3, 5), p(1, 0), p(1, 10))).toEqual({ x: -1, y: 5 });
    expect(reflectPoint(p(2, 0), p(0, 0), p(1, 1))).toEqual({ x: 0, y: 2 });
  });
  it('throws when the two points of the line are equal', () => {
    expect(() => reflectPoint(p(1, 1), p(0, 0), p(0, 0))).toThrow();
  });
});
