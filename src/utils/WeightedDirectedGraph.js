class WeightedDirectedGraph {
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
  
          this.edgeList.push({ from: i, to: targetNode, weight });
        }
      }
    }
  
    // Add an edge from node `from` to node `to` with a given weight
    addEdge(from, to, weight) {
      if (from >= this.size || to >= this.size) {
        console.error("Invalid node index");
        return;
      }
      this.edgeList.push({ from, to, weight });
    }
  
    // Add a vertex to the graph
    addVertex() {
      this.size++;
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
  
  export { WeightedDirectedGraph };