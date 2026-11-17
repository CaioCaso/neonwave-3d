import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { Ytdl, chooseFormat } from '@distube/ytdl-core';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize YTDL client with realistic User-Agent
const ytdl = new Ytdl();

// Extract YouTube ID from various URL patterns
function extractYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.trim().match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Fetch basic info via oEmbed (very fast, never rate-limited)
function fetchOEmbed(url) {
  return new Promise((resolve) => {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    https.get(oembedUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

// API endpoint to get YouTube track info
app.get('/api/info', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL do YouTube não fornecida' });
  }

  const videoId = extractYouTubeId(url);
  if (!videoId) {
    return res.status(400).json({ error: 'Link do YouTube inválido' });
  }

  const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    // Metadata does not require extracting or downloading the protected media.
    const oembed = await fetchOEmbed(fullUrl);
    if (oembed) {
      return res.json({
        id: videoId,
        title: oembed.title || 'Música do YouTube',
        author: oembed.author_name || 'Artista',
        thumbnail: oembed.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: 0,
        url: fullUrl
      });
    }
    return res.json({
      id: videoId,
      title: 'Música do YouTube',
      author: 'YouTube',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      duration: 0,
      url: fullUrl
    });
  } catch (error) {
    console.error('Error fetching info:', error);
    res.status(500).json({
      error: 'Não foi possível obter dados desse vídeo. Verifique se o link está público.',
      details: error.message
    });
  }
});

// API endpoint to stream YouTube audio directly
app.get('/api/stream', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).send('URL necessária');
  }

  const videoId = extractYouTubeId(url);
  if (!videoId) {
    return res.status(400).send('URL inválida');
  }

  const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    console.log(`[Stream] Iniciando stream de áudio para: ${videoId}`);

    const info = await ytdl.getInfo(fullUrl);
    const format = chooseFormat(info.formats, {
      quality: 'highestaudio',
      filter: f => f.hasAudio && !f.hasVideo
    });
    const stream = ytdl.download(info, {
      format,
      highWaterMark: 1 << 22 // 4MB buffer for smooth streaming
    });

    // Match the response MIME type to the actual container selected by YouTube.
    const contentType = format.mimeType || (format.container === 'mp4' ? 'audio/mp4' : 'audio/webm');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');

    stream.on('error', (err) => {
      console.error('[Stream Error]:', err.message);
      if (!res.headersSent) {
        res.status(500).send('Erro ao baixar stream de áudio');
      }
    });

    req.on('close', () => {
      console.log(`[Stream] Conexão encerrada pelo cliente: ${videoId}`);
      try {
        stream.destroy();
      } catch {}
    });

    stream.pipe(res);
  } catch (error) {
    console.error('[Stream Handler Error]:', error);
    if (!res.headersSent) {
      res.status(500).send('Falha no streaming de áudio');
    }
  }
});

// API endpoint to fetch synced lyrics from LRCLIB with smart title parsing
app.get('/api/lyrics', async (req, res) => {
  const { title, artist } = req.query;
  if (!title) {
    return res.status(400).json({ error: 'Título da música necessário' });
  }

  // Helper to clean noise from YouTube video titles
  const cleanString = (str) => {
    return str
      .replace(/\[.*?\]|\(.*?\)/g, '')
      .replace(/(official\s*(music)?\s*video|clipe\s*oficial|vídeo\s*oficial|lyric\s*video|audio\s*oficial|áudio\s*oficial|4k|hd|remastered?|lyrics|letra)/gi, '')
      .replace(/[-–|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Try extracting "Artist - Track" pattern
  let parsedArtist = artist && !artist.includes('Topic') ? cleanString(artist) : '';
  let parsedTrack = cleanString(title);

  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    parsedArtist = cleanString(parts[0]);
    parsedTrack = cleanString(parts.slice(1).join(' - '));
  } else if (title.includes(' – ')) {
    const parts = title.split(' – ');
    parsedArtist = cleanString(parts[0]);
    parsedTrack = cleanString(parts.slice(1).join(' – '));
  }

  const fetchJson = (url) => {
    return new Promise((resolve) => {
      https.get(url, {
        headers: { 'User-Agent': 'NeonWave3D/1.0 (https://github.com/neonwave)' }
      }, (apiRes) => {
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(null);
          }
        });
      }).on('error', () => resolve(null));
    });
  };

  try {
    // 1. Try direct match with artist and track
    if (parsedArtist && parsedTrack) {
      const getUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(parsedArtist)}&track_name=${encodeURIComponent(parsedTrack)}`;
      const directMatch = await fetchJson(getUrl);
      if (directMatch && (directMatch.syncedLyrics || directMatch.plainLyrics)) {
        return res.json({
          success: true,
          trackName: directMatch.trackName,
          artistName: directMatch.artistName,
          syncedLyrics: directMatch.syncedLyrics || null,
          plainLyrics: directMatch.plainLyrics || null
        });
      }
    }

    // 2. Try search with combined query
    const searchQuery = parsedArtist ? `${parsedArtist} ${parsedTrack}` : cleanString(title);
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`;
    const searchResults = await fetchJson(searchUrl);

    if (Array.isArray(searchResults) && searchResults.length > 0) {
      const best = searchResults.find(r => r.syncedLyrics) || searchResults[0];
      return res.json({
        success: true,
        trackName: best.trackName,
        artistName: best.artistName,
        syncedLyrics: best.syncedLyrics || null,
        plainLyrics: best.plainLyrics || null
      });
    }

    // 3. Fallback: search just the track name
    if (parsedTrack && parsedTrack !== searchQuery) {
      const trackOnlyUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(parsedTrack)}`;
      const trackResults = await fetchJson(trackOnlyUrl);
      if (Array.isArray(trackResults) && trackResults.length > 0) {
        const best = trackResults.find(r => r.syncedLyrics) || trackResults[0];
        return res.json({
          success: true,
          trackName: best.trackName,
          artistName: best.artistName,
          syncedLyrics: best.syncedLyrics || null,
          plainLyrics: best.plainLyrics || null
        });
      }
    }

    // No lyrics found
    return res.json({ success: false, syncedLyrics: null, plainLyrics: null });
  } catch (err) {
    console.error('Error fetching lyrics:', err.message);
    res.json({ success: false, syncedLyrics: null, plainLyrics: null });
  }
});

// List of built-in demo tracks
app.get('/api/demos', (req, res) => {
  res.json([
    {
      id: 'synthwave-retro',
      title: 'Neon Cyber Drive (Procedural Synth)',
      author: 'Antigravity SoundLab',
      type: 'synth',
      genre: 'Synthwave / Retrowave',
      bpm: 124,
      thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&q=80'
    },
    {
      id: 'cyber-bass',
      title: 'Hyperdrive Cyber Bass 135BPM',
      author: 'DeepBeat Studio',
      type: 'synth-edm',
      genre: 'Cyberpunk EDM',
      bpm: 135,
      thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80'
    },
    {
      id: 'quantum-ambient',
      title: 'Cosmic Singularity Deep Sub',
      author: 'Orbital Resonance',
      type: 'synth-chill',
      genre: 'Cosmic Ambient',
      bpm: 95,
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80'
    }
  ]);
});

// Setup Vite development or production static serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production' || (!process.env.VITE_DEV && fs.existsSync(path.join(__dirname, 'dist', 'index.html')));

  if (isProduction && !process.env.VITE_DEV) {
    console.log('[Server] Rodando em modo PRODUÇÃO (arquivos estáticos em /dist)');
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    console.log('[Server] Rodando em modo DESENVOLVIMENTO (Vite middleware)');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: __dirname
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, () => {
    console.log(`=====================================================`);
    console.log(`🚀 NEONWAVE 3D AUDIO VISUALIZER PRONTO!`);
    console.log(`🌐 Acesse no seu navegador: http://localhost:${PORT}`);
    console.log(`=====================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const altPort = PORT + 1;
      console.log(`Porta ${PORT} ocupada, tentando ${altPort}...`);
      app.listen(altPort, () => {
        console.log(`🌐 Servidor rodando em: http://localhost:${altPort}`);
      });
    } else {
      console.error('Erro no servidor:', err);
    }
  });
}

startServer();
