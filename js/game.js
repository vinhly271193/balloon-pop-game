/**
 * Game Manager for Balloon Pop Game
 * Handles game state, loop, and coordination between systems
 */

// Game states
const GameState = {
    LOADING: 'loading',
    WELCOME: 'welcome',
    CALIBRATION: 'calibration',
    CHALLENGE_INTRO: 'challengeIntro',
    PLAYING: 'playing',
    ROUND_END: 'roundEnd',
    PAUSED: 'paused'
};

class Game {
    constructor() {
        // Canvas elements
        this.canvas = null;
        this.ctx = null;
        this.videoElement = null;

        // Game state
        this.state = GameState.LOADING;
        this.isRunning = false;
        this.lastFrameTime = 0;

        // Timer
        this.timeRemaining = 60;
        this.timerInterval = null;

        // Systems (will be initialized)
        this.balloonSpawner = null;

        // Current challenge reference
        this.currentChallenge = null;

        // Calibration
        this.calibrationWaveDetected = false;
        this.calibrationStartTime = 0;

        // Animation frame ID
        this.animationFrameId = null;

        // Weighted spawn for challenge colors
        this.spawnWeights = {};
    }

    /**
     * Initialize the game
     */
    async init() {
        console.log('Initializing game...');

        // Get DOM elements
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.videoElement = document.getElementById('webcam');

        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Initialize balloon spawner
        this.balloonSpawner = new BalloonSpawner(this.canvas);

        // Initialize UI
        uiManager.init({
            onStart: () => this.onStartClick(),
            onNextLevel: () => this.onNextLevel(),
            onPlayAgain: () => this.onPlayAgain()
        });

        // Initialize audio (will be activated on first user interaction)
        await audioManager.init();

        // Initialize hand tracking
        const handTrackingReady = await handTracker.init(this.videoElement, this.canvas);

        if (!handTrackingReady) {
            console.error('Hand tracking failed to initialize');
            return false;
        }

        // Set up hand detection callback
        handTracker.onHandsDetected = (data) => this.onHandsDetected(data);

        // Hide loading, show welcome
        uiManager.setLoading(false);
        this.setState(GameState.WELCOME);

        console.log('Game initialized');
        return true;
    }

    /**
     * Resize canvas to match window
     */
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * Set game state
     */
    setState(newState) {
        console.log(`State change: ${this.state} -> ${newState}`);
        this.state = newState;

        switch (newState) {
            case GameState.WELCOME:
                uiManager.showScreen('welcome');
                uiManager.showHUD(false);
                break;

            case GameState.CALIBRATION:
                uiManager.showScreen('calibration');
                uiManager.showHUD(false);
                this.calibrationWaveDetected = false;
                this.calibrationStartTime = Date.now();
                break;

            case GameState.CHALLENGE_INTRO:
                uiManager.showHUD(false);
                this.showChallengeIntro();
                break;

            case GameState.PLAYING:
                uiManager.hideAllScreens();
                uiManager.showHUD(true);
                this.startRound();
                break;

            case GameState.ROUND_END:
                this.stopRound();
                uiManager.showHUD(false);
                uiManager.showRoundEnd({
                    isComplete: this.currentChallenge?.isComplete || false,
                    score: this.currentChallenge?.score || 0,
                    totalPopped: this.currentChallenge?.totalPopped || 0
                });
                break;

            case GameState.PAUSED:
                this.stopGameLoop();
                break;
        }
    }

    /**
     * Handle start button click
     */
    async onStartClick() {
        // Resume audio context (needed after user interaction)
        audioManager.resume();

        // Start camera and hand tracking
        const started = await handTracker.start();

        if (started) {
            this.setState(GameState.CALIBRATION);
            this.startGameLoop();
        } else {
            alert('Could not access camera. Please allow camera access and try again.');
        }
    }

    /**
     * Handle hand detection updates
     */
    onHandsDetected(data) {
        // Always check for hand hover on UI elements (works on all screens)
        uiManager.checkHandHover(data.positions);

        // Update calibration screen indicators
        if (this.state === GameState.CALIBRATION) {
            // Swap left/right because video is mirrored - user's right hand appears on left side
            uiManager.updateHandIndicators(data.rightDetected, data.leftDetected);

            // Check for wave gesture to proceed
            if (!this.calibrationWaveDetected && data.leftDetected && data.rightDetected) {
                // Wait a moment to ensure stable detection
                if (Date.now() - this.calibrationStartTime > 2000) {
                    this.calibrationWaveDetected = true;
                    setTimeout(() => {
                        if (this.state === GameState.CALIBRATION) {
                            this.setState(GameState.CHALLENGE_INTRO);
                        }
                    }, 500);
                }
            }
        }

        // During gameplay, check for balloon collisions
        if (this.state === GameState.PLAYING && this.balloonSpawner) {
            const poppedColors = this.balloonSpawner.checkCollisions(data.positions);

            // Record pops to challenge
            poppedColors.forEach(colorKey => {
                if (this.currentChallenge) {
                    this.currentChallenge.recordPop(colorKey);

                    // Update UI
                    uiManager.updateScore(this.currentChallenge.score);
                    uiManager.updateProgress(
                        this.currentChallenge.getProgressPercent(),
                        this.currentChallenge.getProgressText()
                    );

                    // Check if challenge complete
                    if (this.currentChallenge.isComplete) {
                        this.setState(GameState.ROUND_END);
                    }
                }
            });
        }
    }

    /**
     * Show challenge intro with countdown
     */
    showChallengeIntro() {
        // Get or create challenge
        this.currentChallenge = challengeManager.startChallenge();

        // Set balloon spawner difficulty
        this.balloonSpawner.setDifficulty(this.currentChallenge.level);

        // Calculate spawn weights (favor target colors)
        this.calculateSpawnWeights();

        // Show intro screen
        uiManager.showChallengeIntro(this.currentChallenge, () => {
            this.setState(GameState.PLAYING);
        });
    }

    /**
     * Calculate spawn weights for balloons
     */
    calculateSpawnWeights() {
        const targetColors = challengeManager.getTargetColors();
        const allColors = Object.keys(BALLOON_COLORS);

        this.spawnWeights = {};

        allColors.forEach(color => {
            // Target colors have higher weight
            this.spawnWeights[color] = targetColors.includes(color) ? 3 : 1;
        });
    }

    /**
     * Get weighted random color for spawning
     */
    getWeightedRandomColor() {
        const colors = Object.keys(this.spawnWeights);
        const totalWeight = colors.reduce((sum, color) => sum + this.spawnWeights[color], 0);

        let random = Math.random() * totalWeight;

        for (const color of colors) {
            random -= this.spawnWeights[color];
            if (random <= 0) {
                return color;
            }
        }

        return colors[0];
    }

    /**
     * Start a game round
     */
    startRound() {
        // Reset timer
        this.timeRemaining = this.currentChallenge.timeLimit;
        uiManager.updateTimer(this.timeRemaining);

        // Update HUD
        uiManager.updateChallengeText(this.currentChallenge.getMiniDisplayText());
        uiManager.updateScore(this.currentChallenge.score);
        uiManager.updateProgress(0, this.currentChallenge.getProgressText());

        // Clear any existing balloons
        this.balloonSpawner.clear();

        // Start timer
        this.timerInterval = setInterval(() => {
            this.timeRemaining -= 1;
            uiManager.updateTimer(this.timeRemaining);

            if (this.timeRemaining <= 0) {
                this.setState(GameState.ROUND_END);
            }
        }, 1000);

        // Make sure game loop is running
        if (!this.isRunning) {
            this.startGameLoop();
        }
    }

    /**
     * Stop the current round
     */
    stopRound() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // Record challenge completion
        challengeManager.completeChallenge();
    }

    /**
     * Handle next level button
     */
    onNextLevel() {
        challengeManager.nextLevel();
        this.setState(GameState.CHALLENGE_INTRO);
    }

    /**
     * Handle play again button
     */
    onPlayAgain() {
        challengeManager.restart();
        this.setState(GameState.CHALLENGE_INTRO);
    }

    /**
     * Start the game loop
     */
    startGameLoop() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    /**
     * Stop the game loop
     */
    stopGameLoop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
        this.lastFrameTime = currentTime;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and render based on state
        if (this.state === GameState.PLAYING) {
            // Custom spawn logic with weighted colors
            this.balloonSpawner.spawnTimer += deltaTime * 1000;
            if (this.balloonSpawner.spawnTimer >= this.balloonSpawner.spawnInterval) {
                const color = this.getWeightedRandomColor();
                this.balloonSpawner.spawnColoredBalloon(color);
                this.balloonSpawner.spawnTimer = 0;
            }

            // Update balloons (without auto-spawn)
            this.balloonSpawner.balloons.forEach(balloon => {
                balloon.update(deltaTime, this.balloonSpawner.speedMultiplier);
            });

            // Remove off-screen balloons
            this.balloonSpawner.balloons = this.balloonSpawner.balloons.filter(balloon =>
                !balloon.isOffScreen && !balloon.isAnimationComplete()
            );

            // Draw balloons
            this.balloonSpawner.draw(this.ctx);
        }

        // Draw hand indicators (always when tracking is active)
        if (this.state !== GameState.WELCOME && this.state !== GameState.LOADING) {
            handTracker.drawHands(this.ctx);
        }

        // Continue loop
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Pause the game
     */
    pause() {
        if (this.state === GameState.PLAYING) {
            this.setState(GameState.PAUSED);
        }
    }

    /**
     * Resume the game
     */
    resume() {
        if (this.state === GameState.PAUSED) {
            this.setState(GameState.PLAYING);
            this.startGameLoop();
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopGameLoop();
        this.stopRound();
        handTracker.stop();
        uiManager.destroy();
    }
}

// Global game instance
const game = new Game();
