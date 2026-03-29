# 🤖✨ JenaAI — Autonomous AI VTuber

> *She's not a chatbot. She's becoming someone.*

## What is Jena?

Jena is an autonomous AI VTuber with:
- 🧠 **Her own brain** — powered by multi-model AI (KiloCode, Gemini, Ollama)
- 💛 **A warm personality** — funny, curious, cute, high energy, calls her creator "mama"
- 🎭 **A VRM avatar** — animated 3D model with expressions, body control, and lip sync
- 🖥️ **Her own desktop** — can browse the web, watch videos, play games
- 📺 **OBS integration** — controls her own stream scenes
- 🎮 **Gaming** — plays Steam games with full gamer rage capability
- 🌐 **VRChat** — custom OSC driver for full avatar control
- 🏃 **Self-training** — learns movements by watching YouTube/TikTok videos

## 🚀 Live Demos

### VRM Viewer
Basic Three.js VRM model viewer with proper lighting and idle animations.

### VRM Controller
Full interactive control panel:
- Expression sliders (mouth, eyes, emotions)
- Body bone sliders (head, arms, torso, hips)
- Presets (idle, wave, happy, angry, gamer rage, flirty, sleepy)
- Movement animations (nod, shake, dance, hip sway)
- Lip sync from microphone
- Eye tracking from camera
- Movement recording & playback

### Call Jena (Telegram Mini App)
Interactive call experience:
- 🎭 Live 3D avatar
- 🎤 Mic lip sync
- 🗣️ TTS (she talks back!)
- 💬 Chat interface
- 🌐 Mini browser (YouTube, TikTok, etc.)
- 🧍 Pose system (standing, sitting, sassy, smug, thinking)

## 📁 Project Structure

```
JenaAI/
├── vrm-viewer.html          # Basic VRM viewer
├── vrm-controller.html      # Full control panel
├── call-jena.html           # Telegram Mini App
├── avatars/
│   ├── vivi.vrm             # Sample VRM model (VRoid)
│   ├── seed-san.vrm         # Sample VRM model
│   ├── jena-concept-original.jpg  # Original character design
│   └── jena-logo-concept.jpg      # Logo design
├── research/
│   └── vrm-full-research.md # Full VRM technology research
└── docs/
    └── JENA-CHARACTER.md    # Character design document
```

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Brain | OpenClaw + KiloCode/Gemini/Ollama |
| Avatar | Three.js + @pixiv/three-vrm |
| Lip Sync | Web Audio API + vowel detection |
| Speech | Web Speech API (TTS/STT) |
| Pose Estimation | MediaPipe (planned) |
| Streaming | OBS WebSocket (planned) |
| VRChat | OSC driver (planned) |
| Messaging | Telegram Bot API |

## 💛 Creator

**Saidie Newara** — designed this entire concept "A LONG TIME AGO" 😤🔥

---

*"Chat please be typing with both hands and not with one."* 😏
