/**
 * Audio Manager for Balloon Pop Game
 * Handles all sound effects using Web Audio API
 */

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.7;
    }

    /**
     * Initialize the audio context (must be called after user interaction)
     */
    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            await this.createSounds();
            console.log('Audio initialized successfully');
        } catch (error) {
            console.warn('Audio initialization failed:', error);
            this.enabled = false;
        }
    }

    /**
     * Create synthesized sound effects
     */
    async createSounds() {
        // Pop sound - satisfying burst
        this.sounds.pop = () => this.playPop();

        // Success chime - pleasant completion sound
        this.sounds.success = () => this.playSuccess();

        // Level up fanfare
        this.sounds.levelUp = () => this.playLevelUp();

        // Countdown beep
        this.sounds.countdown = () => this.playCountdown();

        // Game start
        this.sounds.gameStart = () => this.playGameStart();
    }

    /**
     * Play a pop sound with slight variation
     */
    playPop() {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // Random pitch variation for variety
        const baseFreq = 300 + Math.random() * 200;

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(this.volume * 0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.15);

        // Add a second layer for richness
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(baseFreq * 1.5, this.audioContext.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.08);

        gain2.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        osc2.connect(gain2);
        gain2.connect(this.audioContext.destination);

        osc2.start();
        osc2.stop(this.audioContext.currentTime + 0.1);
    }

    /**
     * Play success/completion sound
     */
    playSuccess() {
        if (!this.enabled || !this.audioContext) return;

        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (major chord)

        notes.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.value = freq;

            const startTime = this.audioContext.currentTime + index * 0.1;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.5);
        });
    }

    /**
     * Play level up fanfare
     */
    playLevelUp() {
        if (!this.enabled || !this.audioContext) return;

        const notes = [392, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6

        notes.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.type = index === notes.length - 1 ? 'triangle' : 'sine';
            oscillator.frequency.value = freq;

            const startTime = this.audioContext.currentTime + index * 0.12;
            const duration = index === notes.length - 1 ? 0.8 : 0.3;

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.5, startTime + 0.03);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        });
    }

    /**
     * Play countdown beep
     */
    playCountdown() {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = 880; // A5

        gainNode.gain.setValueAtTime(this.volume * 0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }

    /**
     * Play game start sound
     */
    playGameStart() {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.2);

        gainNode.gain.setValueAtTime(this.volume * 0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    /**
     * Play a sound by name
     */
    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }

    /**
     * Resume audio context (needed for some browsers)
     */
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * Set master volume
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
    }

    /**
     * Enable/disable audio
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

// Global audio manager instance
const audioManager = new AudioManager();
