import * as THREE from "/modules/three.module.js";

import { UnionFind } from "/utils/UnionFind.js";

import { LatticeUndirectedGraph } from "/utils/LatticeUndirectedGraph.js";

import { WaveGenerator } from "/utils/WaveGenerator.js";

class Game {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.size = 200;
    this.waves = new WaveGenerator(scene); // Initialize WaveGeneratorc
    console.log(this.waveGenerator);
    this.create();

    let game = this;

    window.addEventListener("click", function (event) {
      console.log("In Click Event");

      // Create a mouse vector
      var mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );

      // Create a raycaster and configure its params
      var raycaster = new THREE.Raycaster();
      raycaster.params.Points.threshold = 1;

      // Update the raycaster with the mouse and camera
      raycaster.setFromCamera(mouse, game.camera);

      // Intersect the ray with the objects in the scene
      var intersects = raycaster.intersectObjects(game.scene.children, true);

      // Handle intersections
      if (intersects.length > 0) {
        console.log(
          "Intersected at X, Y, Z",
          intersects[0].point.x,
          intersects[0].point.y,
          intersects[0].point.z
        );

        if (game.waves.click_wave_origin_xy.length - game.chop_offset > 10) {
          console.log("More than 10, chopping!");
          game.chop_offset += 1;
        }

        game.waves.click_wave_origin_xy.push([
          intersects[0].point.x,
          intersects[0].point.z,
        ]);
        game.waves.t_.push(game.T);
        game.waves.clicks += 1;
      } else {
        // Do nothing
      }
    });
  }

  getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "0x";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return Number(color);
  }

  create() {
    this.lug2 = new LatticeUndirectedGraph(this.size, this.size);
    this.lug2.randomlyRemoveEdges(0.5);
    this.uf = new UnionFind(this.size * this.size);
    for (const edge of this.lug2.getEdgeList()) {
      this.uf.union(edge.from, edge.to);
    }

    const rootToColor = new Map();
    for (let i = 0; i < this.uf.parent.length; i++) {
      const root = this.uf.find(i);
      if (!rootToColor.has(root)) {
        rootToColor.set(root, this.getRandomColor());
      }
    }

    const colors = new Float32Array(this.lug2.size * 3);
    let colorIdx = 0;
    for (let i = 0; i < this.uf.parent.length; i++) {
      const root = this.uf.find(i);
      const color = rootToColor.get(root);
      const colorObject = new THREE.Color(color);
      colors[colorIdx++] = colorObject.r;
      colors[colorIdx++] = colorObject.g;
      colors[colorIdx++] = colorObject.b;
    }

    this.visualize(colors);
  }

  visualize(colors) {
    const vertices = new Float32Array(this.lug2.size * 3);
    const edges = new Float32Array(this.lug2.getEdgeList().length * 6); // 6 for x1, y1, z1, x2, y2, z2
    let vertexIdx = 0;
    const scaleFactor = 0.2;
    const halfWidth = ((this.size - 1) * scaleFactor) / 2; // half of total width
    const halfHeight = ((this.size - 1) * scaleFactor) / 2; // half of total height
    for (let i = 0; i < Math.sqrt(this.lug2.size); i++) {
      for (let j = 0; j < Math.sqrt(this.lug2.size); j++) {
        vertices[vertexIdx++] = i * scaleFactor - halfWidth; // x coordinate
        vertices[vertexIdx++] = 0; // y coordinate
        vertices[vertexIdx++] = j * scaleFactor - halfHeight; // z coordinate
      }
    }

    // Create InstancedBufferGeometry for vertices
    this.vertexGeometry = new THREE.InstancedBufferGeometry();
    this.vertexGeometry.instanceCount = this.lug2.size; // Set the instance count

    // Create a single geometry that will be instanced
    const baseGeometry = new THREE.BoxBufferGeometry(0.12, 0.12, 0.12); // You can change the shape here
    this.vertexGeometry.index = baseGeometry.index;
    this.vertexGeometry.attributes.position = baseGeometry.attributes.position;

    // Create InstancedBufferAttributes for position and color
    const instancePositions = new THREE.InstancedBufferAttribute(vertices, 3);
    const instanceColors = new THREE.InstancedBufferAttribute(colors, 3);

    this.vertexGeometry.setAttribute("instancePosition", instancePositions);
    this.vertexGeometry.setAttribute("instanceColor", instanceColors);

    // Create shader material
    const vertexMaterial = new THREE.ShaderMaterial({
      vertexShader: `
      attribute vec3 instancePosition;
      attribute vec3 instanceColor;
      varying vec3 vColor;
      void main() {
        vColor = instanceColor;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(instancePosition + position, 1.0);
      }
    `,
      fragmentShader: `
      varying vec3 vColor;
      void main() {
        gl_FragColor = vec4(vColor, 1.0);
      }
    `,
    });

    // Create Mesh for instanced rendering
    const vertexMesh = new THREE.Mesh(this.vertexGeometry, vertexMaterial);
    this.scene.add(vertexMesh);

    // Add edges
    let edgeIdx = 0;
    for (const edge of this.lug2.getEdgeList()) {
      const fromIdx = edge.from;
      const toIdx = edge.to;

      // Coordinates of `from` vertex
      const x1 = vertices[fromIdx * 3];
      const y1 = vertices[fromIdx * 3 + 1];
      const z1 = vertices[fromIdx * 3 + 2];

      // Coordinates of `to` vertex
      const x2 = vertices[toIdx * 3];
      const y2 = vertices[toIdx * 3 + 1];
      const z2 = vertices[toIdx * 3 + 2];

      edges[edgeIdx++] = x1;
      edges[edgeIdx++] = y1;
      edges[edgeIdx++] = z1;
      edges[edgeIdx++] = x2;
      edges[edgeIdx++] = y2;
      edges[edgeIdx++] = z2;
    }

    // Create BufferGeometry for edges
    this.edgeGeometry = new THREE.BufferGeometry();
    this.edgeGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(edges, 3)
    );

    // Create LineSegments for edges
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const edgeLines = new THREE.LineSegments(this.edgeGeometry, edgeMaterial);
    this.scene.add(edgeLines);
  }

  update(time) {
    const vertices = this.vertexGeometry.attributes.instancePosition.array;

    const scaleFactor = 0.2;
    const halfWidth = ((this.size - 1) * scaleFactor) / 2;
    const halfHeight = ((this.size - 1) * scaleFactor) / 2;

    let vertexIdx = 0;
    // Oscillation frequency and amplitude are not needed anymore for vertices
    const elapsedTime = this.waves.clock.getElapsedTime();
    this.T = elapsedTime * 8;

    for (let i = 0; i < Math.sqrt(this.lug2.size); i++) {
      for (let j = 0; j < Math.sqrt(this.lug2.size); j++) {
        const x = i * scaleFactor - halfWidth;
        const y = this.waves.calculateWaveValue(i, j, this.T) / 100;
        const z = j * scaleFactor - halfHeight;

        vertices[vertexIdx++] = x;
        vertices[vertexIdx++] = y;
        vertices[vertexIdx++] = z;
      }
    }

    this.vertexGeometry.attributes.instancePosition.array = vertices;
    this.vertexGeometry.attributes.instancePosition.needsUpdate = true;

    const edges = this.edgeGeometry.attributes.position.array;

    let edgeIdx = 0;

    for (const edge of this.lug2.getEdgeList()) {
      const fromIdx = edge.from;
      const toIdx = edge.to;

      // Coordinates of `from` vertex
      const x1 = vertices[fromIdx * 3];
      const y1 = vertices[fromIdx * 3 + 1]; // Use the updated y-coordinate from the vertex
      const z1 = vertices[fromIdx * 3 + 2];

      // Coordinates of `to` vertex
      const x2 = vertices[toIdx * 3];
      const y2 = vertices[toIdx * 3 + 1]; // Use the updated y-coordinate from the vertex
      const z2 = vertices[toIdx * 3 + 2];

      edges[edgeIdx++] = x1;
      edges[edgeIdx++] = y1;
      edges[edgeIdx++] = z1;
      edges[edgeIdx++] = x2;
      edges[edgeIdx++] = y2;
      edges[edgeIdx++] = z2;
    }

    this.edgeGeometry.attributes.position.array = edges;
    this.edgeGeometry.attributes.position.needsUpdate = true;
  }
}

export { Game };
