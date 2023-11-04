import * as THREE from "/modules/three.module.js";

class Game {
  constructor(scene) {
    this.scene = scene;
    this.dataSize = 256;
    this.data = new Array(this.dataSize).fill(0);
    this.bars = [];
    this.twiddleFactors = [];

    this.create();
  }

  bitReverse(n, bits) {
    let reversed = 0;
    for (let i = 0; i < bits; i++) {
      reversed <<= 1;
      if (n & (1 << i)) {
        reversed |= 1;
      }
    }
    return reversed;
  }

  computeTwiddleFactors(N) {
    this.twiddleFactors = new Array(N).fill(0).map(_ => ({re: 0, im: 0}));
    for (let i = 0; i < N; i++) {
      this.twiddleFactors[i].re = Math.cos((2 * Math.PI * i) / N);
      this.twiddleFactors[i].im = -Math.sin((2 * Math.PI * i) / N);
    }
  }

  fft(data) {
    const N = data.length;
    const output = data.map((d, i) => ({re: data[this.bitReverse(i, Math.log2(N))], im: 0}));

    for (let s = 1; s <= Math.log2(N); s++) {
      let m = 1 << s;
      let halfM = m / 2;
      let w = {re: 1, im: 0};
      for (let j = 0; j < halfM; j++) {
        for (let k = j; k < N; k += m) {
          let t = {
            re: w.re * output[k + halfM].re - w.im * output[k + halfM].im,
            im: w.re * output[k + halfM].im + w.im * output[k + halfM].re
          };

          output[k + halfM].re = output[k].re - t.re;
          output[k + halfM].im = output[k].im - t.im;
          output[k].re += t.re;
          output[k].im += t.im;
        }
        let twiddle = this.twiddleFactors[halfM];
        w = {
          re: w.re * twiddle.re - w.im * twiddle.im,
          im: w.re * twiddle.im + w.im * twiddle.re
        };
      }
    }

    return output;
  }

  generateData() {
    for (let i = 0; i < this.dataSize; i++) {
      this.data[i] = Math.sin(2 * Math.PI * i / this.dataSize * 4) + 0.5 * Math.sin(2 * Math.PI * i / this.dataSize * 7);
    }
  }

  create() {
    this.generateData();
    this.computeTwiddleFactors(this.dataSize);
    let fftResult = this.fft(this.data);

    for (let i = 0; i < this.dataSize / 2; i++) {
      let magnitude = Math.sqrt(fftResult[i].re * fftResult[i].re + fftResult[i].im * fftResult[i].im);
      let geometry = new THREE.BoxGeometry(0.5, magnitude, 0.5);
      let material = new THREE.MeshBasicMaterial({color: 0x00ff00});
      let bar = new THREE.Mesh(geometry, material);
      bar.position.set(i - this.dataSize / 4, magnitude / 2, 0);
      this.scene.add(bar);
      this.bars.push(bar);
    }
  }

  update() {
    // ... (as before)
  }
}

export { Game };
