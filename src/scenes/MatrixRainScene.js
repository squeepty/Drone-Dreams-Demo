import { BaseDroneScene } from './BaseDroneScene.js';
import { lerp } from './math.js';

const LANE_WIDTH = 2;
const CODE_LUMENS = 2.3;
const HEAD_LUMENS = 2.65;
const BACKGROUND_LUMENS = .62;
const TAIL_GAMMA = .62;
const HEAD_GAMMA = .48;
const HEAD_SPAN = .018;

function hash(value) {
  return value - Math.floor(value);
}

function laneSeed(lane, salt = 0) {
  return hash(Math.sin((lane + 1) * 91.7 + salt * 53.1) * 43758.5453);
}

function particlePhase(column, row, localTime, grid) {
  const lane = Math.floor(column / LANE_WIDTH);
  const seed = laneSeed(lane);
  const speed = .085 + seed * .075;
  const rowOffset = (column % LANE_WIDTH) * .5;
  return hash((row + rowOffset) / grid.rows + localTime * speed + seed * .37);
}

function trailFalloff(distance, length) {
  if (distance > length) return 0;
  return Math.pow(1 - distance / length, TAIL_GAMMA);
}

export class MatrixRainScene extends BaseDroneScene {
  constructor({ count, palette, seeds, grid }) {
    super({
      id: 'matrix-rain',
      duration: 9.6,
      count,
      palette,
      pointSizeScale: .96,
      projection: '2d',
    });
    this.seeds = seeds;
    this.grid = grid;
  }

  targetPosition(index, time, localTime, out) {
    const column = index % this.grid.columns;
    const row = Math.floor(index / this.grid.columns) % this.grid.rows;
    const lane = Math.floor(column / LANE_WIDTH);
    const laneCenter = lane * LANE_WIDTH + (LANE_WIDTH - 1) * .5;
    const phase = particlePhase(column, row, localTime, this.grid);
    const jitter = (laneSeed(lane, row * .071) - .5) * this.grid.cellX * .22;

    out.set(
      (laneCenter - (this.grid.columns - 1) / 2) * this.grid.cellX + jitter,
      (.5 - phase) * this.grid.height,
      0,
    );
  }

  colorParticle(index, time, localTime, colors) {
    const column = index % this.grid.columns;
    const row = Math.floor(index / this.grid.columns) % this.grid.rows;
    const lane = Math.floor(column / LANE_WIDTH);
    const phase = particlePhase(column, row, localTime, this.grid);
    const primarySeed = laneSeed(lane, 1);
    const secondarySeed = laneSeed(lane, 2);
    const primaryHead = hash(primarySeed + localTime * (.11 + primarySeed * .12));
    const secondaryHead = hash(secondarySeed + localTime * (.07 + secondarySeed * .105));
    const primaryDistance = hash(primaryHead - phase);
    const secondaryDistance = hash(secondaryHead - phase);
    const primaryLength = .12 + primarySeed * .09;
    const secondaryLength = .08 + secondarySeed * .075;
    const primaryTail = trailFalloff(primaryDistance, primaryLength);
    const secondaryTail = trailFalloff(secondaryDistance, secondaryLength) * .82;
    const tail = Math.max(primaryTail, secondaryTail);
    const sparkleSeed = hash(Math.sin((lane + 1) * 63.7 + (row + 1) * 29.1 + Math.floor(localTime * 16) * 11.3) * 43758.5453);
    const dropout = sparkleSeed > .09 ? 1 : .18;
    const flicker = .88 + sparkleSeed * .42;
    const columnActivity = .55 + primarySeed * .45;
    const code = Math.min(1, tail * flicker * dropout * columnActivity);
    const headGlow = Math.pow(Math.max(
      primaryDistance <= HEAD_SPAN ? 1 - primaryDistance / HEAD_SPAN : 0,
      secondaryDistance <= HEAD_SPAN ? 1 - secondaryDistance / HEAD_SPAN : 0,
    ), HEAD_GAMMA);
    const offset = index * 3;
    const background = (.006 + hash(this.seeds[index] * 13.1) * .008) * BACKGROUND_LUMENS;

    let red = this.palette.jade.r * background;
    let green = this.palette.jade.g * background;
    let blue = this.palette.jade.b * background;
    red = lerp(red, this.palette.jade.r * flicker * CODE_LUMENS, code);
    green = lerp(green, this.palette.jade.g * flicker * CODE_LUMENS, code);
    blue = lerp(blue, this.palette.jade.b * flicker * CODE_LUMENS, code);
    red = lerp(red, this.palette.mint.r * CODE_LUMENS, code * .48);
    green = lerp(green, this.palette.mint.g * CODE_LUMENS, code * .48);
    blue = lerp(blue, this.palette.mint.b * CODE_LUMENS, code * .48);
    red = lerp(red, this.palette.gold.r * HEAD_LUMENS, headGlow);
    green = lerp(green, this.palette.gold.g * HEAD_LUMENS, headGlow);
    blue = lerp(blue, this.palette.gold.b * HEAD_LUMENS * .78, headGlow);
    red = lerp(red, this.palette.ivory.r * HEAD_LUMENS, headGlow * .22);
    green = lerp(green, this.palette.ivory.g * HEAD_LUMENS, headGlow * .22);
    blue = lerp(blue, this.palette.ivory.b * HEAD_LUMENS, headGlow * .22);
    colors[offset] = red;
    colors[offset + 1] = green;
    colors[offset + 2] = blue;
  }
}
