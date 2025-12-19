/**
 * Balloon Class for Balloon Pop Game
 * Handles balloon rendering, animation, and collision detection
 */

// Balloon color definitions with high contrast values
const BALLOON_COLORS = {
    red: {
        name: 'RED',
        primary: '#FF3B30',
        secondary: '#CC2F26',
        highlight: '#FF6961'
    },
    blue: {
        name: 'BLUE',
        primary: '#007AFF',
        secondary: '#0062CC',
        highlight: '#4DA3FF'
    },
    green: {
        name: 'GREEN',
        primary: '#34C759',
        secondary: '#2AA147',
        highlight: '#67D989'
    },
    yellow: {
        name: 'YELLOW',
        primary: '#FFCC00',
        secondary: '#CCA300',
        highlight: '#FFD94D'
    },
    purple: {
        name: 'PURPLE',
        primary: '#AF52DE',
        secondary: '#8C42B2',
        highlight: '#C77DEB'
    }
};

class Balloon {
    constructor(x, y, colorKey, canvas) {
        this.x = x;
        this.y = y;
        this.colorKey = colorKey;
        this.color = BALLOON_COLORS[colorKey];
        this.canvas = canvas;

        // Size properties - large for accessibility
        this.width = 100;
        this.height = 130;
        this.hitRadius = 70; // Generous hit zone

        // Movement properties
        this.baseSpeed = 1.5;
        this.speed = this.baseSpeed + Math.random() * 0.5;
        this.wobbleOffset = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.02 + Math.random() * 0.02;
        this.wobbleAmount = 20 + Math.random() * 10;

        // State
        this.isPopped = false;
        this.isOffScreen = false;

        // Pop animation
        this.popParticles = [];
        this.popAnimationTime = 0;
        this.popAnimationDuration = 0.5;
    }

    /**
     * Update balloon position and state
     */
    update(deltaTime, speedMultiplier = 1) {
        if (this.isPopped) {
            this.updatePopAnimation(deltaTime);
            return;
        }

        // Move upward
        this.y -= this.speed * speedMultiplier;

        // Wobble side to side
        this.wobbleOffset += this.wobbleSpeed;
        this.x += Math.sin(this.wobbleOffset) * 0.5;

        // Check if off screen
        if (this.y + this.height < 0) {
            this.isOffScreen = true;
        }
    }

    /**
     * Update pop animation particles
     */
    updatePopAnimation(deltaTime) {
        this.popAnimationTime += deltaTime;

        this.popParticles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.5; // Gravity
            particle.alpha -= 0.02;
            particle.scale *= 0.95;
        });

        // Remove dead particles
        this.popParticles = this.popParticles.filter(p => p.alpha > 0);
    }

    /**
     * Draw the balloon
     */
    draw(ctx) {
        if (this.isPopped) {
            this.drawPopAnimation(ctx);
            return;
        }

        const x = this.x;
        const y = this.y;
        const w = this.width;
        const h = this.height;

        ctx.save();

        // Draw balloon body (ellipse)
        ctx.beginPath();
        ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);

        // Gradient fill for 3D effect
        const gradient = ctx.createRadialGradient(
            x - w * 0.2, y - h * 0.2, 0,
            x, y, w * 0.6
        );
        gradient.addColorStop(0, this.color.highlight);
        gradient.addColorStop(0.5, this.color.primary);
        gradient.addColorStop(1, this.color.secondary);

        ctx.fillStyle = gradient;
        ctx.fill();

        // Highlight shine
        ctx.beginPath();
        ctx.ellipse(x - w * 0.15, y - h * 0.2, w * 0.15, h * 0.1, -0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();

        // Draw balloon knot/tie
        ctx.beginPath();
        ctx.moveTo(x - 8, y + h / 2 - 5);
        ctx.lineTo(x, y + h / 2 + 10);
        ctx.lineTo(x + 8, y + h / 2 - 5);
        ctx.closePath();
        ctx.fillStyle = this.color.secondary;
        ctx.fill();

        // Draw string
        ctx.beginPath();
        ctx.moveTo(x, y + h / 2 + 10);
        ctx.quadraticCurveTo(
            x + Math.sin(this.wobbleOffset * 2) * 10,
            y + h / 2 + 40,
            x + Math.sin(this.wobbleOffset) * 5,
            y + h / 2 + 60
        );
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Draw pop animation particles
     */
    drawPopAnimation(ctx) {
        ctx.save();

        this.popParticles.forEach(particle => {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * particle.scale, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${particle.r}, ${particle.g}, ${particle.b}, ${particle.alpha})`;
            ctx.fill();
        });

        ctx.restore();
    }

    /**
     * Check collision with a point (hand position)
     */
    checkCollision(pointX, pointY) {
        if (this.isPopped) return false;

        const dx = pointX - this.x;
        const dy = pointY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < this.hitRadius;
    }

    /**
     * Pop the balloon
     */
    pop() {
        if (this.isPopped) return;

        this.isPopped = true;
        this.createPopParticles();

        // Play pop sound
        if (typeof audioManager !== 'undefined') {
            audioManager.play('pop');
        }
    }

    /**
     * Create particles for pop animation
     */
    createPopParticles() {
        // Parse hex color to RGB
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 255, g: 255, b: 255 };
        };

        const rgb = hexToRgb(this.color.primary);
        const particleCount = 15;

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.5;
            const speed = 5 + Math.random() * 8;

            this.popParticles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3,
                size: 8 + Math.random() * 12,
                scale: 1,
                alpha: 1,
                r: rgb.r,
                g: rgb.g,
                b: rgb.b
            });
        }
    }

    /**
     * Check if balloon animation is complete
     */
    isAnimationComplete() {
        return this.isPopped && this.popParticles.length === 0;
    }

    /**
     * Set balloon speed multiplier
     */
    setSpeed(multiplier) {
        this.speed = this.baseSpeed * multiplier;
    }
}

/**
 * Balloon Spawner - manages balloon creation
 */
class BalloonSpawner {
    constructor(canvas) {
        this.canvas = canvas;
        this.balloons = [];
        this.spawnTimer = 0;
        this.baseSpawnInterval = 1500; // ms
        this.spawnInterval = this.baseSpawnInterval;
        this.speedMultiplier = 1;
    }

    /**
     * Update spawner and all balloons
     */
    update(deltaTime) {
        this.spawnTimer += deltaTime * 1000;

        // Spawn new balloon if timer elapsed
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnBalloon();
            this.spawnTimer = 0;
        }

        // Update all balloons
        this.balloons.forEach(balloon => {
            balloon.update(deltaTime, this.speedMultiplier);
        });

        // Remove off-screen and fully animated balloons
        this.balloons = this.balloons.filter(balloon =>
            !balloon.isOffScreen && !balloon.isAnimationComplete()
        );
    }

    /**
     * Draw all balloons
     */
    draw(ctx) {
        // Draw balloons in order (oldest first so newest appear on top)
        this.balloons.forEach(balloon => {
            balloon.draw(ctx);
        });
    }

    /**
     * Spawn a new balloon at random position
     */
    spawnBalloon(specificColor = null) {
        const padding = 100;
        const x = padding + Math.random() * (this.canvas.width - padding * 2);
        const y = this.canvas.height + 100;

        const colorKeys = Object.keys(BALLOON_COLORS);
        const colorKey = specificColor || colorKeys[Math.floor(Math.random() * colorKeys.length)];

        const balloon = new Balloon(x, y, colorKey, this.canvas);
        balloon.setSpeed(this.speedMultiplier);
        this.balloons.push(balloon);

        return balloon;
    }

    /**
     * Spawn balloon of specific color
     */
    spawnColoredBalloon(colorKey) {
        return this.spawnBalloon(colorKey);
    }

    /**
     * Check collision with hand positions and pop balloons
     * Returns array of popped balloon color keys
     */
    checkCollisions(handPositions) {
        const poppedColors = [];

        handPositions.forEach(pos => {
            this.balloons.forEach(balloon => {
                if (!balloon.isPopped && balloon.checkCollision(pos.x, pos.y)) {
                    balloon.pop();
                    poppedColors.push(balloon.colorKey);
                }
            });
        });

        return poppedColors;
    }

    /**
     * Set difficulty parameters
     */
    setDifficulty(level) {
        // Decrease spawn interval (more balloons) as level increases
        this.spawnInterval = Math.max(800, this.baseSpawnInterval - (level - 1) * 100);

        // Increase speed slightly
        this.speedMultiplier = 1 + (level - 1) * 0.15;
    }

    /**
     * Clear all balloons
     */
    clear() {
        this.balloons = [];
        this.spawnTimer = 0;
    }

    /**
     * Get active balloon count
     */
    getActiveBalloonCount() {
        return this.balloons.filter(b => !b.isPopped).length;
    }
}
