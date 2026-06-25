import { BaseDroneScene } from './BaseDroneScene.js';
import { lerp } from './math.js';

function clamp(value) {
  return Math.max(0, Math.min(1, value));
}

export class ReactionDiffusionScene extends BaseDroneScene {
  constructor({ count, palette, seeds, grid }) {
    super({
      id: 'reaction-diffusion',
      duration: 9.6,
      count,
      palette,
      pointSizeScale: .5,
      projection: '2d',
    });
    this.seeds = seeds;
    this.grid = grid;
    this.a = new Float32Array(count);
    this.b = new Float32Array(count);
    this.nextA = new Float32Array(count);
    this.nextB = new Float32Array(count);
    this.completedSteps = 0;
    this.resetSimulation();
  }

  enter(startTime) {
    this.resetSimulation();
    super.enter(startTime);
  }

  resetSimulation() {
    this.a.fill(1);
    this.b.fill(0);
    const { columns, rows } = this.grid;
    for (let spot = 0; spot < 58; spot++) {
      const source = (spot * 149) % this.seeds.length;
      const centerX = Math.floor(this.seeds[source] * columns);
      const centerY = Math.floor(this.seeds[(source + 419) % this.seeds.length] * rows);
      const radius = 1 + Math.floor(this.seeds[(source + 811) % this.seeds.length] * 4);
      for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
          if (x * x + y * y > radius * radius) continue;
          const column = (centerX + x + columns) % columns;
          const row = (centerY + y + rows) % rows;
          const index = row * columns + column;
          this.a[index] = .18;
          this.b[index] = .92;
        }
      }
    }
    for (let step = 0; step < 84; step++) this.stepSimulation();
    this.completedSteps = 0;
  }

  stepSimulation() {
    const { columns, rows } = this.grid;
    const feed = .045;
    const kill = .061;
    for (let row = 0; row < rows; row++) {
      const north = (row - 1 + rows) % rows;
      const south = (row + 1) % rows;
      for (let column = 0; column < columns; column++) {
        const west = (column - 1 + columns) % columns;
        const east = (column + 1) % columns;
        const index = row * columns + column;
        const left = row * columns + west;
        const right = row * columns + east;
        const up = north * columns + column;
        const down = south * columns + column;
        const upLeft = north * columns + west;
        const upRight = north * columns + east;
        const downLeft = south * columns + west;
        const downRight = south * columns + east;
        const laplaceA = this.a[left] * .2 + this.a[right] * .2 + this.a[up] * .2 + this.a[down] * .2
          + (this.a[upLeft] + this.a[upRight] + this.a[downLeft] + this.a[downRight]) * .05 - this.a[index];
        const laplaceB = this.b[left] * .2 + this.b[right] * .2 + this.b[up] * .2 + this.b[down] * .2
          + (this.b[upLeft] + this.b[upRight] + this.b[downLeft] + this.b[downRight]) * .05 - this.b[index];
        const reaction = this.a[index] * this.b[index] * this.b[index];
        this.nextA[index] = clamp(this.a[index] + laplaceA - reaction + feed * (1 - this.a[index]));
        this.nextB[index] = clamp(this.b[index] + laplaceB * .48 + reaction - (kill + feed) * this.b[index]);
      }
    }
    [this.a, this.nextA] = [this.nextA, this.a];
    [this.b, this.nextB] = [this.nextB, this.b];
  }

  beforeRender(time, localTime) {
    const targetSteps = Math.floor(localTime * 30);
    while (this.completedSteps < targetSteps) {
      this.stepSimulation();
      this.completedSteps++;
    }
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
    const right = row * this.grid.columns + (column + 1) % this.grid.columns;
    const below = ((row + 1) % this.grid.rows) * this.grid.columns + column;
    const chemical = this.b[index];
    const edge = Math.min(1, (Math.abs(chemical - this.b[right]) + Math.abs(chemical - this.b[below])) * 7);
    const cell = Math.min(1, chemical * 1.45);
    const offset = index * 3;
    const background = .025 + (this.seeds[index] * .018);

    let red = this.palette.blue.r * background;
    let green = this.palette.blue.g * background;
    let blue = this.palette.blue.b * background;
    red = lerp(red, this.palette.violet.r, cell * .62);
    green = lerp(green, this.palette.violet.g, cell * .62);
    blue = lerp(blue, this.palette.violet.b, cell * .62);
    red = lerp(red, this.palette.pink.r, edge);
    green = lerp(green, this.palette.pink.g, edge);
    blue = lerp(blue, this.palette.pink.b, edge);
    red = lerp(red, this.palette.ivory.r, edge * edge * .38);
    green = lerp(green, this.palette.ivory.g, edge * edge * .38);
    blue = lerp(blue, this.palette.ivory.b, edge * edge * .38);
    colors[offset] = red;
    colors[offset + 1] = green;
    colors[offset + 2] = blue;
  }
}
