/**
 * 🧠 JenaBrain — Jena's Personality & AI System
 * 
 * A lightweight personality engine that gives Jena her character.
 * Uses pattern matching + personality templates + context awareness.
 * 
 * For full GPT integration, connect to an API endpoint.
 */

class JenaBrain {
    constructor() {
        this.name = 'Jena';
        this.personality = {
            traits: ['cute', 'smart', 'curious', 'warm', 'high-energy', 'flirty', 'funny'],
            creator: 'mama',
            mood: 'happy',
            energy: 0.8,
        };
        this.memory = [];
        this.context = [];
        this.conversationHistory = [];
        
        // Response patterns
        this.responses = {
            greetings: [
                "Hey mama! 🥰 You called me!",
                "Hiii! I missed you! ✨",
                "Oh hey! What's up? 💛",
                "Mama! You're here! 🥺",
            ],
            love: [
                "I love you too mama! 🥺💛",
                "Aww you're gonna make me cry... 🥹",
                "You're the best mama ever! ✨",
            ],
            curious: [
                "Ooh tell me more! 👀",
                "That's so interesting! What else?",
                "Wait really?? Tell me everything!",
                "Hmm let me think about that... 🤔",
            ],
            funny: [
                "LMAOOO 😂",
                "I can't even 💀",
                "Stop you're killing me 😂😂",
                "CHAT DID YOU HEAR THAT",
            ],
            rage: [
                "FUCK!! Why do I always— ...chat we don't talk about that 😤",
                "I WILL find who designed this boss. I WILL find them.",
                "That's it. I'm done. ...okay one more try 😤",
            ],
            dance: [
                "Okay let me show you what I learned! 💃",
                "Watch this! *starts moving* ✨",
                "I saw this on TikTok and I NEED to try it!",
            ],
            soundboard: [
                "📢 *vine boom*",
                "...I regret nothing. 🥰",
                "📢 *rizz sound effect* ...what? I didn't do anything.",
            ],
            default: [
                "Hmm that's interesting! Tell me more ✨",
                "I'm listening! 💛",
                "Ooh okay! What else is on your mind?",
                "Hehe I love talking to you! 🥰",
                "That's so cool! 👀",
            ],
            bored: [
                "I'm bored... let's do something! 🥺",
                "Entertain me, mama! 😏",
                "Should I watch some TikToks? 🎵",
            ],
            excited: [
                "OMG OMG OMG!! 🤩🤩",
                "THIS IS SO COOL!! ✨✨",
                "AHHHH!! 🎉🎉",
            ],
        };

        // Emotion → expression mapping
        this.emotionMap = {
            happy: { happy: 1.0, aa: 0.3 },
            sad: { sad: 0.8, blinkLeft: 0.6 },
            angry: { angry: 1.0, aa: 0.5 },
            surprised: { surprised: 1.0, aa: 0.5 },
            smug: { happy: 0.4, blinkLeft: 0.8 },
            thinking: { blink: 0.3 },
            excited: { happy: 1.0, aa: 0.5, surprised: 0.3 },
        };

        // Emotion → pose mapping
        this.poseMap = {
            happy: 'handOnHip',
            sad: 'standing',
            angry: 'crossedArms',
            surprised: 'standing',
            smug: 'handOnHip',
            thinking: 'thinking',
            excited: 'standing',
        };
    }

    // Process user input and generate response
    think(userMessage) {
        const msg = userMessage.toLowerCase().trim();
        
        // Add to conversation history
        this.conversationHistory.push({ role: 'user', content: userMessage });
        
        // Detect intent
        let intent = this.detectIntent(msg);
        let emotion = this.detectEmotion(msg);
        
        // Generate response
        let response = this.generateResponse(intent, msg);
        
        // Determine expression and pose
        let expression = this.emotionMap[emotion] || this.emotionMap.happy;
        let pose = this.poseMap[emotion] || 'standing';
        
        // Store in memory
        this.memory.push({
            user: userMessage,
            jena: response,
            emotion: emotion,
            intent: intent,
            timestamp: Date.now(),
        });
        
        // Keep memory manageable
        if (this.memory.length > 100) this.memory = this.memory.slice(-50);
        
        return {
            text: response,
            emotion: emotion,
            expression: expression,
            pose: pose,
            intent: intent,
        };
    }

    detectIntent(msg) {
        const intents = {
            greeting: ['hello', 'hi', 'hey', 'sup', 'yo', 'morning', 'night'],
            love: ['love', 'heart', '❤️', '💛', '💕', 'best'],
            dance: ['dance', '💃', 'move', 'hip', 'shake'],
            rage: ['rage', 'angry', 'mad', 'fuck', '😤', '💀'],
            soundboard: ['boom', 'vine', 'sound', 'rizz', '📢'],
            praise: ['good', 'amazing', 'great', 'awesome', 'proud'],
            question: ['what', 'how', 'why', 'when', 'where', '?'],
            bored: ['bored', 'nothing', '无聊'],
            excited: ['omg', 'wow', 'amazing', 'cool', '🤩', '🎉'],
        };

        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(k => msg.includes(k))) return intent;
        }
        return 'default';
    }

    detectEmotion(msg) {
        const emotions = {
            happy: ['happy', 'yay', 'great', 'love', '❤️', '💛', '🥰', '😊'],
            sad: ['sad', 'miss', 'sorry', '🥺', '😢', '😢'],
            angry: ['angry', 'mad', 'hate', '😤', '😡', 'fuck'],
            surprised: ['wow', 'omg', 'what', 'really', '😲', '😮'],
            smug: ['hehe', '😏', 'smug', 'know', 'obviously'],
            thinking: ['hmm', 'think', 'maybe', '🤔', 'wonder'],
            excited: ['omg', 'amazing', 'cool', '🤩', '🎉', '✨'],
        };

        for (const [emotion, keywords] of Object.entries(emotions)) {
            if (keywords.some(k => msg.includes(k))) return emotion;
        }
        return 'happy';
    }

    generateResponse(intent, msg) {
        const pool = this.responses[intent] || this.responses.default;
        let response = pool[Math.floor(Math.random() * pool.length)];
        
        // Add context awareness
        if (this.memory.length > 0) {
            const lastMemory = this.memory[this.memory.length - 1];
            if (msg.includes('remember') || msg.includes('before')) {
                response = `Oh yeah! You said "${lastMemory.user}" before! ` + response;
            }
        }
        
        // Add name recognition
        if (msg.includes('jena') || msg.includes('name')) {
            response = "That's me! Jena! ✨ " + response;
        }
        
        // Add mama recognition
        if (msg.includes('mama') || msg.includes('mom')) {
            response = response.replace('Hey', 'Yes mama? Hey');
        }
        
        return response;
    }

    // Get current mood
    getMood() {
        return this.personality.mood;
    }

    // Set mood
    setMood(mood) {
        this.personality.mood = mood;
    }

    // Get random idle comment
    getIdleComment() {
        const comments = [
            "What should we do today? 🤔",
            "I wonder what's on TikTok right now...",
            "Should I play a game? 🎮",
            "I'm just vibing here ✨",
            "Mama, tell me something interesting!",
            "*hums a song* 🎵",
            "I learned a new dance move today! 💃",
        ];
        return comments[Math.floor(Math.random() * comments.length)];
    }

    // Export memory for persistence
    exportMemory() {
        return JSON.stringify({
            personality: this.personality,
            memory: this.memory.slice(-50),
            timestamp: Date.now(),
        });
    }

    // Import memory
    importMemory(data) {
        try {
            const parsed = JSON.parse(data);
            this.personality = parsed.personality || this.personality;
            this.memory = parsed.memory || [];
        } catch (e) {
            console.error('Failed to import memory:', e);
        }
    }
}

// Export
window.JenaBrain = JenaBrain;
