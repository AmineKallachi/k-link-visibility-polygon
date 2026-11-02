import { describe, it, expect } from 'vitest';
import { orient } from '../src/geometry/primitives.js';

describe('orient', () => {
  const a = { x: 0, y: 0 };
  const b = { x: 1, y: 0 };

  it('is positive for a left turn (counterclockwise)', () => {
    expect(orient(a, b, { x: 0, y: 1 })).toBeGreaterThan(0);
  });

  it('is negative for a right turn (clockwise)', () => {
    expect(orient(a, b, { x: 0, y: -1 })).toBeLessThan(0);
  });

  it('is exactly zero for collinear points', () => {
    expect(orient(a, { x: 2, y: 1 }, { x: 6, y: 3 })).toBe(0);
  });
});

// Add one describe block per building block as you write it.
describe.todo('segmentsIntersect (block 1)');
describe.todo('reflectPoint (block 1)');
describe.todo('visibilityPolygon (block 3)');
