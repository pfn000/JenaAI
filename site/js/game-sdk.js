/**
 * 🎮 GameSDK — Jena's Game Integration (Neuro-sama compatible)
 * 
 * Based on the Neuro-sama Game SDK (open source)
 * https://github.com/VedalAI/neuro-sdk
 * 
 * WebSocket-based API for games to communicate with Jena.
 * Games send state → Jena decides actions → Games execute them.
 */

class GameSDK {
    constructor() {
        this.games = {};
        this.activeGame = null;
        this.wsServer = null;
        this.clients = new Set();
        this.actionQueue = [];
        
        // Register built-in games
        this.registerBuiltinGames();
    }

    // === GAME REGISTRATION ===
    registerGame(name, config) {
        this.games[name] = {
            name,
            displayName: config.displayName || name,
            description: config.description || '',
            category: config.category || 'other',
            getState: config.getState || (() => ({})),
            executeAction: config.executeAction || (() => {}),
            getActions: config.getActions || (() => []),
            render: config.render || null,
            enabled: true,
        };
    }

    // === BUILT-IN GAMES ===
    registerBuiltinGames() {
        // Tic Tac Toe
        this.registerGame('tictactoe', {
            displayName: 'Tic Tac Toe',
            description: 'Classic game — Jena plays X, you play O',
            category: 'board',
            getState: () => this.games.tictactoe.state || { board: Array(9).fill(null), turn: 'X', winner: null },
            getActions: () => {
                const state = this.games.tictactoe.state || { board: Array(9).fill(null) };
                return state.board.map((cell, i) => cell === null ? { action: 'place', position: i } : null).filter(Boolean);
            },
            executeAction: (action) => {
                if (!this.games.tictactoe.state) {
                    this.games.tictactoe.state = { board: Array(9).fill(null), turn: 'X', winner: null };
                }
                const state = this.games.tictactoe.state;
                if (state.board[action.position] === null && !state.winner) {
                    state.board[action.position] = state.turn;
                    // Check winner
                    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
                    for (const [a,b,c] of lines) {
                        if (state.board[a] && state.board[a] === state.board[b] && state.board[a] === state.board[c]) {
                            state.winner = state.board[a];
                        }
                    }
                    if (!state.winner && state.board.every(c => c !== null)) state.winner = 'draw';
                    state.turn = state.turn === 'X' ? 'O' : 'X';
                }
                return state;
            },
        });

        // Number Guessing
        this.registerGame('guessnumber', {
            displayName: 'Guess the Number',
            description: 'Jena picks a number 1-100, you guess!',
            category: 'puzzle',
            getState: () => this.games.guessnumber.state || { secret: Math.floor(Math.random() * 100) + 1, attempts: 0, won: false },
            getActions: () => [{ action: 'guess', range: '1-100' }],
            executeAction: (action) => {
                if (!this.games.guessnumber.state) {
                    this.games.guessnumber.state = { secret: Math.floor(Math.random() * 100) + 1, attempts: 0, won: false, lastGuess: null, hint: '' };
                }
                const state = this.games.guessnumber.state;
                state.attempts++;
                state.lastGuess = action.value;
                if (action.value === state.secret) {
                    state.won = true;
                    state.hint = 'Correct! 🎉';
                } else if (action.value < state.secret) {
                    state.hint = 'Higher! ⬆️';
                } else {
                    state.hint = 'Lower! ⬇️';
                }
                return state;
            },
        });

        // Rock Paper Scissors
        this.registerGame('rps', {
            displayName: 'Rock Paper Scissors',
            description: 'Play RPS against Jena!',
            category: 'quick',
            getState: () => this.games.rps.state || { rounds: 0, jenaScore: 0, playerScore: 0 },
            getActions: () => ['rock', 'paper', 'scissors'].map(a => ({ action: 'choose', choice: a })),
            executeAction: (action) => {
                if (!this.games.rps.state) {
                    this.games.rps.state = { rounds: 0, jenaScore: 0, playerScore: 0, lastResult: '' };
                }
                const state = this.games.rps.state;
                const choices = ['rock', 'paper', 'scissors'];
                const jenaChoice = choices[Math.floor(Math.random() * 3)];
                state.rounds++;
                state.playerChoice = action.choice;
                state.jenaChoice = jenaChoice;
                
                if (action.choice === jenaChoice) {
                    state.lastResult = "Tie! 🤝";
                } else if (
                    (action.choice === 'rock' && jenaChoice === 'scissors') ||
                    (action.choice === 'paper' && jenaChoice === 'rock') ||
                    (action.choice === 'scissors' && jenaChoice === 'paper')
                ) {
                    state.playerScore++;
                    state.lastResult = `You win! ${action.choice} beats ${jenaChoice} 🎉`;
                } else {
                    state.jenaScore++;
                    state.lastResult = `Jena wins! ${jenaChoice} beats ${action.choice} 😏`;
                }
                return state;
            },
        });
    }

    // === GAME CONTROL ===
    startGame(name) {
        if (!this.games[name]) return { error: 'Game not found' };
        this.activeGame = name;
        this.games[name].state = null; // Reset state
        return { success: true, game: name, state: this.games[name].getState() };
    }

    getGameState() {
        if (!this.activeGame) return { error: 'No active game' };
        return this.games[this.activeGame].getState();
    }

    getAvailableActions() {
        if (!this.activeGame) return [];
        return this.games[this.activeGame].getActions();
    }

    executeAction(action) {
        if (!this.activeGame) return { error: 'No active game' };
        const result = this.games[this.activeGame].executeAction(action);
        
        // Generate Jena's reaction
        const reactions = {
            tictactoe: {
                win: ["HAHA I win! 😏", "Too easy! 💅", "Better luck next time mama!"],
                lose: ["WHAT?! You beat me?! 😤", "Okay that was lucky...", "Rematch! NOW! 🔥"],
                move: ["Hmm let me think... 🤔", "I'll put it here!", "Nice try but watch this!"],
            },
            rps: {
                win: ["I win! 😏", "Paper beats rock, silly! 📄", "Jena: 1, Mama: 0 💅"],
                lose: ["Okay you got me...", "Lucky guess! 😤", "Best of three!"],
            },
            guessnumber: {
                higher: ["Higher! You can do it! ⬆️", "Think bigger! 🤔"],
                lower: ["Lower! Going down! ⬇️", "Too high, mama!"],
                win: ["YOU GOT IT!! 🎉🎉", "Amazing! Only " + (this.games.guessnumber?.state?.attempts || '?') + " tries!"],
            },
        };

        const gameReactions = reactions[this.activeGame] || {};
        const category = result.won ? 'win' : (result.lastResult?.includes('win') ? 'win' : 'move');
        const pool = gameReactions[category] || gameReactions.move || ["Interesting move! 🤔"];
        result.jenaReaction = pool[Math.floor(Math.random() * pool.length)];

        return result;
    }

    listGames() {
        return Object.values(this.games).filter(g => g.enabled).map(g => ({
            name: g.name,
            displayName: g.displayName,
            description: g.description,
            category: g.category,
        }));
    }

    // === WEBSOCKET SERVER (for external games) ===
    // Games can connect via WebSocket to send state and receive actions
    startServer(port = 8765) {
        // Note: WebSocket server requires Node.js runtime
        // This is a client-side placeholder
        console.log('GameSDK: WebSocket server would start on port ' + port);
        console.log('GameSDK: For browser-based games, use the direct API');
    }
}

window.GameSDK = GameSDK;
