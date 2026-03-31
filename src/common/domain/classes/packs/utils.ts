/**
 * Golden-angle HSL color rotation.
 * Produces visually distinct, well-separated colors for any palette size.
 * i = 0 → red-ish, then rotates 137.5° each step (the golden angle).
 */
export function goldenColor(i: number): string {
  const h = (i * 137.508) % 360;
  const s = 0.65;
  const l = 0.5;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }
  r += m; g += m; b += m;
  const hex = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}
