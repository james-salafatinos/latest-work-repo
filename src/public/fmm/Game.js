import * as THREE from "/modules/three.module.js";
import {FMM, FMMTHREE} from "/utils/fast-multipole-method-optimized.js";

class Game {

  constructor(scene) {
    this.scene = scene;
    this.particles = null;
    this.particlePositions = [];
    this.particleVelocities = [];  // New property for particle velocities
    this.numParticles = 1000; // You can adjust this number
    this.value_function = function(offset, particle) { 
      var distance = Math.sqrt( Math.pow(offset.x, 2) + Math.pow(offset.y, 2) );
      var acceleration = -.98 * particle.mass / Math.pow(distance, 2)
      var normalized = {
        x: offset.x / distance,
        y: offset.y / distance,
      };
      return {
        x: normalized.x * acceleration,
        y: normalized.y * acceleration,
      }
    }
    this.field = FMMTHREE.VectorField2(5, 100, this.value_function);
    this.field.add_particle([0,0], { mass: 1 });
    this.field.add_particle([0,1], { mass: 1 });
    this.field.add_particle([1,1], { mass: 1 });
    this.field.add_particle([3,2], { mass: 1 });
    let acceleration = this.field.value([2,4]);
    console.log(this.field, acceleration )
    
 
    console.log
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
      const x = (Math.random() *2 - 1) * 10;
      const y = (Math.random() *2 - 1) * 10;
      const z = (Math.random() *2 - 1) * 10;

      offsets.push(x, y, z);
      colors.push(Math.random(), Math.random(), Math.random());

      this.particlePositions.push(new THREE.Vector3(x, y, z));

      const vx = (Math.random() - 0.5) * 0//0.05;  // Random velocity x-component
      const vy = (Math.random() - 0.5) * 0//0.001;  // Random velocity y-component
      const vz = (Math.random() - 0.5) * 0//0.001;  // Random velocity z-component

      this.particleVelocities.push(new THREE.Vector3(vx, vy, vz));  // Store initial velocity
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
      position_i.add(forceAccumulator.divideScalar(1000));
      
      // Update position based on velocity
      position_i.add(velocity_i);

      // Optional: Update velocity based on force (assuming unit mass)
      velocity_i.add(forceAccumulator.divideScalar(1000));

      // Update instanced attribute data
      offsets[index_i] = position_i.x;
      offsets[index_i + 1] = position_i.y;
      offsets[index_i + 2] = position_i.z;
    }
  
    // Flag the changes for update
    this.particles.geometry.attributes.offset.needsUpdate = true;
  }
  
}
class QuadtreeNode {
  constructor(boundary, capacity) {
    this.boundary = boundary; // { x: centerX, y: centerY, halfSize: halfWidthAndHeight }
    this.capacity = capacity; // Maximum number of particles per cell
    this.particles = []; // Store particles in this node
    this.subdivided = false; // Indicates if this node has been subdivided
    this.northwest = null;
    this.northeast = null;
    this.southwest = null;
    this.southeast = null;
  }

  subdivide() {
    const h = this.boundary.halfSize / 2;
    this.northwest = new QuadtreeNode({
      x: this.boundary.x - h,
      y: this.boundary.y - h,
      halfSize: h
    }, this.capacity);
    this.northeast = new QuadtreeNode({
      x: this.boundary.x + h,
      y: this.boundary.y - h,
      halfSize: h
    }, this.capacity);
    this.southwest = new QuadtreeNode({
      x: this.boundary.x - h,
      y: this.boundary.y + h,
      halfSize: h
    }, this.capacity);
    this.southeast = new QuadtreeNode({
      x: this.boundary.x + h,
      y: this.boundary.y + h,
      halfSize: h
    }, this.capacity);
    this.subdivided = true;
  }

  insert(particle) {
    // Check if particle is out of boundary
    if (!this.inBoundary(particle)) return false;

    // If capacity allows, add particle to current node
    if (this.particles.length < this.capacity) {
      this.particles.push(particle);
      return true;
    }

    // Otherwise, subdivide and then add particle to relevant quadrant
    if (!this.subdivided) {
      this.subdivide();
    }

    if (this.northwest.insert(particle)) return true;
    if (this.northeast.insert(particle)) return true;
    if (this.southwest.insert(particle)) return true;
    if (this.southeast.insert(particle)) return true;

    return false; // This shouldn't happen
  }

  inBoundary(particle) {
    return (particle.x >= this.boundary.x - this.boundary.halfSize &&
      particle.x < this.boundary.x + this.boundary.halfSize &&
      particle.y >= this.boundary.y - this.boundary.halfSize &&
      particle.y < this.boundary.y + this.boundary.halfSize);
  }
}

export { Game };
