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
    constructor(x, y, canvas) {
        this.x = x;
        this.y = y;
        this.homeX = x;
        this.homeY = y;
        this.canvas = canvas;

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
            ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
            ctx.fill();
        }

        const x = this.x;
        const y = this.y;

        // Can body
        ctx.beginPath();
        ctx.ellipse(x, y, 35, 25, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#4A90D9';
        ctx.fill();
        ctx.strokeStyle = '#2E5A87';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Spout
        ctx.beginPath();
        ctx.moveTo(x + 25, y - 5);
        ctx.lineTo(x + 50, y - 20);
        ctx.lineTo(x + 55, y - 15);
        ctx.lineTo(x + 30, y + 5);
        ctx.closePath();
        ctx.fillStyle = '#4A90D9';
        ctx.fill();
        ctx.stroke();

        // Handle
        ctx.beginPath();
        ctx.arc(x - 10, y - 30, 20, 0.5, Math.PI - 0.5);
        ctx.strokeStyle = '#2E5A87';
        ctx.lineWidth = 8;
        ctx.stroke();

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
 * Main Garden manager - coordinates all garden elements
 */
class GardenBed {
    constructor(canvas) {
        this.canvas = canvas;

        // Position elements
        const centerX = canvas.width / 2;
        const centerY = canvas.height * 0.65;

        // Create plant pot in center
        this.plantPot = new PlantPot(centerX, centerY, canvas);

        // Create plant needs
        this.plantNeeds = new PlantNeeds();

        // Create tools and seeds (positioned around the pot)
        this.seed = null;
        this.wateringCan = new WateringCan(canvas.width - 150, canvas.height - 150, canvas);
        this.fertilizerBag = new FertilizerBag(150, canvas.height - 150, canvas);
        this.sunArea = new SunArea(canvas.width - 150, 150);

        // Currently held item
        this.heldItem = null;

        // Available seeds
        this.availableSeeds = [];
        this.currentSeedIndex = 0;

        // Spawn initial seed
        this.spawnNewSeed();

        // Interaction timers
        this.sunInteractionTime = 0;
        this.waterInteractionTime = 0;
        this.foodInteractionTime = 0;
    }

    /**
     * Spawn a new seed packet
     */
    spawnNewSeed() {
        const plantTypes = Object.keys(PLANT_TYPES);
        const plantType = plantTypes[this.currentSeedIndex % plantTypes.length];
        this.currentSeedIndex++;

        this.seed = new DraggableSeed(
            this.canvas.width / 2,
            100,
            plantType,
            this.canvas
        );
    }

    /**
     * Update all garden elements
     */
    update(deltaTime) {
        // Update needs if plant is growing
        if (this.plantPot.growthStage !== GrowthStage.EMPTY) {
            this.plantNeeds.update(deltaTime);

            // Update plant growth based on needs
            const satisfaction = this.plantNeeds.getAverageSatisfaction();
            this.plantPot.updateGrowth(satisfaction, deltaTime);
        }

        // Update sun area animation
        this.sunArea.update(deltaTime);

        // Update watering can drops
        this.wateringCan.update(deltaTime);
    }

    /**
     * Handle hand interactions
     */
    checkCollisions(handPositions) {
        const harvestedPlants = [];

        if (!handPositions || handPositions.length === 0) {
            // Release any held items
            if (this.heldItem) {
                this.releaseItem();
            }
            return harvestedPlants;
        }

        const handPos = handPositions[0]; // Use first hand

        // If holding something, move it
        if (this.heldItem) {
            this.heldItem.moveTo(handPos.x, handPos.y);

            // Check for drop interactions
            if (this.heldItem === this.seed && this.plantPot.isPointOver(handPos.x, handPos.y)) {
                // Drop seed in pot
                if (this.plantPot.plantSeed(this.seed.plantType)) {
                    this.seed.plant();
                    this.heldItem = null;
                    audioManager.play('plant');

                    // Reset needs for new plant
                    this.plantNeeds = new PlantNeeds();

                    // Spawn new seed after delay
                    setTimeout(() => this.spawnNewSeed(), 1000);
                }
            } else if (this.heldItem === this.wateringCan && this.plantPot.isPointOver(handPos.x, handPos.y)) {
                // Water the plant
                this.waterInteractionTime += 0.016;
                if (this.waterInteractionTime > 0.3) {
                    this.plantNeeds.addWater();
                    this.wateringCan.water();
                    this.waterInteractionTime = 0;
                    audioManager.play('water');
                }
            } else if (this.heldItem === this.fertilizerBag && this.plantPot.isPointOver(handPos.x, handPos.y)) {
                // Feed the plant
                this.foodInteractionTime += 0.016;
                if (this.foodInteractionTime > 0.5) {
                    this.plantNeeds.addFood();
                    this.foodInteractionTime = 0;
                    audioManager.play('plant');
                }
            }
        } else {
            // Try to pick something up
            if (this.seed && !this.seed.isPlanted && this.seed.isPointOver(handPos.x, handPos.y)) {
                this.seed.pickup();
                this.heldItem = this.seed;
            } else if (this.wateringCan.isPointOver(handPos.x, handPos.y)) {
                this.wateringCan.pickup();
                this.heldItem = this.wateringCan;
            } else if (this.fertilizerBag.isPointOver(handPos.x, handPos.y)) {
                this.fertilizerBag.pickup();
                this.heldItem = this.fertilizerBag;
            }

            // Sun interaction (just hover)
            if (this.sunArea.isPointOver(handPos.x, handPos.y)) {
                this.sunInteractionTime += 0.016;
                if (this.sunInteractionTime > 0.2) {
                    this.plantNeeds.addSun();
                    this.sunInteractionTime = 0;
                }
            }

            // Check for harvest
            if (this.plantPot.growthStage === GrowthStage.HARVESTABLE &&
                this.plantPot.isPointOver(handPos.x, handPos.y)) {
                const harvested = this.plantPot.harvest();
                if (harvested) {
                    harvestedPlants.push(harvested);
                    audioManager.play('harvest');

                    // Spawn new seed
                    setTimeout(() => this.spawnNewSeed(), 500);
                }
            }
        }

        return harvestedPlants;
    }

    /**
     * Release currently held item
     */
    releaseItem() {
        if (this.heldItem) {
            this.heldItem.drop();

            // Return tools to home position
            if (this.heldItem === this.wateringCan || this.heldItem === this.fertilizerBag) {
                this.heldItem.returnHome();
            } else if (this.heldItem === this.seed && !this.seed.isPlanted) {
                this.seed.returnHome();
            }

            this.heldItem = null;
        }
    }

    /**
     * Draw the entire garden scene
     */
    draw(ctx) {
        // Draw sun area
        this.sunArea.draw(ctx);

        // Draw plant pot
        this.plantPot.draw(ctx);

        // Draw seed (if not planted)
        if (this.seed) {
            this.seed.draw(ctx);
        }

        // Draw tools
        this.wateringCan.draw(ctx);
        this.fertilizerBag.draw(ctx);

        // Draw needs panel (only if plant is growing)
        if (this.plantPot.growthStage !== GrowthStage.EMPTY) {
            this.plantNeeds.draw(ctx, 30, 100);
        }

        // Draw instructions
        this.drawInstructions(ctx);
    }

    /**
     * Draw helpful instructions
     */
    drawInstructions(ctx) {
        ctx.save();
        ctx.font = '18px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.textAlign = 'center';

        if (this.plantPot.growthStage === GrowthStage.EMPTY) {
            ctx.fillText('Pick up the seed and drop it in the pot!', this.canvas.width / 2, 50);
        } else if (this.plantPot.growthStage === GrowthStage.HARVESTABLE) {
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
        this.plantPot = new PlantPot(this.canvas.width / 2, this.canvas.height * 0.65, this.canvas);
        this.plantNeeds = new PlantNeeds();
        this.seed = null;
        this.heldItem = null;
        this.spawnNewSeed();
    }

    // Compatibility methods
    setDifficulty(level) {
        // Adjust depletion rates based on level
        const modifier = 1 + (level - 1) * 0.1;
        this.plantNeeds.waterDepleteRate = 0.03 * modifier;
        this.plantNeeds.sunDepleteRate = 0.02 * modifier;
        this.plantNeeds.foodDepleteRate = 0.025 * modifier;
    }

    getActiveSeedCount() {
        return this.plantPot.growthStage !== GrowthStage.EMPTY ? 1 : 0;
    }
}

// Backward compatibility alias
const BALLOON_COLORS = PLANT_TYPES;
