// Demo page: draws the room, the mirror and the sensor, and shows whatever region
// the selected algorithm returns. Unfinished blocks just show their TODO message.
//
// Controls:  drag the sensor or any vertex with the mouse
//            1 = V_P(q) (block 3)   2 = V_{P,e}(q) (block 7)   3 = V^k_{P,e}(q) (block 12)
//            + / - = change k       e = move the mirror to the next edge
import './style.css';
import p5 from 'p5';
import { visibilityPolygon } from './geometry/visibility.js';
import { mirrorVisibilityPolygon } from './geometry/mirror.js';
import { kLinkMirrorRegion } from './geometry/klink.js';

const W = 800;
const H = 600;

const state = {
  // A U-shaped room, counterclockwise in math coordinates (y pointing UP).
  room: [
    { x: 80, y: 80 }, { x: 720, y: 80 }, { x: 720, y: 520 }, { x: 480, y: 520 },
    { x: 480, y: 300 }, { x: 320, y: 300 }, { x: 320, y: 520 }, { x: 80, y: 520 },
  ],
  mirrorIndex: 0, // edge 0 = bottom wall
  q: { x: 200, y: 400 },
  k: 1,
  mode: 1,
  dragging: null,
};

const MODES = {
  1: { name: 'V_P(q), no mirror (block 3)', run: (s) => visibilityPolygon(s.room, s.q) },
  2: { name: 'V_{P,e}(q), with mirror (block 7)', run: (s) => mirrorVisibilityPolygon(s.room, s.mirrorIndex, s.q) },
  3: { name: 'V^k_{P,e}(q), k-link with mirror (block 12)', run: (s) => kLinkMirrorRegion(s.room, s.mirrorIndex, s.q, s.k) },
};

const statusEl = document.querySelector('#status');

new p5((p) => {
  // Mouse position in math coordinates (canvas y points down, so flip it).
  const mouse = () => ({ x: p.mouseX, y: H - p.mouseY });
  const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < 12;

  p.setup = () => {
    p.createCanvas(W, H).parent('canvas');
  };

  p.draw = () => {
    p.background(250);
    p.push();
    p.translate(0, H);
    p.scale(1, -1); // from here on, y points up like in the papers

    // Room
    p.stroke(40); p.strokeWeight(2); p.fill(255);
    drawPolygon(p, state.room);

    // Region computed by the selected algorithm
    let message = '';
    try {
      const region = MODES[state.mode].run(state);
      const polygons = region && region.length && region[0].x !== undefined ? [region] : region || [];
      p.noStroke(); p.fill(255, 200, 0, 120);
      polygons.forEach((poly) => drawPolygon(p, poly));
    } catch (err) {
      message = err.message;
    }

    // Mirror edge
    const a = state.room[state.mirrorIndex];
    const b = state.room[(state.mirrorIndex + 1) % state.room.length];
    p.stroke(30, 120, 255); p.strokeWeight(6); p.line(a.x, a.y, b.x, b.y);

    // Vertices and sensor
    p.noStroke(); p.fill(40);
    state.room.forEach((v) => p.circle(v.x, v.y, 8));
    p.fill(220, 30, 30); p.circle(state.q.x, state.q.y, 14);
    p.pop();

    statusEl.textContent =
      `Mode ${state.mode}: ${MODES[state.mode].name}   |   k = ${state.k}   |   mirror = edge ${state.mirrorIndex}` +
      (message ? `   |   ${message}` : '');
  };

  p.mousePressed = () => {
    const m = mouse();
    if (near(m, state.q)) state.dragging = state.q;
    else state.dragging = state.room.find((v) => near(m, v)) || null;
  };
  p.mouseDragged = () => {
    if (!state.dragging) return;
    const m = mouse();
    state.dragging.x = m.x;
    state.dragging.y = m.y;
  };
  p.mouseReleased = () => { state.dragging = null; };

  p.keyPressed = () => {
    if (MODES[p.key]) state.mode = Number(p.key);
    if (p.key === '+' || p.key === '=') state.k += 1;
    if (p.key === '-' && state.k > 1) state.k -= 1;
    if (p.key === 'e') state.mirrorIndex = (state.mirrorIndex + 1) % state.room.length;
  };
});

function drawPolygon(p, poly) {
  p.beginShape();
  poly.forEach((v) => p.vertex(v.x, v.y));
  p.endShape(p.CLOSE);
}
