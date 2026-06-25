import { Vector3 } from 'three';
import { easeInOut, lerp } from './math.js';

// Every scene owns a frozen opening frame and an outgoing snapshot. The outgoing
// scene spends its final transition budget easing into the next scene's opening.
export class BaseDroneScene {
  constructor({
    id,
    duration,
    count,
    palette,
    transitionDuration = 3,
    pointSizeScale = .72,
    projection = '3d',
    cameraMode = 'static',
    viewportScale = 1.2,
    preserveIncomingColors = false,
    endDemo = false,
  }) {
    this.id = id;
    this.duration = duration;
    this.palette = palette;
    this.transitionDuration = transitionDuration;
    this.pointSizeScale = pointSizeScale;
    this.projection = projection;
    this.cameraMode = cameraMode;
    // The original formations were composed at a conservative scale. Spreading
    // their points here gives every scene a stronger, screen-filling presence
    // while preserving each scene's local drawing logic.
    this.viewportScale = viewportScale;
    this.preserveIncomingColors = preserveIncomingColors;
    this.endDemo = endDemo;
    this.count = count;
    this.startPositions = new Float32Array(count * 3);
    this.startColors = new Float32Array(count * 3);
    this.exitPositions = new Float32Array(count * 3);
    this.exitColors = new Float32Array(count * 3);
    this.transitionTarget = null;
    this.target = new Vector3();
  }

  enter(startTime, inheritedColors = null) {
    this.transitionTarget = null;
    this.beforeRender(startTime, 0);
    const usesInheritedColors = this.preserveIncomingColors && inheritedColors;

    if (usesInheritedColors) this.startColors.set(inheritedColors);

    for (let i = 0; i < this.count; i++) {
      const offset = i * 3;
      this.targetPosition(i, startTime, 0, this.target);
      this.target.multiplyScalar(this.viewportScale);
      this.startPositions[offset] = this.target.x;
      this.startPositions[offset + 1] = this.target.y;
      this.startPositions[offset + 2] = this.target.z;
      if (!usesInheritedColors) this.colorParticle(i, startTime, 0, this.startColors);
    }
  }

  captureExit(positions, colors) {
    this.exitPositions.set(positions);
    this.exitColors.set(colors);
  }

  transitionTo(scene) {
    this.transitionTarget = scene;
  }

  render({ time, localTime, positions, colors }) {
    const count = positions.length / 3;
    const transitionStart = this.duration - this.transitionDuration;
    const inTransition = this.transitionTarget && localTime >= transitionStart;

    if (inTransition) {
      const transition = easeInOut(Math.min(1, (localTime - transitionStart) / this.transitionDuration));
      for (let i = 0; i < count; i++) {
        const offset = i * 3;
        positions[offset] = lerp(this.exitPositions[offset], this.transitionTarget.startPositions[offset], transition);
        positions[offset + 1] = lerp(this.exitPositions[offset + 1], this.transitionTarget.startPositions[offset + 1], transition);
        positions[offset + 2] = lerp(this.exitPositions[offset + 2], this.transitionTarget.startPositions[offset + 2], transition);
        colors[offset] = lerp(this.exitColors[offset], this.transitionTarget.startColors[offset], transition);
        colors[offset + 1] = lerp(this.exitColors[offset + 1], this.transitionTarget.startColors[offset + 1], transition);
        colors[offset + 2] = lerp(this.exitColors[offset + 2], this.transitionTarget.startColors[offset + 2], transition);
      }
      return;
    }

    this.beforeRender(time, localTime);
    if (this.preserveIncomingColors) colors.set(this.startColors);

    for (let i = 0; i < count; i++) {
      const offset = i * 3;
      this.targetPosition(i, time, localTime, this.target);
      this.target.multiplyScalar(this.viewportScale);
      positions[offset] = this.target.x;
      positions[offset + 1] = this.target.y;
      positions[offset + 2] = this.target.z;
      if (!this.preserveIncomingColors) this.colorParticle(i, time, localTime, colors);
    }
  }

  setColor(colors, index, first, second, mix = 0) {
    const offset = index * 3;
    colors[offset] = lerp(first.r, second.r, mix);
    colors[offset + 1] = lerp(first.g, second.g, mix);
    colors[offset + 2] = lerp(first.b, second.b, mix);
  }

  targetPosition() {}
  colorParticle() {}
  beforeRender() {}
}
