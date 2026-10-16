# Grand Theft Auto: Vice City — WebAssembly Edition

[![WebAssembly](https://img.shields.io/badge/WebAssembly-654FF0?style=flat-square&logo=webassembly&logoColor=white)](https://webassembly.org/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

An in-browser WebAssembly port of **Grand Theft Auto: Vice City**. The entire game runs locally on your machine via WebAssembly and WebGL hardware acceleration. Zero installation, zero cloud uploads, and fully playable offline after the first import.

---

## Highlights

- **Native C++ Performance**: Compiled via Emscripten and rendered through WebGL with hardware acceleration, achieving a fluid 60+ FPS in desktop and mobile browsers.
- **Private Local Storage (OPFS)**: Game data is extracted once into your browser's Origin Private File System (OPFS). No assets are uploaded to any server or cloud service.
- **100% Offline Capable**: A dedicated Service Worker intercepts and serves all required assets from OPFS. After the initial archive setup, you can disconnect and play anywhere.
- **Comprehensive Controller Support**: Plug-and-play support for standard USB/Bluetooth gamepads (Xbox, PlayStation, DualSense) alongside responsive on-screen touch controls for phones and tablets.
- **PC Save Game Management**: Built-in save manager allowing you to import, export, and manage standard PC `.b` save files and `.zip` archives across 8 game slots.
- **Custom Player Skins**: Built-in image converter and dropzone for Tommy Vercetti skins supporting `.bmp`, `.png`, and `.jpg` files.
- **Cheats on Demand**: Optional built-in cheats toggle accessible from the start console or via <kbd>F3</kbd> in-game.
- **Multi-Language Support**: Full UI translation across 8 languages (English, Español, Português, Français, Deutsch, Русский, हिन्दी, 简体中文).

---

## How It Works

1. **Obtain Game Files**: Ensure you have your `game.tar.gz` archive containing the legitimate game data files.
2. **Mount the Archive**: Click **Select game.tar.gz** on the landing page and choose your archive.
3. **Local OPFS Extraction**: A dedicated background Web Worker decompresses and mounts the game files into your browser's high-speed local filesystem.
4. **Launch & Play**: Once the status indicator shows **Ready to play**, click **Start to play** to begin.

> **Note**: Your imported game data remains securely saved in your browser across sessions. You only need to import the archive once unless you choose to reset or clear your browser storage.

---

## Game Controls

### Keyboard & Mouse

| Action | Key / Control |
|---|---|
| **Move** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> |
| **Look / Aim** | Mouse Movement |
| **Sprint** | <kbd>Space</kbd> or <kbd>Shift</kbd> |
| **Jump** | <kbd>Space</kbd> |
| **Attack / Shoot** | <kbd>Left Click</kbd> or <kbd>Ctrl</kbd> |
| **Enter / Exit Vehicle** | <kbd>F</kbd> or <kbd>Enter</kbd> |
| **Handbrake** | <kbd>Space</kbd> |
| **Cycle Weapon** | Mouse Wheel or <kbd>Q</kbd> / <kbd>E</kbd> |
| **Camera View** | <kbd>V</kbd> |
| **In-Game Menu** | <kbd>Esc</kbd> |
| **Cheats Menu** | <kbd>F3</kbd> |

### Gamepads & Touch

- **Gamepads**: Connect any Xbox, PlayStation, or generic HID gamepad. Controls map automatically to classic console layouts.
- **Mobile & Tablet**: An on-screen virtual joystick and context-sensitive touch action buttons appear automatically on touch devices.

---

## Saves & Custom Skins

### Managing Saves
- Compatible with original **GTA: Vice City PC** saves (`GTAVCsf1.b` through `GTAVCsf8.b`), or `.zip` archives containing them.
- Import files directly into any of the 8 available slots from the **Saves** panel before starting the game.
- Export slots at any time to back up your progress to your local disk.

### Importing Custom Skins
- Drop any `.bmp`, `.png`, or `.jpg` character skin into the **Skins** panel.
- Non-BMP images are automatically converted to 24-bit 256x256 BMP format.
- In-game, open **Options → Player Skin Setup** to apply your custom outfit.

---

## Deployment (Cloudflare Pages)

This project is optimized for deployment on **Cloudflare Pages** using **Wrangler**.

### Prerequisites

- Node.js 20+
- Cloudflare account and Wrangler CLI

### Setup & Local Development

```bash
# Install dependencies
npm install

# Start local development server with cross-origin headers
npm run dev

# Build for production
npm run build
```

### Deploying with Wrangler

```bash
# Log in to Cloudflare (one-time setup)
npx wrangler login

# Deploy directly to Cloudflare Pages
npm run deploy
```

All essential cross-origin isolation headers required for WebAssembly SharedArrayBuffer and OPFS are pre-configured in `public/_headers`:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: cross-origin
```

---

## Technical Architecture

- **WebAssembly Core**: Re-implemented game engine compiled from C++ to WebAssembly via Emscripten.
- **OPFS (Origin Private File System)**: High-throughput, private client-side filesystem handling fast block reads and writes.
- **Service Worker (`sw.js`)**: Intercepts runtime asset requests and serves game textures, models, audio, and binaries directly from OPFS.
- **Background Web Worker**: Performs tar/gzip stream decompression off the main thread to ensure a smooth, unblocked UI.
- **Vite & Modern CSS**: Modern, responsive synthwave frontend built with glassmorphism, fluid typography, and Web Interface Guidelines compliance.

---

## System Requirements

- **Desktop Browsers**: Google Chrome 110+, Mozilla Firefox 111+, Apple Safari 16.4+, or Microsoft Edge 110+.
- **Mobile Browsers**: Chrome for Android, Safari on iOS 16.4+.
- **Hardware Acceleration**: Enabled WebGL / WebAssembly in browser settings.

---

## License

The browser client and tooling code in this repository is licensed under the [MIT License](LICENSE).

---

## Disclaimer

This is an unofficial, non-commercial fan project. It is not affiliated with, endorsed by, or sponsored by Rockstar Games or Take-Two Interactive. "Grand Theft Auto", "Vice City", and all associated titles, logos, and characters are trademarks or registered trademarks of their respective owners.

This repository does not host, distribute, or include any proprietary game assets, audio files, textures, models, or copyrighted binaries. Users must supply their own legitimate copy of Grand Theft Auto: Vice City (`game.tar.gz`) to play.
