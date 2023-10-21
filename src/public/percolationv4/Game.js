import * as THREE from "/modules/three.module.js";
import { UnionFind } from "/utils/UnionFind.js";
import { LatticeUndirectedGraph } from "/utils/LatticeUndirectedGraph.js";
import { WaveGenerator } from "/utils/WaveGenerator.js";

// Constants and Magic Numbers
const INIT_SIZE = 200;
const EDGE_REMOVAL_RATE = 0.5;
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
    this.init();
  }

  init() {
    this.lug2 = new LatticeUndirectedGraph(this.size, this.size);
    this.lug2.randomlyRemoveEdges(EDGE_REMOVAL_RATE);
    this.uf = new UnionFind(this.size * this.size);
    this.initializeUnionFind();
    this.visualize();
  }

  initializeUnionFind() {
    for (const edge of this.lug2.getEdgeList()) {
      this.uf.union(edge.from, edge.to);
    }
  }

  getRandomColor() {
    let color = "0x";
    for (let i = 0; i < COLOR_STRING_LENGTH; i++) {
      color += COLOR_LETTERS[Math.floor(Math.random() * COLOR_BASE)];
    }
    return Number(color);
  }

  generateColors() {
    const rootToColor = new Map();
    for (let i = 0; i < this.uf.parent.length; i++) {
      const root = this.uf.find(i);
      rootToColor.set(root, rootToColor.get(root) || this.getRandomColor());
    }
    return this.mapColors(rootToColor);
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

  generateVertices() {
    const vertices = new Float32Array(this.lug2.size * 3);
    let vertexIdx = 0;
    const halfWidth = ((this.size - 1) * SCALE_FACTOR) / 2;
    const halfHeight = ((this.size - 1) * SCALE_FACTOR) / 2;
    for (let i = 0; i < Math.sqrt(this.lug2.size); i++) {
      for (let j = 0; j < Math.sqrt(this.lug2.size); j++) {
        vertices.set([i * SCALE_FACTOR - halfWidth, 0, j * SCALE_FACTOR - halfHeight], vertexIdx);
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
    const colors = this.generateColors();

    this.createVertexMesh(vertices, colors);
    this.createEdgeLines(edges);
  }

  createVertexMesh(vertices, colors) {
    const geometry = new THREE.InstancedBufferGeometry();
    const baseGeometry = new THREE.BoxBufferGeometry(BOX_DIMENSION, BOX_DIMENSION, BOX_DIMENSION);
    geometry.index = baseGeometry.index;
    geometry.attributes.position = baseGeometry.attributes.position;
    geometry.setAttribute("instancePosition", new THREE.InstancedBufferAttribute(vertices, 3));
    geometry.setAttribute("instanceColor", new THREE.InstancedBufferAttribute(colors, 3));

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

  update(time) {
    // Add update logic here, if needed
  }
}

export { Game };
