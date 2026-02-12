/**
 * Garden System - Garden Bed
 * Main Garden manager that coordinates all garden elements
 */


/**
 * Main Garden manager - coordinates all garden elements
 */
class GardenBed {
    constructor(canvas) {
        this.canvas = canvas;

        // Active flag — prevents setTimeout callbacks after round ends
        this.active = false;

        // Cached deltaTime for use in collision handlers (which don't receive deltaTime)
        this.lastDeltaTime = 0.016;

        // Multi-player configuration
        this.playerCount = 1;
        this.gameMode = 'coop'; // 'coop' or 'competitive'
        this.dividerX = null;

        // Position elements (default single player / co-op layout)
        const centerX = canvas.width / 2;
        const centerY = canvas.height - 150; // Bottom toolbar row

        // Plant pots (will be configured based on mode)
        this.plantPots = [];
        this.plantPot = new PlantPot(centerX, centerY, canvas); // Default for single player
        this.plantPots.push(this.plantPot);

        // Plant needs (per player in competitive, shared in co-op)
        this.plantNeedsMap = new Map();
        this.plantNeeds = new PlantNeeds(); // Default for single player
        this.plantNeedsMap.set('shared', this.plantNeeds);

        // Tools and seeds (per zone in competitive, shared in co-op)
        this.seedsMap = new Map();
        this.wateringCansMap = new Map();
        this.fertilizerBagsMap = new Map();
        this.sunAreasMap = new Map();

        // Default shared tools
        this.seed = null;
        this.wateringCan = new WateringCan(canvas.width - 150, canvas.height - 150, canvas);
        this.fertilizerBag = new FertilizerBag(150, canvas.height - 150, canvas);
        this.sunArea = new SunArea(canvas.width - 150, 200); // Just below progress bar

        this.wateringCansMap.set('shared', this.wateringCan);
        this.fertilizerBagsMap.set('shared', this.fertilizerBag);
        this.sunAreasMap.set('shared', this.sunArea);

        // Currently held items (per player)
        this.heldItemsMap = new Map();
        this.heldItem = null; // Default for single player
        this.heldItemHand = null; // Track which physical hand holds the item

        // Available seeds
        this.availableSeeds = [];
        this.currentSeedIndex = 0;

        // Spawn initial seed
        this.spawnNewSeed('shared');

        // Interaction timers (per player)
        this.sunInteractionTimeMap = new Map();
        this.waterInteractionTimeMap = new Map();
        this.foodInteractionTimeMap = new Map();

        this.sunInteractionTime = 0;
        this.waterInteractionTime = 0;
        this.foodInteractionTime = 0;

        // DDA modifiers per player
        this.ddaModifiers = new Map();
        this.ddaModifiers.set(1, { seedSpeed: 1, hitBoxMultiplier: 1 });
        this.ddaModifiers.set(2, { seedSpeed: 1, hitBoxMultiplier: 1 });

        // Magic pumpkin (co-op only)
        this.magicPumpkin = null;
        this.pumpkinActivated = false;
        this.pumpkinSpawnTimer = 0;
        this.pumpkinSpawnInterval = 35; // 35 seconds average

        // Golden watering cans (competitive mode)
        this.goldenWateringCans = new Map();

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
        this.hintIdleThreshold = 5; // seconds before showing tooltip hints
        this.hintPlayerIdleTime = new Map();
    }

    /**
     * Configure garden for multi-player
     */
    configure({ playerCount, gameMode, dividerX }) {
        this.active = true;
        this.playerCount = playerCount || 1;
        this.gameMode = gameMode || 'coop';
        this.dividerX = dividerX || null;

        // Clear existing setup
        this.plantPots = [];
        this.plantNeedsMap.clear();
        this.seedsMap.clear();
        this.wateringCansMap.clear();
        this.fertilizerBagsMap.clear();
        this.sunAreasMap.clear();
        this.heldItemsMap.clear();
        this.goldenWateringCans.clear();

        if (this.gameMode === 'competitive' && this.dividerX) {
            // Competitive mode - split zones
            this.setupCompetitiveMode();
        } else {
            // Co-op or single player - shared garden
            this.setupCoopMode();
        }

        // Setup magic pumpkin for co-op mode
        if (this.gameMode === 'coop' && this.playerCount === 2) {
            this.magicPumpkin = new MagicPumpkin(this.canvas);
            this.pumpkinSpawnTimer = 0;
        } else {
            this.magicPumpkin = null;
        }
    }

    /**
     * Setup co-op mode (shared garden)
     */
    setupCoopMode() {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        // 2-3 plant pots spread across width, on bottom toolbar row
        const potCount = this.playerCount === 2 ? 2 : 3;
        const spacing = canvasWidth / (potCount + 1);
        const potY = canvasHeight - 150;

        for (let i = 0; i < potCount; i++) {
            const pot = new PlantPot(
                spacing * (i + 1),
                potY,
                this.canvas
            );
            this.plantPots.push(pot);
        }

        // Default to first pot for backwards compatibility
        this.plantPot = this.plantPots[0];

        // Shared plant needs
        this.plantNeeds = new PlantNeeds();
        this.plantNeedsMap.set('shared', this.plantNeeds);

        // Shared tools
        this.wateringCan = new WateringCan(canvasWidth - 150, canvasHeight - 150, this.canvas);
        this.fertilizerBag = new FertilizerBag(150, canvasHeight - 150, this.canvas);
        this.sunArea = new SunArea(canvasWidth - 150, 200); // Just below progress bar

        this.wateringCansMap.set('shared', this.wateringCan);
        this.fertilizerBagsMap.set('shared', this.fertilizerBag);
        this.sunAreasMap.set('shared', this.sunArea);

        // Spawn seed
        this.spawnNewSeed('shared');

        // Initialize interaction timers
        this.sunInteractionTime = 0;
        this.waterInteractionTime = 0;
        this.foodInteractionTime = 0;
    }

    /**
     * Setup competitive mode (split zones)
     */
    setupCompetitiveMode() {
        const canvasHeight = this.canvas.height;

        // Player 1 zone (right side, mirrored)
        const p1CenterX = this.dividerX + (this.canvas.width - this.dividerX) / 2;
        const p1Pot = new PlantPot(p1CenterX, canvasHeight - 150, this.canvas);
        this.plantPots.push(p1Pot);

        const p1Needs = new PlantNeeds();
        this.plantNeedsMap.set(1, p1Needs);

        const p1WateringCan = new WateringCan(
            this.canvas.width - 100,
            canvasHeight - 150,
            this.canvas
        );
        const p1Fertilizer = new FertilizerBag(
            this.dividerX + 80,
            canvasHeight - 150,
            this.canvas
        );
        const p1Sun = new SunArea(this.canvas.width - 100, 200);

        this.wateringCansMap.set(1, p1WateringCan);
        this.fertilizerBagsMap.set(1, p1Fertilizer);
        this.sunAreasMap.set(1, p1Sun);

        // Player 2 zone (left side, mirrored)
        const p2CenterX = this.dividerX / 2;
        const p2Pot = new PlantPot(p2CenterX, canvasHeight - 150, this.canvas);
        this.plantPots.push(p2Pot);

        const p2Needs = new PlantNeeds();
        this.plantNeedsMap.set(2, p2Needs);

        const p2WateringCan = new WateringCan(
            100,
            canvasHeight - 150,
            this.canvas
        );
        const p2Fertilizer = new FertilizerBag(
            this.dividerX - 80,
            canvasHeight - 150,
            this.canvas
        );
        const p2Sun = new SunArea(100, 200);

        this.wateringCansMap.set(2, p2WateringCan);
        this.fertilizerBagsMap.set(2, p2Fertilizer);
        this.sunAreasMap.set(2, p2Sun);

        // Spawn seeds for both players
        this.spawnNewSeed(1);
        this.spawnNewSeed(2);

        // Initialize interaction timers for both players
        this.sunInteractionTimeMap.set(1, 0);
        this.sunInteractionTimeMap.set(2, 0);
        this.waterInteractionTimeMap.set(1, 0);
        this.waterInteractionTimeMap.set(2, 0);
        this.foodInteractionTimeMap.set(1, 0);
        this.foodInteractionTimeMap.set(2, 0);
    }

    /**
     * Spawn a new seed packet
     */
    spawnNewSeed(zoneKey = 'shared') {
        const plantTypes = Object.keys(PLANT_TYPES);
        const plantType = plantTypes[this.currentSeedIndex % plantTypes.length];
        this.currentSeedIndex++;

        let seedX, seedY;

        if (this.gameMode === 'competitive') {
            if (zoneKey === 1) {
                seedX = this.dividerX + (this.canvas.width - this.dividerX) / 2;
            } else if (zoneKey === 2) {
                seedX = this.dividerX / 2;
            }
            seedY = 100;
        } else {
            seedX = this.canvas.width / 2;
            seedY = 100;
        }

        const newSeed = new DraggableSeed(seedX, seedY, plantType, this.canvas);

        if (zoneKey === 'shared') {
            this.seed = newSeed;
        }
        this.seedsMap.set(zoneKey, newSeed);
    }

    /**
     * Apply DDA (Dynamic Difficulty Adjustment)
     */
    applyDDA(playerId, { seedSpeed, hitBoxMultiplier }) {
        this.ddaModifiers.set(playerId, { seedSpeed, hitBoxMultiplier });

        // Apply hitbox multiplier to player's tools
        if (this.gameMode === 'competitive') {
            const pot = this.plantPots[playerId - 1];
            if (pot) {
                pot.hitRadius = 80 * hitBoxMultiplier;
            }

            const wateringCan = this.wateringCansMap.get(playerId);
            if (wateringCan) {
                wateringCan.hitRadius = 60 * hitBoxMultiplier;
            }

            const fertilizer = this.fertilizerBagsMap.get(playerId);
            if (fertilizer) {
                fertilizer.hitRadius = 50 * hitBoxMultiplier;
            }

            const sunArea = this.sunAreasMap.get(playerId);
            if (sunArea) {
                sunArea.radius = 120 * hitBoxMultiplier;
            }

            const seed = this.seedsMap.get(playerId);
            if (seed) {
                seed.hitRadius = 50 * hitBoxMultiplier;
            }

            // Apply depletion rate modifier
            const needs = this.plantNeedsMap.get(playerId);
            if (needs) {
                needs.waterDepleteRate = 0.03 * seedSpeed;
                needs.sunDepleteRate = 0.02 * seedSpeed;
                needs.foodDepleteRate = 0.025 * seedSpeed;
            }
        }
    }

    /**
     * Set player idle time (called from game loop with DDA data)
     */
    setPlayerIdleTime(playerId, idleTime) {
        this.hintPlayerIdleTime.set(playerId, idleTime);
    }

    /**
     * Determine what hint to show for a given zone
     * Returns { fromX, fromY, toX, toY, hintType } or null
     */
    determineHintForZone(zoneKey) {
        const isCompetitive = this.gameMode === 'competitive';
        const pot = isCompetitive ? this.plantPots[zoneKey - 1] : this.plantPots[0];
        if (!pot) return null;

        const seed = isCompetitive ? this.seedsMap.get(zoneKey) : this.seed;
        const wateringCan = isCompetitive ? this.wateringCansMap.get(zoneKey) : this.wateringCan;
        const fertilizerBag = isCompetitive ? this.fertilizerBagsMap.get(zoneKey) : this.fertilizerBag;
        const sunArea = isCompetitive ? this.sunAreasMap.get(zoneKey) : this.sunArea;
        const needs = isCompetitive ? this.plantNeedsMap.get(zoneKey) : this.plantNeeds;

        // Phase 1: Empty pot + seed exists → arrow from seed to pot
        if (pot.growthStage === GrowthStage.EMPTY && seed && !seed.isPlanted) {
            return {
                fromX: seed.homeX, fromY: seed.homeY,
                toX: pot.x, toY: pot.y,
                hintType: 'seed_to_pot'
            };
        }

        // Phase 2: Harvestable → pulsing ring on pot
        if (pot.growthStage === GrowthStage.HARVESTABLE) {
            return {
                fromX: pot.x, fromY: pot.y,
                toX: pot.x, toY: pot.y,
                hintType: 'harvest'
            };
        }

        // Phase 3: Growing plant with needs → arrow from lowest-need tool to pot
        if (pot.growthStage !== GrowthStage.EMPTY && needs) {
            const needLevels = [
                { type: 'water_to_pot', value: needs.water, tool: wateringCan },
                { type: 'food_to_pot', value: needs.food, tool: fertilizerBag },
                { type: 'sun_to_pot', value: needs.sun, tool: sunArea }
            ];

            // Find lowest need below 50%
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
     * Update hint arrows based on player idle times
     */
    updateHints(deltaTime) {
        const zones = this.gameMode === 'competitive' ? [1, 2] : ['shared'];

        for (const zone of zones) {
            const arrow = this.hintArrows.get(zone);
            if (!arrow) continue;

            // Determine idle time for this zone
            let idleTime;
            if (this.gameMode === 'competitive') {
                idleTime = this.hintPlayerIdleTime.get(zone) || 0;
            } else {
                // Coop/solo: hint only if ALL tracked players are idle
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
     * Show golden watering can for a player
     */
    showGoldenWateringCan(playerId) {
        if (this.gameMode !== 'competitive') return;

        let goldenCanX, goldenCanY;

        if (playerId === 1) {
            goldenCanX = this.dividerX + (this.canvas.width - this.dividerX) / 2;
            goldenCanY = this.canvas.height / 2;
        } else if (playerId === 2) {
            goldenCanX = this.dividerX / 2;
            goldenCanY = this.canvas.height / 2;
        }

        const goldenCan = new WateringCan(goldenCanX, goldenCanY, this.canvas, true);
        this.goldenWateringCans.set(playerId, goldenCan);
    }

    /**
     * Spawn confetti particles
     */
    spawnConfetti(x, y, count = 50) {
        for (let i = 0; i < count; i++) {
            this.confettiParticles.push(new ConfettiParticle(x, y));
        }
    }

    /**
     * Update all garden elements
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
            // Continue other updates even when timer is paused
        }

        // Update needs and plant growth
        if (this.gameMode === 'competitive') {
            for (let i = 0; i < this.plantPots.length; i++) {
                const pot = this.plantPots[i];
                const playerId = i + 1;
                const needs = this.plantNeedsMap.get(playerId);

                if (pot.growthStage !== GrowthStage.EMPTY && needs) {
                    needs.update(deltaTime);
                    const satisfaction = needs.getAverageSatisfaction();
                    pot.updateGrowth(satisfaction, deltaTime);
                    // Sync water level to pot
                    pot.waterLevelTarget = needs.water;
                }
                pot.update(deltaTime);
            }
        } else {
            // Co-op/single player — update needs once, then apply to all pots
            let needsUpdated = false;
            for (const pot of this.plantPots) {
                if (pot.growthStage !== GrowthStage.EMPTY) {
                    if (!needsUpdated) {
                        this.plantNeeds.update(deltaTime);
                        needsUpdated = true;
                    }
                    const satisfaction = this.plantNeeds.getAverageSatisfaction();
                    pot.updateGrowth(satisfaction, deltaTime);
                    // Sync water level to pot
                    pot.waterLevelTarget = this.plantNeeds.water;
                }
                pot.update(deltaTime);
            }
        }

        // Update sun areas
        if (this.gameMode === 'competitive') {
            this.sunAreasMap.forEach(sunArea => sunArea.update(deltaTime));
        } else {
            this.sunArea.update(deltaTime);
        }

        // Update watering cans
        if (this.gameMode === 'competitive') {
            this.wateringCansMap.forEach(can => can.update(deltaTime));
        } else {
            this.wateringCan.update(deltaTime);
        }

        // Update golden watering cans
        this.goldenWateringCans.forEach(can => can.update(deltaTime));

        // Update magic pumpkin (co-op only)
        if (this.magicPumpkin) {
            this.magicPumpkin.update(deltaTime);

            // Spawn pumpkin periodically
            if (!this.magicPumpkin.visible && !this.timerPaused) {
                this.pumpkinSpawnTimer += deltaTime;
                if (this.pumpkinSpawnTimer >= this.pumpkinSpawnInterval) {
                    this.magicPumpkin.show();
                    this.pumpkinSpawnTimer = 0;
                    this.pumpkinSpawnInterval = 30 + Math.random() * 15; // 30-45 seconds
                }
            }
        }

        // Update confetti particles
        this.confettiParticles.forEach(particle => particle.update(deltaTime));
        this.confettiParticles = this.confettiParticles.filter(p => !p.isDead());

        // Update hint arrows
        this.updateHints(deltaTime);
    }

    /**
     * Handle hand interactions with per-player routing
     */
    checkCollisions(handPositions) {
        const harvestedPlants = [];

        if (!handPositions || handPositions.length === 0) {
            // Release any held items
            if (this.gameMode === 'competitive') {
                this.heldItemsMap.forEach((item, playerId) => {
                    if (item) {
                        this.releaseItem(playerId);
                    }
                });
            } else {
                if (this.heldItem) {
                    this.releaseItem();
                }
            }

            // Clear pumpkin touches
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

        if (this.gameMode === 'competitive') {
            // Process each player's hands in their zone
            handsByPlayer.forEach((hands, playerId) => {
                hands.forEach(hand => {
                    const zoneOwner = this.getZoneOwner(hand.x);
                    const effectivePlayerId = zoneOwner; // Cross-zone assist

                    const result = this.processHandInteraction(hand, effectivePlayerId);
                    if (result) {
                        harvestedPlants.push({ plantKey: result, playerId: effectivePlayerId });
                    }
                });
            });
        } else {
            // Solo/co-op - group all collision points by hand
            const handGroups = new Map();
            handPositions.forEach(pos => {
                const handKey = pos.isLeft ? 'left' : 'right';
                if (!handGroups.has(handKey)) {
                    handGroups.set(handKey, []);
                }
                handGroups.get(handKey).push(pos);
            });

            // Release held item if the holding hand disappeared
            if (this.heldItem && this.heldItemHand && !handGroups.has(this.heldItemHand)) {
                this.releaseItem();
            }

            handGroups.forEach((points, handKey) => {
                // If another hand is holding an item, only allow free-hand interactions
                if (this.heldItem && this.heldItemHand && this.heldItemHand !== handKey) {
                    points.forEach(hand => {
                        const result = this.processFreeHandInteraction(hand);
                        if (result) {
                            harvestedPlants.push({ plantKey: result, playerId: hand.playerId || 1 });
                        }
                    });
                    return;
                }

                points.forEach(hand => {
                    const result = this.processHandInteraction(hand, 'shared');
                    if (result) {
                        harvestedPlants.push({ plantKey: result, playerId: hand.playerId || 1 });
                    }
                });

                // Track which hand grabbed the item
                if (this.heldItem && !this.heldItemHand) {
                    this.heldItemHand = handKey;
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

                // Activate if both players touching
                if (this.magicPumpkin.playerstouching.size >= 2) {
                    this.magicPumpkin.activate();
                    this.pumpkinActivated = true;
                    this.timerPaused = true;
                    this.timerPauseDuration = 3; // 3 seconds
                    this.spawnConfetti(this.magicPumpkin.x, this.magicPumpkin.y, 80);
                }
            }
        }

        return harvestedPlants;
    }

    /**
     * Get zone owner based on x position (competitive mode)
     */
    getZoneOwner(x) {
        if (!this.dividerX) return 1;
        return x > this.dividerX ? 1 : 2;
    }

    /**
     * Process a single hand interaction
     */
    processHandInteraction(handPos, zoneKey) {
        let harvested = null;

        // Get zone-specific items
        const seed = this.seedsMap.get(zoneKey) || this.seed;
        const wateringCan = this.wateringCansMap.get(zoneKey) || this.wateringCan;
        const fertilizerBag = this.fertilizerBagsMap.get(zoneKey) || this.fertilizerBag;
        const sunArea = this.sunAreasMap.get(zoneKey) || this.sunArea;
        const plantNeeds = this.plantNeedsMap.get(zoneKey) || this.plantNeeds;

        let heldItem = this.gameMode === 'competitive'
            ? this.heldItemsMap.get(zoneKey)
            : this.heldItem;

        // Find relevant pot
        let targetPot = this.plantPot;
        if (this.gameMode === 'competitive') {
            targetPot = this.plantPots[zoneKey - 1];
        } else {
            // Find closest pot in co-op
            let minDist = Infinity;
            this.plantPots.forEach(pot => {
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

        // Check golden watering can (competitive only)
        if (this.gameMode === 'competitive') {
            const goldenCan = this.goldenWateringCans.get(zoneKey);
            if (goldenCan && goldenCan.isPointOver(handPos.x, handPos.y)) {
                if (!heldItem) {
                    goldenCan.pickup();
                    heldItem = goldenCan;
                    this.heldItemsMap.set(zoneKey, heldItem);
                }
            }
        }

        // Held items track the index fingertip only (landmark 8)
        // Other collision points still detect pickups below
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
                    if (this.gameMode === 'competitive') {
                        this.waterInteractionTimeMap.set(zoneKey, 0);
                    } else {
                        this.waterInteractionTime = 0;
                    }
                }
            }

            // Check for drop interactions
            if (heldItem === seed && targetPot && targetPot.isPointOver(handPos.x, handPos.y)) {
                // Drop seed in pot
                if (targetPot.plantSeed(seed.plantType)) {
                    seed.plant();
                    if (this.gameMode === 'competitive') {
                        this.heldItemsMap.set(zoneKey, null);
                    } else {
                        this.heldItem = null;
                        this.heldItemHand = null;
                    }
                    if (typeof audioManager !== 'undefined') {
                        audioManager.play('plant');
                    }

                    // Reset needs for new plant
                    if (this.gameMode === 'competitive') {
                        this.plantNeedsMap.set(zoneKey, new PlantNeeds());
                    } else {
                        this.plantNeeds = new PlantNeeds();
                        this.plantNeedsMap.set('shared', this.plantNeeds);
                    }

                    // Spawn new seed after delay (guarded)
                    setTimeout(() => { if (this.active) this.spawnNewSeed(zoneKey); }, 1000);
                }
            } else if (heldItem === wateringCan && targetPot && targetPot.isPointOver(handPos.x, handPos.y)) {
                // Water the plant — set tilt state
                wateringCan.isOverPot = true;
                wateringCan.targetPotRef = targetPot;

                const waterTime = this.gameMode === 'competitive'
                    ? (this.waterInteractionTimeMap.get(zoneKey) || 0)
                    : this.waterInteractionTime;

                const newWaterTime = waterTime + this.lastDeltaTime;

                // Update pour progress on both can and pot
                const progress = Math.min(1, newWaterTime / 0.3);
                wateringCan.pourProgress = progress;
                targetPot.isBeingWatered = true;
                targetPot.waterPourProgress = progress;

                if (newWaterTime > 0.3) {
                    plantNeeds.addWater();
                    wateringCan.water();
                    wateringCan.pourProgress = 0;
                    targetPot.waterPourProgress = 0;

                    if (this.gameMode === 'competitive') {
                        this.waterInteractionTimeMap.set(zoneKey, 0);
                    } else {
                        this.waterInteractionTime = 0;
                    }

                    if (typeof audioManager !== 'undefined') {
                        audioManager.play('water');
                    }
                } else {
                    if (this.gameMode === 'competitive') {
                        this.waterInteractionTimeMap.set(zoneKey, newWaterTime);
                    } else {
                        this.waterInteractionTime = newWaterTime;
                    }
                }
            } else if (heldItem === fertilizerBag && targetPot && targetPot.isPointOver(handPos.x, handPos.y)) {
                // Feed the plant
                const foodTime = this.gameMode === 'competitive'
                    ? (this.foodInteractionTimeMap.get(zoneKey) || 0)
                    : this.foodInteractionTime;

                const newFoodTime = foodTime + this.lastDeltaTime;

                if (newFoodTime > 0.5) {
                    plantNeeds.addFood();

                    if (this.gameMode === 'competitive') {
                        this.foodInteractionTimeMap.set(zoneKey, 0);
                    } else {
                        this.foodInteractionTime = 0;
                    }

                    if (typeof audioManager !== 'undefined') {
                        audioManager.play('plant');
                    }
                } else {
                    if (this.gameMode === 'competitive') {
                        this.foodInteractionTimeMap.set(zoneKey, newFoodTime);
                    } else {
                        this.foodInteractionTime = newFoodTime;
                    }
                }
            } else if (heldItem.isGolden && targetPot && targetPot.isPointOver(handPos.x, handPos.y)) {
                // Golden watering can - max all needs instantly
                plantNeeds.maxAll();
                this.goldenWateringCans.delete(zoneKey);
                this.heldItemsMap.set(zoneKey, null);

                if (typeof audioManager !== 'undefined') {
                    audioManager.play('water');
                }
            }
        }

        if (!heldItem) {
            // Try to pick something up (any collision point can trigger pickup)
            if (seed && !seed.isPlanted && seed.isPointOver(handPos.x, handPos.y)) {
                seed.pickup();
                heldItem = seed;
                if (this.gameMode === 'competitive') {
                    this.heldItemsMap.set(zoneKey, heldItem);
                } else {
                    this.heldItem = heldItem;
                }
            } else if (wateringCan && wateringCan.isPointOver(handPos.x, handPos.y)) {
                wateringCan.pickup();
                heldItem = wateringCan;
                if (this.gameMode === 'competitive') {
                    this.heldItemsMap.set(zoneKey, heldItem);
                } else {
                    this.heldItem = heldItem;
                }
            } else if (fertilizerBag && fertilizerBag.isPointOver(handPos.x, handPos.y)) {
                fertilizerBag.pickup();
                heldItem = fertilizerBag;
                if (this.gameMode === 'competitive') {
                    this.heldItemsMap.set(zoneKey, heldItem);
                } else {
                    this.heldItem = heldItem;
                }
            }

            // Sun interaction (just hover)
            if (sunArea && sunArea.isPointOver(handPos.x, handPos.y)) {
                const sunTime = this.gameMode === 'competitive'
                    ? (this.sunInteractionTimeMap.get(zoneKey) || 0)
                    : this.sunInteractionTime;

                const newSunTime = sunTime + this.lastDeltaTime;

                if (newSunTime > 0.2) {
                    plantNeeds.addSun();

                    if (this.gameMode === 'competitive') {
                        this.sunInteractionTimeMap.set(zoneKey, 0);
                    } else {
                        this.sunInteractionTime = 0;
                    }
                } else {
                    if (this.gameMode === 'competitive') {
                        this.sunInteractionTimeMap.set(zoneKey, newSunTime);
                    } else {
                        this.sunInteractionTime = newSunTime;
                    }
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

                    // Spawn new seed (guarded)
                    setTimeout(() => { if (this.active) this.spawnNewSeed(zoneKey); }, 500);
                }
            }
        }

        return harvested;
    }

    /**
     * Release currently held item
     */
    releaseItem(zoneKey = 'shared') {
        let heldItem = this.gameMode === 'competitive'
            ? this.heldItemsMap.get(zoneKey)
            : this.heldItem;

        if (heldItem) {
            // Clear pot watering state if dropping a watering can
            if (heldItem.targetPotRef) {
                heldItem.targetPotRef.isBeingWatered = false;
                heldItem.targetPotRef.waterPourProgress = 0;
                heldItem.targetPotRef = null;
            }

            heldItem.drop();

            // Return tools to home position
            const wateringCan = this.wateringCansMap.get(zoneKey) || this.wateringCan;
            const fertilizerBag = this.fertilizerBagsMap.get(zoneKey) || this.fertilizerBag;
            const seed = this.seedsMap.get(zoneKey) || this.seed;

            if (heldItem === wateringCan || heldItem === fertilizerBag) {
                heldItem.returnHome();
            } else if (heldItem === seed && !seed.isPlanted) {
                seed.returnHome();
            }

            // Check if it's a golden can
            if (heldItem.isGolden) {
                this.goldenWateringCans.delete(zoneKey);
            }

            if (this.gameMode === 'competitive') {
                this.heldItemsMap.set(zoneKey, null);
            } else {
                this.heldItem = null;
                this.heldItemHand = null;
            }
        }
    }

    /**
     * Process free-hand interactions (sun hover + harvest only, no pickup/movement)
     */
    processFreeHandInteraction(handPos) {
        // Sun interaction
        const sunArea = this.sunAreasMap.get('shared') || this.sunArea;
        if (sunArea && sunArea.isPointOver(handPos.x, handPos.y)) {
            this.sunInteractionTime += this.lastDeltaTime;
            if (this.sunInteractionTime > 0.2) {
                const plantNeeds = this.plantNeedsMap.get('shared') || this.plantNeeds;
                plantNeeds.addSun();
                this.sunInteractionTime = 0;
            }
        }

        // Harvest interaction
        let targetPot = this.plantPot;
        let minDist = Infinity;
        this.plantPots.forEach(pot => {
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
                setTimeout(() => { if (this.active) this.spawnNewSeed('shared'); }, 500);
                return harvestedPlant;
            }
        }

        return null;
    }

    /**
     * Draw the entire garden scene
     */
    draw(ctx) {
        // Draw divider if competitive mode
        if (this.gameMode === 'competitive' && this.dividerX) {
            this.drawDivider(ctx);
        }

        // Draw sun areas
        if (this.gameMode === 'competitive') {
            this.sunAreasMap.forEach(sunArea => sunArea.draw(ctx));
        } else {
            this.sunArea.draw(ctx);
        }

        // Draw plant pots
        this.plantPots.forEach(pot => pot.draw(ctx));

        // Draw seeds
        if (this.gameMode === 'competitive') {
            this.seedsMap.forEach(seed => {
                if (seed) seed.draw(ctx);
            });
        } else {
            if (this.seed) {
                this.seed.draw(ctx);
            }
        }

        // Draw tools
        if (this.gameMode === 'competitive') {
            this.wateringCansMap.forEach(can => can.draw(ctx));
            this.fertilizerBagsMap.forEach(bag => bag.draw(ctx));
        } else {
            this.wateringCan.draw(ctx);
            this.fertilizerBag.draw(ctx);
        }

        // Draw golden watering cans
        this.goldenWateringCans.forEach(can => can.draw(ctx));

        // Draw needs panels (vertically centered)
        const needsPanelHeight = 150; // spacing(40) * 3 + 30
        const needsY = Math.round(this.canvas.height / 2 - needsPanelHeight / 2 + 20);
        if (this.gameMode === 'competitive') {
            // Player 1 needs (right side)
            const p1Needs = this.plantNeedsMap.get(1);
            const p1Pot = this.plantPots[0];
            if (p1Pot && p1Pot.growthStage !== GrowthStage.EMPTY && p1Needs) {
                p1Needs.draw(ctx, this.canvas.width - 250, needsY);
            }

            // Player 2 needs (left side)
            const p2Needs = this.plantNeedsMap.get(2);
            const p2Pot = this.plantPots[1];
            if (p2Pot && p2Pot.growthStage !== GrowthStage.EMPTY && p2Needs) {
                p2Needs.draw(ctx, 30, needsY);
            }
        } else {
            // Shared needs
            const anyPotGrowing = this.plantPots.some(pot => pot.growthStage !== GrowthStage.EMPTY);
            if (anyPotGrowing) {
                this.plantNeeds.draw(ctx, 30, needsY);
            }
        }

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
     * Draw competitive mode divider
     */
    drawDivider(ctx) {
        ctx.save();

        // Dashed line
        ctx.setLineDash([15, 10]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 3;

        // Soft glow
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.moveTo(this.dividerX, 0);
        ctx.lineTo(this.dividerX, this.canvas.height);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        // Player labels
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';

        // Player 1 (right, warm orange)
        ctx.fillStyle = '#FF8C42';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        const p1X = this.dividerX + (this.canvas.width - this.dividerX) / 2;
        drawUnmirroredText(ctx, 'Player 1', p1X, 40, true);

        // Player 2 (left, cool blue)
        ctx.fillStyle = '#4A90E2';
        const p2X = this.dividerX / 2;
        drawUnmirroredText(ctx, 'Player 2', p2X, 40, true);

        ctx.restore();
    }

    /**
     * Draw helpful instructions
     */
    drawInstructions(ctx) {
        ctx.save();
        ctx.font = '18px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.textAlign = 'center';

        const anyPotEmpty = this.plantPots.some(pot => pot.growthStage === GrowthStage.EMPTY);
        const anyPotHarvestable = this.plantPots.some(pot => pot.growthStage === GrowthStage.HARVESTABLE);

        // Position at bottom of screen, inline with toolbar row
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
     * Clear the garden (for reset)
     */
    clear() {
        this.active = false;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height - 150; // Bottom toolbar row

        this.plantPots = [];
        this.plantPot = new PlantPot(centerX, centerY, this.canvas);
        this.plantPots.push(this.plantPot);

        this.plantNeeds = new PlantNeeds();
        this.plantNeedsMap.clear();
        this.plantNeedsMap.set('shared', this.plantNeeds);

        this.seed = null;
        this.heldItem = null;
        this.heldItemHand = null;
        this.seedsMap.clear();
        this.heldItemsMap.clear();

        this.spawnNewSeed('shared');

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
    }

    // Compatibility methods
    setDifficulty(level) {
        // Adjust depletion rates based on level
        const modifier = 1 + (level - 1) * 0.1;

        if (this.gameMode === 'competitive') {
            this.plantNeedsMap.forEach(needs => {
                needs.waterDepleteRate = 0.03 * modifier;
                needs.sunDepleteRate = 0.02 * modifier;
                needs.foodDepleteRate = 0.025 * modifier;
            });
        } else {
            this.plantNeeds.waterDepleteRate = 0.03 * modifier;
            this.plantNeeds.sunDepleteRate = 0.02 * modifier;
            this.plantNeeds.foodDepleteRate = 0.025 * modifier;
        }
    }

    getActiveSeedCount() {
        return this.plantPots.filter(pot => pot.growthStage !== GrowthStage.EMPTY).length;
    }
}
