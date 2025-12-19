/**
 * Challenge System for Balloon Pop Game
 * Defines challenges and tracks progress
 */

// Challenge definitions
const CHALLENGE_TEMPLATES = [
    // Level 1: Simple - any balloons
    {
        level: 1,
        type: 'any',
        targets: [{ color: 'any', count: 3 }],
        timeLimit: 60,
        description: 'Pop 3 balloons!'
    },
    // Level 2: Single color
    {
        level: 2,
        type: 'single',
        targets: [{ color: 'red', count: 5 }],
        timeLimit: 60,
        description: 'Pop 5 RED balloons!'
    },
    // Level 3: Different single color
    {
        level: 3,
        type: 'single',
        targets: [{ color: 'blue', count: 4 }],
        timeLimit: 55,
        description: 'Pop 4 BLUE balloons!'
    },
    // Level 4: Single color, more
    {
        level: 4,
        type: 'single',
        targets: [{ color: 'green', count: 5 }],
        timeLimit: 55,
        description: 'Pop 5 GREEN balloons!'
    },
    // Level 5: Two colors
    {
        level: 5,
        type: 'multi',
        targets: [
            { color: 'red', count: 3 },
            { color: 'blue', count: 2 }
        ],
        timeLimit: 50,
        description: 'Pop 3 RED and 2 BLUE!'
    },
    // Level 6: Yellow focus
    {
        level: 6,
        type: 'single',
        targets: [{ color: 'yellow', count: 5 }],
        timeLimit: 50,
        description: 'Pop 5 YELLOW balloons!'
    },
    // Level 7: Purple focus
    {
        level: 7,
        type: 'single',
        targets: [{ color: 'purple', count: 5 }],
        timeLimit: 50,
        description: 'Pop 5 PURPLE balloons!'
    },
    // Level 8: Two colors
    {
        level: 8,
        type: 'multi',
        targets: [
            { color: 'green', count: 3 },
            { color: 'yellow', count: 3 }
        ],
        timeLimit: 45,
        description: 'Pop 3 GREEN and 3 YELLOW!'
    },
    // Level 9: Higher count
    {
        level: 9,
        type: 'single',
        targets: [{ color: 'red', count: 7 }],
        timeLimit: 45,
        description: 'Pop 7 RED balloons!'
    },
    // Level 10: Two colors, higher
    {
        level: 10,
        type: 'multi',
        targets: [
            { color: 'blue', count: 4 },
            { color: 'purple', count: 3 }
        ],
        timeLimit: 45,
        description: 'Pop 4 BLUE and 3 PURPLE!'
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
        this.totalPopped = 0;
    }

    /**
     * Record a popped balloon
     * @param {string} colorKey - The color of the popped balloon
     * @returns {boolean} - Whether this balloon counted toward the challenge
     */
    recordPop(colorKey) {
        this.totalPopped++;

        if (this.type === 'any') {
            // Any color counts
            this.progress['any'] = (this.progress['any'] || 0) + 1;
            this.score += 10;
            this.checkCompletion();
            return true;
        }

        // Check if this color is a target
        const target = this.targets.find(t => t.color === colorKey);
        if (target) {
            if (this.progress[colorKey] < target.count) {
                this.progress[colorKey]++;
                this.score += 10;
                this.checkCompletion();
                return true;
            }
        }

        // Bonus points for non-target balloons (but they don't count toward goal)
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
            return `${BALLOON_COLORS[target.color]?.name || target.color}: ${current}/${target.count}`;
        }).join(' | ');
    }

    /**
     * Get mini display text for HUD
     */
    getMiniDisplayText() {
        return this.description;
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
        const colors = Object.keys(BALLOON_COLORS);
        const difficulty = Math.min(level - 10, 10); // Cap difficulty scaling

        // Decide type: single or multi
        const isMulti = level > 12 && Math.random() > 0.5;

        if (isMulti) {
            // Two color challenge
            const color1 = colors[Math.floor(Math.random() * colors.length)];
            let color2 = colors[Math.floor(Math.random() * colors.length)];
            while (color2 === color1) {
                color2 = colors[Math.floor(Math.random() * colors.length)];
            }

            const count1 = 3 + Math.floor(difficulty / 2);
            const count2 = 2 + Math.floor(difficulty / 3);

            return {
                level,
                type: 'multi',
                targets: [
                    { color: color1, count: count1 },
                    { color: color2, count: count2 }
                ],
                timeLimit: Math.max(35, 50 - difficulty * 2),
                description: `Pop ${count1} ${BALLOON_COLORS[color1].name} and ${count2} ${BALLOON_COLORS[color2].name}!`
            };
        } else {
            // Single color challenge
            const color = colors[Math.floor(Math.random() * colors.length)];
            const count = 5 + Math.floor(difficulty / 2);

            return {
                level,
                type: 'single',
                targets: [{ color, count }],
                timeLimit: Math.max(35, 50 - difficulty * 2),
                description: `Pop ${count} ${BALLOON_COLORS[color].name} balloons!`
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
     * Record a balloon pop
     */
    recordPop(colorKey) {
        if (this.currentChallenge) {
            return this.currentChallenge.recordPop(colorKey);
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
     * Get target colors for current challenge (for spawn weighting)
     */
    getTargetColors() {
        if (!this.currentChallenge) return Object.keys(BALLOON_COLORS);

        if (this.currentChallenge.type === 'any') {
            return Object.keys(BALLOON_COLORS);
        }

        return this.currentChallenge.targets.map(t => t.color);
    }

    /**
     * Save high score to localStorage
     */
    saveHighScore() {
        try {
            localStorage.setItem('balloonPop_highScore', this.highScore.toString());
        } catch (e) {
            console.warn('Could not save high score:', e);
        }
    }

    /**
     * Load high score from localStorage
     */
    loadHighScore() {
        try {
            const saved = localStorage.getItem('balloonPop_highScore');
            return saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            return 0;
        }
    }
}

// Global challenge manager instance
const challengeManager = new ChallengeManager();
