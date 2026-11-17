import * as THREE from 'three';

export class SynthwaveSunset {
  constructor(scene, palette) {
    this.scene = scene;
    this.palette = palette;
    this.group = new THREE.Group();

    this.grid = null;
    this.sun = null;
    this.stars = null;
    this.horizonLine = null;
    this.gridWidth = 140;
    this.gridDepth = 220;
    this.segmentsW = 60;
    this.segmentsD = 70;
    this.gridOffset = 0;

    this._init();
  }

  _init() {
    this.scene.add(this.group);

    // 1. Terrain Grid with wireframe
    const terrainGeo = new THREE.PlaneGeometry(
      this.gridWidth,
      this.gridDepth,
      this.segmentsW,
      this.segmentsD
    );
    terrainGeo.rotateX(-Math.PI / 2);

    const terrainMat = new THREE.MeshBasicMaterial({
      color: this.palette.primary,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });

    this.grid = new THREE.Mesh(terrainGeo, terrainMat);
    this.grid.position.set(0, -6, -this.gridDepth / 4);
    this.group.add(this.grid);

    // 2. Giant Retro Segmented Neon Sun on the horizon
    const sunRadius = 26;
    const sunGeo = new THREE.CircleGeometry(sunRadius, 48);
    const sunMat = new THREE.ShaderMaterial({
      uniforms: {
        uColorTop: { value: this.palette.accent },
        uColorBottom: { value: this.palette.secondary },
        uTime: { value: 0 },
        uTreble: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform vec3 uColorTop;
        uniform vec3 uColorBottom;
        uniform float uTime;
        uniform float uTreble;

        void main() {
          // Sunset vertical gradient
          vec3 col = mix(uColorBottom, uColorTop, vUv.y);

          // Horizontal sliced blinds/stripes
          float stripes = sin(vUv.y * 36.0 - uTime * 1.5);
          float blind = smoothstep(0.1, 0.4, vUv.y);
          if (vUv.y < 0.65 && fract(vUv.y * 14.0) < (0.28 * (1.0 - vUv.y * 0.9))) {
            discard;
          }

          gl_FragColor = vec4(col, 1.0);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });

    this.sun = new THREE.Mesh(sunGeo, sunMat);
    this.sun.position.set(0, 10, -110);
    this.group.add(this.sun);

    // 3. Glowing Horizon Neon Line
    const horizonGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-150, -5.9, -100),
      new THREE.Vector3(150, -5.9, -100)
    ]);
    const horizonMat = new THREE.LineBasicMaterial({
      color: this.palette.secondary,
      linewidth: 3
    });
    this.horizonLine = new THREE.Line(horizonGeo, horizonMat);
    this.group.add(this.horizonLine);

    // 4. Retro Starfield
    const starCount = 800;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 250;
      starPos[i * 3 + 1] = Math.random() * 80 + 2;
      starPos[i * 3 + 2] = -Math.random() * 120 - 40;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: this.palette.accent,
      size: 0.9,
      transparent: true,
      opacity: 0.85
    });
    this.stars = new THREE.Points(starGeo, starMat);
    this.group.add(this.stars);
  }

  update(metrics, delta) {
    const time = performance.now() * 0.001;
    const bass = metrics.bass || 0;
    const mid = metrics.mid || 0;
    const treble = metrics.treble || 0;
    const beat = metrics.beatIntensity || 0;

    // Scrolling terrain effect
    this.gridOffset += (25 + bass * 55) * delta;
    const offset = this.gridOffset;

    // Animate terrain vertices (mountains on edges, responsive valley in center)
    const pos = this.grid.geometry.attributes.position.array;
    const cols = this.segmentsW + 1;
    const rows = this.segmentsD + 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = (r * cols + c) * 3;
        const x = pos[idx];
        const normalizedX = (c / cols) * 2 - 1; // -1 to 1
        const distFromCenter = Math.abs(normalizedX);

        // Center is flat runway; borders have tall mountain peaks
        const mountainFactor = Math.pow(distFromCenter, 2.2);

        // Wave motion along Z
        const zCoord = r * (this.gridDepth / this.segmentsD) + offset;
        const wave1 = Math.sin(x * 0.1 + zCoord * 0.08);
        const wave2 = Math.cos(x * 0.05 - zCoord * 0.05);

        // Modulate height by audio
        const bassImpact = bass * 14.0 * mountainFactor;
        const midImpact = mid * 6.0 * Math.sin(x * 0.2 + time * 3.0);
        const beatBounce = beat * 8.0 * mountainFactor;

        pos[idx + 1] = (wave1 * 3.5 + wave2 * 4.0) * mountainFactor + bassImpact + midImpact + beatBounce;
      }
    }
    this.grid.geometry.attributes.position.needsUpdate = true;

    // Sun shader update
    if (this.sun && this.sun.material.uniforms) {
      this.sun.material.uniforms.uTime.value = time;
      this.sun.material.uniforms.uTreble.value = treble;
      const sunScale = 1.0 + bass * 0.15 + beat * 0.2;
      this.sun.scale.set(sunScale, sunScale, 1);
    }
  }

  setPalette(palette) {
    this.palette = palette;
    if (this.grid) {
      this.grid.material.color.copy(palette.primary);
    }
    if (this.sun && this.sun.material.uniforms) {
      this.sun.material.uniforms.uColorTop.value.copy(palette.accent);
      this.sun.material.uniforms.uColorBottom.value.copy(palette.secondary);
    }
    if (this.horizonLine) {
      this.horizonLine.material.color.copy(palette.secondary);
    }
    if (this.stars) {
      this.stars.material.color.copy(palette.accent);
    }
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
