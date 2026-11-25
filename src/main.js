import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/literata/opsz.css';
import '@fontsource-variable/literata/opsz-italic.css';
import './style.css';
import { Scene } from './ui/scene.js';
import { RoomCanvas } from './ui/roomCanvas.js';

// All canvases share one room, sensor and mirror wall: a change in one shows up in all of them.
const scene = new Scene('comb');

// What each canvas can do. A feature that is not listed is not available.
// Controls: edit (draw the room, move corners), sensor (drag the sensor).
// Mirror and layers: true = on with a checkbox, false = off with a checkbox, 'always' = on without a checkbox.
// Layers: visible, windows, mirrorView, klink, grid, mirrorGrid, linkGrid.
const CANVASES = {
  direct: {
    features: { edit: true, sensor: true, visible: 'always', windows: false, grid: false },
  },
  mirror: {
    features: { edit: true, sensor: true, mirror: 'always', mirrorView: true, visible: false, mirrorGrid: false },
  },
  klink: {
    features: { edit: true, sensor: true, mirror: false, klink: true, windows: false, linkGrid: false },
  },
};

for (const host of document.querySelectorAll('[data-canvas]')) {
  new RoomCanvas(host, scene, CANVASES[host.dataset.canvas]);
}

// Sidebar: highlight the section that is being read.
const tocLinks = new Map([...document.querySelectorAll('nav.toc a')].map((a) => [a.hash.slice(1), a]));
const reading = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const a of tocLinks.values()) a.classList.remove('current');
      tocLinks.get(entry.target.id)?.classList.add('current');
    }
  },
  { rootMargin: '0px 0px -70% 0px' },
);
for (const id of tocLinks.keys()) {
  const section = document.getElementById(id);
  if (section) reading.observe(section);
}
