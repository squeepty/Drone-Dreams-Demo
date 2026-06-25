import * as THREE from 'three';
import { createScenes } from './scenes/index.js';
import soundtrackUrl from '../music/Station13_Remix_Squeepty.mp3';
import './style.css';

const canvas = document.querySelector('#stage');
const enterPanel = document.querySelector('#enter-panel');
const enterButton = document.querySelector('#enter-button');
const soundtrack = new Audio(soundtrackUrl);
soundtrack.preload = 'auto';
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const GRID = {
  columns: 120,
  rows: 80,
  width: 15,
  height: 9,
};
GRID.cellX = GRID.width / (GRID.columns - 1);
GRID.cellY = GRID.height / (GRID.rows - 1);
const COUNT = GRID.columns * GRID.rows;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x03050d, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x03050d, 0.028);
const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 150);
camera.position.set(0, 0, 19);

const background = new THREE.Mesh(
  new THREE.PlaneGeometry(90, 90),
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float uTime; varying vec2 vUv;
      void main(){ float horizon=pow(1.-abs(vUv.y-.48)*1.8, 2.); float scan=.035*sin(vUv.y*160.+uTime*1.4); vec3 c=mix(vec3(.006,.012,.035),vec3(.018,.035,.085),horizon+scan); gl_FragColor=vec4(c,1.); }`,
  }),
);
background.position.z = -28;
scene.add(background);

const BACKGROUND_STAR_COUNT = 2400;
const BACKGROUND_GALAXY_COUNT = 2400;
const BACKGROUND_DRONE_COUNT = BACKGROUND_STAR_COUNT + BACKGROUND_GALAXY_COUNT;
const OPENING_TITLE_SWEEP_SECONDS = 7.8;
const backgroundGeometry = new THREE.BufferGeometry();
const backgroundPositions = new Float32Array(BACKGROUND_DRONE_COUNT * 3);
const backgroundColors = new Float32Array(BACKGROUND_DRONE_COUNT * 3);
const backgroundSizes = new Float32Array(BACKGROUND_DRONE_COUNT);
const TAU = Math.PI * 2;
const starColors = [new THREE.Color('#3aa7ff'), new THREE.Color('#8f7cff'), new THREE.Color('#a4f3ff'), new THREE.Color('#fff3ca')];

for (let index = 0; index < BACKGROUND_DRONE_COUNT; index++) {
  const offset = index * 3;
  const color = starColors[Math.floor(Math.random() * starColors.length)];
  if (index < BACKGROUND_STAR_COUNT) {
    backgroundPositions[offset] = (Math.random() - .5) * 52;
    backgroundPositions[offset + 1] = (Math.random() - .5) * 32;
    backgroundPositions[offset + 2] = -18 - Math.random() * 16;
    backgroundSizes[index] = .28 + Math.pow(Math.random(), 2.4) * 1.45;
  } else {
    const galaxyPoint = index - BACKGROUND_STAR_COUNT;
    const galaxy = galaxyPoint % 2;
    const progress = Math.pow(Math.random(), .52);
    const arm = galaxyPoint % 3;
    const angle = progress * TAU * 2.65 + arm * TAU / 3 + galaxy * .42;
    const radius = .16 + progress * 5.9;
    const centerX = galaxy === 0 ? -14.5 : 14.5;
    const centerY = galaxy === 0 ? 6.4 : -6.4;
    backgroundPositions[offset] = centerX + Math.cos(angle) * radius * 1.45 + (Math.random() - .5) * .5;
    backgroundPositions[offset + 1] = centerY + Math.sin(angle) * radius * .54 + (Math.random() - .5) * .24;
    backgroundPositions[offset + 2] = -23 + (Math.random() - .5) * 1.6;
    backgroundSizes[index] = .8 + (1 - progress) * 2.35;
  }
  const intensity = index < BACKGROUND_STAR_COUNT
    ? .28 + Math.random() * .48
    : .66 + Math.random() * .56;
  backgroundColors[offset] = color.r * intensity;
  backgroundColors[offset + 1] = color.g * intensity;
  backgroundColors[offset + 2] = color.b * intensity;
}

backgroundGeometry.setAttribute('position', new THREE.BufferAttribute(backgroundPositions, 3));
backgroundGeometry.setAttribute('color', new THREE.BufferAttribute(backgroundColors, 3));
backgroundGeometry.setAttribute('aSize', new THREE.BufferAttribute(backgroundSizes, 1));

const backgroundDroneMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexColors: true,
  uniforms: { uTime: { value: 0 }, uIntensity: { value: 0.08 }, uSizeScale: { value: .7 }, uIdleMix: { value: 1 } },
  vertexShader: `attribute float aSize; varying vec3 vColor; varying float vTwinkle; uniform float uTime; uniform float uSizeScale;
    uniform float uIdleMix;
    void main(){ vec3 drifted=position; drifted.xy+=uIdleMix*vec2(sin(uTime*.18+position.y*.17),cos(uTime*.16+position.x*.13))*(.18+aSize*.035); vColor=color; vTwinkle=.68+.32*sin(uTime*1.8+position.x*2.1+position.y*3.7); vec4 mv=modelViewMatrix*vec4(drifted,1.); gl_PointSize=aSize*vTwinkle*(170./-mv.z)*uSizeScale; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform float uIntensity; varying vec3 vColor; varying float vTwinkle;
    void main(){ float distanceFromCenter=length(gl_PointCoord-.5); float core=smoothstep(.3,0.,distanceFromCenter); float halo=smoothstep(.5,.05,distanceFromCenter)*.34; float glow=core+halo; gl_FragColor=vec4(vColor*glow*(.72+uIntensity*.55), glow*vTwinkle*min(1.,uIntensity)); }`,
});
const backgroundDrones = new THREE.Points(backgroundGeometry, backgroundDroneMaterial);
backgroundDrones.frustumCulled = false;
scene.add(backgroundDrones);

const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(COUNT * 3);
const colors = new Float32Array(COUNT * 3);
const sizes = new Float32Array(COUNT);
const seeds = new Float32Array(COUNT);
const groups = new Uint8Array(COUNT);

for (let i = 0; i < COUNT; i++) {
  const progress = i / COUNT;
  const radius = Math.sqrt(progress) * 7;
  const angle = progress * Math.PI * 2 * 29;
  positions[i * 3] = Math.cos(angle) * radius;
  positions[i * 3 + 1] = Math.sin(angle) * radius;
  positions[i * 3 + 2] = (Math.random() - .5) * 4;
  seeds[i] = Math.random();
  sizes[i] = 1.4 + Math.pow(Math.random(), 2) * 3.9;
  groups[i] = Math.floor(Math.random() * 10);
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

const material = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexColors: true,
  uniforms: { uTime: { value: 0 }, uPulse: { value: 0 }, uSizeScale: { value: 1 } },
  vertexShader: `attribute float aSize; attribute float aSeed; varying vec3 vColor; varying float vPulse;
    uniform float uTime; uniform float uPulse; uniform float uSizeScale;
    void main(){ vColor=color; vPulse=.76+.24*sin(uTime*5.+aSeed*31.+uPulse*4.); vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=aSize*vPulse*(150./-mv.z)*uSizeScale; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vColor; varying float vPulse;
    void main(){ vec2 p=gl_PointCoord-.5; float d=length(p); float core=smoothstep(.24,0.,d); float halo=smoothstep(.5,.11,d)*.52; gl_FragColor=vec4(vColor*(core+halo*1.5), (core+halo)*vPulse); }`,
});
scene.add(new THREE.Points(geometry, material));

const openingTitleGeometry = new THREE.BufferGeometry();
const openingTitlePositions = new Float32Array(COUNT * 3);
const openingTitleColors = new Float32Array(COUNT * 3);
openingTitleGeometry.setAttribute('position', new THREE.BufferAttribute(openingTitlePositions, 3));
openingTitleGeometry.setAttribute('color', new THREE.BufferAttribute(openingTitleColors, 3));
openingTitleGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
openingTitleGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
const openingTitleMaterial = material.clone();
openingTitleMaterial.uniforms = THREE.UniformsUtils.clone(material.uniforms);
openingTitleMaterial.depthTest = false;
openingTitleMaterial.uniforms.uSizeScale.value = .52;
const openingTitleDrones = new THREE.Points(openingTitleGeometry, openingTitleMaterial);
openingTitleDrones.frustumCulled = false;
openingTitleDrones.renderOrder = 3;
openingTitleDrones.visible = false;
scene.add(openingTitleDrones);

const scenes = createScenes({ count: COUNT, seeds, groups, grid: GRID });
const requestedScene = Number(new URLSearchParams(window.location.search).get('scene'));
const directScenePreview = Number.isInteger(requestedScene) && requestedScene >= 1 && requestedScene <= scenes.length;
let activeSceneIndex = directScenePreview
  ? requestedScene - 1
  : 0;
let autoplay = !directScenePreview;
let elapsed = 0;
let sceneStartTime = 0;
let paused = !directScenePreview;
let started = directScenePreview;
let starting = false;
let outroFadeStartedAt = null;
let transitionPrepared = false;
let preparedSceneIndex = null;
let previewStartedAt = performance.now();
const openingTitleScene = scenes.find((scene) => scene.id === 'drone-dreams-text');

function pingPongTime(time, sweepSeconds) {
  return (1 - Math.cos((time / (sweepSeconds * 2)) * Math.PI * 2)) * .5 * sweepSeconds;
}

material.uniforms.uSizeScale.value = scenes[activeSceneIndex].pointSizeScale;
material.uniforms.uPulse.value = activeSceneIndex;
backgroundDroneMaterial.uniforms.uIntensity.value = .08;
backgroundDroneMaterial.uniforms.uSizeScale.value = .7;

function currentScene() {
  return scenes[activeSceneIndex];
}

function activateScene(index, startTime = elapsed) {
  activeSceneIndex = index;
  sceneStartTime = startTime;
  transitionPrepared = false;

  if (preparedSceneIndex !== index) currentScene().enter(startTime);
  preparedSceneIndex = null;
}

activateScene(activeSceneIndex, 0);
if (directScenePreview) enterPanel.classList.add('is-leaving');

function nextSceneIndex() {
  return (activeSceneIndex + 1) % scenes.length;
}

function prepareTransition() {
  const outgoing = currentScene();
  const transitionStart = outgoing.duration - outgoing.transitionDuration;

  // Render and freeze the outgoing scene at the exact moment its own transition
  // begins. The next scene is then prepared for its actual start time.
  outgoing.render({
    time: sceneStartTime + transitionStart,
    localTime: transitionStart,
    positions,
    colors,
  });
  outgoing.captureExit(positions, colors);

  const incomingIndex = nextSceneIndex();
  const incoming = scenes[incomingIndex];
  incoming.enter(sceneStartTime + outgoing.duration, outgoing.exitColors);
  outgoing.transitionTo(incoming);
  preparedSceneIndex = incomingIndex;
  transitionPrepared = true;
}

function advanceScene() {
  const outgoing = currentScene();
  const incomingIndex = nextSceneIndex();
  activateScene(incomingIndex, sceneStartTime + outgoing.duration);
}

function enterDemo() {
  if (started || starting) return;

  starting = true;
  enterButton.disabled = true;
  soundtrack.currentTime = 0;

  // Keep this play request inside the click handler: browsers only permit audio
  // playback after a direct user gesture.
  soundtrack.play().then(() => {
    elapsed = 0;
    sceneStartTime = 0;
    outroFadeStartedAt = null;
    activateScene(0, 0);
    paused = false;
    started = true;
    enterPanel.classList.add('is-leaving');
  }).catch(() => {
    starting = false;
    enterButton.disabled = false;
  });
}

enterButton.addEventListener('click', enterDemo);

soundtrack.addEventListener('ended', () => {
  if (currentScene().endDemo) outroFadeStartedAt = performance.now();
  else paused = true;
});

function updateCamera(localTime) {
  const active = currentScene();
  if (active.cameraMode === 'close') {
    const cameraY = Math.sin(elapsed * .38) * .18;
    camera.position.x += (0 - camera.position.x) * .03;
    camera.position.y += (cameraY - camera.position.y) * .03;
    camera.position.z += (10.8 - camera.position.z) * .04;
    camera.lookAt(0, .1, 0);
    return;
  }

  const screen = active.projection === '2d';
  const cameraY = Math.sin(elapsed * (screen ? .5 : .32)) * (screen ? .09 : .05);
  const cameraZ = screen ? 14.5 : 18.2;
  camera.position.x += (0 - camera.position.x) * .03;
  camera.position.y += (cameraY - camera.position.y) * .03;
  camera.position.z += (cameraZ - camera.position.z) * .035;
  camera.lookAt(0, .2, 0);
}

function updateIdleCamera(time) {
  const motionTime = time * (prefersReducedMotion ? .24 : 1);
  const cameraX = Math.sin(motionTime * .16) * .58;
  const cameraY = Math.cos(motionTime * .13) * .28;
  const cameraZ = 8.6 + Math.sin(motionTime * .1) * .28;
  camera.position.x += (cameraX - camera.position.x) * .045;
  camera.position.y += (cameraY - camera.position.y) * .045;
  camera.position.z += (cameraZ - camera.position.z) * .05;
  camera.lookAt(.35, 0, 0);
}

function animate() {
  requestAnimationFrame(animate);
  const runtime = performance.now() / 1000;
  if (directScenePreview) {
    elapsed = sceneStartTime + ((performance.now() - previewStartedAt) / 1000) % currentScene().duration;
  } else if (started && !paused) {
    elapsed = outroFadeStartedAt === null
      ? soundtrack.currentTime
      : soundtrack.duration + (performance.now() - outroFadeStartedAt) / 1000;
  }

  let localTime = elapsed - sceneStartTime;
  while (autoplay && localTime >= currentScene().duration) {
    if (currentScene().endDemo) {
      elapsed = sceneStartTime + currentScene().duration;
      localTime = currentScene().duration;
      autoplay = false;
      paused = true;
      soundtrack.pause();
      break;
    }
    advanceScene();
    localTime = elapsed - sceneStartTime;
  }

  if (autoplay
    && currentScene().transitionDuration > 0
    && !transitionPrepared
    && localTime >= currentScene().duration - currentScene().transitionDuration) {
    prepareTransition();
  }

  if (started) currentScene().render({ time: elapsed, localTime, positions, colors });
  else colors.fill(0);

  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;
  material.uniforms.uTime.value = started ? elapsed : runtime;

  const showOpeningTitle = !started && openingTitleScene;
  openingTitleDrones.visible = Boolean(showOpeningTitle);
  if (showOpeningTitle) {
    const titleTime = runtime * (prefersReducedMotion ? .38 : .92);
    const titleLocalTime = pingPongTime(titleTime, OPENING_TITLE_SWEEP_SECONDS);
    const titleScale = Math.min(.68, Math.max(.2, camera.aspect * .41));
    openingTitleScene.render({
      time: titleTime,
      localTime: titleLocalTime,
      positions: openingTitlePositions,
      colors: openingTitleColors,
    });
    for (let i = 0; i < openingTitleColors.length; i++) openingTitleColors[i] *= .82;
    openingTitleDrones.scale.setScalar(titleScale);
    openingTitleDrones.position.x = camera.aspect < .72 ? .08 : .42;
    openingTitleDrones.position.y = camera.aspect < .72 ? .78 : 1.16;
    openingTitleGeometry.attributes.position.needsUpdate = true;
    openingTitleGeometry.attributes.color.needsUpdate = true;
    openingTitleMaterial.uniforms.uTime.value = titleTime;
    openingTitleMaterial.uniforms.uPulse.value = 11;
    openingTitleMaterial.uniforms.uSizeScale.value = .43;
  }

  const transitionStart = currentScene().duration - currentScene().transitionDuration;
  const rawTransition = transitionPrepared
    ? Math.min(1, (localTime - transitionStart) / currentScene().transitionDuration)
    : 0;
  const visualTransition = rawTransition * rawTransition * (3 - 2 * rawTransition);
  const incoming = transitionPrepared ? scenes[nextSceneIndex()] : currentScene();
  material.uniforms.uPulse.value = started
    ? activeSceneIndex + (nextSceneIndex() - activeSceneIndex) * visualTransition
    : 0;
  material.uniforms.uSizeScale.value = started
    ? currentScene().pointSizeScale + (incoming.pointSizeScale - currentScene().pointSizeScale) * visualTransition
    : .86;
  const visualTime = started ? elapsed : runtime;
  const showDemoBackground = started;
  background.visible = showDemoBackground;
  backgroundDrones.visible = showDemoBackground;
  renderer.setClearColor(started ? 0x03050d : 0x000000, 1);
  backgroundDroneMaterial.uniforms.uIntensity.value = started ? .08 : .18;
  backgroundDroneMaterial.uniforms.uSizeScale.value = started ? .7 : .74;
  backgroundDroneMaterial.uniforms.uIdleMix.value = started ? 0 : .24;
  background.material.uniforms.uTime.value = visualTime;
  backgroundDroneMaterial.uniforms.uTime.value = visualTime;
  backgroundDrones.rotation.z = Math.sin(visualTime * .035) * .035;
  if (started) updateCamera(localTime);
  else updateIdleCamera(runtime);
  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
});

animate();
