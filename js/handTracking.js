/**
 * Hand Tracking Module for Balloon Pop Game
 * Uses MediaPipe Hands for real-time hand detection
 */

class HandTracker {
    constructor() {
        this.hands = null;
        this.camera = null;
        this.videoElement = null;
        this.canvas = null;
        this.ctx = null;

        // Tracking state
        this.isInitialized = false;
        this.isRunning = false;
        this.lastResults = null;

        // Hand positions (for collision detection)
        this.handPositions = [];

        // Callbacks
        this.onHandsDetected = null;
        this.onInitialized = null;

        // Detection state
        this.leftHandDetected = false;
        this.rightHandDetected = false;

        // Visual feedback settings
        this.showHandIndicators = true;
        this.handIndicatorSize = 40;
        this.handColors = {
            left: { primary: '#FF6B6B', secondary: '#FF8E8E' },
            right: { primary: '#4ECDC4', secondary: '#7EDED7' }
        };
    }

    /**
     * Initialize MediaPipe Hands
     */
    async init(videoElement, canvas) {
        this.videoElement = videoElement;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        try {
            // Create MediaPipe Hands instance
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });

            // Configure hand tracking
            this.hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.5
            });

            // Set up results callback
            this.hands.onResults((results) => this.onResults(results));

            this.isInitialized = true;
            console.log('Hand tracking initialized');

            if (this.onInitialized) {
                this.onInitialized();
            }

            return true;
        } catch (error) {
            console.error('Failed to initialize hand tracking:', error);
            return false;
        }
    }

    /**
     * Start the camera and hand tracking
     */
    async start() {
        if (!this.isInitialized) {
            console.error('Hand tracker not initialized');
            return false;
        }

        try {
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });

            this.videoElement.srcObject = stream;
            await this.videoElement.play();

            // Set up camera feed to MediaPipe
            this.camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    if (this.isRunning) {
                        await this.hands.send({ image: this.videoElement });
                    }
                },
                width: 1280,
                height: 720
            });

            await this.camera.start();
            this.isRunning = true;

            console.log('Camera started');
            return true;
        } catch (error) {
            console.error('Failed to start camera:', error);
            return false;
        }
    }

    /**
     * Stop tracking
     */
    stop() {
        this.isRunning = false;
        if (this.camera) {
            this.camera.stop();
        }
    }

    /**
     * Process hand detection results
     */
    onResults(results) {
        this.lastResults = results;
        this.handPositions = [];
        this.leftHandDetected = false;
        this.rightHandDetected = false;

        if (results.multiHandLandmarks && results.multiHandedness) {
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const landmarks = results.multiHandLandmarks[i];
                const handedness = results.multiHandedness[i];

                // Note: handedness is mirrored (Left in results = Right hand in reality)
                // Since we mirror the video, we keep the labels as-is for display
                const isLeft = handedness.label === 'Left';

                if (isLeft) {
                    this.leftHandDetected = true;
                } else {
                    this.rightHandDetected = true;
                }

                // Extract key points for collision detection
                // Using palm center (landmark 9) and fingertips (4, 8, 12, 16, 20)
                const collisionPoints = [
                    landmarks[9],  // Palm center
                    landmarks[4],  // Thumb tip
                    landmarks[8],  // Index tip
                    landmarks[12], // Middle tip
                    landmarks[16], // Ring tip
                    landmarks[20]  // Pinky tip
                ];

                collisionPoints.forEach(point => {
                    // Convert normalized coordinates to canvas coordinates
                    // Note: We mirror X because video is mirrored
                    const x = point.x * this.canvas.width;
                    const y = point.y * this.canvas.height;

                    this.handPositions.push({
                        x,
                        y,
                        isLeft,
                        landmark: point
                    });
                });
            }
        }

        // Notify callback
        if (this.onHandsDetected) {
            this.onHandsDetected({
                leftDetected: this.leftHandDetected,
                rightDetected: this.rightHandDetected,
                positions: this.handPositions
            });
        }
    }

    /**
     * Draw hand indicators on canvas
     */
    drawHands(ctx) {
        if (!this.showHandIndicators || !this.lastResults) return;

        const results = this.lastResults;

        if (!results.multiHandLandmarks) return;

        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            const handedness = results.multiHandedness[i];
            const isLeft = handedness.label === 'Left';
            const colors = isLeft ? this.handColors.left : this.handColors.right;

            // Draw indicator at palm center (landmark 9)
            const palm = landmarks[9];
            const palmX = palm.x * this.canvas.width;
            const palmY = palm.y * this.canvas.height;

            // Outer glow
            ctx.beginPath();
            ctx.arc(palmX, palmY, this.handIndicatorSize + 10, 0, Math.PI * 2);
            ctx.fillStyle = `${colors.primary}33`;
            ctx.fill();

            // Main circle
            ctx.beginPath();
            ctx.arc(palmX, palmY, this.handIndicatorSize, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(
                palmX - 10, palmY - 10, 0,
                palmX, palmY, this.handIndicatorSize
            );
            gradient.addColorStop(0, colors.secondary);
            gradient.addColorStop(1, colors.primary);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Inner highlight
            ctx.beginPath();
            ctx.arc(palmX - 10, palmY - 10, this.handIndicatorSize * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fill();

            // Draw fingertip indicators (smaller)
            const fingertips = [4, 8, 12, 16, 20];
            fingertips.forEach(idx => {
                const tip = landmarks[idx];
                const tipX = tip.x * this.canvas.width;
                const tipY = tip.y * this.canvas.height;

                ctx.beginPath();
                ctx.arc(tipX, tipY, 15, 0, Math.PI * 2);
                ctx.fillStyle = `${colors.primary}88`;
                ctx.fill();
            });
        }
    }

    /**
     * Get collision points for the game
     */
    getCollisionPoints() {
        return this.handPositions;
    }

    /**
     * Check if any hand is detected
     */
    hasHandsDetected() {
        return this.leftHandDetected || this.rightHandDetected;
    }

    /**
     * Get detection status
     */
    getDetectionStatus() {
        return {
            left: this.leftHandDetected,
            right: this.rightHandDetected
        };
    }

    /**
     * Detect wave gesture (for starting game)
     */
    detectWaveGesture() {
        if (!this.lastResults || !this.lastResults.multiHandLandmarks) {
            return false;
        }

        // Simple wave detection: check if hands are visible and moving
        // For accessibility, we just check if hands are detected
        return this.hasHandsDetected();
    }

    /**
     * Set hand indicator visibility
     */
    setIndicatorVisibility(visible) {
        this.showHandIndicators = visible;
    }

    /**
     * Set hand indicator size
     */
    setIndicatorSize(size) {
        this.handIndicatorSize = size;
    }
}

// Global hand tracker instance
const handTracker = new HandTracker();
