// Drawing helpers. All coordinates are in room coordinates (y up); the canvas is flipped once in roomCanvas.js.

export const COLORS = {
  background: 247,
  floor: 255,
  wall: 40,
  corner: 40,
  reflex: [235, 120, 0],
  sensor: [220, 30, 30],
  sensorOutside: [160, 160, 160],
  aim: [220, 30, 30],
  laser: [220, 30, 30],
  hit: [220, 30, 30],
  ray: [120, 120, 120],
  rayToCorner: [30, 150, 90],
  visible: [255, 200, 0, 110],
  window: [235, 120, 0],
  mirror: [30, 120, 255],
  mirrorView: [30, 120, 255, 70],
  mirrorImage: [30, 120, 255],
  klink: [120, 200, 120, 100],
  gridSeen: [30, 150, 90],
  gridHidden: [190, 190, 190],
  drawing: [30, 120, 255],
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

export function ring(p, point, color, size = 16, weight = 2) {
  p.noFill();
  p.stroke(...[color].flat());
  p.strokeWeight(weight);
  p.circle(point.x, point.y, size);
}
