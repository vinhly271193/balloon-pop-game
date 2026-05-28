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

        // Golden watering cans (competitive mode) — also mirrored into zone.goldenWateringCan
        this.goldenWateringCans = new Map();

        // Power-ups (competitive mode — DDA-driven spawning)
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
        this.hintArrows.set(1, new HintArrow());
        this.hintArrows.set(2, new HintArrow());
        this.hintIdleThreshold = 5;
        this.hintPlayerIdleTime = new Map();

        // Return-to-home drop beacon animation timer
        this.returnBeaconPulse = 0;

        // Default single player setup (configure() overwrites this before first round)
        gardenState.setMode('coop', 1);
        gardenState.dividerX = null;
        this._setupCoopZone(1);
    }

    // ── Proxy accessors for mode state ──────────────────────────────

    get gameMode()       { return gardenState.mode; }
    get playerCount()    { return gardenState.playerCount; }
    get dividerX()       { return gardenState.dividerX; }
    set dividerX(v)      { gardenState.dividerX = v; }
    get roundGeneration(){ return gardenState.roundGeneration; }

    // ── Zone abstraction helpers ──────────────────────────────────

    /** Returns zone keys for the current game mode */
    getZoneKeys() {
        return gardenState.mode === 'competitive' ? [1, 2] : ['shared'];
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

        gardenState.initZone(1, {
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

        gardenState.initZone(2, {
            pots: [p2Pot],
            tools: { seed: null, wateringCan: p2WateringCan, fertilizerBag: p2Fertilizer, sunArea: p2Sun },
            needs: p2Needs,
        });

        this.spawnNewSeed(1);
        this.spawnNewSeed(2);
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

        // Clear competitive-mode collections
        this.goldenWateringCans.clear();

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
            if (zoneKey === 1) {
                seedX = divX + (this.canvas.width - divX) / 2;
            } else if (zoneKey === 2) {
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

        const zoneKey = gardenState.mode === 'competitive' ? playerId : 'shared';
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
                idleTime = this.hintPlayerIdleTime.get(zone) || 0;
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
        this.goldenWateringCans.set(playerId, goldenCan);

        // Mirror into zone state
        const zone = gardenState.getZone(playerId);
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

        // Update golden watering cans
        this.goldenWateringCans.forEach(can => can.update(deltaTime));

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
     */
    checkCollisions(handPositions) {
        const harvestedPlants = [];

        if (!handPositions || handPositions.length === 0) {
            // Release any held items
            if (gardenState.mode === 'competitive') {
                for (const zk of this.getZoneKeys()) {
                    const zone = gardenState.getZone(zk);
                    if (zone && zone.heldItem) {
                        this.releaseItem(zk);
                    }
                }
            } else {
                const zone = gardenState.getZone('shared');
                if (zone && zone.heldItem) {
                    this.releaseItem('shared');
                }
            }

            if (this.magicPumpkin) {
                this.magicPumpkin.playerstouching.clear();
            }

            return harvestedPlants;
        }

        // Group hands by player
        const handsByPlayer = new Map();
        handPositions.forEach(hand => {
            const playerId = hand.playerId || 1;
            if (!handsByPlayer.has(playerId)) {
                handsByPlayer.set(playerId, []);
            }
            handsByPlayer.get(playerId).push(hand);
        });

        if (gardenState.mode === 'competitive') {
            handsByPlayer.forEach((hands, playerId) => {
                hands.forEach(hand => {
                    const zoneOwner = this.getZoneOwner(hand.x);
                    const effectivePlayerId = zoneOwner;

                    const result = this.processHandInteraction(hand, effectivePlayerId);
                    if (result) {
                        const isTargetPlant = typeof challengeManager !== 'undefined' &&
                            challengeManager.currentChallenge &&
                            challengeManager.getTargetPlants().includes(result);
                        const zone = gardenState.getZone(effectivePlayerId);
                        const targetPotComp = zone ? zone.pots[0] : null;
                        harvestedPlants.push({ plantKey: result, playerId: effectivePlayerId, isTargetPlant, growTime: targetPotComp && targetPotComp.plantedAt ? (Date.now() - targetPotComp.plantedAt) / 1000 : 30 });
                    }
                });
            });
        } else {
            // Solo/co-op — group all collision points by hand
            const handGroups = new Map();
            handPositions.forEach(pos => {
                const handKey = pos.isLeft ? 'left' : 'right';
                if (!handGroups.has(handKey)) {
                    handGroups.set(handKey, []);
                }
                handGroups.get(handKey).push(pos);
            });

            const sharedZone = gardenState.getZone('shared');

            // Release held item if the holding hand disappeared
            if (sharedZone && sharedZone.heldItem && sharedZone.heldItemHand && !handGroups.has(sharedZone.heldItemHand)) {
                this.releaseItem('shared');
            }

            handGroups.forEach((points, handKey) => {
                if (sharedZone && sharedZone.heldItem && sharedZone.heldItemHand && sharedZone.heldItemHand !== handKey) {
                    points.forEach(hand => {
                        const result = this.processFreeHandInteraction(hand);
                        if (result) {
                            const isTargetPlant = typeof challengeManager !== 'undefined' &&
                                challengeManager.currentChallenge &&
                                challengeManager.getTargetPlants().includes(result);
                            let closestPotFH = null, minDistFH = Infinity;
                            if (sharedZone) {
                                sharedZone.pots.forEach(p => { const d = Math.hypot(hand.x - p.x, hand.y - p.y); if (d < minDistFH) { minDistFH = d; closestPotFH = p; } });
                            }
                            harvestedPlants.push({ plantKey: result, playerId: hand.playerId || 1, isTargetPlant, growTime: closestPotFH && closestPotFH.plantedAt ? (Date.now() - closestPotFH.plantedAt) / 1000 : 30 });
                        }
                    });
                    return;
                }

                points.forEach(hand => {
                    const result = this.processHandInteraction(hand, 'shared');
                    if (result) {
                        const isTargetPlant = typeof challengeManager !== 'undefined' &&
                            challengeManager.currentChallenge &&
                            challengeManager.getTargetPlants().includes(result);
                        let closestPotSH = null, minDistSH = Infinity;
                        if (sharedZone) {
                            sharedZone.pots.forEach(p => { const d = Math.hypot(hand.x - p.x, hand.y - p.y); if (d < minDistSH) { minDistSH = d; closestPotSH = p; } });
                        }
                        harvestedPlants.push({ plantKey: result, playerId: hand.playerId || 1, isTargetPlant, growTime: closestPotSH && closestPotSH.plantedAt ? (Date.now() - closestPotSH.plantedAt) / 1000 : 30 });
                    }
                });

                // Track which hand grabbed the item
                if (sharedZone && sharedZone.heldItem && !sharedZone.heldItemHand) {
                    sharedZone.heldItemHand = handKey;
                }
            });

            // Check magic pumpkin (both players must touch)
            if (this.magicPumpkin && this.magicPumpkin.visible && !this.magicPumpkin.active) {
                this.magicPumpkin.playerstouching.clear();

                handPositions.forEach(hand => {
                    if (this.magicPumpkin.isPointOver(hand.x, hand.y)) {
                        this.magicPumpkin.playerstouching.add(hand.playerId || 1);
                    }
                });

                if (this.magicPumpkin.playerstouching.size >= 2) {
                    this.magicPumpkin.activate();
                    this.pumpkinActivated = true;
                    this.timerPaused = true;
                    this.timerPauseDuration = 3;
                    this.spawnConfetti(this.magicPumpkin.x, this.magicPumpkin.y, 80);
                    if (typeof achievementManager !== 'undefined') achievementManager.recordMagicPumpkin();
                }
            }
        }

        return harvestedPlants;
    }

    /**
     * Get zone owner based on x position (competitive mode).
     */
    getZoneOwner(x) {
        if (!gardenState.dividerX) return 1;
        return x > gardenState.dividerX ? 1 : 2;
    }

    /**
     * Process a single hand interaction.
     */
    processHandInteraction(handPos, zoneKey) {
        let harvested = null;

        const zone = gardenState.getZone(zoneKey);
        if (!zone) return harvested;

        const seed = zone.tools.seed;
        const wateringCan = zone.tools.wateringCan;
        const fertilizerBag = zone.tools.fertilizerBag;
        const sunArea = zone.tools.sunArea;
        const timers = zone.interactionTimers;
        // Read plantNeeds fresh each time to avoid stale reference after seed planting
        const getPlantNeeds = () => zone.needs;

        let heldItem = zone.heldItem;

        // Find relevant pot
        let targetPot = null;
        if (gardenState.mode === 'competitive') {
            targetPot = zone.pots[0] || null;
        } else {
            let minDist = Infinity;
            zone.pots.forEach(pot => {
                const dist = Math.sqrt(
                    Math.pow(handPos.x - pot.x, 2) +
                    Math.pow(handPos.y - pot.y, 2)
                );
                if (dist < minDist) {
                    minDist = dist;
                    targetPot = pot;
                }
            });
        }

        if (!targetPot) return harvested;

        // Check golden watering can (competitive only)
        if (gardenState.mode === 'competitive') {
            const goldenCan = this.goldenWateringCans.get(zoneKey);
            if (goldenCan && goldenCan.isPointOver(handPos.x, handPos.y)) {
                if (!heldItem) {
                    goldenCan.pickup();
                    heldItem = goldenCan;
                    zone.heldItem = heldItem;
                }
            }
        }

        // Check for power-up collection (competitive only, uses index fingertip)
        if (gardenState.mode === 'competitive' && handPos.landmarkIndex === 8) {
            const powerUp = this.activePowerUps.get(zoneKey);
            if (powerUp && powerUp.active && !powerUp.collected) {
                if (powerUp.isPointOver(handPos.x, handPos.y)) {
                    powerUp.applyEffect(this, zoneKey);
                    if (!powerUp.active) {
                        this.activePowerUps.delete(zoneKey);
                    }
                    if (typeof audioManager !== 'undefined') audioManager.play('harvest');
                    if (typeof game !== 'undefined' && game.achievementManager) {
                        game.achievementManager.recordPowerUp();
                    }
                    return harvested;
                }
            }
        }

        // Held items track the index fingertip only (landmark 8)
        const isIndexFinger = handPos.landmarkIndex === 8;

        if (heldItem && isIndexFinger) {
            heldItem.moveTo(handPos.x, handPos.y);

            // Reset watering can state if held but not yet confirmed over pot
            if (heldItem === wateringCan) {
                const overPot = targetPot && targetPot.isPointOver(handPos.x, handPos.y);
                if (!overPot) {
                    wateringCan.isOverPot = false;
                    wateringCan.pourProgress = 0;
                    wateringCan.targetPotRef = null;
                    if (targetPot) {
                        targetPot.isBeingWatered = false;
                        targetPot.waterPourProgress = 0;
                    }
                    timers.water = 0;
                }
            }

            // Check for drop interactions
            if (heldItem === seed && targetPot && targetPot.isPointOver(handPos.x, handPos.y)) {
                if (targetPot.plantSeed(seed.plantType)) {
                    seed.plant();
                    zone.heldItem = null;
                    zone.heldItemHand = null;

                    if (typeof audioManager !== 'undefined') {
                        audioManager.play('plant');
                    }

                    // Reset needs for new plant
                    zone.needs = new PlantNeeds();

                    // Spawn new seed after delay (guarded by generation counter)
                    const gen = gardenState.roundGeneration;
                    setTimeout(() => { if (gardenState.roundGeneration === gen) this.spawnNewSeed(zoneKey); }, 1000);
                }
            } else if (heldItem === wateringCan && targetPot && targetPot.isPointOver(handPos.x, handPos.y)) {
                wateringCan.isOverPot = true;
                wateringCan.targetPotRef = targetPot;

                const waterTime = timers.water;
                const newWaterTime = waterTime + this.lastDeltaTime;

                const progress = Math.min(1, newWaterTime / 0.3);
                wateringCan.pourProgress = progress;
                targetPot.isBeingWatered = true;
                targetPot.waterPourProgress = progress;

                if (newWaterTime > 0.3) {
                    getPlantNeeds().addWater();
                    wateringCan.water();
                    wateringCan.pourProgress = 0;
                    targetPot.waterPourProgress = 0;
                    timers.water = 0;

                    if (typeof audioManager !== 'undefined') {
                        audioManager.play('water');
                    }
                    if (typeof achievementManager !== 'undefined') achievementManager.recordToolUse('watering_can');
                } else {
                    timers.water = newWaterTime;
                }
            } else if (heldItem === fertilizerBag && targetPot && targetPot.isPointOver(handPos.x, handPos.y)) {
                const foodTime = timers.food;
                const newFoodTime = foodTime + this.lastDeltaTime;

                if (newFoodTime > 0.5) {
                    getPlantNeeds().addFood();
                    timers.food = 0;

                    if (typeof audioManager !== 'undefined') {
                        audioManager.play('plant');
                    }
                    if (typeof achievementManager !== 'undefined') achievementManager.recordToolUse('fertilizer');
                } else {
                    timers.food = newFoodTime;
                }
            } else if (heldItem.isGolden && targetPot && targetPot.isPointOver(handPos.x, handPos.y)) {
                getPlantNeeds().maxAll();
                this.goldenWateringCans.delete(zoneKey);
                zone.goldenWateringCan = null;
                zone.heldItem = null;

                if (typeof audioManager !== 'undefined') {
                    audioManager.play('water');
                }
            } else if (heldItem.homeX != null && heldItem.homeY != null) {
                const distToHome = Math.sqrt(
                    Math.pow(handPos.x - heldItem.homeX, 2) +
                    Math.pow(handPos.y - heldItem.homeY, 2)
                );
                if (distToHome < 80) {
                    this.releaseItem(zoneKey);
                    heldItem = null;
                    if (typeof audioManager !== 'undefined') {
                        audioManager.play('plant');
                    }
                }
            }
        }

        if (!heldItem) {
            // Try to pick something up (any collision point can trigger pickup)
            if (seed && !seed.isPlanted && seed.isPointOver(handPos.x, handPos.y)) {
                seed.pickup();
                zone.heldItem = seed;
            } else if (wateringCan && wateringCan.isPointOver(handPos.x, handPos.y)) {
                wateringCan.pickup();
                zone.heldItem = wateringCan;
            } else if (fertilizerBag && fertilizerBag.isPointOver(handPos.x, handPos.y)) {
                fertilizerBag.pickup();
                zone.heldItem = fertilizerBag;
            }

            // Sun interaction (just hover)
            if (sunArea && sunArea.isPointOver(handPos.x, handPos.y)) {
                const sunTime = timers.sun;
                const newSunTime = sunTime + this.lastDeltaTime;

                if (newSunTime > 0.2) {
                    getPlantNeeds().addSun();
                    timers.sun = 0;
                    if (typeof achievementManager !== 'undefined') achievementManager.recordToolUse('sun');
                } else {
                    timers.sun = newSunTime;
                }
            }

            // Check for harvest
            if (targetPot && targetPot.growthStage === GrowthStage.HARVESTABLE &&
                targetPot.isPointOver(handPos.x, handPos.y)) {
                const harvestedPlant = targetPot.harvest();
                if (harvestedPlant) {
                    harvested = harvestedPlant;
                    if (typeof audioManager !== 'undefined') {
                        audioManager.play('harvest');
                    }

                    const gen = gardenState.roundGeneration;
                    setTimeout(() => { if (gardenState.roundGeneration === gen) this.spawnNewSeed(zoneKey); }, 500);
                }
            }
        }

        return harvested;
    }

    /**
     * Release currently held item.
     */
    releaseItem(zoneKey = 'shared') {
        const zone = gardenState.getZone(zoneKey);
        if (!zone) return;

        const heldItem = zone.heldItem;

        if (heldItem) {
            if (heldItem.targetPotRef) {
                heldItem.targetPotRef.isBeingWatered = false;
                heldItem.targetPotRef.waterPourProgress = 0;
                heldItem.targetPotRef = null;
            }

            heldItem.drop();

            const wateringCan = zone.tools.wateringCan;
            const fertilizerBag = zone.tools.fertilizerBag;
            const seed = zone.tools.seed;

            if (heldItem === wateringCan || heldItem === fertilizerBag) {
                heldItem.returnHome();
            } else if (heldItem === seed && !seed.isPlanted) {
                seed.returnHome();
            }

            if (heldItem.isGolden) {
                this.goldenWateringCans.delete(zoneKey);
                zone.goldenWateringCan = null;
            }

            zone.heldItem = null;
            zone.heldItemHand = null;
        }
    }

    /**
     * Process free-hand interactions (sun hover + harvest only, no pickup/movement).
     */
    processFreeHandInteraction(handPos) {
        const zone = gardenState.getZone('shared');
        if (!zone) return null;

        const sunArea = zone.tools.sunArea;
        if (sunArea && sunArea.isPointOver(handPos.x, handPos.y)) {
            zone.interactionTimers.sun += this.lastDeltaTime;
            if (zone.interactionTimers.sun > 0.2) {
                if (zone.needs) zone.needs.addSun();
                zone.interactionTimers.sun = 0;
                if (typeof achievementManager !== 'undefined') achievementManager.recordToolUse('sun');
            }
        }

        let targetPot = null;
        let minDist = Infinity;
        zone.pots.forEach(pot => {
            const dist = Math.sqrt(
                Math.pow(handPos.x - pot.x, 2) +
                Math.pow(handPos.y - pot.y, 2)
            );
            if (dist < minDist) {
                minDist = dist;
                targetPot = pot;
            }
        });

        if (targetPot && targetPot.growthStage === GrowthStage.HARVESTABLE &&
            targetPot.isPointOver(handPos.x, handPos.y)) {
            const harvestedPlant = targetPot.harvest();
            if (harvestedPlant) {
                if (typeof audioManager !== 'undefined') {
                    audioManager.play('harvest');
                }
                const gen = gardenState.roundGeneration;
                setTimeout(() => { if (gardenState.roundGeneration === gen) this.spawnNewSeed('shared'); }, 500);
                return harvestedPlant;
            }
        }

        return null;
    }

    /**
     * Draw the entire garden scene.
     */
    draw(ctx) {
        // Draw divider if competitive mode
        if (gardenState.mode === 'competitive' && gardenState.dividerX) {
            this.drawDivider(ctx);
        }

        // Draw sun areas (per zone)
        for (const zk of this.getZoneKeys()) {
            this.getZoneSunArea(zk).draw(ctx);
        }

        // Draw plant pots (all zones)
        for (const zk of this.getZoneKeys()) {
            const zone = gardenState.getZone(zk);
            if (zone) zone.pots.forEach(pot => pot.draw(ctx));
        }

        // Draw seeds and tools (per zone)
        for (const zk of this.getZoneKeys()) {
            const seed = this.getZoneSeed(zk);
            if (seed) seed.draw(ctx);
            this.getZoneWateringCan(zk).draw(ctx);
            this.getZoneFertilizer(zk).draw(ctx);
        }

        // Draw golden watering cans
        this.goldenWateringCans.forEach(can => can.draw(ctx));

        // Draw active power-ups
        this.activePowerUps.forEach(pu => pu.draw(ctx));

        // Draw needs panels (vertically centred, per zone)
        const needsPanelHeight = 150;
        const needsY = Math.round(this.canvas.height / 2 - needsPanelHeight / 2 + 20);
        const needsXPositions = gardenState.mode === 'competitive'
            ? { 1: this.canvas.width - 250, 2: 30 }
            : { shared: 30 };

        for (const zk of this.getZoneKeys()) {
            const pot = this.getZonePot(zk);
            const needs = this.getZoneNeeds(zk);
            if (!pot || !needs) continue;

            const zone = gardenState.getZone(zk);
            const isGrowing = gardenState.mode === 'competitive'
                ? pot.growthStage !== GrowthStage.EMPTY
                : zone && zone.pots.some(p => p.growthStage !== GrowthStage.EMPTY);

            if (isGrowing) {
                needs.draw(ctx, needsXPositions[zk], needsY);
            }
        }

        // Draw return-to-home beacons when holding items
        this.drawReturnBeacons(ctx);

        // Draw magic pumpkin (co-op only)
        if (this.magicPumpkin) {
            this.magicPumpkin.draw(ctx);
        }

        // Draw confetti
        this.confettiParticles.forEach(particle => particle.draw(ctx));

        // Draw hint arrows
        this.hintArrows.forEach(arrow => arrow.draw(ctx));

        // Draw instructions
        this.drawInstructions(ctx);
    }

    /**
     * Draw competitive mode divider.
     */
    drawDivider(ctx) {
        ctx.save();

        ctx.setLineDash([15, 10]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 3;

        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.moveTo(gardenState.dividerX, 0);
        ctx.lineTo(gardenState.dividerX, this.canvas.height);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';

        ctx.fillStyle = '#FF8C42';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        const p1X = gardenState.dividerX + (this.canvas.width - gardenState.dividerX) / 2;
        drawUnmirroredText(ctx, 'Player 1', p1X, 40, true);

        ctx.fillStyle = '#4A90D9';
        const p2X = gardenState.dividerX / 2;
        drawUnmirroredText(ctx, 'Player 2', p2X, 40, true);

        ctx.restore();
    }

    /**
     * Draw helpful instructions.
     */
    drawInstructions(ctx) {
        ctx.save();
        ctx.font = '18px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.textAlign = 'center';

        let anyPotEmpty = false;
        let anyPotHarvestable = false;
        for (const zk of this.getZoneKeys()) {
            const zone = gardenState.getZone(zk);
            if (!zone) continue;
            if (zone.pots.some(pot => pot.growthStage === GrowthStage.EMPTY)) anyPotEmpty = true;
            if (zone.pots.some(pot => pot.growthStage === GrowthStage.HARVESTABLE)) anyPotHarvestable = true;
        }

        const instructionY = this.canvas.height - 60;

        if (anyPotEmpty) {
            drawUnmirroredText(ctx, 'Pick up the seed and drop it in the pot!', this.canvas.width / 2, instructionY);
        } else if (anyPotHarvestable) {
            drawUnmirroredText(ctx, 'Your plant is ready! Touch it to harvest!', this.canvas.width / 2, instructionY);
        } else {
            drawUnmirroredText(ctx, 'Keep your plant healthy - water it, give it sun and food!', this.canvas.width / 2, instructionY);
        }

        ctx.restore();
    }

    /**
     * Draw pulsing return-to-home beacons when an item is held.
     */
    drawReturnBeacons(ctx) {
        for (const zk of this.getZoneKeys()) {
            const zone = gardenState.getZone(zk);
            if (!zone) continue;

            const heldItem = zone.heldItem;
            if (!heldItem || heldItem.homeX == null || heldItem.homeY == null) continue;

            const hx = heldItem.homeX;
            const hy = heldItem.homeY;
            const pulse = 0.5 + 0.5 * Math.sin(this.returnBeaconPulse);

            ctx.save();

            ctx.beginPath();
            ctx.arc(hx, hy, 40 + pulse * 10, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 200, ${0.2 + pulse * 0.3})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.stroke();
            ctx.setLineDash([]);

            const grad = ctx.createRadialGradient(hx, hy, 0, hx, hy, 35);
            grad.addColorStop(0, `rgba(255, 255, 200, ${0.15 + pulse * 0.1})`);
            grad.addColorStop(1, 'rgba(255, 255, 200, 0)');
            ctx.beginPath();
            ctx.arc(hx, hy, 35, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.font = `${20 + pulse * 4}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = 0.5 + pulse * 0.4;
            drawUnmirroredText(ctx, '↩', hx, hy);

            ctx.restore();
        }
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
        this.goldenWateringCans.clear();
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
