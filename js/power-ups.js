/**
 * Garden Grow — Power-Up Classes
 * PowerUp base class + InstantGrowth, DoublePoints, RainShower subclasses.
 * All classes are exposed as globals (window.*) — no import/export.
 * Compatible with the canvas-mirrored game (CSS scaleX(-1)).
 * Text is drawn with drawUnmirroredText(); icons/shapes render normally.
 */


// ─────────────────────────────────────────────────────────────────────────────
// PowerUp — base class
// ─────────────────────────────────────────────────────────────────────────────

class PowerUp {
    /**
     * @param {number} x          - Canvas x position
     * @param {number} y          - Canvas y position
     * @param {HTMLCanvasElement} canvas - Reference to the canvas element
     */
    constructor(x, y, canvas) {
        this.x = x;
        this.y = y;
        this.canvas = canvas;

        // Identity
        this.type = 'powerup';        // Overridden by subclasses

        // Geometry
        this.radius = 35;             // Collision/draw radius

        // Lifecycle
        this.active = true;           // False when despawned or collected + effect done
        this.ttl = 10;                // Seconds before auto-disappear
        this.collected = false;       // True once a player touches it

        // Animation
        this.pulsePhase = 0;          // Drives sin-wave scale pulse

        // Effect timing (duration=0 means instant)
        this.effectDuration = 0;      // Seconds the effect lasts (0 = instant)
        this.effectTimer = 0;         // Countdown while effect is active

        // Visuals — overridden by subclasses
        this.icon = '✨';
        this.glowColor = '#FFFFFF';
        this.bgColor = 'rgba(255, 255, 255, 0.2)';
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    /**
     * Advance timers each frame.
     * @param {number} deltaTime - Seconds since last frame
     */
    update(deltaTime) {
        if (!this.active) return;

        // Pulse phase for gentle scale animation
        this.pulsePhase += deltaTime * 3;

        if (!this.collected) {
            // Countdown TTL until auto-despawn
            this.ttl -= deltaTime;
            if (this.ttl <= 0) {
                this.ttl = 0;
                this.active = false;
            }
        } else {
            // Tick down active effect (for timed power-ups)
            if (this.effectDuration > 0) {
                this.effectTimer -= deltaTime;
                if (this.effectTimer <= 0) {
                    this.effectTimer = 0;
                    this.active = false;
                }
            }
        }
    }

    /**
     * Circle collision check with a generous 1.5× multiplier so
     * dementia patients don't have to be pixel-precise.
     * @param {number} px - Point x
     * @param {number} py - Point y
     * @returns {boolean}
     */
    isPointOver(px, py) {
        const dx = px - this.x;
        const dy = py - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < this.radius * 1.5;
    }

    /**
     * Called when a player's hand touches this power-up.
     * Marks it collected and starts effectTimer for timed effects.
     */
    collect() {
        this.collected = true;
        if (this.effectDuration > 0) {
            this.effectTimer = this.effectDuration;
        }
    }

    // ── Rendering ─────────────────────────────────────────────────────────────

    /**
     * Draw the power-up: glow, filled circle, icon, TTL arc ring.
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        // Skip if already consumed or inactive
        if (this.collected || !this.active) return;

        const pulse = 1 + Math.sin(this.pulsePhase) * 0.1;
        const r = this.radius * pulse;

        ctx.save();
        ctx.translate(this.x, this.y);

        // 1. Soft glow (shadowBlur on the filled circle)
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = 20;
        ctx.fillStyle = this.bgColor;
        ctx.fill();

        // 2. Crisp outline ring
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = this.glowColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 3. Icon emoji centered in the circle
        //    drawUnmirroredText counter-mirrors the CSS scaleX(-1) canvas.
        ctx.font = `${Math.round(r * 0.9)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        drawUnmirroredText(ctx, this.icon, 0, 0);

        // 4. TTL countdown arc (like a pie-chart timer draining away)
        //    Full circle = ttl at spawn (10s), shrinks as time passes.
        //    We track fraction remaining = this.ttl / 10.
        const ttlFraction = Math.max(0, Math.min(1, this.ttl / 10));
        if (ttlFraction > 0) {
            const startAngle = -Math.PI / 2;                           // 12 o'clock
            const endAngle   = startAngle + Math.PI * 2 * ttlFraction; // clockwise fill

            ctx.beginPath();
            ctx.arc(0, 0, r + 6, startAngle, endAngle);
            ctx.strokeStyle = this.glowColor;
            ctx.lineWidth = 4;
            ctx.globalAlpha = 0.6;
            ctx.shadowColor = this.glowColor;
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }

    // ── Effect — abstract ─────────────────────────────────────────────────────

    /**
     * Apply the power-up's effect. Override in subclasses.
     * @param {GardenBed} gardenBed - The active GardenBed instance
     * @param {number}    playerId  - 1 or 2 (competitive player index)
     */
    // eslint-disable-next-line no-unused-vars
    applyEffect(gardenBed, playerId) {
        // Base class: no-op. Subclasses must override.
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// InstantGrowth — advance the player's plant directly to harvestable
// ─────────────────────────────────────────────────────────────────────────────

class InstantGrowth extends PowerUp {
    constructor(x, y, canvas) {
        super(x, y, canvas);
        this.type           = 'instantGrowth';
        this.icon           = '🌟';
        this.glowColor      = '#FFD700';
        this.bgColor        = 'rgba(255, 215, 0, 0.2)';
        this.effectDuration = 0; // Instant — no lingering timer
    }

    /**
     * Force the zone pot's plant to harvestable stage.
     * Uses gardenBed zone helpers so it works in both competitive and coop.
     * @param {GardenBed} gardenBed
     * @param {number}    playerId   - competitive zone (1 or 2); ignored in coop
     */
    applyEffect(gardenBed, playerId) {
        // Resolve zone key: competitive uses numeric player id, coop uses 'shared'
        const zoneKey = gardenBed.gameMode === 'competitive' ? playerId : 'shared';
        const pot = gardenBed.getZonePot(zoneKey);

        if (pot && pot.growthStage !== GrowthStage.EMPTY && pot.growthStage !== GrowthStage.HARVESTABLE) {
            // Advance through every stage until harvestable
            const stages = [
                GrowthStage.SEED_PLANTED,
                GrowthStage.SPROUTING,
                GrowthStage.GROWING,
                GrowthStage.MATURE,
            ];
            while (stages.includes(pot.growthStage)) {
                pot.advanceGrowthStage();
            }
        }

        // Instant effect: mark collected and deactivate immediately
        this.collect();
        this.active = false;
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// DoublePoints — 10 s double-scoring window
// ─────────────────────────────────────────────────────────────────────────────

class DoublePoints extends PowerUp {
    constructor(x, y, canvas) {
        super(x, y, canvas);
        this.type           = 'doublePoints';
        this.icon           = '⭐';
        this.glowColor      = '#E91E8C';
        this.bgColor        = 'rgba(233, 30, 140, 0.2)';
        this.effectDuration = 10; // 10 seconds of double scoring
    }

    /**
     * Start the double-points timer.
     * game.js should check `doublePointsPowerUp.isActive()` (or the active flag)
     * when scoring a harvest.
     * @param {GardenBed} _gardenBed  - Unused (effect is checked by game.js)
     * @param {number}    _playerId   - Unused (scoring is global in this implementation)
     */
    applyEffect(_gardenBed, _playerId) {
        // collect() starts effectTimer = effectDuration
        this.collect();
    }

    /**
     * Convenience: returns true while the double-scoring window is open.
     * game.js can call this after collecting to decide whether to double points.
     * @returns {boolean}
     */
    isActive() {
        return this.collected && this.active && this.effectTimer > 0;
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// RainShower — instantly fill water need for all zone plants
// ─────────────────────────────────────────────────────────────────────────────

class RainShower extends PowerUp {
    constructor(x, y, canvas) {
        super(x, y, canvas);
        this.type           = 'rainShower';
        this.icon           = '🌧️';
        this.glowColor      = '#4A90D9';
        this.bgColor        = 'rgba(74, 144, 217, 0.2)';
        this.effectDuration = 0; // Instant
    }

    /**
     * Max out water for all plants in the player's zone.
     * In coop, waters both/all pots. In competitive, only the collecting player's zone.
     * Uses gardenBed zone helpers and PlantNeeds.addWater() so display lerp applies.
     * @param {GardenBed} gardenBed
     * @param {number}    playerId  - 1 or 2 in competitive; ignored in coop
     */
    applyEffect(gardenBed, playerId) {
        if (gardenBed.gameMode === 'competitive') {
            // Only the collecting player's zone
            const needs = gardenBed.getZoneNeeds(playerId);
            if (needs) {
                needs.water = 1;
                needs.displayWater = 1;
                // Surface a nice feedback floater
                needs.feedbackEffects.push({
                    icon: '+💧', x: 0, y: 0, alpha: 1, life: 0, type: 'water'
                });
            }
        } else {
            // Coop / solo — water every zone
            for (const zoneKey of gardenBed.getZoneKeys()) {
                const needs = gardenBed.getZoneNeeds(zoneKey);
                if (needs) {
                    needs.water = 1;
                    needs.displayWater = 1;
                    needs.feedbackEffects.push({
                        icon: '+💧', x: 0, y: 0, alpha: 1, life: 0, type: 'water'
                    });
                }
            }
        }

        // Instant effect: mark collected and deactivate
        this.collect();
        this.active = false;
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// Global exports — accessible as window.PowerUp, window.InstantGrowth, etc.
// ─────────────────────────────────────────────────────────────────────────────

window.PowerUp       = PowerUp;
window.InstantGrowth = InstantGrowth;
window.DoublePoints  = DoublePoints;
window.RainShower    = RainShower;
