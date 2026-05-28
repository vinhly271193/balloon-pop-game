/**
 * Garden Renderer
 * Draws the full garden scene each frame. Reads from gardenState and gardenBed.
 * Writes nothing back.
 *
 * Draw order (back to front):
 *  0. Sky gradient + sun sprite (sunCycle)
 *  1. Competitive divider (when mode === 'competitive')
 *  2. Plant pots and plants per zone
 *  3. Seeds and tools at home positions per zone
 *  4. Golden watering cans per zone
 *  5. Active power-ups
 *  6. Needs bars per zone (only when a pot is growing)
 *  7. Return-to-home beacons for held items
 *  8. Magic pumpkin (co-op only)
 *  9. Confetti particles
 * 10. Hint arrows
 * 11. Instructions
 */

class GardenRenderer {
    /**
     * Draw the full garden scene.
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        // Sky gradient
        if (typeof sunCycle !== 'undefined') {
            ctx.save();
            ctx.fillStyle = sunCycle.getSkyGradient(ctx, ctx.canvas.width, ctx.canvas.height);
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();

            // Sun sprite
            const sun = sunCycle.getSunPosition(ctx.canvas.width, ctx.canvas.height);
            ctx.save();
            const grad = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, sun.radius * 2);
            grad.addColorStop(0, 'rgba(255, 240, 180, 0.95)');
            grad.addColorStop(0.5, 'rgba(255, 210, 120, 0.6)');
            grad.addColorStop(1, 'rgba(255, 180, 80, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(sun.x, sun.y, sun.radius * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255, 240, 180, 1)';
            ctx.beginPath();
            ctx.arc(sun.x, sun.y, sun.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        if (gardenState.mode === 'competitive' && gardenState.dividerX) {
            this._drawDivider(ctx);
        }

        // Plant pots (all zones)
        for (const zk of gardenBed.getZoneKeys()) {
            const zone = gardenState.getZone(zk);
            if (zone) zone.pots.forEach(pot => pot.draw(ctx));
        }

        // Seeds and tools at home positions (per zone)
        for (const zk of gardenBed.getZoneKeys()) {
            const seed = gardenBed.getZoneSeed(zk);
            if (seed) seed.draw(ctx);
            const wateringCan = gardenBed.getZoneWateringCan(zk);
            if (wateringCan) wateringCan.draw(ctx);
            const fertilizerBag = gardenBed.getZoneFertilizer(zk);
            if (fertilizerBag) fertilizerBag.draw(ctx);
        }

        // Golden watering cans (zone-level source of truth)
        for (const zk of gardenState.getAllZoneKeys()) {
            const can = gardenState.getZone(zk).goldenWateringCan;
            if (can) can.draw(ctx);
        }

        // Active power-ups
        gardenBed.activePowerUps.forEach(pu => pu.draw(ctx));

        // Needs bars per zone (only when a pot is growing)
        this._drawNeedsBars(ctx);

        // Return-to-home beacons for held items
        this._drawReturnBeacons(ctx);

        // Magic pumpkin (co-op only)
        if (gardenBed.magicPumpkin) {
            gardenBed.magicPumpkin.draw(ctx);
        }

        // Confetti particles
        gardenBed.confettiParticles.forEach(particle => particle.draw(ctx));

        // Hint arrows
        gardenBed.hintArrows.forEach(arrow => arrow.draw(ctx));

        // Instructions
        this._drawInstructions(ctx);
    }

    // ── Private helpers ─────────────────────────────────────────────

    /**
     * Draw the competitive mode divider line and player labels.
     * @param {CanvasRenderingContext2D} ctx
     */
    _drawDivider(ctx) {
        ctx.save();

        ctx.setLineDash([15, 10]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 3;

        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.moveTo(gardenState.dividerX, 0);
        ctx.lineTo(gardenState.dividerX, ctx.canvas.height);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';

        ctx.fillStyle = '#FF8C42';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        const p1X = gardenState.dividerX + (ctx.canvas.width - gardenState.dividerX) / 2;
        drawUnmirroredText(ctx, 'Player 1', p1X, 40, true);

        ctx.fillStyle = '#4A90D9';
        const p2X = gardenState.dividerX / 2;
        drawUnmirroredText(ctx, 'Player 2', p2X, 40, true);

        ctx.restore();
    }

    /**
     * Draw the needs bars for each zone.
     * Panel is vertically centred; x position depends on mode and zone key.
     * @param {CanvasRenderingContext2D} ctx
     */
    _drawNeedsBars(ctx) {
        // Panel height = spacing * 2 + 30, where spacing = 40 (two bars: water + fertiliser).
        const needsPanelHeight = 110;
        const needsY = Math.round(ctx.canvas.height / 2 - needsPanelHeight / 2 + 20);
        const needsXPositions = gardenState.mode === 'competitive'
            ? { p1: ctx.canvas.width - 250, p2: 30 }
            : { shared: 30 };

        for (const zk of gardenBed.getZoneKeys()) {
            const pot = gardenBed.getZonePot(zk);
            const needs = gardenBed.getZoneNeeds(zk);
            if (!pot || !needs) continue;

            const zone = gardenState.getZone(zk);
            const isGrowing = gardenState.mode === 'competitive'
                ? pot.growthStage !== GrowthStage.EMPTY
                : zone && zone.pots.some(p => p.growthStage !== GrowthStage.EMPTY);

            if (isGrowing) {
                needs.draw(ctx, needsXPositions[zk], needsY);
            }
        }
    }

    /**
     * Draw pulsing return-to-home beacons when an item is held.
     * Reads returnBeaconPulse from gardenBed.
     * @param {CanvasRenderingContext2D} ctx
     */
    _drawReturnBeacons(ctx) {
        for (const zk of gardenBed.getZoneKeys()) {
            const zone = gardenState.getZone(zk);
            if (!zone) continue;

            const heldItem = zone.heldItem;
            if (!heldItem || heldItem.homeX == null || heldItem.homeY == null) continue;

            const hx = heldItem.homeX;
            const hy = heldItem.homeY;
            const pulse = 0.5 + 0.5 * Math.sin(gardenBed.returnBeaconPulse);

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
            drawUnmirroredText(ctx, '\u21A9', hx, hy);

            ctx.restore();
        }
    }

    /**
     * Draw contextual instruction text at the bottom of the canvas.
     * @param {CanvasRenderingContext2D} ctx
     */
    _drawInstructions(ctx) {
        ctx.save();
        ctx.font = '18px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.textAlign = 'center';

        let anyPotEmpty = false;
        let anyPotHarvestable = false;
        for (const zk of gardenBed.getZoneKeys()) {
            const zone = gardenState.getZone(zk);
            if (!zone) continue;
            if (zone.pots.some(pot => pot.growthStage === GrowthStage.EMPTY)) anyPotEmpty = true;
            if (zone.pots.some(pot => pot.growthStage === GrowthStage.HARVESTABLE)) anyPotHarvestable = true;
        }

        const instructionY = ctx.canvas.height - 60;

        if (anyPotEmpty) {
            drawUnmirroredText(ctx, 'Pick up the seed and drop it in the pot!', ctx.canvas.width / 2, instructionY);
        } else if (anyPotHarvestable) {
            drawUnmirroredText(ctx, 'Your plant is ready! Touch it to harvest!', ctx.canvas.width / 2, instructionY);
        } else {
            drawUnmirroredText(ctx, 'Keep your plant healthy - water it and give it food!', ctx.canvas.width / 2, instructionY);
        }

        ctx.restore();
    }
}

window.gardenRenderer = new GardenRenderer();
