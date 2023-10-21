import * as THREE from "/modules/three.module.js";

class MathUtils {
  constructor(scene) {
    this.scene = scene;
  }

  create() {}

  update() {}

  trapezoidalRule(f, n, a, b) {
    let h = (b - a) / n;
    let sum = 0;
    for (let i = 1; i < n; i++) {
      sum += f(a + i * h);
    }
    sum += (f(a) + f(b)) / 2;
    return sum * h;
  }
  simpsonsRule(f, n, a, b) {
    let h = (b - a) / n;
    let term1 = h * (1 / 3);
    let term2 = f(a) + f(b);

    let sub_sum1 = 0;
    for (let k = 1; k <= n / 2; k++) {
      sub_sum1 += f(a + (2 * k - 1) * h);
    }
    let sub_sum2 = 0;
    for (let k = 1; k <= n / 2 - 1; k++) {
      sub_sum2 += f(a + 2 * k * h);
    }
    sub_sum1 *= 4;
    sub_sum2 *= 2;

    return term1 * (term2 + sub_sum1 + sub_sum2);
  }
}

export { MathUtils };
