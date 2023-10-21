import * as THREE from "/modules/three.module.js";
import { WaveGenerator } from "./WaveGenerator.js"; // Make sure to provide the correct path to WaveGenerator.js

class Game {
  constructor(scene) {
    this.scene = scene;
    this.gridSize = 100;
    this.gridSegments = 100;
    this.waveGenerator = new WaveGenerator(scene, this.gridSize, this.gridSegments);
    this.create();
  }

  create() {
    // Initialize geometry
    this.geometry = new THREE.PlaneGeometry(this.gridSize, this.gridSize, this.gridSegments, this.gridSegments); // Setting up a plane with 50x50 segments

    // Initialize material
    this.material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true, // wireframe for better visibility
    });

    // Initialize plane and add to scene
    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.plane.rotation.x = -Math.PI / 2; // Rotate to make the plane horizontal
    this.plane.position.set(0, 0, 0); 
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
