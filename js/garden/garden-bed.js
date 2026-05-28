/**
 * Garden System - Garden Bed
 * Main Garden manager that coordinates all garden elements.
 * State fields are held on gardenState; this class delegates reads and writes.
 */

class GardenBed {
    constructor(canvas) {
        this.canvas = canvas;

        // Cached deltaTime for use in collision handlers (which don't receive deltaTime)
        this.lastDeltaTime = 0.016;

        // Available seeds rotation index
        this.currentSeedIndex = 0;

        // Magic pumpkin (co-op only)
        this.magicPumpkin = null;
        this.pumpkinActivated = false;
        this.pumpkinSpawnTimer = 0;
        this.pumpkinSpawnInterval = 35;

        // Power-ups (competitive mode - DDA-driven spawning)
        // dda.js reads these directly so they stay on this.
        this.activePowerUps = new Map();
        this.powerUpCooldown = 0;

        // DDA modifiers per player
        this.ddaModifiers = new Map();
        this.ddaModifiers.set(1, { seedSpeed: 1, hitBoxMultiplier: 1 });
        this.ddaModifiers.set(2, { seedSpeed: 1, hitBoxMultiplier: 1 });

        // Confetti particles
        this.confettiParticles = [];

        // Timer pause state
        this.timerPaused = false;
        this.timerPauseDuration = 0;

        // Hint arrow system
        this.hintArrows = new Map();
        this.hintArrows.set('shared', new HintArrow());
        this.hintArrows.set('p1', new HintArrow());
        this.hintArrows.set('p2', new HintArrow());
        this.hintIdleThreshold = 5;
        this.hintPlayerIdleTime = new Map();

        // Return-to-home drop beacon animation timer
        this.returnBeaconPulse = 0;

        // Default single player setup (configure() overwrites this before first round)
        gardenState.setMode('coop', 1);
        this._setupCoopZone(1);
    }

    // ── Proxy accessors for mode state ──────────────────────────────

    get gameMode()       { return gardenState.mode; }
    set gameMode(v)      { gardenState.mode = v; }
    get playerCount()    { return gardenState.playerCount; }
    set playerCount(v)   { gardenState.playerCount = v; }
    get dividerX()       { return gardenState.dividerX; }
    set dividerX(v)      { gardenState.dividerX = v; }
    get roundGeneration(){ return gardenState.roundGeneration; }

    // ── Zone abstraction helpers ──────────────────────────────────

    /** Returns zone keys for the current game mode */
    getZoneKeys() {
        return gardenState.mode === 'competitive' ? ['p1', 'p2'] : ['shared'];
    }

    /** Get plant needs for a zone */
    getZoneNeeds(zoneKey) {
        const zone = gardenState.getZone(zoneKey);
        return zone ? zone.needs : null;
    }

    /** Get plant pot for a zone */
    getZonePot(zoneKey) {
        if (gardenState.mode === 'competitive') {
            const zone = gardenState.getZone(zoneKey);
            return zone ? zone.pots[0] : null;
        }
        const zone = gardenState.getZone('shared');
        return zone ? zone.pots[0] : null;
    }

    /** Get seed for a zone */
    getZoneSeed(zoneKey) {
        const zone = gardenState.getZone(zoneKey);
        return zone ? zone.tools.seed : null;
    }

    /** Get watering can for a zone */
    getZoneWateringCan(zoneKey) {
        const zone = gardenState.getZone(zoneKey);
        return zone ? zone.tools.wateringCan : null;
    }

    /** Get fertilizer bag for a zone */
    getZoneFertilizer(zoneKey) {
        const zone = gardenState.getZone(zoneKey);
        return zone ? zone.tools.fertilizerBag : null;
    }

    /** Get sun area for a zone */
    getZoneSunArea(zoneKey) {
        const zone = gardenState.getZone(zoneKey);
        return zone ? zone.tools.sunArea : null;
    }

    // ── Internal zone setup helpers ───────────────────────────────

    /**
     * Set up the 'shared' zone used by coop and solo modes.
     * @param {number} playerCount
     */
    _setupCoopZone(playerCount) {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        const potCount = playerCount === 2 ? 2 : 3;
        const spacing = canvasWidth / (potCount + 1);
        const potY = canvasHeight - 150;

        const pots = [];
        for (let i = 0; i < potCount; i++) {
            pots.push(new PlantPot(spacing * (i + 1), potY, this.canvas));
        }

        const needs = new PlantNeeds();
        const wateringCan = new WateringCan(canvasWidth - 150, canvasHeight - 150, this.canvas);
        const fertilizerBag = new FertilizerBag(150, canvasHeight - 150, this.canvas);
        const sunArea = new SunArea(canvasWidth - 150, 200);

        gardenState.initZone('shared', {
            pots,
            tools: { seed: null, wateringCan, fertilizerBag, sunArea },
            needs,
        });

        this.spawnNewSeed('shared');
    }

    /**
     * Set up competitive zones for player 1 and player 2.
     */
    _setupCompetitiveZones() {
        const canvasHeight = this.canvas.height;
        const divX = gardenState.dividerX;

        // Player 1 zone (right side)
        const p1CenterX = divX + (this.canvas.width - divX) / 2;
        const p1Pot = new PlantPot(p1CenterX, canvasHeight - 150, this.canvas);
        const p1Needs = new PlantNeeds();
        const p1WateringCan = new WateringCan(this.canvas.width - 100, canvasHeight - 150, this.canvas);
        const p1Fertilizer = new FertilizerBag(divX + 80, canvasHeight - 150, this.canvas);
        const p1Sun = new SunArea(this.canvas.width - 100, 200);

        gardenState.initZone('p1', {
            pots: [p1Pot],
            tools: { seed: null, wateringCan: p1WateringCan, fertilizerBag: p1Fertilizer, sunArea: p1Sun },
            needs: p1Needs,
        });

        // Player 2 zone (left side)
        const p2CenterX = divX / 2;
        const p2Pot = new PlantPot(p2CenterX, canvasHeight - 150, this.canvas);
        const p2Needs = new PlantNeeds();
        const p2WateringCan = new WateringCan(100, canvasHeight - 150, this.canvas);
        const p2Fertilizer = new FertilizerBag(divX - 80, canvasHeight - 150, this.canvas);
        const p2Sun = new SunArea(100, 200);

        gardenState.initZone('p2', {
            pots: [p2Pot],
            tools: { seed: null, wateringCan: p2WateringCan, fertilizerBag: p2Fertilizer, sunArea: p2Sun },
            needs: p2Needs,
        });

        this.spawnNewSeed('p1');
        this.spawnNewSeed('p2');
    }

    // ── Configuration ──────────────────────────────────────────

    /**
     * Configure garden for multi-player.
     * Called from game.js before each round starts.
     */
    configure({ playerCount, gameMode, dividerX }) {
        gardenState.reset();                                    // increments roundGeneration, clears zones
        gardenState.setMode(gameMode || 'coop', playerCount || 1);
        gardenState.dividerX = dividerX || null;

        if (gardenState.mode === 'competitive' && gardenState.dividerX) {
            this._setupCompetitiveZones();
        } else {
            this._setupCoopZone(gardenState.playerCount);
        }

        // Set up magic pumpkin for co-op mode
        if (gardenState.mode === 'coop' && gardenState.playerCount === 2) {
            this.magicPumpkin = new MagicPumpkin(this.canvas);
            this.pumpkinSpawnTimer = 0;
        } else {
            this.magicPumpkin = null;
        }
    }

    /**
     * Spawn a new seed packet into a zone.
     */
    spawnNewSeed(zoneKey = 'shared') {
        let plantType;
        if (typeof game !== 'undefined' && game.getWeightedRandomPlant) {
            plantType = game.getWeightedRandomPlant();
        } else {
            const plantTypes = Object.keys(PLANT_TYPES);
            plantType = plantTypes[this.currentSeedIndex % plantTypes.length];
            this.currentSeedIndex++;
        }

        let seedX, seedY;

        if (gardenState.mode === 'competitive') {
            const divX = gardenState.dividerX;
            if (zoneKey === 'p1') {
                seedX = divX + (this.canvas.width - divX) / 2;
            } else if (zoneKey === 'p2') {
                seedX = divX / 2;
            }
            seedY = 100;
        } else {
            seedX = this.canvas.width / 2;
            seedY = 100;
        }

        const newSeed = new DraggableSeed(seedX, seedY, plantType, this.canvas);
        const zone = gardenState.getZone(zoneKey);
        if (zone) {
            zone.tools.seed = newSeed;
        }
    }

    /**
     * Apply DDA (Dynamic Difficulty Adjustment).
     */
    applyDDA(playerId, { seedSpeed, hitBoxMultiplier }) {
        this.ddaModifiers.set(playerId, { seedSpeed, hitBoxMultiplier });

        const zoneKey = gardenState.mode === 'competitive' ? ('p' + playerId) : 'shared';
        if (gardenState.mode !== 'competitive' && playerId !== 1) return;

        const pot = this.getZonePot(zoneKey);
        if (pot) pot.hitRadius = 80 * hitBoxMultiplier;

        const wateringCan = this.getZoneWateringCan(zoneKey);
        if (wateringCan) wateringCan.hitRadius = 60 * hitBoxMultiplier;

        const fertilizer = this.getZoneFertilizer(zoneKey);
        if (fertilizer) fertilizer.hitRadius = 50 * hitBoxMultiplier;

        const sunArea = this.getZoneSunArea(zoneKey);
        if (sunArea) sunArea.radius = 120 * hitBoxMultiplier;

        const seed = this.getZoneSeed(zoneKey);
        if (seed) seed.hitRadius = 50 * hitBoxMultiplier;

        const needs = this.getZoneNeeds(zoneKey);
        if (needs) {
            needs.waterDepleteRate = 0.03 * seedSpeed;
            needs.sunDepleteRate = 0.02 * seedSpeed;
            needs.foodDepleteRate = 0.025 * seedSpeed;
        }
    }

    /**
     * Set player idle time (called from game loop with DDA data).
     */
    setPlayerIdleTime(playerId, idleTime) {
        this.hintPlayerIdleTime.set(playerId, idleTime);
    }

    /**
     * Determine what hint to show for a given zone.
     */
    determineHintForZone(zoneKey) {
        const pot = this.getZonePot(zoneKey);
        if (!pot) return null;

        const seed = this.getZoneSeed(zoneKey);
        const wateringCan = this.getZoneWateringCan(zoneKey);
        const fertilizerBag = this.getZoneFertilizer(zoneKey);
        const sunArea = this.getZoneSunArea(zoneKey);
        const needs = this.getZoneNeeds(zoneKey);

        if (pot.growthStage === GrowthStage.EMPTY && seed && !seed.isPlanted) {
            return {
                fromX: seed.homeX, fromY: seed.homeY,
                toX: pot.x, toY: pot.y,
                hintType: 'seed_to_pot'
            };
        }

        if (pot.growthStage === GrowthStage.HARVESTABLE) {
            return {
                fromX: pot.x, fromY: pot.y,
                toX: pot.x, toY: pot.y,
                hintType: 'harvest'
            };
        }

        if (pot.growthStage !== GrowthStage.EMPTY && needs) {
            const needLevels = [
                { type: 'water_to_pot', value: needs.water, tool: wateringCan },
                { type: 'food_to_pot', value: needs.food, tool: fertilizerBag },
                { type: 'sun_to_pot', value: needs.sun, tool: sunArea }
            ];

            const critical = needLevels
                .filter(n => n.value < 0.5 && n.tool)
                .sort((a, b) => a.value - b.value)[0];

            if (critical) {
                const toolX = critical.tool.homeX != null ? critical.tool.homeX : critical.tool.x;
                const toolY = critical.tool.homeY != null ? critical.tool.homeY : critical.tool.y;
                return {
                    fromX: toolX, fromY: toolY,
                    toX: pot.x, toY: pot.y,
                    hintType: critical.type
                };
            }
        }

        return null;
    }

    /**
     * Update hint arrows based on player idle times.
     */
    updateHints(deltaTime) {
        const zones = this.getZoneKeys();

        for (const zone of zones) {
            const arrow = this.hintArrows.get(zone);
            if (!arrow) continue;

            let idleTime;
            if (gardenState.mode === 'competitive') {
                // hintPlayerIdleTime is keyed by integer player id (1 or 2); zone keys are 'p1'/'p2'
                const playerId = zone === 'p1' ? 1 : 2;
                idleTime = this.hintPlayerIdleTime.get(playerId) || 0;
            } else {
                const times = [...this.hintPlayerIdleTime.values()];
                idleTime = times.length > 0 ? Math.min(...times) : 0;
            }

            if (idleTime >= this.hintIdleThreshold) {
                const hint = this.determineHintForZone(zone);
                if (hint) {
                    arrow.show(hint.fromX, hint.fromY, hint.toX, hint.toY, hint.hintType);
                } else {
                    arrow.hide();
                }
            } else {
                arrow.hide();
            }

            arrow.update(deltaTime);
        }
    }

    /**
     * Show golden watering can for a player (competitive mode only).
     */
    showGoldenWateringCan(playerId) {
        if (gardenState.mode !== 'competitive') return;

        const zoneKey = 'p' + playerId;
        const zone = gardenState.getZone(zoneKey);

        let goldenCanX, goldenCanY;

        if (playerId === 1) {
            const divX = gardenState.dividerX;
            goldenCanX = divX + (this.canvas.width - divX) / 2;
            goldenCanY = this.canvas.height / 2;
        } else if (playerId === 2) {
            goldenCanX = gardenState.dividerX / 2;
            goldenCanY = this.canvas.height / 2;
        }

        const goldenCan = new WateringCan(goldenCanX, goldenCanY, this.canvas, true);
        if (zone) zone.goldenWateringCan = goldenCan;
    }

    /**
     * Spawn a random power-up in the given player's zone (competitive only).
     */
    showPowerUp(playerId) {
        if (this.activePowerUps.has(playerId)) return;

        const types = [InstantGrowth, DoublePoints, RainShower];
        const PowerUpClass = types[Math.floor(Math.random() * types.length)];

        const zoneX = playerId === 1
            ? this.canvas.width * 0.75
            : this.canvas.width * 0.25;
        const y = this.canvas.height * 0.3 + Math.random() * this.canvas.height * 0.3;

        this.activePowerUps.set(playerId, new PowerUpClass(zoneX, y, this.canvas));
    }

    /**
     * Spawn confetti particles.
     */
    spawnConfetti(x, y, count = 50) {
        for (let i = 0; i < count; i++) {
            this.confettiParticles.push(new ConfettiParticle(x, y));
        }
    }

    /**
     * Update all garden elements.
     */
    update(deltaTime) {
        this.lastDeltaTime = deltaTime;

        // Timer pause logic
        if (this.timerPaused) {
            this.timerPauseDuration -= deltaTime;
            if (this.timerPauseDuration <= 0) {
                this.timerPaused = false;
                this.timerPauseDuration = 0;
            }
        }

        // Update needs and plant growth
        if (gardenState.mode === 'competitive') {
            for (const zk of this.getZoneKeys()) {
                const zone = gardenState.getZone(zk);
                if (!zone) continue;
                const pot = zone.pots[0];
                const needs = zone.needs;

                if (pot.growthStage !== GrowthStage.EMPTY && needs) {
                    needs.update(deltaTime);
                    const satisfaction = needs.getAverageSatisfaction();
                    pot.updateGrowth(satisfaction, deltaTime);
                    pot.waterLevelTarget = needs.water;
                }
                pot.update(deltaTime);
            }
        } else {
            const zone = gardenState.getZone('shared');
            if (zone) {
                let needsUpdated = false;
                for (const pot of zone.pots) {
                    if (pot.growthStage !== GrowthStage.EMPTY) {
                        if (!needsUpdated) {
                            zone.needs.update(deltaTime);
                            needsUpdated = true;
                        }
                        const satisfaction = zone.needs.getAverageSatisfaction();
                        pot.updateGrowth(satisfaction, deltaTime);
                        pot.waterLevelTarget = zone.needs.water;
                    }
                    pot.update(deltaTime);
                }
            }
        }

        // Update sun areas and watering cans (per zone)
        for (const zk of this.getZoneKeys()) {
            this.getZoneSunArea(zk).update(deltaTime);
            this.getZoneWateringCan(zk).update(deltaTime);
        }

        // Update golden watering cans (zone-level source of truth)
        for (const zk of gardenState.getAllZoneKeys()) {
            const can = gardenState.getZone(zk).goldenWateringCan;
            if (can) can.update(deltaTime);
        }

        // Update power-ups (competitive mode)
        this.activePowerUps.forEach((pu, pid) => {
            pu.update(deltaTime);
            if (!pu.active) this.activePowerUps.delete(pid);
        });
        if (this.powerUpCooldown > 0) this.powerUpCooldown -= deltaTime;

        // Update magic pumpkin (co-op only)
        if (this.magicPumpkin) {
            this.magicPumpkin.update(deltaTime);

            if (!this.magicPumpkin.visible && !this.timerPaused) {
                this.pumpkinSpawnTimer += deltaTime;
                if (this.pumpkinSpawnTimer >= this.pumpkinSpawnInterval) {
                    this.magicPumpkin.show();
                    this.pumpkinSpawnTimer = 0;
                    this.pumpkinSpawnInterval = 30 + Math.random() * 15;
                }
            }
        }

        // Update confetti particles
        this.confettiParticles.forEach(particle => particle.update(deltaTime));
        this.confettiParticles = this.confettiParticles.filter(p => !p.isDead());

        // Update hint arrows
        this.updateHints(deltaTime);

        // Update return-to-home beacon pulse
        this.returnBeaconPulse += deltaTime * 3;
    }

    /**
     * Handle hand interactions with per-player routing.
     * Delegates entirely to gardenInteraction and returns harvested plant records.
     */
    checkCollisions(handPositions) {
        // Clear magic pumpkin touch set when no hands present (mirrors old behaviour).
        if ((!handPositions || handPositions.length === 0) && this.magicPumpkin) {
            this.magicPumpkin.playerstouching.clear();
        }
        return gardenInteraction.process(this.lastDeltaTime, handPositions);
    }

    /**
     * Get zone owner based on x position (competitive mode).
     */
    getZoneOwner(x) {
        if (!gardenState.dividerX) return 1;
        return x > gardenState.dividerX ? 1 : 2;
    }

    /**
     * Draw the entire garden scene.
     * Delegates to gardenRenderer; all canvas drawing lives there.
     */
    draw(ctx) {
        gardenRenderer.draw(ctx);
    }

    /**
     * Clear the garden (for reset).
     */
    clear() {
        gardenState.reset();   // increments roundGeneration, clears zones

        // Re-init in the current mode so the garden is ready for the next configure() call
        this._setupCoopZone(gardenState.playerCount || 1);

        this.confettiParticles = [];
        this.pumpkinActivated = false;
        this.timerPaused = false;
        this.timerPauseDuration = 0;

        if (this.magicPumpkin) {
            this.magicPumpkin.hide();
            this.pumpkinSpawnTimer = 0;
        }

        this.hintArrows.forEach(arrow => arrow.reset());
        this.hintPlayerIdleTime.clear();

        this.activePowerUps.clear();
        this.powerUpCooldown = 0;
    }

    // ── Compatibility methods ──────────────────────────────────────

    setDifficulty(level) {
        const modifier = 1 + (level - 1) * 0.1;

        for (const zk of this.getZoneKeys()) {
            const needs = this.getZoneNeeds(zk);
            if (needs) {
                needs.waterDepleteRate = 0.03 * modifier;
                needs.sunDepleteRate = 0.02 * modifier;
                needs.foodDepleteRate = 0.025 * modifier;
            }
        }
    }

    getActiveSeedCount() {
        let count = 0;
        for (const zk of this.getZoneKeys()) {
            const zone = gardenState.getZone(zk);
            if (zone) count += zone.pots.filter(pot => pot.growthStage !== GrowthStage.EMPTY).length;
        }
        return count;
    }
}
