import * as THREE from "/modules/three.module.js";

import { UnionFind } from "/utils/UnionFind.js";

import { LatticeUndirectedGraph } from "/utils/LatticeUndirectedGraph.js";

class Game {
  constructor(scene) {
    this.scene = scene;
    this.size = 400;
    this.create();
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
    const edges = new Float32Array(this.lug2.getEdgeList().length * 6);

    let vertexIdx = 0;

    const radius = 20; // Radius of the sphere
    // Generate heights
    const heights = new Float32Array(this.lug2.size);
    let heightIdx = 0;
    const amplitude = 2.0; // Adjust this to control the range of heights
    const frequency = 2.0; // Adjust this to control the number of waves

    const n = Math.sqrt(this.lug2.size); // Number of vertices along one axis
    for (let i = 0; i < n; i++) {
      const phi = (Math.PI * i) / (n - 1); // Latitude
      for (let j = 0; j < n; j++) {
        const theta = (2 * Math.PI * j) / (n - 1); // Longitude
        heights[heightIdx++] =
          amplitude * Math.sin(frequency * theta) * Math.cos(frequency * phi);

        // Convert spherical to Cartesian coordinates
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        vertices[vertexIdx++] = x;
        vertices[vertexIdx++] = y;
        vertices[vertexIdx++] = z;
      }
    }
    // Create InstancedBufferGeometry for vertices
    const vertexGeometry = new THREE.InstancedBufferGeometry();
    vertexGeometry.instanceCount = this.lug2.size; // Set the instance count

    // Create a single geometry that will be instanced
    const baseGeometry = new THREE.BoxBufferGeometry(0.12, 0.12, 0.12); // You can change the shape here
    vertexGeometry.index = baseGeometry.index;
    vertexGeometry.attributes.position = baseGeometry.attributes.position;
    // Create InstancedBufferAttributes for position, color, and height
    const instancePositions = new THREE.InstancedBufferAttribute(vertices, 3);
    const instanceColors = new THREE.InstancedBufferAttribute(colors, 3);
    const instanceHeights = new THREE.InstancedBufferAttribute(heights, 1); // New attribute for heights

    vertexGeometry.setAttribute('instancePosition', instancePositions);
    vertexGeometry.setAttribute('instanceColor', instanceColors);
    vertexGeometry.setAttribute('instanceHeight', instanceHeights);  // Add this new attribute
    
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
    const vertexMesh = new THREE.Mesh(vertexGeometry, vertexMaterial);
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
    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setAttribute("position", new THREE.BufferAttribute(edges, 3));

    // Create LineSegments for edges
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    this.scene.add(edgeLines);
  }

  update() {}
}

export { Game };
