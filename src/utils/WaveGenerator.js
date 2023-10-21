import * as THREE from "/modules/three.module.js";

class WaveGenerator {
  constructor(scene) {
    this.scene = scene;

    // Func Global Statuses
    this.t_ = [];
    this.clicks = 0;
    this.click_wave_origin_xy = [];
    this.chop_offset = 0;

    // Const
    this.clock = new THREE.Clock();
    this.T = 0;
    this.id_stack = [];
    this._amplitude = 100;
    this._humpfactor = 50;
    this._delay = -5;
  }

  wave(i, j, t, amplitude, humpfactor, posx, posy, delay) {
    return (
      amplitude *
      (1 / (1 + t)) *
      Math.exp(
        (-1 / humpfactor) *
          (-Math.sqrt((i - posx) ** 2 + (j - posy) ** 2) + t - delay) ** 2
      ) *
      Math.sin(
        Math.sqrt((i - posx) ** 2 + (j - posy) ** 2) * (1 / Math.log1p(2 + t)) -
          t
      ) *
      25
    );
  }

  //IJT Iterator
  _func(i, j, t) {
    let consolidated_wave_output = 0;

    for (let u = 1 + this.chop_offset; u <= this.clicks; u++) {
      let delta = this._wave(
        i,
        j,
        t - this.t_[u - 1],
        this._amplitude,
        this._humpfactor,
        this.click_wave_origin_xy[u - 1][0] * 10,
        this.click_wave_origin_xy[u - 1][1] * 10,
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
  update(time) {
    //Time
    const elapsedTime = this.clock.getElapsedTime();
    this.T = elapsedTime * 8;

    //Re-draw Vertices
    let M = 64;
    let N = 64;
    let scaler = 10;
    let vertices = [];

    for (let x = -M; x <= M; x += 1) {
      for (let z = -N; z <= N; z += 1) {
        vertices.push(
          x / scaler,
          (1.4 * this._func(x, z, this.T)) / scaler,
          z / scaler
        );
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    let material = new THREE.PointsMaterial({
      size: 0.02,
      sizeAttenuation: true,
      alphaTest: 0.5,
      transparent: true,
    });
    material.color.setHSL(0.6, 0.8, 0.9);
    const particles = new THREE.Points(geometry, material);

    this.scene.add(particles);

    // //Disposal
    // for (let k = 4; k <= this.scene.children.length; k++) {
    //   // console.log("In 4",  scene.children)
    //   this.scene.children[k - 1].geometry.dispose();
    //   this.scene.children[k - 1].material.dispose();
    //   this.scene.remove(this.scene.children[k]);
    // }
    // this.scene.remove(this.scene.children[1]);
    // particles.geometry.dispose();
    // particles.material.dispose();

    // //Tracking
    // this.id_stack.push(1);

    if (this.scene.children.length >= 1) {
      //Disposal
      //   for (let k = 4; k <= this.scene.children.length; k++) {
      //     // console.log("In 4",  scene.children)
      //     // this.scene.children[k - 1].geometry.dispose();
      //     // this.scene.children[k - 1].material.dispose();
      //     // this.scene.remove(this.scene.children[k]);
      //   }
      this.scene.remove(this.scene.children[0]);
      particles.geometry.dispose();
      particles.material.dispose();
    }
  }
}

export { WaveGenerator };
