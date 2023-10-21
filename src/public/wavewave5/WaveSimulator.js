import { Clock } from "/modules/three.module.js";

/**
 * Class responsible for generating wave simulations.
 */
class WaveSimulator {
  constructor(scene, gridSize, gridSegments) {
    this.scene = scene;
    this.clock = new Clock();

    // Wave properties
    this.amplitude = 0.3;
    this.pulseWidth = .1;
    this.delay = 0;
    this.propagationSpeed = 4;
    this.oscillationSpeed = 0.2;
    this.dissipation = 1.2;

    // Grid properties
    this.gridSize = gridSize;
    this.gridSegments = gridSegments;
    this.scaleFactor = gridSize / gridSegments;

    // Wave source properties
    this.radius = 6;
    this.numWaves = 3;

    this.initializeWaves();
  }

  phaseToColor(amplitude, phase) {
    // Convert phase to a value between 0 and 1.
    let hue = (phase + Math.PI) / (2 * Math.PI);  // assumes phase is between -π and π
  
    // Map amplitude to a saturation value (this can be modified based on your needs).
    let saturation = amplitude > 0.01 ? 1 : amplitude * 100;
  
    // Convert HSV to RGB (using the THREE.Color function for simplicity)
    let color = new THREE.Color();
    color.setHSL(hue, saturation, 0.5);
  
    return color;
  }
  /**
   * Calculate the value of a wave at a given position and time.
   */
  _calculateWaveValue(i, j, t, source) {
    const distance = Math.sqrt((i - source[0]) ** 2 + (j - source[1]) ** 2);

    const envelope = Math.pow(
      1 / (1 + t * this.propagationSpeed),
      this.dissipation
    );
    const pulse =
      this.amplitude *
      Math.exp(
        (-1 / this.pulseWidth) *
          (-distance + t * this.propagationSpeed - this.delay) ** 2
      );

   
    let amplitude =  pulse * envelope
    let phase = amplitude *4000

    // phase += 1000

    return { amplitude: amplitude, phase: phase };
  }

  /**
   * Calculate the consolidated effect of all wave sources.
   */
  _aggregateWaveEffect(i, j, t) {
    let totalAmplitude = 0;
    let totalPhase = 0;
    let numSources = 0;

    for (const source of this.waveSources) {
      const waveValue = this._calculateWaveValue(
        i,
        j,
        t - source.time,
        source.position
      );
      totalAmplitude += waveValue.amplitude;
      totalPhase += waveValue.phase;
      numSources++;
    }

    for (const source of this.reflectedSources) {
      const waveValue = this._calculateWaveValue(i, j, t, source);
      totalAmplitude += waveValue.amplitude;
      totalPhase += waveValue.phase;
      numSources++;
    }

    // Average the phase
    totalPhase /= numSources;

    return {
      amplitude: totalAmplitude,
      phase: totalPhase,
    };
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
      [source[0], 2 * this.gridSize - source[1]], // Top boundary
    ];

    let deeperReflections = reflections.flatMap((reflected) =>
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
          this.gridSize / 2 + this.radius * Math.sin(angle),
        ],
        time: 0,
      };
    });

    this.reflectedSources = this.waveSources.flatMap((source) =>
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
