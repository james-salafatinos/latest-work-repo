import * as THREE from "/modules/three.module.js";
import { SpatialHashGrid } from "/utils/SpatialHashGrid.js";
const PARTICLE_MASS = 1; // Adjust as needed
const GAS_CONSTANT = 1; // Adjust as needed
const VISCOSITY_COEFFICIENT = 0.00001; // Adjust based on your requirements
const dt = 0.1; // Adjust as needed
class Game {
  constructor(scene) {
    this.scene = scene;
    this.particles = null;
    this.smoothingLength = 5; // Define how far we should consider neighboring particles
    this.velocities = []; // to store velocities of particles
    this.changeDirectionFrequency = 0.01; // probability to change direction each frame
    this.particleCount = 150; // number of particles
    this.boundingRadius = 25; // radius of the bounding circle
    // const cells_per_dimension = Math.ceil((2 * this.boundingRadius) / this.smoothingLength);
    // this.spatialHashGrid = new SpatialHashGrid(cells_per_dimension, cells_per_dimension, 0);

    this.create();
  }

  create() {
    const positions = [];
    const colors = [];
    const sizes = [];
    for (let i = 0; i < this.particleCount; i++) {
      const x = (Math.random() - 0.5) * 2 * this.boundingRadius;
      const y = (Math.random() - 0.5) * 2 * this.boundingRadius;
      const z = 0;

      positions.push(x, y, z);
      colors.push(0, 0.5, 1);
      sizes.push(10); // Adjust size as needed

      // Random initial velocities
      const vx = 0.1; //(Math.random() - 0.5) * 0.5;
      const vy = 0.1; //(Math.random() - 0.5) * 0.5;
      this.velocities.push(vx, vy, 0);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));

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
  // Kernel function for SPH
  kernelFunction(r, h) {
    const q = r / h;
    const sigma = 40 / (7 * Math.PI * h * h);
    if (q <= 0.5) {
      return sigma * (6 * (q ** 3 - q ** 2) + 1);
    } else if (q <= 1) {
      return sigma * (2 * (1 - q) ** 3);
    } else {
      return 0;
    }
  }
  // Gradient of Kernel function for SPH (adjusted to Eq. (23))
  kernelGradient(r, h) {
    const q = r / h;
    const sigma = 40 / (7 * Math.PI * h * h);
    let gradient = 0;
    if (q <= 0.5) {
      gradient = sigma * (18 * q ** 2 - 12 * q);
    } else if (q <= 1) {
      gradient = sigma * (-6 * (1 - q) ** 2);
    }
    return (gradient * 2) / h; // Adjusted as per the provided equations
  }

  // Calculate density using kernel function
  calculateDensity(particleIndex, positions) {
    const h = this.smoothingLength;
    let density = 0;
    const x1 = positions[3 * particleIndex];
    const y1 = positions[3 * particleIndex + 1];

    for (let i = 0; i < positions.length / 3; i++) {
      if (i !== particleIndex) {
        const x2 = positions[3 * i];
        const y2 = positions[3 * i + 1];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const r = Math.sqrt(dx * dx + dy * dy);

        density += this.kernelFunction(r, h);
      }
    }

    return density;
  }

  // Compute Viscosity
  computeViscousForce(particleIndex, positions) {
    const h = this.smoothingLength;
    const x1 = positions[3 * particleIndex];
    const y1 = positions[3 * particleIndex + 1];
    const v1x = this.velocities[3 * particleIndex];
    const v1y = this.velocities[3 * particleIndex + 1];

    let viscousForce = { x: 0, y: 0 };

    for (let i = 0; i < positions.length / 3; i++) {
      if (i !== particleIndex) {
        const x2 = positions[3 * i];
        const y2 = positions[3 * i + 1];
        const v2x = this.velocities[3 * i];
        const v2y = this.velocities[3 * i + 1];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const r = Math.sqrt(dx * dx + dy * dy);

        const factor = this.kernelGradient(r, h) * VISCOSITY_COEFFICIENT;
        viscousForce.x += factor * (v2x - v1x);
        viscousForce.y += factor * (v2y - v1y);
      }
    }

    return viscousForce;
  }

  // Compute Pressure Force
  computePressureForce(particleIndex, positions) {
    // console.log("Initial positions:", positions);
    const h = this.smoothingLength;
    const x1 = positions[3 * particleIndex];
    const y1 = positions[3 * particleIndex + 1];
    const density1 = this.calculateDensity(particleIndex, positions);
    const pressure1 = GAS_CONSTANT * density1;

    let pressureForce = { x: 0, y: 0 };

    for (let i = 0; i < positions.length / 3; i++) {
      if (i !== particleIndex) {
        const x2 = positions[3 * i];
        const y2 = positions[3 * i + 1];
        const density2 = this.calculateDensity(i, positions);

        const pressure2 = GAS_CONSTANT * density2;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const r = Math.sqrt(dx * dx + dy * dy);

        let eps = 0.0001;
        // Potential issue if r is 0, which could happen if two particles occupy the same position
        if (r === 0) continue;

        const factor =
          (this.kernelGradient(r, h) * (pressure1 + pressure2)) /
          (2 * density2 + eps);
        pressureForce.x += dx * factor;
        pressureForce.y += dy * factor;
      }
    }

    return pressureForce;
  }

  // Compute Laplacian for a scalar field using Eq. (25)
  computeLaplacian(particleIndex, positions) {
    const h = this.smoothingLength;
    const x1 = positions[3 * particleIndex];
    const y1 = positions[3 * particleIndex + 1];
    let laplacian = 0;

    for (let i = 0; i < positions.length / 3; i++) {
      if (i !== particleIndex) {
        const x2 = positions[3 * i];
        const y2 = positions[3 * i + 1];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const r = Math.sqrt(dx * dx + dy * dy);

        const factor = (dx / r) * this.kernelGradient(r, h);
        laplacian += (2 * factor) / r;
      }
    }

    return laplacian;
  }

  // Gradient of scalar field (density)
  scalarGradient(particleIndex, positions) {
    const h = this.smoothingLength;
    const x1 = positions[3 * particleIndex];
    const y1 = positions[3 * particleIndex + 1];
    let grad = { x: 0, y: 0 };

    for (let i = 0; i < positions.length / 3; i++) {
      if (i !== particleIndex) {
        const x2 = positions[3 * i];
        const y2 = positions[3 * i + 1];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const r = Math.sqrt(dx * dx + dy * dy);

        const factor = this.kernelGradient(r, h) / r;
        grad.x += dx * factor;
        grad.y += dy * factor;
      }
    }

    return grad;
  }
  // Gradient of vector field using dyadic product
  vectorGradient(particleIndex, positions) {
    const h = this.smoothingLength;
    const x1 = positions[3 * particleIndex];
    const y1 = positions[3 * particleIndex + 1];
    let grad = { xx: 0, xy: 0, yx: 0, yy: 0 };

    for (let i = 0; i < positions.length / 3; i++) {
      if (i !== particleIndex) {
        const x2 = positions[3 * i];
        const y2 = positions[3 * i + 1];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const r = Math.sqrt(dx * dx + dy * dy);

        const vjx = this.velocities[3 * i];
        const vjy = this.velocities[3 * i + 1];
        const factor = this.kernelGradient(r, h) / r;

        grad.xx += dx * vjx * factor;
        grad.xy += dx * vjy * factor;
        grad.yx += dy * vjx * factor;
        grad.yy += dy * vjy * factor;
      }
    }

    return grad;
  }
  computeDensityRate(particleIndex, positions) {
    const h = this.smoothingLength;
    const m = 1; // Assuming unit mass for all particles. Adjust accordingly.
    const x1 = positions[3 * particleIndex];
    const y1 = positions[3 * particleIndex + 1];
    const v1x = this.velocities[3 * particleIndex];
    const v1y = this.velocities[3 * particleIndex + 1];

    let drho_dt = 0;

    for (let i = 0; i < positions.length / 3; i++) {
      if (i !== particleIndex) {
        const x2 = positions[3 * i];
        const y2 = positions[3 * i + 1];
        const v2x = this.velocities[3 * i];
        const v2y = this.velocities[3 * i + 1];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dvx = v2x - v1x;
        const dvy = v2y - v1y;
        const r = Math.sqrt(dx * dx + dy * dy);

        const factor = this.kernelGradient(r, h) / r;

        drho_dt += m * (dvx * dx + dvy * dy) * factor;
      }
    }

    return drho_dt;
  }
  update() {
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      const colors = this.particles.geometry.attributes.color.array;

      // First, populate the hash grid
      // this.spatialHashGrid.clear();
      // for (let i = 0; i < positions.length / 3; i++) {
      //   const p = {
      //     x: positions[3 * i],
      //     y: positions[3 * i + 1],
      //   };
      //   this.spatialHashGrid.insert(p, i);
      // }

      // // When computing forces, use the hash grid to find neighbors
      // for (let i = 0; i < positions.length / 3; i++) {
      //   const p = {
      //     x: positions[3 * i],
      //     y: positions[3 * i + 1],
      //   };
      //   const neighbors = this.spatialHashGrid.getNeighbors(p);
      //   for (let j of neighbors) {
      //     if (j !== i) {

      for (let i = 0; i < positions.length / 3; i++) {
        const viscousForce = this.computeViscousForce(i, positions);
        const pressureForce = this.computePressureForce(i, positions);

        let gravity = -0.98;
        // Euler integration for velocity

        let f = { x: 0, y: 0 };
        f.x = viscousForce.x + pressureForce.x;
        f.y = viscousForce.y + pressureForce.y;

        f.y += gravity;
        this.velocities[3 * i] += (dt * f.x) / PARTICLE_MASS;
        this.velocities[3 * i + 1] += (dt * f.y) / PARTICLE_MASS;
        this.velocities[3 * i] *= 0.98;
        this.velocities[3 * i + 1] *= 0.98;

        // Update positions based on velocities
        positions[3 * i] += this.velocities[3 * i];
        positions[3 * i + 1] += this.velocities[3 * i + 1];

        // Bounding box logic
        if (Math.abs(positions[3 * i]) > this.boundingRadius) {
          this.velocities[3 * i] = -this.velocities[3 * i];
        }
        if (Math.abs(positions[3 * i + 1]) > this.boundingRadius) {
          this.velocities[3 * i + 1] = -this.velocities[3 * i + 1];
        }

        const density = this.calculateDensity(i, positions);

        // Change particle color based on density (blue to red gradient)
        colors[3 * i] = Math.min(1, density / 5); // Red channel
        colors[3 * i + 1] = 0; // Green channel
        colors[3 * i + 2] = 1 - Math.min(1, density / 5); // Blue channel
      }

      this.particles.geometry.attributes.position.needsUpdate = true;
      this.particles.geometry.attributes.color.needsUpdate = true;
    }
  }
}

export { Game };
