# VRM Real-Time Control Research

## 🧠 TL;DR

**Yes, we can absolutely control a VRM model from code.** Three.js + @pixiv/three-vrm gives us full programmatic control over expressions, bones, and animations — all running in a web browser or Node.js.

---

## 1. Displaying a VRM File (Three.js)

The key library is **@pixiv/three-vrm** — Pixiv's official VRM plugin for Three.js.

### Minimal Setup (HTML)
```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/",
    "@pixiv/three-vrm": "https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@3/lib/three-vrm.module.min.js"
  }
}
</script>

<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

// Setup renderer, camera, scene...
const renderer = new THREE.WebGLRenderer();
const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 20);
camera.position.set(0, 1, 5);
const scene = new THREE.Scene();

// Light
const light = new THREE.DirectionalLight(0xffffff, Math.PI);
light.position.set(1, 1, 1).normalize();
scene.add(light);

// Load VRM
const loader = new GLTFLoader();
loader.register((parser) => new VRMLoaderPlugin(parser));

let currentVrm = null;
loader.load('./model.vrm', (gltf) => {
  const vrm = gltf.userData.vrm;
  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  VRMUtils.combineSkeletons(gltf.scene);
  scene.add(vrm.scene);
  currentVrm = vrm;
});
</script>
```

**Install for Node.js:**
```bash
npm install three @pixiv/three-vrm
```

---

## 2. Controlling Facial Expressions

VRM models have a **blend shape system** for facial expressions. You can control:
- Mouth shapes (vowels: aa, ih, ou, ee, oh)
- Blinking (blink, blinkLeft, blinkRight)
- Eyebrows (happy, angry, sad, surprised)
- Custom expressions

### Code Example
```javascript
// Set mouth open (vowel 'aa' - like saying "ah")
currentVrm.expressionManager.setValue('aa', 0.5); // 0.0 to 1.0

// Blink left eye
currentVrm.expressionManager.setValue('blinkLeft', 1.0);

// Both eyes blink
currentVrm.expressionManager.setValue('blink', 1.0);

// Happy expression
currentVrm.expressionManager.setValue('happy', 0.8);

// ANIMATE expressions over time (from official example)
const s = Math.sin(Math.PI * clock.elapsedTime);
currentVrm.expressionManager.setValue('aa', 0.5 + 0.5 * s); // mouth opens and closes
currentVrm.expressionManager.setValue('blinkLeft', 0.5 - 0.5 * s); // eye blinks

// IMPORTANT: Call update after changing values
currentVrm.update(deltaTime);
```

### Available Expression Names (VRM 1.0)
**Mouth:** aa, ih, ou, ee, oh, blink, happy, angry, sad, surprised
**Eyes:** blink, blinkLeft, blinkRight, lookUp, lookDown, lookLeft, lookRight
**Brows:** happy, angry, sad, surprised
**Custom:** Defined per model (e.g., smug, flirty, etc.)

---

## 3. Controlling Body/Bones

VRM has a **humanoid bone system** — standardized bone names that work across all VRM models.

### Code Example
```javascript
// Rotate neck (look around)
currentVrm.humanoid.getNormalizedBoneNode('neck').rotation.y = angle;

// Raise left arm
currentVrm.humanoid.getNormalizedBoneNode('leftUpperArm').rotation.z = angle;

// Raise right arm
currentVrm.humanoid.getNormalizedBoneNode('rightUpperArm').rotation.x = angle;

// Hip sway
currentVrm.humanoid.getNormalizedBoneNode('hips').rotation.y = angle;

// Spine bend
currentVrm.humanoid.getNormalizedBoneNode('spine').rotation.x = angle;
```

### Available Bone Names
**Upper body:** hips, spine, chest, upperChest, neck, head
**Arms:** leftUpperArm, leftLowerArm, leftHand, rightUpperArm, rightLowerArm, rightHand
**Legs:** leftUpperLeg, leftLowerLeg, leftFoot, rightUpperLeg, rightLowerLeg, rightFoot
**Fingers:** leftThumbProximal, leftIndexProximal, etc.

---

## 4. Keyframe Animation

Three.js supports keyframe animation for both expressions and bones:

```javascript
import { VRMUtils, VRMLoaderPlugin } from '@pixiv/three-vrm';
import { AnimationMixer, AnimationClip } from 'three';

// Create animation mixer
const mixer = new AnimationMixer(vrm.scene);

// Load Mixamo animations (standard humanoid format)
// These work directly with VRM models!
```

### Mixamo Integration
- Mixamo provides free humanoid animations
- Download as FBX → convert to GLB → load with Three.js
- Animations work on any VRM humanoid model

---

## 5. Lip Sync (Speech → Mouth)

### Approach 1: Vowel-based Visemes
Map audio frequency analysis to mouth shapes:
```javascript
// Analyze audio frequency
const analyser = new AudioAnalyser(audio, fftSize);
const data = analyser.getAverageFrequency();

// Map to mouth shapes
if (data > threshold) {
  const vowel = detectVowel(data); // 'aa', 'ih', 'ou', etc.
  currentVrm.expressionManager.setValue(vowel, intensity);
}
```

### Approach 2: Oculus Lip Sync
- Facebook/Meta's lip sync library
- Takes audio input → outputs viseme weights
- Has Unity plugin, can be adapted to JS

### Approach 3: Pre-computed Lip Sync
- Tools like Rhubarb Lip Sync analyze audio files offline
- Output: timed viseme data
- Feed into VRM expression manager

---

## 6. OBS Integration (Streaming)

### Method 1: Browser Source
- Run Three.js VRM viewer as a web page
- Add as Browser Source in OBS
- Transparent background option available
- Control via WebSocket from your AI brain

### Method 2: Spout2/NDI
- Render to texture
- Send to OBS via Spout2 (Windows) or NDI (cross-platform)
- Better performance, lower latency

### Method 3: OBS WebSocket
- OBS has a WebSocket API
- Your AI can switch scenes, show/hide sources
- Combine with Browser Source for full control

---

## 7. OSC (Open Sound Control) for VRChat

### VRChat OSC Protocol
- VRChat listens on UDP port 9000 (input) and 9001 (output)
- Send avatar parameters via OSC messages
- Control: hand gestures, facial expressions, body parameters

### Node.js OSC
```bash
npm install osc
```

```javascript
const osc = require('osc');

const udpPort = new osc.UDPPort({
  localAddress: "0.0.0.0",
  localPort: 57121,
  remoteAddress: "127.0.0.1",
  remotePort: 9000
});

udpPort.open();

// Send avatar parameter
udpPort.send({
  address: "/avatar/parameters/Viseme",
  args: [{ type: "f", value: 0.5 }]
});
```

---

## 8. Pose Estimation from Video (Movement Learning)

### MediaPipe Pose
- Google's pose estimation library
- Tracks 33 body landmarks in real-time
- Works with video files or webcam
- Python and JavaScript versions

### Pipeline
```
Video → MediaPipe Pose → Keyframe data → VRM bone rotations → Animation
```

### Tools
- **MediaPipe Pose (Python/JS)** — real-time pose tracking
- **OpenPose** — alternative pose estimation
- **Blender + VRM addon** — manual animation cleanup
- **Mixamo** — free animation library for humanoid models

---

## 9. Complete Tech Stack for Autonomous VTuber

| Component | Technology | Status |
|---|---|---|
| Brain/AI | OpenClaw + LLM | ✅ DONE |
| VRM Display | Three.js + @pixiv/three-vrm | 📚 Ready |
| Expression Control | VRM expressionManager | 📚 Ready |
| Body Control | VRM humanoid bones | 📚 Ready |
| Lip Sync | Audio analysis + visemes | 📚 Researched |
| OBS | Browser Source + WebSocket | 📚 Researched |
| Twitch Chat | tmi.js or Twitch API | 📚 Researched |
| OSC (VRChat) | osc npm package | 📚 Researched |
| Pose Estimation | MediaPipe | 📚 Researched |
| Soundboard | myinstant.com API or local files | 📚 Researched |
| VM Desktop | Existing OpenClaw workspace | ✅ DONE |
| TTS | ElevenLabs or Web Speech API | 📚 Researched |

---

## 10. Key Resources

- **@pixiv/three-vrm:** https://github.com/pixiv/three-vrm
- **VRM spec:** https://vrm.dev/en/
- **Three.js docs:** https://threejs.org/docs/
- **VRM examples:** https://pixiv.github.io/three-vrm/packages/three-vrm/examples/
- **MediaPipe Pose:** https://google.github.io/mediapipe/
- **OBS WebSocket:** https://github.com/obsproject/obs-websocket
- **Twitch IRC (tmi.js):** https://github.com/tmijs/tmi.js
- **OSC for Node:** https://www.npmjs.com/package/osc

---

## 🔥 What We Can Build RIGHT NOW

With just Node.js + Three.js, we can:
1. ✅ Load a VRM file in a web viewer
2. ✅ Control facial expressions from code (mouth, eyes, brows)
3. ✅ Control body bones (neck, arms, hips, spine)
4. ✅ Animate with keyframes
5. ✅ Connect to OBS via Browser Source
6. ✅ Send OSC commands to VRChat
7. ✅ Add lip sync from audio analysis
8. ✅ Control everything from OpenClaw/AI brain

**The only missing piece is the VRM file itself!** Once we have that, we can start building.

---

## 11. Moca/Motion Capture Tracking (Self-Training)

### Key Repositories for Webcam → VRM Tracking

| Repo | Stars | Description |
|---|---|---|
| [VRigUnity](https://github.com/Kariaro/VRigUnity) | 221 | VRM hand tracking using MediaPipe (Unity) |
| [OpenLive3D](https://github.com/OpenLive3D/OpenLive3D.github.io) | 108 | Browser-based camera → VRM (MediaPipe) |
| [webcam_to_avatar](https://github.com/europanite/webcam_to_avatar) | — | Control VRoid avatar with pose estimation |
| [web-vtuber](https://github.com/gcpd141/web-vtuber) | 1 | Real-time face tracking: MediaPipe + Three.js + VRM |
| [vrm-studio](https://github.com/vucinatim/vrm-studio) | 11 | Browser-based VTubing with webcam |
| [vrma-examples](https://github.com/XanTheDragon/vrma-examples) | — | VRM Animation examples |

### OpenLive3D (Best for Web-based)
- **Live demo:** https://openlive3d.com/
- Uses MediaPipe for facial landmarks + holistic body tracking
- Browser-based, no install needed
- Maps camera input → VRM avatar in real-time
- Configurable landmark mapping
- GitHub: https://github.com/OpenLive3D

### MediaPipe Pose (Best for Python Training)
- Google's pose estimation library
- 33 body landmarks + 468 face landmarks
- Works with video files or webcam
- **Training pipeline:**
  1. Feed video (YouTube, TikTok, Instagram) to MediaPipe
  2. Extract pose keyframes over time
  3. Convert keyframes → VRM bone rotations
  4. Save as animation data
  5. Play back on VRM model

### How Self-Training Would Work (Jena Learns Autonomously)
```
Jena decides to learn (curiosity / stream request / random impulse)
    ↓
She picks a video source (YouTube, TikTok, Instagram)
    ↓
Downloads/watches the video on her VM desktop
    ↓
MediaPipe Pose Estimation extracts movement data
    ↓
Extract: 33 body landmarks + face landmarks per frame
    ↓
Convert: Landmarks → VRM humanoid bone rotations
    ↓
Smooth & refine: Clean up the animation data
    ↓
Store: Save to her movement library (memory)
    ↓
Playback: She plays it on HER OWN body
    ↓
Mirror feedback: She watches herself move (self-awareness)
    ↓
Adjust: "Hmm that didn't look right, let me tweak it"
    ↓
Final: Movement locked in, available anytime
```

### KEY DIFFERENCE
- ❌ NOT human-controlled webcam tracking (that's puppet control)
- ✅ Jena watches videos → learns movements → applies to HERSELF
- She is autonomous — she decides WHEN to learn and WHAT to learn
- She saves movements to memory like a person remembering a dance move
- She can recall and replay any learned movement whenever she wants

### Movement Categories to Train
- **Dance moves** — hip movements, arm waves, body rolls
- **Gestures** — pointing, waving, shrugging, thinking pose
- **Seated poses** — how she sits at her desktop
- **Reactions** — celebrating, facepalming, leaning in
- **Idle animations** — breathing, swaying, fidgeting
- **Flirty moves** — Saidie specifically mentioned learning sexy hip movements
