# 🌌 NEONWAVE 3D - Audio Visualizer & 1080p Video Studio

> **Criado por [Caio Caso](https://github.com/CaioCaso)**  
> **Repositório Oficial**: [https://github.com/CaioCaso/neonwave-3d](https://github.com/CaioCaso/neonwave-3d)

Visualizador de áudio 3D procedural hipnótico e satisfatório com entrada via YouTube, suporte a letras 3D sincronizadas (Kinetic Lyrics), detecção precisa de batidas/kick drum e gravação de vídeo em **1080p Full HD (60 FPS)** — **0% de tokens de IA gastos**.

---

## ☁️ Como Hospedar na Nuvem (Opção 1 - Render)

O projeto está 100% configurado para o **Render** com o arquivo de blueprint `render.yaml`.

### Deploy em 1 Clique no Render:
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/CaioCaso/neonwave-3d)

### Ou Passo a Passo Manual no Render (100% Grátis):
1. Acesse **[dashboard.render.com](https://dashboard.render.com)** e faça login com sua conta do GitHub.
2. Clique no botão **New +** no canto superior e selecione **Web Service**.
3. Escolha o seu repositório: **`CaioCaso/neonwave-3d`**.
4. O Render detectará automaticamente as configurações:
   - **Name**: `neonwave-3d`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Clique em **Deploy Web Service**!
6. Em cerca de 1 a 2 minutos, seu visualizador estará no ar com HTTPS gratuito, acessível por qualquer pessoa pelo link:  
   👉 **`https://neonwave-3d.onrender.com`** *(ou o subdomínio que você escolher no Render)*.

---

## 💻 Como Rodar no seu Computador (Opção 2 - Localhost)

### No Windows (1 Clique)
Basta dar dois cliques no arquivo:
```
iniciar.bat
```
Ele iniciará o servidor e abrirá o navegador em `http://localhost:3000`.

### Via Terminal (Linux, Mac, Windows)
```bash
git clone https://github.com/CaioCaso/neonwave-3d.git
cd neonwave-3d
npm install
npm start
```
Acesse no navegador: **`http://localhost:3000`**

---

## ✨ Funcionalidades

- 🎵 **Músicas via YouTube**: Cole qualquer link do YouTube (`watch?v=...` ou `youtu.be/...`) e o áudio é transmitido em tempo real sem problemas de CORS na Web Audio API.
- 🎤 **3D Kinetic Lyrics (Lyric Video Studio)**:
  - Letras tridimensionais flutuando no espaço WebGL com brilho neon (*Unreal Bloom*).
  - Busca automática de letras sincronizadas (LRC) via API do LRCLIB.
  - Editor integrado com ajuste fino de sincronia (`-0.5s` / `+0.5s`) ou colagem manual de qualquer letra.
  - Limpeza imediata de letras entre músicas diferentes.
- ⚡ **Detecção de Graves Ultraprecisa**:
  - Analisador FFT com 2048 amostras (~21.5 Hz por bin) e detecção de transientes de kick drum por fluxo espectral (latência zero).
  - Indicador dinâmico de **KICK** e contador de **BPM**.
- 🎬 **Gravação e Exportação em 1080p HD (60 FPS)**:
  - Escolha entre **1080p HD Horizontal (1920x1080)** e **1080p Shorts / Reels (1080x1920)** em 28 Mbps.
  - Player integrado de pré-visualização antes de baixar.
- 👁️ **Modo Zen com Botão Flutuante Persistente**:
  - Botão flutuante no canto inferior direito que permanece na tela para restaurar a interface a qualquer momento (ou tecla **H**).
- 🌀 **6 Cenários 3D Gráficos**:
  - `🎤 3D Kinetic Lyrics`: Tipografia 3D flutuante e responsiva aos graves.
  - `🌀 Cyber Tunnel`: Túnel de wormhole com 60 anéis poligonais concêntricos.
  - `🔮 Organic Bio-Core`: Esfera icosaédrica com deformação orgânica e 64 barras de equalizador radiais.
  - `🌅 Synthwave Sunset`: Grade retrô anos 80 ondulando ao ritmo da música com sol neon segmentado.
  - `🌌 Quantum Galaxy`: Espiral de 12.000 partículas com expansão gravitacional nas batidas.
  - `🏙️ Equalizer Metropolis`: Matriz 3D de 196 arranha-céus neon.
- 🎨 **5 Paletas Estéticas**: *Cyberpunk*, *Synthwave*, *Matrix*, *Solar Inferno* e *Cosmic Violet*.

---

## 🛠️ Tecnologias Utilizadas

- **Three.js** (WebGL 3D Rendering, EffectComposer, UnrealBloomPass, OrbitControls)
- **Web Audio API** (AudioContext, AnalyserNode FFT 2048, Synthwave Procedural Generator)
- **Node.js & Express** (Proxy de streaming de áudio do YouTube e API de Lyrics)
- **Vite** (Build e transpilação ultrarrápida de módulos ES)
- **Tailwind CSS** (Interface glassmorphic responsiva)
- **LRCLIB API** (Busca aberta de letras sincronizadas)

---

## 👤 Autor

**Caio Caso**
- GitHub: [@CaioCaso](https://github.com/CaioCaso)

---

## 📄 Licença
Distribuído sob a licença MIT.
