import { Clock } from "/modules/three.module.js";

class WaveGenerator {
  constructor(scene, gridSize, gridSegments) {
    this.scene = scene;

    this.clock = new Clock();
    this.amplitude = .1;
    this.pulseWidth = 1;
    this.delay = 0;
    this.gridSize = gridSize;
    this.gridSegments = gridSegments;
    this.scale_factor = gridSize / gridSegments;
    this.propagationSpeed = 10;
    this.oscillationSpeed = 0.2;
    this.dissapation = 0.1;
    this.phaseMultiplier = 0.01;
    this.phaseStartOffset = Math.PI;
    this.radius = 0; // Adjust the multiplier as needed for the desired distance from the center
    this.num_waves = 1;

    this.restartPulse();
  }

  _wave(i, j, t, pos) {
    t *= this.propagationSpeed;
    const epsilon = 0.0001;
    const distance = Math.sqrt(
      (i - pos[0] + epsilon) ** 2 + (j - pos[1] + epsilon) ** 2
    );

    let v = Math.log1p(t);
    let waveform = Math.sin(
      (this.phaseMultiplier / v) * distance -
        this.oscillationSpeed * t +
        this.phaseStartOffset
    );
    let envelope = Math.pow(1 / (1 + t), this.dissapation);
    let pulse =
      this.amplitude *
      Math.exp((-1 / this.pulseWidth) * (-distance + t - this.delay) ** 2);

    return pulse * envelope //* waveform;
  }

  _func(i, j, t) {
    let consolidated_wave_output = 0;

    // Calculate the effect of the original wave sources
    for (let u = 1 + this.chop_offset; u <= this.clicks; u++) {
      consolidated_wave_output += this._wave(
        i,
        j,
        t - this.t_[u - 1],
        this.click_wave_origin_xy[u - 1]
      );
    }

    // Calculate the effect of the reflected wave sources
    for (const point of this.reflected_wave_sources) {
      consolidated_wave_output += this._wave(i, j, t, point);
    }

    return consolidated_wave_output;
  }

  calculateWaveValue(i, j, t) {
    return this._func(i, j, t);
  }

  calculateReflections(point, depth) {
    if (depth <= 0) return [];

    let reflectedPoints = [];

    // Left boundary
    reflectedPoints.push([-point[0], point[1]]);
    // Right boundary
    reflectedPoints.push([2 * this.gridSize - point[0], point[1]]);
    // Bottom boundary
    reflectedPoints.push([point[0], -point[1]]);
    // Top boundary
    reflectedPoints.push([point[0], 2 * this.gridSize - point[1]]);

    let deeperReflections = [];
    for (const reflectedPoint of reflectedPoints) {
      deeperReflections.push(
        ...this.calculateReflections(reflectedPoint, depth - 1)
      );
    }

    return reflectedPoints.concat(deeperReflections);
  }
  restartPulse() {
    this.click_wave_origin_xy = Array(this.num_waves)
      .fill(null)
      .map((_, index) => {
        let angle = ((2 * Math.PI) / this.num_waves) * index;
        return [
          this.gridSize / 2 + this.radius * Math.cos(angle),
          this.gridSize / 2 + this.radius * Math.sin(angle),
        ];
      });

    const maxReflectionDepth = 5; // Adjust as needed
    this.reflected_wave_sources = [];
    for (const point of this.click_wave_origin_xy) {
      this.reflected_wave_sources.push(
        ...this.calculateReflections(point, maxReflectionDepth)
      );
    }

    this.t_ = Array(this.click_wave_origin_xy.length).fill(0);
    this.clicks = this.t_.length;
    this.chop_offset = 0;
  }
  restartSimulation() {
    this.clock.start(); // Restart the clock
    console.log(this.waveGenerator);
  }
}

export { WaveGenerator };
