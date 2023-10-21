import * as THREE from "/modules/three.module.js";

class LatticeUndirectedGraph {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.size = rows * cols;
    this.edgeSet = new Set(); // Using a Set instead of an array for faster lookups

    this.initializeLatticeEdges();
  }

  // Create a unique key for an edge
  createEdgeKey(from, to) {
    return Math.min(from, to) + "_" + Math.max(from, to);
  }

  // Initialize the graph with lattice edges
  initializeLatticeEdges() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const currentNode = row * this.cols + col;

        // North neighbor
        if (row > 0) {
          this.addEdge(currentNode, (row - 1) * this.cols + col, 1);
        }

        // South neighbor
        if (row < this.rows - 1) {
          this.addEdge(currentNode, (row + 1) * this.cols + col, 1);
        }

        // East neighbor
        if (col < this.cols - 1) {
          this.addEdge(currentNode, row * this.cols + (col + 1), 1);
        }

        // West neighbor
        if (col > 0) {
          this.addEdge(currentNode, row * this.cols + (col - 1), 1);
        }
      }
    }
  }

  // Add an edge between nodes `from` and `to` with a given weight
  addEdge(from, to, weight) {
    if (from >= this.size || to >= this.size) {
      console.error("Invalid node index");
      return;
    }

    const edgeKey = this.createEdgeKey(from, to);
    if (!this.edgeSet.has(edgeKey)) {
      this.edgeSet.add(edgeKey);
    }
  }

  // Remove an edge between nodes `from` and `to`
  removeEdge(from, to) {
    const edgeKey = this.createEdgeKey(from, to);
    if (this.edgeSet.has(edgeKey)) {
      this.edgeSet.delete(edgeKey);
    } else {
      console.error("Edge not found");
    }
  }

  // Get the edge list
  getEdgeList() {
    const edgeList = [];
    for (const edgeKey of this.edgeSet) {
      const [from, to] = edgeKey.split("_").map(Number);
      edgeList.push({ from, to, weight: 1 }); // Assuming weight is 1 as in your original code
    }
    return edgeList;
  }

  randomlyRemoveEdges(probability) {
    for (const edgeKey of this.edgeSet) {
      if (Math.random() < probability) {
        this.edgeSet.delete(edgeKey);
      }
    }
  }

  // Print the graph for debugging purposes
  printGraph() {
    console.log("Edge List:");
    for (const edge of this.getEdgeList()) {
      console.log(`(${edge.from}, ${edge.to}, ${edge.weight})`);
    }
  }
}

export { LatticeUndirectedGraph };
