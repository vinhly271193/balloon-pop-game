/**
 * Achievement System for Garden Grow
 * Tracks 10 unlockable badges across a session and queues toast notifications.
 */

const ACHIEVEMENTS = [
    { id: 'first_harvest',     name: 'First Bloom',          icon: '🌱', description: 'Harvest your first plant' },
    { id: 'ten_harvests',      name: 'Green Thumb',           icon: '🌿', description: 'Harvest 10 plants in one session' },
    { id: 'speed_grower',      name: 'Speed Grower',          icon: '⚡', description: 'Harvest a plant in under 20 seconds' },
    { id: 'first_win',         name: 'Village Champion',      icon: '🏆', description: 'Win a competitive round' },
    { id: 'close_match',       name: 'Photo Finish',          icon: '📸', description: 'Finish within 10 points' },
    { id: 'all_plants',        name: 'Master Gardener',       icon: '👨‍🌾', description: 'Grow all 5 plant types' },
    { id: 'all_tools',         name: 'Tool Expert',           icon: '🧰', description: 'Use all 3 tools in one round' },
    { id: 'coop_magic',        name: 'Garden Friends',        icon: '🤝', description: 'Trigger the Magic Pumpkin' },
    { id: 'power_up',          name: 'Power Player',          icon: '🌟', description: 'Collect your first power-up' },
    { id: 'long_session',      name: 'Dedicated Gardener',    icon: '🌻', description: 'Play for 5 minutes' },
];

class AchievementManager {
    constructor() {
        // Achievements unlocked this browser session (persists across rounds)
        this.unlocked = new Set();

        // Tracked stats — some are session-scoped, some persist across rounds
        this.stats = {
            // Session-scoped (reset on page reload but not on round restart)
            totalHarvests: 0,           // all-time this session
            plantTypesGrown: new Set(), // all plant types grown this session
            toolsUsedThisRound: new Set(), // watering_can, fertilizer, sun — reset per round
            sessionStartTime: Date.now(),
            sessionElapsed: 0,          // seconds, incremented in updateSessionTime()
            // Round-scoped (reset per round)
            roundHarvestCount: 0,
        };

        // Queue of unlocked achievements waiting to be shown as toasts
        // Each entry: { id, name, icon, description }
        this.pendingToasts = [];
    }

    /**
     * Call at the start of each round (not each session — session stats persist).
     * Resets round-scoped stats only.
     */
    startSession() {
        this.stats.roundHarvestCount = 0;
        this.stats.toolsUsedThisRound.clear();
        this.stats.roundStartTime = Date.now();
    }

    /**
     * Record a harvest event.
     * @param {string} plantType  - key from PLANT_TYPES (e.g. 'tomato', 'sunflower')
     * @param {number} growTime   - seconds from planting to harvest (default 30)
     */
    recordHarvest(plantType, growTime) {
        const time = (typeof growTime === 'number' && isFinite(growTime)) ? growTime : 30;

        this.stats.totalHarvests++;
        this.stats.roundHarvestCount++;

        if (plantType) {
            this.stats.plantTypesGrown.add(plantType);
        }

        // Store fastest grow time seen so far
        if (!this.stats.fastestGrowTime || time < this.stats.fastestGrowTime) {
            this.stats.fastestGrowTime = time;
        }

        this.checkAll();
    }

    /**
     * Record use of a tool in the current round.
     * @param {string} toolType - 'watering_can' | 'fertilizer' | 'sun'
     */
    recordToolUse(toolType) {
        if (toolType) {
            this.stats.toolsUsedThisRound.add(toolType);
        }
        this.checkAll();
    }

    /**
     * Record the end of a competitive round.
     * @param {number} p1Score
     * @param {number} p2Score
     * @param {number} winnerId - 1 or 2
     */
    recordCompetitiveEnd(p1Score, p2Score, winnerId) {
        const diff = Math.abs(p1Score - p2Score);

        if (winnerId === 1 || winnerId === 2) {
            this.stats.hasWonCompetitive = true;
        }

        if (diff <= 10) {
            this.stats.hasCloseMatch = true;
        }

        this.checkAll();
    }

    /**
     * Record that the Magic Pumpkin was triggered in co-op mode.
     */
    recordMagicPumpkin() {
        this.stats.hasTriggeredMagicPumpkin = true;
        this.checkAll();
    }

    /**
     * Record collection of a power-up (e.g. golden watering can).
     */
    recordPowerUp() {
        this.stats.hasCollectedPowerUp = true;
        this.checkAll();
    }

    /**
     * Called every game loop frame while PLAYING.
     * Increments elapsed session time in coarse 1-second buckets to avoid
     * fractional drift, and triggers the long_session check.
     */
    updateSessionTime() {
        const now = Date.now();
        // Only count time while a round is active (roundStartTime set in startSession)
        if (this.stats.roundStartTime) {
            const elapsed = (now - this.stats.roundStartTime) / 1000;
            this.stats.currentRoundElapsed = elapsed;
        }

        const totalElapsed = (now - this.stats.sessionStartTime) / 1000;
        this.stats.sessionElapsed = totalElapsed;

        // Only re-check the time achievement (avoids full checkAll overhead every frame)
        if (!this.unlocked.has('long_session') && totalElapsed >= 300) {
            this._unlock('long_session');
        }
    }

    /**
     * Check all achievement conditions and unlock any that are newly met.
     */
    checkAll() {
        const s = this.stats;

        // first_harvest — any harvest ever this session
        if (!this.unlocked.has('first_harvest') && s.totalHarvests >= 1) {
            this._unlock('first_harvest');
        }

        // ten_harvests — 10 or more harvests this session
        if (!this.unlocked.has('ten_harvests') && s.totalHarvests >= 10) {
            this._unlock('ten_harvests');
        }

        // speed_grower — any harvest in under 20 seconds
        if (!this.unlocked.has('speed_grower') && s.fastestGrowTime < 20) {
            this._unlock('speed_grower');
        }

        // first_win — won a competitive round
        if (!this.unlocked.has('first_win') && s.hasWonCompetitive) {
            this._unlock('first_win');
        }

        // close_match — competitive round within 10 points
        if (!this.unlocked.has('close_match') && s.hasCloseMatch) {
            this._unlock('close_match');
        }

        // all_plants — grown all 5 distinct plant types (uses PLANT_TYPES keys if available)
        const requiredPlantCount = (typeof PLANT_TYPES !== 'undefined')
            ? Object.keys(PLANT_TYPES).length
            : 5;
        if (!this.unlocked.has('all_plants') && s.plantTypesGrown.size >= requiredPlantCount) {
            this._unlock('all_plants');
        }

        // all_tools — used all 3 tools in one round
        if (!this.unlocked.has('all_tools') && s.toolsUsedThisRound.size >= 3) {
            this._unlock('all_tools');
        }

        // coop_magic — triggered the Magic Pumpkin
        if (!this.unlocked.has('coop_magic') && s.hasTriggeredMagicPumpkin) {
            this._unlock('coop_magic');
        }

        // power_up — collected a power-up (golden watering can)
        if (!this.unlocked.has('power_up') && s.hasCollectedPowerUp) {
            this._unlock('power_up');
        }

        // long_session — handled in updateSessionTime() for efficiency,
        // but also checked here in case checkAll() runs after 5 minutes.
        if (!this.unlocked.has('long_session') && s.sessionElapsed >= 300) {
            this._unlock('long_session');
        }
    }

    /**
     * Return and remove the first pending toast, or null if none.
     * Called by the game loop so the UI can display one at a time.
     * @returns {{ id, name, icon, description } | null}
     */
    consumeToast() {
        return this.pendingToasts.length > 0 ? this.pendingToasts.shift() : null;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Mark an achievement as unlocked and enqueue a toast.
     * @param {string} id
     */
    _unlock(id) {
        if (this.unlocked.has(id)) return; // guard against double-unlock

        this.unlocked.add(id);

        const def = ACHIEVEMENTS.find(a => a.id === id);
        if (def) {
            this.pendingToasts.push({ id: def.id, name: def.name, icon: def.icon, description: def.description });
            console.log(`[Achievement] Unlocked: ${def.icon} ${def.name} — ${def.description}`);
        }
    }
}

// Global instance — available to game.js and any other module
window.achievementManager = new AchievementManager();
