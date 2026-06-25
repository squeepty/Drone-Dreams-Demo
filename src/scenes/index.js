import { AmericanFlagScene } from './AmericanFlagScene.js';
import { DroneDreamsTextScene } from './DroneDreamsTextScene.js';
import { FisheyeTextSphereScene } from './FisheyeTextSphereScene.js';
import { HelixBloomScene } from './HelixBloomScene.js';
import { HelixBloomReverseScene } from './HelixBloomReverseScene.js';
import { HopfFibrationScene } from './HopfFibrationScene.js';
import { LorenzAttractorScene } from './LorenzAttractorScene.js';
import { MatrixRainScene } from './MatrixRainScene.js';
import { OutroCreditsScene } from './OutroCreditsScene.js';
import { PacChaseScene } from './PacChaseScene.js';
import { palette } from './palette.js';
import { ReactionDiffusionScene } from './ReactionDiffusionScene.js';
import { SpiralStrandsScene } from './SpiralStrandsScene.js';
import { SpaceInvadersScene } from './SpaceInvadersScene.js';

export function createScenes({ count, seeds, groups, grid }) {
  return [
    new HelixBloomScene({ count, palette, groups, grid }),
    new AmericanFlagScene({ count, palette, seeds, grid }),
    new SpiralStrandsScene({ count, palette, seeds }),
    new PacChaseScene({ count, palette, seeds, grid }),
    new LorenzAttractorScene({ count, palette, seeds }),
    new ReactionDiffusionScene({ count, palette, seeds, grid }),
    new HopfFibrationScene({ count, palette, seeds, groups }),
    new MatrixRainScene({ count, palette, seeds, grid }),
    new FisheyeTextSphereScene({ count, palette, seeds }),
    new SpaceInvadersScene({ count, palette, seeds, grid }),
    new DroneDreamsTextScene({ count, palette, seeds }),
    new HelixBloomReverseScene({ count, palette, groups, grid }),
    new HelixBloomScene({ count, palette, groups, grid }),
    new OutroCreditsScene({ count, palette, seeds, grid }),
  ];
}
