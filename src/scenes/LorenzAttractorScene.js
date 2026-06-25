import { BaseDroneScene } from './BaseDroneScene.js';
import { rotateX, rotateY, rotateZ } from './math.js';

const SIGMA = 10;
const RHO = 28;
const BETA = 8 / 3;
const DT = .006;
const TRAILS = 3;

function derivative(point) {
  return {
    x: SIGMA * (point.y - point.x),
    y: point.x * (RHO - point.z) - point.y,
    z: point.x * point.y - BETA * point.z,
  };
}

function rk4Step(point) {
  const k1 = derivative(point);
  const k2 = derivative({ x: point.x + k1.x * DT * .5, y: point.y + k1.y * DT * .5, z: point.z + k1.z * DT * .5 });
  const k3 = derivative({ x: point.x + k2.x * DT * .5, y: point.y + k2.y * DT * .5, z: point.z + k2.z * DT * .5 });
  const k4 = derivative({ x: point.x + k3.x * DT, y: point.y + k3.y * DT, z: point.z + k3.z * DT });
  return {
    x: point.x + DT / 6 * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: point.y + DT / 6 * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
    z: point.z + DT / 6 * (k1.z + 2 * k2.z + 2 * k3.z + k4.z),
  };
}

function helixColor(palette, progress) {
  const colors = [palette.violet, palette.cyan, palette.blue, palette.gold];
  const wrapped = ((progress % 1) + 1) % 1;
  const scaled = wrapped * colors.length;
  const index = Math.floor(scaled) % colors.length;
  return colors[index].clone().lerp(colors[(index + 1) % colors.length], scaled - index);
}

export class LorenzAttractorScene extends BaseDroneScene {
  constructor({ count, palette, seeds }) {
    super({
      id: 'lorenz-attractor',
      duration: 9.6,
      count,
      palette,
      pointSizeScale: .43,
      cameraMode: 'close',
      viewportScale: 1.3,
    });
    this.seeds = seeds;
    this.basePositions = new Float32Array(count * 3);
    this.baseColors = new Float32Array(count * 3);
    this.phases = new Float32Array(count);
    this.buildAttractor(count);
  }

  buildAttractor(count) {
    const pointsPerTrail = Math.floor(count / TRAILS);
    for (let trail = 0; trail < TRAILS; trail++) {
      let point = {
        x: .1 + this.seeds[trail * 97] * .45 + trail * .018,
        y: .1 + this.seeds[trail * 151 + 1] * .45 - trail * .014,
        z: .1 + this.seeds[trail * 223 + 2] * .45,
      };
      for (let step = 0; step < 650 + trail * 110; step++) point = rk4Step(point);

      for (let step = 0; step < pointsPerTrail; step++) {
        point = rk4Step(point);
        const index = trail * pointsPerTrail + step;
        const progress = step / Math.max(pointsPerTrail - 1, 1);
        const color = helixColor(this.palette, progress * .82 + trail * .19 + Math.sin(point.z * .05) * .035);
        const brightness = .78 + this.seeds[index] * .44;
        const offset = index * 3;
        this.basePositions[offset] = point.x * .112;
        this.basePositions[offset + 1] = (point.z - 25) * .106;
        this.basePositions[offset + 2] = point.y * .096;
        this.baseColors[offset] = color.r * brightness;
        this.baseColors[offset + 1] = color.g * brightness;
        this.baseColors[offset + 2] = color.b * brightness;
        this.phases[index] = progress * Math.PI * 8 + trail * 1.7;
      }
    }
  }

  targetPosition(index, time, localTime, out) {
    const offset = index * 3;
    const phase = this.phases[index];
    const shimmer = Math.sin(phase + time * 1.72);
    out.set(
      this.basePositions[offset] + shimmer * .04,
      this.basePositions[offset + 1] + Math.cos(phase * .7 + time * .38) * .032,
      this.basePositions[offset + 2] + Math.sin(phase * 1.2 - time * .5) * .036,
    );
    rotateX(out, -.08 + Math.sin(time * .13) * .08);
    rotateY(out, .48 + time * .52);
    rotateZ(out, -.03 + Math.cos(time * .1) * .025);
  }

  colorParticle(index, time, localTime, colors) {
    const offset = index * 3;
    const pulse = .8 + .2 * Math.abs(Math.sin(this.phases[index] + time * 1.7));
    colors[offset] = this.baseColors[offset] * pulse;
    colors[offset + 1] = this.baseColors[offset + 1] * pulse;
    colors[offset + 2] = this.baseColors[offset + 2] * pulse;
  }
}
