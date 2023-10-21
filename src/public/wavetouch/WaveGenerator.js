import * as THREE from "/modules/three.module.js";

class WaveGenerator {
  constructor(scene, gridSize, gridSegments) {
    this.scene = scene;

    // Const
    this.clock = new THREE.Clock();
    this.T = 0;
    this.id_stack = [];
    this._amplitude = 10;
    this._humpfactor = 5;
    this._delay = 0;
    this.gridSize = gridSize;
    this.gridSegments = gridSegments;
    this.scale_factor = gridSize / gridSegments;
    this.speed_factor = 4
    this.decay_factor = 0.5
 
    this.click_wave_origin_xy = [
      [this.gridSize / 2, this.gridSize / 2], [this.gridSize / 2.1, this.gridSize / 2.1] // x, y coordinates for the first click
      // [0, 0], // x, y coordinates for the second click
    ];
    this.t_ = Array(this.click_wave_origin_xy.length).fill(0); // Initialize with zeros; assuming each click happened at time=0 for simplicity
    this.clicks = this.t_.length; // Set to the number of click wave origins
    this.chop_offset = 0;
  }

  _wave(i, j, t, amplitude, humpfactor, posx, posy, delay) {
    t *= this.speed_factor
    const epsilon = 0.0001; // small offset to avoid zero in square root
    return (
      amplitude *
      Math.pow(1 / (1 + t),   this.decay_factor) *
      Math.exp(
        (-1 / humpfactor) *
          (-Math.sqrt((i - posx + epsilon) ** 2 + (j - posy + epsilon) ** 2) +
            t -
            delay) **
            2
      ) *
      Math.sin(
        Math.sqrt((i - posx + epsilon) ** 2 + (j - posy + epsilon) ** 2) *
          (1 / Math.log1p(2 + t)) -
          t
      ) *
      this.scale_factor
    );
  }

  // IJT Iterator
  _func(i, j, t) {
    let consolidated_wave_output = 0;

    for (let u = 1 + this.chop_offset; u <= this.clicks; u++) {
      let delta = this._wave(
        i,
        j,
        t - this.t_[u - 1],
        this._amplitude,
        this._humpfactor,
        this.click_wave_origin_xy[u - 1][0],
        this.click_wave_origin_xy[u - 1][1],
        this._delay
      );
      consolidated_wave_output += delta;
    }
    return consolidated_wave_output;
  }

  // Public method to get wave value
  calculateWaveValue(i, j, t) {
    return this._func(i, j, t);
  }
}

export { WaveGenerator };
