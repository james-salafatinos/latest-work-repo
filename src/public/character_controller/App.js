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
  scene = createScene();
  lights = createLights(scene);
  stats = new createStats(document);
  controls = new createControls("orbit", window, camera, document, renderer);
  stars = createStars(scene);
  axesHelper = new AxesHelper(scene);
  gridHelper = new GridHelper(scene);

  game = new Game(scene, camera, controls);
}



function animate() {
  requestAnimationFrame(animate);

  const time = performance.now(); // Get current time
  const timeElapsed = time - prevTime; // Calculate the time elapsed since the last frame
  const timeElapsedS = timeElapsed * 0.001; // Convert to seconds if needed

  // Assuming controls.update can take a delta time in seconds,
  // but if it expects milliseconds, just pass timeElapsed
  controls.update(timeElapsedS);

  game.update(timeElapsedS); // Make sure any time-based logic in game.update() considers timeElapsedS if needed

  renderer.render(scene, camera);

  prevTime = time; // Update prevTime for the next frame
}
