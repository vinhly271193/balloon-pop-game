/**
 * Sun Cycle
 * Drives the round timer visually: sunrise at the start, midday in the middle,
 * sunset at the end. Plants grow faster when the sun is high.
 *
 * Replaces the old player-driven sun bar entirely. There is no top-up gesture.
 */

class SunCycle {
    constructor() {
        this.progress = 0; // 0 at sunrise, 0.5 at midday, 1 at sunset
    }

    /**
     * @param {number} roundElapsed seconds since the round started
     * @param {number} roundDuration total round length in seconds
     */
    update(roundElapsed, roundDuration) {
        if (roundDuration <= 0) {
            this.progress = 0;
            return;
        }
        this.progress = Math.max(0, Math.min(1, roundElapsed / roundDuration));
    }

    /**
     * Sun position in canvas coords. Arcs from bottom-left at sunrise,
     * through top-centre at midday, to bottom-right at sunset.
     *
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     * @returns {{x:number, y:number, radius:number}}
     */
    getSunPosition(canvasWidth, canvasHeight) {
        const t = this.progress;
        const x = canvasWidth * t;
        const y = canvasHeight * 0.7 - Math.sin(t * Math.PI) * canvasHeight * 0.55;
        const radius = 60 + Math.sin(t * Math.PI) * 10;
        return { x, y, radius };
    }

    /**
     * Sky gradient: warm peach at dawn and dusk, soft blue at midday.
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     * @returns {CanvasGradient}
     */
    getSkyGradient(ctx, canvasWidth, canvasHeight) {
        const t = this.progress;
        // Distance from midday (0 = midday, 1 = dawn or dusk)
        const dist = Math.abs(t - 0.5) * 2;

        const top = this._mixColour([135, 206, 235], [255, 183, 119], dist); // sky blue to warm peach
        const bot = this._mixColour([224, 247, 250], [255, 215, 175], dist); // soft cyan to soft peach

        const g = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        g.addColorStop(0, `rgb(${top[0]}, ${top[1]}, ${top[2]})`);
        g.addColorStop(1, `rgb(${bot[0]}, ${bot[1]}, ${bot[2]})`);
        return g;
    }

    /**
     * Plants grow at 0.5x at dawn and dusk, 1.5x at midday.
     * @returns {number}
     */
    getGrowthMultiplier() {
        return 0.5 + Math.sin(this.progress * Math.PI) * 1.0;
    }

    _mixColour(a, b, t) {
        return [
            Math.round(a[0] + (b[0] - a[0]) * t),
            Math.round(a[1] + (b[1] - a[1]) * t),
            Math.round(a[2] + (b[2] - a[2]) * t),
        ];
    }
}

window.sunCycle = new SunCycle();
