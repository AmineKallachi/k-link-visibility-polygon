// Blocks 2, 4 and 6: windows, pockets and union of visible regions.

/**
 * Block 2: the windows of a visible region = its edges that are not (part of) walls of P.
 * Returns an array of segments.
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
  throw new Error("windows needs the vertex/wall labels from visibilityPolygon");
}

function shareAWall(A, B) {
  return A.some(w => B.includes(w));
}



/**
 * Block 4: the pocket behind a window = the part of P on the other side of the window.
 * Mahdavi et al. 2011, §2 (a window can bend, Fig. 2).
 */
export function pocket(polygon, window) {
  throw new Error('TODO block 4: pocket');
}

/**
 * Block 6: union of two visible regions by walking the boundary in order
 * (Order Property, Kouhestani et al. 2010, §3.1, Lemma 1).
 */
export function unionOfVisibleRegions(polygon, regionA, regionB) {
  throw new Error('TODO block 6: unionOfVisibleRegions');
}
