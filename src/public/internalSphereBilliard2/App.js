import * as THREE from "/modules/three.module.js";
let prevTime = performance.now();

import {
  createScene,
  createLights,
  createStats,
  createRenderer,
  createCamera,
  createStars,
} from "/utils/threeUtils.js";
let camera, scene, renderer, lights, stats, stars;

let lastTime = 0;

import { createControls, updateControls } from "/utils/Controls.js";
let controls;

import { AxesHelper } from "/utils/AxesHelper.js";
let axesHelper;

import { GridHelper } from "/utils/GridHelper.js";
let gridHelper;

import { Game } from "./Game.js";
let game;

init();
animate();

function init() {
  camera = createCamera();
  renderer = createRenderer(window, camera, document);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Optional: for softer shadows
  scene = createScene();
  lights = createLights(scene);
  stats = new createStats(document);
  controls = new createControls("orbit", window, camera, document, renderer);
  stars = createStars(scene);
  axesHelper = new AxesHelper(scene);
  gridHelper = new GridHelper(scene);

  game = new Game(scene);
}

function animate() {
  requestAnimationFrame(animate);
  let time = performance.now();
  controls.update(time, prevTime);

  // Convert time to seconds
  time *= 0.001; // Convert to seconds
  const deltaTime = time - lastTime;
  lastTime = time;
  
  game.update(deltaTime);

  renderer.render(scene, camera);
  prevTime = time;
}
