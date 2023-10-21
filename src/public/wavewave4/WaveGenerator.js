import { Clock } from "/modules/three.module.js";

/**
 * Class responsible for generating wave simulations.
 */
class WaveSimulator {
  constructor(scene, gridSize, gridSegments) {
    this.scene = scene;
    this.clock = new Clock();

    // Wave properties
    this.amplitude = 0.1;
    this.pulseWidth = 1;
    this.delay = 0;
    this.propagationSpeed = 4;
    this.oscillationSpeed = 0.2;
    this.dissipation = 0.4;
    this.phaseMultiplier = 0.01;
    this.phaseStartOffset = 0;

    // Grid properties
    this.gridSize = gridSize;
    this.gridSegments = gridSegments;
    this.scaleFactor = gridSize / gridSegments;

    // Wave source properties
    this.radius = 15;
    this.numWaves = 3;

    this.initializeWaves();
  }

  /**
   * Calculate the value of a wave at a given position and time.
   */
  _calculateWaveValue(i, j, t, source) {
    const distance = Math.sqrt(
      (i - source[0]) ** 2 + (j - source[1]) ** 2
    );
    const envelope = Math.pow(1 / (1 + t * this.propagationSpeed), this.dissipation);
    const pulse = this.amplitude * Math.exp(
      (-1 / this.pulseWidth) * (-distance + t * this.propagationSpeed - this.delay) ** 2
    );

    return pulse * envelope;
  }

  /**
   * Calculate the consolidated effect of all wave sources.
   */
  _aggregateWaveEffect(i, j, t) {
    let totalEffect = 0;

    for (const source of this.waveSources) {
      totalEffect += this._calculateWaveValue(i, j, t - source.time, source.position);
    }

    for (const source of this.reflectedSources) {
      totalEffect += this._calculateWaveValue(i, j, t, source);
    }

    return totalEffect;
  }

  getWaveEffect(i, j, t) {
    return this._aggregateWaveEffect(i, j, t);
  }

  /**
   * Calculate reflected wave sources.
   */
  _calculateReflections(source, depth) {
    if (depth <= 0) return [];

    const reflections = [
      [-source[0], source[1]], // Left boundary
      [2 * this.gridSize - source[0], source[1]], // Right boundary
      [source[0], -source[1]], // Bottom boundary
      [source[0], 2 * this.gridSize - source[1]] // Top boundary
    ];

    let deeperReflections = reflections.flatMap(reflected => 
      this._calculateReflections(reflected, depth - 1)
    );

    return reflections.concat(deeperReflections);
  }

  /**
   * Initialize wave sources and their reflections.
   */
  initializeWaves() {
    const maxReflectionDepth = 5;

    this.waveSources = Array.from({ length: this.numWaves }, (_, index) => {
      const angle = ((2 * Math.PI) / this.numWaves) * index;
      return {
        position: [
          this.gridSize / 2 + this.radius * Math.cos(angle),
          this.gridSize / 2 + this.radius * Math.sin(angle)
        ],
        time: 0
      };
    });

    this.reflectedSources = this.waveSources.flatMap(source => 
      this._calculateReflections(source.position, maxReflectionDepth)
    );
  }

  /**
   * Restart the wave simulation.
   */
  restartSimulation() {
    this.clock.start();
    this.initializeWaves();
    console.log("Simulation restarted");
  }
}

export { WaveSimulator };
