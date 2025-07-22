const lerp = (x, y, a) => x * (1 - a) + y * a;

const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a));

const invlerp = (x, y, a) => clamp((a - x) / (y - x));

const range = (x1, y1, x2, y2, a) => lerp(x2, y2, invlerp(x1, y1, a));

function scaleToFit(
  sourceWidth,
  sourceHeight,
  destWidth,
  destHeight,
  min = 0,
  max = Infinity
) {
  return clamp(
    Math.min(destWidth / sourceWidth, destHeight / sourceHeight),
    min,
    max
  );
}

function scaleToCover(sourceWidth, sourceHeight, destWidth, destHeight) {
  return Math.max(destWidth / sourceWidth, destHeight / sourceHeight);
}

export { lerp, clamp, invlerp, range, scaleToFit, scaleToCover };
