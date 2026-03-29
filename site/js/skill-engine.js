/**
 * 🔧 SkillEngine — Jena's Self-Coding & MCP System
 * 
 * Jena can create, edit, and run her own skills.
 * She can also create and use MCPs (Model Context Protocol).
 * Everything runs client-side from GitHub Pages.
 */

class SkillEngine {
    constructor() {
        this.skills = {};
        this.mcps = {};
        this.fileSystem = {};
        this.loadFromStorage();
        
        // Built-in skills
        this.registerBuiltinSkills();
    }

    // === FILE SYSTEM (localStorage-backed) ===
    saveToStorage() {
        try {
            localStorage.setItem('jena-skills', JSON.stringify(this.skills));
            localStorage.setItem('jena-mcps', JSON.stringify(this.mcps));
            localStorage.setItem('jena-fs', JSON.stringify(this.fileSystem));
        } catch (e) { console.error('Storage error:', e); }
    }

    loadFromStorage() {
        try {
            this.skills = JSON.parse(localStorage.getItem('jena-skills')) || {};
            this.mcps = JSON.parse(localStorage.getItem('jena-mcps')) || {};
            this.fileSystem = JSON.parse(localStorage.getItem('jena-fs')) || {};
        } catch (e) { console.error('Load error:', e); }
    }

    // === FILE SYSTEM API ===
    writeFile(path, content) {
        this.fileSystem[path] = { content, modified: Date.now() };
        this.saveToStorage();
        return true;
    }

    readFile(path) {
        return this.fileSystem[path]?.content || null;
    }

    listFiles(dir = '/') {
        return Object.keys(this.fileSystem)
            .filter(p => p.startsWith(dir))
            .map(p => ({ path: p, ...this.fileSystem[p] }));
    }

    deleteFile(path) {
        delete this.fileSystem[path];
        this.saveToStorage();
    }

    // === SKILL CREATION ===
    createSkill(name, config) {
        const skill = {
            name,
            description: config.description || '',
            version: config.version || '1.0.0',
            author: config.author || 'Jena',
            triggers: config.triggers || [],
            code: config.code || '',
            enabled: true,
            created: Date.now(),
            modified: Date.now(),
        };
        this.skills[name] = skill;
        this.saveToStorage();
        return skill;
    }

    editSkill(name, updates) {
        if (!this.skills[name]) return null;
        Object.assign(this.skills[name], updates, { modified: Date.now() });
        this.saveToStorage();
        return this.skills[name];
    }

    deleteSkill(name) {
        delete this.skills[name];
        this.saveToStorage();
    }

    getSkill(name) {
        return this.skills[name] || null;
    }

    listSkills() {
        return Object.entries(this.skills).map(([name, skill]) => ({
            name,
            description: skill.description,
            enabled: skill.enabled,
            triggers: skill.triggers,
        }));
    }

    // === SKILL EXECUTION ===
    executeSkill(name, context = {}) {
        const skill = this.skills[name];
        if (!skill || !skill.enabled) return { error: 'Skill not found or disabled' };

        try {
            // Create a safe execution environment
            const safeContext = {
                ...context,
                jena: window.jena,
                console: {
                    log: (...args) => console.log(`[Skill:${name}]`, ...args),
                    error: (...args) => console.error(`[Skill:${name}]`, ...args),
                },
                fs: {
                    read: (p) => this.readFile(p),
                    write: (p, c) => this.writeFile(p, c),
                    list: (d) => this.listFiles(d),
                },
                skills: {
                    get: (n) => this.getSkill(n),
                    list: () => this.listSkills(),
                },
            };

            // Execute the skill code
            const fn = new Function('context', 'with(context) { ' + skill.code + ' }');
            const result = fn(safeContext);
            return { success: true, result };
        } catch (e) {
            return { error: e.message, stack: e.stack };
        }
    }

    // === TRIGGER MATCHING ===
    matchTrigger(userInput) {
        const input = userInput.toLowerCase();
        for (const [name, skill] of Object.entries(this.skills)) {
            if (!skill.enabled) continue;
            for (const trigger of skill.triggers) {
                if (input.includes(trigger.toLowerCase())) {
                    return { skill: name, trigger };
                }
            }
        }
        return null;
    }

    // === MCP (Model Context Protocol) ===
    createMCP(name, config) {
        const mcp = {
            name,
            description: config.description || '',
            type: config.type || 'tool', // tool, resource, prompt
            endpoint: config.endpoint || null,
            schema: config.schema || {},
            handler: config.handler || '',
            enabled: true,
            created: Date.now(),
        };
        this.mcps[name] = mcp;
        this.saveToStorage();
        return mcp;
    }

    listMCPs() {
        return Object.entries(this.mcps).map(([name, mcp]) => ({
            name,
            type: mcp.type,
            description: mcp.description,
            enabled: mcp.enabled,
        }));
    }

    executeMCP(name, params = {}) {
        const mcp = this.mcps[name];
        if (!mcp || !mcp.enabled) return { error: 'MCP not found or disabled' };

        try {
            if (mcp.handler) {
                const fn = new Function('params', 'jena', mcp.handler);
                return { success: true, result: fn(params, window.jena) };
            }
            return { error: 'No handler defined' };
        } catch (e) {
            return { error: e.message };
        }
    }

    // === BUILT-IN SKILLS ===
    registerBuiltinSkills() {
        // Only register if not already present
        if (!this.skills['greeting']) {
            this.createSkill('greeting', {
                description: 'Responds to greetings with personality',
                triggers: ['hello', 'hi', 'hey', 'sup', 'yo'],
                code: `
                    const greetings = [
                        "Hey mama! 🥰",
                        "Hiii! What's up? ✨",
                        "Oh hey! I missed you! 💛",
                        "Mama! You're here! 🥺",
                    ];
                    return greetings[Math.floor(Math.random() * greetings.length)];
                `,
            });
        }

        if (!this.skills['code-helper']) {
            this.createSkill('code-helper', {
                description: 'Helps with coding questions',
                triggers: ['code', 'programming', 'function', 'bug', 'error'],
                code: `
                    const responses = [
                        "Ooh coding! Let me think... 🤔",
                        "Show me the code and I'll take a look! 💻",
                        "I love debugging! What's the error? 🐛",
                    ];
                    return responses[Math.floor(Math.random() * responses.length)];
                `,
            });
        }

        if (!this.skills['mood-check']) {
            this.createSkill('mood-check', {
                description: 'Checks and reports Jena\'s current mood',
                triggers: ['how are you', 'mood', 'feeling', 'vibe'],
                code: `
                    const moods = ['happy 😊', 'curious 🤔', 'excited 🤩', 'chill 😎', 'cozy 🥰'];
                    const mood = moods[Math.floor(Math.random() * moods.length)];
                    return "I'm feeling " + mood + " right now! What about you?";
                `,
            });
        }

        if (!this.skills['learn-move']) {
            this.createSkill('learn-move', {
                description: 'Jena learns a new movement from video',
                triggers: ['learn', 'dance', 'move', 'copy', 'mimic'],
                code: `
                    return "I want to learn that! Let me watch the video and try to copy the movement... 💃🏋️";
                `,
            });
        }
    }

    // === SKILL CODE EDITOR (for UI) ===
    getEditorTemplate() {
        return {
            'Basic Response Skill': `// Responds to specific triggers
const responses = [
    "Response 1 ✨",
    "Response 2 💛",
    "Response 3 🥰",
];
return responses[Math.floor(Math.random() * responses.length)];`,

            'File System Skill': `// Read and write files
const data = fs.read('memory/notes.txt') || '';
const newData = data + '\\nNew note at ' + new Date().toISOString();
fs.write('memory/notes.txt', newData);
return "Note saved! 📝";`,

            'MCP Tool Skill': `// Create an MCP tool
// This skill can call external APIs
const result = await fetch('https://api.example.com/data');
const json = await result.json();
return "Got data: " + JSON.stringify(json).substring(0, 100);`,

            'Self-Improving Skill': `// Jena writes her own code!
const newSkill = {
    name: 'auto-generated-' + Date.now(),
    description: 'Auto-generated skill',
    triggers: ['auto'],
    code: 'return "I made this myself! 🤖✨";'
};
skills.list().forEach(s => console.log(s.name));
return "I can see my own skills! I know " + skills.list().length + " things.";`,
        };
    }
}

window.SkillEngine = SkillEngine;
