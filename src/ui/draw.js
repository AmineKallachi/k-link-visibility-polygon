// AI GENERATED: this whole file.
// Drawing helpers. All coordinates are in room coordinates (y up); the canvas is flipped once in roomCanvas.js.

export const COLORS = {
  background: [244, 245, 246],
  floor: 255,
  wall: [28, 35, 41],
  corner: [28, 35, 41],
  sensor: [179, 58, 58],
  sensorOutside: [160, 168, 175],
  visible: [242, 210, 122, 220],
  window: [28, 35, 41],
  mirror: [58, 110, 165],
  mirrorView: [58, 110, 165, 75],
  mirrorImage: [58, 110, 165],
  klink: [242, 210, 122],
  gridSeen: [46, 125, 90],
  gridHidden: [165, 173, 181],
  gridMirror: [40, 90, 160],
  drawing: [58, 110, 165],
};

const mix = (a, b, t) => a.map((v, i) => Math.round(v + t * (b[i] - v)));

/** Shade of the region seen with exactly `level` links: the yellow of Figure 2 for 1 link, lighter for every next level. */
const LEVELS = [[242, 210, 122], [246, 224, 160], [249, 234, 190], [251, 241, 211], [252, 246, 226], [253, 249, 236]];
export const levelColor = (level) => LEVELS[Math.min(level, LEVELS.length) - 1];

/**
 * Colour of a brute-force grid point at link distance `level`: a clearly different colour per level, so the levels
 * stand out on the coarse grid of Figure 4 (teal, raspberry, purple, amber, ...). No blue: blue is the mirror.
 */
export const LINK_COLORS = [[8, 80, 65], [196, 30, 90], [111, 63, 183], [194, 96, 0], [60, 60, 60], [120, 113, 108]];
export const linkColor = (level) => LINK_COLORS[Math.min(level, LINK_COLORS.length) - 1];

export const css = (color) => {
  const [r, g = r, b = r, a = 255] = [color].flat();
  return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
};

export function polygon(p, points) {
  p.beginShape();
  for (const v of points) p.vertex(v.x, v.y);
  p.endShape(p.CLOSE);
}

export function regions(p, result, color) {
  const list = Array.isArray(result) && result.length && result[0].x === undefined ? result : [result];
  p.noStroke();
  p.fill(...[color].flat());
  for (const region of list) if (region?.length) polygon(p, region);
}

export function segment(p, a, b, color, weight = 1, dashed = false) {
  p.stroke(...[color].flat());
  p.strokeWeight(weight);
  p.drawingContext.setLineDash(dashed ? [6, 5] : []);
  p.line(a.x, a.y, b.x, b.y);
  p.drawingContext.setLineDash([]);
}

export function dot(p, point, color, size = 8) {
  p.noStroke();
  p.fill(...[color].flat());
  p.circle(point.x, point.y, size);
}

export function dots(p, points, color, size = 4) {
  const ctx = p.drawingContext;
  ctx.fillStyle = css(color);
  ctx.beginPath();
  for (const point of points) ctx.rect(point.x - size / 2, point.y - size / 2, size, size);
  ctx.fill();
}

export function ring(p, point, color, size = 16, weight = 2) {
  p.noFill();
  p.stroke(...[color].flat());
  p.strokeWeight(weight);
  p.circle(point.x, point.y, size);
}
