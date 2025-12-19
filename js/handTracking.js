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
        // Cartoon glove colors - white with subtle shading
        this.gloveColor = {
            main: '#FFFFFF',
            shadow: '#E8E8E8',
            outline: '#4ECDC4',
            highlight: '#FFFFFF'
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

                // Swap handedness because video is mirrored
                // MediaPipe's "Left" = User's RIGHT hand (from their perspective)
                // MediaPipe's "Right" = User's LEFT hand (from their perspective)
                const isUserLeftHand = handedness.label === 'Right';

                if (isUserLeftHand) {
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
                    const x = point.x * this.canvas.width;
                    const y = point.y * this.canvas.height;

                    this.handPositions.push({
                        x,
                        y,
                        isLeft: isUserLeftHand,
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
     * Draw cartoon glove hands on canvas
     */
    drawHands(ctx) {
        if (!this.showHandIndicators || !this.lastResults) return;

        const results = this.lastResults;

        if (!results.multiHandLandmarks) return;

        // Scale factor - 20% smaller
        const scale = 0.8;

        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            const glove = this.gloveColor;

            // Convert landmarks to canvas coordinates
            const points = landmarks.map(lm => ({
                x: lm.x * this.canvas.width,
                y: lm.y * this.canvas.height
            }));

            // Calculate center for scaling
            const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
            const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

            // Scale points around center
            const scaledPoints = points.map(p => ({
                x: centerX + (p.x - centerX) * scale,
                y: centerY + (p.y - centerY) * scale
            }));

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Draw glove palm (puffy white shape)
            this.drawGlovePalm(ctx, scaledPoints, glove);

            // Draw glove fingers (puffy cartoon style)
            this.drawGloveFingers(ctx, scaledPoints, glove);

            // Draw fingertip circles (cartoon puff)
            this.drawGloveFingertips(ctx, scaledPoints, glove);
        }
    }

    /**
     * Draw cartoon glove palm
     */
    drawGlovePalm(ctx, points, glove) {
        // Palm points - create a puffy rounded shape
        const palmPoints = [points[0], points[5], points[9], points[13], points[17]];

        // Outer glow (teal)
        ctx.beginPath();
        ctx.moveTo(palmPoints[0].x, palmPoints[0].y);
        for (let i = 1; i < palmPoints.length; i++) {
            ctx.lineTo(palmPoints[i].x, palmPoints[i].y);
        }
        ctx.closePath();
        ctx.shadowColor = glove.outline;
        ctx.shadowBlur = 20;
        ctx.fillStyle = glove.main;
        ctx.fill();
        ctx.shadowBlur = 0;

        // White fill
        ctx.beginPath();
        ctx.moveTo(palmPoints[0].x, palmPoints[0].y);
        for (let i = 1; i < palmPoints.length; i++) {
            ctx.lineTo(palmPoints[i].x, palmPoints[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = glove.main;
        ctx.fill();

        // Teal outline
        ctx.strokeStyle = glove.outline;
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    /**
     * Draw cartoon glove fingers
     */
    drawGloveFingers(ctx, points, glove) {
        const fingers = [
            [1, 2, 3, 4],     // Thumb
            [5, 6, 7, 8],     // Index
            [9, 10, 11, 12],  // Middle
            [13, 14, 15, 16], // Ring
            [17, 18, 19, 20]  // Pinky
        ];

        fingers.forEach(finger => {
            for (let j = 0; j < finger.length - 1; j++) {
                const start = points[finger[j]];
                const end = points[finger[j + 1]];

                // Outer glow
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.strokeStyle = glove.outline;
                ctx.lineWidth = 22;
                ctx.globalAlpha = 0.3;
                ctx.stroke();
                ctx.globalAlpha = 1;

                // White glove finger (thick)
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.strokeStyle = glove.main;
                ctx.lineWidth = 18;
                ctx.stroke();

                // Teal outline
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.strokeStyle = glove.outline;
                ctx.lineWidth = 20;
                ctx.globalAlpha = 0.15;
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        });
    }

    /**
     * Draw cartoon glove fingertips
     */
    drawGloveFingertips(ctx, points, glove) {
        const fingertips = [4, 8, 12, 16, 20];

        fingertips.forEach(idx => {
            const point = points[idx];

            // Outer glow
            ctx.beginPath();
            ctx.arc(point.x, point.y, 14, 0, Math.PI * 2);
            ctx.fillStyle = glove.outline;
            ctx.globalAlpha = 0.4;
            ctx.fill();
            ctx.globalAlpha = 1;

            // White puffy circle
            ctx.beginPath();
            ctx.arc(point.x, point.y, 11, 0, Math.PI * 2);
            ctx.fillStyle = glove.main;
            ctx.fill();

            // Teal outline
            ctx.beginPath();
            ctx.arc(point.x, point.y, 11, 0, Math.PI * 2);
            ctx.strokeStyle = glove.outline;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Highlight shine
            ctx.beginPath();
            ctx.arc(point.x - 3, point.y - 3, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fill();
        });
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
