# k-link visibility with a mirror

Implementation of Mahdavi, Mohades & Kouhestani, *Computing k-Link Visibility Polygons
in Environments with a Reflective Edge* (CCCG 2011).

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (once, after unzipping or cloning) |
| `npm run dev` | Start the demo at http://localhost:5173, reloads on every save |
| `npm test` | Run the tests, re-runs on every save (`npx vitest run` runs once) |
| `npm run build` | Build the static site into `dist/` (for GitHub Pages) |

## Where each building block goes

| Block | File |
|---|---|
| 1 Basic geometry | `src/geometry/primitives.js`, `src/geometry/room.js` |
| 1 Ray casting (AI-generated) | `src/geometry/raycast.js` |
| 2 Windows, 4 Pockets, 6 Union | `src/geometry/pockets.js` |
| 3 V_P(q), 5 WV_P(s) | `src/geometry/visibility.js` |
| 7 V_{P,e}(q), 8 WV_{P,e}(s) | `src/geometry/mirror.js` |
| 9–12 k-link regions | `src/geometry/klink.js` |
| 13 Verification | `src/verify/bruteforce.js` |
| Web page: text and sections | `index.html` |
| Web page: which canvas shows what | `src/main.js` |
| Web page: canvas, layers, controls | `src/ui/` |
| Tests | `tests/*.test.js` |

## Conventions

- Point = `{ x, y }`, segment = `[a, b]`, polygon = array of points, **counterclockwise**, no repeated last point.
- Edge `i` goes from `polygon[i]` to `polygon[(i + 1) % n]`. The mirror is given by its edge index.
- The demo flips the canvas so **y points up**, like in the papers.
- Use `orientation()` from `primitives.js` for every left/right/collinear test. It is exact for
  whole-number coordinates, so no epsilon hacks (see DESIGN-NOTES.md).
- Unfinished geometry functions throw `Error('TODO block n: name')`; the web page then shows "coming soon".

## Adding or changing a canvas

Each `<div data-canvas="name">` in `index.html` gets the features listed under `name` in `src/main.js`.
A new layer goes in `src/ui/layers.js`: a key, a label, and a `draw` function that calls the geometry.

## Libraries

- `p5`: drawing and mouse/keyboard interaction in the demo.
- `polygon-clipping`: union/intersection/difference of polygons, only for checking results (block 13).
- `vitest` (dev): tests.
# k-link-visibility-polygon
