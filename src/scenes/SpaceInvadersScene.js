import { BaseDroneScene } from './BaseDroneScene.js';
import { lerp } from './math.js';

const ALIENS = [
  [
    '00111100',
    '01111110',
    '11011011',
    '11111111',
    '00100100',
    '01000010',
    '10100101',
  ],
  [
    '00100100',
    '10011001',
    '10111101',
    '11111111',
    '00111100',
    '01011010',
    '10000001',
  ],
  [
    '00011000',
    '00111100',
    '01111110',
    '11011011',
    '11111111',
    '00100100',
    '01000010',
  ],
];

const PLAYER = [
  '000010000',
  '000111000',
  '001111100',
  '011111110',
  '111111111',
  '001101100',
];

function spriteContains(x, y, centerX, centerY, sprite, pixel) {
  const width = sprite[0].length;
  const height = sprite.length;
  const column = Math.floor((x - (centerX - width * pixel / 2)) / pixel);
  const row = Math.floor(((centerY + height * pixel / 2) - y) / pixel);
  return row >= 0 && row < height && column >= 0 && column < width && sprite[row][column] === '1';
}

export class SpaceInvadersScene extends BaseDroneScene {
  constructor({ count, palette, seeds, grid }) {
    super({
      id: 'space-invaders',
      duration: 9.6,
      count,
      palette,
      pointSizeScale: .5,
      projection: '2d',
      viewportScale: 1.22,
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
    const fleetX = Math.sin(localTime * 1.5) * .88;
    const fleetY = 3.55 - localTime * .1;
    const left = fleetX - 4.85;
    const top = fleetY;
    const alienColumn = Math.round((x - left) / 1.22);
    const alienRow = Math.round((top - y) / .86);
    const alienX = left + alienColumn * 1.22;
    const alienY = top - alienRow * .86;
    const isAlien = alienColumn >= 0 && alienColumn < 9 && alienRow >= 0 && alienRow < 5
      && spriteContains(x, y, alienX, alienY, ALIENS[alienRow % ALIENS.length], .115);
    const shipX = Math.sin(localTime * 1.85) * 3.15;
    const shipY = -3.45;
    const isShip = spriteContains(x, y, shipX, shipY, PLAYER, .13);
    const laserY = -2.85 + (localTime * 3.2 % 1) * 6.65;
    const laser = Math.abs(x - shipX) < .065 && Math.abs(y - laserY) < .34;
    const bombX = fleetX + Math.sin(localTime * 2.3) * 2.1;
    const bombY = fleetY - 1.2 - (localTime * 1.45 % 1) * 5.8;
    const bomb = Math.abs(x - bombX) < .07 && Math.abs(y - bombY) < .28;
    const star = this.seeds[index] > .974 && !isAlien && !isShip;
    const offset = index * 3;

    let red = this.palette.blue.r * .035;
    let green = this.palette.blue.g * .035;
    let blue = this.palette.blue.b * .035;
    if (star) {
      red = this.palette.blue.r * .38;
      green = this.palette.blue.g * .38;
      blue = this.palette.blue.b * .38;
    }
    if (isAlien) {
      const tone = alienRow % 3;
      const alienColor = tone === 0 ? this.palette.pink : tone === 1 ? this.palette.mint : this.palette.gold;
      red = alienColor.r;
      green = alienColor.g;
      blue = alienColor.b;
    }
    if (isShip) {
      red = this.palette.cyan.r;
      green = this.palette.cyan.g;
      blue = this.palette.cyan.b;
    }
    if (laser) {
      red = this.palette.ivory.r;
      green = this.palette.ivory.g;
      blue = this.palette.ivory.b;
    }
    if (bomb) {
      red = lerp(this.palette.ember.r, this.palette.crimson.r, .5);
      green = lerp(this.palette.ember.g, this.palette.crimson.g, .5);
      blue = lerp(this.palette.ember.b, this.palette.crimson.b, .5);
    }
    colors[offset] = red;
    colors[offset + 1] = green;
    colors[offset + 2] = blue;
  }
}
