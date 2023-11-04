import * as THREE from "/modules/three.module.js";
import { LightManager } from "/utils/LightsManager.js";
class Game {
  constructor(scene) {
    this.scene = scene;
    this.ball = null;
    this.arrow = null; // The arrow helper to visualize the ball's direction
    this.speed = 0.05;
    this.sphereRadius = 10; // The radius of the sphere enclosure
    this.bounceNormal = new THREE.Vector3(); // To store the bounce normal
    this.rotationStartTime = 0; // When the rotation starts
    this.rotationEndTime = 0; // When the rotation should end
    this.startQuaternion = new THREE.Quaternion(); // The sphere's quaternion at the start of the rotation
    this.endQuaternion = new THREE.Quaternion(); // The target quaternion for the sphere

    this.create();
  }

  create() {
    let lightManager = new LightManager(this.scene);
    // lightManager.addPointLight(0xffffff, 1, 100, { x: 5, y: 10, z: 5 });

    lightManager.addDirectionalLight();
    // Create the enclosure sphere
    const sphereGeometry = new THREE.SphereGeometry(this.sphereRadius, 32, 32);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      wireframe: false,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
    });
    const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereMesh.receiveShadow = true; // Spheres can now receive shadows
    this.sphereMesh = sphereMesh;
    this.scene.add(sphereMesh);

    // Create the billiard ball
    const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.ball = new THREE.Mesh(ballGeometry, ballMaterial);
    this.ball.position.set(0, 0, this.sphereRadius - 5.5);
    this.ball.castShadow = true; // Ball can now cast shadows
    this.ball.receiveShadow = true; // Ball can now receive shadows
    this.scene.add(this.ball);

    // Initial direction and rotation
    const initialDirection = new THREE.Vector3(
      Math.random(),
      Math.random(),
      Math.random()
    ).normalize();
    this.ball.velocity = initialDirection.clone().multiplyScalar(this.speed);
    this.ball.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      initialDirection
    );

    // Create an arrow helper to visualize the direction and velocity
    const arrowDirection = this.ball.velocity.clone().normalize();
    const arrowLength = this.ball.velocity.length();
    const arrowColor = 0x00ff00; // Green color for the arrow
    this.arrow = new THREE.ArrowHelper(
      arrowDirection,
      this.ball.position,
      arrowLength,
      arrowColor
    );
    this.scene.add(this.arrow); // Add the arrow to the scene
  }

  update() {
    // Update ball position
    this.ball.position.add(this.ball.velocity);

    // Update the arrow's direction and position
    const arrowDirection = this.ball.velocity.clone().normalize();
    this.arrow.setDirection(arrowDirection.multiplyScalar(-1));
    this.arrow.position.copy(this.ball.position);

    // Optionally, you can scale the arrow length based on the speed (velocity magnitude)
    const arrowLength = this.ball.velocity.length();
    this.arrow.setLength(-2, -1); //(arrowLength, 50*0.25 * arrowLength, 50*.5 * arrowLength);
    //this.arrow.setLength(arrowLength, 50*0.25 * arrowLength, 50*.5 * arrowLength); // Local Viewport

    // Check collision with sphere's interior
    if (this.ball.position.length() >= this.sphereRadius - 0.5) {
      // Calculate bounce by reflecting the velocity across the normal
      this.bounceNormal.copy(this.ball.position).normalize();
      console.log(this.bounceNormal);
      this.ball.velocity.reflect(this.bounceNormal);

      const raycaster = new THREE.Raycaster(
        this.ball.position,
        this.ball.velocity.clone().normalize()
      );
      const intersects = raycaster.intersectObject(this.sphereMesh);

      // Check if we have an intersection point and if a new rotation should start
      if (
        intersects.length > 0 &&
        this.rotationEndTime <= this.rotationStartTime
      ) {
        const nextCollisionNormal = intersects[0].point.clone().normalize();
        this.startQuaternion.copy(this.sphereMesh.quaternion);
        this.endQuaternion.setFromUnitVectors(
          this.bounceNormal,
          nextCollisionNormal
        );

        this.rotationStartTime = performance.now(); // Current time in milliseconds
        // Calculate the time it will take for the ball to reach the next collision
        // Estimate the time based on the speed of the ball and the distance to travel
        const distanceToTravel = this.ball.position.distanceTo(
          intersects[0].point
        );
        const travelTime = distanceToTravel / this.speed;
        this.rotationEndTime = this.rotationStartTime + travelTime;
      }

      // Check if we have an intersection point
      if (intersects.length > 0) {
        const nextCollisionPoint = intersects[0].point;
        const nextCollisionNormal = nextCollisionPoint.clone().normalize(); // Normalize to get the normal

        // Compute the rotation needed to align the current bounce normal with the next one
        const quaternionChange3 = new THREE.Quaternion();
        quaternionChange3.setFromUnitVectors(
          this.bounceNormal,
          nextCollisionNormal
        );

        // Apply the rotation to the sphere mesh
        this.sphereMesh.quaternion.multiplyQuaternions(
          quaternionChange3,
          this.sphereMesh.quaternion
        );
      }

      // Adjust quaternion to align the ball's up direction with the bounce normal
      const quaternionChange = new THREE.Quaternion();
      quaternionChange.setFromUnitVectors(this.ball.up, this.bounceNormal);
      this.ball.quaternion.multiplyQuaternions(
        quaternionChange,
        this.ball.quaternion
      );

      // Prevent the ball from moving outside the sphere
      this.ball.position.copy(
        this.bounceNormal.multiplyScalar(this.sphereRadius - 0.5)
      );
    }
  }
}

export { Game };
