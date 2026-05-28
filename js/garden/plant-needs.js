/**
 * Garden System - Plant Needs
 * Plant needs management for water and food. Sun is now a passive ambient
 * cycle handled by SunCycle; it no longer appears as a player-driven bar.
 */

/**
 * Plant needs management system
 */
class PlantNeeds {
    constructor() {
        // Need levels (0 to 1)
        this.water = 0.7;
        this.food = 0.6;

        // Display values for smooth lerp
        this.displayWater = 0.7;
        this.displayFood = 0.6;

        // Depletion rates per second
        this.waterDepleteRate = 0.03;
        this.foodDepleteRate = 0.025;

        // Pulse phase for critical needs
        this.pulsePhase = 0;

        // Feedback effects (floating +💧 etc.)
        this.feedbackEffects = [];
    }

    /**
     * Update needs (deplete over time)
     */
    update(deltaTime) {
        this.water = Math.max(0, this.water - this.waterDepleteRate * deltaTime);
        this.food = Math.max(0, this.food - this.foodDepleteRate * deltaTime);

        // Smooth lerp display values
        const lerpSpeed = 5;
        this.displayWater += (this.water - this.displayWater) * Math.min(1, lerpSpeed * deltaTime);
        this.displayFood += (this.food - this.displayFood) * Math.min(1, lerpSpeed * deltaTime);

        // Pulse phase for critical needs
        this.pulsePhase += deltaTime * 4;

        // Update feedback effects
        this.feedbackEffects.forEach(e => {
            e.y -= 30 * deltaTime;
            e.alpha -= deltaTime * 1.5;
            e.life += deltaTime;
        });
        this.feedbackEffects = this.feedbackEffects.filter(e => e.alpha > 0);
    }

    /**
     * Add water
     */
    addWater(amount = 0.15) {
        this.water = Math.min(1, this.water + amount);
        this.feedbackEffects.push({ icon: '+💧', x: 0, y: 0, alpha: 1, life: 0, type: 'water' });
    }

    /**
     * Add food/fertilizer
     */
    addFood(amount = 0.12) {
        this.food = Math.min(1, this.food + amount);
        this.feedbackEffects.push({ icon: '+🌱', x: 0, y: 0, alpha: 1, life: 0, type: 'food' });
    }

    /**
     * Max out all needs (for golden watering can)
     */
    maxAll() {
        this.water = 1;
        this.food = 1;
    }

    /**
     * Get average satisfaction level (water and food only)
     */
    getAverageSatisfaction() {
        return (this.water + this.food) / 2;
    }

    /**
     * Get color based on level
     */
    getBarColor(level) {
        if (level > 0.6) return '#4ade80'; // Green
        if (level > 0.3) return '#fbbf24'; // Yellow
        return '#ef4444'; // Red
    }

    /**
     * Draw needs bars (water and food only)
     */
    draw(ctx, x, y) {
        const barWidth = 150;
        const barHeight = 25;
        const spacing = 40;

        ctx.save();

        // Background panel — sized to contain icon (35px) + bar + padding
        const panelWidth = 35 + barWidth + 40; // icon offset + bar + right padding
        const panelHeight = spacing * 2 + 30;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.roundRect(x - 15, y - 15, panelWidth, panelHeight, 15);
        ctx.fill();

        // Title
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        drawUnmirroredText(ctx, 'Plant Needs', x + 5, y + 5);

        // Water bar
        this.drawBar(ctx, x, y + spacing, barWidth, barHeight, this.displayWater, this.water, '💧', 'Water');

        // Food bar
        this.drawBar(ctx, x, y + spacing * 2, barWidth, barHeight, this.displayFood, this.food, '🌱', 'Food');

        // Feedback effects
        this.feedbackEffects.forEach(e => {
            ctx.save();
            ctx.globalAlpha = e.alpha;
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            // Position relative to the bar it belongs to
            let effectY = y;
            if (e.type === 'water') effectY = y + spacing;
            else if (e.type === 'food') effectY = y + spacing * 2;
            drawUnmirroredText(ctx, e.icon, x + barWidth + 40, effectY + e.y);
            ctx.restore();
        });

        ctx.restore();
    }

    drawBar(ctx, x, y, width, height, displayLevel, actualLevel, icon, label) {
        // Icon
        ctx.font = '18px Arial';
        ctx.textAlign = 'left';
        drawUnmirroredText(ctx, icon, x, y + height / 2 + 6);

        // Bar background — pulse red if critical
        if (actualLevel < 0.3) {
            const pulseAlpha = 0.2 + 0.15 * Math.sin(this.pulsePhase);
            ctx.fillStyle = `rgba(239, 68, 68, ${pulseAlpha})`;
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        }
        ctx.beginPath();
        ctx.roundRect(x + 30, y, width, height, 5);
        ctx.fill();

        // Bar fill (smooth)
        const fillWidth = Math.max(0, width * displayLevel);
        if (fillWidth > 0) {
            ctx.fillStyle = this.getBarColor(actualLevel);
            ctx.beginPath();
            ctx.roundRect(x + 30, y, fillWidth, height, 5);
            ctx.fill();
        }

        // Bar border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x + 30, y, width, height, 5);
        ctx.stroke();

        // Label
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        drawUnmirroredText(ctx, label, x + 30 + width / 2, y + height / 2 + 4);
    }
}
