/**
 * Garden System - Tools
 * DraggableSeed, WateringCan, and FertilizerBag classes
 */


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
        this.plantInfo = PLANT_TYPES[plantType] || { name: 'Seed', icon: '🌱', plantColor: '#4ade80' };
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
        drawUnmirroredText(ctx, this.plantInfo.icon, this.x, this.y);

        // Label
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#5D4037';
        drawUnmirroredText(ctx, this.plantInfo.name, this.x, this.y + this.size);

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

        // Golden sparkle animation time (accumulated via deltaTime)
        this.sparkleTime = 0;
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

        // Advance sparkle timer
        this.sparkleTime += deltaTime * 5;

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
            for (let i = 0; i < 3; i++) {
                const angle = (this.sparkleTime + i * Math.PI * 2 / 3) % (Math.PI * 2);
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
        drawUnmirroredText(ctx, '🌱', this.x, this.y - 10);

        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#fff';
        drawUnmirroredText(ctx, 'FOOD', this.x, this.y + 20);

        ctx.restore();
    }
}
