export function easeInOut(value) {
  return value * value * (3 - 2 * value);
}

export function lerp(a, b, mix) {
  return a + (b - a) * mix;
}

export function rotateX(vector, angle) {
  const y = vector.y * Math.cos(angle) - vector.z * Math.sin(angle);
  vector.z = vector.y * Math.sin(angle) + vector.z * Math.cos(angle);
  vector.y = y;
}

export function rotateY(vector, angle) {
  const x = vector.x * Math.cos(angle) - vector.z * Math.sin(angle);
  vector.z = -vector.x * Math.sin(angle) + vector.z * Math.cos(angle);
  vector.x = x;
}

export function rotateZ(vector, angle) {
  const x = vector.x * Math.cos(angle) - vector.y * Math.sin(angle);
  vector.y = vector.x * Math.sin(angle) + vector.y * Math.cos(angle);
  vector.x = x;
}
