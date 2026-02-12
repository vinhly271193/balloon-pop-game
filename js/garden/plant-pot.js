/**
 * Garden System - Plant Pot
 * Represents the plant pot where seeds are planted and grown
 */

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
            drawUnmirroredText(ctx, icons[i], iconX, iconY);
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
        drawUnmirroredText(ctx, '💧', iconX, iconY);

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
