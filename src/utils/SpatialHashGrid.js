import * as THREE from "/modules/three.module.js";

class SpatialHashGrid {
  constructor(cellSize, scene) {
    this.cellSize = cellSize;
    this.grid = {};
    this.scene = scene;
    this.gridHelpers = [];
    this.visualize = true;

    this.vectorBuffers = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ];
  }

  hashPosition(vec3) {
    const x = Math.floor(vec3.x / this.cellSize);
    const y = Math.floor(vec3.y / this.cellSize);
    const z = Math.floor(vec3.z / this.cellSize);
    return `${x},${y},${z}`;
  }

  insert(position, index) {
    const key = this.hashPosition(position);
    if (!this.grid[key]) {
      this.grid[key] = [];
    }
    this.grid[key].push(index);
  }

  getNeighbors(position) {
    const neighbors = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const x = position.x + dx * this.cellSize;
          const y = position.y + dy * this.cellSize;
          const z = position.z + dz * this.cellSize;
          const key = this.hashPosition(new THREE.Vector3(x, y, z));
          if (this.grid[key]) {
            neighbors.push(...this.grid[key]);
          }
        }
      }
    }
    return neighbors;
  }

  update(particles) {
    this.grid = {};
    for (let i = 0; i < particles.length; i++) {
      this.insert(particles[i], i);
    }

    if (this.visualize) {
      this.drawGridHelpers();
    }
  }

  drawGridHelpers() {
    // First, remove existing grid helpers from the scene
    for (const helper of this.gridHelpers) {
      this.scene.remove(helper);
    }
    this.gridHelpers = [];

    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    for (const key in this.grid) {
      const [x, y, z] = key.split(",").map(Number);
      // Reuse the vector buffers for vertices
      const vertices = this.vectorBuffers;

      vertices[0].set(x * this.cellSize, y * this.cellSize, z * this.cellSize);
      vertices[1].set(
        (x + 1) * this.cellSize,
        y * this.cellSize,
        z * this.cellSize
      );
      vertices[2].set(
        (x + 1) * this.cellSize,
        (y + 1) * this.cellSize,
        z * this.cellSize
      );
      vertices[3].set(
        x * this.cellSize,
        (y + 1) * this.cellSize,
        z * this.cellSize
      );
      vertices[4].set(
        x * this.cellSize,
        y * this.cellSize,
        (z + 1) * this.cellSize
      );
      vertices[5].set(
        (x + 1) * this.cellSize,
        y * this.cellSize,
        (z + 1) * this.cellSize
      );
      vertices[6].set(
        (x + 1) * this.cellSize,
        (y + 1) * this.cellSize,
        (z + 1) * this.cellSize
      );
      vertices[7].set(
        x * this.cellSize,
        (y + 1) * this.cellSize,
        (z + 1) * this.cellSize
      );

      const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
      geometry.setIndex([
        0,
        1,
        1,
        2,
        2,
        3,
        3,
        0, // bottom square
        4,
        5,
        5,
        6,
        6,
        7,
        7,
        4, // top square
        0,
        4,
        1,
        5,
        2,
        6,
        3,
        7, // vertical lines
      ]);
      const helper = new THREE.LineSegments(geometry, material);
      this.gridHelpers.push(helper);
      this.scene.add(helper);
    }
  }
}

export { SpatialHashGrid };
