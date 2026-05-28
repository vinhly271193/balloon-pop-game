/**
 * Garden Bed
 * Thin coordinator. Ticks state, hands off interaction to gardenInteraction,
 * and delegates all rendering to gardenRenderer.
 *
 * Holds the public surface that the rest of the codebase calls into.
 * activePowerUps and powerUpCooldown stay here because dda.js reads them directly.
 */

class GardenBed {
    constructor(canvas) {
        this.canvas = canvas;
        this.currentSeedIndex = 0;
        this.activePowerUps = new Map(); // dda.js reads this directly
        this.powerUpCooldown = 0;
        gardenState.setMode('coop', 1);
        this._setupCoopZone(1);
    }

    // Proxy accessors: external code reading gardenBed.X still works.
    get gameMode()        { return gardenState.mode; }
    set gameMode(v)       { gardenState.mode = v; }
    get playerCount()     { return gardenState.playerCount; }
    set playerCount(v)    { gardenState.playerCount = v; }
    get dividerX()        { return gardenState.dividerX; }
    set dividerX(v)       { gardenState.dividerX = v; }
    get roundGeneration() { return gardenState.roundGeneration; }

    // Zone helpers called by power-ups.js and garden-renderer.js.
    getZoneKeys() { return gardenState.mode === 'competitive' ? ['p1', 'p2'] : ['shared']; }
    getZoneNeeds(zk) { const z = gardenState.getZone(zk); return z ? z.needs : null; }
    getZonePot(zk) {
        const key = gardenState.mode === 'competitive' ? zk : 'shared';
        const z = gardenState.getZone(key); return z ? z.pots[0] : null;
    }
    getZoneSeed(zk) { const z = gardenState.getZone(zk); return z ? z.tools.seed : null; }
    getZoneWateringCan(zk) { const z = gardenState.getZone(zk); return z ? z.tools.wateringCan : null; }
    getZoneFertilizer(zk) { const z = gardenState.getZone(zk); return z ? z.tools.fertilizerBag : null; }

    // Zone initialisation.
    _setupCoopZone(playerCount) {
        const { width: cw, height: ch } = this.canvas;
        const potCount = playerCount === 2 ? 2 : 3;
        const spacing = cw / (potCount + 1);
        const pots = Array.from({ length: potCount }, (_, i) => new PlantPot(spacing * (i + 1), ch - 150, this.canvas));
        gardenState.initZone('shared', {
            pots,
            tools: {
                seed: null,
                wateringCan: new WateringCan(cw - 150, ch - 150, this.canvas),
                fertilizerBag: new FertilizerBag(150, ch - 150, this.canvas),
            },
            needs: new PlantNeeds(),
        });
        this.spawnNewSeed('shared');
    }

    _setupCompetitiveZones() {
        const { width: cw, height: ch } = this.canvas;
        const divX = gardenState.dividerX;
        gardenState.initZone('p1', {
            pots: [new PlantPot(divX + (cw - divX) / 2, ch - 150, this.canvas)],
            tools: { seed: null, wateringCan: new WateringCan(cw - 100, ch - 150, this.canvas), fertilizerBag: new FertilizerBag(divX + 80, ch - 150, this.canvas) },
            needs: new PlantNeeds(),
        });
        gardenState.initZone('p2', {
            pots: [new PlantPot(divX / 2, ch - 150, this.canvas)],
            tools: { seed: null, wateringCan: new WateringCan(100, ch - 150, this.canvas), fertilizerBag: new FertilizerBag(divX - 80, ch - 150, this.canvas) },
            needs: new PlantNeeds(),
        });
        this.spawnNewSeed('p1');
        this.spawnNewSeed('p2');
    }

    // Public API called by game.js, dda.js, power-ups.js.
    configure({ playerCount, gameMode, dividerX }) {
        gardenState.reset();
        gardenState.setMode(gameMode || 'coop', playerCount || 1);
        gardenState.dividerX = dividerX || null;
        if (gardenState.mode === 'competitive' && gardenState.dividerX) {
            this._setupCompetitiveZones();
        } else {
            this._setupCoopZone(gardenState.playerCount);
        }
        gardenState.magicPumpkin = (gardenState.mode === 'coop' && gardenState.playerCount === 2)
            ? new MagicPumpkin(this.canvas) : null;
        gardenState.pumpkinSpawnTimer = 0;
    }

    spawnNewSeed(zoneKey = 'shared') {
        let plantType;
        if (typeof game !== 'undefined' && game.getWeightedRandomPlant) {
            plantType = game.getWeightedRandomPlant();
        } else {
            const types = Object.keys(PLANT_TYPES);
            plantType = types[this.currentSeedIndex++ % types.length];
        }
        const divX = gardenState.dividerX;
        const seedX = gardenState.mode === 'competitive'
            ? (zoneKey === 'p1' ? divX + (this.canvas.width - divX) / 2 : divX / 2)
            : this.canvas.width / 2;
        const zone = gardenState.getZone(zoneKey);
        if (zone) zone.tools.seed = new DraggableSeed(seedX, 100, plantType, this.canvas);
    }

    applyDDA(playerId, { seedSpeed, hitBoxMultiplier }) {
        const zk = gardenState.mode === 'competitive' ? ('p' + playerId) : 'shared';
        if (gardenState.mode !== 'competitive' && playerId !== 1) return;
        const pot = this.getZonePot(zk); if (pot) pot.hitRadius = 80 * hitBoxMultiplier;
        const wc  = this.getZoneWateringCan(zk); if (wc) wc.hitRadius = 60 * hitBoxMultiplier;
        const fb  = this.getZoneFertilizer(zk); if (fb) fb.hitRadius = 50 * hitBoxMultiplier;
        const sd  = this.getZoneSeed(zk); if (sd) sd.hitRadius = 50 * hitBoxMultiplier;
        const nd  = this.getZoneNeeds(zk);
        if (nd) { nd.waterDepleteRate = 0.03 * seedSpeed; nd.foodDepleteRate = 0.025 * seedSpeed; }
    }

    setPlayerIdleTime(playerId, idleTime) { gardenState.hintPlayerIdleTime.set(playerId, idleTime); }

    showGoldenWateringCan(playerId) {
        if (gardenState.mode !== 'competitive') return;
        const zone = gardenState.getZone('p' + playerId);
        const x = playerId === 1
            ? gardenState.dividerX + (this.canvas.width - gardenState.dividerX) / 2
            : gardenState.dividerX / 2;
        if (zone) zone.goldenWateringCan = new WateringCan(x, this.canvas.height / 2, this.canvas, true);
    }

    showPowerUp(playerId) {
        if (this.activePowerUps.has(playerId)) return;
        const types = [InstantGrowth, DoublePoints, RainShower];
        const x = playerId === 1 ? this.canvas.width * 0.75 : this.canvas.width * 0.25;
        const y = this.canvas.height * 0.3 + Math.random() * this.canvas.height * 0.3;
        this.activePowerUps.set(playerId, new types[Math.floor(Math.random() * types.length)](x, y, this.canvas));
    }

    spawnConfetti(x, y, count = 50) {
        for (let i = 0; i < count; i++) gardenState.confettiParticles.push(new ConfettiParticle(x, y));
    }

    update(deltaTime) {
        gardenState.lastDeltaTime = deltaTime;

        if (gardenState.timerPaused) {
            gardenState.timerPauseDuration -= deltaTime;
            if (gardenState.timerPauseDuration <= 0) { gardenState.timerPaused = false; gardenState.timerPauseDuration = 0; }
        }

        const growthMult = typeof sunCycle !== 'undefined' ? sunCycle.getGrowthMultiplier() : 1;

        for (const zk of this.getZoneKeys()) {
            const zone = gardenState.getZone(zk);
            if (!zone) continue;
            if (gardenState.mode === 'competitive') {
                const pot = zone.pots[0];
                if (pot.growthStage !== GrowthStage.EMPTY && zone.needs) {
                    zone.needs.update(deltaTime);
                    pot.updateGrowth(zone.needs.getAverageSatisfaction(), deltaTime, growthMult);
                    pot.waterLevelTarget = zone.needs.water;
                }
                pot.update(deltaTime, zone.needs);
            } else {
                let needsUpdated = false;
                for (const pot of zone.pots) {
                    if (pot.growthStage !== GrowthStage.EMPTY) {
                        if (!needsUpdated) { zone.needs.update(deltaTime); needsUpdated = true; }
                        pot.updateGrowth(zone.needs.getAverageSatisfaction(), deltaTime, growthMult);
                        pot.waterLevelTarget = zone.needs.water;
                    }
                    pot.update(deltaTime, zone.needs);
                }
            }
            this.getZoneWateringCan(zk).update(deltaTime);
            if (zone.goldenWateringCan) zone.goldenWateringCan.update(deltaTime);
        }

        this.activePowerUps.forEach((pu, pid) => { pu.update(deltaTime); if (!pu.active) this.activePowerUps.delete(pid); });
        if (this.powerUpCooldown > 0) this.powerUpCooldown -= deltaTime;

        if (gardenState.magicPumpkin) {
            gardenState.magicPumpkin.update(deltaTime);
            if (!gardenState.magicPumpkin.visible && !gardenState.timerPaused) {
                gardenState.pumpkinSpawnTimer += deltaTime;
                if (gardenState.pumpkinSpawnTimer >= gardenState.pumpkinSpawnInterval) {
                    gardenState.magicPumpkin.show();
                    gardenState.pumpkinSpawnTimer = 0;
                    gardenState.pumpkinSpawnInterval = 30 + Math.random() * 15;
                }
            }
        }

        gardenState.confettiParticles.forEach(p => p.update(deltaTime));
        gardenState.confettiParticles = gardenState.confettiParticles.filter(p => !p.isDead());
        gardenState.returnBeaconPulse += deltaTime * 3;
    }

    checkCollisions(handPositions) {
        if ((!handPositions || handPositions.length === 0) && gardenState.magicPumpkin) {
            gardenState.magicPumpkin.playerstouching.clear();
        }
        return gardenInteraction.process(gardenState.lastDeltaTime, handPositions);
    }

    draw(ctx) { gardenRenderer.draw(ctx, gardenState.lastDeltaTime); }

    clear() {
        gardenState.reset();
        this._setupCoopZone(gardenState.playerCount || 1);
        gardenState.confettiParticles = [];
        gardenState.pumpkinActivated = false;
        gardenState.timerPaused = false;
        gardenState.timerPauseDuration = 0;
        if (gardenState.magicPumpkin) { gardenState.magicPumpkin.hide(); gardenState.pumpkinSpawnTimer = 0; }
        gardenState.hintArrows.forEach(arrow => arrow.reset());
        gardenState.hintPlayerIdleTime.clear();
        this.activePowerUps.clear();
        this.powerUpCooldown = 0;
    }

    setDifficulty(level) {
        const modifier = 1 + (level - 1) * 0.1;
        for (const zk of this.getZoneKeys()) {
            const nd = this.getZoneNeeds(zk);
            if (nd) { nd.waterDepleteRate = 0.03 * modifier; nd.foodDepleteRate = 0.025 * modifier; }
        }
    }
}
