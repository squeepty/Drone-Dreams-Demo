import { BaseDroneScene } from './BaseDroneScene.js';
import { bitmapTextPixels } from './bitmapFont.js';
import { rotateX, rotateY, rotateZ } from './math.js';

const TEXT_LINES = ['DRONE', 'DREAMS'];
const FALLBACK_PIXEL_SIZE = .34;
const FALLBACK_LINE_CENTER = 1.63;
const TEXT_FONT_SIZE = 124;
const TEXT_SCENE_WIDTH = 11.4;
const TEXT_SAMPLE_STEP = 3;
const TEXT_FONT = `900 ${TEXT_FONT_SIZE}px "Arial Rounded MT Bold", "Avenir Next Rounded", "Trebuchet MS", Verdana, sans-serif`;

function fallbackTextPixels() {
  return TEXT_LINES.flatMap((text, lineIndex) => {
    const { pixels, width, height } = bitmapTextPixels(text);
    const lineCenter = lineIndex === 0 ? FALLBACK_LINE_CENTER : -FALLBACK_LINE_CENTER;
    return pixels.map((pixel) => ({
      x: (pixel.x - (width - 1) / 2) * FALLBACK_PIXEL_SIZE,
      y: (pixel.y - (height - 1) / 2) * FALLBACK_PIXEL_SIZE + lineCenter,
    }));
  });
}

function roundedTextPixels() {
  const canvas = globalThis.document?.createElement('canvas');
  const measureContext = canvas?.getContext('2d');
  if (!canvas || !measureContext) return { pixels: fallbackTextPixels(), sampleSize: FALLBACK_PIXEL_SIZE };

  measureContext.font = TEXT_FONT;
  const maxLineWidth = Math.max(...TEXT_LINES.map((line) => measureContext.measureText(line).width));
  const width = Math.ceil(maxLineWidth + TEXT_FONT_SIZE * 1.35);
  const height = Math.ceil(TEXT_FONT_SIZE * 3.35);
  const centerX = width / 2;
  const centerY = height / 2;
  const lineGap = TEXT_FONT_SIZE * 1.28;

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return { pixels: fallbackTextPixels(), sampleSize: FALLBACK_PIXEL_SIZE };

  context.clearRect(0, 0, width, height);
  context.fillStyle = '#fff';
  context.font = TEXT_FONT;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(TEXT_LINES[0], centerX, centerY - lineGap / 2);
  context.fillText(TEXT_LINES[1], centerX, centerY + lineGap / 2);

  const image = context.getImageData(0, 0, width, height).data;
  const scale = TEXT_SCENE_WIDTH / maxLineWidth;
  const pixels = [];

  for (let y = 0; y < height; y += TEXT_SAMPLE_STEP) {
    for (let x = 0; x < width; x += TEXT_SAMPLE_STEP) {
      const alpha = image[(y * width + x) * 4 + 3] / 255;
      if (alpha < .18) continue;
      pixels.push({
        x: (x - centerX) * scale,
        y: (centerY - y) * scale,
        alpha,
      });
    }
  }

  return {
    pixels: pixels.length > 0 ? pixels : fallbackTextPixels(),
    sampleSize: TEXT_SAMPLE_STEP * scale,
  };
}

export class DroneDreamsTextScene extends BaseDroneScene {
  constructor({
    count,
    palette,
    seeds,
    id = 'drone-dreams-text',
    duration = 19.2,
    transitionDuration = 3,
  }) {
    super({
      id,
      duration,
      transitionDuration,
      count,
      palette,
      pointSizeScale: .48,
      cameraMode: 'close',
      viewportScale: .84,
    });
    this.seeds = seeds;
    this.colorCycle = [palette.violet, palette.blue, palette.cyan, palette.mint, palette.gold, palette.pink];
    const { pixels, sampleSize } = roundedTextPixels();
    const jitterSize = Math.max(.022, sampleSize * .62);
    this.basePositions = new Float32Array(count * 3);
    this.phases = new Float32Array(count);
    for (let index = 0; index < count; index++) {
      const glyph = pixels[Math.floor(((index * .61803398875) % 1) * pixels.length)];
      const offset = index * 3;
      const edgeSoftness = .56 + Math.min(1, glyph.alpha ?? 1) * .44;
      this.basePositions[offset] = glyph.x + (seeds[index] - .5) * jitterSize * edgeSoftness;
      this.basePositions[offset + 1] = glyph.y + (seeds[(index + 233) % count] - .5) * jitterSize * edgeSoftness;
      this.basePositions[offset + 2] = (seeds[(index + 719) % count] - .5) * .16;
      this.phases[index] = (index % pixels.length) * .19 + seeds[index] * Math.PI;
    }
  }

  targetPosition(index, time, localTime, out) {
    const offset = index * 3;
    const phase = this.phases[index];
    const activeDuration = Math.max(.001, this.duration - this.transitionDuration);
    const rotationStart = activeDuration * .5;
    const inRotation = localTime >= rotationStart;
    const ripple = Math.sin(this.basePositions[offset] * 1.7 + phase * .6 + localTime * 2.1);
    out.set(
      this.basePositions[offset] + Math.sin(phase + localTime * 1.7) * .018,
      this.basePositions[offset + 1] + Math.cos(phase * 1.7 + localTime * 1.35) * .018,
      this.basePositions[offset + 2] + ripple * (inRotation ? .28 : .07),
    );
    if (inRotation) {
      const progress = Math.min(1, (localTime - rotationStart) / (activeDuration - rotationStart));
      const spin = progress * Math.PI * 2;
      out.multiplyScalar(1 + Math.sin(spin * 2) * .075);
      rotateY(out, spin);
      rotateX(out, Math.sin(spin * 2) * .14);
      rotateZ(out, Math.sin(spin) * .075);
      out.y += Math.sin(spin * 2) * .16;
    } else {
      out.multiplyScalar(1 + Math.sin(localTime * .72) * .035);
      rotateY(out, Math.sin(localTime * .52) * .17);
      rotateX(out, Math.sin(localTime * .36) * .055);
      out.y += Math.sin(localTime * .72) * .085;
    }
  }

  colorParticle(index, time, localTime, colors) {
    const phase = this.phases[index];
    const shimmer = .64 + .36 * Math.sin(phase + time * 2.4);
    const offset = index * 3;
    const rotation = ((this.basePositions[offset] * .055
      + this.basePositions[offset + 1] * .11
      + localTime * .46
      + Math.sin(localTime * 1.8 + phase) * .07) % 1 + 1) % 1;
    const scaled = rotation * this.colorCycle.length;
    const colorIndex = Math.floor(scaled) % this.colorCycle.length;
    const from = this.colorCycle[colorIndex];
    const to = this.colorCycle[(colorIndex + 1) % this.colorCycle.length];
    const mix = scaled - colorIndex;
    const chromaPulse = .9 + .42 * (.5 + .5 * Math.sin(localTime * 4.2 + phase));
    colors[offset] = (from.r + (to.r - from.r) * mix) * shimmer * chromaPulse;
    colors[offset + 1] = (from.g + (to.g - from.g) * mix) * shimmer * chromaPulse;
    colors[offset + 2] = (from.b + (to.b - from.b) * mix) * shimmer * chromaPulse;
  }
}
