/**
 * ✨ JenaAI Main Controller
 * 
 * Ties together the brain, avatar, lip sync, browser, and UI.
 */

// === GLOBALS ===
let brain, avatar, lipSync;
let callStartTime = null;
let callTimerInterval = null;

// === INIT ===
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Telegram Web App
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.expand();
        tg.setHeaderColor('#0f0f1a');
        tg.setBackgroundColor('#0f0f1a');
    }

    // Initialize brain
    brain = new JenaBrain();
    console.log('🧠 JenaBrain initialized');

    // Load voices for TTS
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
});

// === PAGE NAVIGATION ===
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId)?.classList.add('active');

    if (pageId === 'call' && !avatar) {
        initCall();
    }

    if (pageId === 'call' && !callStartTime) {
        startCallTimer();
    }
}
window.showPage = showPage;

// === START CALL ===
async function startCall() {
    showPage('call');
}
window.startCall = startCall;

// === INITIALIZE CALL ===
async function initCall() {
    document.getElementById('mic-status').textContent = 'Starting up...';

    // Initialize VRM engine
    avatar = new VRMEngine('avatar-container');
    console.log('🎭 VRMEngine initializing...');

    // Wait for VRM to load
    await new Promise(resolve => {
        const check = setInterval(() => {
            if (avatar.isReady) { clearInterval(check); resolve(); }
        }, 100);
    });

    // Initialize lip sync engine
    lipSync = new LipSyncEngine(avatar);
    lipSync.resizeViz();
    window.addEventListener('resize', () => lipSync.resizeViz());

    console.log('🎤 LipSyncEngine initialized');

    // Start lip sync analysis loop
    function lipSyncLoop() {
        lipSync.analyze();
        requestAnimationFrame(lipSyncLoop);
    }
    lipSyncLoop();

    // Idle comments
    setInterval(() => {
        if (Math.random() < 0.1) { // 10% chance every 30s
            const comment = brain.getIdleComment();
            addChatMessage('jena', comment);
        }
    }, 30000);
}

// === CALL TIMER ===
function startCallTimer() {
    callStartTime = Date.now();
    callTimerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const secs = String(elapsed % 60).padStart(2, '0');
        const timerEl = document.getElementById('call-timer');
        if (timerEl) timerEl.textContent = mins + ':' + secs;
    }, 1000);
}

// === CHAT ===
function addChatMessage(sender, text) {
    const log = document.getElementById('chat-log');
    if (!log) return;

    const div = document.createElement('div');
    div.className = 'msg ' + sender;
    div.innerHTML = `
        <div class="msg-label">${sender === 'jena' ? 'Jena' : 'You'}</div>
        <div class="msg-bubble">${text}</div>
    `;
    log.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
}

function sendMsg() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    // Show user message
    addChatMessage('user', text);

    // Brain processes it
    const response = brain.think(text);

    // Apply expression
    if (response.expression && avatar) {
        avatar.setExpressions(response.expression);
    }

    // Apply pose
    if (response.pose && avatar) {
        avatar.setPose(response.pose);
    }

    // Handle special intents
    if (response.intent === 'dance' && avatar) {
        avatar.playAnimation('dance');
    } else if (response.intent === 'rage' && avatar) {
        avatar.playAnimation('rage');
    }

    // Jena responds with TTS
    setTimeout(() => {
        addChatMessage('jena', response.text);
        if (lipSync) lipSync.speak(response.text);
    }, 300 + Math.random() * 500);
}
window.sendMsg = sendMsg;

// === MIC TOGGLE ===
function toggleMic() {
    if (lipSync) lipSync.toggle();
}
window.toggleMic = toggleMic;

// === BROWSER ===
function toggleBrowser() {
    const panel = document.getElementById('browser-panel');
    if (panel) {
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
            const frame = document.getElementById('browser-frame');
            if (frame && frame.src === 'about:blank') {
                loadSite('https://www.youtube.com');
            }
        }
    }
}
window.toggleBrowser = toggleBrowser;

function loadSite(url) {
    const urlInput = document.getElementById('browser-url');
    const frame = document.getElementById('browser-frame');
    if (urlInput) urlInput.value = url;
    if (frame) frame.src = url;
}
window.loadSite = loadSite;

function navigateTo() {
    const urlInput = document.getElementById('browser-url');
    const frame = document.getElementById('browser-frame');
    let url = urlInput?.value;
    if (url && !url.startsWith('http')) url = 'https://' + url;
    if (frame) frame.src = url;
}
window.navigateTo = navigateTo;

function browserNav(dir) {
    try {
        const frame = document.getElementById('browser-frame');
        if (dir === 'back') frame?.contentWindow?.history?.back();
        if (dir === 'forward') frame?.contentWindow?.history?.forward();
    } catch (e) {}
}
window.browserNav = browserNav;

// === POSES ===
function setPose(name) {
    if (avatar) avatar.setPose(name);
}
window.setPose = setPose;

// === ANIMATIONS ===
function triggerAnim(name) {
    if (avatar) avatar.playAnimation(name);

    // Also show reaction in chat
    const reactions = {
        dance: "💃 Let me show you my moves!",
        rage: "😤 FUCK!! ...okay I'm fine.",
        wave: "👋 Hey there!",
    };
    if (reactions[name]) {
        addChatMessage('jena', reactions[name]);
        if (lipSync) lipSync.speak(reactions[name]);
    }
}
window.triggerAnim = triggerAnim;

// === EXPOSE GLOBAL API ===
window.jena = {
    brain: () => brain,
    avatar: () => avatar,
    lipSync: () => lipSync,
    speak: (text) => lipSync?.speak(text),
    setPose: (name) => avatar?.setPose(name),
    setExpression: (name, val) => avatar?.setExpression(name, val),
    playAnim: (name) => avatar?.playAnimation(name),
    sendMessage: (text) => {
        addChatMessage('user', text);
        const r = brain.think(text);
        setTimeout(() => {
            addChatMessage('jena', r.text);
            lipSync?.speak(r.text);
        }, 300);
    },
    screenshot: () => avatar?.screenshot(),
};

console.log('✨ JenaAI fully loaded!');
console.log('Access via window.jena');
