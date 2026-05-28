/**
 * Play Zone
 * Auto-calibrated active rectangle inside the camera frame.
 * Maps raw MediaPipe normalised coords (0 to 1 across the camera frame) into
 * canvas coordinates that fill the active play area.
 *
 * Calibrated once at "Wave to Start" by sampling where the player's hands sit.
 */

class PlayZone {
    constructor() {
        // Normalised raw-frame bounds (0 to 1). Defaults span the full frame
        // so the game is playable even if calibration is skipped.
        this.minX = 0;
        this.maxX = 1;
        this.minY = 0;
        this.maxY = 1;
        this.calibrated = false;
    }

    /**
     * Calibrate from a snapshot of recent wrist positions.
     * Expands the zone around the median wrist position so the player's natural
     * resting hand height becomes the centre of the play area.
     *
     * @param {Array<{x:number,y:number}>} wristSamples normalised camera coords
     */
    calibrate(wristSamples) {
        if (!wristSamples || wristSamples.length === 0) return;

        const xs = wristSamples.map(s => s.x).sort((a, b) => a - b);
        const ys = wristSamples.map(s => s.y).sort((a, b) => a - b);
        const medX = xs[Math.floor(xs.length / 2)];
        const medY = ys[Math.floor(ys.length / 2)];

        // Generous box around the median, clamped to the camera frame.
        const halfW = 0.45;
        const halfH = 0.35;
        this.minX = Math.max(0, medX - halfW);
        this.maxX = Math.min(1, medX + halfW);
        this.minY = Math.max(0, medY - halfH);
        this.maxY = Math.min(1, medY + halfH);
        this.calibrated = true;
    }

    /**
     * Map a raw normalised camera coord into canvas pixel coords.
     * The zone fills the full canvas, so a hand at the edge of the play zone
     * lands at the edge of the canvas.
     *
     * @param {number} rawX 0 to 1
     * @param {number} rawY 0 to 1
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     * @returns {{x:number, y:number}}
     */
    mapPoint(rawX, rawY, canvasWidth, canvasHeight) {
        const w = this.maxX - this.minX || 1;
        const h = this.maxY - this.minY || 1;
        const nx = (rawX - this.minX) / w;
        const ny = (rawY - this.minY) / h;
        const cx = Math.max(0, Math.min(1, nx)) * canvasWidth;
        const cy = Math.max(0, Math.min(1, ny)) * canvasHeight;
        return { x: cx, y: cy };
    }

    /**
     * Optional debug outline for the calibration screen.
     */
    draw(ctx, canvasWidth, canvasHeight) {
        if (!this.calibrated) return;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
    }
}

window.playZone = new PlayZone();
