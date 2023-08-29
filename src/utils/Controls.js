import * as THREE from "/modules/three.module.js";
import { OrbitControls } from "/modules/OrbitControls.js";
import { NoClipControls } from "/utils/NoClipControls.js";



function createControls(type, window, camera, document, renderer) {
    let controls;
  if (type == "noclip") {
    camera.position.set(0, 1, 4);
    controls = new NoClipControls(window, camera, document);
    controls.flySpeed = 50

  }
  if (type == "orbit") {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
  }
  return controls;
}

function updateControls(controls) {
  controls.update();
}

export {
  createControls,
  updateControls
};
