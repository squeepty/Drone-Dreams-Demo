import { BaseDroneScene } from './BaseDroneScene.js';
import { bitmapTextContains, bitmapTextWidth } from './bitmapFont.js';
import { lerp } from './math.js';

const CREDITS = [
  { text: 'INDOCHINE', centerY: 2.25, scale: .23, delay: .15, color: 'jade', core: 'mint' },
  { text: 'STATION 13', centerY: .05, scale: .2, delay: .9, color: 'gold' },
  { text: 'REMIX BY SQUEEPTY', centerY: -2.05, scale: .145, delay: 1.65, color: 'pink' },
].map((line) => ({
  ...line,
  width: bitmapTextWidth(line.text) * line.scale,
  height: 7 * line.scale,
}));

const CREDIT_LUMENS = 2.75;
const CREDIT_HOT_CORE = .18;
const BACKGROUND_LUMENS = 2.2;
const OUTRO_FADE_SECONDS = 8;
const OUTRO_FADE_END_PADDING = 2;

function clamp(value) {
  return Math.max(0, Math.min(1, value));
}

function lineContains(line, x, y) {
  return bitmapTextContains(
    line.text,
    x + line.width * .5,
    y - (line.centerY - line.height * .5),
    line.scale,
  );
}

export class OutroCreditsScene extends BaseDroneScene {
  constructor({ count, palette, seeds, grid }) {
    super({
      id: 'outro-credits',
      duration: 12.6,
      count,
      palette,
      pointSizeScale: .92,
      projection: '2d',
      viewportScale: 1.2,
      transitionDuration: 0,
      endDemo: true,
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
    const activeDuration = this.duration - this.transitionDuration;
    const fadeEnd = activeDuration - OUTRO_FADE_END_PADDING;
    const fadeStart = fadeEnd - OUTRO_FADE_SECONDS;
    const fadeIn = clamp(localTime / .55);
    const fadeOut = localTime > fadeStart
      ? clamp((fadeEnd - localTime) / OUTRO_FADE_SECONDS)
      : 1;
    const background = (.009 + this.seeds[index] * .014) * BACKGROUND_LUMENS;
    const scan = .5 + .5 * Math.sin(row * .62 - localTime * 7.5);
    const offset = index * 3;

    const screenFade = fadeIn * fadeOut;
    let red = this.palette.blue.r * background * screenFade;
    let green = this.palette.blue.g * background * screenFade;
    let blue = this.palette.blue.b * background * screenFade;

    for (const line of CREDITS) {
      const reveal = clamp((localTime - line.delay) / 1.15);
      if (!lineContains(line, x, y) || x > -line.width * .5 + line.width * reveal) continue;
      const color = this.palette[line.color];
      const coreColor = this.palette[line.core ?? line.color];
      const shimmer = 1.12 + .34 * Math.sin(column * .44 + localTime * 3.2 + line.centerY);
      const colorLift = 1 + scan * .58;
      const intensity = screenFade * shimmer;
      red = lerp(red, color.r * colorLift * CREDIT_LUMENS, intensity);
      green = lerp(green, color.g * colorLift * CREDIT_LUMENS, intensity);
      blue = lerp(blue, color.b * colorLift * CREDIT_LUMENS, intensity);
      red = lerp(red, coreColor.r * CREDIT_LUMENS, intensity * CREDIT_HOT_CORE);
      green = lerp(green, coreColor.g * CREDIT_LUMENS, intensity * CREDIT_HOT_CORE);
      blue = lerp(blue, coreColor.b * CREDIT_LUMENS, intensity * CREDIT_HOT_CORE);
    }

    colors[offset] = red;
    colors[offset + 1] = green;
    colors[offset + 2] = blue;
  }
}
