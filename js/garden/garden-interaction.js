/**
 * Garden Interaction
 * Maps hand input to state changes on gardenState. Owns pickup, release,
 * apply, hover, and harvest. Reads gardenState; writes back via its methods.
 *
 * Phase 4 preserves the existing touch-to-pickup behaviour. Phase 5
 * swaps the entry point over to pose-driven grab and release.
 */

class GardenInteraction {
    constructor() {
        // Per-hand pose memory for Phase 5 (unused in this phase).
        this._posePrev = new Map(); // handId -> 'open' | 'closed' | null
    }

    /**
     * Top-level entry: process all hands for this frame.
     * Returns an array of harvested plant records (same shape as the old
     * checkCollisions return value) so game.js can score the frame.
     *
     * @param {number} deltaTime seconds since last frame
     * @param {Array} handPositions collision points from handTracker
     * @returns {Array<{plantKey, playerId, isTargetPlant, growTime}>}
     */
    process(deltaTime, handPositions) {
        const harvestedPlants = [];

        if (!handPositions || handPositions.length === 0) {
            // Release any held items when no hands are present.
            if (gardenState.mode === 'competitive') {
                for (const zk of gardenState.getAllZoneKeys()) {
                    const zone = gardenState.getZone(zk);
                    if (zone && zone.heldItem) {
                        this._releaseItem(zk);
                    }
                }
            } else {
                const zone = gardenState.getZone('shared');
                if (zone && zone.heldItem) {
                    this._releaseItem('shared');
                }
            }
            return harvestedPlants;
        }

        if (gardenState.mode === 'competitive') {
            handPositions.forEach(hand => {
                const ownerPlayerId = this._getZoneOwner(hand.x);
                const zoneKey = 'p' + ownerPlayerId;

                const result = this._processHand(hand, zoneKey, deltaTime);
                if (result) {
                    const isTargetPlant = typeof challengeManager !== 'undefined' &&
                        challengeManager.currentChallenge &&
                        challengeManager.getTargetPlants().includes(result);
                    const zone = gardenState.getZone(zoneKey);
                    const pot = zone ? zone.pots[0] : null;
                    harvestedPlants.push({
                        plantKey: result,
                        playerId: ownerPlayerId,
                        isTargetPlant,
                        growTime: pot && pot.plantedAt ? (Date.now() - pot.plantedAt) / 1000 : 30,
                    });
                }
            });
        } else {
            // Solo/co-op: group collision points by hand identity.
            const handGroups = new Map();
            handPositions.forEach(pos => {
                const handKey = pos.isLeft ? 'left' : 'right';
                if (!handGroups.has(handKey)) {
                    handGroups.set(handKey, []);
                }
                handGroups.get(handKey).push(pos);
            });

            const sharedZone = gardenState.getZone('shared');

            // Release held item if the hand that grabbed it has disappeared.
            if (sharedZone && sharedZone.heldItem && sharedZone.heldItemHand &&
                !handGroups.has(sharedZone.heldItemHand)) {
                this._releaseItem('shared');
            }

            handGroups.forEach((points, handKey) => {
                // If this hand is not the holding hand and an item is already held,
                // allow sun hover and harvest only (no pickup or movement).
                if (sharedZone && sharedZone.heldItem && sharedZone.heldItemHand &&
                    sharedZone.heldItemHand !== handKey) {
                    points.forEach(hand => {
                        const result = this._processFreeHand(hand, deltaTime);
                        if (result) {
                            const isTargetPlant = typeof challengeManager !== 'undefined' &&
                                challengeManager.currentChallenge &&
                                challengeManager.getTargetPlants().includes(result);
                            let closestPot = null, minDist = Infinity;
                            if (sharedZone) {
                                sharedZone.pots.forEach(p => {
                                    const d = Math.hypot(hand.x - p.x, hand.y - p.y);
                                    if (d < minDist) { minDist = d; closestPot = p; }
                                });
                            }
                            harvestedPlants.push({
                                plantKey: result,
                                playerId: hand.playerId || 1,
                                isTargetPlant,
                                growTime: closestPot && closestPot.plantedAt ? (Date.now() - closestPot.plantedAt) / 1000 : 30,
                            });
                        }
                    });
                    return;
                }

                points.forEach(hand => {
                    const result = this._processHand(hand, 'shared', deltaTime);
                    if (result) {
                        const isTargetPlant = typeof challengeManager !== 'undefined' &&
                            challengeManager.currentChallenge &&
                            challengeManager.getTargetPlants().includes(result);
                        let closestPot = null, minDist = Infinity;
                        if (sharedZone) {
                            sharedZone.pots.forEach(p => {
                                const d = Math.hypot(hand.x - p.x, hand.y - p.y);
                                if (d < minDist) { minDist = d; closestPot = p; }
                            });
                        }
                        harvestedPlants.push({
                            plantKey: result,
                            playerId: hand.playerId || 1,
                            isTargetPlant,
                            growTime: closestPot && closestPot.plantedAt ? (Date.now() - closestPot.plantedAt) / 1000 : 30,
                        });
                    }
                });

                // Track which hand grabbed the item.
                if (sharedZone && sharedZone.heldItem && !sharedZone.heldItemHand) {
                    sharedZone.heldItemHand = handKey;
                }
            });

            // Check magic pumpkin in co-op (both players must touch simultaneously).
            const gardenBedRef = typeof gardenBed !== 'undefined' ? gardenBed : null;
            if (gardenBedRef && gardenBedRef.magicPumpkin) {
                const mp = gardenBedRef.magicPumpkin;
                if (mp.visible && !mp.active) {
                    mp.playerstouching.clear();
                    handPositions.forEach(hand => {
                        if (mp.isPointOver(hand.x, hand.y)) {
                            mp.playerstouching.add(hand.playerId || 1);
                        }
                    });

                    if (mp.playerstouching.size >= 2) {
                        mp.activate();
                        gardenBedRef.pumpkinActivated = true;
                        gardenBedRef.timerPaused = true;
                        gardenBedRef.timerPauseDuration = 3;
                        gardenBedRef.spawnConfetti(mp.x, mp.y, 80);
                        if (typeof achievementManager !== 'undefined') achievementManager.recordMagicPumpkin();
                    }
                } else if (!mp.visible) {
                    mp.playerstouching.clear();
                }
            }
        }

        return harvestedPlants;
    }

    // ── Zone routing ─────────────────────────────────────────────────

    _zoneForHand(hand) {
        // 'shared' for solo and coop. 'p1'/'p2' for competitive based on hand.playerId.
        if (gardenState.mode !== 'competitive') return 'shared';
        return hand.playerId === 1 ? 'p1' : 'p2';
    }

    _getZoneOwner(x) {
        if (!gardenState.dividerX) return 1;
        return x > gardenState.dividerX ? 1 : 2;
    }

    // ── Core per-hand logic ───────────────────────────────────────────

    /**
     * Process a single hand against a zone.
     * Contains the body of the former GardenBed.processHandInteraction.
     *
     * @param {{x, y, landmarkIndex, playerId, isLeft}} handPos
     * @param {string} zoneKey
     * @param {number} deltaTime
     * @returns {string|null} harvested plant key, or null
     */
    _processHand(handPos, zoneKey, deltaTime) {
        let harvested = null;

        const zone = gardenState.getZone(zoneKey);
        if (!zone) return harvested;

        const seed = zone.tools.seed;
        const wateringCan = zone.tools.wateringCan;
        const fertilizerBag = zone.tools.fertilizerBag;
        const sunArea = zone.tools.sunArea;
        const timers = zone.interactionTimers;
        // Read plantNeeds fresh each time to avoid stale reference after seed planting.
        const getPlantNeeds = () => zone.needs;

        let heldItem = zone.heldItem;

        // Find the nearest relevant pot.
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

        // Check golden watering can (competitive only).
        if (gardenState.mode === 'competitive') {
            const goldenCan = zone.goldenWateringCan;
            if (goldenCan && goldenCan.isPointOver(handPos.x, handPos.y)) {
                if (!heldItem) {
                    goldenCan.pickup();
                    heldItem = goldenCan;
                    zone.heldItem = heldItem;
                }
            }
        }

        // Check for power-up collection (competitive only, uses index fingertip).
        if (gardenState.mode === 'competitive' && handPos.landmarkIndex === 8) {
            const puPlayerId = zoneKey === 'p1' ? 1 : 2;
            const gardenBedRef = typeof gardenBed !== 'undefined' ? gardenBed : null;
            const powerUp = gardenBedRef && gardenBedRef.activePowerUps.get(puPlayerId);
            if (powerUp && powerUp.active && !powerUp.collected) {
                if (powerUp.isPointOver(handPos.x, handPos.y)) {
                    powerUp.applyEffect(gardenBedRef, puPlayerId);
                    if (!powerUp.active) {
                        gardenBedRef.activePowerUps.delete(puPlayerId);
                    }
                    if (typeof audioManager !== 'undefined') audioManager.play('harvest');
                    if (typeof game !== 'undefined' && game.achievementManager) {
                        game.achievementManager.recordPowerUp();
                    }
                    return harvested;
                }
            }
        }

        // Held items track the index fingertip only (landmark 8).
        const isIndexFinger = handPos.landmarkIndex === 8;

        if (heldItem && isIndexFinger) {
            heldItem.moveTo(handPos.x, handPos.y);

            // Reset watering can state if held but not confirmed over a pot.
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

            // Drop seed onto a pot.
            if (heldItem === seed && targetPot && targetPot.isPointOver(handPos.x, handPos.y)) {
                if (targetPot.plantSeed(seed.plantType)) {
                    seed.plant();
                    zone.heldItem = null;
                    zone.heldItemHand = null;

                    if (typeof audioManager !== 'undefined') {
                        audioManager.play('plant');
                    }

                    // Reset needs for the new plant.
                    zone.needs = new PlantNeeds();

                    // Spawn new seed after a short delay (guarded by generation counter).
                    const gen = gardenState.roundGeneration;
                    const zk = zoneKey;
                    setTimeout(() => {
                        if (gardenState.roundGeneration === gen) {
                            const gb = typeof gardenBed !== 'undefined' ? gardenBed : null;
                            if (gb) gb.spawnNewSeed(zk);
                        }
                    }, 1000);
                }
            } else if (heldItem === wateringCan && targetPot && targetPot.isPointOver(handPos.x, handPos.y)) {
                wateringCan.isOverPot = true;
                wateringCan.targetPotRef = targetPot;

                const waterTime = timers.water;
                const newWaterTime = waterTime + deltaTime;

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
                const newFoodTime = foodTime + deltaTime;

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
                    this._releaseItem(zoneKey);
                    heldItem = null;
                    if (typeof audioManager !== 'undefined') {
                        audioManager.play('plant');
                    }
                }
            }
        }

        if (!heldItem) {
            // Try to pick something up (any collision point can trigger pickup).
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

            // Sun hover (accumulated dwell, no pickup required).
            if (sunArea && sunArea.isPointOver(handPos.x, handPos.y)) {
                const sunTime = timers.sun;
                const newSunTime = sunTime + deltaTime;

                if (newSunTime > 0.2) {
                    getPlantNeeds().addSun();
                    timers.sun = 0;
                    if (typeof achievementManager !== 'undefined') achievementManager.recordToolUse('sun');
                } else {
                    timers.sun = newSunTime;
                }
            }

            // Check for harvest.
            if (targetPot && targetPot.growthStage === GrowthStage.HARVESTABLE &&
                targetPot.isPointOver(handPos.x, handPos.y)) {
                const harvestedPlant = targetPot.harvest();
                if (harvestedPlant) {
                    harvested = harvestedPlant;
                    if (typeof audioManager !== 'undefined') {
                        audioManager.play('harvest');
                    }

                    const gen = gardenState.roundGeneration;
                    const zk = zoneKey;
                    setTimeout(() => {
                        if (gardenState.roundGeneration === gen) {
                            const gb = typeof gardenBed !== 'undefined' ? gardenBed : null;
                            if (gb) gb.spawnNewSeed(zk);
                        }
                    }, 500);
                }
            }
        }

        return harvested;
    }

    /**
     * Process a hand that is not the holding hand: sun hover and harvest only.
     * Contains the body of the former GardenBed.processFreeHandInteraction.
     *
     * @param {{x, y}} handPos
     * @param {number} deltaTime
     * @returns {string|null} harvested plant key, or null
     */
    _processFreeHand(handPos, deltaTime) {
        const zone = gardenState.getZone('shared');
        if (!zone) return null;

        const sunArea = zone.tools.sunArea;
        if (sunArea && sunArea.isPointOver(handPos.x, handPos.y)) {
            zone.interactionTimers.sun += deltaTime;
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
                setTimeout(() => {
                    if (gardenState.roundGeneration === gen) {
                        const gb = typeof gardenBed !== 'undefined' ? gardenBed : null;
                        if (gb) gb.spawnNewSeed('shared');
                    }
                }, 500);
                return harvestedPlant;
            }
        }

        return null;
    }

    // ── Release helper ────────────────────────────────────────────────

    /**
     * Release the held item in a zone: drop it, clear pot references, return tool home.
     * Contains the body of the former GardenBed.releaseItem.
     *
     * @param {string} zoneKey
     */
    _releaseItem(zoneKey = 'shared') {
        const zone = gardenState.getZone(zoneKey);
        if (!zone) return;

        const heldItem = zone.heldItem;
        if (!heldItem) return;

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
            zone.goldenWateringCan = null;
        }

        zone.heldItem = null;
        zone.heldItemHand = null;
    }
}

window.gardenInteraction = new GardenInteraction();
