import { Clock } from "/modules/three.module.js";

class WaveGenerator {
  constructor(scene, gridSize, gridSegments) {
    this.scene = scene;

    this.clock = new Clock();
    this.amplitude = 10;
    this.pulseWidth = 50;
    this.delay = 0;
    this.gridSize = gridSize;
    this.gridSegments = gridSegments;
    this.scale_factor = gridSize / gridSegments;
    this.propagationSpeed = 5;
    this.oscillationSpeed = .2;
    this.dissapation = .1;
    this.phaseMultiplier = .01
    this.phaseStartOffset = Math.PI/4 ;
    this.radius = this.gridSize * 0.4; // Adjust the multiplier as needed for the desired distance from the center
    this.num_waves = 5

    this.restartPulse()

  }

  _wave(i, j, t, pos) {
    t *= this.propagationSpeed;
    const epsilon = 0.0001;
    const distance = Math.sqrt(
      (i - pos[0] + epsilon) ** 2 + (j - pos[1] + epsilon) ** 2
    );

    let v = Math.log1p(t);
    let waveform = Math.sin(this.phaseMultiplier/v * distance - this.oscillationSpeed * t + this.phaseStartOffset);
    let envelope = Math.pow(1 / (1 + t), this.dissapation);
    let pulse = this.amplitude * Math.exp(
      (-1 / this.pulseWidth) * (-distance + t - this.delay) ** 2
    );
    
    
    return (
      pulse*envelope*waveform
    );
  }

  _func(i, j, t) {
    let consolidated_wave_output = 0;

    for (let u = 1 + this.chop_offset; u <= this.clicks; u++) {
      consolidated_wave_output += this._wave(
        i,
        j,
        t - this.t_[u - 1],
        this.click_wave_origin_xy[u - 1]
      );
    }

    return consolidated_wave_output;
  }

  calculateWaveValue(i, j, t) {
    return this._func(i, j, t);
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
  this.t_ = Array(this.click_wave_origin_xy.length).fill(0);
  this.clicks = this.t_.length;
  this.chop_offset = 0;
  }
  restartSimulation() {
    this.clock.start(); // Restart the clock
    console.log(this.waveGenerator)
}
}

export { WaveGenerator };
