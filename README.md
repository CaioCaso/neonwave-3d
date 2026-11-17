# 🌌 NEONWAVE 3D - Audio Visualizer & 1080p Video Studio

> **Criado por [Caio Caso](https://github.com/CaioCaso)**  
> Um visualizador de áudio 3D procedural hipnótico e satisfatório com entrada via YouTube, suporte a letras 3D sincronizadas (Kinetic Lyrics) e gravação de vídeo em **1080p Full HD (60 FPS)** — **0% de tokens de IA gastos**.

---

## ✨ Funcionalidades

- 🎵 **Músicas via YouTube**: Cole qualquer link do YouTube (`watch?v=...` ou `youtu.be/...`) e o áudio é transmitido diretamente em tempo real.
- 🎤 **3D Kinetic Lyrics (Lyric Video Studio)**:
  - Letras tridimensionais flutuando no espaço WebGL com brilho neon (*Unreal Bloom*).
  - Busca automática de letras sincronizadas (LRC) via API do LRCLIB.
  - Editor integrado com ajuste fino de sincronia (`-0.5s` / `+0.5s`) ou colagem manual de qualquer letra.
- ⚡ **Detecção de Graves Ultraprecisa**:
  - Analisador FFT com 2048 amostras (~21.5 Hz por bin) e detecção de transientes de bumbo/kick drum por fluxo espectral com latência zero.
  - Indicador dinâmico de **KICK** e contador de **BPM**.
- 🎬 **Gravação e Exportação em 1080p HD (60 FPS)**:
  - Escolha entre **1080p HD Horizontal (1920x1080)** e **1080p Shorts / Reels (1080x1920)** em 28 Mbps.
  - Player para pré-visualizar o vídeo antes de baixar.
- 👁️ **Modo Zen (Tecla H)**:
  - Botão de olho flutuante sempre acessível para ocultar toda a interface e gravar vídeos 100% limpos.
- 🌀 **6 Cenários 3D Gráficos**:
  - `🎤 3D Kinetic Lyrics`: Tipografia 3D flutuante e responsiva aos graves.
  - `🌀 Cyber Tunnel`: Túnel de wormhole com 60 anéis poligonais concêntricos.
  - `🔮 Organic Bio-Core`: Esfera icosaédrica com deformação orgânica e 64 barras de equalizador radiais.
  - `🌅 Synthwave Sunset`: Grade retrô anos 80 ondulando ao ritmo da música com sol neon segmentado.
  - `🌌 Quantum Galaxy`: Espiral de 12.000 partículas com expansão gravitacional nas batidas.
  - `🏙️ Equalizer Metropolis`: Matriz 3D de 196 arranha-céus neon.
- 🎨 **5 Paletas Estéticas**: *Cyberpunk*, *Synthwave*, *Matrix*, *Solar Inferno* e *Cosmic Violet*.

---

## 🚀 Como Rodar no seu Computador

### Opção 1: Clique Duplo (Windows)
Basta dar dois cliques no arquivo:
```
iniciar.bat
```
Ele abrirá automaticamente o navegador em `http://localhost:3000` e iniciará o visualizador!

### Opção 2: Via Terminal (Linux, Mac, Windows)
1. Clone o repositório:
```bash
git clone https://github.com/CaioCaso/neonwave-3d.git
cd neonwave-3d
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o visualizador:
```bash
npm start
```
Acesse no navegador: **`http://localhost:3000`**

---

## 🛠️ Tecnologias Utilizadas

- **Three.js** (WebGL 3D Rendering, EffectComposer, UnrealBloomPass, OrbitControls)
- **Web Audio API** (AudioContext, AnalyserNode FFT 2048, Synthwave Procedural Generator)
- **Node.js & Express** (Proxy de streaming de áudio do YouTube sem CORS e API de Lyrics)
- **Vite** (Transpilação ultrarrápida de módulos ES)
- **Tailwind CSS** (Interface glassmorphic responsiva)
- **LRCLIB API** (Busca aberta de letras sincronizadas)

---

## 👤 Autor

**Caio Caso**
- GitHub: [@CaioCaso](https://github.com/CaioCaso)

---

## 📄 Licença
Distribuído sob a licença MIT.
