// What all canvases share: the room, the sensor, the laser's aim point and the mirror wall.
import { EXAMPLES } from './examples.js';
import { isTodo, explain } from './errors.js';
import { makeRoom } from '../geometry/room.js';

const copy = (points) => points.map((v) => ({ ...v }));

export class Scene {
  constructor(example) {
    this.example = EXAMPLES[example];
    this.views = [];
    this.loadExample();
  }

  loadExample() {
    this.room = copy(this.example.room);
    this.q = { ...this.example.q };
    this.aim = { ...this.example.aim };
    this.mirrorIndex = 0;
    this.roomNote = null;
    this.changed();
  }

  setRoom(points) {
    const result = this.checkRoom(points);
    if (result.error) return result.error;
    this.room = result.room;
    this.roomNote = result.note ?? null;
    this.mirrorIndex %= this.room.length;
    this.changed();
    return null;
  }

  moveCorner(index, point) {
    const points = this.room.map((v, i) => (i === index ? point : v));
    const result = this.checkRoom(points);
    if (result.room?.length !== points.length) return;
    this.room = result.room;
    this.roomNote = result.note ?? null;
    this.changed();
  }

  moveSensor(point) {
    this.q = point;
    this.changed();
  }

  moveAim(point) {
    this.aim = point;
    this.changed();
  }

  nextMirror() {
    this.mirrorIndex = (this.mirrorIndex + 1) % this.room.length;
    this.changed();
  }

  checkRoom(points) {
    try {
      return { room: makeRoom(points) };
    } catch (error) {
      if (isTodo(error)) return { room: copy(points), note: `Room check: ${explain(error)}` };
      return { error: error.message };
    }
  }

  changed() {
    for (const view of this.views) view.redraw();
  }
}
