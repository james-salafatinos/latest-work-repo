import * as THREE from "/modules/three.module.js";

class Particle {
  constructor(P, V, A, rf, af, m, isFixed ) {
    this.position = new Vector3(P) || new Vector3(0,0,0)
    this.velocity = new Vector3(V) || new Vector3(0,0,0)
    this.acceleration = new Vector3(A) || new Vector3(0,0,0)
    this.repulsionForce = rf || 0.1
    this.attractionForce = af || 0.1
    this.mass = m
    this.isFixed = isFixed
  }
}


  create() {

  }

  
  update() {
  
  }
  
}

class Game {

  constructor(scene) {
    this.scene = scene;

    this.create()

  }

  create() {

  }

  
  update() {
  
  }

  

}

export { Game };
