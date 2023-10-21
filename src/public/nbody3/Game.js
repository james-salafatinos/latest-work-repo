import * as THREE from "/modules/three.module.js";
import { SpatialHashGrid } from "/utils/SpatialHashGrid.js";

class Game {
  constructor(scene) {
    this.scene = scene;
    this.particles = null;
    this.particlePositions = [];
    this.particleVelocities = []; // New property for particle velocities
    this.numParticles = 100; // You can adjust this number
    this.spatialGrid = new SpatialHashGrid(10, this.scene);
    this.createParticles();
  }

  createParticles() {
    // Create an instanced buffer geometry
    const geometry = new THREE.InstancedBufferGeometry();
    const baseGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);

    geometry.index = baseGeometry.index;
    geometry.attributes.position = baseGeometry.attributes.position;
    geometry.attributes.uv = baseGeometry.attributes.uv;

    // Instanced attributes
    const offsets = [];
    const colors = [];

    for (let i = 0; i < this.numParticles; i++) {
      const x = (Math.random() * 2 - 1) * 10;
      const y = (Math.random() * 2 - 1) * 10;
      const z = (Math.random() * 2 - 1) * 10;

      offsets.push(x, y, z);
      colors.push(Math.random(), Math.random(), Math.random());

      this.particlePositions.push(new THREE.Vector3(x, y, z));

      const vx = (Math.random() - 0.5) * 0.01; // Random velocity x-component
      const vy = (Math.random() - 0.5) * 0.01; // Random velocity y-component
      const vz = (Math.random() - 0.5) * 0.01; // Random velocity z-component

      this.particleVelocities.push(new THREE.Vector3(vx, vy, vz)); // Store initial velocity
    }

    // Add instanced attributes to geometry
    geometry.setAttribute(
      "offset",
      new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3)
    );
    geometry.setAttribute(
      "color",
      new THREE.InstancedBufferAttribute(new Float32Array(colors), 3)
    );

    const material = new THREE.ShaderMaterial({
      vertexShader: `
        attribute vec3 offset;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position + offset, 1.0 );
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          gl_FragColor = vec4( vColor, 1.0 );
        }
      `,
    });

    this.particles = new THREE.Mesh(geometry, material);
    this.particles.frustumCulled = false;
    this.scene.add(this.particles);
  }

  update() {
    const offsets = this.particles.geometry.attributes.offset.array;

    // Reusable Vector3 objects
    const r = new THREE.Vector3();
    const forceAccumulator = new THREE.Vector3();
    this.spatialGrid.update(this.particlePositions);
    for (let i = 0; i < this.numParticles; i++) {
      const position_i = this.particlePositions[i];
      const neighbors = this.spatialGrid.getNeighbors(position_i);

      const index_i = i * 3;
      // Reset the force accumulator
      forceAccumulator.set(0, 0, 0);

      for (const j of neighbors) {
        if (i === j) continue;
        const position_j = this.particlePositions[j];

        // Vector from i to j
        r.subVectors(position_j, position_i);

        // Calculate the unit force based on distance
        const distanceSquared = r.lengthSq();
        if (distanceSquared < 0.1) continue; // To avoid extreme forces at very small distances

        r.normalize().multiplyScalar(1 / distanceSquared);

        // Accumulate force
        forceAccumulator.add(r);
      }

      // Get the velocity for this particle
      const velocity_i = this.particleVelocities[i];

      // Update position based on force (assuming unit mass and unit time step for simplicity)
      position_i.add(forceAccumulator.divideScalar(100));

      // Update position based on velocity
      position_i.add(velocity_i);

      // Optional: Update velocity based on force (assuming unit mass)
      velocity_i.add(forceAccumulator.divideScalar(100));

      // Update instanced attribute data
      offsets[index_i] = position_i.x;
      offsets[index_i + 1] = position_i.y;
      offsets[index_i + 2] = position_i.z;
    }

    // Flag the changes for update
    this.particles.geometry.attributes.offset.needsUpdate = true;
  }
}

export { Game };
