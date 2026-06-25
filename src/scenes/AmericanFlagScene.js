import { BaseDroneScene } from './BaseDroneScene.js';
import { lerp } from './math.js';

const FLAG_WIDTH = 13.8;
const FLAG_HEIGHT = 7.3;
const FLAG_LEFT = -FLAG_WIDTH / 2;
const FLAG_TOP = FLAG_HEIGHT / 2;
const CANTON_RIGHT = -1.38;
const CANTON_BOTTOM = -.28;

function circleDistance(x, y, centerX, centerY, radius) {
  return Math.hypot(x - centerX, y - centerY) - radius;
}

function rectangleDistance(x, y, centerX, centerY, halfWidth, halfHeight) {
  return Math.max(Math.abs(x - centerX) - halfWidth, Math.abs(y - centerY) - halfHeight);
}

function softMask(distance, radius) {
  const amount = Math.max(0, Math.min(1, (radius - distance) / radius));
  return amount * amount * (3 - 2 * amount);
}

function starsDistance(x, y) {
  let distance = Infinity;
  for (let row = 0; row < 9; row++) {
    const count = row % 2 === 0 ? 6 : 5;
    const starY = FLAG_TOP - .3 - row * .37;
    const startX = FLAG_LEFT + (row % 2 === 0 ? .42 : .86);
    const spacing = row % 2 === 0 ? .89 : 1.05;
    for (let column = 0; column < count; column++) {
      distance = Math.min(distance, circleDistance(x, y, startX + column * spacing, starY, .105));
    }
  }
  return distance;
}

export class AmericanFlagScene extends BaseDroneScene {
  constructor({ count, palette, seeds, grid }) {
    super({
      id: 'american-flag',
      duration: 9.6,
      count,
      palette,
      pointSizeScale: .5,
      projection: '2d',
      viewportScale: 1.28,
    });
    this.seeds = seeds;
    this.grid = grid;
  }

  targetPosition(index, time, localTime, out) {
    const column = index % this.grid.columns;
    const row = Math.floor(index / this.grid.columns) % this.grid.rows;
    out.set(
      (column - (this.grid.columns - 1) / 2) * this.grid.cellX,
      (row - (this.grid.rows - 1) / 2) * this.grid.cellY,
      0,
    );
  }

  colorParticle(index, time, localTime, colors) {
    const column = index % this.grid.columns;
    const row = Math.floor(index / this.grid.columns) % this.grid.rows;
    const x = (column - (this.grid.columns - 1) / 2) * this.grid.cellX;
    const y = (row - (this.grid.rows - 1) / 2) * this.grid.cellY;
    const wave = Math.sin((x - FLAG_LEFT) * 1.35 - localTime * 4.4) * .21
      + Math.sin((x - FLAG_LEFT) * 2.2 - localTime * 3.1) * .08;
    const wavedY = y + wave;
    const flag = softMask(rectangleDistance(x, y, 0, 0, FLAG_WIDTH / 2, FLAG_HEIGHT / 2), .09);
    const stripe = Math.floor((FLAG_TOP - wavedY) / (FLAG_HEIGHT / 13));
    const isRed = stripe % 2 === 0;
    const canton = x < CANTON_RIGHT && wavedY > CANTON_BOTTOM;
    const stars = canton ? softMask(starsDistance(x, wavedY), .06) : 0;
    const scan = .5 + .5 * Math.sin(row * .61 - localTime * 8 + this.seeds[index] * 5);
    const light = .76 + .24 * Math.sin((x - FLAG_LEFT) * 1.6 - localTime * 4.4);
    const offset = index * 3;

    let red = this.palette.blue.r * (.055 + scan * .03);
    let green = this.palette.blue.g * (.055 + scan * .03);
    let blue = this.palette.blue.b * (.055 + scan * .03);
    const fieldColor = canton
      ? this.palette.blue
      : isRed
        ? this.palette.crimson
        : this.palette.ivory;
    red = lerp(red, fieldColor.r * light, flag);
    green = lerp(green, fieldColor.g * light, flag);
    blue = lerp(blue, fieldColor.b * light, flag);
    red = lerp(red, this.palette.ivory.r, stars);
    green = lerp(green, this.palette.ivory.g, stars);
    blue = lerp(blue, this.palette.ivory.b, stars);
    colors[offset] = red;
    colors[offset + 1] = green;
    colors[offset + 2] = blue;
  }
}
