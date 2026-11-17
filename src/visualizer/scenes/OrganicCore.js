import * as THREE from 'three';

export class OrganicCore {
  constructor(scene, palette) {
    this.scene = scene;
    this.palette = palette;
    this.group = new THREE.Group();

    this.coreMesh = null;
    this.wireMesh = null;
    this.originalPositions = null;
    this.bars = [];
    this.barCount = 64;
    this.rings = [];
    this.particles = null;

    this._init();
  }

  _init() {
    this.scene.add(this.group);

    // 1. Central Morphing Sphere (Subdivided Icosahedron)
    const radius = 6.5;
    const sphereGeo = new THREE.IcosahedronGeometry(radius, 5);
    this.originalPositions = new Float32Array(sphereGeo.attributes.position.array);

    // Metallic inner core with specular glow
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x050510,
      emissive: this.palette.primary.clone().multiplyScalar(0.2),
      roughness: 0.2,
      metalness: 0.9,
      flatShading: true
    });
    this.coreMesh = new THREE.Mesh(sphereGeo, coreMat);
    this.group.add(this.coreMesh);

    // Wireframe overlay
    const wireMat = new THREE.MeshBasicMaterial({
      color: this.palette.primary.clone(),
      wireframe: true,
      transparent: true,
      opacity: 0.75
    });
    this.wireMesh = new THREE.Mesh(sphereGeo, wireMat);
    this.group.add(this.wireMesh);

    // 2. 64 Radial Equalizer Bars around the sphere in a circle
    const barRadius = 14;
    const barWidth = 0.35;
    const barDepth = 0.35;
    const barMaxHeight = 1;
    const barGeo = new THREE.BoxGeometry(barWidth, barMaxHeight, barDepth);
    barGeo.translate(0, 0.5, 0); // Origin at bottom of bar

    for (let i = 0; i < this.barCount; i++) {
      const angle = (i / this.barCount) * Math.PI * 2;
      const mat = new THREE.MeshStandardMaterial({
        color: (i % 2 === 0 ? this.palette.primary : this.palette.secondary).clone(),
        emissive: (i % 2 === 0 ? this.palette.primary : this.palette.secondary).clone().multiplyScalar(0.4),
        roughness: 0.3,
        metalness: 0.8
      });

      const bar = new THREE.Mesh(barGeo, mat);
      bar.position.x = Math.cos(angle) * barRadius;
      bar.position.z = Math.sin(angle) * barRadius;
      bar.rotation.y = -angle - Math.PI / 2;
      bar.userData = { angle, index: i };

      this.bars.push(bar);
      this.group.add(bar);
    }

    // 3. Three Concentric Gyroscope Rings
    const ringRadii = [18, 22, 26];
    ringRadii.forEach((r, idx) => {
      const ringGeo = new THREE.TorusGeometry(r, 0.12, 16, 100);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? this.palette.primary : (idx === 1 ? this.palette.secondary : this.palette.accent),
        transparent: true,
        opacity: 0.7
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = (idx * Math.PI) / 3;
      ring.rotation.y = (idx * Math.PI) / 4;
      this.rings.push(ring);
      this.group.add(ring);
    });

    // 4. Stardust Orbiting Particle Cloud
    const particleCount = 2000;
    const partGeo = new THREE.BufferGeometry();
    const partPositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const dist = 10 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      partPositions[i * 3] = dist * Math.cos(phi) * Math.cos(theta);
      partPositions[i * 3 + 1] = dist * Math.sin(phi);
      partPositions[i * 3 + 2] = dist * Math.cos(phi) * Math.sin(theta);
    }

    partGeo.setAttribute('position', new THREE.BufferAttribute(partPositions, 3));
    const partMat = new THREE.PointsMaterial({
      color: this.palette.accent,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(partGeo, partMat);
    this.group.add(this.particles);
  }

  update(metrics, delta) {
    const time = performance.now() * 0.002;
    const bass = metrics.bass || 0;
    const mid = metrics.mid || 0;
    const treble = metrics.treble || 0;
    const beat = metrics.beatIntensity || 0;

    // 1. Deform central core sphere vertices
    const pos = this.coreMesh.geometry.attributes.position.array;
    const orig = this.originalPositions;
    const count = orig.length / 3;

    for (let i = 0; i < count; i++) {
      const ox = orig[i * 3];
      const oy = orig[i * 3 + 1];
      const oz = orig[i * 3 + 2];

      const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
      const nx = ox / len;
      const ny = oy / len;
      const nz = oz / len;

      // Organic displacement wave
      const wave = Math.sin(nx * 3.5 + time * 1.5) *
                   Math.cos(ny * 3.5 + time * 1.2) *
                   Math.sin(nz * 3.5 + time * 1.4);

      const highWave = Math.sin(nx * 8.0 + time * 3.0) * treble * 0.8;
      const displacement = (wave * (0.8 + bass * 2.2) + highWave) * (1 + beat * 0.8);

      const scale = len + displacement;
      pos[i * 3] = nx * scale;
      pos[i * 3 + 1] = ny * scale;
      pos[i * 3 + 2] = nz * scale;
    }

    this.coreMesh.geometry.attributes.position.needsUpdate = true;
    this.coreMesh.geometry.computeVertexNormals();

    // Rotate core
    this.group.rotation.y += (0.2 + mid * 0.8) * delta;
    this.coreMesh.rotation.x += 0.15 * delta;

    // 2. Animate radial equalizer bars
    const freqData = window.__visualizerFreqData;
    for (let i = 0; i < this.bars.length; i++) {
      const bar = this.bars[i];
      let val = 0;
      if (freqData && freqData.length > 0) {
        // Map bar index to frequency spectrum
        const bin = Math.floor((i / this.barCount) * (freqData.length * 0.6));
        val = (freqData[bin] || 0) / 255;
      } else {
        val = (Math.sin(i * 0.3 + time * 4) * 0.5 + 0.5) * mid;
      }

      const targetHeight = Math.max(0.5, val * 16.0 * (1.0 + bass * 0.8));
      bar.scale.y += (targetHeight - bar.scale.y) * 0.35;
    }

    // 3. Gyroscope rings rotation
    this.rings.forEach((ring, idx) => {
      ring.rotation.x += (0.3 + idx * 0.2 + beat * 0.5) * delta;
      ring.rotation.y += (0.2 - idx * 0.15) * delta;
      ring.rotation.z += (0.1 + idx * 0.1) * delta;
      const ringScale = 1.0 + beat * 0.15 * (3 - idx);
      ring.scale.set(ringScale, ringScale, ringScale);
    });

    // 4. Orbiting particles
    if (this.particles) {
      this.particles.rotation.y += 0.1 * delta;
      this.particles.rotation.z += 0.05 * delta;
    }
  }

  setPalette(palette) {
    this.palette = palette;
    if (this.coreMesh) {
      this.coreMesh.material.emissive.copy(palette.primary).multiplyScalar(0.2);
    }
    if (this.wireMesh) {
      this.wireMesh.material.color.copy(palette.primary);
    }
    this.bars.forEach((bar, i) => {
      const col = i % 2 === 0 ? palette.primary : palette.secondary;
      bar.material.color.copy(col);
      bar.material.emissive.copy(col).multiplyScalar(0.4);
    });
    this.rings.forEach((ring, idx) => {
      ring.material.color.copy(idx === 0 ? palette.primary : (idx === 1 ? palette.secondary : palette.accent));
    });
    if (this.particles) {
      this.particles.material.color.copy(palette.accent);
    }
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
