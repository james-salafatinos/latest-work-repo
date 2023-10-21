import * as THREE from "/modules/three.module.js";
import { WaveSimulator } from "./WaveSimulator.js"; // Updated path for WaveSimulator.js
import { GUI } from "/modules/dat.gui.module.js";

/**
 * Class responsible for setting up the game environment and visuals.
 */
class Game {
  constructor(scene) {
    this.scene = scene;
    this.gridSize = 25;
    this.gridSegments = 25;

    // Using the WaveSimulator class
    this.waveSimulator = new WaveSimulator(
      scene,
      this.gridSize,
      this.gridSegments
    );

    this.create();
    this.configureGUI();
  }

  /**
   * Set up game controls via GUI.
   */
  configureGUI() {
    let gui = new GUI();

    // Configuring WaveSimulator properties in the GUI:
    const propsToConfigure = [
      { prop: "amplitude", range: [0, 1], name: "Amplitude" },
      { prop: "pulseWidth", range: [0, 1], name: "Pulse Width" },
      { prop: "delay", range: [0, 100], name: "Delay" },
      { prop: "propagationSpeed", range: [0, 5], name: "Propagation Speed" },
      { prop: "dissipation", range: [0, 2], name: "Dissipation" },

      {
        prop: "radius",
        range: [0, this.gridSize],
        name: "Radius",
        step: 1,
        onChange: () => this.waveSimulator.initializeWaves(),
      },
      {
        prop: "numWaves",
        range: [0, 25],
        name: "Number of Waves",
        step: 1,
        onChange: () => this.waveSimulator.initializeWaves(),
      },
    ];

    propsToConfigure.forEach((conf) => {
      let control = gui
        .add(this.waveSimulator, conf.prop, ...conf.range)
        .name(conf.name);
      if (conf.step) control.step(conf.step);
      if (conf.onChange) control.onChange(conf.onChange);
    });

    // 'v' key event listener to restart the wave simulation
    document.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() === "v") {
        this.waveSimulator.restartSimulation();
      }
    });
  }

  /**
   * Create the game's visual elements.
   */
  create() {
    this.geometry = new THREE.PlaneGeometry(
      this.gridSize,
      this.gridSize,
      this.gridSegments,
      this.gridSegments
    );
    this.geometry.setAttribute(
      "color",
      new THREE.BufferAttribute(
        new Float32Array((this.gridSegments + 1) * (this.gridSegments + 1) * 3),
        3
      )
    );

    this.material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      wireframe: true,
    });

    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.plane.rotation.x = -Math.PI / 2;
    this.plane.position.set(0, 0, 0);

    this.scene.add(this.plane);
  }

  hueToRgb(h) {
    let r, g, b;

    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const q = 1 - f;

    switch (i % 6) {
      case 0:
        r = 1;
        g = f;
        b = 0;
        break;
      case 1:
        r = q;
        g = 1;
        b = 0;
        break;
      case 2:
        r = 0;
        g = 1;
        b = f;
        break;
      case 3:
        r = 0;
        g = q;
        b = 1;
        break;
      case 4:
        r = f;
        g = 0;
        b = 1;
        break;
      case 5:
        r = 1;
        g = 0;
        b = q;
        break;
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
  /**
   * Update the game's visual elements.
   */
  update() {
    const time = this.waveSimulator.clock.getElapsedTime();
    const vertices = this.plane.geometry.attributes.position.array;
    const colors = this.plane.geometry.attributes.color.array;

    for (let i = 0; i <= this.gridSegments; i++) {
      for (let j = 0; j <= this.gridSegments; j++) {
        const index = (i * (this.gridSegments + 1) + j) * 3 + 2;
        var resultant = this.waveSimulator.getWaveEffect(i, j, time);
        // console.log(resultant)

        //Amplitude
        vertices[index] = resultant.amplitude;

        //Phase
        const phaseNormalized = (resultant.phase + Math.PI) / (2 * Math.PI); // Normalize between 0 and 1
        const [r, g, b] = this.hueToRgb(phaseNormalized);
        const colorIndex = (i * (this.gridSegments + 1) + j) * 3;
        colors[colorIndex] = r / 255;
        colors[colorIndex + 1] = g / 255;
        colors[colorIndex + 2] = b / 255;
      }
    }
    this.plane.geometry.attributes.position.needsUpdate = true;
    this.plane.geometry.attributes.color.needsUpdate = true;
  }
}

export { Game };
