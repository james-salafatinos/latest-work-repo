import * as THREE from "/modules/three.module.js";

class Game {

  constructor(scene) {
    this.scene = scene;
    this.particles = null;
    this.particlePositions = [];
    this.particleVelocities = [];
    this.numParticles = 1000;

    this.createParticles();
  }

  createParticles() {
    const geometry = new THREE.InstancedBufferGeometry();
    const baseGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);

    geometry.index = baseGeometry.index;
    geometry.attributes.position = baseGeometry.attributes.position;
    geometry.attributes.uv = baseGeometry.attributes.uv;

    const offsets = [];
    const colors = [];

    for (let i = 0; i < this.numParticles; i++) {
      const x = (Math.random() * 2 - 1) * 5;
      const y = (Math.random() * 2 - 1) * 5;
      const z = (Math.random() * 2 - 1) * 5;

      offsets.push(x, y, z);
      colors.push(Math.random(), Math.random(), Math.random());

      this.particlePositions.push(new THREE.Vector3(x, y, z));

      const vx = (Math.random() - 0.5) * 0.05;
      const vy = (Math.random() - 0.5) * 0.05;
      const vz = (Math.random() - 0.5) * 0.05;

      this.particleVelocities.push(new THREE.Vector3(vx, vy, vz));
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

  update() {
    const offsets = this.particles.geometry.attributes.offset.array;
    const lerpFactor = 0.1;
    const alignmentWeight = 1.3;
    const cohesionWeight = 1.0;
    const separationWeight = 1.1;
    const boundaryWeight = 1.0;
  
    const alignmentForce = new THREE.Vector3();
    const cohesionForce = new THREE.Vector3();
    const separationForce = new THREE.Vector3();
    const boundaryForce = new THREE.Vector3();
  
    for (let i = 0; i < this.numParticles; i++) {
      const index_i = i * 3;
      const position_i = this.particlePositions[i];
      const velocity_i = this.particleVelocities[i];
  
      alignmentForce.set(0, 0, 0);
      cohesionForce.set(0, 0, 0);
      separationForce.set(0, 0, 0);
      boundaryForce.set(0, 0, 0);
  
      let neighborCount = 0;
  
      // Boundary conditions
      ['x', 'y', 'z'].forEach((axis) => {
        if (Math.abs(position_i[axis]) >= 10 - 1.5) {
          boundaryForce[axis] = -(position_i[axis] > 0 ? 1 : -1);
        }
      });
  
      // Neighbor interactions
      for (let j = 0; j < this.numParticles; j++) {
        if (i === j) continue;
  
        const position_j = this.particlePositions[j];
        const velocity_j = this.particleVelocities[j];
  
        const distanceVector = new THREE.Vector3().subVectors(position_i, position_j);
        const distSquared = distanceVector.lengthSq();
  
        // Update separationForce to prevent overlap
        if (distSquared < 1) {
          const forceMagnitude = 1 - Math.sqrt(distSquared);
          const forceVector = distanceVector.normalize().multiplyScalar(forceMagnitude);
          separationForce.add(forceVector);
        }
  
        if (distSquared < 1) {
          alignmentForce.add(velocity_j);
          cohesionForce.add(position_j);
          neighborCount++;
        }
      }
  
      if (neighborCount > 0) {
        alignmentForce.divideScalar(neighborCount).normalize().multiplyScalar(alignmentWeight);
        cohesionForce.divideScalar(neighborCount).sub(position_i).normalize().multiplyScalar(cohesionWeight);
      }
  
      separationForce.multiplyScalar(separationWeight);
      boundaryForce.multiplyScalar(boundaryWeight);
  
      // Calculate new desired velocity
      const newVelocity = new THREE.Vector3()
                            .addVectors(alignmentForce, cohesionForce)
                            .add(separationForce)
                            .add(boundaryForce)
                            .clampLength(-0.05, 0.05);
  
      // Interpolate from the current velocity to the new velocity
      velocity_i.lerp(newVelocity, lerpFactor);
  
      // Update position
      position_i.add(velocity_i);
  
      // Update offsets for rendering
      offsets[index_i] = position_i.x;
      offsets[index_i + 1] = position_i.y;
      offsets[index_i + 2] = position_i.z;
    }
  
    // Mark attribute for update
    this.particles.geometry.attributes.offset.needsUpdate = true;
  }
  
  
}

export { Game };
