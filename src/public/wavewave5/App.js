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

//IT IS A CDN FROM THE SERVER
// import {CCapture} from '/modules/ccapture.module.js';
// let ccapture

//Recording set up
let recordSimulation = false;  
let frameCounter = 0;
let seconds = 15;  
let fps = 60;  
const maxFrames = seconds*fps;  
let recordingCompleted = false;



init();
animate();

function init() { 
    camera = createCamera();
    camera.position.y += 30
    camera.position.z -= 35
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

    if (recordSimulation) {
        if (frameCounter === 0) {
            recorder.start();
        }
    }

    const time = performance.now();
    controls.update(time, prevTime);
    game.update();
    renderer.render(scene, camera);
    
    if (recordSimulation) {
        recorder.capture(renderer.domElement);
    }

    prevTime = time;
    frameCounter++;

    if (recordSimulation && frameCounter >= maxFrames && !recordingCompleted) {
        recorder.stop();
        recorder.save();
        recordingCompleted = true;  // set the flag to true
    }
}