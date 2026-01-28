/**
 * Game Manager for Garden Grow Game
 * Handles game state, loop, and coordination between systems
 */

// Game states
const GameState = {
    LOADING: 'loading',
    WELCOME: 'welcome',
    CALIBRATION: 'calibration',
    CHAPTER_INTRO: 'chapterIntro',
    CHALLENGE_INTRO: 'challengeIntro',
    PLAYING: 'playing',
    ROUND_END: 'roundEnd',
    CHAPTER_COMPLETE: 'chapterComplete',
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
        this.gardenBed = null;

        // Current challenge reference
        this.currentChallenge = null;

        // Calibration
        this.calibrationWaveDetected = false;
        this.calibrationStartTime = 0;

        // Animation frame ID
        this.animationFrameId = null;

        // Weighted spawn for challenge plants
        this.spawnWeights = {};

        // Pending chapter complete (shown after round end)
        this.pendingChapterComplete = null;
    }

    /**
     * Initialize the game
     */
    async init() {
        console.log('Initializing Garden Grow game...');

        // Get DOM elements
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.videoElement = document.getElementById('webcam');

        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Initialize garden bed (seed spawner)
        this.gardenBed = new GardenBed(this.canvas);

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

        // Update welcome screen based on story progress
        this.updateWelcomeScreen();

        console.log('Garden Grow game initialized');
        return true;
    }

    /**
     * Update welcome screen based on player progress
     */
    updateWelcomeScreen() {
        const welcomeMessage = document.getElementById('welcomeMessage');
        const startBtnText = document.getElementById('startBtnText');
        const gardenProgressText = document.getElementById('gardenProgressText');

        if (welcomeMessage) {
            welcomeMessage.textContent = storyManager.getWelcomeMessage();
        }

        if (startBtnText) {
            startBtnText.textContent = storyManager.isReturningPlayer() ? 'Continue Growing' : 'Start Growing';
        }

        if (gardenProgressText) {
            const totalPlants = storyManager.totalPlantsGrown;
            if (totalPlants > 0) {
                gardenProgressText.textContent = `Your Garden: ${totalPlants} plants grown`;
            } else {
                gardenProgressText.textContent = 'Your garden is ready to bloom!';
            }
        }

        // Draw garden preview if returning player
        this.drawGardenPreview();
    }

    /**
     * Draw mini garden preview on welcome screen
     */
    drawGardenPreview() {
        const previewCanvas = document.getElementById('gardenPreviewCanvas');
        if (!previewCanvas) return;

        const ctx = previewCanvas.getContext('2d');
        const width = previewCanvas.width;
        const height = previewCanvas.height;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Draw sky
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, width, height * 0.6);

        // Draw grass/ground
        ctx.fillStyle = '#228B22';
        ctx.fillRect(0, height * 0.6, width, height * 0.2);

        // Draw soil
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, height * 0.8, width, height * 0.2);

        // Draw plants based on completed chapters
        const plantIcons = ['🌱', '🍅', '🌻', '🥕', '🥬', '🫐'];
        const completedCount = Math.min(storyManager.completedChapters.length * 2, 6);

        for (let i = 0; i < completedCount; i++) {
            const x = 30 + (i % 3) * 90;
            const y = height * 0.55 + Math.floor(i / 3) * 30;

            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(plantIcons[i % plantIcons.length], x, y);
        }

        // Add some empty soil spots
        for (let i = completedCount; i < 6; i++) {
            const x = 30 + (i % 3) * 90;
            const y = height * 0.85;

            ctx.fillStyle = '#654321';
            ctx.beginPath();
            ctx.ellipse(x, y, 15, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        }
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

            case GameState.CHAPTER_INTRO:
                uiManager.showHUD(false);
                this.showChapterIntro();
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
                this.showRoundEnd();
                break;

            case GameState.CHAPTER_COMPLETE:
                uiManager.showHUD(false);
                this.showChapterComplete();
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
            uiManager.updateHandIndicators(data.leftDetected, data.rightDetected);

            // Check for wave gesture to proceed
            if (!this.calibrationWaveDetected && data.leftDetected && data.rightDetected) {
                // Wait a moment to ensure stable detection
                if (Date.now() - this.calibrationStartTime > 2000) {
                    this.calibrationWaveDetected = true;
                    setTimeout(() => {
                        if (this.state === GameState.CALIBRATION) {
                            // Check if we need to show chapter intro
                            const currentLevel = challengeManager.currentLevel;
                            const newChapter = storyManager.isNewChapterStart(currentLevel);

                            if (newChapter) {
                                this.setState(GameState.CHAPTER_INTRO);
                            } else {
                                this.setState(GameState.CHALLENGE_INTRO);
                            }
                        }
                    }, 500);
                }
            }
        }

        // During gameplay, check for seed collisions
        if (this.state === GameState.PLAYING && this.gardenBed) {
            // Check collisions returns harvested plant keys
            const harvestedPlants = this.gardenBed.checkCollisions(data.positions);

            // Record harvests to challenge
            harvestedPlants.forEach(plantKey => {
                if (this.currentChallenge) {
                    this.currentChallenge.recordHarvest(plantKey);
                    storyManager.recordPlantGrown();

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
     * Show chapter intro screen
     */
    showChapterIntro() {
        const chapter = storyManager.getCurrentChapter();

        storyManager.showChapterIntro(chapter, () => {
            this.setState(GameState.CHALLENGE_INTRO);
        });
    }

    /**
     * Show challenge intro with countdown
     */
    showChallengeIntro() {
        // Get or create challenge
        this.currentChallenge = challengeManager.startChallenge();

        // Set garden bed difficulty
        this.gardenBed.setDifficulty(this.currentChallenge.level);

        // Calculate spawn weights (favor target plants)
        this.calculateSpawnWeights();

        // Show intro screen
        uiManager.showChallengeIntro(this.currentChallenge, () => {
            this.setState(GameState.PLAYING);
        });
    }

    /**
     * Calculate spawn weights for plants
     */
    calculateSpawnWeights() {
        const targetPlants = challengeManager.getTargetPlants();
        const allPlants = Object.keys(PLANT_TYPES);

        this.spawnWeights = {};

        allPlants.forEach(plant => {
            // Target plants have higher weight
            this.spawnWeights[plant] = targetPlants.includes(plant) ? 3 : 1;
        });
    }

    /**
     * Get weighted random plant for spawning
     */
    getWeightedRandomPlant() {
        const plants = Object.keys(this.spawnWeights);
        const totalWeight = plants.reduce((sum, plant) => sum + this.spawnWeights[plant], 0);

        let random = Math.random() * totalWeight;

        for (const plant of plants) {
            random -= this.spawnWeights[plant];
            if (random <= 0) {
                return plant;
            }
        }

        return plants[0];
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

        // Clear any existing seeds
        this.gardenBed.clear();

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

        // Check if this completes a chapter
        if (this.currentChallenge && this.currentChallenge.isComplete) {
            const completedChapter = storyManager.isChapterComplete(this.currentChallenge.level);
            if (completedChapter) {
                this.pendingChapterComplete = completedChapter;
            }
        }
    }

    /**
     * Show round end screen
     */
    showRoundEnd() {
        const isComplete = this.currentChallenge?.isComplete || false;
        const encouragementText = document.getElementById('encouragementText');
        const plantsGrown = document.getElementById('plantsGrown');

        // Update plants grown display (use garden terminology)
        if (plantsGrown) {
            plantsGrown.textContent = this.currentChallenge?.totalHarvested || 0;
        }

        // Show encouragement message
        if (encouragementText) {
            encouragementText.textContent = storyManager.getProgressMessage();
        }

        uiManager.showRoundEnd({
            isComplete: isComplete,
            score: this.currentChallenge?.score || 0,
            totalPopped: this.currentChallenge?.totalHarvested || 0
        });

        // Update result title for garden theme
        const roundResult = document.getElementById('roundResult');
        if (roundResult) {
            if (isComplete) {
                roundResult.textContent = 'Beautiful Garden!';
                roundResult.style.color = '#4ade80';
            } else {
                roundResult.textContent = 'Keep Growing!';
                roundResult.style.color = '#FFD700';
            }
        }
    }

    /**
     * Show chapter complete celebration
     */
    showChapterComplete() {
        if (this.pendingChapterComplete) {
            storyManager.completeChapter(this.pendingChapterComplete.chapter);

            storyManager.showChapterComplete(this.pendingChapterComplete, () => {
                this.pendingChapterComplete = null;
                this.setState(GameState.CHALLENGE_INTRO);
            });
        }
    }

    /**
     * Handle next level button
     */
    onNextLevel() {
        // Check if we have a pending chapter complete
        if (this.pendingChapterComplete) {
            this.setState(GameState.CHAPTER_COMPLETE);
        } else {
            challengeManager.nextLevel();

            // Check if next level starts a new chapter
            const currentLevel = challengeManager.currentLevel;
            const newChapter = storyManager.isNewChapterStart(currentLevel);

            if (newChapter) {
                this.setState(GameState.CHAPTER_INTRO);
            } else {
                this.setState(GameState.CHALLENGE_INTRO);
            }
        }
    }

    /**
     * Handle play again button
     */
    onPlayAgain() {
        challengeManager.restart();
        this.pendingChapterComplete = null;

        // Check if we should show chapter intro for level 1
        const newChapter = storyManager.isNewChapterStart(1);
        if (newChapter) {
            this.setState(GameState.CHAPTER_INTRO);
        } else {
            this.setState(GameState.CHALLENGE_INTRO);
        }
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
            // Custom spawn logic with weighted plants
            this.gardenBed.spawnTimer += deltaTime * 1000;
            if (this.gardenBed.spawnTimer >= this.gardenBed.spawnInterval) {
                const plant = this.getWeightedRandomPlant();
                this.gardenBed.spawnSpecificSeed(plant);
                this.gardenBed.spawnTimer = 0;
            }

            // Update seeds (without auto-spawn)
            this.gardenBed.seeds.forEach(seed => {
                seed.update(deltaTime, this.gardenBed.speedMultiplier);
            });

            // Remove off-screen seeds
            this.gardenBed.seeds = this.gardenBed.seeds.filter(seed =>
                !seed.isOffScreen && !seed.isAnimationComplete()
            );

            // Draw garden (including soil strip and seeds)
            this.gardenBed.draw(this.ctx);
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
