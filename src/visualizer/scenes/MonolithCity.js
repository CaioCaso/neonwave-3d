import * as THREE from 'three';

export class MonolithCity {
  constructor(scene, palette) {
    this.scene = scene;
    this.palette = palette;
    this.group = new THREE.Group();

    this.gridSize = 14; // 14x14 = 196 buildings
    this.buildings = [];
    this.spotlights = [];

    this._init();
  }

  _init() {
    this.scene.add(this.group);

    const spacing = 3.2;
    const boxWidth = 2.4;
    const boxDepth = 2.4;
    const boxHeight = 1;

    const baseGeo = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    baseGeo.translate(0, 0.5, 0); // anchor at base

    const halfGrid = (this.gridSize * spacing) / 2;

    for (let x = 0; x < this.gridSize; x++) {
      for (let z = 0; z < this.gridSize; z++) {
        const posX = x * spacing - halfGrid;
        const posZ = z * spacing - halfGrid;
        const distFromCenter = Math.sqrt(posX * posX + posZ * posZ);

        const color = (x + z) % 2 === 0 ? this.palette.primary : this.palette.secondary;
        const mat = new THREE.MeshStandardMaterial({
          color: 0x050512,
          emissive: color.clone().multiplyScalar(0.2),
          roughness: 0.2,
          metalness: 0.9
        });

        const mesh = new THREE.Mesh(baseGeo, mat);
        mesh.position.set(posX, 0, posZ);

        // Edges wireframe
        const edgeGeo = new THREE.EdgesGeometry(baseGeo);
        const edgeMat = new THREE.LineBasicMaterial({
          color: color.clone(),
          linewidth: 1.5,
          transparent: true,
          opacity: 0.8
        });
        const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
        mesh.add(edgeLine);

        mesh.userData = {
          distFromCenter,
          xIndex: x,
          zIndex: z,
          targetHeight: 1
        };

        this.buildings.push(mesh);
        this.group.add(mesh);
      }
    }

    // Reflective floor
    const floorGeo = new THREE.PlaneGeometry(120, 120);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x020206,
      roughness: 0.3,
      metalness: 0.8
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.05;
    this.group.add(floor);

    // Two moving spotlights
    const light1 = new THREE.PointLight(this.palette.primary, 300, 70);
    light1.position.set(20, 30, 20);
    this.group.add(light1);
    this.spotlights.push(light1);

    const light2 = new THREE.PointLight(this.palette.secondary, 300, 70);
    light2.position.set(-20, 30, -20);
    this.group.add(light2);
    this.spotlights.push(light2);
  }

  update(metrics, delta) {
    const time = performance.now() * 0.002;
    const bass = metrics.bass || 0;
    const mid = metrics.mid || 0;
    const treble = metrics.treble || 0;
    const beat = metrics.beatIntensity || 0;

    const freqData = window.__visualizerFreqData;

    for (let i = 0; i < this.buildings.length; i++) {
      const b = this.buildings[i];
      const dist = b.userData.distFromCenter;

      let freqVal = 0;
      if (freqData && freqData.length > 0) {
        const binIndex = Math.floor((dist / 30) * (freqData.length * 0.4)) % freqData.length;
        freqVal = (freqData[binIndex] || 0) / 255;
      } else {
        freqVal = (Math.sin(dist * 0.4 - time * 3) * 0.5 + 0.5) * mid;
      }

      // Height modulated by radial distance and audio frequency
      const wave = Math.sin(b.userData.xIndex * 0.5 + time * 2) * Math.cos(b.userData.zIndex * 0.5 + time * 2);
      const targetHeight = Math.max(0.6, (freqVal * 22.0 + wave * 4.0) * (1.0 + bass * 0.9) + beat * 6.0);

      // Smooth interpolation
      b.scale.y += (targetHeight - b.scale.y) * 0.3;
    }

    // Move spotlights around the city
    if (this.spotlights.length >= 2) {
      this.spotlights[0].position.x = Math.cos(time * 0.7) * 35;
      this.spotlights[0].position.z = Math.sin(time * 0.7) * 35;
      this.spotlights[0].position.y = 25 + bass * 15;

      this.spotlights[1].position.x = Math.sin(time * 0.9) * -35;
      this.spotlights[1].position.z = Math.cos(time * 0.9) * 35;
      this.spotlights[1].position.y = 25 + treble * 15;
    }

    // City slow rotation
    this.group.rotation.y += (0.05 + mid * 0.15) * delta;
  }

  setPalette(palette) {
    this.palette = palette;
    this.buildings.forEach((b, i) => {
      const col = (b.userData.xIndex + b.userData.zIndex) % 2 === 0 ? palette.primary : palette.secondary;
      b.material.emissive.copy(col).multiplyScalar(0.2);
      if (b.children[0] && b.children[0].material) {
        b.children[0].material.color.copy(col);
      }
    });
    if (this.spotlights[0]) this.spotlights[0].color.copy(palette.primary);
    if (this.spotlights[1]) this.spotlights[1].color.copy(palette.secondary);
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
