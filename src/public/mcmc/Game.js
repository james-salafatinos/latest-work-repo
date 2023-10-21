import * as THREE from "/modules/three.module.js";

class Game {
  
  constructor(scene) {
    this.scene = scene;
    this.particles = null;
    this.particlePositions = [];
    this.targetPositions = [];  // New property for target positions
    this.particleLikelihoods = [];
    this.numParticles = 1000;
    this.acceptanceRate = 0;
    this.totalSteps = 0;
    this.acceptedSteps = 0;
    this.lerpFactor = 0.1;  // New property for linear interpolation

    this.createParticles();
    this.createLikelihoodLine();
    this.createLikelihoodMesh();  // New method to create likelihood mesh
    this.createZLikelihoodLine();

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
      // this.particleLikelihoods.push(Math.random()); // Dummy likelihood
      this.particleLikelihoods.push(this.likelihood(new THREE.Vector3(x, y, z))); // Actual likelihood
    }

    
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

 
  //   likelihood(position) {
  //   const x = position.x, y = position.y, z = position.z;
  //   return Math.sin(x) + Math.cos(y) + Math.sin(z)
  // }

  likelihood(position) {
    // Dummy likelihood function: Gaussian centered at origin
    const x = position.x, y = position.y, z = position.z;
    return Math.exp(-.01 * (x*x + y*y + z*z));
  }
  createLikelihoodMesh() {
    // Generate vertices and colors based on the likelihood function for a range of x, y values
    const gridSize = 21;  // 21x21 grid
    const gridStep = 1;  // Step size
    const vertices = [];
    const colors = [];

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = -10 + i * gridStep;
        const y = -10 + j * gridStep;
        const z = 0;  // Base z-value (can be modified)
        const position = new THREE.Vector3(x, y, z);
        const likelihood = this.likelihood(position);

        vertices.push(x, y, likelihood);  // z-value is set to likelihood

        // Generate color based on likelihood
        colors.push(likelihood, 0, 1 - likelihood);
      }
    }

    // Create mesh geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Generate faces (two triangles for each grid square)
    const indices = [];
    for (let i = 0; i < gridSize - 1; i++) {
      for (let j = 0; j < gridSize - 1; j++) {
        const vertex1 = i * gridSize + j;
        const vertex2 = vertex1 + gridSize;
        const vertex3 = vertex1 + 1;
        const vertex4 = vertex2 + 1;

        indices.push(vertex1, vertex2, vertex3);
        indices.push(vertex3, vertex2, vertex4);
      }
    }
    geometry.setIndex(indices);

    // Create mesh material
    const material = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .5 });

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    //sets all z positions to -10
    

    // Add mesh to scene
    this.scene.add(mesh);
  }

  createLikelihoodLine() {
    const points = [];
    const colors = [];

    for (let x = -10; x <= 10; x += 0.1) {
      const y = 0;
      const z = 0;
      const position = new THREE.Vector3(x, y, z);
      const likelihood = this.likelihood(position);
      points.push(new THREE.Vector3(x, likelihood, z));

      // Color based on likelihood: Blue (low) to Red (high)
      colors.push(likelihood, 0, 1-likelihood);
    }

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true  // Use vertexColors attribute
    });

    const line = new THREE.Line(lineGeometry, lineMaterial);
    this.scene.add(line);
  }

  createZLikelihoodLine() {
    const points = [];
    const colors = [];

    for (let z = -10; z <= 10; z += 0.1) {
      const y = 0;
      const x = -10;
      const position = new THREE.Vector3(x, y, z);
      const likelihood = this.likelihood(position);
      points.push(new THREE.Vector3(x, likelihood, z));

      // Color based on likelihood: Blue (low) to Red (high)
      colors.push( likelihood, 0, 1-likelihood);
    }

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true  // Use vertexColors attribute
    });

    const line = new THREE.Line(lineGeometry, lineMaterial);
    this.scene.add(line);
  }



  update() {
    const offsets = this.particles.geometry.attributes.offset.array;
    const colors = this.particles.geometry.attributes.color.array;

    for (let i = 0; i < this.numParticles; i++) {
      const index_i = i * 3;
      let position_i = this.particlePositions[i];
      let targetPosition_i = this.targetPositions[i] || position_i.clone();  // New logic for target position
      const oldLikelihood = this.particleLikelihoods[i];

      // Propose a new position
      const dx = Math.random() - 0.5;
      const dy = Math.random() - 0.5;
      const dz = Math.random() - 0.5;
      const newPosition = position_i.clone().add(new THREE.Vector3(dx, dy, dz));

      // Compute new likelihood
      const newLikelihood = this.likelihood(newPosition);

      // Metropolis-Hastings acceptance criterion
      if (Math.random() < newLikelihood / oldLikelihood) {
        this.targetPositions[i] = newPosition;  // Set new target position
        this.particleLikelihoods[i] = newLikelihood;
        this.acceptedSteps++;
      }

      // Smooth transition to target position using linear interpolation
      position_i.lerp(targetPosition_i, this.lerpFactor);

      this.totalSteps++;

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

    this.acceptanceRate = this.acceptedSteps / this.totalSteps;

    // Flag the changes for update
    this.particles.geometry.attributes.offset.needsUpdate = true;
    this.particles.geometry.attributes.color.needsUpdate = true;
  }
}


export { Game };