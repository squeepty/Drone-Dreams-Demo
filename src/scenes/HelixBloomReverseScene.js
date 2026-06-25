import { Vector3 } from 'three';
import { BaseDroneScene } from './BaseDroneScene.js';
import { easeInOut, rotateX, rotateY, rotateZ } from './math.js';

export class HelixBloomReverseScene extends BaseDroneScene {
  constructor({ count, palette, groups, grid }) {
    super({
      id: 'helix-bloom-reverse',
      duration: 9.6,
      count,
      palette,
      pointSizeScale: .62,
      projection: '2d',
      viewportScale: .85,
      preserveIncomingColors: true,
    });
    this.groups = groups;
    this.grid = grid;
    this.helix = new Vector3();
  }

  wavePoint(index, time, out) {
    const column = index % this.grid.columns;
    const row = Math.floor(index / this.grid.columns) % this.grid.rows;
    const x = (column - (this.grid.columns - 1) / 2) * this.grid.cellX;
    const y = (row - (this.grid.rows - 1) / 2) * this.grid.cellY;
    const radius = Math.hypot(x, y);
    out.set(
      x,
      y,
      Math.sin(x * 2.1 + time * 2.6) * .85
        + Math.cos(y * 2.8 - time * 2.1) * .65
        + Math.sin(radius * 3 - time * 3) * .28,
    );
    rotateY(out, time * .42);
    rotateX(out, Math.sin(time * .31) * .4);
    rotateZ(out, time * .25);
  }

  helixPoint(index, time, out) {
    const strand = index % 6;
    const progress = Math.floor(index / 6) / (this.count / 6);
    const angle = progress * Math.PI * 15 + strand * Math.PI / 3 + time * 1.9;
    const radius = 1.15 + .45 * Math.sin(progress * Math.PI * 8 + time * 2.2);
    out.set(Math.cos(angle) * radius, (progress - .5) * 13.2, Math.sin(angle) * radius);
    rotateZ(out, .38 + Math.sin(time * .25) * .16);
  }

  targetPosition(index, time, localTime, out) {
    const activeDuration = this.duration - this.transitionDuration;
    const reverseMorph = easeInOut(Math.min(1, localTime / activeDuration));
    this.wavePoint(index, time, out);
    this.helixPoint(index, time, this.helix);
    out.lerp(this.helix, reverseMorph);
    out.multiplyScalar(1.55 - reverseMorph * .57);
  }

  // Used only as a fallback when this scene is opened directly. During normal
  // playback BaseDroneScene preserves the outgoing text colors instead.
  colorParticle(index, time, localTime, colors) {
    const shimmer = .5 + .5 * Math.sin(index * .17 + time * 2);
    this.setColor(colors, index, this.palette.violet, this.palette.cyan, shimmer);
    if (this.groups[index] === 0) this.setColor(colors, index, this.palette.blue, this.palette.gold, .35 + .3 * shimmer);
  }
}
