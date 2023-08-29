import * as THREE from '/modules/three.module.js';
import {
    createScene,
    createLights,
    createStats,
    createRenderer,
    createCamera,
    createStars,
  } from "/utils/threeUtils.js";
let camera, scene, renderer, lights, stats, stars
import {createControls, updateControls} from "/utils/Controls.js";
let controls

import {AxesHelper} from "/utils/AxesHelper.js";
let axesHelper


import {GridHelper} from "/utils/GridHelper.js";
let gridHelper


import {Element} from "./elements/Element.js";
let element

let prevTime = performance.now();


init();
animate();

function init() { 
    renderer = createRenderer(window, document);
    camera = createCamera();
    scene = createScene();
    lights = createLights(scene);
    stats = new createStats(document);
    controls = new createControls('noclip', window, camera, document, renderer);
    stars = createStars(scene)
    axesHelper = new AxesHelper(scene)
    gridHelper = new GridHelper(scene)
    
    element = new Element(scene)
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    controls.update(time, prevTime)

    element.update()

    renderer.render(scene, camera);
    prevTime = time;
}