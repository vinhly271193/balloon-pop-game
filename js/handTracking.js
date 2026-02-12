/**
 * Hand Tracking Module for Garden Grow Game
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

        // Cartoon glove colors - green garden glove (1P mode)
        this.gloveColor = {
            main: '#F0FFF0',
            shadow: '#C8E6C8',
            outline: '#2E8B57',
            highlight: '#FFFFFF'
        };

        // Player configuration
        this.playerCount = 1; // 1 or 2
        this.dividerX = 0.5; // Normalized 0-1, divides left/right zones in 2P mode
    }

    /**
     * Set player count (1 or 2)
     */
    setPlayerCount(count) {
        this.playerCount = count;
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

            // Configure hand tracking with Phase 9 optimizations
            this.hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 0, // Lower complexity for performance
                minDetectionConfidence: 0.5, // Lower threshold for performance
                minTrackingConfidence: 0.3 // Lower threshold for performance
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
            // Request camera access with Phase 9 optimized resolution
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 }, // Lower resolution for performance
                    height: { ideal: 480 }, // Lower resolution for performance
                    facingMode: 'user'
                }
            });

            this.videoElement.srcObject = stream;
            await this.videoElement.play();

            // Set up camera feed to MediaPipe with optimized resolution
            this.camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    if (this.isRunning) {
                        await this.hands.send({ image: this.videoElement });
                    }
                },
                width: 640, // Lower resolution for performance
                height: 480 // Lower resolution for performance
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

        // Release camera hardware — stop all tracks on the video stream
        if (this.videoElement && this.videoElement.srcObject) {
            this.videoElement.srcObject.getTracks().forEach(track => track.stop());
            this.videoElement.srcObject = null;
        }

        // Clear stale data so drawHands() doesn't render old positions
        this.lastResults = null;
        this.handPositions = [];
        this.leftHandDetected = false;
        this.rightHandDetected = false;
    }

    /**
     * Process hand detection results
     */
    onResults(results) {
      try {
        this.lastResults = results;
        this.handPositions = [];
        this.leftHandDetected = false;
        this.rightHandDetected = false;

        if (results.multiHandLandmarks && results.multiHandedness) {
            // For 2-player mode, sort hands by x-position to assign players
            let handData = [];

            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const landmarks = results.multiHandLandmarks[i];
                const handedness = results.multiHandedness[i];
                const wristX = landmarks[0].x; // Wrist x-position

                handData.push({
                    landmarks,
                    handedness,
                    wristX,
                    index: i
                });
            }

            // Sort by x-position (left to right in camera frame)
            handData.sort((a, b) => a.wristX - b.wristX);

            // Process each hand
            for (let i = 0; i < handData.length; i++) {
                const { landmarks, handedness } = handData[i];

                // Swap handedness because video is mirrored
                // MediaPipe's "Left" = User's RIGHT hand (from their perspective)
                // MediaPipe's "Right" = User's LEFT hand (from their perspective)
                const isUserLeftHand = handedness.label === 'Right';

                if (isUserLeftHand) {
                    this.leftHandDetected = true;
                } else {
                    this.rightHandDetected = true;
                }

                // Determine player ID based on mode and position
                let playerId = 1; // Default to Player 1
                if (this.playerCount === 2) {
                    // Leftmost hand in camera → Player 1 (RIGHT side of mirrored screen)
                    // Rightmost hand in camera → Player 2 (LEFT side of mirrored screen)
                    playerId = (i === 0) ? 1 : 2;
                }

                // Extract key points for collision detection
                // Using palm center (landmark 9) and fingertips (4, 8, 12, 16, 20)
                const collisionPoints = [
                    { point: landmarks[9],  landmarkIndex: 9 },  // Palm center
                    { point: landmarks[4],  landmarkIndex: 4 },  // Thumb tip
                    { point: landmarks[8],  landmarkIndex: 8 },  // Index tip
                    { point: landmarks[12], landmarkIndex: 12 }, // Middle tip
                    { point: landmarks[16], landmarkIndex: 16 }, // Ring tip
                    { point: landmarks[20], landmarkIndex: 20 }  // Pinky tip
                ];

                collisionPoints.forEach(({ point, landmarkIndex }) => {
                    // Convert normalized coordinates to canvas coordinates
                    const x = point.x * this.canvas.width;
                    const y = point.y * this.canvas.height;

                    this.handPositions.push({
                        x,
                        y,
                        isLeft: isUserLeftHand,
                        landmark: point,
                        landmarkIndex,
                        playerId // Add player ID to collision points
                    });
                });
            }

            // Calculate divider position for 2-player calibration
            if (this.playerCount === 2 && handData.length === 2) {
                // Midpoint between both players' wrists
                const player1WristX = handData[0].wristX;
                const player2WristX = handData[1].wristX;
                this.dividerX = (player1WristX + player2WristX) / 2;
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
      } catch (error) {
        console.error('Hand tracking onResults error:', error);
      }
    }

    /**
     * Draw cartoon glove hands on canvas
     */
    drawHands(ctx) {
        if (!this.showHandIndicators || !this.lastResults) return;

        const results = this.lastResults;

        if (!results.multiHandLandmarks) return;

        // Sort hands by x-position for consistent player assignment
        let handData = [];
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            const wristX = landmarks[0].x;
            handData.push({ landmarks, wristX, index: i });
        }
        handData.sort((a, b) => a.wristX - b.wristX);

        for (let i = 0; i < handData.length; i++) {
            const { landmarks } = handData[i];

            // Determine glove color based on player
            let glove;
            if (this.playerCount === 1) {
                glove = this.gloveColor;
            } else {
                if (i === 0) {
                    glove = { main: '#FFF5E6', shadow: '#F0D9B5', outline: '#FF8C42', highlight: '#FFFFFF' };
                } else {
                    glove = { main: '#E6F0FF', shadow: '#B5C9E6', outline: '#4A90D9', highlight: '#FFFFFF' };
                }
            }

            // Convert landmarks to canvas coordinates
            const points = landmarks.map(lm => ({
                x: lm.x * this.canvas.width,
                y: lm.y * this.canvas.height
            }));

            // Scale 20% smaller around center
            const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
            const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
            const scale = 0.8;
            const sp = points.map(p => ({
                x: centerX + (p.x - centerX) * scale,
                y: centerY + (p.y - centerY) * scale
            }));

            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Draw order: palm shadow → palm → fingers → fingertips → wrist cuff
            this.drawCartoonPalm(ctx, sp, glove);
            this.drawCartoonFingers(ctx, sp, glove);
            this.drawCartoonFingertips(ctx, sp, glove);
            this.drawWristCuff(ctx, sp, glove);

            ctx.restore();
        }
    }

    /**
     * Draw filled cartoon palm — smooth rounded blob
     */
    drawCartoonPalm(ctx, p, glove) {
        // Build a smooth palm shape using finger bases and wrist
        // Points: 0=wrist, 1=thumb_cmc, 5=index_mcp, 9=middle_mcp, 13=ring_mcp, 17=pinky_mcp
        const palmAnchors = [p[0], p[1], p[5], p[9], p[13], p[17]];

        // Soft shadow under palm
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        this._fillSmoothShape(ctx, palmAnchors, glove.main);
        ctx.restore();

        // Filled palm
        this._fillSmoothShape(ctx, palmAnchors, glove.main);

        // Colored outline
        this._strokeSmoothShape(ctx, palmAnchors, glove.outline, 3);
    }

    /**
     * Draw filled cartoon fingers — thick rounded capsules
     */
    drawCartoonFingers(ctx, p, glove) {
        const fingers = [
            { joints: [1, 2, 3, 4],     width: 16 }, // Thumb (wider)
            { joints: [5, 6, 7, 8],     width: 14 }, // Index
            { joints: [9, 10, 11, 12],  width: 14 }, // Middle
            { joints: [13, 14, 15, 16], width: 13 }, // Ring
            { joints: [17, 18, 19, 20], width: 12 }  // Pinky (narrower)
        ];

        fingers.forEach(finger => {
            const pts = finger.joints.map(j => p[j]);
            const w = finger.width;

            // Build a filled capsule path along the finger joints
            ctx.save();

            // Soft shadow
            ctx.shadowColor = 'rgba(0,0,0,0.1)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetY = 2;

            // Fill: draw thick rounded line segments
            for (let j = 0; j < pts.length - 1; j++) {
                const a = pts[j];
                const b = pts[j + 1];
                // Taper toward tip
                const segWidth = w - (j * 1.5);

                // White/colored fill
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = glove.main;
                ctx.lineWidth = segWidth * 2;
                ctx.stroke();
            }

            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            // Outline
            for (let j = 0; j < pts.length - 1; j++) {
                const a = pts[j];
                const b = pts[j + 1];
                const segWidth = w - (j * 1.5);

                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = glove.outline;
                ctx.lineWidth = segWidth * 2 + 3;
                ctx.globalAlpha = 0.5;
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            ctx.restore();
        });
    }

    /**
     * Draw cartoon puffy fingertips with shine highlights
     */
    drawCartoonFingertips(ctx, p, glove) {
        const tips = [
            { idx: 4,  r: 12 }, // Thumb
            { idx: 8,  r: 11 }, // Index
            { idx: 12, r: 11 }, // Middle
            { idx: 16, r: 10 }, // Ring
            { idx: 20, r: 9 }   // Pinky
        ];

        tips.forEach(({ idx, r }) => {
            const pt = p[idx];

            // Colored glow behind
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, r + 4, 0, Math.PI * 2);
            ctx.fillStyle = glove.outline;
            ctx.globalAlpha = 0.4;
            ctx.fill();
            ctx.globalAlpha = 1;

            // Main filled circle
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
            ctx.fillStyle = glove.main;
            ctx.fill();

            // Outline
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
            ctx.strokeStyle = glove.outline;
            ctx.lineWidth = 2.5;
            ctx.globalAlpha = 0.7;
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Shine highlight (top-left)
            ctx.beginPath();
            ctx.arc(pt.x - r * 0.25, pt.y - r * 0.3, r * 0.35, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fill();
        });
    }

    /**
     * Draw a cute wrist cuff at the base of the glove
     */
    drawWristCuff(ctx, p, glove) {
        const wrist = p[0];
        const thumbBase = p[1];
        const pinkyBase = p[17];

        // Cuff is a rounded rectangle area around the wrist
        const cuffWidth = Math.sqrt(
            Math.pow(thumbBase.x - pinkyBase.x, 2) +
            Math.pow(thumbBase.y - pinkyBase.y, 2)
        ) * 0.8;

        const angle = Math.atan2(
            pinkyBase.y - thumbBase.y,
            pinkyBase.x - thumbBase.x
        );

        ctx.save();
        ctx.translate(wrist.x, wrist.y);
        ctx.rotate(angle);

        // Cuff band
        const cuffH = 10;
        ctx.beginPath();
        ctx.roundRect(-cuffWidth / 2, -cuffH / 2, cuffWidth, cuffH, 5);
        ctx.fillStyle = glove.outline;
        ctx.globalAlpha = 0.5;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Cuff highlight
        ctx.beginPath();
        ctx.roundRect(-cuffWidth / 2 + 4, -cuffH / 2 + 2, cuffWidth - 8, cuffH * 0.4, 3);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();

        ctx.restore();
    }

    /**
     * Helper: fill a smooth closed shape through anchor points using quadratic curves
     */
    _fillSmoothShape(ctx, anchors, color) {
        if (anchors.length < 3) return;
        ctx.beginPath();
        ctx.moveTo(
            (anchors[0].x + anchors[1].x) / 2,
            (anchors[0].y + anchors[1].y) / 2
        );
        for (let i = 1; i < anchors.length; i++) {
            const next = anchors[(i + 1) % anchors.length];
            const midX = (anchors[i].x + next.x) / 2;
            const midY = (anchors[i].y + next.y) / 2;
            ctx.quadraticCurveTo(anchors[i].x, anchors[i].y, midX, midY);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    /**
     * Helper: stroke a smooth closed shape through anchor points
     */
    _strokeSmoothShape(ctx, anchors, color, width) {
        if (anchors.length < 3) return;
        ctx.beginPath();
        ctx.moveTo(
            (anchors[0].x + anchors[1].x) / 2,
            (anchors[0].y + anchors[1].y) / 2
        );
        for (let i = 1; i < anchors.length; i++) {
            const next = anchors[(i + 1) % anchors.length];
            const midX = (anchors[i].x + next.x) / 2;
            const midY = (anchors[i].y + next.y) / 2;
            ctx.quadraticCurveTo(anchors[i].x, anchors[i].y, midX, midY);
        }
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
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
