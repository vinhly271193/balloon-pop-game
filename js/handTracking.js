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
        // Same color for all hands - easier when playing with others
        this.handColor = { primary: '#4ECDC4', secondary: '#7EDED7' };
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
     * Draw hand indicators on canvas
     */
    drawHands(ctx) {
        if (!this.showHandIndicators || !this.lastResults) return;

        const results = this.lastResults;

        if (!results.multiHandLandmarks) return;

        // Hand landmark connections for drawing skeleton
        const fingerConnections = [
            // Thumb
            [0, 1], [1, 2], [2, 3], [3, 4],
            // Index finger
            [0, 5], [5, 6], [6, 7], [7, 8],
            // Middle finger
            [0, 9], [9, 10], [10, 11], [11, 12],
            // Ring finger
            [0, 13], [13, 14], [14, 15], [15, 16],
            // Pinky
            [0, 17], [17, 18], [18, 19], [19, 20],
            // Palm connections
            [5, 9], [9, 13], [13, 17]
        ];

        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            const colors = this.handColor;

            // Convert landmarks to canvas coordinates
            const points = landmarks.map(lm => ({
                x: lm.x * this.canvas.width,
                y: lm.y * this.canvas.height
            }));

            // Draw glow/shadow layer first
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Outer glow
            ctx.strokeStyle = `${colors.primary}40`;
            ctx.lineWidth = 20;
            this.drawHandSkeleton(ctx, points, fingerConnections);

            // Main hand outline
            ctx.strokeStyle = colors.primary;
            ctx.lineWidth = 8;
            this.drawHandSkeleton(ctx, points, fingerConnections);

            // Inner highlight
            ctx.strokeStyle = colors.secondary;
            ctx.lineWidth = 4;
            this.drawHandSkeleton(ctx, points, fingerConnections);

            // Draw joints
            const jointIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
            jointIndices.forEach(idx => {
                const point = points[idx];

                // Larger circles for fingertips and wrist
                const isFingertip = [4, 8, 12, 16, 20].includes(idx);
                const isWrist = idx === 0;
                const radius = isFingertip ? 12 : (isWrist ? 14 : 6);

                // Glow
                ctx.beginPath();
                ctx.arc(point.x, point.y, radius + 4, 0, Math.PI * 2);
                ctx.fillStyle = `${colors.primary}40`;
                ctx.fill();

                // Main joint
                ctx.beginPath();
                ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = isFingertip ? colors.secondary : colors.primary;
                ctx.fill();

                // Highlight on fingertips
                if (isFingertip) {
                    ctx.beginPath();
                    ctx.arc(point.x - 3, point.y - 3, radius * 0.4, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.fill();
                }
            });
        }
    }

    /**
     * Draw hand skeleton lines
     */
    drawHandSkeleton(ctx, points, connections) {
        ctx.beginPath();
        connections.forEach(([start, end]) => {
            ctx.moveTo(points[start].x, points[start].y);
            ctx.lineTo(points[end].x, points[end].y);
        });
        ctx.stroke();
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
