import * as THREE from "/modules/three.module.js";

class Game {
  constructor(scene) {
    this.scene = scene;
    this.particles = null;
    this.particlePositions = [];
    this.particleVelocities = []; // New property for particle velocities
    this.particlePreviousPositions = [];
    this.numParticles = 2000; // You can adjust this number

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

    // Define the size of the lattice and the spacing between particles
    const latticeSize = Math.ceil(Math.pow(this.numParticles, 1/3));  // Size of the lattice in one dimension
    const spacing = 2;  // Adjust this value to control the distance between particles

    let count = 0;
    for (let x = 0; x < latticeSize; x++) {
        for (let y = 0; y < latticeSize; y++) {
            for (let z = 0; z < latticeSize; z++) {
                if (count >= this.numParticles) break;

                const posX = x * spacing - (latticeSize * spacing / 2);
                const posY = y * spacing - (latticeSize * spacing / 2);
                const posZ = z * spacing - (latticeSize * spacing / 2);

                offsets.push(posX, posY, posZ);
                colors.push(Math.random(), Math.random(), Math.random());

                this.particlePositions.push(new THREE.Vector3(posX, posY, posZ));

                const vx = 0;
                const vy = 0;
                const vz = 0;

                this.particleVelocities.push(new THREE.Vector3(vx, vy, vz));  // Store initial velocity
                this.particlePreviousPositions.push(new THREE.Vector3(posX, posY, posZ));

                count++;
            }
            if (count >= this.numParticles) break;
        }
        if (count >= this.numParticles) break;
    }

    // Add instanced attributes to geometry
    geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
    geometry.setAttribute('color', new THREE.InstancedBufferAttribute(new Float32Array(colors), 3));

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
        `
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
    const temp = new THREE.Vector3();

    for (let i = 0; i < this.numParticles; i++) {
      const index_i = i * 3;
      const position_i = this.particlePositions[i];
      const previousPosition_i = this.particlePreviousPositions[i];

      // Reset the force accumulator
      forceAccumulator.set(0, 0, 0);

      for (let j = 0; j < this.numParticles; j++) {
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

      // Verlet Integration
      temp.copy(position_i); // Store current position
      position_i
        .add(position_i)
        .sub(previousPosition_i)
        .add(forceAccumulator.divideScalar(1000000));
      previousPosition_i.copy(temp); // Update previous position with stored value

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
