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
| 1 Basic geometry | `src/geometry/primitives.js` |
| 2 Windows, 4 Pockets, 6 Union | `src/geometry/pockets.js` |
| 3 V_P(q), 5 WV_P(s) | `src/geometry/visibility.js` |
| 7 V_{P,e}(q), 8 WV_{P,e}(s) | `src/geometry/mirror.js` |
| 9–12 k-link regions | `src/geometry/klink.js` |
| 13 Verification | `src/verify/bruteforce.js` |
| Demo page | `src/main.js`, `index.html` |
| Tests | `tests/*.test.js` |

## Conventions

- Point = `{ x, y }`, segment = `[a, b]`, polygon = array of points, **counterclockwise**, no repeated last point.
- Edge `i` goes from `polygon[i]` to `polygon[(i + 1) % n]`. The mirror is given by its edge index.
- The demo flips the canvas so **y points up**, like in the papers.
- Use `orient()` from `primitives.js` for every left/right/collinear test: it is exact
  (robust-predicates), so no epsilon hacks.

## Libraries

- `p5`: drawing and mouse/keyboard interaction in the demo.
- `robust-predicates`: exact orientation test (note: its raw `orient2d` has the opposite sign; `orient()` fixes that).
- `polygon-clipping`: union/intersection/difference of polygons, only for checking results (block 13).
- `vitest` (dev): tests.
# k-link-visibility-polygon
