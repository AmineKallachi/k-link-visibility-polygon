// Example rooms, counterclockwise, y pointing up. Each one fits a 640 × 400 canvas.

export const EXAMPLES = {
  notch: {
    room: [
      { x: 60, y: 60 }, { x: 580, y: 60 }, { x: 580, y: 360 }, { x: 380, y: 360 },
      { x: 380, y: 200 }, { x: 260, y: 200 }, { x: 260, y: 360 }, { x: 60, y: 360 },
    ],
    q: { x: 150, y: 290 },
    aim: { x: 260, y: 200 },
  },
  comb: {
    room: [
      { x: 40, y: 40 }, { x: 600, y: 40 }, { x: 600, y: 360 }, { x: 480, y: 360 },
      { x: 480, y: 140 }, { x: 400, y: 140 }, { x: 400, y: 360 }, { x: 280, y: 360 },
      { x: 280, y: 140 }, { x: 200, y: 140 }, { x: 200, y: 360 }, { x: 40, y: 360 },
    ],
    q: { x: 110, y: 300 },
    aim: { x: 200, y: 140 },
  },
};
