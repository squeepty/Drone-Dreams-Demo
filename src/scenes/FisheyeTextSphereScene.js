import { BaseDroneScene } from './BaseDroneScene.js';
import { lerp, rotateY } from './math.js';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const RADIUS = 3.35;

export class FisheyeTextSphereScene extends BaseDroneScene {
  constructor({ count, palette, seeds }) {
    super({
      id: 'scrolling-text-sphere',
      duration: 9.6,
      count,
      palette,
      pointSizeScale: .76,
      cameraMode: 'close',
      viewportScale: 1.16,
    });
    this.seeds = seeds;
    this.latitudes = new Float32Array(count);
    this.longitudes = new Float32Array(count);
    for (let index = 0; index < count; index++) {
      this.latitudes[index] = Math.asin(1 - (index + .5) * 2 / count);
      this.longitudes[index] = index * GOLDEN_ANGLE;
    }
  }

  targetPosition(index, time, localTime, out) {
    const latitude = this.latitudes[index];
    const longitude = this.longitudes[index];
    const radiusAtLatitude = Math.cos(latitude) * RADIUS;
    out.set(
      Math.cos(longitude) * radiusAtLatitude,
      Math.sin(latitude) * RADIUS,
      Math.sin(longitude) * radiusAtLatitude,
    );
    rotateY(out, time * .18);
    out.x -= .38;
  }

  colorParticle(index, time, localTime, colors) {
    const latitude = this.latitudes[index];
    const longitude = this.longitudes[index] - time * .18;
    const front = Math.max(0, Math.sin(longitude) * Math.cos(latitude));
    const longitudeTile = Math.floor((longitude + Math.PI) * 8);
    const latitudeTile = Math.floor((latitude + Math.PI * .5) * 9);
    const tileLight = (longitudeTile + latitudeTile) % 2 === 0 ? .82 : .36;
    const reflection = .22 + .78 * Math.max(0, Math.sin(longitude * 2.3 - latitude * 1.7 + time * .7));
    const sparkleWave = Math.max(0, Math.sin(
      longitude * 18.7 + latitude * 27.4 - time * 4.2 + this.seeds[index] * 31,
    ));
    const sparkle = Math.pow(sparkleWave, 18) * (.2 + front * .8);
    const sparkleMix = .5 + .5 * Math.sin(longitude * 4.2 + latitude * 2.6 + time * 2.1);
    const offset = index * 3;
    const surface = .035 + front * (.11 + tileLight * reflection * .16);
    let red = this.palette.blue.r * surface;
    let green = this.palette.blue.g * surface;
    let blue = this.palette.blue.b * surface;
    const coolHighlight = front * (.08 + tileLight * reflection * .24);
    red = lerp(red, this.palette.cyan.r, coolHighlight);
    green = lerp(green, this.palette.cyan.g, coolHighlight);
    blue = lerp(blue, this.palette.cyan.b, coolHighlight);
    red = lerp(red, this.palette.pink.r, sparkle * (.35 + sparkleMix * .5));
    green = lerp(green, this.palette.pink.g, sparkle * (.35 + sparkleMix * .5));
    blue = lerp(blue, this.palette.pink.b, sparkle * (.35 + sparkleMix * .5));
    red = lerp(red, this.palette.ivory.r, sparkle * front * (.25 + (1 - sparkleMix) * .7));
    green = lerp(green, this.palette.ivory.g, sparkle * front * (.25 + (1 - sparkleMix) * .7));
    blue = lerp(blue, this.palette.ivory.b, sparkle * front * (.25 + (1 - sparkleMix) * .7));
    colors[offset] = red;
    colors[offset + 1] = green;
    colors[offset + 2] = blue;
  }
}
