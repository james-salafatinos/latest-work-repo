import * as THREE from "/modules/three.module.js";

class Game {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.massPoints = [];
    this.springs = [];
    this.dampFactor = 0.5;
    this.gravity = new THREE.Vector2(0, -9.81);
    this.deltaTime = 0.00014; // Assume 60fps for now, can be adjusted.

    // Define numRows and numCols as instance variables
    this.numRows = 5;
    this.numCols = 5;
    this.spacing = 2;
    this.substeps = 5;

    // Group to hold lines/springs
    this.linesGroup = new THREE.Group();
    this.scene.add(this.linesGroup);

    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.selectedPoint = null;

    document.addEventListener("mousedown", this.onMouseDown.bind(this), false);
    document.addEventListener("mousemove", this.onMouseMove.bind(this), false);
    document.addEventListener("mouseup", this.onMouseUp.bind(this), false);

    this.create();
    this.drawBoundary();

  }


  onMouseDown(event) {
    event.preventDefault();

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera); // Make sure you have the camera instance available here

    const points = this.points;
    const intersects = this.raycaster.intersectObject(points);

    if (intersects.length > 0) {
      this.selectedPoint = intersects[0].index;
    }
  }

  onMouseMove(event) {
    if (this.selectedPoint === null) return;

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera); // Make sure you have the camera instance available here

    // Convert the 3D point to 2D
    const intersectPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 1);
    const intersectPoint = this.raycaster.ray.intersectPlane(intersectPlane);

    if (intersectPoint) {
      console.log(
        this.massPoints[this.selectedPoint].position.x,
        intersectPoint.x
      );
      this.massPoints[this.selectedPoint].position.x += intersectPoint.x / 100;
      this.massPoints[this.selectedPoint].position.y += intersectPoint.y / 100;
    }
  }

  onMouseUp(event) {
    this.selectedPoint = null;
  }
  drawBoundary() {
    const width = this.numCols * this.spacing;
    const height = this.numRows * this.spacing;

    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(width, 0, 0),
      new THREE.Vector3(width, height, 0),
      new THREE.Vector3(0, height, 0),
      new THREE.Vector3(0, 0, 0), // close the loop
    ]);
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const line = new THREE.Line(geometry, material);

    this.scene.add(line);
  }
  create() {
    // Use the instance variables here
    for (let i = 0; i < this.numRows; i++) {
      for (let j = 0; j < this.numCols; j++) {
        const massPoint = {
          //shifted a little bit to be in the center and raised up
          position: new THREE.Vector2(
            j * this.spacing + 0.25,
            i * this.spacing + 3
          ),
          previousPosition: new THREE.Vector2(
            j * this.spacing,
            i * this.spacing + 3
          ),
          force: new THREE.Vector2(),
          mass: 1,
        };
        this.massPoints.push(massPoint);
      }
    }

    // Connect mass points with springs
    for (let i = 0; i < this.massPoints.length; i++) {
      for (let j = i + 1; j < this.massPoints.length; j++) {
        const A = this.massPoints[i];
        const B = this.massPoints[j];
        const distance = A.position.distanceTo(B.position);
        if (distance < 2 * this.spacing) {
          this.springs.push({
            A: A,
            B: B,
            restLength: distance,
            stiffness: 50, // Increase stiffness
            damping: 0.5,
          });

          // Draw a line for this spring
          const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
          const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(A.position.x, A.position.y, 0),
            new THREE.Vector3(B.position.x, B.position.y, 0),
          ]);
          const line = new THREE.Line(geometry, material);
          this.linesGroup.add(line);
        }
      }
    }

    // Render mass points using THREE.Points
    const geometry = new THREE.BufferGeometry().setFromPoints(
      this.massPoints.map(
        (mp) => new THREE.Vector3(mp.position.x, mp.position.y, 0)
      )
    );
    const material = new THREE.PointsMaterial({ color: 0xff0000 });
    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
  }

  update() {
    for (let step = 0; step < this.substeps; step++) {
      // Reset forces
      for (let mp of this.massPoints) {
        mp.force.set(0, 0);
      }

      // Calculate spring forces using Hooke's law
      for (let spring of this.springs) {
        const delta = spring.B.position.clone().sub(spring.A.position);
        const length = delta.length();
        const displacement = length - spring.restLength;

        // Force magnitude and direction
        const forceMagnitude = -spring.stiffness * displacement;
        const force = delta.normalize().multiplyScalar(forceMagnitude);

        // Apply forces based on Hooke's Law
        spring.A.force.sub(force);
        spring.B.force.add(force);
      }

      // Update forces and velocities
      for (let mp of this.massPoints) {
        mp.force.add(this.gravity.clone().multiplyScalar(mp.mass));

        const acceleration = mp.force.multiplyScalar(this.deltaTime / mp.mass);
        const newPosition = mp.position
          .clone()
          .multiplyScalar(2)
          .sub(mp.previousPosition)
          .add(acceleration);
        mp.previousPosition = mp.position.clone();
        mp.position = newPosition;

        // Apply Damping
        const diff = mp.position.clone().sub(mp.previousPosition);
        mp.previousPosition = mp.position.clone();
        mp.position = mp.position.add(diff.multiplyScalar(this.dampFactor));
      }

      // Handle boundary collisions - just the left, right and bottom for now
      for (let mp of this.massPoints) {
        if (mp.position.x < 0 || mp.position.x > this.numCols * this.spacing) {
          [mp.previousPosition.x, mp.position.x] = [
            mp.position.x,
            mp.previousPosition.x,
          ];
          mp.position.x = THREE.MathUtils.clamp(
            mp.position.x,
            0,
            this.numCols * this.spacing
          );
        }

        if (mp.position.y < 0) {
          [mp.previousPosition.y, mp.position.y] = [
            mp.position.y,
            mp.previousPosition.y,
          ];
          mp.position.y = Math.max(mp.position.y, 0);
        }
      }

      // Update the geometry for rendering
      this.points.geometry.setFromPoints(
        this.massPoints.map(
          (mp) => new THREE.Vector3(mp.position.x, mp.position.y, 0)
        )
      );
      this.points.geometry.attributes.position.needsUpdate = true;

      // Update the lines (springs)
      this.linesGroup.children.forEach((line, index) => {
        const spring = this.springs[index];
        line.geometry.setFromPoints([
          new THREE.Vector3(spring.A.position.x, spring.A.position.y, 0),
          new THREE.Vector3(spring.B.position.x, spring.B.position.y, 0),
        ]);
        line.geometry.attributes.position.needsUpdate = true;
      });
    }
  }
}
export { Game };
