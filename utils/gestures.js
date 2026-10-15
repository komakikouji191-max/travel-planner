const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const identity = () => ({ zoom: 1, x: 0, y: 0 });
function apply(p, v) {
  return [p[0] * v.zoom + v.x, p[1] * v.zoom + v.y];
}
function invert(p, v) {
  return [(p[0] - v.x) / v.zoom, (p[1] - v.y) / v.zoom];
}
function zoomAt(v, factor, anchor) {
  const zoom = clamp(v.zoom * factor, 0.7, 4),
    p = invert(anchor, v);
  return { zoom, x: anchor[0] - p[0] * zoom, y: anchor[1] - p[1] * zoom };
}
function pan(v, dx, dy) {
  return { ...v, x: v.x + dx, y: v.y + dy };
}
function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
function midpoint(a, b) {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}
function tilt(dx, width = 375) {
  return clamp((dx / (width * 0.2)) * 5, -5, 5);
}
module.exports = {
  clamp,
  identity,
  apply,
  invert,
  zoomAt,
  pan,
  distance,
  midpoint,
  tilt,
};
