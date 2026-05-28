/**
 * Garden Renderer
 * Draws the full garden scene each frame. Reads from gardenState and gardenBed.
 * Writes nothing back.
 *
 * Draw order (back to front):
 *  1. Competitive divider (when mode === 'competitive')
 *  2. Sun areas per zone
 *  3. Plant pots and plants per zone
 *  4. Seeds and tools at home positions per zone
 *  5. Golden watering cans per zone
 *  6. Active power-ups
 *  7. Needs bars per zone (only when a pot is growing)
 *  8. Return-to-home beacons for held items
 *  9. Magic pumpkin (co-op only)
 * 10. Confetti particles
 * 11. Hint arrows
 * 12. Instructions
 *
 * Phase 5 will replace steps 2 and 12 once sunCycle is fully wired.
 */

class GardenRenderer {
    /**
     * Draw the full garden scene.
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        if (gardenState.mode === 'competitive' && gardenState.dividerX) {
            this._drawDivider(ctx);
        }

        // Sun areas (per zone)
        for (const zk of gardenBed.getZoneKeys()) {
            const sunArea = gardenBed.getZoneSunArea(zk);
            if (sunArea) sunArea.draw(ctx);
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
        const needsPanelHeight = 150;
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
            drawUnmirroredText(ctx, 'Keep your plant healthy - water it, give it sun and food!', ctx.canvas.width / 2, instructionY);
        }

        ctx.restore();
    }
}

window.gardenRenderer = new GardenRenderer();
