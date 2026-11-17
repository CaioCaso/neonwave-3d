import * as THREE from 'three';

export class QuantumGalaxy {
  constructor(scene, palette) {
    this.scene = scene;
    this.palette = palette;
    this.group = new THREE.Group();

    this.points = null;
    this.particleCount = 12000;
    this.originalData = [];
    this.corePulse = null;

    this._init();
  }

  _init() {
    this.scene.add(this.group);

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);

    const arms = 4;
    const maxRadius = 38;

    for (let i = 0; i < this.particleCount; i++) {
      // Archimedean spiral arm distribution
      const r = Math.pow(Math.random(), 1.5) * maxRadius + 2;
      const armIndex = i % arms;
      const spinAngle = r * 0.45;
      const armAngle = (armIndex / arms) * Math.PI * 2;
      const angle = armAngle + spinAngle;

      // Random jitter spread
      const spread = (Math.random() - 0.5) * (r * 0.35 + 1.2);
      const verticalSpread = (Math.random() - 0.5) * (r * 0.2 + 0.8);

      const x = Math.cos(angle) * r + spread;
      const y = verticalSpread;
      const z = Math.sin(angle) * r + spread;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color interpolation based on distance from core
      const t = Math.min(1, r / maxRadius);
      const col = this.palette.primary.clone().lerp(this.palette.secondary, t);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      sizes[i] = 0.5 + Math.random() * 1.8;

      this.originalData.push({
        baseRadius: r,
        baseAngle: angle,
        baseY: y,
        armIndex,
        speed: (0.15 + (1.0 / (r * 0.1 + 1))) * 0.015
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 1.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(geo, mat);
    this.group.add(this.points);

    // Glowing core sphere
    const coreGeo = new THREE.SphereGeometry(2.5, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: this.palette.accent,
      transparent: true,
      opacity: 0.85
    });
    this.corePulse = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.corePulse);
  }

  update(metrics, delta) {
    const time = performance.now() * 0.001;
    const bass = metrics.bass || 0;
    const mid = metrics.mid || 0;
    const treble = metrics.treble || 0;
    const beat = metrics.beatIntensity || 0;

    const positions = this.points.geometry.attributes.position.array;

    for (let i = 0; i < this.particleCount; i++) {
      const d = this.originalData[i];
      // Rotation speed driven by audio energy
      d.baseAngle += d.speed * (1.0 + mid * 2.5);

      // Bass expansion shockwave
      const shockwave = Math.sin(d.baseRadius * 0.3 - time * 6.0) * bass * 3.5;
      const beatPop = beat * (d.baseRadius * 0.25);
      const r = d.baseRadius + shockwave + beatPop;

      // Vertical wave displacement
      const yWave = Math.sin(d.baseAngle * 3 + time * 4) * (1.2 + treble * 4.0);

      positions[i * 3] = Math.cos(d.baseAngle) * r;
      positions[i * 3 + 1] = d.baseY + yWave;
      positions[i * 3 + 2] = Math.sin(d.baseAngle) * r;
    }

    this.points.geometry.attributes.position.needsUpdate = true;

    // Rotate galaxy tilt
    this.group.rotation.y += (0.15 + bass * 0.4) * delta;
    this.group.rotation.x = Math.sin(time * 0.5) * 0.15 + 0.35; // Cinematic 3D tilt

    // Core pulsing
    if (this.corePulse) {
      const coreScale = 1.0 + bass * 1.5 + beat * 1.8;
      this.corePulse.scale.set(coreScale, coreScale, coreScale);
    }
  }

  setPalette(palette) {
    this.palette = palette;
    if (this.corePulse) {
      this.corePulse.material.color.copy(palette.accent);
    }
    const colors = this.points.geometry.attributes.color.array;
    for (let i = 0; i < this.particleCount; i++) {
      const d = this.originalData[i];
      const t = Math.min(1, d.baseRadius / 38);
      const col = palette.primary.clone().lerp(palette.secondary, t);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    this.points.geometry.attributes.color.needsUpdate = true;
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
