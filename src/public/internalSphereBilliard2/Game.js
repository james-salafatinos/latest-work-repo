import * as THREE from "/modules/three.module.js";
import { LightManager } from "/utils/LightsManager.js";
class Game {
  constructor(scene) {
    this.scene = scene;
    this.ball = null;
    this.arrow = null; // The arrow helper to visualize the ball's direction
    this.speed = 10;
    this.sphereRadius = 10; // The radius of the sphere enclosure
    this.bounceNormal = new THREE.Vector3(); // To store the bounce normal
    this.rotationStartTime = 0; // When the rotation starts
    this.rotationEndTime = 0; // When the rotation should end
    this.startQuaternion = new THREE.Quaternion(); // The sphere's quaternion at the start of the rotation
    this.endQuaternion = new THREE.Quaternion(); // The target quaternion for the sphere

    this.ballPath = []; // Array to store the ball's positions
    this.ballPathLimit = 100000; // Limit how many positions we store to prevent memory issues
    this.lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff }); // Blue color for the path line
    this.lineGeometry = new THREE.BufferGeometry();
    this.pathLine = new THREE.Line(this.lineGeometry, this.lineMaterial);
    // Add the line to the scene
    this.scene.add(this.pathLine);


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

    // Set the ball's position to a random point within the sphere
    const randomRadius = Math.cbrt(Math.random()) * this.sphereRadius; // Use cube root to ensure uniform distribution
    const theta = Math.random() * Math.PI * 2; // Random angle in the xy-plane
    const phi = Math.acos(Math.random() * 2 - 1); // Random angle from the z-axis

    // Convert spherical coordinates to Cartesian coordinates
    const x = randomRadius * Math.sin(phi) * Math.cos(theta);
    const y = randomRadius * Math.sin(phi) * Math.sin(theta);
    const z = randomRadius * Math.cos(phi);

    // Set the ball's position
  
    this.ball.position.set(x, y, z);
    this.ball.castShadow = true; // Ball can now cast shadows
    this.ball.receiveShadow = true; // Ball can now receive shadows
    this.scene.add(this.ball);

    // Initial direction and rotation
    const initialDirection = new THREE.Vector3(
      Math.random() - 0.5, // Shift by 0.5 to allow negative values
      Math.random() - 0.5,
      Math.random() - 0.5
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

  tracePath() {
    // Add the current position of the ball to the path
    this.ballPath.push(this.ball.position.clone());

    // If we exceed the path limit, remove the oldest position
    if (this.ballPath.length > this.ballPathLimit) {
      this.ballPath.shift();
    }

    // Update the line geometry to the new path
    const positions = new Float32Array(this.ballPath.length * 3);
    this.ballPath.forEach((pos, i) => {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
    });
    this.lineGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    this.lineGeometry.setDrawRange(0, this.ballPath.length);
    this.lineGeometry.attributes.position.needsUpdate = true; // Required when updating the attribute later
    this.lineGeometry.computeBoundingSphere(); // Required when the positions change
  }

  update(deltaTime) {
    // Define gravity and initialize acceleration if not already done
    this.gravity = new THREE.Vector3(0, -9.81, 0); // Gravity acceleration vector
    this.ball.acceleration = this.gravity.clone(); // Initial acceleration is just gravity

    // Scale the gravity to match the scene's scale if needed (e.g., if your scene uses units where 1 unit != 1 meter)
    const scaleFactor = 1; // Adjust this scale factor to match your scene
    this.ball.acceleration.multiplyScalar(scaleFactor);

    // Update ball velocity with gravity using simple Euler integration
    // Euler integration: v = v0 + a * t
    const velocityChange = this.ball.acceleration
      .clone()
      .multiplyScalar(deltaTime);
    this.ball.velocity.add(velocityChange);

    // Update ball position using the new velocity
    // Euler integration: x = x0 + v * t
    const positionChange = this.ball.velocity.clone().multiplyScalar(deltaTime);
    this.ball.position.add(positionChange);

    // Update the arrow's direction and position
    const arrowDirection = this.ball.velocity.clone().normalize();
    this.arrow.setDirection(arrowDirection.multiplyScalar(-1));
    this.arrow.position.copy(this.ball.position);

    // Optionally, you can scale the arrow length based on the speed (velocity magnitude)
    const arrowLength = this.ball.velocity.length();
    this.arrow.setLength(-2, -1); //(arrowLength, 50*0.25 * arrowLength, 50*.5 * arrowLength);
    //this.arrow.setLength(arrowLength, 50*0.25 * arrowLength, 50*.5 * arrowLength); // Local Viewport

    this.tracePath();

    // Check collision with sphere's interior
    if (this.ball.position.length() >= this.sphereRadius - 0.5) {
      // Calculate bounce by reflecting the velocity across the normal
      this.bounceNormal.copy(this.ball.position).normalize();
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
