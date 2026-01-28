/**
 * Garden System for Garden Grow Game
 * Handles seed rendering, growth animation, and harvest mechanics
 */

// Plant type definitions with garden theme
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
    SEED: 'seed',
    SPROUTING: 'sprouting',
    GROWING: 'growing',
    BLOOMING: 'blooming',
    HARVESTED: 'harvested'
};

class Seed {
    constructor(x, y, plantKey, canvas) {
        this.x = x;
        this.y = y;
        this.plantKey = plantKey;
        this.plant = PLANT_TYPES[plantKey];
        this.canvas = canvas;

        // Size properties - generous for accessibility
        this.seedSize = 20;
        this.maxPlantHeight = 120;
        this.hitRadius = 70; // Generous hit zone for accessibility

        // Movement properties - slower than balloons for therapeutic feel
        this.baseSpeed = 0.8;
        this.speed = this.baseSpeed + Math.random() * 0.3;
        this.swayOffset = Math.random() * Math.PI * 2;
        this.swaySpeed = 0.015 + Math.random() * 0.01;
        this.swayAmount = 8 + Math.random() * 5;

        // State
        this.growthStage = GrowthStage.SEED;
        this.growthProgress = 0; // 0 to 1
        this.isHarvested = false;
        this.isOffScreen = false;
        this.isTouched = false;

        // Growth animation timing
        this.growthStartTime = 0;
        this.growthDuration = 1000; // 1 second to fully grow

        // Harvest animation
        this.harvestParticles = [];
        this.harvestAnimationTime = 0;
        this.harvestAnimationDuration = 0.8;
        this.floatingIcon = null;

        // Sparkle effect
        this.sparkles = [];
    }

    /**
     * Update seed/plant position and state
     */
    update(deltaTime, speedMultiplier = 1) {
        if (this.isHarvested) {
            this.updateHarvestAnimation(deltaTime);
            return;
        }

        if (this.isTouched) {
            this.updateGrowth(deltaTime);
            return;
        }

        // Move upward slowly
        this.y -= this.speed * speedMultiplier;

        // Gentle swaying like plants in breeze
        this.swayOffset += this.swaySpeed;
        this.x += Math.sin(this.swayOffset) * 0.3;

        // Check if off screen
        if (this.y + this.maxPlantHeight < 0) {
            this.isOffScreen = true;
        }
    }

    /**
     * Update growth animation when touched
     */
    updateGrowth(deltaTime) {
        const now = Date.now();
        const elapsed = now - this.growthStartTime;
        this.growthProgress = Math.min(elapsed / this.growthDuration, 1);

        // Update growth stage based on progress
        if (this.growthProgress < 0.3) {
            this.growthStage = GrowthStage.SPROUTING;
        } else if (this.growthProgress < 0.6) {
            this.growthStage = GrowthStage.GROWING;
        } else if (this.growthProgress < 1) {
            this.growthStage = GrowthStage.BLOOMING;
        } else {
            // Growth complete - harvest!
            this.harvest();
        }

        // Add sparkles during growth
        if (Math.random() < 0.3) {
            this.addSparkle();
        }

        // Update sparkles
        this.sparkles = this.sparkles.filter(s => {
            s.life -= deltaTime;
            s.y -= 1;
            s.alpha = s.life / s.maxLife;
            return s.life > 0;
        });
    }

    /**
     * Add a sparkle effect
     */
    addSparkle() {
        this.sparkles.push({
            x: this.x + (Math.random() - 0.5) * 60,
            y: this.y - this.growthProgress * this.maxPlantHeight * 0.5 + (Math.random() - 0.5) * 40,
            size: 2 + Math.random() * 4,
            alpha: 1,
            life: 0.5 + Math.random() * 0.5,
            maxLife: 0.5 + Math.random() * 0.5
        });
    }

    /**
     * Update harvest animation particles
     */
    updateHarvestAnimation(deltaTime) {
        this.harvestAnimationTime += deltaTime;

        // Update particles
        this.harvestParticles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2; // Gentle gravity
            particle.alpha -= 0.015;
            particle.scale *= 0.98;
        });

        // Update floating icon
        if (this.floatingIcon) {
            this.floatingIcon.y -= 2;
            this.floatingIcon.alpha -= 0.02;
            this.floatingIcon.scale += 0.01;
        }

        // Remove dead particles
        this.harvestParticles = this.harvestParticles.filter(p => p.alpha > 0);
    }

    /**
     * Draw the seed/plant
     */
    draw(ctx) {
        if (this.isHarvested) {
            this.drawHarvestAnimation(ctx);
            return;
        }

        ctx.save();

        // Apply gentle sway
        const swayAngle = Math.sin(this.swayOffset) * 0.05;
        ctx.translate(this.x, this.y);
        ctx.rotate(swayAngle);
        ctx.translate(-this.x, -this.y);

        if (!this.isTouched) {
            this.drawSeed(ctx);
        } else {
            this.drawGrowingPlant(ctx);
        }

        // Draw sparkles
        this.drawSparkles(ctx);

        ctx.restore();
    }

    /**
     * Draw seed (before touched)
     */
    drawSeed(ctx) {
        const x = this.x;
        const y = this.y;

        // Seed body (oval shape)
        ctx.beginPath();
        ctx.ellipse(x, y, this.seedSize * 0.6, this.seedSize, 0, 0, Math.PI * 2);

        // Gradient for 3D effect
        const gradient = ctx.createRadialGradient(
            x - this.seedSize * 0.2, y - this.seedSize * 0.3, 0,
            x, y, this.seedSize
        );
        gradient.addColorStop(0, this.lightenColor(this.plant.seedColor, 40));
        gradient.addColorStop(0.5, this.plant.seedColor);
        gradient.addColorStop(1, this.darkenColor(this.plant.seedColor, 30));

        ctx.fillStyle = gradient;
        ctx.fill();

        // Seed highlight
        ctx.beginPath();
        ctx.ellipse(x - this.seedSize * 0.2, y - this.seedSize * 0.3, this.seedSize * 0.2, this.seedSize * 0.15, -0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();

        // Seed texture lines
        ctx.beginPath();
        ctx.moveTo(x, y - this.seedSize * 0.7);
        ctx.lineTo(x, y + this.seedSize * 0.7);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    /**
     * Draw growing plant based on growth stage
     */
    drawGrowingPlant(ctx) {
        const x = this.x;
        const baseY = this.y;
        const progress = this.growthProgress;

        // Calculate current plant height
        const currentHeight = progress * this.maxPlantHeight;

        // Draw soil mound at base
        this.drawSoilMound(ctx, x, baseY);

        if (this.growthStage === GrowthStage.SPROUTING) {
            // Stage 1: Tiny sprout emerging
            this.drawSprout(ctx, x, baseY, progress / 0.3);
        } else if (this.growthStage === GrowthStage.GROWING) {
            // Stage 2: Stem growing with leaves
            const stageProgress = (progress - 0.3) / 0.3;
            this.drawStem(ctx, x, baseY, 0.3 + stageProgress * 0.4);
            this.drawLeaves(ctx, x, baseY, stageProgress);
        } else if (this.growthStage === GrowthStage.BLOOMING) {
            // Stage 3: Full plant with fruit/flower
            const stageProgress = (progress - 0.6) / 0.4;
            this.drawStem(ctx, x, baseY, 0.7 + stageProgress * 0.3);
            this.drawLeaves(ctx, x, baseY, 1);
            this.drawFruit(ctx, x, baseY, stageProgress);
        }
    }

    /**
     * Draw soil mound at plant base
     */
    drawSoilMound(ctx, x, y) {
        ctx.beginPath();
        ctx.ellipse(x, y + 5, 25, 10, 0, 0, Math.PI);
        ctx.fillStyle = '#8B4513';
        ctx.fill();

        // Soil texture
        ctx.beginPath();
        ctx.ellipse(x, y + 5, 20, 7, 0, 0, Math.PI);
        ctx.fillStyle = '#A0522D';
        ctx.fill();
    }

    /**
     * Draw initial sprout
     */
    drawSprout(ctx, x, baseY, progress) {
        const sproutHeight = progress * 30;

        // Curved stem
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.quadraticCurveTo(
            x + 5 * progress,
            baseY - sproutHeight * 0.5,
            x,
            baseY - sproutHeight
        );
        ctx.strokeStyle = '#90EE90';
        ctx.lineWidth = 3 + progress * 2;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Tiny leaf bud
        if (progress > 0.5) {
            ctx.beginPath();
            ctx.ellipse(x, baseY - sproutHeight, 5 * (progress - 0.5) * 2, 8 * (progress - 0.5) * 2, 0.3, 0, Math.PI * 2);
            ctx.fillStyle = '#98FB98';
            ctx.fill();
        }
    }

    /**
     * Draw plant stem
     */
    drawStem(ctx, x, baseY, heightProgress) {
        const stemHeight = heightProgress * this.maxPlantHeight;

        // Main stem with slight curve
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.quadraticCurveTo(
            x + Math.sin(this.swayOffset) * 5,
            baseY - stemHeight * 0.5,
            x,
            baseY - stemHeight
        );

        // Stem gradient
        const gradient = ctx.createLinearGradient(x, baseY, x, baseY - stemHeight);
        gradient.addColorStop(0, '#228B22');
        gradient.addColorStop(1, '#32CD32');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 6 - heightProgress * 2;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    /**
     * Draw leaves
     */
    drawLeaves(ctx, x, baseY, progress) {
        const stemHeight = (0.3 + progress * 0.4) * this.maxPlantHeight;

        // Left leaf
        this.drawLeaf(ctx, x - 5, baseY - stemHeight * 0.4, -0.6, 15 * progress, 25 * progress);

        // Right leaf
        this.drawLeaf(ctx, x + 5, baseY - stemHeight * 0.5, 0.6, 15 * progress, 25 * progress);

        // Top leaves if progress > 0.5
        if (progress > 0.5) {
            const topProgress = (progress - 0.5) * 2;
            this.drawLeaf(ctx, x - 3, baseY - stemHeight * 0.7, -0.4, 10 * topProgress, 18 * topProgress);
            this.drawLeaf(ctx, x + 3, baseY - stemHeight * 0.75, 0.4, 10 * topProgress, 18 * topProgress);
        }
    }

    /**
     * Draw a single leaf
     */
    drawLeaf(ctx, x, y, angle, width, height) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // Leaf shape
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(width, -height * 0.3, width * 0.8, -height);
        ctx.quadraticCurveTo(0, -height * 0.7, 0, 0);

        const gradient = ctx.createLinearGradient(0, 0, width, -height);
        gradient.addColorStop(0, '#228B22');
        gradient.addColorStop(1, '#90EE90');

        ctx.fillStyle = gradient;
        ctx.fill();

        // Leaf vein
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(width * 0.5, -height * 0.4, width * 0.7, -height * 0.8);
        ctx.strokeStyle = 'rgba(0, 100, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Draw fruit/flower at top
     */
    drawFruit(ctx, x, baseY, progress) {
        const stemHeight = this.maxPlantHeight;
        const fruitY = baseY - stemHeight + 10;
        const fruitSize = 20 + progress * 15;

        // Different fruit rendering based on plant type
        ctx.save();

        if (this.plantKey === 'sunflower') {
            // Sunflower - yellow petals around brown center
            this.drawSunflower(ctx, x, fruitY, fruitSize, progress);
        } else if (this.plantKey === 'carrot') {
            // Carrot - orange root showing from soil
            this.drawCarrot(ctx, x, baseY, fruitSize, progress);
        } else {
            // Default fruit (tomato, blueberry, lettuce)
            this.drawDefaultFruit(ctx, x, fruitY, fruitSize, progress);
        }

        ctx.restore();
    }

    /**
     * Draw sunflower
     */
    drawSunflower(ctx, x, y, size, progress) {
        // Petals
        const petalCount = 12;
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);

            ctx.beginPath();
            ctx.ellipse(0, -size * 0.8, size * 0.25, size * 0.6, 0, 0, Math.PI * 2);
            ctx.fillStyle = this.plant.plantColor;
            ctx.fill();

            ctx.restore();
        }

        // Center
        ctx.beginPath();
        ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#8B4513';
        ctx.fill();

        // Center texture
        ctx.beginPath();
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#654321';
        ctx.fill();
    }

    /**
     * Draw carrot (visible from soil)
     */
    drawCarrot(ctx, x, baseY, size, progress) {
        // Carrot top greens
        for (let i = 0; i < 5; i++) {
            const angle = (i - 2) * 0.3;
            ctx.save();
            ctx.translate(x, baseY - 30);
            ctx.rotate(angle);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -40 * progress);
            ctx.strokeStyle = '#228B22';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Feathery leaves
            for (let j = 1; j < 4; j++) {
                ctx.beginPath();
                ctx.moveTo(0, -j * 10);
                ctx.lineTo(-8, -j * 10 - 5);
                ctx.moveTo(0, -j * 10);
                ctx.lineTo(8, -j * 10 - 5);
                ctx.strokeStyle = '#32CD32';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            ctx.restore();
        }

        // Carrot body peeking from soil
        if (progress > 0.5) {
            const carrotShow = (progress - 0.5) * 2;
            ctx.beginPath();
            ctx.moveTo(x - 12, baseY);
            ctx.lineTo(x + 12, baseY);
            ctx.lineTo(x, baseY + 20 * carrotShow);
            ctx.closePath();
            ctx.fillStyle = this.plant.plantColor;
            ctx.fill();
        }
    }

    /**
     * Draw default round fruit
     */
    drawDefaultFruit(ctx, x, y, size, progress) {
        // Main fruit body
        ctx.beginPath();
        ctx.arc(x, y, size * progress, 0, Math.PI * 2);

        const gradient = ctx.createRadialGradient(
            x - size * 0.3, y - size * 0.3, 0,
            x, y, size
        );
        gradient.addColorStop(0, this.lightenColor(this.plant.plantColor, 30));
        gradient.addColorStop(0.5, this.plant.plantColor);
        gradient.addColorStop(1, this.darkenColor(this.plant.plantColor, 20));

        ctx.fillStyle = gradient;
        ctx.fill();

        // Highlight
        ctx.beginPath();
        ctx.ellipse(x - size * 0.25, y - size * 0.25, size * 0.2, size * 0.15, -0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();

        // Small stem on top for tomato/blueberry
        if (this.plantKey !== 'lettuce') {
            ctx.beginPath();
            ctx.moveTo(x - 3, y - size * progress + 2);
            ctx.lineTo(x, y - size * progress - 5);
            ctx.lineTo(x + 3, y - size * progress + 2);
            ctx.fillStyle = '#228B22';
            ctx.fill();
        }
    }

    /**
     * Draw sparkle effects
     */
    drawSparkles(ctx) {
        this.sparkles.forEach(sparkle => {
            ctx.beginPath();
            ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 200, ${sparkle.alpha})`;
            ctx.fill();
        });
    }

    /**
     * Draw harvest animation
     */
    drawHarvestAnimation(ctx) {
        ctx.save();

        // Draw particles
        this.harvestParticles.forEach(particle => {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * particle.scale, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${particle.r}, ${particle.g}, ${particle.b}, ${particle.alpha})`;
            ctx.fill();
        });

        // Draw floating icon
        if (this.floatingIcon && this.floatingIcon.alpha > 0) {
            ctx.globalAlpha = this.floatingIcon.alpha;
            ctx.font = `${40 * this.floatingIcon.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.plant.icon, this.floatingIcon.x, this.floatingIcon.y);
        }

        ctx.restore();
    }

    /**
     * Check collision with a point (hand position)
     */
    checkCollision(pointX, pointY) {
        if (this.isHarvested || this.isTouched) return false;

        const dx = pointX - this.x;
        const dy = pointY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < this.hitRadius;
    }

    /**
     * Start growth when touched by hand
     */
    touch() {
        if (this.isTouched || this.isHarvested) return;

        this.isTouched = true;
        this.growthStartTime = Date.now();
        this.growthStage = GrowthStage.SPROUTING;

        // Play plant sound
        if (typeof audioManager !== 'undefined') {
            audioManager.play('plant');
        }
    }

    /**
     * Harvest the plant (called when growth completes)
     */
    harvest() {
        if (this.isHarvested) return;

        this.isHarvested = true;
        this.growthStage = GrowthStage.HARVESTED;
        this.createHarvestParticles();

        // Create floating icon
        this.floatingIcon = {
            x: this.x,
            y: this.y - this.maxPlantHeight,
            alpha: 1,
            scale: 1
        };

        // Play harvest sound
        if (typeof audioManager !== 'undefined') {
            audioManager.play('harvest');
        }
    }

    /**
     * Create particles for harvest animation
     */
    createHarvestParticles() {
        const rgb = this.hexToRgb(this.plant.plantColor);
        const particleCount = 12;

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.5;
            const speed = 3 + Math.random() * 5;

            this.harvestParticles.push({
                x: this.x,
                y: this.y - this.maxPlantHeight * 0.7,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size: 5 + Math.random() * 8,
                scale: 1,
                alpha: 1,
                r: rgb.r,
                g: rgb.g,
                b: rgb.b
            });
        }

        // Add some green leaf particles
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;

            this.harvestParticles.push({
                x: this.x + (Math.random() - 0.5) * 30,
                y: this.y - this.maxPlantHeight * 0.5,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                size: 4 + Math.random() * 6,
                scale: 1,
                alpha: 1,
                r: 50,
                g: 200,
                b: 50
            });
        }
    }

    /**
     * Check if harvest animation is complete
     */
    isAnimationComplete() {
        return this.isHarvested && this.harvestParticles.length === 0 &&
               (!this.floatingIcon || this.floatingIcon.alpha <= 0);
    }

    /**
     * Set seed speed multiplier
     */
    setSpeed(multiplier) {
        this.speed = this.baseSpeed * multiplier;
    }

    // Color utility functions
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }

    lightenColor(hex, percent) {
        const rgb = this.hexToRgb(hex);
        const lighten = (c) => Math.min(255, Math.floor(c + (255 - c) * (percent / 100)));
        return `rgb(${lighten(rgb.r)}, ${lighten(rgb.g)}, ${lighten(rgb.b)})`;
    }

    darkenColor(hex, percent) {
        const rgb = this.hexToRgb(hex);
        const darken = (c) => Math.floor(c * (1 - percent / 100));
        return `rgb(${darken(rgb.r)}, ${darken(rgb.g)}, ${darken(rgb.b)})`;
    }
}

/**
 * Garden Bed (Seed Spawner) - manages seed creation and the garden
 */
class GardenBed {
    constructor(canvas) {
        this.canvas = canvas;
        this.seeds = [];
        this.spawnTimer = 0;
        this.baseSpawnInterval = 2000; // Slower than balloons - more therapeutic
        this.spawnInterval = this.baseSpawnInterval;
        this.speedMultiplier = 1;

        // Soil strip height at bottom
        this.soilHeight = 60;
    }

    /**
     * Update garden bed and all seeds
     */
    update(deltaTime) {
        this.spawnTimer += deltaTime * 1000;

        // Spawn new seed if timer elapsed
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnSeed();
            this.spawnTimer = 0;
        }

        // Update all seeds
        this.seeds.forEach(seed => {
            seed.update(deltaTime, this.speedMultiplier);
        });

        // Remove off-screen and fully animated seeds
        this.seeds = this.seeds.filter(seed =>
            !seed.isOffScreen && !seed.isAnimationComplete()
        );
    }

    /**
     * Draw soil strip and all seeds
     */
    draw(ctx) {
        // Draw soil strip at bottom
        this.drawSoil(ctx);

        // Draw seeds in order (oldest first so newest appear on top)
        this.seeds.forEach(seed => {
            seed.draw(ctx);
        });
    }

    /**
     * Draw the soil strip at bottom of screen
     */
    drawSoil(ctx) {
        const soilY = this.canvas.height - this.soilHeight;

        // Main soil
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, soilY, this.canvas.width, this.soilHeight);

        // Soil texture - darker layer
        ctx.fillStyle = '#654321';
        ctx.fillRect(0, soilY, this.canvas.width, 10);

        // Add some grass tufts
        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 2;
        for (let x = 20; x < this.canvas.width; x += 40 + Math.random() * 30) {
            const grassHeight = 15 + Math.random() * 10;
            ctx.beginPath();
            ctx.moveTo(x, soilY);
            ctx.quadraticCurveTo(x - 5, soilY - grassHeight / 2, x - 3, soilY - grassHeight);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, soilY);
            ctx.quadraticCurveTo(x + 3, soilY - grassHeight / 2, x + 5, soilY - grassHeight);
            ctx.stroke();
        }
    }

    /**
     * Spawn a new seed from soil
     */
    spawnSeed(specificPlant = null) {
        const padding = 100;
        const x = padding + Math.random() * (this.canvas.width - padding * 2);
        const y = this.canvas.height - this.soilHeight + 20; // Start just above soil

        const plantKeys = Object.keys(PLANT_TYPES);
        const plantKey = specificPlant || plantKeys[Math.floor(Math.random() * plantKeys.length)];

        const seed = new Seed(x, y, plantKey, this.canvas);
        seed.setSpeed(this.speedMultiplier);
        this.seeds.push(seed);

        return seed;
    }

    /**
     * Spawn seed of specific plant type
     */
    spawnSpecificSeed(plantKey) {
        return this.spawnSeed(plantKey);
    }

    /**
     * Check collision with hand positions and trigger growth
     * Returns array of touched plant keys (for harvest tracking)
     */
    checkCollisions(handPositions) {
        const harvestedPlants = [];

        handPositions.forEach(pos => {
            this.seeds.forEach(seed => {
                if (!seed.isTouched && !seed.isHarvested && seed.checkCollision(pos.x, pos.y)) {
                    seed.touch();
                    // The seed will harvest itself after growth completes
                    // We track it here for when it completes
                }
            });
        });

        // Check for completed harvests
        this.seeds.forEach(seed => {
            if (seed.isHarvested && seed.harvestAnimationTime < 0.1) {
                // Just harvested this frame
                harvestedPlants.push(seed.plantKey);
            }
        });

        return harvestedPlants;
    }

    /**
     * Set difficulty parameters
     */
    setDifficulty(level) {
        // Slightly decrease spawn interval as level increases, but keep it relaxing
        this.spawnInterval = Math.max(1200, this.baseSpawnInterval - (level - 1) * 80);

        // Gentle speed increase
        this.speedMultiplier = 1 + (level - 1) * 0.1;
    }

    /**
     * Clear all seeds
     */
    clear() {
        this.seeds = [];
        this.spawnTimer = 0;
    }

    /**
     * Get active seed count
     */
    getActiveSeedCount() {
        return this.seeds.filter(s => !s.isHarvested).length;
    }
}

// Backward compatibility - keep BALLOON_COLORS alias
const BALLOON_COLORS = PLANT_TYPES;
