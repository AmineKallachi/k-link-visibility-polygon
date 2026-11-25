// AI GENERATED: this whole file.
// The layers a canvas can show, in drawing order. Each layer only calls geometry functions and draws the result.
import { COLORS, levelColor, linkColor, regions, segment, dot, dots, ring } from './draw.js';
import { reflectPoint } from '../geometry/primitives.js';
import { visibilityPolygon } from '../geometry/visibility.js';
import { windows } from '../geometry/pockets.js';
import { mirrorRegion, visibleMirrorPart } from '../geometry/mirror.js';
import { kLinkRegion, kLinkMirrorRegion } from '../geometry/klink.js';
import { gridPoints, isVisible, isVisibleThroughMirror, linkDistances } from '../verify/bruteforce.js';

const GRID_STEP = 3;
// Coarser than GRID_STEP on purpose: linkDistances compares every unreached point with every point of the previous
// level, O(k · g² · n) for g points. Comb room, k = 4: step 12 takes 0.1 s, step 3 (as the other figures) 16 s.
const LINK_GRID_STEP = 12;

export const wall = (s, i) => [s.room[i], s.room[(i + 1) % s.room.length]];

// The k-link levels take tens of milliseconds, so the last result is kept until the room, sensor, mirror or k change.
let cache = { key: null, levels: [] };
function cachedLevels(s) {
  const key = JSON.stringify([s.room, s.q, s.hasMirror && s.mirrorIndex]);
  if (cache.key !== key || cache.levels.length < s.k) {
    const levels = s.hasMirror ? kLinkMirrorRegion(s.room, s.mirrorIndex, s.q, s.k) : kLinkRegion(s.room, s.q, s.k);
    cache = { key, levels, ell: levels.ell };
  }
  return { levels: cache.levels.slice(0, s.k), ell: cache.ell };
}

export const LAYERS = [
  {
    key: 'klink',
    label: 'k-link region',
    needsSensor: true,
    draw(p, s) {
      const { levels, ell } = cachedLevels(s);
      if (s.hasMirror) {
        s.notes.push(ell > s.k
          ? `Link distance from q to the mirror: ℓ > k, so the mirror is not used within ${s.k} links.`
          : `Link distance from q to the mirror: ℓ = ${ell}. The mirror is used at levels ${ell} and ${ell + 1}.`);
      }
      for (let i = levels.length; i >= 1; i--) regions(p, levels[i - 1], levelColor(i));
      for (const part of levels.flat()) {
        for (const [a, b] of windows(s.room, part)) segment(p, a, b, COLORS.window, 1, true);
      }
    },
  },
  {
    key: 'visible',
    label: 'Visible region',
    needsSensor: true,
    draw(p, s) {
      regions(p, visibilityPolygon(s.room, s.q), COLORS.visible);
    },
  },
  {
    key: 'mirrorView',
    label: 'Seen through the mirror',
    needsSensor: true,
    draw(p, s) {
      if (!s.hasMirror) return;
      const [a, b] = wall(s, s.mirrorIndex);
      const image = reflectPoint(s.q, a, b);
      const direct = visibilityPolygon(s.room, s.q);
      regions(p, mirrorRegion(s.room, s.mirrorIndex, s.q, direct), COLORS.mirrorView);
      for (const m of visibleMirrorPart(s.room, s.mirrorIndex, direct) ?? []) {
        segment(p, s.q, m, COLORS.mirrorImage, 1, true);
        segment(p, image, m, COLORS.mirrorImage, 1, true);
      }
      ring(p, image, COLORS.mirrorImage, 14);
    },
  },
  {
    key: 'grid',
    label: 'Check with brute force',
    needsSensor: true,
    draw(p, s) {
      const seen = [];
      const hidden = [];
      for (const point of gridPoints(s.room, GRID_STEP)) {
        (isVisible(s.room, s.q, point) ? seen : hidden).push(point);
      }
      const size = Math.min(4, GRID_STEP * 0.7);
      dots(p, hidden, COLORS.gridHidden, size);
      dots(p, seen, COLORS.gridSeen, size);
    },
  },
  {
    key: 'linkGrid',
    label: 'Check with brute force',
    needsSensor: true,
    draw(p, s) {
      const points = gridPoints(s.room, LINK_GRID_STEP);
      const distance = linkDistances(s.room, s.q, points, s.k, s.hasMirror ? s.mirrorIndex : null);
      for (let level = 1; level <= s.k; level++) {
        dots(p, points.filter((_, i) => distance[i] === level), linkColor(level), 6);
      }
      dots(p, points.filter((_, i) => !(distance[i] <= s.k)), COLORS.gridHidden, 4);
    },
  },
  {
    key: 'mirrorGrid',
    label: 'Check with brute force',
    needsSensor: true,
    draw(p, s) {
      const seen = [];
      const reflected = [];
      const hidden = [];
      for (const point of gridPoints(s.room, GRID_STEP)) {
        if (isVisible(s.room, s.q, point)) seen.push(point);
        else if (s.hasMirror && isVisibleThroughMirror(s.room, s.mirrorIndex, s.q, point)) reflected.push(point);
        else hidden.push(point);
      }
      const size = Math.min(4, GRID_STEP * 0.7);
      dots(p, hidden, COLORS.gridHidden, size);
      dots(p, seen, COLORS.gridSeen, size);
      dots(p, reflected, COLORS.gridMirror, size);
    },
  },
  {
    key: 'windows',
    label: 'Windows',
    needsSensor: true,
    draw(p, s) {
      for (const [a, b] of windows(s.room, visibilityPolygon(s.room, s.q))) {
        segment(p, a, b, COLORS.window, 1.5, true);
      }
    },
  },
];
