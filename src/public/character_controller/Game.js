import * as THREE from "/modules/three.module.js";
import { GLTFLoader } from "/modules/GLTFLoader.js";
import { BasicCharacterController } from "./CharacterController.js";
import { PickableBlock } from "./PickableBlock.js";

class Game {
  constructor(scene, camera, controls) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this._characterControls = null;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.intersectedObject = null;

    this.create();
    this.addEventListeners();
  }

  _LoadCharacterController() {
    const params = {
      camera: this.camera,
      scene: this.scene,
    };
    this._characterControls = new BasicCharacterController(params);
  }

  addEventListeners() {
    window.addEventListener("mousemove", (event) => {
      // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener("click", () => {
      if (
        this.intersectedObject &&
        this.intersectedObject.userData.isPickable
      ) {
        this.intersectedObject.userData.onClick();
      }
    });
  }

  create() {
    this._LoadCharacterController();
    console.log(this.controls);

    this.pb = new PickableBlock(this.scene);
  }

  handleRaycastInteractions() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true
    );

    if (
      this.intersectedObject &&
      (!intersects.length || this.intersectedObject !== intersects[0].object)
    ) {
      if (this.intersectedObject.userData.isPickable) {
        this.intersectedObject.userData.onHoverOut();
      }
      this.intersectedObject = null;
    }

    if (intersects.length > 0) {
      const firstIntersectedObject = intersects.find(
        (intersect) => intersect.object.userData.isPickable
      );
      if (
        firstIntersectedObject &&
        firstIntersectedObject.object !== this.intersectedObject
      ) {
        this.intersectedObject = firstIntersectedObject.object;
        this.intersectedObject.userData.onHover();
      }
    }
  }

  handle3rdPersonView() {
    // Update camera position for third-person view
    this.camera.position.copy(
      this._characterControls._target.position
        .clone()
        .add(new THREE.Vector3(10, 11, 5))
    );
    this.controls.target.copy(this._characterControls._target.position);
    
    // this.controls.object.lookAt(this._characterControls._target.position.clone().sub(this._characterControls._velocity))
    console.log(this._characterControls, this.controls)
    
  }

  update(timeElapsedS) {
    if (this._characterControls) {
      this._characterControls.Update(timeElapsedS);
    }


    this.handle3rdPersonView();
    
    // Handle raycast interactions for hover and selection
    this.handleRaycastInteractions();
  }
}

export { Game };
