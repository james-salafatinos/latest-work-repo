import * as THREE from "/modules/three.module.js";

const LINE_COLOR = 0x0aff90;
const BAR_COLOR = 0x0aff90;
const TEXT_COLOR = 0xffffff;
const AXIS_COLOR = 0xffffff;
const BAR_GEOMETRY = [0.4, 0, 0.2];
const TEXT_SIZE = 0.09;
const TEXT_HEIGHT = 0.1;
const X_BUFFER = 0.5;
class Game {
  constructor(scene) {
    this.scene = scene;
    this.scalingFactor = 1; // Initialized to 1
    this.horizontalScalingFactor = 1; // Horizontal scaling factor
    this.barWidthScalingFactor = 1;
    this.textSizeScalingFactor = 1;
    this.font = null;

    this.data = [
      ["2022", 12173],
      ["2021", 16072],
      ["2020", 8497],
      ["2019", 6558],
      ["2018", 5146],
      ["2017", 5872],
      ["2016", 4860],
      ["2015", 4104],
      ["2014", 2820],
      ["2013", 2105],
      ["2012", 1378],
      ["2011", 446],
      ["2010", 459],
      ["2009", 379],
    ];

    // Arrays to store the meshes and text labels
    this.lineSegments = []; // Array to store the line segments
    this.textLabels = [];
    // Additional arrays to store the axis lines and text labels
    this.axisLines = [];
    this.axisLabels = [];

    this.create();
  }

  async create() {
    const barMaterial = new THREE.MeshPhongMaterial({ color: BAR_COLOR });
    const axisMaterial = new THREE.LineBasicMaterial({ color: AXIS_COLOR });
    try {
      const font = await this.loadFont();
      this.createLineSegmentsAndLabels(font);
      this.createAxes(axisMaterial, font);
    } catch (error) {
      console.error("Font could not be loaded:", error);
    }
  }
  async loadFont() {
    const loader = new THREE.FontLoader();
    return new Promise((resolve, reject) => {
      loader.load(
        "https://unpkg.com/three@0.77.0/examples/fonts/helvetiker_regular.typeface.json",
        (font) => {
          this.font = font; // Set this.font here
          resolve(font);
        },
        undefined,
        reject
      );
    });
  }
  createLineSegmentsAndLabels(font) {
    const lineMaterial = new THREE.LineBasicMaterial({ color: LINE_COLOR });
    let x = X_BUFFER;
    let previousPoint = null;

    this.data.forEach(([state, growth], index) => {
      const currentPoint = new THREE.Vector3(
        x * this.horizontalScalingFactor,
        growth * this.scalingFactor,
        0
      );

      // If there is a previous point, create a line segment
      if (previousPoint) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          previousPoint,
          currentPoint,
        ]);
        const line = new THREE.Line(geometry, lineMaterial);
        this.scene.add(line);
        this.lineSegments.push(line);
      }
      previousPoint = currentPoint.clone(); // Clone to prevent reference issues

      // Create text labels
      const text = this.createTextLabel(
        state,
        growth,
        font,
        x * this.horizontalScalingFactor
      );
      this.scene.add(text);
      this.textLabels.push(text);

      x += 1; // Increment x by 1, will be scaled by horizontalScalingFactor
    });
  }
  createAxes(axisMaterial, font) {
    // X-axis
    const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(this.data.length * this.horizontalScalingFactor, 0, 0),
    ]);
    const xAxisLine = new THREE.Line(xAxisGeometry, axisMaterial);
    this.scene.add(xAxisLine);

    // Y-axis
    const maxY = Math.max(...this.data.map(([, y]) => y)) * this.scalingFactor;
    const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, maxY, 0),
    ]);
    const yAxisLine = new THREE.Line(yAxisGeometry, axisMaterial);
    this.scene.add(yAxisLine);

    // Axis Labels
    const xLabelGeometry = new THREE.TextGeometry("X-Axis", {
      font: this.font,
      size: TEXT_SIZE,
      height: TEXT_HEIGHT,
    });
    const yLabelGeometry = new THREE.TextGeometry("Y-Axis", {
      font: this.font,
      size: TEXT_SIZE,
      height: TEXT_HEIGHT,
    });

    const labelMaterial = new THREE.MeshPhongMaterial({ color: TEXT_COLOR });

    const xLabel = new THREE.Mesh(xLabelGeometry, labelMaterial);
    const yLabel = new THREE.Mesh(yLabelGeometry, labelMaterial);

    xLabel.position.set(
      (this.data.length * this.horizontalScalingFactor) / 2,
      -1,
      0
    );
    yLabel.position.set(-1, maxY / 2, 0);
    yLabel.rotation.z = -Math.PI / 2;

    // Add the lines and labels to the arrays
    this.axisLines.push(xAxisLine, yAxisLine);
    this.axisLabels.push(xLabel, yLabel);
    this.scene.add(xLabel);
    this.scene.add(yLabel);
  }
  createBar(height, material, x) {
    const [originalWidth, , depth] = BAR_GEOMETRY;
    const width = originalWidth * this.barWidthScalingFactor;
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const bar = new THREE.Mesh(geometry, material);
    bar.position.set(x, height / 2, 0);
    bar.scale.y = this.scalingFactor;
    return bar;
  }
  createTextLabel(state, growth, font, x) {
    const size = TEXT_SIZE * this.textSizeScalingFactor;
    const geometry = new THREE.TextGeometry(`${state} ${growth}`, {
      font: this.font,
      size: size,
      height: TEXT_HEIGHT,
    });

    geometry.computeBoundingBox(); // Compute the bounding box
    const textWidth = geometry.boundingBox.max.x - geometry.boundingBox.min.x;

    const material = new THREE.MeshPhongMaterial({ color: TEXT_COLOR });
    const text = new THREE.Mesh(geometry, material);

    // Center the text on the bar
    const barX = x * this.horizontalScalingFactor;
    text.position.set(
      barX - textWidth / 2,
      growth * this.scalingFactor + 0.3,
      0
    );

    return text;
  }

  update() {
    // Your update logic here
  }

  updateAfterGui() {
    // Update the line segments
    let x = X_BUFFER;
    let previousPoint = null;
    this.lineSegments.forEach((line, index) => {
      const [, growth] = this.data[index];
      const currentPoint = new THREE.Vector3(
        x * this.horizontalScalingFactor,
        growth * this.scalingFactor,
        0
      );

      if (previousPoint) {
        line.geometry.dispose();
        line.geometry = new THREE.BufferGeometry().setFromPoints([previousPoint, currentPoint]);
      }
      
      if (previousPoint) {
        line.geometry.setFromPoints([previousPoint, currentPoint]);
        line.geometry.attributes.position.needsUpdate = true; // Flag to update the geometry
      }

      previousPoint = currentPoint.clone(); // Clone to prevent reference issues
      x += 1;
    });
    this.textLabels.forEach((text, index) => {
      const [, growth] = this.data[index];
      const x = index + X_BUFFER; // Original x position without scaling

      // Scale the text
      text.scale.set(
        this.textSizeScalingFactor,
        this.textSizeScalingFactor,
        this.textSizeScalingFactor
      );

      // Compute bounding box for the text
      text.geometry.computeBoundingBox();
      const textWidth =
        (text.geometry.boundingBox.max.x - text.geometry.boundingBox.min.x) *
        this.textSizeScalingFactor;

      // Center the text on the bar
      const barX = x * this.horizontalScalingFactor;
      text.position.set(
        barX - textWidth / 2,
        growth * this.scalingFactor + 0.3,
        0
      );
    });
    // Update the axis lines
    this.axisLines.forEach((line, index) => {
      if (index === 0) {
        // X-axis line
        line.geometry.setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(
            this.data.length * this.horizontalScalingFactor,
            0,
            0
          ),
        ]);
      } else {
        // Y-axis line
        const maxY =
          Math.max(...this.data.map(([, y]) => y)) * this.scalingFactor;
        line.geometry.setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, maxY, 0),
        ]);
      }
    });

    // Update the axis labels
    this.axisLabels.forEach((label, index) => {
      const size = TEXT_SIZE * this.textSizeScalingFactor;
      label.geometry = new THREE.TextGeometry(
        index === 0 ? "X-Axis" : "Y-Axis",
        {
          font: this.font, // Assume 'font' is available; better to store it as a class property
          size: size,
          height: TEXT_HEIGHT,
        }
      );

      if (index === 0) {
        // X-axis label
        label.position.set(
          (this.data.length * this.horizontalScalingFactor) / 2,
          -.2,
          0
        );
      } else {
        // Y-axis label
        const maxY =
          Math.max(...this.data.map(([, y]) => y)) * this.scalingFactor;
        label.position.set(-.2, maxY / 2, 0);
      }
    });
  }
}

export { Game };
