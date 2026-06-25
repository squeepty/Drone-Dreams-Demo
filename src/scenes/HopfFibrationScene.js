import { BaseDroneScene } from './BaseDroneScene.js';
import { rotateX, rotateY, rotateZ } from './math.js';

const TAU = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const FIBERS = 48;
const SEGMENTS = 200;
export class HopfFibrationScene extends BaseDroneScene {
  constructor({ count, palette, seeds, groups }) {
    super({
      id: 'hopf-fibration',
      duration: 9.6,
      count,
      palette,
      pointSizeScale: .72,
      cameraMode: 'close',
      viewportScale: 1.35,
    });
    this.seeds = seeds;
    this.groups = groups;
    this.basePositions = new Float32Array(count * 3);
    this.phases = new Float32Array(count);
    this.buildFibers(count);
  }

  buildFibers(count) {
    for (let index = 0; index < count; index++) {
      const fiber = Math.floor(index / SEGMENTS) % FIBERS;
      const segment = index % SEGMENTS;
      const y = 1 - (fiber + .5) * 2 / FIBERS;
      const phi = fiber * GOLDEN_ANGLE + .42;
      const theta = Math.acos(Math.max(-.98, Math.min(.98, y * .94)));
      const eta = segment / (SEGMENTS - 1) * TAU + this.seeds[fiber] * TAU;
      const cosHalf = Math.cos(theta * .5);
      const sinHalf = Math.sin(theta * .5);
      const a = (phi + eta) * .5;
      const b = (phi - eta) * .5;
      const x1 = cosHalf * Math.cos(a);
      const x2 = cosHalf * Math.sin(a);
      const x3 = sinHalf * Math.cos(b);
      const x4 = sinHalf * Math.sin(b);
      const denominator = 1.18 - x4 * .92;
      const offset = index * 3;
      this.basePositions[offset] = x1 / denominator * 2.15;
      this.basePositions[offset + 1] = x2 / denominator * 2.15;
      this.basePositions[offset + 2] = x3 / denominator * 2.15;
      this.phases[index] = eta;
    }
  }

  targetPosition(index, time, localTime, out) {
    const offset = index * 3;
    const phase = this.phases[index];
    out.set(
      this.basePositions[offset] + Math.sin(phase * 2 + time * 1.4) * .035,
      this.basePositions[offset + 1] + Math.cos(phase * 1.6 + time * 1.1) * .035,
      this.basePositions[offset + 2] + Math.sin(phase * 2.4 - time * 1.3) * .035,
    );
    rotateX(out, -.42 + Math.sin(time * .28) * .16);
    rotateY(out, time * .26);
    rotateZ(out, .22 + Math.cos(time * .21) * .12);
    out.x += .52;
  }

  colorParticle(index, time, localTime, colors) {
    const shimmer = .5 + .5 * Math.sin(index * .17 + time * 2);
    this.setColor(colors, index, this.palette.violet, this.palette.cyan, shimmer);
    if (this.groups[index] === 0) {
      this.setColor(colors, index, this.palette.blue, this.palette.gold, .35 + .3 * shimmer);
    }
  }
}
