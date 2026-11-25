# k-link visibility with a mirror

Interactive report on Mahdavi, Mohades & Kouhestani, *Computing k-Link Visibility Polygons in Environments with a
Reflective Edge* (CCCG 2011). INFO-F420 Computational Geometry, Université libre de Bruxelles, 2026.

Live page: https://aminekallachi.github.io/k-link-visibility-polygon/

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (once, after unzipping or cloning) |
| `npm run dev` | Start the page at http://localhost:5173, reloads on every save |
| `npm test` | Run the tests, re-runs on every save (`npx vitest run` runs once) |
| `npm run build` | Build the static site into `dist/` (GitHub Pages does this on every push to `main`) |

## Where each building block is

| Block | File |
|---|---|
| 1 Basic geometry, room | `src/geometry/primitives.js`, `src/geometry/room.js` |
| 1 Ray casting (used by the brute force) | `src/geometry/raycast.js` |
| 2 Windows, 6 Union of regions | `src/geometry/pockets.js` |
| 3 V_P(q), 5 WV_P(s) (sampled) | `src/geometry/visibility.js` |
| 7 V_{P,e}(q): region seen through the mirror | `src/geometry/mirror.js` |
| 9–12 k-link regions, without and with the mirror | `src/geometry/klink.js` |
| 13 Brute-force checks | `src/verify/bruteforce.js` |
| Web page: text and sections | `index.html` |
| Web page: which figure shows what | `src/main.js` |
| Web page: canvas, layers, controls | `src/ui/` |
| Tests | `tests/*.test.js` |

Pockets (block 4) and visibility from a segment with the mirror (block 8) are not needed as separate functions;
`klink.js` explains why.

## Conventions

- Point = `{ x, y }`, segment = `[a, b]`, polygon = array of points, **counterclockwise**, no repeated last point.
- Edge `i` goes from `polygon[i]` to `polygon[(i + 1) % n]`. The mirror is given by its edge index.
- The page flips the canvas so **y points up**, like in the papers.
- Rooms and the sensor have whole-number coordinates. `orientation()` in `primitives.js` is exact for them, so
  there is no tolerance in the algorithms. The region seen through the mirror scales the room so that the mirror
  image of the sensor also has whole-number coordinates, and uses exact predicates (`robust-predicates`).
- Computed points are not tested again: each records the corner (`vertex: i`) or wall (`wall: i`) it lies on.

## Adding or changing a figure

Each `<div data-canvas="name">` in `index.html` gets the features listed under `name` in `src/main.js`.
A new layer goes in `src/ui/layers.js`: a key, a label, and a `draw` function that calls the geometry.

## Use of AI

AI assistants (Claude, by Anthropic) were used during the development of the code and the interactive figures, and
for drafting and editing the text of the page. Functions written by AI are marked `// AI GENERATED` in the source
files. What was asked, what was used, how it was checked and what I decided myself is documented in
[AI-JOURNAL.md](AI-JOURNAL.md).

## Libraries

- `p5`: drawing and mouse/keyboard interaction on the page.
- `js-sdsl`: ordered set (balanced search tree) for the rotational sweeps.
- `clipper-lib`: union of visible regions (a JavaScript port of Angus Johnson's Clipper).
- `robust-predicates`: exact orientation tests for the region seen through the mirror (Shewchuk's predicates).
- `@fontsource-variable/archivo`, `@fontsource-variable/literata`: the page's fonts, served with the site.
- `vite` (dev): development server and build. `vitest` (dev): tests.
