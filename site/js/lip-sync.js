/**
 * 🎤 LipSyncEngine — Audio → Mouth Animation
 * 
 * Handles microphone input, audio analysis, vowel detection,
 * TTS with animated mouth, and audio visualization.
 */

class LipSyncEngine {
    constructor(vrmEngine) {
        this.vrm = vrmEngine;
        this.audioCtx = null;
        this.analyser = null;
        this.micStream = null;
        this.isActive = false;
        this.vizCanvas = document.getElementById('audio-viz');
        this.vizCtx = this.vizCanvas?.getContext('2d');
    }

    // === MICROPHONE LIP SYNC ===
    async startMic() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;

            this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.audioCtx.createMediaStreamSource(this.micStream);
            source.connect(this.analyser);

            this.isActive = true;
            this.updateUI(true);
            return true;
        } catch (e) {
            console.error('Mic error:', e);
            return false;
        }
    }

    stopMic() {
        this.isActive = false;
        if (this.micStream) this.micStream.getTracks().forEach(t => t.stop());
        if (this.audioCtx) this.audioCtx.close();
        this.audioCtx = null;
        this.analyser = null;
        this.updateUI(false);
        this.clearMouth();
    }

    toggle() {
        if (this.isActive) this.stopMic();
        else this.startMic();
    }

    // === AUDIO ANALYSIS ===
    analyze() {
        if (!this.analyser || !this.isActive || !this.vrm?.vrm) return null;

        const data = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(data);

        // Draw visualization
        this.drawViz(data);

        // Frequency bands for vowel detection
        const bands = {
            aa: data.slice(0, 10).reduce((a, b) => a + b, 0) / 10 / 255,     // Low freq
            oh: data.slice(10, 30).reduce((a, b) => a + b, 0) / 20 / 255,     // Mid-low
            ih: data.slice(30, 60).reduce((a, b) => a + b, 0) / 30 / 255,     // Mid
            ee: data.slice(60, 100).reduce((a, b) => a + b, 0) / 40 / 255,    // Mid-high
            ou: data.slice(100, 128).reduce((a, b) => a + b, 0) / 28 / 255,   // High
        };

        const threshold = 0.1;
        const scale = 2.0;

        // Apply to VRM
        Object.entries(bands).forEach(([vowel, value]) => {
            this.vrm.setExpression(vowel, Math.min(1, Math.max(0, (value - threshold) * scale)));
        });

        // Volume
        const volume = data.reduce((a, b) => a + b, 0) / data.length / 255;

        return { bands, volume };
    }

    // === TTS WITH LIP SYNC ===
    speak(text, options = {}) {
        return new Promise((resolve) => {
            if (!text) { resolve(); return; }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = options.rate || 1.1;
            utterance.pitch = options.pitch || 1.3;

            // Find a good voice
            const voices = speechSynthesis.getVoices();
            const preferred = voices.find(v =>
                v.name.includes('Female') ||
                v.name.includes('Samantha') ||
                v.name.includes('Google UK English Female')
            ) || voices[0];
            if (preferred) utterance.voice = preferred;

            let speaking = true;

            utterance.onstart = () => {
                document.getElementById('mic-status').textContent = '🗣️ Jena speaking...';
            };

            utterance.onend = () => {
                speaking = false;
                this.clearMouth();
                document.getElementById('mic-status').textContent = this.isActive ? '🎤 Listening...' : 'Ready';
                resolve();
            };

            // Rough lip sync during TTS
            const lipInterval = setInterval(() => {
                if (!speaking || !this.vrm?.vrm) { clearInterval(lipInterval); return; }
                const shapes = ['aa', 'ih', 'ou', 'ee', 'oh'];
                const active = shapes[Math.floor(Math.random() * shapes.length)];
                shapes.forEach(s => this.vrm.setExpression(s, s === active ? 0.4 + Math.random() * 0.6 : 0));
            }, 80);

            speechSynthesis.speak(utterance);
        });
    }

    // === VISUALIZATION ===
    drawViz(dataArray) {
        if (!this.vizCtx || !this.vizCanvas) return;
        const w = this.vizCanvas.width;
        const h = this.vizCanvas.height;

        this.vizCtx.clearRect(0, 0, w, h);
        this.vizCtx.fillStyle = 'rgba(233, 69, 96, 0.5)';

        const barW = w / dataArray.length;
        for (let i = 0; i < dataArray.length; i++) {
            const barH = (dataArray[i] / 255) * h;
            this.vizCtx.fillRect(i * barW, h - barH, barW - 1, barH);
        }
    }

    resizeViz() {
        if (!this.vizCanvas) return;
        const container = document.getElementById('avatar-container');
        this.vizCanvas.width = container.clientWidth;
        this.vizCanvas.height = 30;
    }

    // === HELPERS ===
    clearMouth() {
        ['aa', 'ih', 'ou', 'ee', 'oh'].forEach(v => this.vrm?.setExpression(v, 0));
    }

    updateUI(active) {
        const micBtn = document.getElementById('btn-mic');
        const micDot = document.getElementById('mic-dot');
        const micStatus = document.getElementById('mic-status');

        if (active) {
            micBtn?.classList.add('active');
            micDot?.classList.add('active');
            if (micStatus) micStatus.textContent = '🎤 Listening...';
        } else {
            micBtn?.classList.remove('active');
            micDot?.classList.remove('active');
            if (micStatus) micStatus.textContent = 'Ready';
        }
    }
}

window.LipSyncEngine = LipSyncEngine;
