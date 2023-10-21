import * as THREE from "/modules/three.module.js";
import { MathUtils } from "/utils/MathUtils.js";

class Game {
  constructor(scene) {
    this.scene = scene;

    this.create();
  }

  
  f(x) {
    return x ** 4 - 2 * x + 1;
  }
  create() {
    let math = new MathUtils(this.scene);
    console.log("trapezoidalRule", math.trapezoidalRule(this.f, 10, 0, 2))
    console.log("simpsonsRule", math.simpsonsRule(this.f, 10, 0, 2))
  }

  update() {}



}

export { Game };
