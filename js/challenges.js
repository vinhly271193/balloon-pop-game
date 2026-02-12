/**
 * Task System for Garden Grow Game
 * Defines gardening challenges and tracks progress
 */

// Challenge definitions - garden themed
const CHALLENGE_TEMPLATES = [
    // Level 1: Simple - any plants
    {
        level: 1,
        type: 'any',
        targets: [{ color: 'any', count: 3 }],
        timeLimit: 60,
        description: 'Grow 3 plants!'
    },
    // Level 2: Single plant type
    {
        level: 2,
        type: 'single',
        targets: [{ color: 'tomato', count: 5 }],
        timeLimit: 60,
        description: 'Grow 5 TOMATO plants!'
    },
    // Level 3: Different plant type
    {
        level: 3,
        type: 'single',
        targets: [{ color: 'sunflower', count: 4 }],
        timeLimit: 55,
        description: 'Grow 4 SUNFLOWER plants!'
    },
    // Level 4: Single type, more
    {
        level: 4,
        type: 'single',
        targets: [{ color: 'carrot', count: 5 }],
        timeLimit: 55,
        description: 'Grow 5 CARROT plants!'
    },
    // Level 5: Two types
    {
        level: 5,
        type: 'multi',
        targets: [
            { color: 'tomato', count: 3 },
            { color: 'sunflower', count: 2 }
        ],
        timeLimit: 50,
        description: 'Grow 3 TOMATO and 2 SUNFLOWER!'
    },
    // Level 6: Lettuce focus
    {
        level: 6,
        type: 'single',
        targets: [{ color: 'lettuce', count: 5 }],
        timeLimit: 50,
        description: 'Grow 5 LETTUCE plants!'
    },
    // Level 7: Blueberry focus
    {
        level: 7,
        type: 'single',
        targets: [{ color: 'blueberry', count: 5 }],
        timeLimit: 50,
        description: 'Grow 5 BLUEBERRY plants!'
    },
    // Level 8: Two types
    {
        level: 8,
        type: 'multi',
        targets: [
            { color: 'carrot', count: 3 },
            { color: 'lettuce', count: 3 }
        ],
        timeLimit: 45,
        description: 'Grow 3 CARROT and 3 LETTUCE!'
    },
    // Level 9: Higher count
    {
        level: 9,
        type: 'single',
        targets: [{ color: 'tomato', count: 7 }],
        timeLimit: 45,
        description: 'Grow 7 TOMATO plants!'
    },
    // Level 10: Two types, higher
    {
        level: 10,
        type: 'multi',
        targets: [
            { color: 'sunflower', count: 4 },
            { color: 'blueberry', count: 3 }
        ],
        timeLimit: 45,
        description: 'Grow 4 SUNFLOWER and 3 BLUEBERRY!'
    }
];

class Challenge {
    constructor(template) {
        this.level = template.level;
        this.type = template.type;
        this.targets = JSON.parse(JSON.stringify(template.targets)); // Deep copy
        this.timeLimit = template.timeLimit;
        this.description = template.description;

        // Progress tracking
        this.progress = {};
        this.targets.forEach(target => {
            this.progress[target.color] = 0;
        });

        this.isComplete = false;
        this.score = 0;
        this.totalHarvested = 0;
    }

    /**
     * Record a harvested plant
     * @param {string} plantKey - The type of plant harvested
     * @returns {boolean} - Whether this plant counted toward the challenge
     */
    recordHarvest(plantKey) {
        this.totalHarvested++;

        if (this.type === 'any') {
            // Any plant counts
            this.progress['any'] = (this.progress['any'] || 0) + 1;
            this.score += 10;
            this.checkCompletion();
            return true;
        }

        // Check if this plant type is a target
        const target = this.targets.find(t => t.color === plantKey);
        if (target) {
            if (this.progress[plantKey] < target.count) {
                this.progress[plantKey]++;
                this.score += 10;
                this.checkCompletion();
                return true;
            }
        }

        // Bonus points for non-target plants (but they don't count toward goal)
        this.score += 2;
        return false;
    }

    /**
     * Check if challenge is complete
     */
    checkCompletion() {
        const complete = this.targets.every(target => {
            return (this.progress[target.color] || 0) >= target.count;
        });

        if (complete && !this.isComplete) {
            this.isComplete = true;
            // Bonus for completion
            this.score += 50;
        }
    }

    /**
     * Get progress as percentage (0-1)
     */
    getProgressPercent() {
        let total = 0;
        let achieved = 0;

        this.targets.forEach(target => {
            total += target.count;
            achieved += Math.min(this.progress[target.color] || 0, target.count);
        });

        return total > 0 ? achieved / total : 0;
    }

    /**
     * Get progress text (e.g., "2 / 5")
     */
    getProgressText() {
        if (this.targets.length === 1) {
            const target = this.targets[0];
            const current = Math.min(this.progress[target.color] || 0, target.count);
            return `${current} / ${target.count}`;
        }

        // Multi-target: show each
        return this.targets.map(target => {
            const current = Math.min(this.progress[target.color] || 0, target.count);
            const plantInfo = PLANT_TYPES[target.color];
            const displayName = plantInfo?.name || target.color.toUpperCase();
            return `${displayName}: ${current}/${target.count}`;
        }).join(' | ');
    }

    /**
     * Get mini display text for HUD
     */
    getMiniDisplayText() {
        return this.description;
    }

    /**
     * Get total harvested count (for display)
     */
    get totalPopped() {
        return this.totalHarvested;
    }
}

class ChallengeManager {
    constructor() {
        this.currentChallenge = null;
        this.currentLevel = 1;
        this.totalScore = 0;
        this.highScore = this.loadHighScore();
    }

    /**
     * Get challenge for a specific level
     */
    getChallenge(level) {
        // Find template for this level, or generate one for higher levels
        let template = CHALLENGE_TEMPLATES.find(t => t.level === level);

        if (!template) {
            // Generate challenge for levels beyond defined templates
            template = this.generateChallenge(level);
        }

        return new Challenge(template);
    }

    /**
     * Generate a challenge for higher levels
     */
    generateChallenge(level) {
        const plants = Object.keys(PLANT_TYPES);
        const difficulty = Math.min(level - 10, 10); // Cap difficulty scaling

        // Decide type: single or multi
        const isMulti = level > 12 && Math.random() > 0.5;

        if (isMulti && plants.length >= 2) {
            // Two plant challenge
            const plant1 = plants[Math.floor(Math.random() * plants.length)];
            let plant2 = plants[Math.floor(Math.random() * plants.length)];
            let attempts = 0;
            while (plant2 === plant1 && attempts < 20) {
                plant2 = plants[Math.floor(Math.random() * plants.length)];
                attempts++;
            }

            const count1 = 3 + Math.floor(difficulty / 2);
            const count2 = 2 + Math.floor(difficulty / 3);

            return {
                level,
                type: 'multi',
                targets: [
                    { color: plant1, count: count1 },
                    { color: plant2, count: count2 }
                ],
                timeLimit: Math.max(35, 50 - difficulty * 2),
                description: `Grow ${count1} ${PLANT_TYPES[plant1].name} and ${count2} ${PLANT_TYPES[plant2].name}!`
            };
        } else {
            // Single plant challenge
            const plant = plants[Math.floor(Math.random() * plants.length)];
            const count = 5 + Math.floor(difficulty / 2);

            return {
                level,
                type: 'single',
                targets: [{ color: plant, count }],
                timeLimit: Math.max(35, 50 - difficulty * 2),
                description: `Grow ${count} ${PLANT_TYPES[plant].name} plants!`
            };
        }
    }

    /**
     * Start a new challenge
     */
    startChallenge(level = null) {
        if (level !== null) {
            this.currentLevel = level;
        }

        this.currentChallenge = this.getChallenge(this.currentLevel);
        return this.currentChallenge;
    }

    /**
     * Record a plant harvest
     */
    recordHarvest(plantKey) {
        if (this.currentChallenge) {
            return this.currentChallenge.recordHarvest(plantKey);
        }
        return false;
    }

    /**
     * Complete current challenge and prepare for next
     */
    completeChallenge() {
        if (this.currentChallenge) {
            this.totalScore += this.currentChallenge.score;

            if (this.totalScore > this.highScore) {
                this.highScore = this.totalScore;
                this.saveHighScore();
            }
        }
    }

    /**
     * Advance to next level
     */
    nextLevel() {
        this.currentLevel++;
        return this.startChallenge();
    }

    /**
     * Restart from level 1
     */
    restart() {
        this.currentLevel = 1;
        this.totalScore = 0;
        return this.startChallenge();
    }

    /**
     * Get target plant types for current challenge (for spawn weighting)
     */
    getTargetColors() {
        if (!this.currentChallenge) return Object.keys(PLANT_TYPES);

        if (this.currentChallenge.type === 'any') {
            return Object.keys(PLANT_TYPES);
        }

        return this.currentChallenge.targets.map(t => t.color);
    }

    // Alias for garden theme
    getTargetPlants() {
        return this.getTargetColors();
    }

    /**
     * Save high score to localStorage
     */
    saveHighScore() {
        try {
            localStorage.setItem('gardenGrow_progress', JSON.stringify({
                highScore: this.highScore,
                highestLevel: Math.max(this.currentLevel, this.loadProgress().highestLevel || 1)
            }));
        } catch (e) {
            console.warn('Could not save progress:', e);
        }
    }

    /**
     * Load high score from localStorage
     */
    loadHighScore() {
        try {
            const progress = this.loadProgress();
            return progress.highScore || 0;
        } catch (e) {
            return 0;
        }
    }

    /**
     * Load full progress from localStorage
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem('gardenGrow_progress');
            return saved ? JSON.parse(saved) : { highScore: 0, highestLevel: 1 };
        } catch (e) {
            return { highScore: 0, highestLevel: 1 };
        }
    }
}

// Global challenge manager instance
const challengeManager = new ChallengeManager();
