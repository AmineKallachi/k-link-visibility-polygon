// AI GENERATED: this whole file.
import p5 from 'p5';
import { COLORS, polygon, segment, dot, ring } from './draw.js';
import { LAYERS, wall } from './layers.js';
import { buildControls } from './controls.js';
import { explain } from './errors.js';
import { pointInPolygon, orientation, onSegment, ON } from '../geometry/primitives.js';

p5.disableFriendlyErrors = true;

const WIDTH = 640;
const HEIGHT = 400;
const GRAB = 10;
const MARGIN = 8;

const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) <= GRAB;
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

/** Where a point lies with respect to the room: 'inside', 'wall' (on a wall or corner) or 'outside'. */
function placeInRoom(room, point) {
  const n = room.length;
  const onWall = room.some((a, i) => orientation(a, room[(i + 1) % n], point) === ON && onSegment(a, room[(i + 1) % n], point));
  if (onWall) return 'wall';
  return pointInPolygon(point, room) ? 'inside' : 'outside';
}

export class RoomCanvas {
  constructor(host, scene, { features }) {
    this.scene = scene;
    this.features = features;
    this.on = { ...features };
    this.k = 1;
    this.drawing = null;
    this.drawError = null;
    this.controls = buildControls(host, this);
    this.p = new p5((p) => this.sketch(p), this.controls.canvasHost);
    scene.views.push(this);
  }

  get room() { return this.scene.room; }
  get q() { return this.scene.q; }
  get mirrorIndex() { return this.scene.mirrorIndex; }
  get hasMirror() { return Boolean(this.on.mirror); }

  has(key) {
    return key in this.features;
  }

  canToggle(key) {
    return typeof this.features[key] === 'boolean';
  }

  startDrawing() {
    this.drawing = [];
    this.drawError = null;
  }

  loadExample() {
    this.drawing = null;
    this.scene.loadExample();
  }

  redraw() {
    if (this.redrawPending) return;
    this.redrawPending = true;
    requestAnimationFrame(() => {
      this.redrawPending = false;
      this.p.redraw();
    });
  }

  sketch(p) {
    p.setup = () => {
      p.createCanvas(WIDTH, HEIGHT);
      p.noLoop();
    };
    p.draw = () => this.draw(p);
    p.mousePressed = () => this.onPress(p);
    p.mouseDragged = () => this.onDrag(p);
    p.mouseReleased = () => { this.dragging = null; };
    p.mouseMoved = () => { if (this.drawing && this.inside(p)) p.redraw(); };
    p.keyPressed = () => this.onKey(p);
  }

  mouse(p) {
    return { x: Math.round(p.mouseX), y: Math.round(HEIGHT - p.mouseY) };
  }

  /** The mouse position kept inside the canvas, so a dragged sensor or corner cannot be lost. */
  dragPoint(p) {
    const m = this.mouse(p);
    return { x: clamp(m.x, MARGIN, WIDTH - MARGIN), y: clamp(m.y, MARGIN, HEIGHT - MARGIN) };
  }

  inside(p) {
    return p.mouseX >= 0 && p.mouseX <= WIDTH && p.mouseY >= 0 && p.mouseY <= HEIGHT;
  }

  draw(p) {
    this.notes = [this.scene.roomNote, this.drawing && this.drawError].filter(Boolean);
    p.background(COLORS.background);
    p.translate(0, HEIGHT);
    p.scale(1, -1);
    if (this.drawing) this.drawChain(p);
    else this.drawScene(p);
    this.controls.showNotes(this.notes);
  }

  drawScene(p) {
    p.stroke(COLORS.wall);
    p.strokeWeight(2);
    p.fill(COLORS.floor);
    polygon(p, this.room);

    const sensorReady = this.has('sensor') && this.sensorInside();
    for (const layer of LAYERS) {
      if (!this.on[layer.key] || (layer.needsSensor && !sensorReady)) continue;
      p.push();
      try {
        layer.draw(p, this);
      } catch (error) {
        this.notes.push(`${layer.label}: ${explain(error)}`);
      }
      p.pop();
    }

    p.stroke(COLORS.wall);
    p.strokeWeight(2);
    p.noFill();
    polygon(p, this.room);
    if (this.hasMirror) segment(p, ...wall(this, this.mirrorIndex), COLORS.mirror, 6);
    if (this.has('edit')) for (const v of this.room) dot(p, v, COLORS.corner, 7);
    if (this.has('sensor')) dot(p, this.q, sensorReady ? COLORS.sensor : COLORS.sensorOutside, 14);
  }

  /** The regions need the sensor strictly inside the room: not outside it and not on a wall. */
  sensorInside() {
    try {
      const place = placeInRoom(this.room, this.q);
      if (place === 'inside') return true;
      this.notes.push(place === 'wall' ? 'The sensor is on a wall. Move it into the room.' : 'The sensor is outside the room.');
      return false;
    } catch (error) {
      this.notes.push(`Sensor check: ${explain(error)}`);
      return true;
    }
  }

  drawChain(p) {
    p.noFill();
    p.stroke(...COLORS.drawing);
    p.strokeWeight(2);
    p.beginShape();
    for (const v of [...this.drawing, this.mouse(p)]) p.vertex(v.x, v.y);
    p.endShape();
    for (const v of this.drawing) dot(p, v, COLORS.drawing, 7);
    if (this.drawing.length >= 3) ring(p, this.drawing[0], COLORS.drawing, 2 * GRAB);
    this.notes.push('Click to add corners. Click the first corner or press Enter to close. Backspace removes the last corner, Esc cancels.');
  }

  onPress(p) {
    if (!this.inside(p)) return;
    const m = this.mouse(p);
    if (!this.drawing) this.dragging = this.pick(m);
    else if (this.drawing.length >= 3 && near(m, this.drawing[0])) this.closeDrawing();
    else this.drawing.push(m);
    p.redraw();
  }

  pick(m) {
    if (this.has('sensor') && near(m, this.q)) return { kind: 'sensor' };
    const index = this.has('edit') ? this.room.findIndex((v) => near(m, v)) : -1;
    return index >= 0 ? { kind: 'corner', index } : null;
  }

  onDrag(p) {
    if (!this.dragging) return;
    const m = this.dragPoint(p);
    const { kind, index } = this.dragging;
    if (kind === 'corner') this.scene.moveCorner(index, m);
    if (kind !== 'sensor') return;
    // A sensor inside the room stays inside: a drag onto a wall or out of the room is ignored. A sensor that is
    // already outside (after drawing a new room) can move freely, so it can be brought back in.
    const leaves = placeInRoom(this.room, this.q) === 'inside' && placeInRoom(this.room, m) !== 'inside';
    if (!leaves) this.scene.moveSensor(m);
  }

  onKey(p) {
    if (!this.drawing) return;
    if (p.key === 'Enter' && this.drawing.length >= 3) this.closeDrawing();
    if (p.key === 'Backspace') this.drawing.pop();
    if (p.key === 'Escape') this.drawing = null;
    p.redraw();
  }

  closeDrawing() {
    const error = this.scene.setRoom(this.drawing);
    if (error) {
      this.drawError = `Room not accepted: ${error}`;
      return;
    }
    this.drawing = null;
    this.p.redraw();
  }
}
