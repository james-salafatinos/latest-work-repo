import * as THREE from "/modules/three.module.js";

class UndirectedGraph {
  constructor(size) {
    
    this.size = size;
    this.edgeList = [];
    this.initializeRandomEdges();
  }

  // Initialize the graph with random edges and weights
  initializeRandomEdges() {
    for (let i = 0; i < this.size; i++) {
      // Randomly decide the number of outgoing edges for each node
      const numEdges = Math.floor(Math.random() * (this.size - 1));

      // Create a set to ensure unique edges
      const uniqueEdges = new Set();

      for (let j = 0; j < numEdges; j++) {
        let targetNode;

        // Ensure the target node is unique and not the same as the source node
        do {
          targetNode = Math.floor(Math.random() * this.size);
        } while (targetNode === i || uniqueEdges.has(targetNode));

        uniqueEdges.add(targetNode);

        // Randomly assign a weight to the edge
        const weight = Math.floor(Math.random() * 100) + 1;

        // Since it's an undirected graph, we only add one entry for each edge
        if (
          !this.edgeList.some(
            (edge) =>
              (edge.from === i && edge.to === targetNode) ||
              (edge.from === targetNode && edge.to === i)
          )
        ) {
          this.edgeList.push({ from: i, to: targetNode, weight });
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

    // Since it's an undirected graph, we only add one entry for each edge
    if (
      !this.edgeList.some(
        (edge) =>
          (edge.from === from && edge.to === to) ||
          (edge.from === to && edge.to === from)
      )
    ) {
      this.edgeList.push({ from, to, weight });
    }
  }

  // Add a vertex to the graph
  addVertex() {
    this.size++;
  }
  // Remove an edge between nodes `from` and `to`
  removeEdge(from, to) {
    if (from >= this.size || to >= this.size) {
      console.error("Invalid node index");
      return;
    }

    // Find the index of the edge to remove
    const edgeIndex = this.edgeList.findIndex(
      (edge) =>
        (edge.from === from && edge.to === to) ||
        (edge.from === to && edge.to === from)
    );

    if (edgeIndex !== -1) {
      // Remove the edge from the edge list
      this.edgeList.splice(edgeIndex, 1);
    } else {
      console.error("Edge not found");
    }
  }

  // Get the edge list
  getEdgeList() {
    return this.edgeList;
  }

  // Print the graph for debugging purposes
  printGraph() {
    console.log("Edge List:");
    for (const edge of this.edgeList) {
      console.log(`(${edge.from}, ${edge.to}, ${edge.weight})`);
    }
  }
}

export { UndirectedGraph };
