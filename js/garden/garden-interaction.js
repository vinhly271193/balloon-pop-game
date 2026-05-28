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

        // Pose pipeline: run grab/release logic from closed/open hand pose
        // before the collision-point loop so state is consistent this frame.
        if (typeof handTracker !== 'undefined' && handTracker.hands && handTracker.hands.length > 0) {
            for (const hand of handTracker.hands) {
                this._processPose(hand, deltaTime);
            }
        }

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
            if (gardenState.magicPumpkin) {
                const mp = gardenState.magicPumpkin;
                if (mp.visible && !mp.active) {
                    mp.playerstouching.clear();
                    handPositions.forEach(hand => {
                        if (mp.isPointOver(hand.x, hand.y)) {
                            mp.playerstouching.add(hand.playerId || 1);
                        }
                    });

                    if (mp.playerstouching.size >= 2) {
                        mp.activate();
                        gardenState.pumpkinActivated = true;
                        gardenState.timerPaused = true;
                        gardenState.timerPauseDuration = 3;
                        this._spawnConfetti(mp.x, mp.y, 80);
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

        // Check for power-up collection (competitive only, uses index fingertip).
        if (gardenState.mode === 'competitive' && handPos.landmarkIndex === 8) {
            const puPlayerId = zoneKey === 'p1' ? 1 : 2;
            const gb = typeof gardenBed !== 'undefined' ? gardenBed : null;
            const powerUp = gb && gb.activePowerUps.get(puPlayerId);
            if (powerUp && powerUp.active && !powerUp.collected) {
                if (powerUp.isPointOver(handPos.x, handPos.y)) {
                    powerUp.applyEffect(gb, puPlayerId);
                    if (!powerUp.active) {
                        gb.activePowerUps.delete(puPlayerId);
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
            // Held watering can over a pot triggers the tilt and pour-particle visual.
            // Water is still applied only on open-hand release via _tryRelease.
            if (heldItem instanceof WateringCan && !heldItem.isGolden) {
                const can = heldItem;
                const overPot = (zone.pots || []).find(p => p.isPointOver(handPos.x, handPos.y));
                if (overPot) {
                    can.isOverPot = true;
                    can.targetPotRef = overPot;
                } else {
                    can.isOverPot = false;
                    can.targetPotRef = null;
                    can.pourProgress = 0;
                }
            }

            heldItem.moveTo(handPos.x, handPos.y);

            if (heldItem.homeX != null && heldItem.homeY != null) {
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

    // ── Pose-driven grab and release ──────────────────────────────────

    /**
     * Run pose classification and edge detection for a single hand.
     * Calls _tryPickup on a 'grab' event and _tryRelease on a 'release' event.
     *
     * @param {{ handId: string, playerId: number, landmarks: Array }} hand
     * @param {number} deltaTime
     */
    _processPose(hand, deltaTime) {
        const prev = this._posePrev.get(hand.handId) || null;
        const curr = HandPose.classify(hand.landmarks, prev);
        const event = HandPose.getGrabEvent(prev, curr);
        this._posePrev.set(hand.handId, curr);
        if (!event) return;

        const zoneKey = gardenState.mode === 'competitive'
            ? (hand.playerId === 1 ? 'p1' : 'p2')
            : 'shared';

        // Use landmark 8 (index fingertip) as the interaction point.
        const tip = hand.landmarks[8];
        const canvas = handTracker.canvas;
        if (!canvas) return;
        const point = playZone.mapPoint(tip.x, tip.y, canvas.width, canvas.height);

        if (event === 'grab') {
            this._tryPickup(zoneKey, point);
        } else if (event === 'release') {
            this._tryRelease(zoneKey, point);
        }
    }

    /**
     * Attempt to pick up a tool at the given canvas point.
     * Sets zone.heldItem if a tool is found under the point.
     *
     * @param {string} zoneKey
     * @param {{ x: number, y: number }} point
     */
    _tryPickup(zoneKey, point) {
        const zone = gardenState.getZone(zoneKey);
        if (!zone) return;
        if (zone.heldItem) return;
        // Seed
        const seed = zone.tools.seed;
        if (seed && !seed.isPlanted && seed.isPointOver(point.x, point.y)) {
            seed.pickup();
            zone.heldItem = seed;
            return;
        }
        // Watering can
        if (zone.tools.wateringCan && zone.tools.wateringCan.isPointOver(point.x, point.y)) {
            zone.tools.wateringCan.pickup();
            zone.heldItem = zone.tools.wateringCan;
            return;
        }
        // Fertiliser bag
        if (zone.tools.fertilizerBag && zone.tools.fertilizerBag.isPointOver(point.x, point.y)) {
            zone.tools.fertilizerBag.pickup();
            zone.heldItem = zone.tools.fertilizerBag;
            return;
        }
        // Golden watering can (competitive rubber-band)
        if (zone.goldenWateringCan && zone.goldenWateringCan.isPointOver(point.x, point.y)) {
            zone.goldenWateringCan.pickup();
            zone.heldItem = zone.goldenWateringCan;
        }
    }

    /**
     * Release the currently held item. If the release point is over a plant pot,
     * apply the tool; otherwise the tool flies home.
     *
     * @param {string} zoneKey
     * @param {{ x: number, y: number }} point
     */
    _tryRelease(zoneKey, point) {
        const zone = gardenState.getZone(zoneKey);
        if (!zone) return;
        const held = zone.heldItem;
        if (!held) return;

        // Find a pot under the release point.
        const targetPot = zone.pots && zone.pots.find(p => p.isPointOver(point.x, point.y));

        if (targetPot) {
            if (held instanceof DraggableSeed && typeof targetPot.plantSeed === 'function') {
                const planted = targetPot.plantSeed(held.plantType);
                if (planted) {
                    if (typeof held.plant === 'function') held.plant();
                    zone.heldItem = null;
                    zone.heldItemHand = null;
                    if (typeof audioManager !== 'undefined') audioManager.play('plant');
                    if (typeof achievementManager !== 'undefined' && typeof achievementManager.recordToolUse === 'function') {
                        achievementManager.recordToolUse('seed');
                    }
                    // Reset needs and spawn a new seed.
                    zone.needs = new PlantNeeds();
                    const gen = gardenState.roundGeneration;
                    setTimeout(() => {
                        if (gardenState.roundGeneration === gen) {
                            const gb = typeof gardenBed !== 'undefined' ? gardenBed : null;
                            if (gb) gb.spawnNewSeed(zoneKey);
                        }
                    }, 1000);
                    return;
                }
                // Pot was not empty: fall through to release the seed without applying.
            }
            if (held.isGolden) {
                if (zone.needs && typeof zone.needs.maxAll === 'function') zone.needs.maxAll();
                zone.goldenWateringCan = null;
                zone.heldItem = null;
                zone.heldItemHand = null;
                if (typeof audioManager !== 'undefined') audioManager.play('water');
                return;
            }
            if (held instanceof WateringCan) {
                if (zone.needs && typeof zone.needs.addWater === 'function') zone.needs.addWater();
                if (typeof audioManager !== 'undefined') audioManager.play('water');
                if (typeof achievementManager !== 'undefined' && typeof achievementManager.recordToolUse === 'function') {
                    achievementManager.recordToolUse('watering_can');
                }
            } else if (held instanceof FertilizerBag) {
                if (zone.needs && typeof zone.needs.addFood === 'function') zone.needs.addFood();
                if (typeof audioManager !== 'undefined') audioManager.play('plant');
                if (typeof achievementManager !== 'undefined' && typeof achievementManager.recordToolUse === 'function') {
                    achievementManager.recordToolUse('fertilizer');
                }
            }
        }

        // Release the held item regardless: tool flies home, unplanted seed returns home.
        if (typeof held.returnHome === 'function') held.returnHome();
        zone.heldItem = null;
        zone.heldItemHand = null;
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

    /**
     * Spawn confetti particles into gardenState.confettiParticles.
     * @param {number} x
     * @param {number} y
     * @param {number} count
     */
    _spawnConfetti(x, y, count = 50) {
        for (let i = 0; i < count; i++) {
            gardenState.confettiParticles.push(new ConfettiParticle(x, y));
        }
    }
}

window.gardenInteraction = new GardenInteraction();
