// Windows of a visible region, and the union of visible regions.
import ClipperLib from 'clipper-lib';

/**
 * Block 2: the windows of a visible region = its edges that are not (part of) walls of P.
 * Returns an array of segments.
 * O(m) for a region with m points: thanks to the labels each edge is checked in O(1). Optimal.
 */
export function windows(polygon, region) {
  const n = polygon.length
  let result = []
  for (let i = 0; i < region.length; i++) {
    let u = region[i]
    let v = region[(i + 1)%region.length]
    if(!shareAWall(wallsOf(u,n), wallsOf(v, n))){
      result.push([u, v])
    }
  }
  return result
}

function wallsOf(p, n) {
  if (typeof p.wall !== 'undefined') {
    return [p.wall];
  }
  if(typeof p.vertex !== 'undefined'){
    return [p.vertex, (p.vertex - 1 + n)%n]
  }
  return []   // a point inside the room (for example where two shadow edges of a union cross)
}

function shareAWall(A, B) {
  return A.some(w => B.includes(w));
}



// No function computes the pocket behind a window (Mahdavi et al. 2011, §2): kLinkRegion does not need it, because
// what a point on a window sees beyond its region always lies in that window's pocket (the argument of Lemma 3).

/**
 * Block 6: the union of visible regions inside polygon P.
 * Kouhestani et al. 2010 merge two visibility polygons in linear time by walking along the walls (their Lemma 1;
 * not the Lemma 1 of Mahdavi et al. 2011).
 * Here the Clipper library does it instead: it works on whole numbers internally (coordinates × SCALE),
 * so it does not break on rounding noise.
 * Complexity: Clipper uses a sweep line (Vatti 1992), roughly O((N + I) log N) for N points and I crossings;
 * merging in pairs takes about log₂ r rounds for r regions. The paper's Lemma 1 merges two visibility polygons in
 * O(n) by walking along the walls in order (Order Property). Not used: it needs exact labels on every point, also on
 * crossings inside the room, and k-link merges hundreds of sampled regions, not two.
 * The result gets the same labels as visibilityPolygon: `vertex: i` for a corner of P, `wall: i` for a point
 * inside wall i, and no label for a point inside the room. So windows() works on it.
 * @param {Point[][]} regions  polygons inside P
 * @returns {Point[][]} the outer boundaries of the union, counterclockwise
 */
// AI GENERATED: unionOfVisibleRegions and labelPoint.
const SCALE = 10000;
const TOUCH = 1e-3;

export function unionOfVisibleRegions(polygon, regions) {
  const paths = regions
    .filter((region) => region.length >= 3)
    .map((region) => [region.map((p) => ({ X: Math.round(p.x * SCALE), Y: Math.round(p.y * SCALE) }))]);
  if (paths.length === 0) return [];
  return mergeAll(paths).map((ring) => {
    const points = ring.map((p) => labelPoint(polygon, { x: p.X / SCALE, y: p.Y / SCALE }));
    return ClipperLib.Clipper.Orientation(ring) ? points : points.reverse();
  });
}

/**
 * Merge neighbours first, in pairs, then pairs of pairs: neighbouring regions (from neighbouring sample points)
 * overlap almost completely, so their union stays small. Much faster than merging hundreds of regions at once.
 */
function mergeAll(paths) {
  while (paths.length > 1) {
    const next = [];
    for (let i = 0; i < paths.length; i += 2) next.push(i + 1 < paths.length ? merge([...paths[i], ...paths[i + 1]]) : paths[i]);
    paths = next;
  }
  return merge(paths[0]);
}

/** Union of some rings with Clipper; keeps only the outer boundaries. */
function merge(rings) {
  const clipper = new ClipperLib.Clipper();
  clipper.AddPaths(rings, ClipperLib.PolyType.ptSubject, true);
  const tree = new ClipperLib.PolyTree();
  clipper.Execute(ClipperLib.ClipType.ctUnion, tree, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
  return tree
    .Childs()
    .map((outer) => ClipperLib.Clipper.CleanPolygon(outer.Contour(), 0.01 * SCALE))
    .filter((ring) => ring.length >= 3);
}

/** The point with a label: corner of P (snapped onto it), inside a wall of P, or none. */
function labelPoint(polygon, p) {
  const n = polygon.length;
  const j = polygon.findIndex((v) => Math.hypot(v.x - p.x, v.y - p.y) < TOUCH);
  if (j >= 0) return { x: polygon[j].x, y: polygon[j].y, vertex: j };
  for (let i = 0; i < n; i++) {
    const a = polygon[i], b = polygon[(i + 1) % n];
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
    if (t > 0 && t < 1 && Math.hypot(a.x + t * dx - p.x, a.y + t * dy - p.y) < TOUCH) return { ...p, wall: i };
  }
  return p;
}
