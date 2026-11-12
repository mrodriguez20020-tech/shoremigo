/** Geometry-only placement rules shared by pointer, keyboard and automatic motion. */
export interface AvoidRect { left: number; right: number; top: number; bottom: number; tipOnly?: boolean }
export interface Viewport { width: number; height: number }
export const CLEARANCE = 12;
export function overlaps(a: AvoidRect, b: AvoidRect, gap = CLEARANCE) {
  return a.left < b.right + gap && a.right > b.left - gap && a.top < b.bottom + gap && a.bottom > b.top - gap;
}
export function footprint(x: number, bottom: number, size: number, viewport: Viewport): AvoidRect {
  return { left:x, right:x+size, top:viewport.height-bottom-size, bottom:viewport.height-bottom };
}
export function safeLaneX(want: number, size: number, viewport: Viewport, zones: AvoidRect[], bottom = 10): number | null {
  const min = 16, max = viewport.width-size-16;
  if (max < min) return null;
  const clamp = (n: number) => Math.max(min,Math.min(max,n));
  const standing = footprint(0,bottom,size,viewport);
  const blocking = zones.filter((z) => !z.tipOnly && z.top < standing.bottom+CLEARANCE && z.bottom > standing.top-CLEARANCE);
  const candidates = [clamp(want),min,max,...blocking.flatMap((z)=>[z.left-size-CLEARANCE,z.right+CLEARANCE])];
  const legal = candidates.filter((x)=>x>=min && x<=max && !blocking.some((z)=>overlaps(footprint(x,bottom,size,viewport),z)));
  return legal.sort((a,b)=>Math.abs(a-want)-Math.abs(b-want))[0] ?? null;
}
export function safeCompactSpot(size: number, viewport: Viewport, zones: AvoidRect[]): { x: number; bottom: number } | null {
  const active = zones.filter((z)=>!z.tipOnly);
  const xs = [viewport.width-size-10, 10];
  const bottoms = [10, ...active.flatMap((z)=>[viewport.height-z.top+CLEARANCE, viewport.height-z.bottom-size-CLEARANCE])];
  for(const bottom of bottoms.filter((n)=>n>=10 && n<=viewport.height-size-88).sort((a,b)=>a-b)) {
    for(const x of xs) if(!active.some((z)=>overlaps(footprint(x,bottom,size,viewport),z))) return {x,bottom};
  }
  return null;
}
