import * as THREE from '/modules/three.module.js';
let prevTime = performance.now();

import {
    createScene,
    createLights,
    createStats,
    createRenderer,
    createCamera,
    createStars,
  } from "/utils/threeUtils.js";
let camera, scene, renderer, lights, stats, stars
let recorder

import {createControls, updateControls} from "/utils/Controls.js";
let controls

import {AxesHelper} from "/utils/AxesHelper.js";
let axesHelper


import {GridHelper} from "/utils/GridHelper.js";
let gridHelper


import {Game} from "./Game.js";
let game

console.log(CCapture)

let frameCounter = 0;
let seconds = 15;  // example value, capture for 4 seconds
let fps = 60;  // example value, capture at 60 frames per second
const maxFrames = seconds*fps;  // example value, capture for 4 seconds at 60fps
let recordingCompleted = false;
// Add the recording flag here
let recordSimulation = false;  // Set this to true if you want to record, false otherwise


init();
animate();

function init() { 
    camera = createCamera();
    camera.position.y += 120
    camera.position.z -= 120
    renderer = createRenderer(window, camera, document);
    renderer.shadowMap.enabled = true;
    scene = createScene();
    lights = createLights(scene);
    stats = new createStats(document);
    controls = new createControls('orbit', window, camera, document, renderer);
    stars = createStars(scene)
    axesHelper = new AxesHelper(scene)
    gridHelper = new GridHelper(scene)
    recorder = new CCapture({
        verbose: false,
        display: true,
        framerate: 60,
        quality: 100,
        format: 'webm',
        frameLimit: 0,
        autoSaveTime: 0
      });
    
    
    game = new Game(scene)
}

function animate() {
    requestAnimationFrame(animate);

    // Start capturing after initialization if recordSimulation is true
    if (recordSimulation) {
        if (frameCounter === 0) {
            recorder.start();
        }
    }

    const time = performance.now();
    controls.update(time, prevTime);
    game.update();
    renderer.render(scene, camera);
    
    // Capture the frame if recordSimulation is true
    if (recordSimulation) {
        recorder.capture(renderer.domElement);
    }

    prevTime = time;
    frameCounter++;

    // Stop capturing after maxFrames, save the video, and check the flag if recordSimulation is true
    if (recordSimulation && frameCounter >= maxFrames && !recordingCompleted) {
        recorder.stop();
        recorder.save();
        recordingCompleted = true;  // set the flag to true
    }
}