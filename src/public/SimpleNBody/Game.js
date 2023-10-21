import * as THREE from "/modules/three.module.js";

class Game {
  constructor(scene) {
    this.scene = scene;
    this.particles = null;
    this.particlePositions = [];
    this.particleVelocities = []; // New property for particle velocities
    this.numParticles = 1000; // You can adjust this number

    this.createParticles();
  }

  
  createParticles() {
    const positions = [];
    const colors = [];
    const sizes = [];

    for (let i = 0; i < this.numParticles; i++) {
        const x = (Math.random() * 2 - 1) * 100;
        const y = (Math.random() * 2 - 1) * 100;
        const z = (Math.random() * 2 - 1) * 100;

        positions.push(x, y, z);
        colors.push(Math.random(), Math.random(), Math.random());
        sizes.push(10);  // You can adjust the size as needed

        this.particlePositions.push(new THREE.Vector3(x, y, z));

        const vx = (Math.random() - 0.5) * 0.05;
        const vy = (Math.random() - 0.5) * 0.05;
        const vz = (Math.random() - 0.5) * 0.05;

        this.particleVelocities.push(new THREE.Vector3(vx, vy, vz));
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));

    let uniforms = {
        pointTexture: {
            value: new THREE.TextureLoader().load("/static/spark3.png"),
        },
    };

    const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
            attribute float size;
            varying vec3 vColor;
            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform sampler2D pointTexture;
            varying vec3 vColor;
            void main() {
                gl_FragColor = vec4(vColor, 1.0);
                gl_FragColor = gl_FragColor * texture2D(pointTexture, gl_PointCoord);
            }
        `,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
        vertexColors: true,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
}


  update() {
    const positions = this.particles.geometry.attributes.position.array;
    // Reusable Vector3 objects
    const r = new THREE.Vector3();
    const forceAccumulator = new THREE.Vector3();

    for (let i = 0; i < this.numParticles; i++) {
      const index_i = i * 3;
      const position_i = this.particlePositions[i];

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

      // Get the velocity for this particle
      const velocity_i = this.particleVelocities[i];

      // Update position based on force (assuming unit mass and unit time step for simplicity)
      position_i.add(forceAccumulator.divideScalar(10));

      // Update position based on velocity
      position_i.add(velocity_i);

      // Optional: Update velocity based on force (assuming unit mass)
      velocity_i.add(forceAccumulator.divideScalar(10));

      // Update instanced attribute data
      positions[index_i] = position_i.x;
      positions[index_i + 1] = position_i.y;
      positions[index_i + 2] = position_i.z;
    }

    // Flag the changes for update
    this.particles.geometry.attributes.position.needsUpdate = true;
  }
}

export { Game };
