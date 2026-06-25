import { BaseDroneScene } from './BaseDroneScene.js';
import { lerp } from './math.js';

function circleDistance(x, y, centerX, centerY, radius) {
  return Math.hypot(x - centerX, y - centerY) - radius;
}

function boxDistance(x, y, centerX, centerY, halfWidth, halfHeight) {
  return Math.max(Math.abs(x - centerX) - halfWidth, Math.abs(y - centerY) - halfHeight);
}

function softMask(distance, radius) {
  const amount = Math.max(0, Math.min(1, (radius - distance) / radius));
  return amount * amount * (3 - 2 * amount);
}

function pacmanDistance(x, y, pose) {
  const dx = x - pose.pacmanX;
  const dy = y - pose.pacmanY;
  const radialDistance = Math.hypot(dx, dy);
  const angle = Math.abs(Math.atan2(dy, dx));
  if (dx > -.24 && radialDistance > .56 && angle < pose.mouthAngle) return .72;
  return radialDistance - 2.76;
}

function ghostDistance(x, y, pose) {
  const head = circleDistance(x, y, pose.ghostX, pose.ghostY + .8, 2.68);
  const body = boxDistance(x, y, pose.ghostX, pose.ghostY - .92, 2.68, 1.96);
  let distance = Math.min(head, body);
  for (let lobe = -1; lobe <= 1; lobe++) {
    distance = Math.min(distance, circleDistance(x, y, pose.ghostX + lobe * 1.44, pose.ghostY - 2.84, .96));
  }
  return distance;
}

function pelletsDistance(x, y, pose) {
  let distance = Infinity;
  for (let pellet = 0; pellet < 11; pellet++) {
    const pelletX = -6.75 + pellet * 1.35;
    if (pelletX <= pose.pacmanX + .42 || pelletX >= pose.ghostX - .45) continue;
    distance = Math.min(distance, circleDistance(x, y, pelletX, -.31, .42));
  }
  return distance;
}

function buildChasePose(localTime) {
  const progress = Math.min(1, localTime / 6.6);
  const pacmanX = -13.15 + progress * 18;
  const ghostX = pacmanX + 8.7;
  return {
    pacmanX,
    pacmanY: -.31 + Math.sin(localTime * 4.5) * .045,
    ghostX,
    ghostY: -.28 + Math.sin(localTime * 5.3 + .6) * .1,
    mouthAngle: .2 + (.5 + .5 * Math.sin(localTime * 12)) * .24,
  };
}

export class PacChaseScene extends BaseDroneScene {
  constructor({ count, palette, seeds, grid }) {
    super({
      id: 'pac-chase',
      duration: 9.6,
      count,
      palette,
      pointSizeScale: .5,
      projection: '2d',
    });
    this.seeds = seeds;
    this.grid = grid;
    this.chase = buildChasePose(0);
  }

  beforeRender(time, localTime) {
    this.chase = buildChasePose(localTime);
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
    const pacman = softMask(pacmanDistance(x, y, this.chase), .16);
    const ghost = softMask(ghostDistance(x, y, this.chase), .16);
    const pellets = softMask(pelletsDistance(x, y, this.chase), .12);
    const pacmanEye = softMask(circleDistance(x, y, this.chase.pacmanX + .56, this.chase.pacmanY + 1.2, .3), .1) * pacman;
    const leftEye = softMask(circleDistance(x, y, this.chase.ghostX - .92, this.chase.ghostY + .84, .72), .16) * ghost;
    const rightEye = softMask(circleDistance(x, y, this.chase.ghostX + .92, this.chase.ghostY + .84, .72), .16) * ghost;
    const leftPupil = softMask(circleDistance(x, y, this.chase.ghostX - .64, this.chase.ghostY + .76, .3), .1) * leftEye;
    const rightPupil = softMask(circleDistance(x, y, this.chase.ghostX + 1.2, this.chase.ghostY + .76, .3), .1) * rightEye;
    const scan = .5 + .5 * Math.sin(row * .58 - localTime * 9 + this.seeds[index] * 5);
    const backgroundLevel = .085 + scan * .055;
    const ghostMix = .45 + .55 * Math.sin(localTime * 5 + row * .2);
    const offset = index * 3;

    let red = this.palette.blue.r * backgroundLevel;
    let green = this.palette.blue.g * backgroundLevel;
    let blue = this.palette.blue.b * backgroundLevel;
    red = lerp(red, this.palette.ivory.r, pellets);
    green = lerp(green, this.palette.ivory.g, pellets);
    blue = lerp(blue, this.palette.ivory.b, pellets);
    red = lerp(red, this.palette.gold.r, pacman);
    green = lerp(green, this.palette.gold.g, pacman);
    blue = lerp(blue, this.palette.gold.b, pacman);
    red = lerp(red, this.palette.crimson.r, ghost * (1 - ghostMix));
    green = lerp(green, this.palette.crimson.g, ghost * (1 - ghostMix));
    blue = lerp(blue, this.palette.crimson.b, ghost * (1 - ghostMix));
    red = lerp(red, this.palette.pink.r, ghost * ghostMix);
    green = lerp(green, this.palette.pink.g, ghost * ghostMix);
    blue = lerp(blue, this.palette.pink.b, ghost * ghostMix);
    red = lerp(red, this.palette.ivory.r, leftEye + rightEye);
    green = lerp(green, this.palette.ivory.g, leftEye + rightEye);
    blue = lerp(blue, this.palette.ivory.b, leftEye + rightEye);
    red = lerp(red, this.palette.blue.r, leftPupil + rightPupil);
    green = lerp(green, this.palette.blue.g, leftPupil + rightPupil);
    blue = lerp(blue, this.palette.blue.b, leftPupil + rightPupil);
    red = lerp(red, .02, pacmanEye);
    green = lerp(green, .02, pacmanEye);
    blue = lerp(blue, .02, pacmanEye);

    colors[offset] = red;
    colors[offset + 1] = green;
    colors[offset + 2] = blue;
  }
}
