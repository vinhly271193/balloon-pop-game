/**
 * UI Manager for Garden Grow Game
 * Handles all screen transitions, UI updates, and hand hover interactions
 */

class UIManager {
    constructor() {
        // Screen elements
        this.screens = {
            welcome: document.getElementById('welcomeScreen'),
            calibration: document.getElementById('calibrationScreen'),
            chapterIntro: document.getElementById('chapterIntroScreen'),
            challengeIntro: document.getElementById('challengeIntroScreen'),
            chapterComplete: document.getElementById('chapterCompleteScreen'),
            roundEnd: document.getElementById('roundEndScreen'),
            playerSelect: document.getElementById('playerSelectScreen'),
            modeSelect: document.getElementById('modeSelectScreen'),
            calibrationP2: document.getElementById('calibrationP2Screen'),
            roundEnd2P: document.getElementById('roundEndScreen2P')
        };

        // HUD elements
        this.hud = {
            container: document.getElementById('gameHUD'),
            timer: document.getElementById('timerValue'),
            score: document.getElementById('scoreValue'),
            challenge: document.getElementById('currentChallenge'),
            progressBar: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText')
        };

        // 2P HUD elements
        this.hud2P = {
            container: document.getElementById('gameHUD2P'),
            timer: document.getElementById('timerValue2P'),
            p1Score: document.getElementById('p1ScoreValue'),
            p2Score: document.getElementById('p2ScoreValue'),
            p1ProgressBar: document.getElementById('p1ProgressFill'),
            p2ProgressBar: document.getElementById('p2ProgressFill')
        };

        // Other elements
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.leftHandIndicator = document.getElementById('leftHandIndicator');
        this.rightHandIndicator = document.getElementById('rightHandIndicator');

        // Challenge intro elements
        this.levelNumber = document.getElementById('levelNumber');
        this.challengeDisplay = document.getElementById('challengeDisplay');
        this.challengeColors = document.getElementById('challengeColors');
        this.countdown = document.getElementById('countdown');

        // Round end elements
        this.roundResult = document.getElementById('roundResult');
        this.finalScore = document.getElementById('finalScore');
        this.plantsGrown = document.getElementById('plantsGrown');

        // 2P round end elements
        this.ribbonP1Score = document.getElementById('ribbonP1Score');
        this.ribbonP2Score = document.getElementById('ribbonP2Score');
        this.ribbonP1Title = document.getElementById('ribbonP1Title');
        this.ribbonP2Title = document.getElementById('ribbonP2Title');
        this.encouragementText2P = document.getElementById('encouragementText2P');
        this.nextLevelBtn2P = document.getElementById('nextLevelBtn2P');
        this.playAgainBtn2P = document.getElementById('playAgainBtn2P');

        // Buttons
        this.startBtn = document.getElementById('startBtn');
        this.nextLevelBtn = document.getElementById('nextLevelBtn');
        this.playAgainBtn = document.getElementById('playAgainBtn');

        // Settings elements
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsOverlay = document.getElementById('settingsOverlay');
        this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
        this.closeSettingsX = document.getElementById('closeSettingsX');
        this.soundToggle = document.getElementById('soundToggle');
        this.volumeDown = document.getElementById('volumeDown');
        this.volumeUp = document.getElementById('volumeUp');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeFill = document.getElementById('volumeFill');
        this.volumeHandle = document.getElementById('volumeHandle');
        this.contrastNormal = document.getElementById('contrastNormal');
        this.contrastHigh = document.getElementById('contrastHigh');
        this.contrastMax = document.getElementById('contrastMax');

        // Volume slider drag state
        this.isDraggingVolume = false;

        // Background elements
        this.natureBackground = document.getElementById('natureBackground');
        this.bgNone = document.getElementById('bgNone');
        this.bgGarden = document.getElementById('bgGarden');
        this.bgBeach = document.getElementById('bgBeach');
        this.bgForest = document.getElementById('bgForest');
        this.bgSky = document.getElementById('bgSky');

        // State
        this.currentScreen = 'welcome';
        this.countdownInterval = null;

        // Settings state
        this.settings = {
            soundEnabled: true,
            volume: 0.7,
            contrastMode: 'normal',
            background: 'sky'
        };

        // Hand hover state
        this.hoverState = {
            currentElement: null,
            hoverStartTime: 0,
            hoverDuration: 3000, // 3 seconds to activate
            isHovering: false
        };

        // All hoverable elements
        this.hoverableElements = [];
    }

    /**
     * Initialize UI event listeners
     */
    init(callbacks) {
        this.callbacks = callbacks || {};

        // Traditional click handlers (still work)
        this.startBtn?.addEventListener('click', () => {
            if (this.callbacks.onStart) {
                this.callbacks.onStart();
            }
        });

        this.nextLevelBtn?.addEventListener('click', () => {
            if (this.callbacks.onNextLevel) {
                this.callbacks.onNextLevel();
            }
        });

        this.playAgainBtn?.addEventListener('click', () => {
            if (this.callbacks.onPlayAgain) {
                this.callbacks.onPlayAgain();
            }
        });

        this.nextLevelBtn2P?.addEventListener('click', () => {
            if (this.callbacks.onNextLevel) this.callbacks.onNextLevel();
        });
        this.playAgainBtn2P?.addEventListener('click', () => {
            if (this.callbacks.onPlayAgain) this.callbacks.onPlayAgain();
        });

        // Settings button click
        this.settingsBtn?.addEventListener('click', () => this.openSettings());
        this.closeSettingsBtn?.addEventListener('click', () => this.closeSettings());
        this.closeSettingsX?.addEventListener('click', () => this.closeSettings());

        // Settings controls
        this.soundToggle?.addEventListener('click', () => this.toggleSound());
        this.volumeDown?.addEventListener('click', () => this.adjustVolume(-0.1));
        this.volumeUp?.addEventListener('click', () => this.adjustVolume(0.1));
        this.contrastNormal?.addEventListener('click', () => this.setContrast('normal'));
        this.contrastHigh?.addEventListener('click', () => this.setContrast('high'));
        this.contrastMax?.addEventListener('click', () => this.setContrast('max'));

        // Volume slider drag functionality
        this.initVolumeSlider();

        // Background controls
        this.bgNone?.addEventListener('click', () => this.setBackground('none'));
        this.bgGarden?.addEventListener('click', () => this.setBackground('garden'));
        this.bgBeach?.addEventListener('click', () => this.setBackground('beach'));
        this.bgForest?.addEventListener('click', () => this.setBackground('forest'));
        this.bgSky?.addEventListener('click', () => this.setBackground('sky'));

        // Collect all hoverable elements
        this.collectHoverableElements();

        // Spawn particles on the initial welcome screen
        this.spawnParticles(this.screens.welcome);

        // Apply chapter color theme to light screens
        this.applyChapterTheme();

        // Load saved settings
        this.loadSettings();

        // Apply default background if not loaded from settings
        if (this.settings.background) {
            this.setBackground(this.settings.background);
        }
    }

    /**
     * Collect all elements with hoverable class
     */
    collectHoverableElements() {
        this.hoverableElements = Array.from(document.querySelectorAll('.hoverable'));
    }

    /**
     * Check hand positions against hoverable elements
     * Called from game loop with hand positions
     */
    checkHandHover(handPositions) {
        if (!handPositions || handPositions.length === 0) {
            this.clearHover();
            this.updateParallax(null);
            return;
        }

        // Update parallax on floating particles
        this.updateParallax(handPositions);

        // Get canvas dimensions for coordinate conversion
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;

        let foundHover = false;

        // Check each hoverable element
        for (const element of this.hoverableElements) {
            if (!this.isElementVisible(element)) continue;

            const rect = element.getBoundingClientRect();

            // Check if any hand position is over this element
            for (const pos of handPositions) {
                // Convert mirrored canvas coordinates to screen coordinates
                const screenX = canvas.width - pos.x;
                const screenY = pos.y;

                // Scale to actual screen size
                const scaleX = window.innerWidth / canvas.width;
                const scaleY = window.innerHeight / canvas.height;
                const actualX = screenX * scaleX;
                const actualY = screenY * scaleY;

                if (this.isPointInRect(actualX, actualY, rect)) {
                    foundHover = true;
                    this.handleHover(element);
                    break;
                }
            }

            if (foundHover) break;
        }

        if (!foundHover) {
            this.clearHover();
        }
    }

    /**
     * Check if element is visible
     */
    isElementVisible(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') return false;

        // Check if parent is visible
        let parent = element.parentElement;
        while (parent) {
            const parentStyle = window.getComputedStyle(parent);
            if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
                return false;
            }
            // Check for hidden class on overlays
            if (parent.classList.contains('hidden')) {
                return false;
            }
            // Check if screen is active
            if (parent.classList.contains('screen') && !parent.classList.contains('active')) {
                return false;
            }
            parent = parent.parentElement;
        }

        return true;
    }

    /**
     * Check if point is inside rectangle
     */
    isPointInRect(x, y, rect) {
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }

    /**
     * Handle hover on an element
     */
    handleHover(element) {
        const now = Date.now();

        if (this.hoverState.currentElement !== element) {
            // New element - start fresh
            this.clearHover();
            this.hoverState.currentElement = element;
            this.hoverState.hoverStartTime = now;
            this.hoverState.isHovering = true;
            element.classList.add('hand-hovering');
        }

        // Calculate progress
        const elapsed = now - this.hoverState.hoverStartTime;
        const progress = Math.min(elapsed / this.hoverState.hoverDuration, 1);

        // Update progress indicator
        this.updateHoverProgress(element, progress);

        // Check if activation threshold reached
        if (progress >= 1) {
            this.activateElement(element);
            this.clearHover();
        }
    }

    /**
     * Update hover progress visual
     */
    updateHoverProgress(element, progress) {
        // Update progress bar (legacy)
        const progressBar = element.querySelector('.hover-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
        }

        // Update circular progress (for settings button) - SVG circle
        const circleProgressFill = element.querySelector('.hover-progress-ring .hover-progress-fill');
        if (circleProgressFill) {
            const circumference = 283; // 2 * PI * 45
            const offset = circumference * (1 - progress);
            circleProgressFill.style.strokeDashoffset = offset;
        }

        // Update border progress (for big buttons) - CSS conic-gradient mask
        const borderProgressFill = element.querySelector('.border-progress-fill');
        if (borderProgressFill) {
            element.style.setProperty('--progress', progress);
        }
    }

    /**
     * Clear hover state
     */
    clearHover() {
        if (this.hoverState.currentElement) {
            this.hoverState.currentElement.classList.remove('hand-hovering');
            this.updateHoverProgress(this.hoverState.currentElement, 0);

            // Reset CSS custom property for border progress
            this.hoverState.currentElement.style.setProperty('--progress', 0);
        }
        this.hoverState.currentElement = null;
        this.hoverState.isHovering = false;
        this.hoverState.hoverStartTime = 0;
    }

    /**
     * Activate element (trigger its action)
     */
    activateElement(element) {
        const action = element.dataset.hoverAction;

        // Play activation sound
        audioManager.play('success');

        switch (action) {
            case 'start':
                if (this.callbacks.onStart) this.callbacks.onStart();
                break;
            case 'nextLevel':
                if (this.callbacks.onNextLevel) this.callbacks.onNextLevel();
                break;
            case 'playAgain':
                if (this.callbacks.onPlayAgain) this.callbacks.onPlayAgain();
                break;
            case 'selectOnePlayer':
                if (this.callbacks.onSelectOnePlayer) this.callbacks.onSelectOnePlayer();
                break;
            case 'selectTwoPlayers':
                if (this.callbacks.onSelectTwoPlayers) this.callbacks.onSelectTwoPlayers();
                break;
            case 'selectCoop':
                if (this.callbacks.onSelectCoop) this.callbacks.onSelectCoop();
                break;
            case 'selectCompetitive':
                if (this.callbacks.onSelectCompetitive) this.callbacks.onSelectCompetitive();
                break;
            case 'openSettings':
                this.openSettings();
                break;
            case 'closeSettings':
                this.closeSettings();
                break;
            case 'toggleSound':
                this.toggleSound();
                break;
            case 'volumeUp':
                this.adjustVolume(0.1);
                break;
            case 'volumeDown':
                this.adjustVolume(-0.1);
                break;
            case 'contrastNormal':
                this.setContrast('normal');
                break;
            case 'contrastHigh':
                this.setContrast('high');
                break;
            case 'contrastMax':
                this.setContrast('max');
                break;
            case 'bgNone':
                this.setBackground('none');
                break;
            case 'bgGarden':
                this.setBackground('garden');
                break;
            case 'bgBeach':
                this.setBackground('beach');
                break;
            case 'bgForest':
                this.setBackground('forest');
                break;
            case 'bgSky':
                this.setBackground('sky');
                break;
        }
    }

    /**
     * Open settings overlay
     */
    openSettings() {
        this.settingsOverlay?.classList.remove('hidden');
        this.collectHoverableElements(); // Re-collect to include settings buttons
    }

    /**
     * Close settings overlay
     */
    closeSettings() {
        this.settingsOverlay?.classList.add('hidden');
    }

    /**
     * Toggle sound on/off
     */
    toggleSound() {
        this.settings.soundEnabled = !this.settings.soundEnabled;
        audioManager.setEnabled(this.settings.soundEnabled);

        if (this.soundToggle) {
            const state = this.soundToggle.querySelector('.toggle-state');
            if (state) {
                state.textContent = this.settings.soundEnabled ? 'ON' : 'OFF';
            }
            this.soundToggle.classList.toggle('off', !this.settings.soundEnabled);
        }

        this.saveSettings();
    }

    /**
     * Adjust volume
     */
    adjustVolume(delta) {
        this.settings.volume = Math.max(0, Math.min(1, this.settings.volume + delta));
        audioManager.setVolume(this.settings.volume);

        this.updateVolumeUI();

        // Play a pop sound to demonstrate volume
        audioManager.play('pop');

        this.saveSettings();
    }

    /**
     * Update volume UI (fill bar and handle position)
     */
    updateVolumeUI() {
        const percent = this.settings.volume * 100;
        if (this.volumeFill) {
            this.volumeFill.style.width = `${percent}%`;
        }
        if (this.volumeHandle) {
            // Position handle at the end of the fill (centered on the edge)
            this.volumeHandle.style.left = `${percent}%`;
        }
    }

    /**
     * Initialize volume slider drag functionality
     */
    initVolumeSlider() {
        if (!this.volumeSlider) return;

        const setVolumeFromEvent = (e) => {
            const rect = this.volumeSlider.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            let x = clientX - rect.left;
            let percent = x / rect.width;
            percent = Math.max(0, Math.min(1, percent));

            this.settings.volume = percent;
            audioManager.setVolume(this.settings.volume);
            this.updateVolumeUI();
        };

        // Mouse events
        this.volumeSlider.addEventListener('mousedown', (e) => {
            this.isDraggingVolume = true;
            setVolumeFromEvent(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDraggingVolume) {
                setVolumeFromEvent(e);
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isDraggingVolume) {
                this.isDraggingVolume = false;
                audioManager.play('pop');
                this.saveSettings();
            }
        });

        // Touch events for mobile
        this.volumeSlider.addEventListener('touchstart', (e) => {
            this.isDraggingVolume = true;
            setVolumeFromEvent(e);
        });

        document.addEventListener('touchmove', (e) => {
            if (this.isDraggingVolume) {
                setVolumeFromEvent(e);
            }
        });

        document.addEventListener('touchend', () => {
            if (this.isDraggingVolume) {
                this.isDraggingVolume = false;
                audioManager.play('pop');
                this.saveSettings();
            }
        });

        // Click directly on the bar
        this.volumeSlider.addEventListener('click', (e) => {
            setVolumeFromEvent(e);
            audioManager.play('pop');
            this.saveSettings();
        });
    }

    /**
     * Set contrast mode
     */
    setContrast(mode) {
        this.settings.contrastMode = mode;

        // Remove all theme classes
        document.body.classList.remove('theme-high-contrast', 'theme-max-contrast');

        // Add appropriate class
        if (mode === 'high') {
            document.body.classList.add('theme-high-contrast');
        } else if (mode === 'max') {
            document.body.classList.add('theme-max-contrast');
        }

        // Update button states
        [this.contrastNormal, this.contrastHigh, this.contrastMax].forEach(btn => {
            btn?.classList.remove('active');
        });

        if (mode === 'normal') this.contrastNormal?.classList.add('active');
        if (mode === 'high') this.contrastHigh?.classList.add('active');
        if (mode === 'max') this.contrastMax?.classList.add('active');

        this.saveSettings();
    }

    /**
     * Set background theme
     */
    setBackground(bgName) {
        this.settings.background = bgName;

        // Remove all background classes
        if (this.natureBackground) {
            this.natureBackground.classList.remove('active', 'bg-garden', 'bg-beach', 'bg-forest', 'bg-sky');

            // Add new background if not 'none'
            if (bgName !== 'none') {
                this.natureBackground.classList.add('active', `bg-${bgName}`);
            }
        }

        // Update button states
        [this.bgNone, this.bgGarden, this.bgBeach, this.bgForest, this.bgSky].forEach(btn => {
            btn?.classList.remove('active');
        });

        if (bgName === 'none') this.bgNone?.classList.add('active');
        if (bgName === 'garden') this.bgGarden?.classList.add('active');
        if (bgName === 'beach') this.bgBeach?.classList.add('active');
        if (bgName === 'forest') this.bgForest?.classList.add('active');
        if (bgName === 'sky') this.bgSky?.classList.add('active');

        this.saveSettings();
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('gardenGrow_settings', JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Could not save settings:', e);
        }
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('gardenGrow_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };

                // Apply loaded settings
                audioManager.setEnabled(this.settings.soundEnabled);
                audioManager.setVolume(this.settings.volume);
                this.setContrast(this.settings.contrastMode);
                if (this.settings.background) {
                    this.setBackground(this.settings.background);
                }

                // Update UI
                if (this.soundToggle) {
                    const state = this.soundToggle.querySelector('.toggle-state');
                    if (state) state.textContent = this.settings.soundEnabled ? 'ON' : 'OFF';
                    this.soundToggle.classList.toggle('off', !this.settings.soundEnabled);
                }
                this.updateVolumeUI();
            }
        } catch (e) {
            console.warn('Could not load settings:', e);
        }
    }

    /**
     * Show a specific screen
     */
    showScreen(screenName) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            if (screen) {
                screen.classList.remove('active');
            }
        });

        // Show target screen
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');

            // Spawn floating particles and apply chapter theme on light screens
            if (this.screens[screenName].classList.contains('light-screen')) {
                this.applyChapterTheme();
                this.spawnParticles(this.screens[screenName]);
            }
        }

        this.currentScreen = screenName;

        // Re-collect hoverable elements when screen changes
        setTimeout(() => this.collectHoverableElements(), 100);
    }

    /**
     * Hide all screens
     */
    hideAllScreens() {
        Object.values(this.screens).forEach(screen => {
            if (screen) {
                screen.classList.remove('active');
            }
        });
        this.currentScreen = null;
    }

    /**
     * Show/hide loading overlay
     */
    setLoading(isLoading) {
        if (this.loadingOverlay) {
            if (isLoading) {
                this.loadingOverlay.classList.remove('hidden');
            } else {
                this.loadingOverlay.classList.add('hidden');
            }
        }
    }

    /**
     * Update hand detection indicators on calibration screen
     */
    updateHandIndicators(leftDetected, rightDetected) {
        if (this.leftHandIndicator) {
            if (leftDetected) {
                this.leftHandIndicator.classList.add('detected');
                this.leftHandIndicator.querySelector('.hand-status').textContent = 'Detected!';
            } else {
                this.leftHandIndicator.classList.remove('detected');
                this.leftHandIndicator.querySelector('.hand-status').textContent = 'Not detected';
            }
        }

        if (this.rightHandIndicator) {
            if (rightDetected) {
                this.rightHandIndicator.classList.add('detected');
                this.rightHandIndicator.querySelector('.hand-status').textContent = 'Detected!';
            } else {
                this.rightHandIndicator.classList.remove('detected');
                this.rightHandIndicator.querySelector('.hand-status').textContent = 'Not detected';
            }
        }
    }

    /**
     * Show challenge intro screen with countdown
     */
    showChallengeIntro(challenge, onComplete) {
        this.showScreen('challengeIntro');

        // Update level number
        if (this.levelNumber) {
            this.levelNumber.textContent = challenge.level;
        }

        // Update challenge description
        if (this.challengeDisplay) {
            this.challengeDisplay.textContent = challenge.description;
        }

        // Update color indicators
        if (this.challengeColors) {
            this.challengeColors.innerHTML = '';

            challenge.targets.forEach(target => {
                if (target.color === 'any') {
                    // Show "Any Plant" indicator
                    const div = document.createElement('div');
                    div.className = 'color-target plant-indicator';
                    div.innerHTML = `
                        <span class="plant-icon">🌱</span>
                        <span class="plant-name">ANY</span>
                        <span class="plant-count">${target.count}</span>
                    `;
                    this.challengeColors.appendChild(div);
                } else {
                    const plantInfo = PLANT_TYPES[target.color];
                    if (plantInfo) {
                        const div = document.createElement('div');
                        div.className = 'color-target plant-indicator';
                        div.innerHTML = `
                            <span class="plant-icon">${plantInfo.icon}</span>
                            <span class="plant-name" style="color: ${plantInfo.plantColor}">${plantInfo.name}</span>
                            <span class="plant-count">${target.count}</span>
                        `;
                        this.challengeColors.appendChild(div);
                    }
                }
            });
        }

        // Start countdown
        let count = 3;
        if (this.countdown) {
            this.countdown.textContent = count;
        }

        // Play countdown sound
        audioManager.play('countdown');

        this.countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                if (this.countdown) {
                    this.countdown.textContent = count;
                }
                audioManager.play('countdown');
            } else {
                clearInterval(this.countdownInterval);
                audioManager.play('gameStart');
                if (onComplete) {
                    onComplete();
                }
            }
        }, 1000);
    }

    /**
     * Show/hide game HUD
     */
    showHUD(visible) {
        if (this.hud.container) {
            if (visible) {
                this.hud.container.classList.remove('hidden');
            } else {
                this.hud.container.classList.add('hidden');
            }
        }
        // Also hide 2P HUD when showing or hiding regular HUD
        if (this.hud2P.container) {
            if (visible) {
                this.hud2P.container.classList.add('hidden');
            } else {
                this.hud2P.container.classList.add('hidden');
            }
        }
        // Move settings button below HUD when visible
        if (this.settingsBtn) {
            this.settingsBtn.classList.toggle('hud-active', visible);
        }
    }

    /**
     * Show/hide 2-player HUD
     */
    showHUD2P(visible) {
        // Hide regular HUD
        if (this.hud.container) {
            this.hud.container.classList.add('hidden');
        }
        if (this.hud2P.container) {
            if (visible) {
                this.hud2P.container.classList.remove('hidden');
            } else {
                this.hud2P.container.classList.add('hidden');
            }
        }
        // Move settings button below HUD when visible
        if (this.settingsBtn) {
            this.settingsBtn.classList.toggle('hud-active', visible);
        }
    }

    /**
     * Update HUD timer display
     */
    updateTimer(seconds) {
        if (this.hud.timer) {
            this.hud.timer.textContent = Math.ceil(seconds);

            // Flash warning when time is low
            if (seconds <= 10) {
                this.hud.timer.style.color = '#FF3B30';
                this.hud.timer.style.animation = 'pulse 0.5s ease-in-out infinite';
            } else {
                this.hud.timer.style.color = '';
                this.hud.timer.style.animation = '';
            }
        }
    }

    /**
     * Update 2P timer display
     */
    updateTimer2P(seconds) {
        if (this.hud2P.timer) {
            this.hud2P.timer.textContent = Math.ceil(seconds);
            if (seconds <= 10) {
                this.hud2P.timer.style.color = '#FF3B30';
                this.hud2P.timer.style.animation = 'pulse 0.5s ease-in-out infinite';
            } else {
                this.hud2P.timer.style.color = '';
                this.hud2P.timer.style.animation = '';
            }
        }
    }

    /**
     * Update HUD score display
     */
    updateScore(score) {
        if (this.hud.score) {
            this.hud.score.textContent = score;
        }
    }

    /**
     * Update Player 1 score
     */
    updatePlayer1Score(score) {
        if (this.hud2P.p1Score) {
            this.hud2P.p1Score.textContent = score;
        }
    }

    /**
     * Update Player 2 score
     */
    updatePlayer2Score(score) {
        if (this.hud2P.p2Score) {
            this.hud2P.p2Score.textContent = score;
        }
    }

    /**
     * Update HUD challenge text
     */
    updateChallengeText(text) {
        if (this.hud.challenge) {
            this.hud.challenge.textContent = text;
        }
    }

    /**
     * Update progress bar
     */
    updateProgress(percent, text) {
        if (this.hud.progressBar) {
            this.hud.progressBar.style.width = `${percent * 100}%`;
        }
        if (this.hud.progressText) {
            this.hud.progressText.textContent = text;
        }
    }

    /**
     * Show round end screen
     */
    showRoundEnd(result) {
        this.showScreen('roundEnd');

        // Update result title
        if (this.roundResult) {
            if (result.isComplete) {
                this.roundResult.textContent = 'Great Job!';
                this.roundResult.style.color = '#4ade80';
                audioManager.play('levelUp');
            } else {
                this.roundResult.textContent = 'Good Try!';
                this.roundResult.style.color = '#FFCC00';
                audioManager.play('success');
            }
        }

        // Update score
        if (this.finalScore) {
            this.finalScore.textContent = result.score;
        }

        // Update plants grown
        if (this.plantsGrown) {
            this.plantsGrown.textContent = result.totalPopped;
        }

        // Show/hide next level button based on completion
        if (this.nextLevelBtn) {
            this.nextLevelBtn.style.display = result.isComplete ? 'inline-flex' : 'none';
        }

        // Re-collect hoverable elements
        setTimeout(() => this.collectHoverableElements(), 100);
    }

    /**
     * Show competitive round end screen
     */
    showCompetitiveRoundEnd({ p1Score, p2Score, isComplete }) {
        this.showScreen('roundEnd2P');

        // Update scores
        if (this.ribbonP1Score) this.ribbonP1Score.textContent = p1Score;
        if (this.ribbonP2Score) this.ribbonP2Score.textContent = p2Score;

        // Determine ribbons (celebrate both)
        if (p1Score >= p2Score) {
            if (this.ribbonP1Title) this.ribbonP1Title.textContent = 'Blue Ribbon!';
            if (this.ribbonP2Title) this.ribbonP2Title.textContent = 'Red Ribbon!';
        } else {
            if (this.ribbonP1Title) this.ribbonP1Title.textContent = 'Red Ribbon!';
            if (this.ribbonP2Title) this.ribbonP2Title.textContent = 'Blue Ribbon!';
        }

        // Encouragement
        if (this.encouragementText2P) {
            this.encouragementText2P.textContent = 'Both gardens are blooming beautifully!';
        }

        // Audio
        if (isComplete) {
            audioManager.play('levelUp');
        } else {
            audioManager.play('success');
        }

        // Show/hide next level button
        if (this.nextLevelBtn2P) {
            this.nextLevelBtn2P.style.display = isComplete ? 'inline-flex' : 'none';
        }

        // Re-collect hoverable elements
        setTimeout(() => this.collectHoverableElements(), 100);
    }

    /**
     * Apply chapter-based color theme to all light screens
     */
    applyChapterTheme() {
        const chapter = typeof storyManager !== 'undefined' ? storyManager.currentChapter : 1;
        const lightScreens = document.querySelectorAll('.light-screen');
        lightScreens.forEach(screen => {
            screen.classList.remove('chapter-2', 'chapter-3');
            if (chapter === 2) screen.classList.add('chapter-2');
            if (chapter >= 3) screen.classList.add('chapter-3');
        });
    }

    /**
     * Update parallax offset on floating particles based on hand position
     */
    updateParallax(handPositions) {
        const activeScreen = Object.values(this.screens).find(
            s => s && s.classList.contains('light-screen') && s.classList.contains('active')
        );
        const container = activeScreen?.querySelector('.floating-particles');
        if (!container) return;

        if (!handPositions || handPositions.length === 0) {
            container.style.transform = '';
            return;
        }

        // Average all hand positions (normalized to -1..1 from center)
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        let avgX = 0, avgY = 0;
        for (const pos of handPositions) {
            avgX += pos.x / canvas.width;
            avgY += pos.y / canvas.height;
        }
        avgX = (avgX / handPositions.length - 0.5) * 2; // -1 to 1
        avgY = (avgY / handPositions.length - 0.5) * 2;

        // Subtle shift — max 15px in any direction
        const shiftX = avgX * -15;
        const shiftY = avgY * -10;
        container.style.transform = `translate(${shiftX}px, ${shiftY}px)`;
    }

    /**
     * Spawn floating particles in a light screen's particle container
     */
    spawnParticles(screenElement) {
        const container = screenElement?.querySelector('.floating-particles');
        if (!container || container.children.length > 0) return;

        const colors = [
            'rgba(74, 222, 128, 0.3)',   // green leaf
            'rgba(255, 200, 120, 0.25)',  // warm petal
            'rgba(255, 182, 193, 0.25)',  // pink blossom
            'rgba(144, 238, 144, 0.3)',   // light green
            'rgba(255, 223, 186, 0.2)',   // peach
        ];

        for (let i = 0; i < 8; i++) {
            const el = document.createElement('div');
            el.className = 'particle';
            const size = 10 + Math.random() * 14;
            el.style.width = `${size}px`;
            el.style.height = `${size * 0.7}px`;
            el.style.background = colors[i % colors.length];
            el.style.left = `${5 + Math.random() * 90}%`;
            el.style.animationDuration = `${10 + Math.random() * 10}s`;
            el.style.animationDelay = `${Math.random() * 8}s`;
            container.appendChild(el);
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }
}

// Global UI manager instance
const uiManager = new UIManager();
