import * as THREE from 'three';

export const PALETTES = {
  cyberpunk: {
    name: 'Cyberpunk Neon',
    primary: new THREE.Color('#00f0ff'),    // Cyan
    secondary: new THREE.Color('#ff007f'),  // Hot Magenta
    accent: new THREE.Color('#7928ca'),     // Electric Purple
    background: new THREE.Color('#05050f'),
    grid: new THREE.Color('#00ffff'),
    glow: 0x00f0ff
  },
  synthwave: {
    name: 'Synthwave 80s',
    primary: new THREE.Color('#ff2a85'),    // Neon Pink
    secondary: new THREE.Color('#05d9e8'),  // Synth Blue
    accent: new THREE.Color('#ff9f1c'),     // Sunset Orange
    background: new THREE.Color('#0b0416'),
    grid: new THREE.Color('#ff007f'),
    glow: 0xff2a85
  },
  matrix: {
    name: 'Matrix Digital',
    primary: new THREE.Color('#00ff66'),    // Terminal Green
    secondary: new THREE.Color('#adff2f'),  // Toxic Lime
    accent: new THREE.Color('#00e5ff'),     // Mint Cyan
    background: new THREE.Color('#020b05'),
    grid: new THREE.Color('#00ff66'),
    glow: 0x00ff66
  },
  inferno: {
    name: 'Solar Inferno',
    primary: new THREE.Color('#ffb703'),    // Molten Gold
    secondary: new THREE.Color('#e63946'),  // Crimson Blaze
    accent: new THREE.Color('#fb8500'),     // Pure Flame
    background: new THREE.Color('#100505'),
    grid: new THREE.Color('#ff5400'),
    glow: 0xffa200
  },
  deepspace: {
    name: 'Cosmic Violet',
    primary: new THREE.Color('#48cae4'),    // Ice Blue
    secondary: new THREE.Color('#b5179e'),  // Astral Violet
    accent: new THREE.Color('#7209b7'),     // Deep Space Indigo
    background: new THREE.Color('#030208'),
    grid: new THREE.Color('#5a189a'),
    glow: 0x7209b7
  }
};
