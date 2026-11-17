/**
 * AudioManager.js
 * Controls Web Audio API, AnalyserNode, frequency bands, beat detection,
 * stream destination for video recording, and a built-in procedural synthesizer.
 */
export class AudioManager {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.audioSource = null;
    this.streamDestination = null;
    this.gainNode = null;
    this.micStream = null;
    this.micSource = null;

    // Procedural Synth state
    this.isSynthRunning = false;
    this.synthInterval = null;
    this.synthGain = null;

    // High resolution FFT: 2048 samples = 1024 bins (~21.5 Hz per bin)
    this.fftSize = 2048;
    this.frequencyData = new Uint8Array(this.fftSize / 2);
    this.timeDomainData = new Uint8Array(this.fftSize / 2);

    // Filtered / smoothed audio metrics
    this.metrics = {
      subBass: 0,      // 20 - 65 Hz (deep rumble)
      kick: 0,         // 65 - 130 Hz (punchy kick transient)
      bass: 0,         // Combined bass
      lowMid: 0,       // 250 - 600 Hz
      mid: 0,          // 600 - 2500 Hz
      highMid: 0,      // 2500 - 6000 Hz
      treble: 0,       // 6000 - 16000 Hz
      overallEnergy: 0,
      kickPunch: 0,    // Instantaneous 1.0 transient pulse that decays quickly (0 lag!)
      snareHit: 0,     // Snare/Clap transient
      isBeat: false,
      beatIntensity: 0,
      bpmEstimate: 120
    };

    // Onset & Transient Analysis
    this.prevKickEnergy = 0;
    this.prevSnareEnergy = 0;
    this.energyHistory = [];
    this.energyHistorySize = 40;
    this.lastBeatTime = 0;
    this.beatIntervals = [];

    // User Configurable
    this.sensitivity = 1.4;
    this.bassBoost = 1.8;
    this.beatThreshold = 1.25;

    this.onTrackEnded = null;
    this.onTimeUpdate = null;
    this.onTrackLoaded = null;

    this._setupAudioElementEvents();
  }

  init() {
    if (this.audioCtx) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContextClass();

    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = this.fftSize;
    // Lower smoothing for faster, punchier transient response
    this.analyser.smoothingTimeConstant = 0.72;

    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.value = 1.0;

    // Media stream destination for capturing canvas + audio in VideoRecorder
    this.streamDestination = this.audioCtx.createMediaStreamDestination();

    // Connect audioElement source
    try {
      this.audioSource = this.audioCtx.createMediaElementSource(this.audioElement);
      this.audioSource.connect(this.analyser);
      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);
      this.gainNode.connect(this.streamDestination);
    } catch (e) {
      console.warn('AudioSource connection error:', e);
    }
  }

  ensureContext() {
    this.init();
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  _setupAudioElementEvents() {
    this.audioElement.addEventListener('ended', () => {
      if (this.onTrackEnded) this.onTrackEnded();
    });

    this.audioElement.addEventListener('timeupdate', () => {
      if (this.onTimeUpdate) {
        this.onTimeUpdate(this.audioElement.currentTime, this.audioElement.duration || 0);
      }
    });

    this.audioElement.addEventListener('loadedmetadata', () => {
      if (this.onTrackLoaded) {
        this.onTrackLoaded(this.audioElement.duration);
      }
    });
  }

  async loadUrl(url) {
    this.stopSynth();
    this.ensureContext();
    this.audioElement.pause();
    this.audioElement.src = url;
    await this.audioElement.play();
  }

  async loadLocalFile(file) {
    this.stopSynth();
    this.ensureContext();
    const objectUrl = URL.createObjectURL(file);
    this.audioElement.pause();
    this.audioElement.src = objectUrl;
    await this.audioElement.play();
  }

  play() {
    this.ensureContext();
    if (this.isSynthRunning) return;
    return this.audioElement.play();
  }

  pause() {
    if (this.isSynthRunning) {
      this.stopSynth();
    } else {
      this.audioElement.pause();
    }
  }

  togglePlay() {
    if (this.isSynthRunning) {
      this.stopSynth();
      return false;
    }
    if (this.audioElement.paused) {
      this.play();
      return true;
    } else {
      this.pause();
      return false;
    }
  }

  seek(seconds) {
    if (!this.isSynthRunning && this.audioElement.duration) {
      this.audioElement.currentTime = seconds;
    }
  }

  getCurrentTime() {
    if (this.isSynthRunning && this.audioCtx) {
      return (performance.now() * 0.001) % 120; // 2 min loop
    }
    return this.audioElement.currentTime || 0;
  }

  setVolume(val) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, val));
    }
    this.audioElement.volume = Math.max(0, Math.min(1, val));
  }

  getStream() {
    return this.streamDestination ? this.streamDestination.stream : null;
  }

  // --- PROCEDURAL SYNTHWAVE / CYBER GENERATOR ---
  playProceduralDemo(genre = 'synthwave') {
    this.ensureContext();
    this.audioElement.pause();
    this.stopSynth();
    this.isSynthRunning = true;

    const ctx = this.audioCtx;
    this.synthGain = ctx.createGain();
    this.synthGain.gain.value = 0.7;
    this.synthGain.connect(this.analyser);
    this.synthGain.connect(this.streamDestination);

    const bpm = genre === 'cyber-bass' ? 135 : (genre === 'quantum-ambient' ? 96 : 124);
    const stepTime = (60 / bpm) / 4; // 16th notes

    const notes = {
      C2: 65.41, D2: 73.42, Eb2: 77.78, F2: 87.31, G2: 98.00, Bb2: 116.54,
      C3: 130.81, D3: 146.83, Eb3: 155.56, G3: 196.00, Bb3: 233.08,
      C4: 261.63, Eb4: 311.13, F4: 349.23, G4: 392.00, Bb4: 466.16, C5: 523.25
    };

    const bassPattern = [
      notes.C2, notes.C2, notes.C3, notes.C2,
      notes.Eb2, notes.Eb2, notes.Eb3, notes.Eb2,
      notes.F2, notes.F2, notes.F3, notes.F2,
      notes.G2, notes.G2, notes.Bb2, notes.G2
    ];

    const leadPattern = [
      notes.C4, 0, notes.Eb4, notes.G4,
      0, notes.Bb4, notes.G4, 0,
      notes.C5, notes.Bb4, 0, notes.G4,
      notes.Eb4, 0, notes.F4, notes.Eb4
    ];

    let step = 0;

    const playKick = (time) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(36, time + 0.18);
      gain.gain.setValueAtTime(1.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
      osc.connect(gain);
      gain.connect(this.synthGain);
      osc.start(time);
      osc.stop(time + 0.23);
    };

    const playSnare = (time) => {
      const noise = ctx.createBufferSource();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.14, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 900;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.75, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.synthGain);
      noise.start(time);
      noise.stop(time + 0.16);
    };

    const playHihat = (time, open = false) => {
      const noise = ctx.createBufferSource();
      const dur = open ? 0.2 : 0.05;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7500;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.28, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.synthGain);
      noise.start(time);
      noise.stop(time + dur + 0.01);
    };

    const playBassNote = (freq, time) => {
      if (!freq) return;
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc2.type = 'square';
      osc2.frequency.value = freq * 1.004;

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, time);
      filter.frequency.exponentialRampToValueAtTime(200, time + stepTime * 1.8);
      filter.Q.value = 6;

      gain.gain.setValueAtTime(0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + stepTime * 1.8);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.synthGain);

      osc.start(time);
      osc2.start(time);
      osc.stop(time + stepTime * 2);
      osc2.stop(time + stepTime * 2);
    };

    const playLeadNote = (freq, time) => {
      if (!freq) return;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, time);
      filter.frequency.exponentialRampToValueAtTime(900, time + stepTime * 2.5);

      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + stepTime * 2.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.synthGain);

      osc.start(time);
      osc.stop(time + stepTime * 2.6);
    };

    let nextNoteTime = ctx.currentTime + 0.05;

    const schedule = () => {
      while (nextNoteTime < ctx.currentTime + 0.25) {
        if (step % 4 === 0) playKick(nextNoteTime);
        if (step % 8 === 4) playSnare(nextNoteTime);
        playHihat(nextNoteTime, step % 4 === 2);

        const bassFreq = bassPattern[step % bassPattern.length];
        playBassNote(bassFreq, nextNoteTime);

        const leadFreq = leadPattern[step % leadPattern.length];
        playLeadNote(leadFreq, nextNoteTime);

        step++;
        nextNoteTime += stepTime;
      }
    };

    this.synthInterval = setInterval(schedule, 35);
  }

  stopSynth() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.synthGain) {
      try {
        this.synthGain.disconnect();
      } catch {}
      this.synthGain = null;
    }
    this.isSynthRunning = false;
  }

  // --- Real-time Audio Frequency & High-Precision Beat Extraction ---
  update() {
    if (!this.analyser) return this.metrics;

    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeDomainData);

    const length = this.frequencyData.length;

    // Helper to calculate average energy across frequency bin slices
    const getAverage = (startBin, endBin) => {
      let sum = 0;
      const start = Math.max(0, Math.min(length - 1, startBin));
      const end = Math.max(start + 1, Math.min(length, endBin));
      for (let i = start; i < end; i++) {
        sum += this.frequencyData[i];
      }
      return (sum / (end - start)) / 255;
    };

    // 2048 FFT bins (~21.5 Hz per bin)
    // Sub-bass: bins 1 - 3 (~20 - 65 Hz)
    const rawSubBass = getAverage(1, 4) * this.bassBoost * this.sensitivity;
    // Kick drum fundamental punch: bins 3 - 7 (~65 - 150 Hz)
    const rawKick = getAverage(3, 8) * this.bassBoost * this.sensitivity;
    // Low Mids (bass body): bins 8 - 25 (~170 - 550 Hz)
    const rawLowMid = getAverage(8, 25) * this.sensitivity;
    // Mids (vocals / lead synths): bins 25 - 100 (~550 - 2200 Hz)
    const rawMid = getAverage(25, 100) * this.sensitivity;
    // Snare / Clap transient band: bins 100 - 240 (~2200 - 5200 Hz)
    const rawSnare = getAverage(100, 240) * this.sensitivity;
    // Treble: bins 240 - 750 (~5200 - 16000 Hz)
    const rawTreble = getAverage(240, 750) * this.sensitivity;

    // Overall energy
    const rawOverall = getAverage(0, length) * this.sensitivity;

    // --- POSITIVE SPECTRAL FLUX & TRANSIENT KICK DETECTION ---
    const kickDelta = Math.max(0, rawKick - this.prevKickEnergy);
    this.prevKickEnergy = rawKick;

    const snareDelta = Math.max(0, rawSnare - this.prevSnareEnergy);
    this.prevSnareEnergy = rawSnare;

    // Moving average of kick energy for dynamic adaptive thresholding
    this.energyHistory.push(rawKick);
    if (this.energyHistory.length > this.energyHistorySize) {
      this.energyHistory.shift();
    }
    const avgKickEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;
    const now = performance.now();

    // Trigger precise beat if instant kick delta spikes above threshold
    // Minimum 160ms between beats (~375 BPM max)
    const kickThresholdVal = Math.max(0.08, avgKickEnergy * 0.35 * (this.beatThreshold / 1.25));
    if (kickDelta > kickThresholdVal && rawKick > 0.22 && (now - this.lastBeatTime > 160)) {
      this.metrics.isBeat = true;
      this.metrics.kickPunch = 1.0; // INSTANTANEOUS 0-latency spike!
      this.metrics.beatIntensity = Math.min(2.0, (kickDelta / Math.max(0.05, kickThresholdVal)));

      // Estimate BPM
      if (this.lastBeatTime > 0) {
        const interval = now - this.lastBeatTime;
        if (interval > 250 && interval < 1500) {
          this.beatIntervals.push(interval);
          if (this.beatIntervals.length > 8) this.beatIntervals.shift();
          const avgInterval = this.beatIntervals.reduce((a, b) => a + b, 0) / this.beatIntervals.length;
          this.metrics.bpmEstimate = Math.round(60000 / avgInterval);
        }
      }
      this.lastBeatTime = now;
    } else {
      this.metrics.isBeat = false;
      // Fast exponential decay for snappy, crisp visuals
      this.metrics.kickPunch *= 0.86;
      this.metrics.beatIntensity *= 0.88;
    }

    if (snareDelta > 0.12) {
      this.metrics.snareHit = 1.0;
    } else {
      this.metrics.snareHit *= 0.85;
    }

    // Fast-attack, smooth-decay filter
    const updateSmooth = (current, target, attack = 0.5, release = 0.25) => {
      const factor = target > current ? attack : release;
      return current + (target - current) * factor;
    };

    this.metrics.subBass = updateSmooth(this.metrics.subBass, Math.min(1.8, rawSubBass), 0.6, 0.25);
    this.metrics.kick = updateSmooth(this.metrics.kick, Math.min(1.8, rawKick), 0.7, 0.3);
    this.metrics.bass = (this.metrics.subBass * 0.45 + this.metrics.kick * 0.55);
    this.metrics.lowMid = updateSmooth(this.metrics.lowMid, Math.min(1.5, rawLowMid), 0.5, 0.25);
    this.metrics.mid = updateSmooth(this.metrics.mid, Math.min(1.5, rawMid), 0.5, 0.25);
    this.metrics.highMid = updateSmooth(this.metrics.highMid, Math.min(1.5, rawSnare), 0.5, 0.25);
    this.metrics.treble = updateSmooth(this.metrics.treble, Math.min(1.5, rawTreble), 0.5, 0.25);
    this.metrics.overallEnergy = updateSmooth(this.metrics.overallEnergy, Math.min(1.5, rawOverall), 0.5, 0.25);

    return this.metrics;
  }
}
