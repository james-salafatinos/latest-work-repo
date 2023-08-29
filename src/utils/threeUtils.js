import * as THREE from "/modules/three.module.js";
import Stats from "/modules/stats.module.js";
import { GUI } from "/modules/dat.gui.module.js";


function createRenderer(window, document) {
  let renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.body.appendChild(renderer.domElement);
  return renderer;
}

function createCamera() {
  let camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(5, 1, 1);
  return camera;
}


function createScene() {
  let scene = new THREE.Scene();
  const loader = new THREE.TextureLoader();
  scene.background = new THREE.Color(0x00000);
  scene.fog = new THREE.Fog(0x102234, 1000, 2000);
  return scene;
}

function createLights(scene) {
  const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
  light.position.set(0.5, 1, 0.75);
  scene.add(light);
  return light;
}

function createStats(document) {
  let stats = new Stats();
  stats.domElement.style.cssText = "position:absolute;top:0px;right:0px;";
  document.body.appendChild(stats.dom);
  return stats;
}

let createStars = function (scene) {
  let M = 28
  let N = 28
  let scaler = 10;
  let vertices = [];
  let spacing_scale = 50
  for (let x = -M; x <= M; x += 1) {
      for (let z = -N; z <= N; z += 1) {
          // vertices.push(x / scaler, 0 / scaler, z / scaler)
          vertices.push(
              THREE.MathUtils.randFloatSpread(2000),
              THREE.MathUtils.randFloatSpread(2000),
              THREE.MathUtils.randFloatSpread(2000))
      }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  let material = new THREE.PointsMaterial({ size: .7, sizeAttenuation: true, alphaTest: 0.2, transparent: true });
  material.color.setHSL(.6, 0.8, 0.9);
  const particles = new THREE.Points(geometry, material);
  scene.add(particles);
  return particles
}


export {
  createScene,
  createLights,
  createStats,
  createRenderer,
  createCamera,
  createStars,

};
