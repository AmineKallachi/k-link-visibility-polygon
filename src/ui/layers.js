// The layers a canvas can show, in drawing order. Each layer only calls geometry functions and draws the result.
import { COLORS, regions, segment, dot, dots, ring } from './draw.js';
import { reflectPoint } from '../geometry/primitives.js';
import { rayCast } from '../geometry/raycast.js';
import { reflexVertices } from '../geometry/room.js';
import { visibilityPolygon } from '../geometry/visibility.js';
import { windows } from '../geometry/pockets.js';
import { mirrorRegion, visibleMirrorPart } from '../geometry/mirror.js';
import { kLinkRegion, kLinkMirrorRegion } from '../geometry/klink.js';
import { gridPoints, isVisible, isVisibleThroughMirror } from '../verify/bruteforce.js';

const GRID_STEP = 3;

export const wall = (s, i) => [s.room[i], s.room[(i + 1) % s.room.length]];

export const LAYERS = [
  {
    key: 'klink',
    label: 'k-link region',
    todo: 'the region seen with at most k links',
    needsSensor: true,
    draw(p, s) {
      const region = s.hasMirror
        ? kLinkMirrorRegion(s.room, s.mirrorIndex, s.q, s.k)
        : kLinkRegion(s.room, s.q, s.k);
      regions(p, region, COLORS.klink);
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
    todo: 'the mirror image q′ and the region seen through the mirror',
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
    key: 'mirrorGrid',
    label: 'Check with brute force',
    todo: 'the brute-force check through the mirror',
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
    todo: 'the windows of the visible region',
    needsSensor: true,
    draw(p, s) {
      for (const [a, b] of windows(s.room, visibilityPolygon(s.room, s.q))) {
        segment(p, a, b, COLORS.window, 1.5, true);
      }
    },
  },
  {
    key: 'fan',
    label: 'Rays to all corners',
    needsSensor: true,
    draw(p, s) {
      s.room.forEach((corner, i) => {
        if (corner.x === s.q.x && corner.y === s.q.y) return;
        const hit = rayCast(s.room, s.q, corner);
        if (!hit) return;
        const reachesCorner = hit.vertex === i;
        segment(p, s.q, hit, reachesCorner ? COLORS.rayToCorner : COLORS.ray, reachesCorner ? 1.5 : 1);
      });
    },
  },
  {
    key: 'laser',
    label: 'Laser',
    needsSensor: true,
    draw(p, s) {
      const hit = rayCast(s.room, s.q, s.aim);
      if (!hit) return;
      if (hit.wall !== undefined) segment(p, ...wall(s, hit.wall), COLORS.hit, 4);
      if (hit.vertex !== undefined) ring(p, s.room[hit.vertex], COLORS.hit, 18);
      segment(p, s.q, hit, COLORS.laser, 2);
      dot(p, hit, COLORS.hit, 7);
    },
  },
  {
    key: 'reflex',
    label: 'Reflex corners',
    needsSensor: false,
    draw(p, s) {
      for (const i of reflexVertices(s.room)) ring(p, s.room[i], COLORS.reflex);
    },
  },
];
