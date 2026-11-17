import * as THREE from 'three';

export class CyberTunnel {
  constructor(scene, palette) {
    this.scene = scene;
    this.palette = palette;
    this.group = new THREE.Group();
    this.rings = [];
    this.ringCount = 60;
    this.tunnelLength = 300;
    this.starField = null;
    this.rails = [];

    this._init();
  }

  _init() {
    this.scene.add(this.group);

    // 1. Concentric polygonal rings (Octagons with glowing lines)
    const ringGeo = new THREE.BufferGeometry();
    const sides = 8;
    const radius = 18;
    const vertices = [];

    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      vertices.push(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    }
    ringGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    for (let i = 0; i < this.ringCount; i++) {
      const color = (i % 2 === 0) ? this.palette.primary : this.palette.secondary;
      const mat = new THREE.LineBasicMaterial({
        color: color.clone(),
        linewidth: 2,
        transparent: true,
        opacity: 0.85
      });

      const line = new THREE.Line(ringGeo, mat);
      line.position.z = -i * (this.tunnelLength / this.ringCount);
      line.userData = {
        baseZ: line.position.z,
        baseScale: 1,
        rotSpeed: (i % 2 === 0 ? 1 : -1) * 0.008,
        index: i
      };

      this.rings.push(line);
      this.group.add(line);
    }

    // 2. Longitudinal Laser Rails running through the tunnel
    const railMat = new THREE.LineBasicMaterial({
      color: this.palette.primary,
      transparent: true,
      opacity: 0.6
    });

    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const railGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, y, 20),
        new THREE.Vector3(x, y, -this.tunnelLength - 20)
      ]);

      const rail = new THREE.Line(railGeo, railMat);
      this.rails.push(rail);
      this.group.add(rail);
    }

    // 3. High-speed Space Warp Particles
    const starCount = 1500;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starSpeeds = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const r = Math.random() * radius * 0.9;
      const theta = Math.random() * Math.PI * 2;
      starPositions[i * 3] = Math.cos(theta) * r;
      starPositions[i * 3 + 1] = Math.sin(theta) * r;
      starPositions[i * 3 + 2] = -Math.random() * this.tunnelLength;
      starSpeeds[i] = 1.0 + Math.random() * 2.0;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    this.starSpeeds = starSpeeds;

    const starMat = new THREE.PointsMaterial({
      color: this.palette.accent,
      size: 0.8,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.starField = new THREE.Points(starGeo, starMat);
    this.group.add(this.starField);
  }

  update(metrics, delta) {
    const bass = metrics.bass || 0;
    const treble = metrics.treble || 0;
    const beat = metrics.beatIntensity || 0;
    const speed = 1.0 + metrics.overallEnergy * 3.5 + beat * 2.0;

    // Move rings toward camera for infinite tunnel effect
    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];
      ring.position.z += speed * 60 * delta;

      // Wrap around tunnel end
      if (ring.position.z > 15) {
        ring.position.z = -this.tunnelLength + (ring.position.z - 15);
      }

      // Rotate rings
      ring.rotation.z += ring.userData.rotSpeed * (1 + treble * 3);

      // Audio reactive scale & deformation
      const distFromCam = Math.abs(ring.position.z);
      const wave = Math.sin(distFromCam * 0.05 - performance.now() * 0.005);
      const scale = 1.0 + wave * 0.25 * bass + (beat * 0.45 * Math.exp(-distFromCam * 0.03));
      ring.scale.set(scale, scale, 1);

      // Color intensity pulse on beat
      if (ring.material) {
        ring.material.opacity = 0.4 + (1.0 - Math.min(1, distFromCam / this.tunnelLength)) * 0.5 + beat * 0.3;
      }
    }

    // Warp starfield particles
    if (this.starField) {
      const positions = this.starField.geometry.attributes.position.array;
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 2] += this.starSpeeds[i] * speed * 75 * delta;
        if (positions[i * 3 + 2] > 20) {
          positions[i * 3 + 2] = -this.tunnelLength;
        }
      }
      this.starField.geometry.attributes.position.needsUpdate = true;
    }
  }

  setPalette(palette) {
    this.palette = palette;
    this.rings.forEach((ring, i) => {
      ring.material.color.copy(i % 2 === 0 ? palette.primary : palette.secondary);
    });
    this.rails.forEach(rail => {
      rail.material.color.copy(palette.primary);
    });
    if (this.starField) {
      this.starField.material.color.copy(palette.accent);
    }
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
