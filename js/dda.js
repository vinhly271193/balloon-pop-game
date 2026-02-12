/**
 * Dynamic Difficulty Adjustment (DDA) Engine
 * Tracks per-player performance and adjusts difficulty in real-time
 * MVP: seed speed + hit-box size per player
 */

class DDAEngine {
    constructor() {
        // Per-player metrics
        this.players = {
            1: this.createPlayerMetrics(),
            2: this.createPlayerMetrics()
        };

        // Adjustment interval
        this.adjustInterval = 5; // seconds between adjustments
        this.timeSinceLastAdjust = 0;

        // Rubber-band state (competitive only)
        this.goldenWateringCanActive = { 1: false, 2: false };
        this.goldenWateringCanTimer = { 1: 0, 2: 0 };
    }

    createPlayerMetrics() {
        return {
            // Performance tracking
            recentHarvests: [],       // timestamps of recent harvests
            totalHarvests: 0,
            targetHarvests: 0,        // on-target harvests
            nonTargetHarvests: 0,
            lastInteractionTime: 0,
            idleTime: 0,

            // Current difficulty output
            seedSpeed: 1.0,           // multiplier for need depletion rate (higher = harder)
            hitBoxMultiplier: 1.0,    // scale factor for collision radius (higher = easier)

            // Smoothing
            targetSeedSpeed: 1.0,
            targetHitBoxMultiplier: 1.0
        };
    }

    /**
     * Record a harvest for a player
     */
    recordHarvest(playerId, isTargetPlant) {
        const player = this.players[playerId];
        if (!player) return;

        const now = performance.now();
        player.recentHarvests.push(now);
        player.totalHarvests++;
        player.lastInteractionTime = now;
        player.idleTime = 0;

        if (isTargetPlant) {
            player.targetHarvests++;
        } else {
            player.nonTargetHarvests++;
        }

        // Keep only last 30 seconds of harvests
        const cutoff = now - 30000;
        player.recentHarvests = player.recentHarvests.filter(t => t > cutoff);
    }

    /**
     * Record any interaction (not just harvests)
     */
    recordInteraction(playerId) {
        const player = this.players[playerId];
        if (!player) return;

        player.lastInteractionTime = performance.now();
        player.idleTime = 0;
    }

    /**
     * Update DDA metrics and adjust difficulty
     */
    update(deltaTime, gameMode) {
        this.timeSinceLastAdjust += deltaTime;

        // Update idle times
        const now = performance.now();
        for (const id of [1, 2]) {
            const player = this.players[id];
            if (player.lastInteractionTime > 0) {
                player.idleTime = (now - player.lastInteractionTime) / 1000;
            }
        }

        // Adjust every N seconds
        if (this.timeSinceLastAdjust >= this.adjustInterval) {
            this.timeSinceLastAdjust = 0;
            this.adjustDifficulty(gameMode);
        }

        // Smooth interpolation of difficulty values
        for (const id of [1, 2]) {
            const player = this.players[id];
            const lerpSpeed = deltaTime * 0.5; // smooth over ~2 seconds
            player.seedSpeed += (player.targetSeedSpeed - player.seedSpeed) * lerpSpeed;
            player.hitBoxMultiplier += (player.targetHitBoxMultiplier - player.hitBoxMultiplier) * lerpSpeed;
        }

        // Update golden watering can timers
        for (const id of [1, 2]) {
            if (this.goldenWateringCanActive[id]) {
                this.goldenWateringCanTimer[id] -= deltaTime;
                if (this.goldenWateringCanTimer[id] <= 0) {
                    this.goldenWateringCanActive[id] = false;
                }
            }
        }
    }

    /**
     * Core difficulty adjustment logic
     */
    adjustDifficulty(gameMode) {
        for (const id of [1, 2]) {
            const player = this.players[id];

            // Calculate harvest rate (per 10 seconds)
            const now = performance.now();
            const recentCutoff = now - 10000;
            const recentCount = player.recentHarvests.filter(t => t > recentCutoff).length;
            const harvestRate = recentCount; // harvests per 10s window

            // Calculate success rate
            const totalAttempts = player.targetHarvests + player.nonTargetHarvests;
            const successRate = totalAttempts > 0 ? player.targetHarvests / totalAttempts : 0.5;

            // Determine adjustments
            let speedTarget = 1.0;
            let hitBoxTarget = 1.0;

            if (harvestRate > 4) {
                // High performer: gentle increase only for very fast players
                speedTarget = 1.0 + (harvestRate - 4) * 0.08; // up to ~1.4x
                hitBoxTarget = 1.0 - (harvestRate - 4) * 0.03; // down to ~0.85x
            } else if (harvestRate < 2) {
                // Struggling: make noticeably easier (tuned for dementia patients)
                speedTarget = 0.6;
                hitBoxTarget = 1.7; // very magnetic/forgiving
            }

            // Idle player gets easier (3s — dementia patients lose focus quickly)
            if (player.idleTime > 3) {
                speedTarget *= 0.6;
                hitBoxTarget *= 1.4;
            }

            // Clamp values (wider range on the easy side)
            speedTarget = Math.max(0.4, Math.min(1.8, speedTarget));
            hitBoxTarget = Math.max(0.8, Math.min(2.0, hitBoxTarget));

            player.targetSeedSpeed = speedTarget;
            player.targetHitBoxMultiplier = hitBoxTarget;
        }
    }

    /**
     * Check and activate rubber-band mechanic (competitive only)
     * Returns playerId of trailing player if gap > 20%, or null
     */
    checkRubberBand(player1Score, player2Score) {
        const maxScore = Math.max(player1Score, player2Score, 1);
        const gap = Math.abs(player1Score - player2Score) / maxScore;

        if (gap > 0.2) {
            const trailingPlayer = player1Score < player2Score ? 1 : 2;

            if (!this.goldenWateringCanActive[trailingPlayer]) {
                this.goldenWateringCanActive[trailingPlayer] = true;
                this.goldenWateringCanTimer[trailingPlayer] = 10; // lasts 10 seconds
                return trailingPlayer;
            }
        }

        return null;
    }

    /**
     * Get difficulty parameters for a player
     */
    getPlayerDifficulty(playerId) {
        const player = this.players[playerId];
        if (!player) return { seedSpeed: 1.0, hitBoxMultiplier: 1.0 };

        return {
            seedSpeed: player.seedSpeed,
            hitBoxMultiplier: player.hitBoxMultiplier
        };
    }

    /**
     * Check if golden watering can is active for a player
     */
    isGoldenWateringCanActive(playerId) {
        return this.goldenWateringCanActive[playerId] || false;
    }

    /**
     * Reset all metrics
     */
    reset() {
        this.players[1] = this.createPlayerMetrics();
        this.players[2] = this.createPlayerMetrics();
        this.timeSinceLastAdjust = 0;
        this.goldenWateringCanActive = { 1: false, 2: false };
        this.goldenWateringCanTimer = { 1: 0, 2: 0 };
    }
}

// Global DDA instance
const ddaEngine = new DDAEngine();
