/**
 * Garden System for Garden Grow Game
 * Plant nurturing gameplay with needs management
 */

// Plant type definitions
const PLANT_TYPES = {
    tomato: {
        name: 'TOMATO',
        seedColor: '#8B0000',
        plantColor: '#FF6347',
        stemColor: '#228B22',
        icon: '🍅'
    },
    sunflower: {
        name: 'SUNFLOWER',
        seedColor: '#8B4513',
        plantColor: '#FFD700',
        stemColor: '#228B22',
        icon: '🌻'
    },
    carrot: {
        name: 'CARROT',
        seedColor: '#D2691E',
        plantColor: '#FF8C00',
        stemColor: '#228B22',
        icon: '🥕'
    },
    lettuce: {
        name: 'LETTUCE',
        seedColor: '#556B2F',
        plantColor: '#90EE90',
        stemColor: '#228B22',
        icon: '🥬'
    },
    blueberry: {
        name: 'BLUEBERRY',
        seedColor: '#483D8B',
        plantColor: '#4169E1',
        stemColor: '#228B22',
        icon: '🫐'
    }
};

// Growth stages
const GrowthStage = {
    EMPTY: 'empty',
    SEED_PLANTED: 'seedPlanted',
    SPROUTING: 'sprouting',
    GROWING: 'growing',
    MATURE: 'mature',
    HARVESTABLE: 'harvestable'
};

/**
 * Represents the plant pot where seeds are planted
 */
class PlantPot {
    constructor(x, y, canvas) {
        this.x = x;
        this.y = y;
        this.canvas = canvas;

        // Pot dimensions
        this.potWidth = 120;
        this.potHeight = 100;
        this.rimHeight = 15;

        // Plant state
        this.plantType = null;
        this.growthStage = GrowthStage.EMPTY;
        this.growthProgress = 0; // 0 to 1

        // Hit detection
        this.hitRadius = 80;
    }

    /**
     * Check if a point is over the pot
     */
    isPointOver(x, y) {
        const dx = x - this.x;
        const dy = y - (this.y - this.potHeight / 2);
        return Math.abs(dx) < this.potWidth / 2 + 20 && Math.abs(dy) < this.potHeight / 2 + 20;
    }

    /**
     * Plant a seed in the pot
     */
    plantSeed(plantType) {
        if (this.growthStage === GrowthStage.EMPTY) {
            this.plantType = plantType;
            this.growthStage = GrowthStage.SEED_PLANTED;
            this.growthProgress = 0;
            return true;
        }
        return false;
    }

    /**
     * Update plant growth based on needs satisfaction
     */
    updateGrowth(needsSatisfied, deltaTime) {
        if (this.growthStage === GrowthStage.EMPTY || this.growthStage === GrowthStage.HARVESTABLE) {
            return;
        }

        // Only grow if needs are satisfied (average > 40%)
        if (needsSatisfied > 0.4) {
            const growthRate = 0.05 * needsSatisfied; // Faster growth with better care
            this.growthProgress += growthRate * deltaTime;

            // Update growth stage
            if (this.growthProgress >= 1) {
                this.growthProgress = 1;
                this.advanceGrowthStage();
            }
        }
    }

    /**
     * Advance to next growth stage
     */
    advanceGrowthStage() {
        switch (this.growthStage) {
            case GrowthStage.SEED_PLANTED:
                this.growthStage = GrowthStage.SPROUTING;
                this.growthProgress = 0;
                break;
            case GrowthStage.SPROUTING:
                this.growthStage = GrowthStage.GROWING;
                this.growthProgress = 0;
                break;
            case GrowthStage.GROWING:
                this.growthStage = GrowthStage.MATURE;
                this.growthProgress = 0;
                break;
            case GrowthStage.MATURE:
                this.growthStage = GrowthStage.HARVESTABLE;
                this.growthProgress = 1;
                break;
        }
    }

    /**
     * Harvest the plant and reset
     */
    harvest() {
        if (this.growthStage === GrowthStage.HARVESTABLE) {
            const harvested = this.plantType;
            this.plantType = null;
            this.growthStage = GrowthStage.EMPTY;
            this.growthProgress = 0;
            return harvested;
        }
        return null;
    }

    /**
     * Draw the plant pot and any plant inside
     */
    draw(ctx) {
        ctx.save();

        // Draw pot
        this.drawPot(ctx);

        // Draw plant based on growth stage
        if (this.growthStage !== GrowthStage.EMPTY) {
            this.drawPlant(ctx);
        }

        ctx.restore();
    }

    /**
     * Draw the terracotta pot
     */
    drawPot(ctx) {
        const x = this.x;
        const y = this.y;

        // Pot body (trapezoid shape)
        ctx.beginPath();
        ctx.moveTo(x - this.potWidth / 2, y - this.potHeight);
        ctx.lineTo(x - this.potWidth / 2 + 15, y);
        ctx.lineTo(x + this.potWidth / 2 - 15, y);
        ctx.lineTo(x + this.potWidth / 2, y - this.potHeight);
        ctx.closePath();

        // Terracotta gradient
        const potGradient = ctx.createLinearGradient(x - this.potWidth / 2, y, x + this.potWidth / 2, y);
        potGradient.addColorStop(0, '#C4A484');
        potGradient.addColorStop(0.3, '#E07A5F');
        potGradient.addColorStop(0.7, '#E07A5F');
        potGradient.addColorStop(1, '#B8860B');

        ctx.fillStyle = potGradient;
        ctx.fill();
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Pot rim
        ctx.beginPath();
        ctx.moveTo(x - this.potWidth / 2 - 5, y - this.potHeight);
        ctx.lineTo(x - this.potWidth / 2 - 5, y - this.potHeight - this.rimHeight);
        ctx.lineTo(x + this.potWidth / 2 + 5, y - this.potHeight - this.rimHeight);
        ctx.lineTo(x + this.potWidth / 2 + 5, y - this.potHeight);
        ctx.closePath();

        ctx.fillStyle = '#D2691E';
        ctx.fill();
        ctx.stroke();

        // Soil inside pot (visible at top)
        ctx.beginPath();
        ctx.ellipse(x, y - this.potHeight + 5, this.potWidth / 2 - 5, 15, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#5D4037';
        ctx.fill();
    }

    /**
     * Draw the plant based on growth stage
     */
    drawPlant(ctx) {
        const x = this.x;
        const baseY = this.y - this.potHeight - 10;
        const plant = PLANT_TYPES[this.plantType];

        if (!plant) return;

        switch (this.growthStage) {
            case GrowthStage.SEED_PLANTED:
                // Show seed in soil
                ctx.beginPath();
                ctx.ellipse(x, this.y - this.potHeight + 5, 8, 12, 0, 0, Math.PI * 2);
                ctx.fillStyle = plant.seedColor;
                ctx.fill();
                break;

            case GrowthStage.SPROUTING:
                // Small sprout
                const sproutHeight = 20 + this.growthProgress * 30;
                ctx.beginPath();
                ctx.moveTo(x, baseY);
                ctx.quadraticCurveTo(x + 5, baseY - sproutHeight / 2, x, baseY - sproutHeight);
                ctx.strokeStyle = '#90EE90';
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.stroke();

                // Tiny leaves
                if (this.growthProgress > 0.5) {
                    this.drawSmallLeaf(ctx, x, baseY - sproutHeight + 5, -0.5, 10);
                    this.drawSmallLeaf(ctx, x, baseY - sproutHeight + 5, 0.5, 10);
                }
                break;

            case GrowthStage.GROWING:
                // Growing plant with stem and leaves
                const stemHeight = 60 + this.growthProgress * 40;

                // Stem
                ctx.beginPath();
                ctx.moveTo(x, baseY);
                ctx.quadraticCurveTo(x + 3, baseY - stemHeight / 2, x, baseY - stemHeight);
                ctx.strokeStyle = plant.stemColor;
                ctx.lineWidth = 6;
                ctx.lineCap = 'round';
                ctx.stroke();

                // Leaves
                this.drawLeaf(ctx, x - 3, baseY - stemHeight * 0.3, -0.6, 20, 30);
                this.drawLeaf(ctx, x + 3, baseY - stemHeight * 0.5, 0.6, 20, 30);
                if (this.growthProgress > 0.5) {
                    this.drawLeaf(ctx, x - 2, baseY - stemHeight * 0.7, -0.4, 15, 25);
                }
                break;

            case GrowthStage.MATURE:
            case GrowthStage.HARVESTABLE:
                // Full plant with fruit/flower
                const fullHeight = 120;

                // Stem
                ctx.beginPath();
                ctx.moveTo(x, baseY);
                ctx.quadraticCurveTo(x + 2, baseY - fullHeight / 2, x, baseY - fullHeight);
                ctx.strokeStyle = plant.stemColor;
                ctx.lineWidth = 8;
                ctx.lineCap = 'round';
                ctx.stroke();

                // Leaves
                this.drawLeaf(ctx, x - 5, baseY - fullHeight * 0.25, -0.6, 25, 40);
                this.drawLeaf(ctx, x + 5, baseY - fullHeight * 0.4, 0.6, 25, 40);
                this.drawLeaf(ctx, x - 3, baseY - fullHeight * 0.55, -0.4, 20, 35);
                this.drawLeaf(ctx, x + 3, baseY - fullHeight * 0.7, 0.4, 20, 35);

                // Fruit/flower at top
                this.drawFruit(ctx, x, baseY - fullHeight - 10, plant);

                // Glow effect if harvestable
                if (this.growthStage === GrowthStage.HARVESTABLE) {
                    ctx.beginPath();
                    ctx.arc(x, baseY - fullHeight - 10, 40, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255, 255, 100, 0.2)';
                    ctx.fill();
                }
                break;
        }
    }

    drawSmallLeaf(ctx, x, y, angle, size) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.ellipse(size / 2, 0, size, size / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#90EE90';
        ctx.fill();

        ctx.restore();
    }

    drawLeaf(ctx, x, y, angle, width, height) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(width, -height * 0.3, width * 0.8, -height);
        ctx.quadraticCurveTo(0, -height * 0.7, 0, 0);

        const gradient = ctx.createLinearGradient(0, 0, width, -height);
        gradient.addColorStop(0, '#228B22');
        gradient.addColorStop(1, '#90EE90');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.restore();
    }

    drawFruit(ctx, x, y, plant) {
        if (this.plantType === 'sunflower') {
            // Sunflower head
            const petalCount = 12;
            for (let i = 0; i < petalCount; i++) {
                const angle = (i / petalCount) * Math.PI * 2;
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);
                ctx.beginPath();
                ctx.ellipse(0, -25, 8, 20, 0, 0, Math.PI * 2);
                ctx.fillStyle = plant.plantColor;
                ctx.fill();
                ctx.restore();
            }
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fillStyle = '#8B4513';
            ctx.fill();
        } else {
            // Round fruit
            ctx.beginPath();
            ctx.arc(x, y, 25, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(x - 8, y - 8, 0, x, y, 25);
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(0.3, plant.plantColor);
            gradient.addColorStop(1, plant.seedColor);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Small stem
            ctx.beginPath();
            ctx.moveTo(x, y - 25);
            ctx.lineTo(x, y - 32);
            ctx.strokeStyle = plant.stemColor;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
}

/**
 * Represents a draggable seed
 */
class DraggableSeed {
    constructor(x, y, plantType, canvas) {
        this.x = x;
        this.y = y;
        this.homeX = x;
        this.homeY = y;
        this.plantType = plantType;
        this.plant = PLANT_TYPES[plantType];
        this.canvas = canvas;

        this.size = 30;
        this.hitRadius = 50;
        this.isBeingHeld = false;
        this.isPlanted = false;
    }

    /**
     * Check if point is over the seed
     */
    isPointOver(x, y) {
        if (this.isPlanted) return false;
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.hitRadius;
    }

    /**
     * Pick up the seed
     */
    pickup() {
        this.isBeingHeld = true;
    }

    /**
     * Move seed to hand position
     */
    moveTo(x, y) {
        if (this.isBeingHeld) {
            this.x = x;
            this.y = y;
        }
    }

    /**
     * Drop the seed
     */
    drop() {
        this.isBeingHeld = false;
    }

    /**
     * Return to home position
     */
    returnHome() {
        this.x = this.homeX;
        this.y = this.homeY;
        this.isBeingHeld = false;
        this.isPlanted = false;
    }

    /**
     * Mark as planted
     */
    plant() {
        this.isPlanted = true;
    }

    /**
     * Draw the seed
     */
    draw(ctx) {
        if (this.isPlanted) return;

        ctx.save();

        // Glow if being held
        if (this.isBeingHeld) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 10, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 200, 0.4)';
            ctx.fill();
        }

        // Seed packet/container appearance
        ctx.beginPath();
        ctx.roundRect(this.x - this.size, this.y - this.size * 1.2, this.size * 2, this.size * 2.4, 8);
        ctx.fillStyle = '#F5DEB3';
        ctx.fill();
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Plant icon on packet
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.plant.icon, this.x, this.y);

        // Label
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#5D4037';
        ctx.fillText(this.plant.name, this.x, this.y + this.size);

        ctx.restore();
    }
}

/**
 * Represents the watering can tool
 */
class WateringCan {
    constructor(x, y, canvas, isGolden = false) {
        this.x = x;
        this.y = y;
        this.homeX = x;
        this.homeY = y;
        this.canvas = canvas;
        this.isGolden = isGolden;

        this.width = 80;
        this.height = 60;
        this.hitRadius = 60;
        this.isBeingHeld = false;
        this.isWatering = false;
        this.waterDrops = [];
    }

    /**
     * Check if point is over the watering can
     */
    isPointOver(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.hitRadius;
    }

    pickup() {
        this.isBeingHeld = true;
    }

    moveTo(x, y) {
        if (this.isBeingHeld) {
            this.x = x;
            this.y = y;
        }
    }

    drop() {
        this.isBeingHeld = false;
        this.isWatering = false;
    }

    returnHome() {
        this.x = this.homeX;
        this.y = this.homeY;
        this.isBeingHeld = false;
        this.isWatering = false;
    }

    /**
     * Start watering (create drops)
     */
    water() {
        this.isWatering = true;
        // Add water drops
        for (let i = 0; i < 3; i++) {
            this.waterDrops.push({
                x: this.x + 30 + Math.random() * 10,
                y: this.y + 20,
                vy: 2 + Math.random() * 2,
                alpha: 1
            });
        }
    }

    /**
     * Update water drops
     */
    update(deltaTime) {
        this.waterDrops.forEach(drop => {
            drop.y += drop.vy;
            drop.alpha -= 0.02;
        });
        this.waterDrops = this.waterDrops.filter(d => d.alpha > 0);
    }

    /**
     * Draw the watering can
     */
    draw(ctx) {
        ctx.save();

        // Glow if being held
        if (this.isBeingHeld) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.hitRadius, 0, Math.PI * 2);
            const glowColor = this.isGolden ? 'rgba(255, 215, 0, 0.5)' : 'rgba(100, 200, 255, 0.3)';
            ctx.fillStyle = glowColor;
            ctx.fill();
        }

        const x = this.x;
        const y = this.y;

        // Can body
        ctx.beginPath();
        ctx.ellipse(x, y, 35, 25, 0, 0, Math.PI * 2);
        const canColor = this.isGolden ? '#FFD700' : '#4A90D9';
        ctx.fillStyle = canColor;
        ctx.fill();
        const strokeColor = this.isGolden ? '#DAA520' : '#2E5A87';
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Spout
        ctx.beginPath();
        ctx.moveTo(x + 25, y - 5);
        ctx.lineTo(x + 50, y - 20);
        ctx.lineTo(x + 55, y - 15);
        ctx.lineTo(x + 30, y + 5);
        ctx.closePath();
        ctx.fillStyle = canColor;
        ctx.fill();
        ctx.stroke();

        // Handle
        ctx.beginPath();
        ctx.arc(x - 10, y - 30, 20, 0.5, Math.PI - 0.5);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 8;
        ctx.stroke();

        // Golden sparkle effect
        if (this.isGolden) {
            const sparkleTime = Date.now() / 200;
            for (let i = 0; i < 3; i++) {
                const angle = (sparkleTime + i * Math.PI * 2 / 3) % (Math.PI * 2);
                const sparkleX = x + Math.cos(angle) * 40;
                const sparkleY = y + Math.sin(angle) * 30;
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, 3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
                ctx.fill();
            }
        }

        // Water drops
        this.waterDrops.forEach(drop => {
            ctx.beginPath();
            ctx.ellipse(drop.x, drop.y, 4, 6, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(100, 180, 255, ${drop.alpha})`;
            ctx.fill();
        });

        ctx.restore();
    }
}

/**
 * Plant needs management system
 */
class PlantNeeds {
    constructor() {
        // Need levels (0 to 1)
        this.water = 0.7;
        this.sun = 0.8;
        this.food = 0.6;

        // Depletion rates per second
        this.waterDepleteRate = 0.03;
        this.sunDepleteRate = 0.02;
        this.foodDepleteRate = 0.025;
    }

    /**
     * Update needs (deplete over time)
     */
    update(deltaTime) {
        this.water = Math.max(0, this.water - this.waterDepleteRate * deltaTime);
        this.sun = Math.max(0, this.sun - this.sunDepleteRate * deltaTime);
        this.food = Math.max(0, this.food - this.foodDepleteRate * deltaTime);
    }

    /**
     * Add water
     */
    addWater(amount = 0.15) {
        this.water = Math.min(1, this.water + amount);
    }

    /**
     * Add sun (from sun interaction)
     */
    addSun(amount = 0.1) {
        this.sun = Math.min(1, this.sun + amount);
    }

    /**
     * Add food/fertilizer
     */
    addFood(amount = 0.12) {
        this.food = Math.min(1, this.food + amount);
    }

    /**
     * Max out all needs (for golden watering can)
     */
    maxAll() {
        this.water = 1;
        this.sun = 1;
        this.food = 1;
    }

    /**
     * Get average satisfaction level
     */
    getAverageSatisfaction() {
        return (this.water + this.sun + this.food) / 3;
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
     * Draw needs bars
     */
    draw(ctx, x, y) {
        const barWidth = 150;
        const barHeight = 25;
        const spacing = 40;

        ctx.save();

        // Background panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.roundRect(x - 20, y - 20, barWidth + 80, spacing * 3 + 30, 15);
        ctx.fill();

        // Title
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText('Plant Needs', x, y);

        // Water bar
        this.drawBar(ctx, x, y + spacing, barWidth, barHeight, this.water, '💧', 'Water');

        // Sun bar
        this.drawBar(ctx, x, y + spacing * 2, barWidth, barHeight, this.sun, '☀️', 'Sun');

        // Food bar
        this.drawBar(ctx, x, y + spacing * 3, barWidth, barHeight, this.food, '🌱', 'Food');

        ctx.restore();
    }

    drawBar(ctx, x, y, width, height, level, icon, label) {
        // Icon
        ctx.font = '20px Arial';
        ctx.fillText(icon, x, y + height / 2 + 6);

        // Bar background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.roundRect(x + 30, y, width, height, 5);
        ctx.fill();

        // Bar fill
        ctx.fillStyle = this.getBarColor(level);
        ctx.roundRect(x + 30, y, width * level, height, 5);
        ctx.fill();

        // Bar border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.roundRect(x + 30, y, width, height, 5);
        ctx.stroke();

        // Label
        ctx.font = '12px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + 30 + width / 2, y + height / 2 + 4);
    }
}

/**
 * Sun interaction area
 */
class SunArea {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 60;
        this.pulsePhase = 0;
    }

    isPointOver(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.radius;
    }

    update(deltaTime) {
        this.pulsePhase += deltaTime * 3;
    }

    draw(ctx) {
        ctx.save();

        const pulse = 1 + Math.sin(this.pulsePhase) * 0.1;

        // Glow
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * pulse);
        gradient.addColorStop(0, 'rgba(255, 220, 100, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 200, 50, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 180, 0, 0)');

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Sun icon
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☀️', this.x, this.y);

        ctx.restore();
    }
}

/**
 * Fertilizer/Food bag
 */
class FertilizerBag {
    constructor(x, y, canvas) {
        this.x = x;
        this.y = y;
        this.homeX = x;
        this.homeY = y;
        this.canvas = canvas;

        this.width = 60;
        this.height = 70;
        this.hitRadius = 50;
        this.isBeingHeld = false;
    }

    isPointOver(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.hitRadius;
    }

    pickup() {
        this.isBeingHeld = true;
    }

    moveTo(x, y) {
        if (this.isBeingHeld) {
            this.x = x;
            this.y = y;
        }
    }

    drop() {
        this.isBeingHeld = false;
    }

    returnHome() {
        this.x = this.homeX;
        this.y = this.homeY;
        this.isBeingHeld = false;
    }

    draw(ctx) {
        ctx.save();

        if (this.isBeingHeld) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.hitRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(144, 238, 144, 0.3)';
            ctx.fill();
        }

        // Bag
        ctx.beginPath();
        ctx.roundRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, 8);
        ctx.fillStyle = '#8B4513';
        ctx.fill();
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Label
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌱', this.x, this.y - 10);

        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText('FOOD', this.x, this.y + 20);

        ctx.restore();
    }
}

/**
 * Magic Pumpkin - Co-op only special item
 */
class MagicPumpkin {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = canvas.width * (0.45 + Math.random() * 0.1); // 45-55% width
        this.y = canvas.height * 0.5;
        this.radius = 70;
        this.active = false;
        this.visible = false;
        this.pulsePhase = 0;
        this.activationTime = 0;
        this.activationDuration = 3; // 3 seconds

        // Track which players are touching
        this.playerstouching = new Set();
    }

    /**
     * Check if a point is over the pumpkin
     */
    isPointOver(x, y) {
        if (!this.visible || this.active) return false;
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.radius;
    }

    /**
     * Show the pumpkin
     */
    show() {
        this.visible = true;
        this.active = false;
        this.playerstouching.clear();
    }

    /**
     * Hide the pumpkin
     */
    hide() {
        this.visible = false;
        this.active = false;
        this.playerstouching.clear();
    }

    /**
     * Activate the pumpkin (both players touching)
     */
    activate() {
        this.active = true;
        this.activationTime = 0;
    }

    /**
     * Update pumpkin state
     */
    update(deltaTime) {
        this.pulsePhase += deltaTime * 2;

        if (this.active) {
            this.activationTime += deltaTime;
            if (this.activationTime >= this.activationDuration) {
                this.hide();
            }
        }
    }

    /**
     * Draw the magic pumpkin
     */
    draw(ctx) {
        if (!this.visible) return;

        ctx.save();

        const pulse = 1 + Math.sin(this.pulsePhase) * 0.1;
        const scale = this.active ? 1.2 : 1;

        // Magical glow
        const glowGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * pulse * scale
        );
        glowGradient.addColorStop(0, 'rgba(255, 165, 0, 0.6)');
        glowGradient.addColorStop(0.5, 'rgba(138, 43, 226, 0.4)');
        glowGradient.addColorStop(1, 'rgba(255, 20, 147, 0)');

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse * scale, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // Pumpkin body
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 50 * scale, 45 * scale, 0, 0, Math.PI * 2);
        const pumpkinGradient = ctx.createRadialGradient(
            this.x - 20, this.y - 20, 0,
            this.x, this.y, 50 * scale
        );
        pumpkinGradient.addColorStop(0, '#FF8C00');
        pumpkinGradient.addColorStop(1, '#FF4500');
        ctx.fillStyle = pumpkinGradient;
        ctx.fill();

        // Pumpkin ridges
        ctx.strokeStyle = '#D2691E';
        ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(this.x + i * 15 * scale, this.y - 40 * scale);
            ctx.quadraticCurveTo(
                this.x + i * 10 * scale,
                this.y,
                this.x + i * 15 * scale,
                this.y + 40 * scale
            );
            ctx.stroke();
        }

        // Stem
        ctx.beginPath();
        ctx.roundRect(this.x - 8 * scale, this.y - 50 * scale, 16 * scale, 15 * scale, 3);
        ctx.fillStyle = '#228B22';
        ctx.fill();

        // Magic sparkles
        if (!this.active) {
            const sparkleCount = 5;
            for (let i = 0; i < sparkleCount; i++) {
                const angle = (this.pulsePhase + i * Math.PI * 2 / sparkleCount) % (Math.PI * 2);
                const sparkleX = this.x + Math.cos(angle) * 60;
                const sparkleY = this.y + Math.sin(angle) * 60;
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, 3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
                ctx.fill();
            }
        }

        // Instruction text
        if (!this.active && this.playerstouching.size === 1) {
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            ctx.strokeText('Both players touch!', this.x, this.y - 80);
            ctx.fillText('Both players touch!', this.x, this.y - 80);
        }

        ctx.restore();
    }
}

/**
 * Confetti particle system
 */
class ConfettiParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = -Math.random() * 10 - 5;
        this.gravity = 0.3;
        this.size = Math.random() * 8 + 4;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.3;
        this.color = this.randomColor();
        this.shape = Math.random() > 0.5 ? 'circle' : 'square';
        this.alpha = 1;
        this.lifetime = 0;
        this.maxLifetime = 3;
    }

    randomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update(deltaTime) {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;

        this.lifetime += deltaTime;
        this.alpha = Math.max(0, 1 - this.lifetime / this.maxLifetime);
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }

        ctx.restore();
    }

    isDead() {
        return this.lifetime >= this.maxLifetime;
    }
}

/**
 * Main Garden manager - coordinates all garden elements
 */
class GardenBed {
    constructor(canvas) {
        this.canvas = canvas;

        // Multi-player configuration
        this.playerCount = 1;
        this.gameMode = 'coop'; // 'coop' or 'competitive'
        this.dividerX = null;

        // Position elements (default single player / co-op layout)
        const centerX = canvas.width / 2;
        const centerY = canvas.height * 0.65;

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
        this.sunArea = new SunArea(canvas.width - 150, 150);

        this.wateringCansMap.set('shared', this.wateringCan);
        this.fertilizerBagsMap.set('shared', this.fertilizerBag);
        this.sunAreasMap.set('shared', this.sunArea);

        // Currently held items (per player)
        this.heldItemsMap = new Map();
        this.heldItem = null; // Default for single player

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
    }

    /**
     * Configure garden for multi-player
     */
    configure({ playerCount, gameMode, dividerX }) {
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

        // 2-3 plant pots spread across width
        const potCount = this.playerCount === 2 ? 2 : 3;
        const spacing = canvasWidth / (potCount + 1);

        for (let i = 0; i < potCount; i++) {
            const pot = new PlantPot(
                spacing * (i + 1),
                canvasHeight * 0.65,
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
        this.sunArea = new SunArea(canvasWidth - 150, 150);

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
        const p1Pot = new PlantPot(p1CenterX, canvasHeight * 0.65, this.canvas);
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
        const p1Sun = new SunArea(this.canvas.width - 100, 150);

        this.wateringCansMap.set(1, p1WateringCan);
        this.fertilizerBagsMap.set(1, p1Fertilizer);
        this.sunAreasMap.set(1, p1Sun);

        // Player 2 zone (left side, mirrored)
        const p2CenterX = this.dividerX / 2;
        const p2Pot = new PlantPot(p2CenterX, canvasHeight * 0.65, this.canvas);
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
        const p2Sun = new SunArea(100, 150);

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
                sunArea.radius = 60 * hitBoxMultiplier;
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
                }
            }
        } else {
            // Co-op/single player
            for (const pot of this.plantPots) {
                if (pot.growthStage !== GrowthStage.EMPTY) {
                    this.plantNeeds.update(deltaTime);
                    const satisfaction = this.plantNeeds.getAverageSatisfaction();
                    pot.updateGrowth(satisfaction, deltaTime);
                    break; // All pots share same needs
                }
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
            // Co-op mode - all hands interact with shared garden
            handPositions.forEach(hand => {
                const result = this.processHandInteraction(hand, 'shared');
                if (result) {
                    harvestedPlants.push({ plantKey: result, playerId: hand.playerId || 1 });
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

        // If holding something, move it
        if (heldItem) {
            heldItem.moveTo(handPos.x, handPos.y);

            // Check for drop interactions
            if (heldItem === seed && targetPot && targetPot.isPointOver(handPos.x, handPos.y)) {
                // Drop seed in pot
                if (targetPot.plantSeed(seed.plantType)) {
                    seed.plant();
                    if (this.gameMode === 'competitive') {
                        this.heldItemsMap.set(zoneKey, null);
                    } else {
                        this.heldItem = null;
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

                    // Spawn new seed after delay
                    setTimeout(() => this.spawnNewSeed(zoneKey), 1000);
                }
            } else if (heldItem === wateringCan && targetPot && targetPot.isPointOver(handPos.x, handPos.y)) {
                // Water the plant
                const waterTime = this.gameMode === 'competitive'
                    ? (this.waterInteractionTimeMap.get(zoneKey) || 0)
                    : this.waterInteractionTime;

                const newWaterTime = waterTime + 0.016;

                if (newWaterTime > 0.3) {
                    plantNeeds.addWater();
                    wateringCan.water();

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

                const newFoodTime = foodTime + 0.016;

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
        } else {
            // Try to pick something up
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

                const newSunTime = sunTime + 0.016;

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

                    // Spawn new seed
                    setTimeout(() => this.spawnNewSeed(zoneKey), 500);
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
            }
        }
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

        // Draw needs panels
        if (this.gameMode === 'competitive') {
            // Player 1 needs (right side)
            const p1Needs = this.plantNeedsMap.get(1);
            const p1Pot = this.plantPots[0];
            if (p1Pot && p1Pot.growthStage !== GrowthStage.EMPTY && p1Needs) {
                p1Needs.draw(ctx, this.canvas.width - 250, 100);
            }

            // Player 2 needs (left side)
            const p2Needs = this.plantNeedsMap.get(2);
            const p2Pot = this.plantPots[1];
            if (p2Pot && p2Pot.growthStage !== GrowthStage.EMPTY && p2Needs) {
                p2Needs.draw(ctx, 30, 100);
            }
        } else {
            // Shared needs
            const anyPotGrowing = this.plantPots.some(pot => pot.growthStage !== GrowthStage.EMPTY);
            if (anyPotGrowing) {
                this.plantNeeds.draw(ctx, 30, 100);
            }
        }

        // Draw magic pumpkin (co-op only)
        if (this.magicPumpkin) {
            this.magicPumpkin.draw(ctx);
        }

        // Draw confetti
        this.confettiParticles.forEach(particle => particle.draw(ctx));

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
        ctx.strokeText('Player 1', p1X, 40);
        ctx.fillText('Player 1', p1X, 40);

        // Player 2 (left, cool blue)
        ctx.fillStyle = '#4A90E2';
        const p2X = this.dividerX / 2;
        ctx.strokeText('Player 2', p2X, 40);
        ctx.fillText('Player 2', p2X, 40);

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

        if (anyPotEmpty) {
            ctx.fillText('Pick up the seed and drop it in the pot!', this.canvas.width / 2, 50);
        } else if (anyPotHarvestable) {
            ctx.fillText('Your plant is ready! Touch it to harvest!', this.canvas.width / 2, 50);
        } else {
            ctx.fillText('Keep your plant healthy - water it, give it sun and food!', this.canvas.width / 2, 50);
        }

        ctx.restore();
    }

    /**
     * Clear the garden (for reset)
     */
    clear() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height * 0.65;

        this.plantPots = [];
        this.plantPot = new PlantPot(centerX, centerY, this.canvas);
        this.plantPots.push(this.plantPot);

        this.plantNeeds = new PlantNeeds();
        this.plantNeedsMap.clear();
        this.plantNeedsMap.set('shared', this.plantNeeds);

        this.seed = null;
        this.heldItem = null;
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

// Backward compatibility alias
const BALLOON_COLORS = PLANT_TYPES;
