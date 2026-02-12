/**
 * Game Manager for Garden Grow Game
 * Handles game state, loop, and coordination between systems
 */

// Game states
const GameState = {
    LOADING: 'loading',
    WELCOME: 'welcome',
    PLAYER_SELECT: 'playerSelect',
    MODE_SELECT: 'modeSelect',
    CALIBRATION: 'calibration',
    CALIBRATION_P2: 'calibrationP2',
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

        // Player configuration
        this.playerCount = 1; // 1 or 2
        this.gameMode = 'solo'; // 'solo', 'coop', or 'competitive'
        this.player1Score = 0;
        this.player2Score = 0;

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
            onPlayAgain: () => this.onPlayAgain(),
            onSelectOnePlayer: () => this.onSelectOnePlayer(),
            onSelectTwoPlayers: () => this.onSelectTwoPlayers(),
            onSelectCoop: () => this.onSelectCoop(),
            onSelectCompetitive: () => this.onSelectCompetitive()
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

            case GameState.PLAYER_SELECT:
                uiManager.showScreen('playerSelect');
                uiManager.showHUD(false);
                break;

            case GameState.MODE_SELECT:
                uiManager.showScreen('modeSelect');
                uiManager.showHUD(false);
                break;

            case GameState.CALIBRATION:
                uiManager.showScreen('calibration');
                uiManager.showHUD(false);
                this.calibrationWaveDetected = false;
                this.calibrationStartTime = Date.now();
                break;

            case GameState.CALIBRATION_P2:
                uiManager.showScreen('calibrationP2');
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
                if (this.playerCount === 2 && (this.gameMode === 'competitive' || this.gameMode === 'coop')) {
                    uiManager.showHUD2P(true);
                } else {
                    uiManager.showHUD(true);
                }
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
            this.setState(GameState.PLAYER_SELECT);
            this.startGameLoop();
        } else {
            alert('Could not access camera. Please allow camera access and try again.');
        }
    }

    /**
     * Handle one player selection
     */
    onSelectOnePlayer() {
        this.playerCount = 1;
        this.gameMode = 'solo';
        this.setState(GameState.CALIBRATION);
    }

    /**
     * Handle two players selection
     */
    onSelectTwoPlayers() {
        this.playerCount = 2;
        this.setState(GameState.MODE_SELECT);
    }

    /**
     * Handle cooperative mode selection
     */
    onSelectCoop() {
        this.gameMode = 'coop';
        this.setState(GameState.CALIBRATION);
    }

    /**
     * Handle competitive mode selection
     */
    onSelectCompetitive() {
        this.gameMode = 'competitive';
        this.setState(GameState.CALIBRATION);
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
            if (!this.calibrationWaveDetected) {
                if (this.playerCount === 1) {
                    // Single player: wait for both hands
                    if (data.leftDetected && data.rightDetected) {
                        if (Date.now() - this.calibrationStartTime > 2000) {
                            this.calibrationWaveDetected = true;
                            setTimeout(() => {
                                if (this.state === GameState.CALIBRATION) {
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
                } else if (this.playerCount === 2) {
                    // Two players: wait for 1 hand on right side (P1)
                    if (data.rightDetected && data.positions.some(pos => pos.x > this.canvas.width / 2)) {
                        if (Date.now() - this.calibrationStartTime > 2000) {
                            this.calibrationWaveDetected = true;
                            setTimeout(() => {
                                if (this.state === GameState.CALIBRATION) {
                                    this.setState(GameState.CALIBRATION_P2);
                                }
                            }, 500);
                        }
                    }
                }
            }
        }

        // Update CALIBRATION_P2 screen indicators
        if (this.state === GameState.CALIBRATION_P2) {
            uiManager.updateHandIndicators(data.leftDetected, data.rightDetected);

            // Wait for second hand on left side (need 2 hands total, stable 2s)
            if (!this.calibrationWaveDetected) {
                const hasLeftHand = data.positions.some(pos => pos.x <= this.canvas.width / 2);
                const hasTwoHands = data.positions.length >= 2;

                if (hasLeftHand && hasTwoHands) {
                    if (Date.now() - this.calibrationStartTime > 2000) {
                        this.calibrationWaveDetected = true;
                        setTimeout(() => {
                            if (this.state === GameState.CALIBRATION_P2) {
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
        }

        // During gameplay, check for seed collisions
        if (this.state === GameState.PLAYING && this.gardenBed) {
            // Check collisions returns harvested plant data with playerId
            const harvestedPlants = this.gardenBed.checkCollisions(data.positions);

            // Record harvests to challenge
            harvestedPlants.forEach(harvestData => {
                const { plantKey, playerId, isTargetPlant } = harvestData;

                if (this.currentChallenge) {
                    this.currentChallenge.recordHarvest(plantKey);
                    storyManager.recordPlantGrown();

                    // Track per-player scores
                    if (this.gameMode === 'competitive') {
                        if (playerId === 1) {
                            this.player1Score += isTargetPlant ? 100 : 50;
                        } else if (playerId === 2) {
                            this.player2Score += isTargetPlant ? 100 : 50;
                        }

                        // Update 2P HUD
                        uiManager.updatePlayer1Score(this.player1Score);
                        uiManager.updatePlayer2Score(this.player2Score);
                    } else if (this.gameMode === 'coop') {
                        // Both players contribute to shared progress
                        uiManager.updateScore(this.currentChallenge.score);
                    } else {
                        // Solo mode
                        uiManager.updateScore(this.currentChallenge.score);
                    }

                    // Update progress
                    uiManager.updateProgress(
                        this.currentChallenge.getProgressPercent(),
                        this.currentChallenge.getProgressText()
                    );

                    // DDA: Record harvest
                    ddaEngine.recordHarvest(playerId, isTargetPlant);

                    // Audio: Play for specific player
                    audioManager.playForPlayer('harvest', playerId);

                    // Check if challenge complete
                    if (this.currentChallenge.isComplete) {
                        this.setState(GameState.ROUND_END);
                    }
                }

                // DDA: Record interaction on any collision
                ddaEngine.recordInteraction(playerId);
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

        // Reset per-player scores
        this.player1Score = 0;
        this.player2Score = 0;

        // Reset DDA engine
        ddaEngine.reset();

        // Update HUD
        uiManager.updateChallengeText(this.currentChallenge.getMiniDisplayText());
        if (this.gameMode === 'competitive') {
            uiManager.updatePlayer1Score(this.player1Score);
            uiManager.updatePlayer2Score(this.player2Score);
            uiManager.updateTimer2P(this.timeRemaining);
        } else {
            uiManager.updateScore(this.currentChallenge.score);
        }
        uiManager.updateProgress(0, this.currentChallenge.getProgressText());

        // Configure garden bed for multi-player
        this.gardenBed.configure({
            playerCount: this.playerCount,
            gameMode: this.gameMode,
            dividerX: handTracker.dividerX * this.canvas.width
        });

        // Update hand tracker player count
        handTracker.setPlayerCount(this.playerCount);

        // Clear any existing seeds
        this.gardenBed.clear();

        // Start timer
        this.timerInterval = setInterval(() => {
            this.timeRemaining -= 1;

            if (this.gameMode === 'competitive') {
                uiManager.updateTimer2P(this.timeRemaining);
            } else {
                uiManager.updateTimer(this.timeRemaining);
            }

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

        // Check rubber-band in competitive mode
        if (this.gameMode === 'competitive') {
            const rubberBandApplied = ddaEngine.checkRubberBand(this.player1Score, this.player2Score);
            if (rubberBandApplied) {
                console.log('Rubber-banding applied to balance competitive scores');
            }
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

        if (this.gameMode === 'competitive') {
            // Show competitive round end
            uiManager.showCompetitiveRoundEnd({
                p1Score: this.player1Score,
                p2Score: this.player2Score,
                isComplete: isComplete
            });
        } else {
            // Show normal or coop round end
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
            // Update DDA engine
            ddaEngine.update(deltaTime, this.gameMode);

            // In competitive mode, check rubber-band
            if (this.gameMode === 'competitive') {
                ddaEngine.checkRubberBand(this.player1Score, this.player2Score);
            }

            // Update garden (handles needs, growth, etc.)
            this.gardenBed.update(deltaTime);

            // Draw garden scene
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
