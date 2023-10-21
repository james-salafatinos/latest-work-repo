import * as THREE from "/modules/three.module.js";
import { WaveGenerator } from "./WaveGenerator.js"; // Make sure to provide the correct path to WaveGenerator.js
import { GUI } from "/modules/dat.gui.module.js";
class Game {
  constructor(scene) {
    this.scene = scene;
    this.gridSize = 35;
    this.gridSegments = 35;
    this.waveGenerator = new WaveGenerator(
      scene,
      this.gridSize,
      this.gridSegments
    );

    this.create();
    this.setupGUI();
  }
  setupGUI() {
    let gui = new GUI();

    // Add WaveGenerator properties to the GUI:
    gui.add(this.waveGenerator, "amplitude", 0, 40).name("Amplitude");
    gui.add(this.waveGenerator, "pulseWidth", 0, 50).name("Pulse Width");
    gui.add(this.waveGenerator, "delay", 0, 100).name("Delay");
    gui
      .add(this.waveGenerator, "propagationSpeed", 0, 100)
      .name("Propagation Speed");
    gui
      .add(this.waveGenerator, "oscillationSpeed", 0, 25)
      .name("Oscillation Speed");
    gui.add(this.waveGenerator, "dissapation", -1, 1).name("Dissapation");
    gui
      .add(this.waveGenerator, "phaseMultiplier", 0, 25)
      .name("Phase Multiplier");
    gui
      .add(this.waveGenerator, "phaseStartOffset", 0, 2 * Math.PI)
      .name("Phase Start Offset");

    gui
      .add(this.waveGenerator, "radius", 0, this.gridSize)
      .step(1)
      .name("Radius")
      .onChange(() => {
        this.waveGenerator.restartPulse();
      });

    gui
      .add(this.waveGenerator, "num_waves", 0, 25)
      .step(1)
      .name("Number of Waves")
      .onChange(() => {
        this.waveGenerator.restartPulse();
      });

    // Add event listener for the 'v' key
    document.addEventListener("keydown", (event) => {
      if (event.key === "v" || event.key === "V") {
        // this.waveGenerator.restartPulse();
        this.waveGenerator.restartSimulation();
        // this.waveGenerator.dissapation -= .01
      }
    });
  }

  create() {
    // Directional light
    const sun = new THREE.DirectionalLight(0xffffff, .5); // white color, full intensity
    sun.position.set(200, 100, 10); // position the sun to top-right
    sun.target.position.set(0, 0, 0); // target the center of the scene
    sun.castShadow = true;
    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 500;
    sun.shadow.mapSize.width = 512; // default is 512
    sun.shadow.mapSize.height = 512; // default is 512
    this.scene.add(sun);
    this.scene.add(sun.target);

    // // Point light
    // const pointLight = new THREE.PointLight(0xffffff, 0.8, 150); // white color, 80% intensity, 150 distance
    // pointLight.position.set(20, 50, 20); // position the point light slightly off-center above the simulation
    // this.scene.add(pointLight);
    // Initialize geometry
    this.geometry = new THREE.PlaneGeometry(
      this.gridSize,
      this.gridSize,
      this.gridSegments,
      this.gridSegments
    ); // Setting up a plane with 50x50 segments

    // Initialize material
    this.material = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      wireframe: false, // wireframe for better visibility
    });

    // Initialize plane and add to scene
    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.plane.rotation.x = -Math.PI / 2; // Rotate to make the plane horizontal
    this.plane.position.set(0, 0, 0);
    this.plane.castShadow = true; // this mesh will cast shadows
    this.plane.receiveShadow = true; // this mesh will receive shadows
    this.scene.add(this.plane);
  }

  update() {
    let time = this.waveGenerator.clock.getElapsedTime();
    let vertices = this.plane.geometry.attributes.position.array;

    // Updating vertex z-position based on wave calculation
    for (let i = 0; i <= this.gridSegments; i++) {
      for (let j = 0; j <= this.gridSegments; j++) {
        let index = (i * (this.gridSegments + 1) + j) * 3 + 2; // Calculate the appropriate index for the z component of the vertex
        vertices[index] = this.waveGenerator.calculateWaveValue(i, j, time);
      }
    }
    this.plane.geometry.attributes.position.needsUpdate = true; // Indicate that the geometry has been changed
  }
}

export { Game };
