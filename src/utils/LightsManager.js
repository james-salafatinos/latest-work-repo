import * as THREE from "/modules/three.module.js";

class PointLightManager {
    constructor(scene){
        this.scene = scene

    } 

    addPointLight( color = 0xffffff, intensity = 1, distance = 100, position = { x: 5, y: 10, z: 5 }) {
        const pointLight = new THREE.PointLight(color, intensity, distance);
        pointLight.position.set(position.x, position.y, position.z);
        this.scene.add(pointLight);
    }
}

export { PointLightManager };
