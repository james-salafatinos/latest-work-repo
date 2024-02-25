import * as THREE from "/modules/three.module.js";

class Game {
  constructor(scene, numParticles = 500) {
    this.scene = scene;
    this.numParticles = numParticles;
    this.numSteps = 1; // Number of simulation steps to run
    this.searchRadiusVisualizations = []; // Store search radius spheres for updates/removal

    // For positions, velocities, accelerations: x, y, z for each particle
    // So we need 3 times the number of particles
    this.positions = new Float32Array(this.numParticles * 3);
    this.velocities = new Float32Array(this.numParticles * 3);
    this.accelerations = new Float32Array(this.numParticles * 3);

    // For densities and pressures, a single value for each particle
    this.densities = new Float32Array(this.numParticles); // automatically set to 0
    this.pressures = new Float32Array(this.numParticles); // automatically set to 0

    this.neighbors = []; // Array of neighbor lists for each particle

    this.colors = [];
    this.sizes = [];
    this.particles = null;
    this.spawnRadius = 5;

    this.spatialHashMap = {}; // Reset the hash map
    this.cellSize = 0.5; // Example, adjust based on your simulation needs
    this.searchRadius = 2 * this.cellSize; // Example, adjust based on your simulation needs

    this.containerRadius = 5; // Example, adjust based on your simulation needs
    this.addSphericalContainer(this.containerRadius); // Example radius, adjust as needed

    this.create(this.numParticles, this.positions, this.velocities);
  }

  create(numParticles) {
    for (let i = 0; i < numParticles; i++) {
      this.positions[i * 3] =
        Math.random() * this.spawnRadius - this.spawnRadius / 2;
      this.positions[i * 3 + 1] =
        Math.random() * this.spawnRadius - this.spawnRadius / 2;
      this.positions[i * 3 + 2] =
        Math.random() * this.spawnRadius - this.spawnRadius / 2;

      this.velocities[i * 3] = 0;
      this.velocities[i * 3 + 1] = 0;
      this.velocities[i * 3 + 2] = 0;

      this.neighbors.push([]);

      // accelerations are initialized to 0, so we may skip setting them explicitly if zeroed at allocation

      // densities and pressures are also initialized to 0
      //----------------------------------------
      this.colors.push(0, 0.5, 1);
      this.sizes.push(2); // Adjust size as needed
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(this.positions, 3)
    );
    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(this.colors, 3)
    );
    geometry.setAttribute(
      "size",
      new THREE.Float32BufferAttribute(this.sizes, 1)
    );

    // Custom Shader
    const vertexShader = `
    attribute float size;
    varying vec3 vColor;

    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

    const fragmentShader = `
    uniform sampler2D pointTexture;
    varying vec3 vColor;

    void main() {
      gl_FragColor = vec4(vColor, 2.0);
      gl_FragColor = gl_FragColor * texture2D(pointTexture, gl_PointCoord);
    }
  `;

    let uniforms = {
      pointTexture: {
        value: new THREE.TextureLoader().load("/static/spark3.png"),
      },
    };

    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
      vertexColors: true,
    });

    this.particles = new THREE.Points(geometry, shaderMaterial);
    this.scene.add(this.particles);
  }
  _hashPosition(x, y, z) {
    const ix = Math.floor(x / this.cellSize);
    const iy = Math.floor(y / this.cellSize);
    const iz = Math.floor(z / this.cellSize);
    return `${ix},${iy},${iz}`; // Create a unique key for the cell
  }

  _populateSpatialHashMap(positions, numParticles) {
    this.spatialHashMap = {}; // Reset the hash map
    for (let i = 0; i < numParticles; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const cellKey = this._hashPosition(x, y, z);
      if (!this.spatialHashMap[cellKey]) {
        this.spatialHashMap[cellKey] = [];
      }
      this.spatialHashMap[cellKey].push(i); // Store particle index in the cell
    }
  }
  findNeighbors(positions, numParticles, searchRadius) {
    this._populateSpatialHashMap(positions, numParticles); // First, populate the spatial hash map
    const neighbors = Array(numParticles)
      .fill()
      .map(() => []); // Initialize neighbors array

    for (let i = 0; i < numParticles; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      // Check the current cell and neighboring cells
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dz = -1; dz <= 1; dz++) {
            const neighborCellKey = this._hashPosition(
              x + dx * this.cellSize,
              y + dy * this.cellSize,
              z + dz * this.cellSize
            );
            const cellParticles = this.spatialHashMap[neighborCellKey] || [];
            for (const j of cellParticles) {
              if (i !== j) {
                const dx = x - positions[j * 3];
                const dy = y - positions[j * 3 + 1];
                const dz = z - positions[j * 3 + 2];
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (distance < searchRadius) {
                  neighbors[i].push(j);
                }
              }
            }
          }
        }
      }
    }

    return neighbors; // Return the array of neighbor lists
  }

  visualizeSpatialGrid() {
    Object.keys(this.spatialHashMap).forEach((key) => {
      const [ix, iy, iz] = key.split(",").map(Number);
      const geometry = new THREE.BoxGeometry(
        this.cellSize,
        this.cellSize,
        this.cellSize
      );
      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0xffffff })
      );
      line.position.x = ix * this.cellSize + this.cellSize / 2;
      line.position.y = iy * this.cellSize + this.cellSize / 2;
      line.position.z = iz * this.cellSize + this.cellSize / 2;
      this.scene.add(line);
    });
  }

  visualizeSearchRadius(particleIndex) {
    // Remove existing search radius visualizations
    this.searchRadiusVisualizations.forEach((mesh) => {
      this.scene.remove(mesh);
    });
    this.searchRadiusVisualizations = [];

    const positionIndex = particleIndex * 3;
    const x = this.positions[positionIndex];
    const y = this.positions[positionIndex + 1];
    const z = this.positions[positionIndex + 2];

    const geometry = new THREE.SphereGeometry(this.searchRadius, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.2,
      wireframe: true,
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, y, z);
    this.scene.add(sphere);

    // Store the sphere for potential removal or updates
    this.searchRadiusVisualizations.push(sphere);
  }

  addSphericalContainer(radius) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const wireframe = new THREE.WireframeGeometry(geometry);
    const material = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 1,
    });
    const sphere = new THREE.LineSegments(wireframe, material);
    sphere.position.set(0, 0, 0); // Centered at the origin
    this.scene.add(sphere);
  }

  handleBoundaryConditions(dt) {

    for (let i = 0; i < this.numParticles; i++) {
      let pos = new THREE.Vector3(
        this.positions[i * 3],
        this.positions[i * 3 + 1],
        this.positions[i * 3 + 2]
      );
      let vel = new THREE.Vector3(
        this.velocities[i * 3],
        this.velocities[i * 3 + 1],
        this.velocities[i * 3 + 2]
      );

  
  }


  computeForces() {
    const gravity = new THREE.Vector3(0, -2, 0); // Gravity force
    const repulsionStrength = 0.5; // Strength of repulsion between close particles
    const repulsionDistance = 0.01; // Distance under which repulsion becomes active

    for (let i = 0; i < this.numParticles; i++) {
      // Initialize force accumulator with gravity
      let force = gravity.clone();

      // Attraction to center
      const pos = new THREE.Vector3(
        this.positions[i * 3],
        this.positions[i * 3 + 1],
        this.positions[i * 3 + 2]
      );

      // Repulsion from other particles
      for (const j of this.neighbors[i]) {
        if (i !== j) {
          const posJ = new THREE.Vector3(
            this.positions[j * 3],
            this.positions[j * 3 + 1],
            this.positions[j * 3 + 2]
          );
          const distanceVec = new THREE.Vector3().subVectors(pos, posJ);
          const distance = distanceVec.length();

          if (distance < repulsionDistance) {
            
            // Apply repulsion force
            const repulsionForce = distanceVec
              .normalize()
              .multiplyScalar(repulsionStrength / (distance * distance));
            force.add(repulsionForce);
          }
        }
      }

      // Update accelerations based on total force
      this.accelerations[i * 3] = force.x;
      this.accelerations[i * 3 + 1] = force.y;
      this.accelerations[i * 3 + 2] = force.z;
    }
  }
  integrate(dt) {
    for (let i = 0; i < this.numParticles; i++) {
      // Verlet Integration
      let pos = new THREE.Vector3(
        this.positions[i * 3],
        this.positions[i * 3 + 1],
        this.positions[i * 3 + 2]
      );
      let vel = new THREE.Vector3(
        this.velocities[i * 3],
        this.velocities[i * 3 + 1],
        this.velocities[i * 3 + 2]
      );
      let acc = new THREE.Vector3(
        this.accelerations[i * 3],
        this.accelerations[i * 3 + 1],
        this.accelerations[i * 3 + 2]
      );

      // Update position
      let newPos = pos
        .add(vel.multiplyScalar(dt))
        .add(acc.multiplyScalar(0.5 * dt * dt));

      // Update velocity
      let newVel = vel.add(acc.multiplyScalar(dt));

      if (isNaN(newPos.x) || isNaN(newVel.x)) {
        console.error("NaN detected in integration for particle", i);
        // Reset or handle as appropriate
        continue;
      }

      this.positions[i * 3] = newPos.x;
      this.positions[i * 3 + 1] = newPos.y;
      this.positions[i * 3 + 2] = newPos.z;

      this.velocities[i * 3] = newVel.x;
      this.velocities[i * 3 + 1] = newVel.y;
      this.velocities[i * 3 + 2] = newVel.z;
    }
  }

  update() {
    // this.visualizeSpatialGrid();
    // if (this.numParticles > 0) {
    //   this.visualizeSearchRadius(0); // Visualize around the first particle
    // }

    // console.log(this.positions);

    let dt = 0.2; // Example, adjust based on your simulation needs

    for (let step = 0; step < this.numSteps; step++) {
      // Now find neighbors with the updated hash map
      this.neighbors = this.findNeighbors(
        this.positions,
        this.numParticles,
        this.searchRadius
      );

      // console.log(neighbors);

      // this.computeDensityAndPressure();
      this.computeForces();

      this.handleBoundaryConditions(dt);

      this.integrate(dt);
      // handleBoundaryConditions();
      // Handle boundary conditions or other simulation aspects as needed
    }
    // Update the positions in the particle geometry
    this.particles.geometry.attributes.position.array = this.positions;
    this.particles.geometry.attributes.position.needsUpdate = true;
    this.particles.geometry.attributes.color.needsUpdate = true;
  }
}

export { Game };
