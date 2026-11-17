/**
 * VideoRecorder.js
 * Captures true 1080p 60FPS WebGL canvas stream + Web Audio API audio stream
 * into high bitrate MP4 / WebM downloadable video (28 Mbps pristine quality).
 */
export class VideoRecorder {
  constructor(canvas, audioManager, visualizer) {
    this.canvas = canvas;
    this.audioManager = audioManager;
    this.visualizer = visualizer;

    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;

    this.recordingStartTime = 0;
    this.maxDurationSeconds = 0;
    this.timerInterval = null;

    // Config options
    this.resolution = '1080p'; // '1080p' | '1080p-vertical' | 'native'
    this.targetWidth = 1920;
    this.targetHeight = 1080;
    this.bitrate = 28000000; // 28 Mbps for crystal clear 1080p

    this.onProgress = null;
    this.onComplete = null;
    this.onError = null;
  }

  isSupported() {
    return typeof MediaRecorder !== 'undefined' && typeof this.canvas.captureStream === 'function';
  }

  getBestMimeType() {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
      'video/webm'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'video/webm';
  }

  start({ durationSeconds = 0, resolution = '1080p' } = {}) {
    if (!this.isSupported()) {
      throw new Error('Gravação de vídeo não é suportada neste navegador.');
    }

    if (this.isRecording) return;

    this.recordedChunks = [];
    this.maxDurationSeconds = durationSeconds;
    this.resolution = resolution;

    // 1. Force exact resolution on canvas for crystal clear 1080p recording
    if (resolution === '1080p') {
      this.targetWidth = 1920;
      this.targetHeight = 1080;
      if (this.visualizer) this.visualizer.setResolution(1920, 1080);
    } else if (resolution === '1080p-vertical') {
      this.targetWidth = 1080;
      this.targetHeight = 1920;
      if (this.visualizer) this.visualizer.setResolution(1080, 1920);
    } else {
      this.targetWidth = this.canvas.width;
      this.targetHeight = this.canvas.height;
    }

    // 2. Capture 60 FPS from WebGL canvas
    const videoStream = this.canvas.captureStream(60);

    // 3. Capture Audio Stream from Web Audio API
    const audioStream = this.audioManager.getStream();

    const tracks = [...videoStream.getVideoTracks()];
    if (audioStream && audioStream.getAudioTracks().length > 0) {
      tracks.push(...audioStream.getAudioTracks());
    }

    const combinedStream = new MediaStream(tracks);
    const mimeType = this.getBestMimeType();

    try {
      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: this.bitrate // 28 Mbps High Bitrate Full HD
      });
    } catch (e) {
      this.mediaRecorder = new MediaRecorder(combinedStream);
    }

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      this._handleStop();
    };

    this.mediaRecorder.onerror = (e) => {
      console.error('MediaRecorder error:', e);
      if (this.onError) this.onError(e);
      this.stop();
    };

    this.mediaRecorder.start(400); // 400ms time slice
    this.isRecording = true;
    this.recordingStartTime = performance.now();

    // Start timer ticker
    this.timerInterval = setInterval(() => {
      const elapsed = (performance.now() - this.recordingStartTime) / 1000;
      if (this.onProgress) {
        this.onProgress(elapsed, this.maxDurationSeconds);
      }

      if (this.maxDurationSeconds > 0 && elapsed >= this.maxDurationSeconds) {
        this.stop();
      }
    }, 200);
  }

  stop() {
    if (!this.isRecording) return;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.isRecording = false;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  _handleStop() {
    // Restore screen resolution
    if (this.visualizer) {
      this.visualizer.resetScreenResolution();
    }

    const elapsedSeconds = Math.round((performance.now() - this.recordingStartTime) / 1000);
    const mimeType = this.mediaRecorder ? this.mediaRecorder.mimeType : 'video/webm';
    const blob = new Blob(this.recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const sizeMb = (blob.size / (1024 * 1024)).toFixed(1);

    const resolutionLabel = `${this.targetWidth}x${this.targetHeight}`;

    if (this.onComplete) {
      this.onComplete({
        blob,
        url,
        duration: elapsedSeconds,
        sizeMb,
        mimeType,
        resolutionLabel,
        extension: mimeType.includes('mp4') ? 'mp4' : 'webm'
      });
    }
  }
}
