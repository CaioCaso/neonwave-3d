import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { PALETTES } from './Palettes.js';
import { CyberTunnel } from './scenes/CyberTunnel.js';
import { OrganicCore } from './scenes/OrganicCore.js';
import { SynthwaveSunset } from './scenes/SynthwaveSunset.js';
import { QuantumGalaxy } from './scenes/QuantumGalaxy.js';
import { MonolithCity } from './scenes/MonolithCity.js';
import { CyberLyrics } from './scenes/CyberLyrics.js';

export class VisualizerEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.bloomPass = null;
    this.controls = null;

    // Palette & Scene management
    this.currentPaletteKey = 'cyberpunk';
    this.currentPalette = PALETTES[this.currentPaletteKey];
    this.currentSceneKey = 'tunnel';
    this.activeSceneInstance = null;

    // Camera settings
    this.cameraMode = 'cinematic'; // 'cinematic' | 'orbit'
    this.baseFov = 65;
    this.cameraDistance = 45;
    this.camAngle = 0;

    // Shake & Impact
    this.shakeIntensity = 0;
    this.shakeDecay = 0.88;

    this.clock = new THREE.Clock();
    this.isRunning = false;

    // Lyrics cache
    this.currentLyrics = [];

    this._init();
  }

  _init() {
    // 1. Scene & Background
    this.scene = new THREE.Scene();
    this.scene.background = this.currentPalette.background.clone();
    this.scene.fog = new THREE.FogExp2(this.currentPalette.background, 0.012);

    // 2. Camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(this.baseFov, aspect, 0.1, 1000);
    this.camera.position.set(0, 5, this.cameraDistance);

    // 3. Renderer with high performance & preserveDrawingBuffer for video recording
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true // Crucial for canvas.captureStream()
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // 4. Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 40, 30);
    this.scene.add(dirLight);

    // 5. Post-processing Unreal Bloom
    const renderScene = new RenderPass(this.scene, this.camera);
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,  // bloom strength
      0.4,  // radius
      0.2   // threshold
    );

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(this.bloomPass);

    // 6. Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 160;
    this.controls.minDistance = 5;
    this.controls.enabled = false;

    // 7. Load default scene
    this.loadScene(this.currentSceneKey);

    // 8. Event listeners
    window.addEventListener('resize', () => this.onResize());
  }

  loadScene(key) {
    if (this.activeSceneInstance) {
      this.activeSceneInstance.destroy();
      this.activeSceneInstance = null;
    }

    this.currentSceneKey = key;

    switch (key) {
      case 'tunnel':
        this.activeSceneInstance = new CyberTunnel(this.scene, this.currentPalette);
        this.camera.position.set(0, 0, 10);
        this.camera.lookAt(0, 0, -100);
        break;
      case 'core':
        this.activeSceneInstance = new OrganicCore(this.scene, this.currentPalette);
        this.camera.position.set(0, 10, 36);
        this.camera.lookAt(0, 0, 0);
        break;
      case 'synthwave':
        this.activeSceneInstance = new SynthwaveSunset(this.scene, this.currentPalette);
        this.camera.position.set(0, 6, 25);
        this.camera.lookAt(0, 8, -60);
        break;
      case 'galaxy':
        this.activeSceneInstance = new QuantumGalaxy(this.scene, this.currentPalette);
        this.camera.position.set(0, 25, 45);
        this.camera.lookAt(0, 0, 0);
        break;
      case 'city':
        this.activeSceneInstance = new MonolithCity(this.scene, this.currentPalette);
        this.camera.position.set(28, 26, 38);
        this.camera.lookAt(0, 0, 0);
        break;
      case 'lyrics':
        this.activeSceneInstance = new CyberLyrics(this.scene, this.currentPalette);
        this.activeSceneInstance.setLyrics(this.currentLyrics);
        this.camera.position.set(0, 0, 30);
        this.camera.lookAt(0, 0, 0);
        break;
      default:
        this.activeSceneInstance = new CyberTunnel(this.scene, this.currentPalette);
    }
  }

  clearLyrics(trackInfo) {
    this.currentLyrics = [];
    if (this.activeSceneInstance && typeof this.activeSceneInstance.clearLyrics === 'function') {
      this.activeSceneInstance.clearLyrics(trackInfo);
    }
  }

  setLyrics(lyrics, trackInfo) {
    this.currentLyrics = lyrics || [];
    if (this.activeSceneInstance && typeof this.activeSceneInstance.setLyrics === 'function') {
      this.activeSceneInstance.setLyrics(this.currentLyrics, trackInfo);
    }
  }

  setPalette(paletteKey) {
    if (!PALETTES[paletteKey]) return;
    this.currentPaletteKey = paletteKey;
    this.currentPalette = PALETTES[paletteKey];

    this.scene.background.copy(this.currentPalette.background);
    this.scene.fog.color.copy(this.currentPalette.background);

    if (this.activeSceneInstance) {
      this.activeSceneInstance.setPalette(this.currentPalette);
    }
  }

  setBloomIntensity(val) {
    if (this.bloomPass) {
      this.bloomPass.strength = Math.max(0, Math.min(3.5, val));
    }
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
    this.controls.enabled = (mode === 'orbit');
  }

  // Set explicit resolution for 1080p video recording
  setResolution(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height, false); // false = don't update css style
    this.composer.setSize(width, height);
  }

  resetScreenResolution() {
    this.onResize();
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  start() {
    this.isRunning = true;
    this.clock.start();
  }

  stop() {
    this.isRunning = false;
  }

  render(audioMetrics, freqData) {
    const delta = this.clock.getDelta();
    const time = performance.now() * 0.001;

    window.__visualizerFreqData = freqData;

    // 1. Update Active Scene
    if (this.activeSceneInstance) {
      this.activeSceneInstance.update(audioMetrics, delta);
    }

    // 2. Camera Choreography & Transient Kick Reactivity
    const kickPunch = audioMetrics.kickPunch || 0;
    const bass = audioMetrics.bass || 0;

    // Instant kick screen shake
    if (audioMetrics.isBeat || kickPunch > 0.6) {
      this.shakeIntensity = Math.min(1.4, kickPunch * 0.9);
    }
    this.shakeIntensity *= this.shakeDecay;

    if (this.cameraMode === 'cinematic') {
      if (this.currentSceneKey === 'tunnel') {
        this.camera.position.x = Math.sin(time * 0.8) * 1.5;
        this.camera.position.y = Math.cos(time * 0.6) * 1.5;
        this.camera.position.z = 10 - kickPunch * 4.5; // Instant forward kick thrust!
        this.camera.rotation.z = Math.sin(time * 0.4) * 0.2;
      } else if (this.currentSceneKey === 'synthwave') {
        this.camera.position.x = Math.sin(time * 0.3) * 6;
        this.camera.position.y = 5.5 + Math.sin(time * 0.5) * 1.2;
        this.camera.position.z = 24 - kickPunch * 3.5;
        this.camera.lookAt(0, 7, -60);
      } else if (this.currentSceneKey === 'lyrics') {
        // Subtle drift in front of the 3D typography
        this.camera.position.x = Math.sin(time * 0.5) * 3;
        this.camera.position.y = Math.cos(time * 0.4) * 1.5;
        this.camera.position.z = 30 - kickPunch * 4.0;
        this.camera.lookAt(0, 0, 0);
      } else {
        this.camAngle += (0.15 + audioMetrics.overallEnergy * 0.2) * delta;
        const dist = (this.currentSceneKey === 'galaxy' ? 48 : 38) - kickPunch * 4.5;
        const camHeight = (this.currentSceneKey === 'galaxy' ? 22 : 12) + Math.sin(time * 0.4) * 5;

        this.camera.position.x = Math.sin(this.camAngle) * dist;
        this.camera.position.z = Math.cos(this.camAngle) * dist;
        this.camera.position.y = camHeight;
        this.camera.lookAt(0, 2, 0);
      }

      // Dynamic FOV punch on kick drop
      const targetFov = this.baseFov + (kickPunch * 10.0) + (bass * 4.0);
      this.camera.fov += (targetFov - this.camera.fov) * 0.25;
      this.camera.updateProjectionMatrix();

      // Screen micro-shake
      if (this.shakeIntensity > 0.02) {
        this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
        this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      }
    } else if (this.cameraMode === 'orbit') {
      this.controls.update();
    }

    // 3. Render Post-Processed Frame
    this.composer.render();
  }
}
