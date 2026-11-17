import { AudioManager } from './audio/AudioManager.js';
import { VisualizerEngine } from './visualizer/VisualizerEngine.js';
import { VideoRecorder } from './recorder/VideoRecorder.js';

// Initialize core components
const canvas = document.getElementById('visualizer-canvas');
const audioManager = new AudioManager();
const visualizer = new VisualizerEngine(canvas);
const videoRecorder = new VideoRecorder(canvas, audioManager, visualizer);

// Current Track Info State
const currentTrack = {
  title: 'Neon Cyber Drive (Procedural Synth)',
  artist: 'Antigravity SoundLab',
  thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&q=80',
  duration: 0
};

// Recording options state
let selectedDurationSec = 0; // 0 = manual stop
let selectedResolution = '1080p'; // '1080p' | '1080p-vertical' | 'native'
let isZenMode = false;
let youtubeMode = false;
let youtubePlayer = null;
let youtubeApiReady = null;

// Lyrics State
let lyricsOffset = 0; // seconds
let rawLyricsText = `[00:00.00] NEONWAVE 3D INITIATED
[00:04.00] SYNTHESIS OF SOUND AND LIGHT
[00:08.00] TRAVELING THROUGH CYBER SPACE
[00:12.00] 124 BEATS PER MINUTE PULSING
[00:16.00] FEEL THE BASS HIT YOUR SOUL
[00:20.00] RETRO FUTURISTIC NIGHT DRIVE
[00:24.00] DIGITAL PARTICLES COLLIDING
[00:28.00] ELECTRIC DREAMS AWAKEN
[00:32.00] BASS DROP INCOMING
[00:36.00] PURE KINETIC ENERGY
[00:40.00] NEON HORIZONS EXTENDING
[00:44.00] INFINITE RETRO RUNWAY
[00:48.00] FREQUENCIES UNLEASHED
[00:52.00] NEONWAVE 3D AUDIO VISUALIZER`;

// DOM Elements
const youtubeForm = document.getElementById('youtube-form');
const youtubeUrlInput = document.getElementById('youtube-url-input');
const btnLoadYoutube = document.getElementById('btn-load-youtube');
const youtubePlayerPanel = document.getElementById('youtube-player-panel');
const youtubePlayerFrame = document.getElementById('youtube-player-frame');
const btnConnectYoutubeAudio = document.getElementById('btn-connect-youtube-audio');
const loadBtnText = document.getElementById('load-btn-text');
const loadSpinner = document.getElementById('load-spinner');
const demoSelect = document.getElementById('demo-select');
const fileInput = document.getElementById('file-input');

const trackThumb = document.getElementById('track-thumb');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const beatBadge = document.getElementById('beat-badge');
const kickIndicator = document.getElementById('kick-indicator');
const frequencyLabel = document.getElementById('frequency-label');
const audioScrubber = document.getElementById('audio-scrubber');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');
const btnPlayPause = document.getElementById('btn-play-pause');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const volumeSlider = document.getElementById('volume-slider');

const settingsPanel = document.getElementById('settings-panel');
const btnToggleSettings = document.getElementById('btn-toggle-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnFullscreen = document.getElementById('btn-fullscreen');
const btnZenMode = document.getElementById('btn-zen-mode');
const btnFloatingEye = document.getElementById('btn-floating-eye');

const btnRecordVideo = document.getElementById('btn-record-video');
const recordBtnText = document.getElementById('record-btn-text');
const recordingHud = document.getElementById('recording-hud');
const recTimer = document.getElementById('rec-timer');
const btnStopRecording = document.getElementById('btn-stop-recording');

const exportModal = document.getElementById('export-modal');
const exportVideoPreview = document.getElementById('export-video-preview');
const exportMetaFormat = document.getElementById('export-meta-format');
const exportMetaDur = document.getElementById('export-meta-dur');
const exportMetaSize = document.getElementById('export-meta-size');
const btnDownloadVideo = document.getElementById('btn-download-video');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnModalDismiss = document.getElementById('btn-modal-dismiss');

// Lyrics Elements
const btnOpenLyrics = document.getElementById('btn-open-lyrics');
const lyricsModal = document.getElementById('lyrics-modal');
const btnCloseLyricsModal = document.getElementById('btn-close-lyrics-modal');
const lyricsTextarea = document.getElementById('lyrics-textarea');
const btnApplyLyrics = document.getElementById('btn-apply-lyrics');
const btnFetchLyricsAuto = document.getElementById('btn-fetch-lyrics-auto');
const lyricsCountBadge = document.getElementById('lyrics-count-badge');
const offsetLabel = document.getElementById('offset-label');
const btnOffsetMinus = document.getElementById('btn-offset-minus');
const btnOffsetPlus = document.getElementById('btn-offset-plus');

// Sliders
const sliderBloom = document.getElementById('slider-bloom');
const valBloom = document.getElementById('val-bloom');
const sliderSens = document.getElementById('slider-sens');
const valSens = document.getElementById('val-sens');
const sliderBass = document.getElementById('slider-bass');
const valBass = document.getElementById('val-bass');
const sliderBeatThresh = document.getElementById('slider-beat-thresh');
const valBeatThresh = document.getElementById('val-beat-thresh');

// Helper to format seconds into mm:ss
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ----------------- LRC PARSER & LYRICS MANAGEMENT -----------------
function parseLRC(lrcText, offsetSec = 0) {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const result = [];
  const regex = /\[(\d{2}):(\d{2}(?:\.\d+)?)\](.*)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const match = line.match(regex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseFloat(match[2]);
      const text = match[3].trim();
      if (text) {
        result.push({
          time: Math.max(0, minutes * 60 + seconds + offsetSec),
          text
        });
      }
    } else {
      // Plain line without timestamp: space evenly
      result.push({
        time: i * 4.0 + offsetSec,
        text: line
      });
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

function applyLyricsToEngine() {
  rawLyricsText = lyricsTextarea.value;
  const parsed = parseLRC(rawLyricsText, lyricsOffset);
  visualizer.setLyrics(parsed, currentTrack);
  lyricsCountBadge.textContent = parsed.length > 0 ? `${parsed.length} Linhas` : 'Sem letra';
}

// Initial lyrics load
lyricsTextarea.value = rawLyricsText;
applyLyricsToEngine();

// Automatic Lyrics Fetcher from Backend
async function fetchLyricsForTrack(title, artist) {
  lyricsCountBadge.textContent = 'Buscando letra...';
  const dot = document.getElementById('lyrics-status-dot');
  if (dot) dot.className = 'w-2 h-2 rounded-full bg-yellow-400 animate-ping';

  try {
    const res = await fetch(`/api/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist || '')}`);
    if (!res.ok) throw new Error('Falha na resposta');
    const data = await res.json();

    if (data && data.success && data.syncedLyrics) {
      lyricsTextarea.value = data.syncedLyrics;
      applyLyricsToEngine();
      if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-400';
      console.log('Letras sincronizadas carregadas com sucesso para:', title);
    } else if (data && data.success && data.plainLyrics) {
      lyricsTextarea.value = data.plainLyrics;
      applyLyricsToEngine();
      if (dot) dot.className = 'w-2 h-2 rounded-full bg-cyan-400';
      console.log('Letra simples carregada para:', title);
    } else {
      // Nenhuma letra encontrada: LIMPA completamente as letras anteriores!
      lyricsTextarea.value = '';
      lyricsCountBadge.textContent = 'Sem letra';
      if (dot) dot.className = 'w-2 h-2 rounded-full bg-gray-500';
      visualizer.clearLyrics(currentTrack);
      console.log('Nenhuma letra encontrada online para:', title);
    }
  } catch (err) {
    console.warn('Erro ao buscar letra:', err.message);
    lyricsTextarea.value = '';
    lyricsCountBadge.textContent = 'Sem letra';
    if (dot) dot.className = 'w-2 h-2 rounded-full bg-gray-500';
    visualizer.clearLyrics(currentTrack);
  }
}

// Lyrics Modal Controls
btnOpenLyrics.addEventListener('click', () => {
  lyricsModal.classList.remove('hidden');
});
btnCloseLyricsModal.addEventListener('click', () => {
  lyricsModal.classList.add('hidden');
});
btnApplyLyrics.addEventListener('click', () => {
  applyLyricsToEngine();
  lyricsModal.classList.add('hidden');
  // Switch to lyrics scene if not active
  const lyricBtn = document.querySelector('.scene-btn[data-scene="lyrics"]');
  if (lyricBtn) lyricBtn.click();
});
btnFetchLyricsAuto.addEventListener('click', () => {
  fetchLyricsForTrack(currentTrack.title, currentTrack.artist);
});

btnOffsetMinus.addEventListener('click', () => {
  lyricsOffset -= 0.5;
  offsetLabel.textContent = `${lyricsOffset > 0 ? '+' : ''}${lyricsOffset.toFixed(1)}s`;
  applyLyricsToEngine();
});
btnOffsetPlus.addEventListener('click', () => {
  lyricsOffset += 0.5;
  offsetLabel.textContent = `${lyricsOffset > 0 ? '+' : ''}${lyricsOffset.toFixed(1)}s`;
  applyLyricsToEngine();
});

// Update Now Playing UI Card
function updateTrackHUD(title, artist, thumb, duration = 0) {
  currentTrack.title = title;
  currentTrack.artist = artist;
  currentTrack.thumbnail = thumb;
  currentTrack.duration = duration;

  trackTitle.textContent = title;
  trackArtist.textContent = artist;
  trackThumb.src = thumb;
  timeTotal.textContent = duration > 0 ? formatTime(duration) : 'LIVE';
}

// ----------------- YOUTUBE LOADER -----------------
async function loadYouTubeTrack(url) {
  if (!url || !url.trim() || btnLoadYoutube.disabled) return;

  loadBtnText.textContent = 'Carregando...';
  loadSpinner.classList.remove('hidden');
  btnLoadYoutube.disabled = true;
  btnPlayPause.disabled = true;

  // LIMPEZA IMEDIATA: reseta a letra antiga assim que um novo link é enviado!
  lyricsOffset = 0;
  offsetLabel.textContent = '0.0s';
  lyricsTextarea.value = '';
  lyricsCountBadge.textContent = 'Buscando letra...';
  visualizer.clearLyrics({ title: 'Carregando...', artist: '' });

  try {
    const videoId = extractYouTubeId(url);
    if (!videoId) throw new Error('Link do YouTube inválido.');
    audioManager.stopTabCapture();
    audioManager.pause();
    youtubeMode = true;
    youtubePlayer = null;
    youtubePlayerPanel.classList.remove('hidden');
    youtubePlayerPanel.classList.add('flex');
    youtubePlayerFrame.innerHTML = '<div id="youtube-player" class="w-full h-full"></div>';
    const infoRes = await fetch(`/api/info?url=${encodeURIComponent(url.trim())}`);
    if (!infoRes.ok) {
      const err = await infoRes.json();
      throw new Error(err.error || 'Erro ao carregar informações da música');
    }
    const info = await infoRes.json();

    updateTrackHUD(info.title, info.author, info.thumbnail, info.duration);

    // Atualiza o visualizer 3D com o novo título enquanto a letra é pesquisada
    visualizer.clearLyrics(currentTrack);

    // Auto-search synchronized lyrics for the NEW song
    fetchLyricsForTrack(info.title, info.author);

    await loadYouTubePlayer(videoId);
    updatePlayPauseIcons(false);
  } catch (error) {
    console.error('Falha ao carregar YouTube:', error);
    alert(`Erro ao processar link do YouTube: ${error.message}\n\nDica: você também pode usar o botão "Subir Áudio" ou testar as "Músicas Demo"!`);
  } finally {
    loadBtnText.textContent = 'Carregar';
    loadSpinner.classList.add('hidden');
    btnLoadYoutube.disabled = false;
    btnPlayPause.disabled = false;
  }
}

function extractYouTubeId(value) {
  try {
    const parsed = new URL(value.trim());
    if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1).split('/')[0] || null;
    if (parsed.hostname.endsWith('youtube.com')) {
      if (parsed.pathname === '/watch') return parsed.searchParams.get('v');
      return parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] || null;
    }
  } catch {}
  return null;
}

function loadYouTubePlayer(videoId) {
  if (window.YT?.Player) return createYouTubePlayer(videoId);
  if (!youtubeApiReady) {
    youtubeApiReady = new Promise((resolve) => {
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        resolve();
      };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    });
  }
  return youtubeApiReady.then(() => createYouTubePlayer(videoId));
}

function createYouTubePlayer(videoId) {
  return new Promise((resolve, reject) => {
    try {
      youtubePlayer = new window.YT.Player('youtube-player', {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { controls: 1, playsinline: 1, origin: location.origin },
        events: {
          onReady: () => resolve(),
          onStateChange: (event) => {
            const playing = event.data === window.YT.PlayerState.PLAYING;
            updatePlayPauseIcons(playing);
            if (playing) startYouTubeClock();
            else if (youtubeClock) clearInterval(youtubeClock);
          },
          onError: (event) => {
            console.warn('YouTube player error:', event.data);
            const reason = event.data === 101 || event.data === 150
              ? 'Este vídeo não permite reprodução incorporada. Tente outra música do YouTube.'
              : 'O YouTube não conseguiu reproduzir este vídeo. Verifique se ele está disponível para sua região/conta.';
            btnConnectYoutubeAudio.textContent = reason;
          }
        }
      });
    } catch (error) { reject(error); }
  });
}

let youtubeClock = null;
function startYouTubeClock() {
  if (youtubeClock) clearInterval(youtubeClock);
  youtubeClock = setInterval(() => {
    if (!youtubePlayer || !youtubeMode) return;
    const current = youtubePlayer.getCurrentTime() || 0;
    const total = youtubePlayer.getDuration() || 0;
    timeCurrent.textContent = formatTime(current);
    timeTotal.textContent = total > 0 ? formatTime(total) : 'LIVE';
    audioScrubber.value = total > 0 ? (current / total) * 100 : 0;
  }, 250);
}

function clearYouTubePlayback() {
  youtubeMode = false;
  if (youtubeClock) clearInterval(youtubeClock);
  youtubeClock = null;
  youtubePlayer?.stopVideo?.();
  youtubePlayer = null;
  youtubePlayerPanel.classList.add('hidden');
  youtubePlayerPanel.classList.remove('flex');
  audioManager.stopTabCapture();
}

btnConnectYoutubeAudio.addEventListener('click', async () => {
  btnConnectYoutubeAudio.disabled = true;
  btnConnectYoutubeAudio.textContent = 'Aguardando seleção da guia…';
  try {
    await audioManager.captureCurrentTabAudio();
    btnConnectYoutubeAudio.textContent = 'Áudio conectado • visualizador ativo';
    btnConnectYoutubeAudio.classList.add('text-emerald-300');
  } catch (error) {
    console.error('Não foi possível capturar o áudio da guia:', error);
    alert(error.message || 'Não foi possível conectar o áudio desta guia.');
    btnConnectYoutubeAudio.textContent = 'Conectar áudio desta aba ao visualizador';
  } finally {
    btnConnectYoutubeAudio.disabled = false;
  }
});

youtubeForm.addEventListener('submit', (e) => {
  e.preventDefault();
  // Resume/create Web Audio directly inside the user gesture for Chrome autoplay policy.
  audioManager.ensureContext();
  loadYouTubeTrack(youtubeUrlInput.value);
});

// ----------------- DEMO TRACKS SELECTOR -----------------
demoSelect.addEventListener('change', (e) => {
  const genre = e.target.value;
  if (!genre) return;
  clearYouTubePlayback();

  if (genre === 'synthwave-retro') {
    updateTrackHUD(
      'Neon Cyber Drive (124 BPM)',
      'Antigravity SoundLab (Procedural Synth)',
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&q=80',
      0
    );
    lyricsTextarea.value = rawLyricsText;
    applyLyricsToEngine();
    audioManager.playProceduralDemo('synthwave');
  } else if (genre === 'cyber-bass') {
    updateTrackHUD(
      'Hyperdrive Cyber Bass (135 BPM)',
      'DeepBeat Studio (Procedural EDM)',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80',
      0
    );
    lyricsTextarea.value = `[00:00.00] 135 BPM CYBER BASS OVERDRIVE\n[00:04.00] SUB-WOOFER FREQUENCIES PEAKING\n[00:08.00] FEEL THE COMPRESSION WAVE\n[00:12.00] SYNCHRONIZED MATRIX UNLOCKED\n[00:16.00] MAXIMUM PRESSURE IN 3D`;
    applyLyricsToEngine();
    audioManager.playProceduralDemo('cyber-bass');
  } else if (genre === 'quantum-ambient') {
    updateTrackHUD(
      'Cosmic Singularity (95 BPM)',
      'Orbital Resonance (Ambient Sub)',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80',
      0
    );
    lyricsTextarea.value = `[00:00.00] COSMIC SINGULARITY\n[00:06.00] RESONANCE OF THE VOID\n[00:12.00] DRIFTING BEYOND TIME`;
    applyLyricsToEngine();
    audioManager.playProceduralDemo('quantum-ambient');
  }

  updatePlayPauseIcons(true);
});

// ----------------- LOCAL FILE UPLOAD -----------------
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  clearYouTubePlayback();

  const fileName = file.name.replace(/\.[^/.]+$/, '');
  updateTrackHUD(
    fileName,
    'Arquivo Local',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
    0
  );

  // Limpa letras antigas imediatamente
  lyricsOffset = 0;
  offsetLabel.textContent = '0.0s';
  lyricsTextarea.value = '';
  visualizer.clearLyrics(currentTrack);

  fetchLyricsForTrack(fileName, '');

  await audioManager.loadLocalFile(file);
  updatePlayPauseIcons(true);
});

// ----------------- PLAYBACK CONTROLS -----------------
function updatePlayPauseIcons(isPlaying) {
  if (isPlaying) {
    iconPlay.classList.add('hidden');
    iconPause.classList.remove('hidden');
  } else {
    iconPlay.classList.remove('hidden');
    iconPause.classList.add('hidden');
  }
}

btnPlayPause.addEventListener('click', () => {
  if (youtubeMode && youtubePlayer) {
    if (youtubePlayer.getPlayerState() === window.YT.PlayerState.PLAYING) youtubePlayer.pauseVideo();
    else youtubePlayer.playVideo();
    return;
  }
  const isPlaying = audioManager.togglePlay();
  updatePlayPauseIcons(isPlaying);
});

volumeSlider.addEventListener('input', (e) => {
  if (youtubeMode && youtubePlayer) {
    youtubePlayer.setVolume(Math.round(parseFloat(e.target.value) * 100));
    return;
  }
  audioManager.setVolume(parseFloat(e.target.value));
});

audioManager.onTimeUpdate = (current, total) => {
  if (youtubeMode) return;
  timeCurrent.textContent = formatTime(current);
  if (total > 0) {
    timeTotal.textContent = formatTime(total);
    audioScrubber.value = (current / total) * 100;
  }
};

audioScrubber.addEventListener('input', (e) => {
  if (youtubeMode && youtubePlayer) {
    const duration = youtubePlayer.getDuration();
    if (duration > 0) youtubePlayer.seekTo((parseFloat(e.target.value) / 100) * duration, true);
    return;
  }
  if (audioManager.audioElement.duration) {
    const seekTime = (parseFloat(e.target.value) / 100) * audioManager.audioElement.duration;
    audioManager.seek(seekTime);
  }
});

// ----------------- SCENE & PALETTE BUTTONS -----------------
document.querySelectorAll('.scene-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.scene-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    visualizer.loadScene(btn.dataset.scene);
  });
});

document.querySelectorAll('.palette-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    visualizer.setPalette(btn.dataset.palette);
  });
});

document.querySelectorAll('.camera-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.camera-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    visualizer.setCameraMode(btn.dataset.cam);
  });
});

// Sliders: Bass Precision & Beat Sensitivity
sliderBass.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  valBass.textContent = `${val.toFixed(1)}x`;
  audioManager.bassBoost = val;
});

sliderBeatThresh.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  valBeatThresh.textContent = `${val.toFixed(2)}x`;
  audioManager.beatThreshold = val;
});

sliderBloom.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  valBloom.textContent = val.toFixed(1);
  visualizer.setBloomIntensity(val);
});

sliderSens.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  valSens.textContent = `${val.toFixed(1)}x`;
  audioManager.sensitivity = val;
});

// ----------------- RECORDING SETTINGS: RESOLUTION & DURATION -----------------
document.querySelectorAll('.btn-res-mode').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.btn-res-mode').forEach(b => {
      b.classList.remove('active', 'bg-white/10', 'text-cyan-400', 'font-bold');
      b.classList.add('text-gray-400');
    });
    btn.classList.add('active', 'bg-white/10', 'text-cyan-400', 'font-bold');
    selectedResolution = btn.dataset.res;

    // Update main record button label
    if (selectedResolution === '1080p') {
      recordBtnText.textContent = 'GRAVAR VÍDEO 1080p HD';
    } else if (selectedResolution === '1080p-vertical') {
      recordBtnText.textContent = 'GRAVAR 1080p SHORTS (9:16)';
    } else {
      recordBtnText.textContent = 'GRAVAR VÍDEO TELA';
    }
  });
});

document.querySelectorAll('.btn-rec-dur').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.btn-rec-dur').forEach(b => {
      b.classList.remove('active', 'bg-white/10', 'text-cyan-300', 'font-bold');
      b.classList.add('text-gray-300');
    });
    btn.classList.add('active', 'bg-white/10', 'text-cyan-300', 'font-bold');
    selectedDurationSec = parseInt(btn.dataset.sec, 10);
  });
});

// ----------------- VIDEO RECORDING ENGINE -----------------
btnRecordVideo.addEventListener('click', () => {
  if (videoRecorder.isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
});

btnStopRecording.addEventListener('click', () => {
  stopRecording();
});

function startRecording() {
  audioManager.ensureContext();
  try {
    videoRecorder.start({
      durationSeconds: selectedDurationSec,
      resolution: selectedResolution
    });
    recordingHud.classList.remove('hidden');
    btnRecordVideo.classList.add('recording');
    recordBtnText.textContent = 'PARAR GRAVAÇÃO';
  } catch (err) {
    alert(err.message);
  }
}

function stopRecording() {
  videoRecorder.stop();
  recordingHud.classList.add('hidden');
  btnRecordVideo.classList.remove('recording');
  recordBtnText.textContent = selectedResolution.includes('vertical') ? 'GRAVAR 1080p SHORTS (9:16)' : 'GRAVAR VÍDEO 1080p HD';
}

videoRecorder.onProgress = (elapsedSec, totalSec) => {
  const elapsedStr = formatTime(elapsedSec);
  const totalStr = totalSec > 0 ? formatTime(totalSec) : '∞';
  recTimer.textContent = `${elapsedStr} / ${totalStr}`;
};

videoRecorder.onComplete = ({ blob, url, duration, sizeMb, resolutionLabel, extension }) => {
  exportModal.classList.remove('hidden');
  exportVideoPreview.src = url;
  exportVideoPreview.play();

  exportMetaFormat.textContent = `${resolutionLabel} (60FPS)`;
  exportMetaDur.textContent = formatTime(duration);
  exportMetaSize.textContent = `${sizeMb} MB`;

  const safeTitle = currentTrack.title.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  btnDownloadVideo.href = url;
  btnDownloadVideo.download = `visualizer_${safeTitle}_1080p.${extension}`;
};

const closeModal = () => {
  exportModal.classList.add('hidden');
  exportVideoPreview.pause();
  exportVideoPreview.src = '';
};
btnCloseModal.addEventListener('click', closeModal);
btnModalDismiss.addEventListener('click', closeModal);

// ----------------- ZEN MODE / HIDE HUD -----------------
const floatingEyeOpen = document.getElementById('floating-eye-open');
const floatingEyeClosed = document.getElementById('floating-eye-closed');
const floatingEyeText = document.getElementById('floating-eye-text');

function toggleZenMode() {
  isZenMode = !isZenMode;
  const elements = [
    document.getElementById('top-bar'),
    document.getElementById('track-hud'),
    document.getElementById('record-bar'),
    settingsPanel
  ];

  elements.forEach(el => {
    if (isZenMode) {
      el.classList.add('hud-hidden');
    } else {
      el.classList.remove('hud-hidden');
    }
  });

  // Atualiza o botão flutuante de olho (que permanece sempre visível!)
  if (btnFloatingEye) {
    btnFloatingEye.setAttribute('aria-pressed', String(isZenMode));
    btnFloatingEye.setAttribute('aria-label', isZenMode ? 'Mostrar interface' : 'Ocultar interface');
    if (isZenMode) {
      floatingEyeOpen?.classList.add('hidden');
      floatingEyeClosed?.classList.remove('hidden');
      if (floatingEyeText) floatingEyeText.textContent = 'Mostrar HUD';
      btnFloatingEye.classList.add('border-cyan-400', 'shadow-cyan-500/40');
    } else {
      floatingEyeOpen?.classList.remove('hidden');
      floatingEyeClosed?.classList.add('hidden');
      if (floatingEyeText) floatingEyeText.textContent = 'Ocultar HUD';
      btnFloatingEye.classList.remove('border-cyan-400', 'shadow-cyan-500/40');
    }
  }
}

if (btnZenMode) btnZenMode.addEventListener('click', toggleZenMode);
if (btnFloatingEye) btnFloatingEye.addEventListener('click', toggleZenMode);

window.addEventListener('keydown', (e) => {
  if (e.key === 'h' || e.key === 'H') {
    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      toggleZenMode();
    }
  } else if (e.key === 'Escape') {
    if (!exportModal.classList.contains('hidden')) {
      closeModal();
    } else if (!lyricsModal.classList.contains('hidden')) {
      lyricsModal.classList.add('hidden');
    } else if (isZenMode) {
      toggleZenMode();
    }
  }
});

// UI Panel Toggles
btnToggleSettings.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
});
btnCloseSettings.addEventListener('click', () => {
  settingsPanel.classList.add('hidden');
});

// Fullscreen
btnFullscreen.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

// ----------------- MAIN 60 FPS RENDER LOOP -----------------
visualizer.start();

function animate() {
  requestAnimationFrame(animate);

  // 1. Calculate real-time audio metrics with high-precision transient kick onset
  const metrics = audioManager.update();

  // Expose current audio playback time for 3D lyrics synchronization
  window.__currentAudioTime = audioManager.getCurrentTime();

  // 2. High-precision Beat & Kick Flash
  if (metrics.isBeat || metrics.kickPunch > 0.65) {
    beatBadge.classList.add('bg-cyan-400', 'text-black', 'shadow-lg', 'shadow-cyan-400/50');
    beatBadge.classList.remove('bg-white/10', 'text-gray-300');
    kickIndicator.classList.add('bg-pink-500', 'text-white', 'shadow-md', 'shadow-pink-500/60');
  } else {
    beatBadge.classList.remove('bg-cyan-400', 'text-black', 'shadow-lg', 'shadow-cyan-400/50');
    beatBadge.classList.add('bg-white/10', 'text-gray-300');
    kickIndicator.classList.remove('bg-pink-500', 'text-white', 'shadow-md', 'shadow-pink-500/60');
  }

  beatBadge.textContent = `BPM: ${metrics.bpmEstimate || 120}`;
  frequencyLabel.textContent = `BASS: ${(metrics.bass * 100).toFixed(0)}%`;

  // 3. Render WebGL 3D frame
  visualizer.render(metrics, audioManager.frequencyData);
}

// Start rendering
animate();

console.log('Neonwave 3D Visualizer & Lyric Studio inicializado.');
