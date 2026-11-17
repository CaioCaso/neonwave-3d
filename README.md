# 🌌 NEONWAVE 3D - Audio Visualizer & 1080p Video Studio

> **Criado por [Caio Caso](https://github.com/CaioCaso)**  
> 🌐 **Site Oficial no Ar**: **[https://neonwave-3d.onrender.com](https://neonwave-3d.onrender.com)**

Um visualizador de áudio 3D procedural hipnótico e altamente satisfatório com suporte a músicas do **YouTube**, letras 3D cinéticas sincronizadas (**3D Kinetic Lyrics**), detecção precisa de batidas/kick drum e download direto de vídeo em **1080p Full HD (60 FPS)** — **0% de tokens de IA gastos**.

---

## 🚀 Acesse a Ferramenta Online (Opção Principal)

Você não precisa instalar nada para começar a usar:

👉 **[CLIQUE AQUI PARA ABRIR O NEONWAVE 3D](https://neonwave-3d.onrender.com)**

Basta abrir o link acima em qualquer navegador (no PC, tablet ou celular) para:
1. Colar links do YouTube ou subir suas próprias músicas.
2. Explorar os 6 cenários gráficos 3D e 5 paletas de cores neon.
3. Acompanhar as letras sincronizadas flutuando em 3D.
4. Gravar e baixar seus vídeos em **1080p HD (16:9 ou 9:16 Shorts/Reels)** prontos para compartilhar nas redes sociais!

---

## 💻 Como Rodar no seu Computador (Opção 2 - Local / Offline)

Caso você prefira rodar a ferramenta diretamente no seu computador para uso local ou sem internet:

### No Windows (1 Clique)
Basta dar **dois cliques** no arquivo executável:
```
iniciar.bat
```
Ele iniciará o servidor local e abrirá automaticamente o navegador em `http://localhost:3000`.

### Via Terminal (Linux, Mac, Windows)
1. Clone o repositório:
```bash
git clone https://github.com/CaioCaso/neonwave-3d.git
cd neonwave-3d
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie a aplicação:
```bash
npm start
```
Acesse no seu navegador: **`http://localhost:3000`**

---

## ✨ Principais Funcionalidades

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
