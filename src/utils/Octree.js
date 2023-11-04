// octree.js

import * as THREE from "/modules/three.module.js";

class Node {
  constructor(min, max) {
    this.min = min;
    this.max = max;
    this.children = [];
    this.particles = [];
  }

  contains(point) {
    return (
      point.x >= this.min.x &&
      point.x <= this.max.x &&
      point.y >= this.min.y &&
      point.y <= this.max.y &&
      point.z >= this.min.z &&
      point.z <= this.max.z
    );
  }
}

class Octree {
  constructor(xRadius = 10, yRadius = 10, zRadius = 10) {
    this.xRadius = xRadius;
    this.yRadius = yRadius;
    this.zRadius = zRadius;
    this.root = new Node(
      new THREE.Vector3(-xRadius, -yRadius, -zRadius),
      new THREE.Vector3(xRadius, yRadius, zRadius)
    );

    this.subdivide(this.root, 5);
  }

  clear() {
    this.clearNode(this.root);
  }

  clearNode(node) {
    for (let child of node.children) {
      this.clearNode(child);
    }
    node.children = [];
    node.particles = [];
  }

  insert(particles) {
    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i];
      this.insertParticle(this.root, particle);
    }
  }

  insertParticle(node, particle) {
    if (!node.contains(particle)) return;

    // Add the particle to the current node
    node.particles.push(particle);

    // If this node has children, also try inserting the particle into them
    for (let child of node.children) {
      this.insertParticle(child, particle);
    }
  }

  calculateNodeDensity(level) {
    const results = [];

    this.computeDensity(this.root, 5, level, results);

    return results;
  }

  computeRootDensity(node, results) {
    if (node.particles.length > 0) {
      const sum = new THREE.Vector3();
      for (let particle of node.particles) {
        sum.add(particle);
      }
      const average = sum.divideScalar(node.particles.length);
      results.push(average);
    }
  }

  computeDensity(node, currentLevel, targetLevel, results) {
    if (currentLevel === targetLevel) {
      if (node.particles.length > 0) {
        const sum = new THREE.Vector3();
        for (let particle of node.particles) {
          sum.add(particle);
        }
        const average = sum.divideScalar(node.particles.length);
        results.push(average);
      }
      return;
    }

    for (let child of node.children) {
      this.computeDensity(child, currentLevel - 1, targetLevel, results);
    }
  }

  subdivide(node, depth) {
    if (depth === 0) return;

    const halfSize = new THREE.Vector3(
      (node.max.x - node.min.x) / 2,
      (node.max.y - node.min.y) / 2,
      (node.max.z - node.min.z) / 2
    );

    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        for (let z = 0; z < 2; z++) {
          const min = new THREE.Vector3(
            node.min.x + x * halfSize.x,
            node.min.y + y * halfSize.y,
            node.min.z + z * halfSize.z
          );

          const max = new THREE.Vector3(
            min.x + halfSize.x,
            min.y + halfSize.y,
            min.z + halfSize.z
          );

          const child = new Node(min, max);
          node.children.push(child);

          this.subdivide(child, depth - 1);
        }
      }
    }
  }
}

export { Octree };
