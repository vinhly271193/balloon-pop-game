/**
 * UI Manager for Balloon Pop Game
 * Handles all screen transitions, UI updates, and hand hover interactions
 */

class UIManager {
    constructor() {
        // Screen elements
        this.screens = {
            welcome: document.getElementById('welcomeScreen'),
            calibration: document.getElementById('calibrationScreen'),
            challengeIntro: document.getElementById('challengeIntroScreen'),
            roundEnd: document.getElementById('roundEndScreen')
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
        this.balloonsPopped = document.getElementById('balloonsPopped');

        // Buttons
        this.startBtn = document.getElementById('startBtn');
        this.nextLevelBtn = document.getElementById('nextLevelBtn');
        this.playAgainBtn = document.getElementById('playAgainBtn');

        // Settings elements
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsOverlay = document.getElementById('settingsOverlay');
        this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
        this.soundToggle = document.getElementById('soundToggle');
        this.volumeDown = document.getElementById('volumeDown');
        this.volumeUp = document.getElementById('volumeUp');
        this.volumeFill = document.getElementById('volumeFill');
        this.contrastNormal = document.getElementById('contrastNormal');
        this.contrastHigh = document.getElementById('contrastHigh');
        this.contrastMax = document.getElementById('contrastMax');

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
            background: 'none'
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

        // Settings button click
        this.settingsBtn?.addEventListener('click', () => this.openSettings());
        this.closeSettingsBtn?.addEventListener('click', () => this.closeSettings());

        // Settings controls
        this.soundToggle?.addEventListener('click', () => this.toggleSound());
        this.volumeDown?.addEventListener('click', () => this.adjustVolume(-0.1));
        this.volumeUp?.addEventListener('click', () => this.adjustVolume(0.1));
        this.contrastNormal?.addEventListener('click', () => this.setContrast('normal'));
        this.contrastHigh?.addEventListener('click', () => this.setContrast('high'));
        this.contrastMax?.addEventListener('click', () => this.setContrast('max'));

        // Background controls
        this.bgNone?.addEventListener('click', () => this.setBackground('none'));
        this.bgGarden?.addEventListener('click', () => this.setBackground('garden'));
        this.bgBeach?.addEventListener('click', () => this.setBackground('beach'));
        this.bgForest?.addEventListener('click', () => this.setBackground('forest'));
        this.bgSky?.addEventListener('click', () => this.setBackground('sky'));

        // Collect all hoverable elements
        this.collectHoverableElements();

        // Load saved settings
        this.loadSettings();
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
            return;
        }

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
        // Update progress bar
        const progressBar = element.querySelector('.hover-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
        }

        // Update circular progress (for settings button)
        const progressFill = element.querySelector('.hover-progress-fill');
        if (progressFill) {
            const circumference = 283; // 2 * PI * 45
            const offset = circumference * (1 - progress);
            progressFill.style.strokeDashoffset = offset;
        }
    }

    /**
     * Clear hover state
     */
    clearHover() {
        if (this.hoverState.currentElement) {
            this.hoverState.currentElement.classList.remove('hand-hovering');
            this.updateHoverProgress(this.hoverState.currentElement, 0);
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

        if (this.volumeFill) {
            this.volumeFill.style.width = `${this.settings.volume * 100}%`;
        }

        // Play a pop sound to demonstrate volume
        audioManager.play('pop');

        this.saveSettings();
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
            localStorage.setItem('balloonPop_settings', JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Could not save settings:', e);
        }
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('balloonPop_settings');
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
                if (this.volumeFill) {
                    this.volumeFill.style.width = `${this.settings.volume * 100}%`;
                }
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
                    // Show "Any Color" indicator
                    const div = document.createElement('div');
                    div.className = 'color-target';
                    div.innerHTML = `
                        <div class="color-circle" style="background: linear-gradient(135deg, #FF3B30, #007AFF, #34C759)"></div>
                        <span class="color-name">ANY</span>
                        <span class="color-count">${target.count}</span>
                    `;
                    this.challengeColors.appendChild(div);
                } else {
                    const colorInfo = BALLOON_COLORS[target.color];
                    const div = document.createElement('div');
                    div.className = 'color-target';
                    div.innerHTML = `
                        <div class="color-circle" style="background: ${colorInfo.primary}"></div>
                        <span class="color-name" style="color: ${colorInfo.primary}">${colorInfo.name}</span>
                        <span class="color-count">${target.count}</span>
                    `;
                    this.challengeColors.appendChild(div);
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
     * Update HUD score display
     */
    updateScore(score) {
        if (this.hud.score) {
            this.hud.score.textContent = score;
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

        // Update balloons popped
        if (this.balloonsPopped) {
            this.balloonsPopped.textContent = result.totalPopped;
        }

        // Show/hide next level button based on completion
        if (this.nextLevelBtn) {
            this.nextLevelBtn.style.display = result.isComplete ? 'inline-flex' : 'none';
        }

        // Re-collect hoverable elements
        setTimeout(() => this.collectHoverableElements(), 100);
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
