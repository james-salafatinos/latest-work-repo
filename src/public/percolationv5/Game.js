import * as THREE from "/modules/three.module.js";
import { UnionFind } from "/utils/UnionFind.js";
import { LatticeUndirectedGraphSequential } from "/utils/LatticeUndirectedGraphSequential.js";
import { WaveGenerator } from "/utils/WaveGenerator.js";

// Constants and Magic Numbers
const INIT_SIZE = 100;
const COLOR_STRING_LENGTH = 6;
const COLOR_BASE = 16;
const COLOR_LETTERS = "0123456789ABCDEF";
const SCALE_FACTOR = 0.2;
const BOX_DIMENSION = 0.12;
const EDGE_LINE_COLOR = 0xffffff;

class Game {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.size = INIT_SIZE;
    this.waves = new WaveGenerator(scene);
    this.timeElapsed = 0;
    this.oscillationState = 0;
    this.probabilityThreshold = 0.5;

    this.init();
  }

  init() {
    this.lug2 = new LatticeUndirectedGraphSequential(this.size, this.size);
    this.uf = new UnionFind(this.size * this.size);
    this.initializeUnionFind();
    this.visualize();
  }

  updateOscillation() {
    this.oscillationState += 0.01;
    if (this.oscillationState >= 2 * Math.PI) {
      this.oscillationState = 0;
    }
    this.probabilityThreshold = 0.5 + 0.5 * Math.sin(this.oscillationState);
    console.log(this.probabilityThreshold);
  }

  initializeUnionFind() {
    for (const edge of this.lug2.getEdgeList()) {
      this.uf.union(edge.from, edge.to);
    }
    this.rootToColor = this.generateColors();
  }

  getRandomColor() {
    let color = "0x";
    for (let i = 0; i < COLOR_STRING_LENGTH; i++) {
      color += COLOR_LETTERS[Math.floor(Math.random() * COLOR_BASE)];
    }
    return Number(color);
  }

  generateColors(existingRootToColor) {
    const rootToColor = existingRootToColor || new Map();
    for (let i = 0; i < this.uf.parent.length; i++) {
      const root = this.uf.find(i);
      rootToColor.set(root, rootToColor.get(root) || this.getRandomColor());
    }
    return rootToColor;
  }

  mapColors(rootToColor) {
    const colors = new Float32Array(this.lug2.size * 3);
    let colorIdx = 0;
    for (let i = 0; i < this.uf.parent.length; i++) {
      const root = this.uf.find(i);
      const colorObject = new THREE.Color(rootToColor.get(root));
      colors.set([colorObject.r, colorObject.g, colorObject.b], colorIdx);
      colorIdx += 3;
    }
    return colors;
  }

  updateOscillation() {
    this.oscillationState += 0.01;
    if (this.oscillationState >= 2 * Math.PI) {
      this.oscillationState = 0;
    }
    this.probabilityThreshold = 0.5 + 0.5 * Math.sin(this.oscillationState);
    console.log(this.probabilityThreshold);
  }
  generateVertices() {
    const vertices = new Float32Array(this.lug2.size * 3);
    let vertexIdx = 0;
    const halfWidth = ((this.size - 1) * SCALE_FACTOR) / 2;
    const halfHeight = ((this.size - 1) * SCALE_FACTOR) / 2;
    for (let i = 0; i < Math.sqrt(this.lug2.size); i++) {
      for (let j = 0; j < Math.sqrt(this.lug2.size); j++) {
        vertices.set(
          [i * SCALE_FACTOR - halfWidth, 0, j * SCALE_FACTOR - halfHeight],
          vertexIdx
        );
        vertexIdx += 3;
      }
    }
    return vertices;
  }

  generateEdges(vertices) {
    const edges = new Float32Array(this.lug2.getEdgeList().length * 6);
    let edgeIdx = 0;
    for (const { from: fromIdx, to: toIdx } of this.lug2.getEdgeList()) {
      const [x1, y1, z1] = vertices.slice(fromIdx * 3, fromIdx * 3 + 3);
      const [x2, y2, z2] = vertices.slice(toIdx * 3, toIdx * 3 + 3);
      edges.set([x1, y1, z1, x2, y2, z2], edgeIdx);
      edgeIdx += 6;
    }
    return edges;
  }

  visualize() {
    const vertices = this.generateVertices();
    const edges = this.generateEdges(vertices);
    // const colors = this.generateColors();
    const colors = this.mapColors(this.rootToColor);
    this.createVertexMesh(vertices, colors);
    this.createEdgeLines(edges);
  }

  createVertexMesh(vertices, colors) {
    const geometry = new THREE.InstancedBufferGeometry();
    const baseGeometry = new THREE.BoxBufferGeometry(
      BOX_DIMENSION,
      BOX_DIMENSION,
      BOX_DIMENSION
    );
    geometry.index = baseGeometry.index;
    geometry.attributes.position = baseGeometry.attributes.position;
    geometry.setAttribute(
      "instancePosition",
      new THREE.InstancedBufferAttribute(vertices, 3)
    );
    geometry.setAttribute(
      "instanceColor",
      new THREE.InstancedBufferAttribute(colors, 3)
    );

    const material = this.createShaderMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
  }

  createEdgeLines(edges) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(edges, 3));
    const material = new THREE.LineBasicMaterial({ color: EDGE_LINE_COLOR });
    const lineSegments = new THREE.LineSegments(geometry, material);
    this.scene.add(lineSegments);
  }

  createShaderMaterial() {
    return new THREE.ShaderMaterial({
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
  }

  addEdgeWithProbability() {
    let edgeAdded = false;
    const addedEdges = this.lug2.randomlyAddEdge(this.probabilityThreshold);

    if (addedEdges) {
      edgeAdded = true;
      for (const edge of addedEdges) {
        this.uf.union(edge.from, edge.to);
      }
      this.rootToColor = this.generateColors(this.rootToColor);
    }

    return edgeAdded;
  }

  removeEdgeWithProbability() {
    let edgeRemoved = false;
    const removedEdges = this.lug2.randomlyRemoveEdge(this.probabilityThreshold);

    if (removedEdges) {
      edgeRemoved = true;
      
      // Reinitialize UnionFind
      this.uf = new UnionFind(this.size * this.size);
      for (const edge of this.lug2.getEdgeList()) {
        this.uf.union(edge.from, edge.to);
      }
      
      // Regenerate Colors
      this.rootToColor = this.generateColors(this.rootToColor);
    }

    return edgeRemoved;
  }


  update(time) {
    this.timeElapsed += time;

    // Update oscillation for both add and remove functions
    this.updateOscillation();

    const edgeAdded = this.addEdgeWithProbability();
    const edgeRemoved = this.removeEdgeWithProbability();

    if (edgeAdded || edgeRemoved) {
      while (this.scene.children.length > 0) {
        this.scene.remove(this.scene.children[0]);
      }
      this.visualize();
    }
  }
}

export { Game };
