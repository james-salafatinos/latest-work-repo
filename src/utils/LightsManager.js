import * as THREE from "/modules/three.module.js";

class LightManager {
    constructor(scene){
        this.scene = scene

    } 

    addPointLight( color = 0xffffff, intensity = 1, distance = 100, position = { x: 5, y: 10, z: 5 }) {
        const pointLight = new THREE.PointLight(color, intensity, distance);
        pointLight.position.set(position.x, position.y, position.z);
        this.scene.add(pointLight);
    }

    addDirectionalLight(color = 0xffffff, intensity = 10, position = { x: 0, y: 10, z: 0 }) {
        const dirLight = new THREE.DirectionalLight(color, intensity);
        dirLight.position.set(position.x, position.y, position.z);
        dirLight.castShadow = true;


        // Optional: Configure shadow properties
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        let d = 50;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        dirLight.shadow.camera.near = 1;
        dirLight.shadow.camera.far = 50;
        this.scene.add(dirLight);
        return dirLight;
    }
}

export { LightManager };
