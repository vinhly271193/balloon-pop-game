/**
 * Garden System - Effects
 * MagicPumpkin, HintArrow, and ConfettiParticle classes
 */


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
            drawUnmirroredText(ctx, 'Both players touch!', this.x, this.y - 80, true);
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
        drawUnmirroredText(ctx, text, tooltipX, tooltipY);

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
