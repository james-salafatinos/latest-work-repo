import * as THREE from "/modules/three.module.js";

class Game {
  
  constructor(scene) {
    this.scene = scene;
    this.particles = null;
    this.particlePositions = [];
    this.particleLikelihoods = []; 
    this.numParticles = 1000; 
    this.acceptanceRate = 0;
    this.totalSteps = 0;
    this.acceptedSteps = 0;
    this.densityMesh = null; // New property for density mesh
    this.interpolationFactor = 0; // For linear interpolation
    this.interpolationSpeed = 0.05; // Speed of interpolation

    this.updateFrequency = 10; // Update every 10 frames
    this.frameCount = 0; // Frame counter

    this.createParticles();
    this.createDensityMesh();
  }

  createParticles() {
    const geometry = new THREE.InstancedBufferGeometry();
    const baseGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);

    geometry.index = baseGeometry.index;
    geometry.attributes.position = baseGeometry.attributes.position;
    geometry.attributes.uv = baseGeometry.attributes.uv;

    const offsets = [];
    const colors = [];

    for (let i = 0; i < this.numParticles; i++) {
      // Initialize particles with random positions and likelihoods
      const x = (Math.random() * 2 - 1) * 10;
      const y = (Math.random() * 2 - 1) * 10;
      const z = (Math.random() * 2 - 1) * 10;

      offsets.push(x, y, z);
      colors.push(0, 1, 0); // Initial color

      this.particlePositions.push(new THREE.Vector3(x, y, z));
      this.particleLikelihoods.push(Math.random()); // Dummy likelihood
    }

    this.targetPositions = this.particlePositions.map(pos => pos.clone()); // Deep copy using clone method
    
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

  createDensityMesh() {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(this.numParticles * 3); // x, y, z for each particle
    const colors = new Float32Array(this.numParticles * 3); // r, g, b for each particle

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));  // Added color attribute
    geometry.computeVertexNormals();

    const material = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors, side: THREE.DoubleSide, transparent: true, opacity: 0.05 });  // Enabled vertex colors
    this.densityMesh = new THREE.Mesh(geometry, material);

    this.scene.add(this.densityMesh);
  }

  likelihood(position) {
    // Dummy likelihood function: Gaussian centered at origin
    const x = position.x, y = position.y, z = position.z;
    return Math.exp(-.01 * (x*x + y*y + z*z));
  }

  updateDensityMesh() {
    const positions = this.densityMesh.geometry.attributes.position.array;
    const colors = this.densityMesh.geometry.attributes.color.array;  // Added color array
    
    for (let i = 0; i < this.numParticles; i++) {
      const index_i = i * 3;
      const position = this.particlePositions[i];
      const likelihoodColor = this.particleLikelihoods[i] / Math.max(...this.particleLikelihoods);

      // Update positions
      positions[index_i] = position.x;
      positions[index_i + 1] = position.y;
      positions[index_i + 2] = position.z;

      // Update colors
      colors[index_i] = 1 - likelihoodColor;  // r
      colors[index_i + 1] = likelihoodColor;  // g
      colors[index_i + 2] = 0;                // b
    }

    // Update the mesh vertices and colors
    this.densityMesh.geometry.attributes.position.needsUpdate = true;
    this.densityMesh.geometry.attributes.color.needsUpdate = true;  // Flag the color for update
    this.densityMesh.geometry.computeVertexNormals();
  }
  
  update() {
    this.frameCount++;
    const shouldUpdate = this.frameCount % this.updateFrequency === 0;

    const offsets = this.particles.geometry.attributes.offset.array;
    const colors = this.particles.geometry.attributes.color.array;

    for (let i = 0; i < this.numParticles; i++) {
      const index_i = i * 3;
      let position_i = this.particlePositions[i];
      const targetPosition_i = this.targetPositions[i];
      const oldLikelihood = this.particleLikelihoods[i];

      if (shouldUpdate) {
        // Propose a new position
        const dx = Math.random() - 0.5;
        const dy = Math.random() - 0.5;
        const dz = Math.random() - 0.5;
        const newPosition = position_i.clone().add(new THREE.Vector3(dx, dy, dz));

        // Compute new likelihood
        const newLikelihood = this.likelihood(newPosition);

        // Metropolis-Hastings acceptance criterion
        if (Math.random() < newLikelihood / oldLikelihood) {
          this.targetPositions[i] = newPosition;
          this.particleLikelihoods[i] = newLikelihood;
          this.acceptedSteps++;
        }
        
        this.totalSteps++;
      }

      if (!targetPosition_i) {
        console.error("targetPosition_i is undefined!", { i, targetPositions: this.targetPositions });
        continue; // Skip the rest of the loop for this iteration
      }
  
      // Interpolate position
      position_i.lerp(targetPosition_i, this.interpolationSpeed);
  

      // Update instanced attribute data
      offsets[index_i] = position_i.x;
      offsets[index_i + 1] = position_i.y;
      offsets[index_i + 2] = position_i.z;

      // Update colors based on likelihood
      const likelihoodColor = this.particleLikelihoods[i] / Math.max(...this.particleLikelihoods);
      colors[index_i] = 1 - likelihoodColor;
      colors[index_i + 1] = likelihoodColor;
      colors[index_i + 2] = 0;
    }

    if (shouldUpdate) {
      this.acceptanceRate = this.acceptedSteps / this.totalSteps;
      this.updateDensityMesh();
    }

    // Flag the changes for update
    this.particles.geometry.attributes.offset.needsUpdate = true;
    this.particles.geometry.attributes.color.needsUpdate = true;
  }
}


export { Game };