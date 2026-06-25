import { BaseDroneScene } from './BaseDroneScene.js';
import { lerp, rotateX } from './math.js';

const STRANDS = 30;
const TAU = Math.PI * 2;

function hash(value) {
  const noise = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return noise - Math.floor(noise);
}

export class SpiralStrandsScene extends BaseDroneScene {
  constructor({ count, palette, seeds }) {
    super({
      id: 'spiral-strands',
      duration: 9.6,
      count,
      palette,
      pointSizeScale: .72,
      cameraMode: 'close',
      viewportScale: 1,
    });
    this.seeds = seeds;
  }

  targetPosition(index, time, localTime, out) {
    const strand = index % STRANDS;
    const local = Math.floor(index / STRANDS) / (this.count / STRANDS);
    const seed = this.seeds[index];
    const azimuthSeed = hash(index * .61803398875);
    const polarSeed = hash(index * 1.41421356237) * 2 - 1;
    const volumeSeed = hash(index * 2.2360679775);
    const sinPolar = Math.sqrt(Math.max(0, 1 - polarSeed * polarSeed));
    const cloudDepth = Math.pow(volumeSeed, .62);
    const sceneTime = localTime;
    const current = Math.sin(local * TAU * 3.2 + strand * .76 + sceneTime * 1.05) * (.18 + (1 - cloudDepth) * .38);
    const radius = .32 + cloudDepth * (4.8 + current);
    const angle = azimuthSeed * TAU + sceneTime * (.14 + (1 - cloudDepth) * .08) + current * .42;
    const lift = Math.sin(angle * 3.1 + polarSeed * 8 + sceneTime * .7) * (.14 + cloudDepth * .26);
    const horizontal = Math.cos(angle) * sinPolar * radius;
    // Keep the cloud wide on the left, but let high and low particles reach a
    // little farther into the right corners so the frame does not fall to black.
    const horizontalScale = horizontal < 0 ? 1.9 : 1.68;
    const verticalEdge = Math.pow(Math.abs(polarSeed), 1.7);
    const rightCornerFill = verticalEdge * cloudDepth * .72;

    out.set(
      horizontal * horizontalScale - .24 + rightCornerFill,
      polarSeed * radius * .84 + lift,
      Math.sin(angle) * sinPolar * radius + (seed - .5) * .34,
    );
    // Keep the asymmetric stage spread aligned to the viewport; rotating this
    // volume as a whole would turn its left plume into depth over time.
    rotateX(out, -.1 + Math.sin(sceneTime * .16) * .11);
  }

  colorParticle(index, time, localTime, colors) {
    const strand = index % STRANDS;
    const helixColors = [this.palette.violet, this.palette.blue, this.palette.cyan];
    const from = helixColors[strand % helixColors.length];
    const to = helixColors[(strand + 1) % helixColors.length];
    const mix = (strand / (STRANDS - 1)) % 1;
    const local = Math.floor(index / STRANDS) / (this.count / STRANDS);
    const sparkleWave = Math.max(0, Math.sin(
      local * 52 - time * 5.4 + strand * .83 + this.seeds[index] * 8,
    ));
    const sparkle = Math.pow(sparkleWave, 9);
    const sparkleMix = .5 + .5 * Math.sin(local * 7 + strand * .35 + time * 2.2);
    const offset = index * 3;
    let red = from.r + (to.r - from.r) * mix;
    let green = from.g + (to.g - from.g) * mix;
    let blue = from.b + (to.b - from.b) * mix;
    red = lerp(red, this.palette.pink.r, sparkle * (.72 + sparkleMix * .28));
    green = lerp(green, this.palette.pink.g, sparkle * (.72 + sparkleMix * .28));
    blue = lerp(blue, this.palette.pink.b, sparkle * (.72 + sparkleMix * .28));
    red = lerp(red, this.palette.ivory.r, sparkle * (.54 + (1 - sparkleMix) * .46));
    green = lerp(green, this.palette.ivory.g, sparkle * (.54 + (1 - sparkleMix) * .46));
    blue = lerp(blue, this.palette.ivory.b, sparkle * (.54 + (1 - sparkleMix) * .46));
    const glow = sparkle * (.8 + sparkleMix * .7);
    red += glow * .9;
    green += glow * .16;
    blue += glow * .56;
    colors[offset] = red;
    colors[offset + 1] = green;
    colors[offset + 2] = blue;
  }
}
