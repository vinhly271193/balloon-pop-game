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

        // Water level visual
        this.waterLevel = 0;
        this.waterLevelTarget = 0;
        this.overflowParticles = [];
        this.overflowTimer = 0;
        this.wavePhase = 0;

        // Watering progress (0-1, set by GardenManager when can is held over pot)
        this.waterPourProgress = 0;
        this.isBeingWatered = false;
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
     * Update water level and overflow particles
     */
    update(deltaTime) {
        // Lerp water level toward target
        this.waterLevel += (this.waterLevelTarget - this.waterLevel) * Math.min(1, 4 * deltaTime);
        this.wavePhase += deltaTime * 3;

        // Spawn overflow particles when full
        if (this.waterLevel > 0.95) {
            this.overflowTimer -= deltaTime;
            if (this.overflowTimer <= 0) {
                this.overflowTimer = 0.15;
                const side = Math.random() > 0.5 ? 1 : -1;
                this.overflowParticles.push({
                    x: this.x + side * (this.potWidth / 2 - 10),
                    y: this.y - this.potHeight,
                    vx: side * (1 + Math.random() * 2),
                    vy: -(2 + Math.random() * 3),
                    alpha: 0.8,
                    size: 3 + Math.random() * 3
                });
            }
        }

        // Update overflow particles
        this.overflowParticles.forEach(p => {
            p.vy += 6 * deltaTime; // gravity
            p.x += p.vx * deltaTime * 60;
            p.y += p.vy * deltaTime * 60;
            p.alpha -= deltaTime * 1.5;
        });
        this.overflowParticles = this.overflowParticles.filter(p => p.alpha > 0);
    }

    /**
     * Draw the plant pot and any plant inside
     */
    draw(ctx) {
        ctx.save();

        // Draw pot
        this.drawPot(ctx);

        // Draw water fill inside pot
        if (this.waterLevel > 0.01 && this.growthStage !== GrowthStage.EMPTY) {
            this.drawWaterFill(ctx);
        }

        // Draw plant based on growth stage
        if (this.growthStage !== GrowthStage.EMPTY) {
            this.drawPlant(ctx);
        }

        // Draw overflow particles
        this.overflowParticles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(100, 180, 255, ${p.alpha})`;
            ctx.fill();
        });

        // Draw growth stage progress ring
        if (this.growthStage !== GrowthStage.EMPTY) {
            this.drawGrowthRing(ctx);
        }

        // Draw watering progress ring when can is held over this pot
        if (this.isBeingWatered && this.waterPourProgress > 0) {
            this.drawWaterProgressRing(ctx);
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
     * Draw water level inside the pot
     */
    drawWaterFill(ctx) {
        const x = this.x;
        const y = this.y;
        const fillHeight = this.waterLevel * this.potHeight * 0.6;
        const soilY = y - this.potHeight + 5;

        // Clip to pot interior
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x - this.potWidth / 2 + 3, y - this.potHeight);
        ctx.lineTo(x - this.potWidth / 2 + 18, y);
        ctx.lineTo(x + this.potWidth / 2 - 18, y);
        ctx.lineTo(x + this.potWidth / 2 - 3, y - this.potHeight);
        ctx.closePath();
        ctx.clip();

        // Draw water with wavy surface
        ctx.beginPath();
        const waterTop = soilY + 15 - fillHeight;
        const waveSegments = 8;
        const waveWidth = this.potWidth - 10;
        for (let i = 0; i <= waveSegments; i++) {
            const wx = (x - waveWidth / 2) + (waveWidth / waveSegments) * i;
            const wy = waterTop + Math.sin(this.wavePhase + i * 0.8) * 2;
            if (i === 0) ctx.moveTo(wx, wy);
            else ctx.lineTo(wx, wy);
        }
        ctx.lineTo(x + waveWidth / 2, y);
        ctx.lineTo(x - waveWidth / 2, y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(100, 180, 255, 0.35)';
        ctx.fill();
        ctx.restore();
    }

    /**
     * Draw growth stage progress ring below pot
     */
    drawGrowthRing(ctx) {
        const cx = this.x;
        const cy = this.y + 20;
        const radius = 50;
        const stages = [
            GrowthStage.SEED_PLANTED,
            GrowthStage.SPROUTING,
            GrowthStage.GROWING,
            GrowthStage.MATURE,
            GrowthStage.HARVESTABLE
        ];
        const icons = ['🌱', '🌿', '🌳', '🌸', '✨'];
        const segmentCount = stages.length;
        const totalArc = Math.PI; // semicircle below pot
        const segmentArc = totalArc / segmentCount;
        const startAngle = 0; // top of semicircle (pointing down)

        const currentIdx = stages.indexOf(this.growthStage);

        ctx.save();
        for (let i = 0; i < segmentCount; i++) {
            const aStart = startAngle + i * segmentArc;
            const aEnd = startAngle + (i + 1) * segmentArc;
            const gap = 0.04;

            ctx.beginPath();
            ctx.arc(cx, cy, radius, aStart + gap, aEnd - gap);
            ctx.lineWidth = 6;

            if (i < currentIdx) {
                // Completed stage
                ctx.strokeStyle = 'rgba(74, 222, 128, 0.8)';
            } else if (i === currentIdx) {
                // Current stage - partially filled
                ctx.strokeStyle = 'rgba(74, 222, 128, 0.3)';
                ctx.stroke();

                // Draw filled portion
                const fillEnd = aStart + gap + (aEnd - aStart - 2 * gap) * this.growthProgress;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, aStart + gap, fillEnd);
                ctx.strokeStyle = 'rgba(74, 222, 128, 0.8)';
            } else {
                // Future stage
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            }
            ctx.stroke();

            // Stage icon at segment boundary
            const iconAngle = aStart + segmentArc / 2;
            const iconX = cx + Math.cos(iconAngle) * (radius + 14);
            const iconY = cy + Math.sin(iconAngle) * (radius + 14);
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = i <= currentIdx ? 1 : 0.4;
            ctx.fillText(icons[i], iconX, iconY);
            ctx.globalAlpha = 1;
        }
        ctx.restore();
    }

    /**
     * Draw water progress ring around pot when being watered
     */
    drawWaterProgressRing(ctx) {
        const cx = this.x;
        const cy = this.y - this.potHeight / 2;
        const radius = this.potWidth / 2 + 25;
        const progress = this.waterPourProgress;

        ctx.save();

        // Background track
        ctx.beginPath();
        ctx.arc(cx, cy, radius, -Math.PI / 2, Math.PI * 1.5);
        ctx.strokeStyle = 'rgba(100, 180, 255, 0.15)';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Progress arc
        const endAngle = -Math.PI / 2 + Math.PI * 2 * progress;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, -Math.PI / 2, endAngle);
        ctx.strokeStyle = 'rgba(100, 180, 255, 0.85)';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(100, 180, 255, 0.6)';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Water drop icon at the leading edge of the progress
        const iconAngle = endAngle;
        const iconX = cx + Math.cos(iconAngle) * radius;
        const iconY = cy + Math.sin(iconAngle) * radius;
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💧', iconX, iconY);

        ctx.restore();
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

        // Tilt animation
        this.tiltAngle = 0;
        this.tiltSpeed = 4;
        this.isOverPot = false;
        this.pourParticles = [];

        // Dwell progress ring
        this.pourProgress = 0; // 0-1
        this.targetPotRef = null; // Reference to the pot being watered
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
        this.isOverPot = false;
        this.pourProgress = 0;
        this.targetPotRef = null;
    }

    returnHome() {
        this.x = this.homeX;
        this.y = this.homeY;
        this.isBeingHeld = false;
        this.isWatering = false;
        this.isOverPot = false;
        this.pourProgress = 0;
        this.targetPotRef = null;
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
     * Update tilt, water drops, and pour particles
     */
    update(deltaTime) {
        // Lerp tilt angle toward target — more dramatic tilt for clear pouring visual
        const targetTilt = this.isOverPot ? -0.85 : 0;
        this.tiltAngle += (targetTilt - this.tiltAngle) * Math.min(1, this.tiltSpeed * deltaTime);

        // Spawn pour particles when tilted enough and over pot
        if (this.isOverPot && this.tiltAngle < -0.3) {
            // Calculate rotated spout tip position
            const spoutLocalX = 55;
            const spoutLocalY = -17;
            const cos = Math.cos(this.tiltAngle);
            const sin = Math.sin(this.tiltAngle);
            const spoutWorldX = this.x + spoutLocalX * cos - spoutLocalY * sin;
            const spoutWorldY = this.y + spoutLocalX * sin + spoutLocalY * cos;

            for (let i = 0; i < 3; i++) {
                this.pourParticles.push({
                    x: spoutWorldX + (Math.random() - 0.5) * 6,
                    y: spoutWorldY,
                    vx: (Math.random() - 0.5) * 0.8,
                    vy: 1 + Math.random() * 1.5,
                    alpha: 0.8 + Math.random() * 0.2,
                    size: 2 + Math.random() * 3,
                    life: 0
                });
            }
        }

        // Update pour particles
        this.pourParticles.forEach(p => {
            p.vy += 8 * deltaTime; // gravity
            p.x += p.vx;
            p.y += p.vy;
            p.life += deltaTime;
            p.alpha = Math.max(0, p.alpha - deltaTime * 1.2);
        });
        this.pourParticles = this.pourParticles.filter(p => p.alpha > 0 && p.life < 0.8);

        // Update old water drops
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

        // Dwell progress ring
        if (this.pourProgress > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 45, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this.pourProgress);
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.7)';
            ctx.lineWidth = 4;
            ctx.shadowColor = 'rgba(100, 200, 255, 0.6)';
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Draw can body with rotation
        ctx.translate(this.x, this.y);
        ctx.rotate(this.tiltAngle);

        const canColor = this.isGolden ? '#FFD700' : '#4A90D9';
        const strokeColor = this.isGolden ? '#DAA520' : '#2E5A87';

        // Can body (at origin)
        ctx.beginPath();
        ctx.ellipse(0, 0, 35, 25, 0, 0, Math.PI * 2);
        ctx.fillStyle = canColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Spout (relative to origin)
        ctx.beginPath();
        ctx.moveTo(25, -5);
        ctx.lineTo(50, -20);
        ctx.lineTo(55, -15);
        ctx.lineTo(30, 5);
        ctx.closePath();
        ctx.fillStyle = canColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Handle
        ctx.beginPath();
        ctx.arc(-10, -30, 20, 0.5, Math.PI - 0.5);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 8;
        ctx.stroke();

        // Golden sparkle effect
        if (this.isGolden) {
            const sparkleTime = Date.now() / 200;
            for (let i = 0; i < 3; i++) {
                const angle = (sparkleTime + i * Math.PI * 2 / 3) % (Math.PI * 2);
                const sparkleX = Math.cos(angle) * 40;
                const sparkleY = Math.sin(angle) * 30;
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, 3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
                ctx.fill();
            }
        }

        ctx.restore();

        // Draw pour particles in world space (outside rotation)
        ctx.save();
        this.pourParticles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(100, 180, 255, ${p.alpha})`;
            ctx.fill();
        });

        // Old water drops (world space)
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

        // Display values for smooth lerp
        this.displayWater = 0.7;
        this.displaySun = 0.8;
        this.displayFood = 0.6;

        // Depletion rates per second
        this.waterDepleteRate = 0.03;
        this.sunDepleteRate = 0.02;
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
        this.sun = Math.max(0, this.sun - this.sunDepleteRate * deltaTime);
        this.food = Math.max(0, this.food - this.foodDepleteRate * deltaTime);

        // Smooth lerp display values
        const lerpSpeed = 5;
        this.displayWater += (this.water - this.displayWater) * Math.min(1, lerpSpeed * deltaTime);
        this.displaySun += (this.sun - this.displaySun) * Math.min(1, lerpSpeed * deltaTime);
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
     * Add sun (from sun interaction)
     */
    addSun(amount = 0.1) {
        this.sun = Math.min(1, this.sun + amount);
        this.feedbackEffects.push({ icon: '+☀️', x: 0, y: 0, alpha: 1, life: 0, type: 'sun' });
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
        const barWidth = 180;
        const barHeight = 30;
        const spacing = 45;

        ctx.save();

        // Background panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.roundRect(x - 20, y - 20, barWidth + 80, spacing * 3 + 35, 15);
        ctx.fill();

        // Title
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText('Plant Needs', x, y);

        // Water bar
        this.drawBar(ctx, x, y + spacing, barWidth, barHeight, this.displayWater, this.water, '💧', 'Water');

        // Sun bar
        this.drawBar(ctx, x, y + spacing * 2, barWidth, barHeight, this.displaySun, this.sun, '☀️', 'Sun');

        // Food bar
        this.drawBar(ctx, x, y + spacing * 3, barWidth, barHeight, this.displayFood, this.food, '🌱', 'Food');

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
            else if (e.type === 'sun') effectY = y + spacing * 2;
            else if (e.type === 'food') effectY = y + spacing * 3;
            ctx.fillText(e.icon, x + barWidth + 50, effectY + e.y);
            ctx.restore();
        });

        ctx.restore();
    }

    drawBar(ctx, x, y, width, height, displayLevel, actualLevel, icon, label) {
        // Icon
        ctx.font = '22px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(icon, x, y + height / 2 + 7);

        // Bar background — pulse red if critical
        if (actualLevel < 0.3) {
            const pulseAlpha = 0.2 + 0.15 * Math.sin(this.pulsePhase);
            ctx.fillStyle = `rgba(239, 68, 68, ${pulseAlpha})`;
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        }
        ctx.beginPath();
        ctx.roundRect(x + 35, y, width, height, 5);
        ctx.fill();

        // Bar fill (smooth)
        const fillWidth = Math.max(0, width * displayLevel);
        if (fillWidth > 0) {
            ctx.fillStyle = this.getBarColor(actualLevel);
            ctx.beginPath();
            ctx.roundRect(x + 35, y, fillWidth, height, 5);
            ctx.fill();
        }

        // Bar border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x + 35, y, width, height, 5);
        ctx.stroke();

        // Label
        ctx.font = 'bold 13px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + 35 + width / 2, y + height / 2 + 5);
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
 * Animated hint arrow for idle players
 * Shows contextual guidance (e.g. seed→pot, water→plant)
 */
class HintArrow {
    constructor() {
        this.fromX = 0;
        this.fromY = 0;
        this.toX = 0;
        this.toY = 0;
        this.hintType = null;
        this.alpha = 0;
        this.pulsePhase = 0;
        this.dashOffset = 0;
        this.state = 'hidden'; // hidden, fading_in, visible, fading_out

        this.fadeInDuration = 1.0;
        this.fadeOutDuration = 0.5;
        this.fadeProgress = 0;

        // Colors by hint type
        this.colors = {
            seed_to_pot: '#F5DEB3',   // warm wheat
            water_to_pot: '#87CEEB',  // light blue
            sun_to_pot: '#FFD700',    // soft gold
            food_to_pot: '#90EE90',   // light green
            harvest: '#FFDAB9'        // soft peach
        };

        // Tooltip messages by hint type
        this.tooltips = {
            seed_to_pot: 'Grab the seed and place it in the pot!',
            water_to_pot: 'Your plant is thirsty! Use the watering can!',
            sun_to_pot: 'Your plant needs sunlight! Touch the sun!',
            food_to_pot: 'Feed your plant! Grab the fertilizer!',
            harvest: 'Your plant is ready! Touch it to harvest!'
        };

        // Tooltip bounce phase
        this.tooltipBounce = 0;
    }

    show(fromX, fromY, toX, toY, hintType) {
        this.fromX = fromX;
        this.fromY = fromY;
        this.toX = toX;
        this.toY = toY;
        this.hintType = hintType;

        if (this.state === 'hidden') {
            this.state = 'fading_in';
            this.fadeProgress = 0;
            this.alpha = 0;
        } else if (this.state === 'fading_out') {
            // Reverse fade-out into fade-in
            this.state = 'fading_in';
            this.fadeProgress = this.alpha / 1.0; // Continue from current alpha
        }
    }

    hide() {
        if (this.state === 'visible' || this.state === 'fading_in') {
            this.state = 'fading_out';
            this.fadeProgress = 0;
        }
    }

    reset() {
        this.state = 'hidden';
        this.alpha = 0;
        this.fadeProgress = 0;
        this.hintType = null;
    }

    update(deltaTime) {
        if (this.state === 'hidden') return;

        // Advance pulse and dash animations
        this.pulsePhase += deltaTime * 2.5;
        this.dashOffset -= deltaTime * 40;

        if (this.state === 'fading_in') {
            this.fadeProgress += deltaTime / this.fadeInDuration;
            if (this.fadeProgress >= 1) {
                this.fadeProgress = 1;
                this.state = 'visible';
            }
            this.alpha = this.fadeProgress;
        } else if (this.state === 'fading_out') {
            this.fadeProgress += deltaTime / this.fadeOutDuration;
            if (this.fadeProgress >= 1) {
                this.fadeProgress = 1;
                this.state = 'hidden';
                this.alpha = 0;
                return;
            }
            this.alpha = 1 - this.fadeProgress;
        }

        // Sine-wave pulse on alpha (0.4 – 1.0)
        if (this.state === 'visible') {
            this.alpha = 0.7 + 0.3 * Math.sin(this.pulsePhase);
        }

        // Tooltip gentle bounce
        this.tooltipBounce += deltaTime * 2;
    }

    draw(ctx) {
        if (this.state === 'hidden' || this.alpha <= 0) return;

        const color = this.colors[this.hintType] || '#FFFFFF';
        ctx.save();
        ctx.globalAlpha = this.alpha;

        if (this.hintType === 'harvest') {
            this._drawHarvestRing(ctx, color);
        } else {
            this._drawCurvedArrow(ctx, color);
        }

        // Draw tooltip bubble
        this._drawTooltip(ctx, color);

        ctx.restore();
    }

    _drawHarvestRing(ctx, color) {
        const pulse = 1 + 0.15 * Math.sin(this.pulsePhase);
        const radius = 50 * pulse;

        // Outer glow
        ctx.beginPath();
        ctx.arc(this.toX, this.toY, radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner ring
        ctx.beginPath();
        ctx.arc(this.toX, this.toY, radius, 0, Math.PI * 2);
        ctx.setLineDash([10, 6]);
        ctx.lineDashOffset = this.dashOffset;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.setLineDash([]);
    }

    _drawCurvedArrow(ctx, color) {
        // Compute control point for quadratic bezier (curve upward)
        const midX = (this.fromX + this.toX) / 2;
        const midY = (this.fromY + this.toY) / 2;
        const dx = this.toX - this.fromX;
        const dy = this.toY - this.fromY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Perpendicular offset for curve (30% of distance, biased upward)
        const cpX = midX - dy * 0.3;
        const cpY = midY + dx * 0.3 - dist * 0.15;

        // Dashed curved line with glow
        ctx.beginPath();
        ctx.moveTo(this.fromX, this.fromY);
        ctx.quadraticCurveTo(cpX, cpY, this.toX, this.toY);
        ctx.setLineDash([12, 8]);
        ctx.lineDashOffset = this.dashOffset;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);

        // Pulsing circle at source
        const sourcePulse = 1 + 0.2 * Math.sin(this.pulsePhase);
        ctx.beginPath();
        ctx.arc(this.fromX, this.fromY, 12 * sourcePulse, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = this.alpha * 0.4;
        ctx.fill();
        ctx.globalAlpha = this.alpha;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Arrowhead at target
        // Get tangent direction at end of bezier: derivative at t=1
        // For quadratic bezier: tangent = 2*(1-t)*(cp-from) + 2*t*(to-cp) at t=1 = 2*(to-cp)
        const tangentX = this.toX - cpX;
        const tangentY = this.toY - cpY;
        const angle = Math.atan2(tangentY, tangentX);
        const headLen = 14;

        ctx.beginPath();
        ctx.moveTo(this.toX, this.toY);
        ctx.lineTo(
            this.toX - headLen * Math.cos(angle - Math.PI / 6),
            this.toY - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            this.toX - headLen * Math.cos(angle + Math.PI / 6),
            this.toY - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    _drawTooltip(ctx, color) {
        const text = this.tooltips[this.hintType];
        if (!text) return;

        // Position tooltip above the source (for arrows) or above the pot (for harvest)
        const tooltipX = this.hintType === 'harvest' ? this.toX : this.fromX;
        const baseY = this.hintType === 'harvest' ? this.toY - 80 : this.fromY - 60;
        const bounceOffset = Math.sin(this.tooltipBounce) * 4;
        const tooltipY = baseY + bounceOffset;

        ctx.save();
        ctx.globalAlpha = this.alpha;

        // Measure text
        ctx.font = 'bold 20px Arial';
        const metrics = ctx.measureText(text);
        const padding = 14;
        const boxWidth = metrics.width + padding * 2;
        const boxHeight = 36;
        const boxX = tooltipX - boxWidth / 2;
        const boxY = tooltipY - boxHeight / 2;

        // Background bubble with soft shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 3;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 12);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fill();

        // Colored border
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pointer triangle pointing down toward the target
        const triSize = 8;
        ctx.beginPath();
        ctx.moveTo(tooltipX - triSize, boxY + boxHeight);
        ctx.lineTo(tooltipX, boxY + boxHeight + triSize);
        ctx.lineTo(tooltipX + triSize, boxY + boxHeight);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, tooltipX, tooltipY);

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

            // Reset watering can state if held but not yet confirmed over pot
            if (heldItem === wateringCan) {
                const overPot = targetPot && targetPot.isPointOver(handPos.x, handPos.y);
                if (!overPot) {
                    wateringCan.isOverPot = false;
                    wateringCan.pourProgress = 0;
                    wateringCan.targetPotRef = null;
                    // Clear pot watering state
                    if (targetPot) {
                        targetPot.isBeingWatered = false;
                        targetPot.waterPourProgress = 0;
                    }
                    // Reset water interaction timer
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
                // Water the plant — set tilt state
                wateringCan.isOverPot = true;
                wateringCan.targetPotRef = targetPot;

                const waterTime = this.gameMode === 'competitive'
                    ? (this.waterInteractionTimeMap.get(zoneKey) || 0)
                    : this.waterInteractionTime;

                const newWaterTime = waterTime + 0.016;

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

// Backward compatibility alias
const BALLOON_COLORS = PLANT_TYPES;
