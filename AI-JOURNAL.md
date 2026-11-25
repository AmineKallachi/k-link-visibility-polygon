# AI journal

Project: k-link visibility with a mirror (INFO-F420). Author: Amine Kallachi.

## Tools and models

- **Claude** (Anthropic), in a claude.ai Project ("Computational Geometry Project") that contains the papers. Through
  the Claude desktop app, Claude could read and write files in my project folder. It ran code and tests in its own
  workspace and searched the web for sources.
- **Model:** Claude Opus 5.5, in every session except the final check on 25 Nov, which ran on Claude Sonnet 5.5.
- **Other AI tools:** none.

## How this journal is organised

One entry per working day. Claude drafted the entries from our sessions; I checked them. All code, mine and
AI-written, was verified before it was kept: with tests, against an independent brute force, or in the browser.
Each entry covers the required items:

- **Prompts and responses:** *Prompts* says what I asked, *Responses*, *AI-written code* and *Explanations only*
  say what Claude gave back. Up to 20 Nov the prompts are summarised; from 23 Nov the most significant ones are
  quoted.
- **How the results were used, checked, corrected or rejected:** the status of each AI result (**as-is**: used
  unchanged; **changed**: partly rewritten by me; **rejected**: not used), *Checked*, and *Corrected or rejected*.
- **My own decisions and contributions:** *My decisions* in every entry, *Written by me* where I wrote the code
  myself, and the overview below. AI-written code is also marked `// AI GENERATED` in the source files.

## Who wrote what

| Code | Written by |
|---|---|
| `src/geometry/raycast.js` (`rayCast`, `pointsOutside`) | **AI-generated** |
| `onSegment`, `twiceSignedArea` in `primitives.js` | AI-generated as part of `raycast.js`; moved to `primitives.js` by me |
| All other code in `src/geometry/primitives.js` (`calculateDeterminant`, `orientation`, `segmentsIntersect`, `segmentsOverlap`, `segmentIntersection`, `pointInPolygon`, `reflectPoint`) | **me**; reviewed and tested by Claude. For `orientation` and the fixes in `segmentIntersection` I took over example code from Claude (2026-11-02). |
| `makeRoom` in `src/geometry/room.js` | **AI-generated**, changed by me |
| `reflexVertices` (`room.js`), `gridPoints`, `isVisible`, `isVisibleThroughMirror` (`src/verify/bruteforce.js`) | **me**; reviewed by Claude. `isVisibleThroughMirror` fixed together with Claude (20 Nov); `reflexVertices` returns indices since 23 Nov (fix by Claude). |
| `windows` (`src/geometry/pockets.js`) | **me**, from Claude's pseudocode |
| `visibilityPolygon`, `segmentVisibilityPolygon`, `viewsFromSamples`, `samplesOn` (`src/geometry/visibility.js`) | **AI-generated** |
| `unionOfVisibleRegions` (`pockets.js`), all of `src/geometry/mirror.js` and `src/geometry/klink.js`, `linkDistances` (`bruteforce.js`) | **AI-generated** |
| `tests/primitives.test.js`, `tests/geometry.test.js` | AI-generated (23 Nov). The tests of 4 and 8 Nov were never committed. |
| Web page: `index.html` (layout and explanatory text), `src/main.js`, `src/style.css`, `src/ui/` | **AI-generated**; the page only calls the geometry code and draws the result. The text was drafted by Claude and rewritten in several rounds on 24–25 Nov, with the structure, tone and content directed by me; I checked the final text. |
| Figure 1 (`public/figures/intro-*.svg`) | **AI-generated**: own room in the style of the paper's figures, regions computed with a separate script (not in the repo); (c) corrected on 23 Nov |
| Figure 2 (`public/figures/terms-*.svg`) | **AI-generated** (25 Nov), with the same separate script as Figure 1 |
| `.github/workflows/deploy.yml`, README, starter project | AI-generated |

---

## 2026-11-02

**Prompts:** project setup (Node.js, Git, tooling); the orientation test; segment intersection (test and point); JSDoc comments; how ray casting and point-in-polygon work.

**AI-written code**

| What | Status |
|---|---|
| Starter project (folders, empty functions, demo page, configs, 3 tests, `orient()` wrapper) | as-is; `orient()` later dropped |
| `orientation()` with `LEFT` / `RIGHT` / `ON` and an error for a missing coordinate | as-is |
| Corrected `segmentIntersection` (parallel check, return r or s exactly, return t) | changed |

**Written by me, tested by Claude:** `calculateDeterminant`, `segmentsIntersect`, `segmentsOverlap`, `segmentIntersection`. Claude ran each version against an exact check and found the bugs: overlapping segments on one line, `min`/`max` from p5, missing `const`, `NaN` for segments on one line.

**Explanations only:** why not `createVector` in geometry code; the intersection point via similar triangles and its edge cases; `const` vs `let`; ray casting pseudocode; crossing number for point-in-polygon.

**Checked:** at my request, Claude tested each version of my functions against an exact check (see above).

**My decisions:** own determinant instead of `orient2d` from `robust-predicates`; sides as constants `LEFT` / `RIGHT` / `ON`; design decisions are only written down after my go-ahead.

## 2026-11-04

**Prompts:** sources for ray casting and where the paper covers it; working code for ray casting; whether rounding coordinates is a good idea; how to test my code.

**Responses:** the paper defines windows (§2) but does not compute visible regions itself (it cites Lee, Guibas et al. and Langetepe et al.); page references in de Berg et al. 2008 (§15.2, exercise 3.14, §1.1–1.2); explanations of `rayCast`, of rounding (de Berg p. 9 and p. 14; round once at the input, not inside the functions) and of point-in-polygon.

**AI-written code**

| What | Status |
|---|---|
| `src/geometry/raycast.js` (`rayCast` and helpers) | as-is |
| `tests/primitives.test.js`, `tests/raycast.test.js` (21 tests) | as-is; never committed (replaced on 23 Nov) |

**Checked:** Claude compared `rayCast` with an exact reference using fractions on about 58,000 rays in random rooms (also rooms with slanted walls and many reflex corners): 0 wrong. Claude found that my `segmentIntersection` returned no `t` in the normal case, which broke `rayCast`; I fixed it the same day.

**My decisions:** de Berg et al. 2008 as the main source; round input points to whole numbers; finish `primitives.js` (point-in-polygon, reflection) myself.

## 2026-11-08

**Prompts:** the pseudocode of point-in-polygon again; an explanation of the half-open rule; XOR in JavaScript; review of my `pointInPolygon`; which blocks to finish for the preliminary version (due Nov 11); why k-link needs visibility from a segment; an interactive web page with configurable canvases.

**Written by me, tested by Claude:** `pointInPolygon`; moving `onSegment` and `twiceSignedArea` from `raycast.js` to `primitives.js`. Claude found the bugs in my versions: `return` inside the loop, wall direction reversed, `else` attached to the wrong `if`, `polygon[i+1]` for the last wall, and `primitives.js` and `raycast.js` importing each other.

**AI-written code**

| What | Status |
|---|---|
| 4 tests for `pointInPolygon` in `tests/primitives.test.js` | as-is; never committed (replaced on 23 Nov) |
| Web page: `index.html`, `src/main.js`, `src/style.css`, `src/ui/*.js` (replaces the old demo) | as-is |
| Empty functions `makeRoom`, `reflexVertices`, `isVisible` (names and comments only) | as-is |
| `README.md` updated for the new files | as-is |

**Checked:** all 25 tests pass. Compared with exact references: `pointInPolygon` 0 wrong on 180,000 points, `rayCast` 0 wrong on 56,309 rays (after the move). Claude tested the web page in a browser (drawing a room, moving corners, sensor, laser, one room shared by the three canvases): no errors. I tested the page in the browser.

**My decisions:** basic helpers live in `primitives.js`; `raycast.js` imports from it, never the other way round. Web page: all computation stays in my geometry code; three canvases (without mirror, with mirror, k-link with a mirror switch) that share one room and sensor; the old demo is replaced; page text in English, with titles and one sentence for now.

## 2026-11-11

**Prompts:** which functions to write for the preliminary version; what a room looks like after `makeRoom` and how to get the previous and next corner; code for `makeRoom`; review of `reflexVertices`, `gridPoints` and `isVisible`; why the page was slow with a small grid step; a cleaner page with a real introduction, a figure that explains k-link visibility, the brute-force check and clear To do markers; whether the page covers the paper; how to put the site online.

**Written by me, tested by Claude:** `reflexVertices`, `gridPoints`, `isVisible`. Claude found the bugs: `next` was a copy of `previous`, corners returned instead of indices, a missing import, `includes` instead of `pointInPolygon`, a missing `return` and `const`, `i + step` without assignment, a wrong import path in `bruteforce.js`.

**AI-written code**

| What | Status |
|---|---|
| `makeRoom` in `room.js` | changed |
| Faster drawing of the grid points and of redraws while dragging (`src/ui/`) | as-is |
| Web page redesign: article layout, introduction, explanatory text for sections 1–4 with the lemmas, algorithms and running times of the paper, legend, brute-force checkbox, To do notes, self-hosted fonts | as-is; text to be checked and adapted by me |
| Figure 1: three panels (k = 1, k = 2, k = 2 with mirror), own room in the style of the paper's figures | as-is |
| `.github/workflows/deploy.yml` for GitHub Pages | as-is |

**Explanations only:** how `room` is stored; what `step` does in `gridPoints`; the squared-distance comparison in `isVisible`; which elements of the paper were missing from the page.

**Checked:** Claude checked the page on desktop and phone width (with the brute-force check on, the green points fill the yellow region), checked the paper text against the PDF, and built the committed code without errors. I checked the page text against the paper and the page in the browser.

**My decisions:** the first figure only shows the visible region, with the brute-force check as an option; article style; Figure 1 drawn in the style of the paper instead of copying the paper's figure (that would need the authors' permission); unfinished parts marked To do; the paper's lemmas and algorithms spread over sections 3 and 4; the site published with GitHub Pages.

## 2026-11-20

**Prompts:** what to write myself and what to let Claude generate; Theorem 2 of Kouhestani et al. explained; pseudocode for the mirror brute force and for `windows`; a review of my mirror functions; why the Pages deploy failed.

**Responses:** Claude explained Theorem 2 step by step and why the paper's helper polygon P′ is hard to compute exactly.

**AI-written code**

| What | Status |
|---|---|
| `visibleMirrorPart`, `mirrorRegion` (rays from q′), `mirrorVisibilityPolygon` in `mirror.js` | as-is; `mirrorRegion` replaced on 23 Nov |
| Labels (`vertex` / `wall`) on the points of `visibilityPolygon` | as-is |
| Pages workflow split into a build job and a deploy job | as-is |

**Written by me, tested by Claude:** `reflectPoint`, `isVisibleThroughMirror`, `windows`. Claude found the bugs in `isVisibleThroughMirror`: it tested the computed bounce point again (13% false negatives), and `!segmentsIntersect(...) == false` had the wrong meaning. Fixed together.

**Checked:** `mirrorRegion` against an independent brute force: 0 wrong (about 2.3 million points); `windows`: 0 wrong. I tested `mirrorRegion` in the browser.

**My decisions:** from now on Claude generates the main algorithms and I write the small functions and the brute-force checks; I keep the AI-written `visibilityPolygon`; the mirror region follows Kouhestani et al.'s Theorem 2, computed with rays from q′ instead of P′, because P′ has vertices that are not whole numbers and q′ lies on its boundary.

## 2026-11-23

**Prompts:** finish everything piece by piece (k-link, k-link with the mirror), consulting me for the decisions; the complexity of every algorithm in the code comments, with the paper's and why we differ; whether our complexity can be improved; a summary of the project, the algorithms and the sources for the report; a full check of the code, the docs and the page, and then fixing everything that was found; what else to change so the deploy works; as many brute-force points in the last figure as in the others, and why it is slower there; clearer colours per link level in that check. The most significant prompts:

> "can we improve this? this is way worse than the ideal complexity"

> "since i'm basically done and just need to do the reporting let's do the exact sweep. So we are limited because the paper is exact maths while on the computer it'll never be exact. And since our polygon will never be huge it's not worth it to try the linear time"

> "do a big check, check if all the code is correct, if we don't contradict ourselves, check the current report, give me a summary of everything you found"

**AI-written code**

| What | Status |
|---|---|
| Visibility from a window by sampling (`segmentVisibilityPolygon`, `viewsFromSamples`), union with Clipper, `kLinkRegion` | as-is |
| `linkDistances` (brute-force link distance on a grid, also through the mirror) | as-is |
| k-link with the mirror: `linkDistanceToMirror`, `twoLinkMirrorRegion` (Algorithm 3, both readings of step 2), `kLinkMirrorRegion` (Algorithm 4.2), `kLinkMirrorEveryLevel` (check of Lemma 8) | as-is |
| `mirrorRegion` rewritten as one exact sweep from q′ (O(n log n), exact predicates) | as-is |
| Complexity comments in every geometry file | as-is |
| After the check: sensor on a wall, corners on a window kept, `reflexVertices` returns indices, unused code and `polygon-clipping` removed, stale comments, README, Figure 1(c) corrected, two lines on the page | as-is |
| `tests/primitives.test.js`, `tests/geometry.test.js` (36 tests) | as-is |
| Brute force of the k-link figure: grid step 12 px instead of 3 (16 s per redraw), larger dots, one clearly different colour per level, a legend entry per level (`src/ui/draw.js`, `layers.js`, `controls.js`) | as-is |

**Explanations only:** at which levels the mirror matters (Lemma 8); what pseudo-polynomial means; how the paper reaches linear time (Guibas et al., Suri's window partition) and what implementing that would take; that the deploy only needed the updated `package-lock.json`; why the brute force of the k-link figure is slower (it computes link distances on the whole grid, O(k · g² · n)).

**Checked:** against brute force: k-link 0 wrong out of 61,641 overlap checks; k-link with the mirror on 90 rooms (about 186,000 checks): Lemma 8 holds and no reached point is missing; the exact mirror sweep 0 wrong on about 1.2 million points and the same area as the old version; visibility polygon 0 wrong on about 26,000 points; 460 runs without errors. Found by the checks: Algorithm 3 as written (windows of V_P) misses points in 2 of 90 rooms; the last deploy failed because `package-lock.json` was not committed; Figure 1(c) showed a sliver that is not reachable. Claude's time estimate for the sweep (2–3 hours) was far too high: it took minutes because the existing sweep and tests could be reused.

**Corrected or rejected:** the first `mirrorRegion` (rays from q′) was replaced by the exact sweep; `polygon-clipping` was replaced by Clipper; Claude's time estimate for the sweep was wrong (see above); BigInt arithmetic, offered as an alternative to `orient2d`, was not used.

**My decisions:** Clipper for the union; sample every 2 px; no separate pocket step (explained in the text); one shade per level; both readings of Algorithm 3 step 2, with the windows of V_{P,e} as default; Algorithm 4.2 as the main algorithm, with the every-level version as a check; Claude also writes `linkDistances`; the exact sweep for the mirror region; no exact linear-time version: the paper is exact mathematics, the computer never is, and my rooms are small, so it is not worth it (future work); a coarser grid for the brute force of the k-link figure; `orient2d` in the mirror sweep, not BigInt.

## 2026-11-24

**Prompts:** a full rewrite of the page following my outline; then a shorter rewrite in the style of an example project I showed (sidebar table of contents, about 3,000 words); several rounds of changes to that version; what the paper says about several mirrors and whether later work solved it. The most significant prompts:

> "Change the report, keep the interactive pieces at the right spots and do this: Start off with an intro to the problem, what are trying to compute, what it means intuitively. give the definitions of the basic words, windows, pockets, visibility etc. Talk about the naive way of solving the problem of the mirror […] Explain the 2-link, explain the four groups […] I told you to explain our complexity and why it's different from the ideal, but maybe not in the middle of the text, maybe add a section at the end, named design decisions […]"

> "this is too much text. I would do a table of contents, but this style. It needs to still be interesting to read through pretty easily. I also don't like the pseudocode, it doesn't read easily. You give too much info in the design decisions, make it more overzichtelijk, and don't talk about the specifics about the tests you ran […]"

> "the paper touches on a case with m mirrors, talk about that at the end as well and what the conclusion is"

**Responses:** two versions of the page text; the paper only mentions several mirrors in its conclusion (future work); known bounds for rooms where every wall is a mirror (Aronov et al. 1998); no later work found that solves the k-link case.

**AI-written code**

| What | Status |
|---|---|
| Sidebar table of contents that marks the section being read (`index.html`, `style.css`, `main.js`) | as-is |
| Page text: two full rewrites (about 6,000 words, then about 3,300), pseudocode, design decisions, related work, references | changed: structure, tone and content directed by me |

**Checked:** Claude checked the references (journal, volume, pages) and the claim about Bungiu et al.; screenshots of the page at desktop, laptop and phone width.

**Corrected or rejected:** the first rewrite (about 6,000 words) was too long and too dense; pseudocode as numbered steps was replaced by pseudocode that looks like simplified code; an author block with a yellow bar and the abstract were removed; a separate definitions section was rewritten as a story; instructions to the reader were removed; Claude's proposal to mark the differences with my implementation inside the pseudocode was not used (only the paper's pseudocode); Claude's own remark about several mirrors was not used, I asked for the later literature instead.

**My decisions:** the structure of the report and the style of the example site; related work only with the sources I actually used; pseudocode that looks like simplified code, and only the paper's version; "I" instead of "we"; no instructions to the reader; more technical terms.

## 2026-11-25

**Prompts:** design decisions and code comments worded so that it is clear the ideal complexity was not the goal; a new order for the last sections, with several mirrors folded into the conclusion; design decisions per algorithm instead of a table; a "Use of AI" statement on the page; the key terms in their own section with an illustration; more readable text; the sensor should not get lost outside the room or the canvas; sections 4 and 5 merged; fewer references to "the paper"; how to document AI use; this journal on GitHub. The most significant prompts:

> "I don't like the wording, as if i was too lazy to implement. I want to clearly state that some aspects weren't implemented to their ideal complexity since the goal is not to achieve that complexity but to understand the algorithms of the paper."

> "It reads way too weird, it's sometimes too scientific, some sentences seem to try to compact too much information in it […] it needs to be easily readable for all computer science students, while still being technical enough to show what we've done."

> "the sensor can go out of bounds and you can lose it as a user, make sure it doesn't go out of bounds."

**Responses:** the reworded page and comments below; advice to mention the page text in the AI statement and to keep a readable journal next to the conversation.

**AI-written code**

| What | Status |
|---|---|
| A dragged sensor stays inside the room, and dragged corners and the sensor stay on the canvas (`src/ui/roomCanvas.js`) | as-is |
| Complexity comments in `visibility.js`, `klink.js`, `mirror.js`, `pockets.js` reworded: the reason is stated in the comment (a subroutine from earlier work, not the paper's contribution) | as-is |
| Figure 2 (`public/figures/terms-a.svg`, `terms-b.svg`): the key terms drawn in the room of Figure 1 | as-is |
| Page text: several rounds of restructuring and rewriting, a "Key terms" section, a "Use of AI" section | changed: directed by me |
| README: a "Use of AI" section that links to this journal | as-is |

**Checked:** the 36 tests pass after each code change; Claude tested the sensor fix in a browser by dragging the sensor out of the room; screenshots of every version of the page; every file copied to my folder was compared with Claude's copy (one copy had failed silently and was redone).

**Corrected or rejected:** the design decisions were first worded as if the optimal versions were too much work, which I corrected; the design decisions table did not look professional and became prose per algorithm; the separate "Several mirrors" section was folded into the conclusion; the title "Seeing around corners" was replaced; text that was too dense or too scientific was rewritten; references to the paper in the explanation were reduced.

**My decisions:** the goal of the implementation is to understand the paper's algorithms, not to reach their optimal complexity; order after the algorithm sections: conclusion (with several mirrors), design decisions, related work, lemmas and theorems, use of AI, references; design decisions as short prose per algorithm; a short "Use of AI" statement on the page; this journal public on GitHub, the conversation itself not; the key terms as their own section with an illustration; the relay point explained where it first appears; one section for the mirror and one link.

**Final check** (Claude Sonnet 5.5; the fixes afterwards with Claude Opus 5.5)

> "now verify EVERYTHING, make sure all sources are correct, everything exists, no contradictions, and then give me a final rating on the project. Take your time"

**Responses:** the 16 references checked against publisher and index pages; the lemmas, theorems, algorithms and conclusion checked against the two papers; a fresh clone of the repository installed, tested and built; the page tested in a browser (the three canvases, dragging the sensor and corners, every mirror wall for k = 1 to 6, phone width); the running time measured (14–46 ms for rooms of 8 to 36 vertices); a list of wording problems and a rating of 8.5/10.

**AI-written code**

| What | Status |
|---|---|
| Page text: the sentence on Bungiu et al., the condition for reflecting the room (Section 4), sampling and rounding in the design decisions, a sentence on lines of sight that touch the boundary, the Figure 5 caption, the "Use of AI" statement, the author order of Penninger et al., the heading of Section 3 (now the same as its table of contents entry) | as-is |
| An empty favicon in `index.html`, so the browser no longer reports a missing file | as-is |
| `// AI GENERATED` markers on the page code (`src/main.js`, `src/ui/`, `src/style.css`), the tests, `onSegment` and `twiceSignedArea`; the README's "Use of AI" and building-block note; an unsupported claim removed from a comment in `visibility.js` | as-is |

**Checked:** the 36 tests and the build after the fixes; the page in a browser.

**Corrected or rejected:** Claude's design notes file was not added to the repository.

**My decisions:** which of the proposed fixes to apply; no design notes file in the repository.
