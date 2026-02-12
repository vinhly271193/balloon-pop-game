/**
 * Audio Manager for Garden Grow Game
 * Handles all sound effects using Web Audio API
 * Sounds are gentle and therapeutic, suitable for dementia patients
 */

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.7;

        // Ambient sound state
        this.ambientNodes = [];
        this.isAmbientPlaying = false;

        // Per-player audio tracking
        this.lastPlayerSoundTime = { 1: 0, 2: 0 };
        this.harmonizeWindow = 200; // ms window for harmonized co-op sounds
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
     * Create synthesized sound effects - garden themed
     */
    async createSounds() {
        // Plant growth sound - soft rising tone with rustling
        this.sounds.plant = () => this.playPlant();

        // Harvest sound - satisfying pluck/pick
        this.sounds.harvest = () => this.playHarvest();

        // Water droplet sound
        this.sounds.water = () => this.playWater();

        // Bird song - gentle chirp
        this.sounds.birdSong = () => this.playBirdSong();

        // Wind chimes - for chapter completion
        this.sounds.windChimes = () => this.playWindChimes();

        // Success chime - pleasant completion sound (softer)
        this.sounds.success = () => this.playSuccess();

        // Level up fanfare (softer, more organic)
        this.sounds.levelUp = () => this.playLevelUp();

        // Countdown beep (softer)
        this.sounds.countdown = () => this.playCountdown();

        // Game start (gentle rising tone)
        this.sounds.gameStart = () => this.playGameStart();

        // Legacy alias for backwards compatibility
        this.sounds.pop = () => this.playPlant();
    }

    /**
     * Play plant growth sound - soft sprouting with rustling
     */
    playPlant() {
        if (!this.enabled || !this.audioContext) return;

        // Rising tone for growth
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.3);

        gain1.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain1.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.05);
        gain1.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

        osc1.connect(gain1);
        gain1.connect(this.audioContext.destination);

        osc1.start();
        osc1.stop(this.audioContext.currentTime + 0.4);

        // Rustling/shimmer layer
        const noise = this.createNoiseOscillator();
        const noiseGain = this.audioContext.createGain();
        const noiseFilter = this.audioContext.createBiquadFilter();

        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 3000;

        noiseGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        noiseGain.gain.linearRampToValueAtTime(this.volume * 0.1, this.audioContext.currentTime + 0.1);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);

        noise.start();
        noise.stop(this.audioContext.currentTime + 0.3);
    }

    /**
     * Play harvest sound - satisfying pluck
     */
    playHarvest() {
        if (!this.enabled || !this.audioContext) return;

        // Pluck sound
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
        osc1.frequency.exponentialRampToValueAtTime(261.63, this.audioContext.currentTime + 0.15);

        gain1.gain.setValueAtTime(this.volume * 0.4, this.audioContext.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        osc1.connect(gain1);
        gain1.connect(this.audioContext.destination);

        osc1.start();
        osc1.stop(this.audioContext.currentTime + 0.3);

        // Harmonic layer
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(784, this.audioContext.currentTime); // G5
        osc2.frequency.exponentialRampToValueAtTime(392, this.audioContext.currentTime + 0.1);

        gain2.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        osc2.connect(gain2);
        gain2.connect(this.audioContext.destination);

        osc2.start();
        osc2.stop(this.audioContext.currentTime + 0.2);
    }

    /**
     * Play water droplet sound
     */
    playWater() {
        if (!this.enabled || !this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 + Math.random() * 200, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);

        gain.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.15);
    }

    /**
     * Play gentle bird chirp
     */
    playBirdSong() {
        if (!this.enabled || !this.audioContext) return;

        const chirps = [
            { freq: 2000, duration: 0.1 },
            { freq: 2400, duration: 0.08 },
            { freq: 2200, duration: 0.12 }
        ];

        chirps.forEach((chirp, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            const startTime = this.audioContext.currentTime + index * 0.12;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(chirp.freq, startTime);
            osc.frequency.exponentialRampToValueAtTime(chirp.freq * 0.8, startTime + chirp.duration);

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(this.volume * 0.25, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + chirp.duration);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(startTime);
            osc.stop(startTime + chirp.duration);
        });
    }

    /**
     * Play wind chimes - for chapter completion
     */
    playWindChimes() {
        if (!this.enabled || !this.audioContext) return;

        // Pentatonic scale for pleasant sound
        const notes = [523.25, 587.33, 659.25, 783.99, 880]; // C5, D5, E5, G5, A5

        notes.forEach((freq, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            const startTime = this.audioContext.currentTime + index * 0.15;
            const duration = 1.5 - index * 0.1;

            osc.type = 'triangle';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(this.volume * 0.3, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
        });
    }

    /**
     * Play success/completion sound - softer
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
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.5);
        });
    }

    /**
     * Play level up fanfare - softer, more organic
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
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.35, startTime + 0.03);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        });
    }

    /**
     * Play countdown beep - softer
     */
    playCountdown() {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = 660; // E5 - softer than 880

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    /**
     * Play game start sound - gentle rising tone
     */
    playGameStart() {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(330, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(660, this.audioContext.currentTime + 0.3);

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, this.audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.4);
    }

    /**
     * Create white noise oscillator for rustling sounds
     */
    createNoiseOscillator() {
        const bufferSize = this.audioContext.sampleRate * 0.5;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        return noise;
    }

    /**
     * Start ambient garden sounds
     */
    playAmbient() {
        if (!this.enabled || !this.audioContext || this.isAmbientPlaying) return;

        this.isAmbientPlaying = true;

        // Gentle background hum (like wind through leaves)
        const createWindLayer = () => {
            const noise = this.createNoiseOscillator();
            const filter = this.audioContext.createBiquadFilter();
            const gain = this.audioContext.createGain();

            filter.type = 'bandpass';
            filter.frequency.value = 400;
            filter.Q.value = 2;

            gain.gain.value = this.volume * 0.05;

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.audioContext.destination);

            noise.loop = true;
            noise.start();

            return { noise, gain };
        };

        const windLayer = createWindLayer();
        this.ambientNodes.push(windLayer);

        // Occasional bird chirps
        const birdInterval = setInterval(() => {
            if (this.isAmbientPlaying && Math.random() < 0.3) {
                this.playBirdSong();
            }
        }, 8000);

        this.ambientNodes.push({ interval: birdInterval });
    }

    /**
     * Stop ambient garden sounds
     */
    stopAmbient() {
        this.isAmbientPlaying = false;

        this.ambientNodes.forEach(node => {
            if (node.noise) {
                node.gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                setTimeout(() => node.noise.stop(), 500);
            }
            if (node.interval) {
                clearInterval(node.interval);
            }
        });

        this.ambientNodes = [];
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
        if (!enabled) {
            this.stopAmbient();
        }
    }

    /**
     * Play a sound for a specific player with octave offset
     * Player 1: slightly lower (warm), Player 2: slightly higher (bright)
     */
    playForPlayer(soundName, playerId) {
        if (!this.enabled || !this.audioContext) return;

        const now = performance.now();
        const otherPlayer = playerId === 1 ? 2 : 1;

        // Check for harmonized sound (both players within window)
        if (now - this.lastPlayerSoundTime[otherPlayer] < this.harmonizeWindow) {
            this.playHarmonized(soundName);
            this.lastPlayerSoundTime[playerId] = now;
            return;
        }

        this.lastPlayerSoundTime[playerId] = now;

        // Frequency multiplier per player
        const freqMultiplier = playerId === 1 ? 0.8 : 1.25;

        // Play the sound with adjusted frequency
        this.playWithFreqShift(soundName, freqMultiplier);
    }

    /**
     * Play a sound with frequency shift
     */
    playWithFreqShift(soundName, freqMultiplier) {
        if (!this.enabled || !this.audioContext) return;

        if (soundName === 'harvest') {
            this.playHarvestShifted(freqMultiplier);
        } else if (soundName === 'plant') {
            this.playPlantShifted(freqMultiplier);
        } else if (soundName === 'water') {
            this.playWaterShifted(freqMultiplier);
        } else {
            // Fall back to normal play for other sounds
            this.play(soundName);
        }
    }

    /**
     * Play harvest sound with frequency shift
     */
    playHarvestShifted(freqMult) {
        if (!this.enabled || !this.audioContext) return;

        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(523.25 * freqMult, this.audioContext.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(261.63 * freqMult, this.audioContext.currentTime + 0.15);

        gain1.gain.setValueAtTime(this.volume * 0.4, this.audioContext.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        osc1.connect(gain1);
        gain1.connect(this.audioContext.destination);
        osc1.start();
        osc1.stop(this.audioContext.currentTime + 0.3);

        // Second harmonic for richness
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(784 * freqMult, this.audioContext.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(392 * freqMult, this.audioContext.currentTime + 0.1);

        gain2.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        osc2.connect(gain2);
        gain2.connect(this.audioContext.destination);
        osc2.start();
        osc2.stop(this.audioContext.currentTime + 0.2);
    }

    /**
     * Play plant sound with frequency shift
     */
    playPlantShifted(freqMult) {
        if (!this.enabled || !this.audioContext) return;

        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(200 * freqMult, this.audioContext.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(400 * freqMult, this.audioContext.currentTime + 0.3);

        gain1.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain1.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.05);
        gain1.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

        osc1.connect(gain1);
        gain1.connect(this.audioContext.destination);
        osc1.start();
        osc1.stop(this.audioContext.currentTime + 0.4);
    }

    /**
     * Play water sound with frequency shift
     */
    playWaterShifted(freqMult) {
        if (!this.enabled || !this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime((800 + Math.random() * 200) * freqMult, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400 * freqMult, this.audioContext.currentTime + 0.1);

        gain.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.15);
    }

    /**
     * Play harmonized chord when both players trigger simultaneously
     */
    playHarmonized(soundName) {
        if (!this.enabled || !this.audioContext) return;

        // Play a pleasant harmonized chord (major third + fifth)
        const baseFreq = soundName === 'harvest' ? 440 : 330;
        const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5]; // Root, major third, fifth

        notes.forEach((freq, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'triangle';
            osc.frequency.value = freq;

            const startTime = this.audioContext.currentTime + index * 0.03;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(this.volume * 0.3, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.6);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.start(startTime);
            osc.stop(startTime + 0.6);
        });
    }
}

// Global audio manager instance
const audioManager = new AudioManager();
