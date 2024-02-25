import * as THREE from "/modules/three.module.js";

class PickableBlock {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.isSelected = false;
    this.defaultColor = 0x888888; // Default color of the block
    this.selectedColor = 0xff0000; // Color when selected
    this.hoverColor = 0xffff00; // Color when hovered over

    this.create();
  }

  create() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: this.defaultColor });
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    this.mesh.userData = {
      isPickable: true,
      onClick: () => this.toggleSelection(),
      onHover: () => this.onHover(),
      onHoverOut: () => this.onHoverOut(),
    };
  }

  toggleSelection() {
    this.isSelected = !this.isSelected;
    this.mesh.material.color.setHex(this.isSelected ? this.selectedColor : this.defaultColor);
  }

  onHover() {
    if (!this.isSelected) {
      this.mesh.material.color.setHex(this.hoverColor);
    }
  }

  onHoverOut() {
    this.mesh.material.color.setHex(this.isSelected ? this.selectedColor : this.defaultColor);
  }

  update() {
    // This can be used for continuous updates if needed
  }
}

export { PickableBlock };
