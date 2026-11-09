import './style.css';
import { Scene } from './ui/scene.js';
import { RoomCanvas } from './ui/roomCanvas.js';

// All canvases share one room, sensor and mirror wall: a change in one shows up in all of them.
const scene = new Scene('comb');

// What each canvas can do. A feature that is not listed is not available.
// Controls: edit (draw the room, move corners), sensor (drag the sensor).
// Mirror and layers: true = on with a checkbox, false = off with a checkbox, 'always' = on without a checkbox.
// Layers: visible, windows, mirrorView, klink, laser, fan, reflex, grid.
const CANVASES = {
  direct: {
    features: { edit: true, sensor: true, visible: true, windows: true, laser: false, fan: false, reflex: false, grid: false },
  },
  mirror: {
    features: { edit: true, sensor: true, mirror: 'always', mirrorView: true, visible: false },
  },
  klink: {
    features: { edit: true, sensor: true, mirror: false, klink: true, windows: false },
  },
};

for (const host of document.querySelectorAll('[data-canvas]')) {
  new RoomCanvas(host, scene, CANVASES[host.dataset.canvas]);
}
