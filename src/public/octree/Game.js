import * as THREE from "/modules/three.module.js";
import { Octree } from "/utils/Octree.js";

class Game {

  constructor(scene) {
    this.scene = scene;
    this.particles = null;
    this.particlePositions = [];
    this.particleVelocities = [];  // New property for particle velocities
    this.numParticles = 2000; // You can adjust this number

    this.createParticles();
    this.initOctree()
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

  initOctree(){
    this.octree = new Octree()
    console.log(this.particlePositions)
    this.octree.insert(this.particlePositions)
    console.log(this.octree)
    let c = this.octree.calculateNodeDensity(4) //5 is base root, 4 is first level, and so on, 0 is the last level
    console.log(c)

  }


    update() {
      const offsets = this.particles.geometry.attributes.offset.array;
    
      const r = new THREE.Vector3();
      const forceAccumulator = new THREE.Vector3();
    
      
      this.octree.insert(this.particlePositions);
      const centerOfMasses = this.octree.calculateNodeDensity(5); // Use level 4 for approximation
    
      for (let i = 0; i < this.numParticles; i++) {
        const position_i = this.particlePositions[i];
    
        // Reset the force accumulator
        forceAccumulator.set(0, 0, 0);
    
        // For far nodes, approximate
        for (const com of centerOfMasses) {
          r.subVectors(com, position_i);
    
          const distanceSquared = r.lengthSq();
          if (distanceSquared < 2) continue;
    
          r.normalize().multiplyScalar(1 / distanceSquared);
    
          forceAccumulator.add(r);
        }
    
        // For close nodes or individual particles, calculate directly
        // This could be optimized further with an efficient neighborhood search in Octree.
        for (let j = 0; j < this.numParticles; j++) {
          if (i === j) continue;
    
          const position_j = this.particlePositions[j];
          
          r.subVectors(position_j, position_i);
    
          const distanceSquared = r.lengthSq();
          if (distanceSquared < 0.1) continue;
    
          r.normalize().multiplyScalar(1 / distanceSquared);
          
          forceAccumulator.add(r);
        }
    
        const velocity_i = this.particleVelocities[i];
    
        position_i.add(forceAccumulator.divideScalar(1000));
        position_i.add(velocity_i);
    
        velocity_i.add(forceAccumulator.divideScalar(1000));
    
        const index_i = i * 3;
        offsets[index_i] = position_i.x;
        offsets[index_i + 1] = position_i.y;
        offsets[index_i + 2] = position_i.z;
      }
    
      this.particles.geometry.attributes.offset.needsUpdate = true;
    }
  
}

export { Game };
