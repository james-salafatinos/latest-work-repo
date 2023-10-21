import * as THREE from "/modules/three.module.js";

class Game {
  constructor(scene) {
    this.scene = scene;
    this.balls = [];
    this.speed = 0.05;
    this.cornerThreshold = 0.1; // The threshold to check for corner hits

    // this.quadPoints = this.generateArc(
    //   new THREE.Vector3(0, 0, 0),
    //   10,
    //   0,
    //   2 * Math.PI,
    //   100
    // );
    // console.log(this.quadPoints);

    // Replace the generateArc with generateComplexShape to get the new shape
    this.quadPoints = this.generateComplexShape(
      new THREE.Vector3(0, 0, 0),
      10,
      100
    );

    this.edges = [];

    for (let i = 0; i < this.quadPoints.length; i++) {
      const p1 = this.quadPoints[i];
      const p2 = this.quadPoints[(i + 1) % this.quadPoints.length];
      const edge = new THREE.Line3(p1, p2);
      this.edges.push(edge);
    }

    this.create();
  }

  generateArc(center, radius, startAngle, endAngle, steps = 10) {
    const points = [];
    for (let i = 0; i <= steps; ++i) {
      const angle = startAngle + (endAngle - startAngle) * (i / steps);
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      points.push(new THREE.Vector3(x, y, 0));
    }
    return points;
  }
  generateComplexShape(center, radius, steps = 100) {
    const points = [];
    const n = 3.5; // Exponent for superellipse equation, change for different shapes
    const m = 2; // Another exponent for superellipse equation, change for different shapes

    for (let i = 0; i <= steps; ++i) {
      const theta = (i / steps) * (Math.PI * 2);
      const x =
        Math.pow(Math.abs(Math.cos(theta)), 2 / n) *
        radius *
        Math.sign(Math.cos(theta));
      const y =
        Math.pow(Math.abs(Math.sin(theta)), 2 / m) *
        radius *
        Math.sign(Math.sin(theta));
      points.push(new THREE.Vector3(center.x + x, center.y + y, 0));
    }

    return points;
  }
  create() {
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.laserSource = new THREE.Mesh(geometry, material);
    this.laserSource.position.set(0, 0, 0);
    this.scene.add(this.laserSource);

    const quadGeometry = new THREE.BufferGeometry().setFromPoints(
      this.quadPoints
    );
    const quadMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const quadLine = new THREE.LineLoop(quadGeometry, quadMaterial);
    this.scene.add(quadLine);
  }

  fireLaserBall() {

    const geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    const numRays = 16; // The number of rays you want to shoot
    const angleStep = (2 * Math.PI) / numRays; // The angle step between each ray

    for (let i = 0; i < numRays; i++) {
      const angle = i * angleStep;
      const laserBall = new THREE.Mesh(geometry, material.clone()); // clone material if you want to modify it per ball
      laserBall.position.copy(this.laserSource.position);

      // Set initial direction based on the angle
      laserBall.direction = new THREE.Vector3(
        Math.cos(angle),
        Math.sin(angle),
        0
      ).normalize();

      laserBall.lastReflectedEdge = null;  // Initialize with null
      this.scene.add(laserBall);
      this.balls.push(laserBall);
    }
  }

  
  handleReflection(laserBall) {
    const speedDirection = new THREE.Vector3().copy(laserBall.direction).multiplyScalar(this.speed);
    laserBall.position.add(speedDirection);

    let closestDistance = Infinity;
    let closestNormal = null;
    let closestEdge = null;

    const tempVector = new THREE.Vector3();
    const normalVector = new THREE.Vector3();

    // Corner case handling
    for (const point of this.quadPoints) {
      tempVector.copy(point).sub(laserBall.position);
      const distance = tempVector.length();

      if (distance < this.cornerThreshold) {
        closestNormal = tempVector.normalize();
        laserBall.direction.reflect(closestNormal);
        return; // Exit function early if we hit a corner
      }
    }

    // Edge handling
    const closestPoint = new THREE.Vector3();
    for (const edge of this.edges) {
      if (edge !== laserBall.lastReflectedEdge) { // Ignore the last hit edge
        edge.closestPointToPoint(laserBall.position, true, closestPoint);
        const distance = closestPoint.distanceTo(laserBall.position);

        if (distance < closestDistance) {
          closestDistance = distance;
          normalVector.subVectors(edge.end, edge.start).normalize();
          normalVector.set(normalVector.y, -normalVector.x, 0);
          closestNormal = normalVector;
          closestEdge = edge;
        }
      }
    }

    if (closestDistance < 0.05 && closestNormal) {
      laserBall.direction.reflect(closestNormal);
      laserBall.lastReflectedEdge = closestEdge; // Remember the last edge we hit

      // Revalidate the position to ensure it's within bounds.
      const revalidateDirection = new THREE.Vector3().copy(laserBall.direction).multiplyScalar(-this.speed);
      laserBall.position.add(revalidateDirection);
    }
  }
  

  update() {
    const currentTime = Date.now();
    if (!this.lastFireTime || currentTime - this.lastFireTime > 300) {
      this.fireLaserBall();
      this.lastFireTime = currentTime;
    }

    this.balls.forEach((ball) => this.handleReflection(ball));
  }
}

export { Game };
