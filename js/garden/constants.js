/**
 * Garden System - Constants
 * Plant type definitions, growth stages, and utility functions
 */

/**
 * Garden System for Garden Grow Game
 * Plant nurturing gameplay with needs management
 */

/** Counter-mirror text so it reads correctly on the CSS-mirrored canvas */
function drawUnmirroredText(ctx, text, x, y, stroke) {
    ctx.save();
    // Swap left/right alignment for the flipped context
    if (ctx.textAlign === 'left') ctx.textAlign = 'right';
    else if (ctx.textAlign === 'right') ctx.textAlign = 'left';
    ctx.translate(x, 0);
    ctx.scale(-1, 1);
    if (stroke) ctx.strokeText(text, 0, y);
    ctx.fillText(text, 0, y);
    ctx.restore();
}

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
