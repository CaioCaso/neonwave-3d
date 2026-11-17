import * as THREE from 'three';

export class CyberLyrics {
  constructor(scene, palette) {
    this.scene = scene;
    this.palette = palette;
    this.group = new THREE.Group();

    this.lyricsList = [];
    this.currentLineIndex = -1;
    this.activeTime = 0;

    // 3D Text Meshes
    this.activeTextMesh = null;
    this.prevTextMesh = null;
    this.nextTextMesh = null;

    // Canvases for dynamic 2D -> 3D text generation
    this.canvasWidth = 2048;
    this.canvasHeight = 512;
    this.activeCanvas = document.createElement('canvas');
    this.prevCanvas = document.createElement('canvas');
    this.nextCanvas = document.createElement('canvas');

    this.activeCanvas.width = this.canvasWidth;
    this.activeCanvas.height = this.canvasHeight;
    this.prevCanvas.width = this.canvasWidth;
    this.prevCanvas.height = this.canvasHeight;
    this.nextCanvas.width = this.canvasWidth;
    this.nextCanvas.height = this.canvasHeight;

    this.activeCtx = this.activeCanvas.getContext('2d');
    this.prevCtx = this.prevCanvas.getContext('2d');
    this.nextCtx = this.nextCanvas.getContext('2d');

    this.activeTexture = new THREE.CanvasTexture(this.activeCanvas);
    this.prevTexture = new THREE.CanvasTexture(this.prevCanvas);
    this.nextTexture = new THREE.CanvasTexture(this.nextCanvas);

    // Decorative 3D Stage Elements
    this.surroundingRings = [];
    this.particles = null;
    this.gridFloor = null;

    this.textPopScale = 1.0;
    this.lastLineTransitionTime = 0;

    this._init();
  }

  _init() {
    this.scene.add(this.group);

    // 1. Text Planes Geometry (Aspect ratio 4:1)
    const planeWidth = 36;
    const planeHeight = 9;
    const planeGeo = new THREE.PlaneGeometry(planeWidth, planeHeight);

    // Active Center Line
    const activeMat = new THREE.MeshBasicMaterial({
      map: this.activeTexture,
      transparent: true,
      opacity: 1.0,
      side: THREE.DoubleSide
    });
    this.activeTextMesh = new THREE.Mesh(planeGeo, activeMat);
    this.activeTextMesh.position.set(0, 0, 0);
    this.group.add(this.activeTextMesh);

    // Previous Line (Floats higher & pushed back)
    const prevMat = new THREE.MeshBasicMaterial({
      map: this.prevTexture,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    this.prevTextMesh = new THREE.Mesh(planeGeo, prevMat);
    this.prevTextMesh.position.set(0, 7.5, -8);
    this.prevTextMesh.scale.set(0.78, 0.78, 1);
    this.group.add(this.prevTextMesh);

    // Next Line (Floats lower & slightly pushed back)
    const nextMat = new THREE.MeshBasicMaterial({
      map: this.nextTexture,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    this.nextTextMesh = new THREE.Mesh(planeGeo, nextMat);
    this.nextTextMesh.position.set(0, -6.5, -6);
    this.nextTextMesh.scale.set(0.82, 0.82, 1);
    this.group.add(this.nextTextMesh);

    // 2. Surrounding Equalizer Orbit Rings
    const ringRadii = [22, 26, 30];
    ringRadii.forEach((r, idx) => {
      const ringGeo = new THREE.TorusGeometry(r, 0.08, 16, 90);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? this.palette.primary : (idx === 1 ? this.palette.secondary : this.palette.accent),
        transparent: true,
        opacity: 0.55
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2 + (idx * 0.2);
      this.surroundingRings.push(ring);
      this.group.add(ring);
    });

    // 3. Stardust / Lyric Embers
    const partCount = 1200;
    const partGeo = new THREE.BufferGeometry();
    const partPos = new Float32Array(partCount * 3);
    for (let i = 0; i < partCount; i++) {
      partPos[i * 3] = (Math.random() - 0.5) * 80;
      partPos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      partPos[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
    const partMat = new THREE.PointsMaterial({
      color: this.palette.accent,
      size: 0.6,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    this.particles = new THREE.Points(partGeo, partMat);
    this.group.add(this.particles);

    // 4. Ground Neon Grid
    const gridGeo = new THREE.PlaneGeometry(120, 120, 40, 40);
    gridGeo.rotateX(-Math.PI / 2);
    const gridMat = new THREE.MeshBasicMaterial({
      color: this.palette.secondary,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    this.gridFloor = new THREE.Mesh(gridGeo, gridMat);
    this.gridFloor.position.y = -12;
    this.group.add(this.gridFloor);

    // Render initial placeholder
    this._renderTextToCanvas(this.activeCtx, 'NEONWAVE 3D LYRIC STUDIO', true);
    this._renderTextToCanvas(this.prevCtx, '', false);
    this._renderTextToCanvas(this.nextCtx, 'TOQUE UMA MÚSICA COM LETRA', false);
    this.activeTexture.needsUpdate = true;
    this.prevTexture.needsUpdate = true;
    this.nextTexture.needsUpdate = true;
  }

  clearLyrics(trackInfo) {
    this.lyricsList = [];
    this.currentLineIndex = -1;
    const title = trackInfo?.title || 'NEONWAVE 3D';
    const artist = trackInfo?.artist || '';

    this._renderTextToCanvas(this.activeCtx, title, true);
    this._renderTextToCanvas(this.prevCtx, artist, false);
    this._renderTextToCanvas(this.nextCtx, 'TOQUE EM [🎤 LETRAS] PARA ADICIONAR', false);

    this.activeTexture.needsUpdate = true;
    this.prevTexture.needsUpdate = true;
    this.nextTexture.needsUpdate = true;
  }

  setLyrics(lyrics, trackInfo) {
    this.lyricsList = lyrics || [];
    this.currentLineIndex = -1;

    if (this.lyricsList.length === 0) {
      this.clearLyrics(trackInfo);
      return;
    }

    // Pre-render first line
    const firstText = this.lyricsList[0]?.text || trackInfo?.title || '';
    const secondText = this.lyricsList[1]?.text || '';
    const artist = trackInfo?.artist || '';

    this._renderTextToCanvas(this.activeCtx, firstText, true);
    this._renderTextToCanvas(this.prevCtx, artist, false);
    this._renderTextToCanvas(this.nextCtx, secondText, false);

    this.activeTexture.needsUpdate = true;
    this.prevTexture.needsUpdate = true;
    this.nextTexture.needsUpdate = true;
  }

  _renderTextToCanvas(ctx, text, isActive = true) {
    const w = this.canvasWidth;
    const h = this.canvasHeight;

    ctx.clearRect(0, 0, w, h);
    if (!text || !text.trim()) return;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const fontSize = isActive ? 82 : 56;
    ctx.font = `900 ${fontSize}px "Orbitron", "Plus Jakarta Sans", sans-serif`;

    const primaryHex = '#' + this.palette.primary.getHexString();
    const secondaryHex = '#' + this.palette.secondary.getHexString();

    if (isActive) {
      // Glow drop shadow
      ctx.shadowColor = primaryHex;
      ctx.shadowBlur = 35;
      ctx.lineWidth = 6;
      ctx.strokeStyle = primaryHex;
      ctx.strokeText(text, w / 2, h / 2);

      // Gradient text fill
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0.2, '#ffffff');
      grad.addColorStop(0.5, primaryHex);
      grad.addColorStop(0.8, secondaryHex);

      ctx.fillStyle = grad;
      ctx.fillText(text, w / 2, h / 2);

      // Reset shadow
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(text, w / 2, h / 2);
    }
  }

  update(metrics, delta) {
    const time = performance.now() * 0.001;
    const bass = metrics.bass || 0;
    const kickPunch = metrics.kickPunch || 0;
    const beat = metrics.beatIntensity || 0;

    // Check lyrics timing based on audio playback time
    const currentTime = window.__currentAudioTime || 0;

    if (this.lyricsList && this.lyricsList.length > 0) {
      let targetIndex = -1;
      for (let i = 0; i < this.lyricsList.length; i++) {
        if (currentTime >= this.lyricsList[i].time) {
          targetIndex = i;
        } else {
          break;
        }
      }

      if (targetIndex !== this.currentLineIndex && targetIndex >= 0) {
        this.currentLineIndex = targetIndex;
        this.lastLineTransitionTime = time;
        this.textPopScale = 1.35; // Pop impulse on new lyric line!

        const currentText = this.lyricsList[this.currentLineIndex]?.text || '';
        const prevText = this.currentLineIndex > 0 ? this.lyricsList[this.currentLineIndex - 1]?.text : '';
        const nextText = this.currentLineIndex + 1 < this.lyricsList.length ? this.lyricsList[this.currentLineIndex + 1]?.text : '';

        this._renderTextToCanvas(this.activeCtx, currentText, true);
        this._renderTextToCanvas(this.prevCtx, prevText, false);
        this._renderTextToCanvas(this.nextCtx, nextText, false);

        this.activeTexture.needsUpdate = true;
        this.prevTexture.needsUpdate = true;
        this.nextTexture.needsUpdate = true;
      }
    }

    // Kinetic Animation on active text
    if (this.activeTextMesh) {
      // Exponential decay of pop scale
      this.textPopScale += (1.0 - this.textPopScale) * 0.12;

      // Bass punch pulse
      const kickPulse = kickPunch * 0.28;
      const totalScale = this.textPopScale + kickPulse;
      this.activeTextMesh.scale.set(totalScale, totalScale, 1);

      // Subtle float wave
      this.activeTextMesh.position.y = Math.sin(time * 2.5) * 0.4;
      this.activeTextMesh.rotation.z = Math.sin(time * 1.5) * 0.02;

      // Subtle 3D tilt
      this.activeTextMesh.rotation.y = Math.sin(time * 0.8) * 0.06;
    }

    // Previous & Next text subtle movement
    if (this.prevTextMesh) {
      this.prevTextMesh.position.y = 7.5 + Math.sin(time * 2.0) * 0.3;
    }
    if (this.nextTextMesh) {
      this.nextTextMesh.position.y = -6.5 + Math.sin(time * 2.0 + 1) * 0.3;
    }

    // Rotate surrounding equalizer rings
    this.surroundingRings.forEach((ring, idx) => {
      ring.rotation.z += (0.2 + idx * 0.15 + kickPunch * 0.4) * delta;
      const ringScale = 1.0 + (kickPunch * 0.15) * (idx + 1);
      ring.scale.set(ringScale, ringScale, ringScale);
    });

    // Particle swirl
    if (this.particles) {
      this.particles.rotation.y += (0.1 + bass * 0.2) * delta;
      this.particles.rotation.x = Math.sin(time * 0.4) * 0.1;
    }

    // Grid wave
    if (this.gridFloor) {
      this.gridFloor.position.z = (this.gridFloor.position.z + 20 * delta) % 10;
    }
  }

  setPalette(palette) {
    this.palette = palette;
    this.surroundingRings.forEach((ring, idx) => {
      ring.material.color.copy(idx === 0 ? palette.primary : (idx === 1 ? palette.secondary : palette.accent));
    });
    if (this.particles) {
      this.particles.material.color.copy(palette.accent);
    }
    if (this.gridFloor) {
      this.gridFloor.material.color.copy(palette.secondary);
    }
    // Re-render text with new palette colors
    if (this.lyricsList.length > 0 && this.currentLineIndex >= 0) {
      const currentText = this.lyricsList[this.currentLineIndex]?.text || '';
      this._renderTextToCanvas(this.activeCtx, currentText, true);
      this.activeTexture.needsUpdate = true;
    }
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
