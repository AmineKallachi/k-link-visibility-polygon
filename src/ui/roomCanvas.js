import p5 from 'p5';
import { COLORS, polygon, segment, dot, ring } from './draw.js';
import { LAYERS, wall } from './layers.js';
import { buildControls } from './controls.js';
import { explain, isTodo } from './errors.js';
import { pointInPolygon } from '../geometry/primitives.js';

p5.disableFriendlyErrors = true;

const WIDTH = 640;
const HEIGHT = 400;
const GRAB = 10;

const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) <= GRAB;

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
  get aim() { return this.scene.aim; }
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

  inside(p) {
    return p.mouseX >= 0 && p.mouseX <= WIDTH && p.mouseY >= 0 && p.mouseY <= HEIGHT;
  }

  draw(p) {
    this.notes = [this.scene.roomNote, this.drawing && this.drawError].filter(Boolean);
    this.todos = [];
    p.background(COLORS.background);
    p.translate(0, HEIGHT);
    p.scale(1, -1);
    if (this.drawing) this.drawChain(p);
    else this.drawScene(p);
    this.controls.showNotes(this.notes);
    this.controls.showTodos(this.todos);
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
        if (isTodo(error) && layer.todo) this.todos.push(layer.todo);
        else this.notes.push(`${layer.label}: ${explain(error)}`);
      }
      p.pop();
    }

    p.stroke(COLORS.wall);
    p.strokeWeight(2);
    p.noFill();
    polygon(p, this.room);
    if (this.hasMirror) segment(p, ...wall(this, this.mirrorIndex), COLORS.mirror, 6);
    if (this.has('edit')) for (const v of this.room) dot(p, v, COLORS.corner, 7);
    if (this.on.laser) ring(p, this.aim, COLORS.aim, 14);
    if (this.has('sensor')) dot(p, this.q, sensorReady ? COLORS.sensor : COLORS.sensorOutside, 14);
  }

  sensorInside() {
    try {
      if (pointInPolygon(this.q, this.room)) return true;
      this.notes.push('The sensor is outside the room.');
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
    if (this.on.laser && near(m, this.aim)) return { kind: 'aim' };
    const index = this.has('edit') ? this.room.findIndex((v) => near(m, v)) : -1;
    return index >= 0 ? { kind: 'corner', index } : null;
  }

  onDrag(p) {
    if (!this.dragging) return;
    const m = this.mouse(p);
    const { kind, index } = this.dragging;
    if (kind === 'sensor') this.scene.moveSensor(m);
    if (kind === 'aim') this.scene.moveAim({ ...(this.room.find((v) => near(m, v)) ?? m) });
    if (kind === 'corner') this.scene.moveCorner(index, m);
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
