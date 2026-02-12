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
        this.calibrationHandsDetectedTime = 0;

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

        if (welcomeMessage) {
            welcomeMessage.textContent = storyManager.getWelcomeMessage();
        }

        if (startBtnText) {
            startBtnText.textContent = storyManager.isReturningPlayer() ? 'Continue Growing' : 'Start Growing';
        }

        // Draw garden preview strip at bottom of welcome screen
        this.drawGardenPreview();
    }

    /**
     * Draw garden preview strip across bottom of welcome screen
     */
    drawGardenPreview() {
        const previewCanvas = document.getElementById('gardenPreviewCanvas');
        if (!previewCanvas) return;

        // Size canvas to fill bottom strip at full width
        const dpr = window.devicePixelRatio || 1;
        const stripHeight = window.innerHeight * 0.2;
        previewCanvas.width = window.innerWidth * dpr;
        previewCanvas.height = stripHeight * dpr;
        previewCanvas.style.width = window.innerWidth + 'px';
        previewCanvas.style.height = stripHeight + 'px';

        const ctx = previewCanvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const width = window.innerWidth;
        const height = stripHeight;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Draw sky gradient (top portion)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.5);
        skyGrad.addColorStop(0, 'rgba(135, 206, 235, 0.0)');
        skyGrad.addColorStop(1, 'rgba(135, 206, 235, 0.4)');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height * 0.5);

        // Draw grass
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(0, height * 0.45, width, height * 0.15);

        // Grass detail — wavy top edge
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.45);
        for (let x = 0; x <= width; x += 40) {
            ctx.quadraticCurveTo(x + 20, height * 0.40 + Math.sin(x * 0.03) * 6, x + 40, height * 0.45);
        }
        ctx.lineTo(width, height * 0.55);
        ctx.lineTo(0, height * 0.55);
        ctx.closePath();
        ctx.fill();

        // Draw soil
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, height * 0.6, width, height * 0.4);

        // Darker soil bottom
        ctx.fillStyle = '#654321';
        ctx.fillRect(0, height * 0.85, width, height * 0.15);

        // Draw plants spread across the width
        const plantIcons = ['🌱', '🍅', '🌻', '🥕', '🥬', '🫐', '🌷', '🌿'];
        const completedCount = Math.min(storyManager.completedChapters.length * 2, 8);
        const totalSlots = 8;
        const spacing = width / (totalSlots + 1);

        ctx.textAlign = 'center';

        for (let i = 0; i < totalSlots; i++) {
            const x = spacing * (i + 1);

            if (i < completedCount) {
                // Grown plant
                ctx.font = `${Math.min(36, height * 0.25)}px Arial`;
                ctx.fillText(plantIcons[i % plantIcons.length], x, height * 0.48);
            } else {
                // Empty soil mound
                ctx.fillStyle = '#654321';
                ctx.beginPath();
                ctx.ellipse(x, height * 0.72, 20, 10, 0, 0, Math.PI * 2);
                ctx.fill();
            }
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
                this.calibrationHandsDetectedTime = 0;
                this.updateCalibrationProgress(0, 'calibrationProgressFill');
                break;

            case GameState.CALIBRATION_P2:
                uiManager.showScreen('calibrationP2');
                uiManager.showHUD(false);
                this.calibrationWaveDetected = false;
                this.calibrationStartTime = Date.now();
                this.calibrationHandsDetectedTime = 0;
                this.updateCalibrationProgress(0, 'calibrationP2ProgressFill');
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

            if (!this.calibrationWaveDetected) {
                let handsReady = false;
                if (this.playerCount === 1) {
                    handsReady = data.leftDetected && data.rightDetected;
                } else if (this.playerCount === 2) {
                    handsReady = data.rightDetected && data.positions.some(pos => pos.x > this.canvas.width / 2);
                }

                if (handsReady) {
                    if (!this.calibrationHandsDetectedTime) {
                        this.calibrationHandsDetectedTime = Date.now();
                    }
                    const elapsed = Date.now() - this.calibrationHandsDetectedTime;
                    const progress = Math.min(elapsed / 2000, 1);
                    this.updateCalibrationProgress(progress, 'calibrationProgressFill');

                    if (progress >= 1) {
                        this.calibrationWaveDetected = true;
                        setTimeout(() => {
                            if (this.state === GameState.CALIBRATION) {
                                if (this.playerCount === 2) {
                                    this.setState(GameState.CALIBRATION_P2);
                                } else {
                                    this.setState(GameState.CHALLENGE_INTRO);
                                }
                            }
                        }, 300);
                    }
                } else {
                    this.calibrationHandsDetectedTime = 0;
                    this.updateCalibrationProgress(0, 'calibrationProgressFill');
                }
            }
        }

        // Update CALIBRATION_P2 screen indicators
        if (this.state === GameState.CALIBRATION_P2) {
            uiManager.updateHandIndicators(data.leftDetected, data.rightDetected);

            if (!this.calibrationWaveDetected) {
                const hasLeftHand = data.positions.some(pos => pos.x <= this.canvas.width / 2);
                const hasTwoHands = data.positions.length >= 2;

                if (hasLeftHand && hasTwoHands) {
                    if (!this.calibrationHandsDetectedTime) {
                        this.calibrationHandsDetectedTime = Date.now();
                    }
                    const elapsed = Date.now() - this.calibrationHandsDetectedTime;
                    const progress = Math.min(elapsed / 2000, 1);
                    this.updateCalibrationProgress(progress, 'calibrationP2ProgressFill');

                    if (progress >= 1) {
                        this.calibrationWaveDetected = true;
                        setTimeout(() => {
                            if (this.state === GameState.CALIBRATION_P2) {
                                this.setState(GameState.CHALLENGE_INTRO);
                            }
                        }, 300);
                    }
                } else {
                    this.calibrationHandsDetectedTime = 0;
                    this.updateCalibrationProgress(0, 'calibrationP2ProgressFill');
                }
            }
        }

        // During gameplay, check for seed collisions
        if (this.state === GameState.PLAYING && this.gardenBed) {
            // Check collisions returns harvested plant data with playerId
            const harvestedPlants = this.gardenBed.checkCollisions(data.positions);

            // Record harvests to challenge
            let roundEnded = false;
            for (const harvestData of harvestedPlants) {
                const { plantKey, playerId, isTargetPlant } = harvestData;

                // DDA: Record interaction on any collision
                ddaEngine.recordInteraction(playerId);

                if (this.currentChallenge && !roundEnded) {
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

                    // Check if challenge complete — break to avoid processing more harvests
                    if (this.currentChallenge.isComplete) {
                        roundEnded = true;
                    }
                }
            }

            // Transition to ROUND_END after the loop to avoid mid-iteration state change
            if (roundEnded) {
                this.setState(GameState.ROUND_END);
            }
        }
    }

    /**
     * Update calibration progress bar
     */
    updateCalibrationProgress(progress, fillId) {
        const fill = document.getElementById(fillId);
        if (fill) fill.style.width = `${progress * 100}%`;
    }

    /**
     * Show challenge intro with countdown
     */
    showChallengeIntro() {
        // Guard against double-entry (e.g. rapid state transitions)
        if (this.currentChallenge && !this.currentChallenge.isComplete) {
            // Challenge already in progress — skip re-creation
        } else {
            this.currentChallenge = challengeManager.startChallenge();
        }

        // Set garden bed difficulty
        this.gardenBed.setDifficulty(this.currentChallenge.level);

        // Calculate spawn weights (favor target plants)
        this.calculateSpawnWeights();

        // Populate chapter header if this is the first level of a new chapter
        const chapterHeader = document.getElementById('chapterHeader');
        if (chapterHeader) {
            const currentLevel = challengeManager.currentLevel;
            const newChapter = storyManager.isNewChapterStart(currentLevel);
            if (newChapter) {
                chapterHeader.style.display = 'block';
                chapterHeader.querySelector('.chapter-header-icon').textContent = newChapter.icon;
                chapterHeader.querySelector('.chapter-header-number').textContent = `Chapter ${newChapter.chapter}`;
                chapterHeader.querySelector('.chapter-header-title').textContent = newChapter.title;
            } else {
                chapterHeader.style.display = 'none';
            }
        }

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

            // Populate chapter complete section if a chapter was finished
            const chapterCompleteSection = document.getElementById('chapterCompleteSection');
            if (chapterCompleteSection) {
                if (this.pendingChapterComplete) {
                    const chapter = this.pendingChapterComplete;
                    storyManager.completeChapter(chapter.chapter);

                    chapterCompleteSection.style.display = 'block';
                    chapterCompleteSection.querySelector('.chapter-complete-icon').textContent = chapter.icon;
                    chapterCompleteSection.querySelector('.chapter-complete-title').textContent = `${chapter.title} Complete!`;
                    chapterCompleteSection.querySelector('.chapter-complete-reward').textContent = chapter.reward;

                    const unlockEl = chapterCompleteSection.querySelector('.chapter-complete-unlock');
                    if (chapter.backgroundUnlock) {
                        unlockEl.textContent = `New background unlocked: ${chapter.backgroundUnlock}!`;
                        unlockEl.style.display = 'block';
                    } else {
                        unlockEl.style.display = 'none';
                    }

                    // Play celebration sound
                    audioManager.play('windChimes');
                } else {
                    chapterCompleteSection.style.display = 'none';
                }
            }
        }
    }

    /**
     * Handle next level button
     */
    onNextLevel() {
        this.pendingChapterComplete = null;
        challengeManager.nextLevel();
        this.setState(GameState.CHALLENGE_INTRO);
    }

    /**
     * Handle play again button
     */
    onPlayAgain() {
        challengeManager.restart();
        this.pendingChapterComplete = null;
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
            // Update DDA engine
            ddaEngine.update(deltaTime, this.gameMode);

            // In competitive mode, check rubber-band
            if (this.gameMode === 'competitive') {
                ddaEngine.checkRubberBand(this.player1Score, this.player2Score);
            }

            // Pass idle times to garden for hint arrows
            this.gardenBed.setPlayerIdleTime(1, ddaEngine.players[1].idleTime);
            if (this.playerCount === 2) {
                this.gardenBed.setPlayerIdleTime(2, ddaEngine.players[2].idleTime);
            }

            // Update garden (handles needs, growth, etc.)
            this.gardenBed.update(deltaTime);

            // Draw garden scene
            this.gardenBed.draw(this.ctx);
        }

        // Draw hand indicators (always when tracking is active)
        if (this.state !== GameState.LOADING) {
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
