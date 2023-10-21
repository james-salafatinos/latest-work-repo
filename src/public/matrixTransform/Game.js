import * as THREE from "/modules/three.module.js";
import { GUI } from "/modules/dat.gui.module.js";
import { PointLightManager } from "/utils/LightsManager.js";

class Game {
  constructor(scene) {
    this.scene = scene;

    this.geometry = null;
    this.material = null;
    this.box = null; // Renamed this variable for clarity
    this.frameIndex = 0;
  
    this.pl = new PointLightManager(this.scene, 0xffffff, 1, 100, { x: 10, y: 10, z: 10 })
    this.pl.addPointLight()
    this.transformation = {
      a: 1,
      b: 0,
      c: 0,
      d: 1,
    };

    this.gui = new GUI();
    this.mat4 = new THREE.Matrix4(); // 4x4 matrix

    this.create();
  }
  create() {
    // Replace PlaneGeometry with BoxGeometry
    this.geometry = new THREE.BoxGeometry(2, 2, 2);
    this.material = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      side: THREE.DoubleSide,

    });
    this.box = new THREE.Mesh(this.geometry, this.material); // Use box instead of plane
    this.scene.add(this.box);

    // For interactivity, consider integrating dat.GUI or another UI library here.
    // You can then add UI components to interactively adjust the matrix values and
    // see the changes reflected on the plane.
    // Create dat.GUI components:
    this.gui
      .add(this.transformation, "a")
      .min(-1)
      .max(1)
      .step(0.1)
      .onChange(() => this.applyMatrix());
    this.gui
      .add(this.transformation, "b")
      .min(-1)
      .max(1)
      .step(0.1)
      .onChange(() => this.applyMatrix());
    this.gui
      .add(this.transformation, "c")
      .min(-1)
      .max(1)
      .step(0.1)
      .onChange(() => this.applyMatrix());
    this.gui
      .add(this.transformation, "d")
      .min(-1)
      .max(1)
      .step(0.1)
      .onChange(() => this.applyMatrix());
  }

  applyMatrix() {
    if (!this.originalGeometry) {
      this.originalGeometry = this.box.geometry.clone();
    } else {
      this.box.geometry = this.originalGeometry.clone();
    }

    this.mat4.set(
      this.transformation.a,
      this.transformation.b,
      0,
      0,
      this.transformation.c,
      this.transformation.d,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1
    );

    this.box.geometry.applyMatrix4(this.mat4); // Apply matrix to box's geometry

  }

  Tsin(x) {
    return  Math.sin(x);
  }
  Tcos(x) {
    return   Math.cos(x);
  }

  update() {
  //   // You might want to include any animations or recurrent transformations here.
  //   // For instance, if using dat.GUI, when a value is updated in the GUI, you'd
  //   // trigger the applyMatrix function.
  //   this.mat4.set(
  //     (this.transformation.a= this.Tsin(this.frameIndex/100),
  //     this.transformation.b = this.Tcos(this.frameIndex/100)),
  //     0,0,
    
  //     this.transformation.c =  this.Tcos(this.frameIndex/100),
  //     this.transformation.d = this.Tsin(this.frameIndex/100) ,
  //     0,
  //     0,
  //     0,
  //     0,
  //     1,
  //     0,
  //     0,
  //     0,
  //     0,
  //     1
  //   );

  //   this.applyMatrix();
  //   this.frameIndex++;
  }
}

export { Game };
