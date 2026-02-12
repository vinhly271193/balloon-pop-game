/**
 * Story System for Garden Grow Game
 * Provides narrative structure and chapter progression
 */

// Story chapters - warm and encouraging narrative
const STORY_CHAPTERS = [
    {
        chapter: 1,
        title: "The Forgotten Garden",
        intro: "An old garden has been waiting for someone special to help it bloom again. The soil is ready, and the seeds are eager to grow...",
        goal: "Plant your first seeds and watch them grow",
        levels: [1, 2, 3],
        reward: "The garden is waking up! You can see tiny sprouts everywhere.",
        backgroundUnlock: 'garden',
        icon: '🌱'
    },
    {
        chapter: 2,
        title: "Spring Awakening",
        intro: "The garden is coming alive! Different vegetables and flowers want to join. The more variety, the more beautiful the garden becomes...",
        goal: "Grow different types of plants",
        levels: [4, 5, 6],
        reward: "Colors are returning to the garden! Butterflies have started to visit.",
        backgroundUnlock: null,
        icon: '🌷'
    },
    {
        chapter: 3,
        title: "The Greenhouse",
        intro: "You've discovered an old greenhouse! Inside, special plants await. With care and warmth, anything can grow here...",
        goal: "Master the greenhouse",
        levels: [7, 8, 9, 10],
        reward: "The garden is thriving! Birds sing and bees buzz happily among the flowers.",
        backgroundUnlock: 'forest',
        icon: '🏡'
    }
];

// Encouraging messages for garden progress
const PROGRESS_MESSAGES = [
    "Every plant you grow brings more life to the garden!",
    "The garden is grateful for your gentle care.",
    "Your hands bring magic to each seed.",
    "Nature responds to your kind touch.",
    "The plants are happy to see you!",
    "Each flower blooms because of you.",
    "The garden grows more beautiful every day.",
    "You have a natural gift for gardening!",
    "The seeds trust your gentle hands.",
    "What a wonderful garden you're creating!"
];

class StoryManager {
    constructor() {
        this.currentChapter = 1;
        this.completedChapters = [];
        this.totalPlantsGrown = 0;
        this.unlockedBackgrounds = ['sky']; // Default unlocked

        this.loadProgress();
    }

    /**
     * Get current chapter data
     */
    getCurrentChapter() {
        return STORY_CHAPTERS.find(ch => ch.chapter === this.currentChapter) || STORY_CHAPTERS[0];
    }

    /**
     * Get chapter by number
     */
    getChapter(chapterNum) {
        return STORY_CHAPTERS.find(ch => ch.chapter === chapterNum);
    }

    /**
     * Check if level belongs to current chapter
     */
    isLevelInCurrentChapter(level) {
        const chapter = this.getCurrentChapter();
        return chapter.levels.includes(level);
    }

    /**
     * Check if this is the first level of a new chapter
     */
    isNewChapterStart(level) {
        for (const chapter of STORY_CHAPTERS) {
            if (chapter.levels[0] === level && !this.completedChapters.includes(chapter.chapter)) {
                return chapter;
            }
        }
        return null;
    }

    /**
     * Check if level completes a chapter
     */
    isChapterComplete(level) {
        for (const chapter of STORY_CHAPTERS) {
            const lastLevel = chapter.levels[chapter.levels.length - 1];
            if (level === lastLevel && !this.completedChapters.includes(chapter.chapter)) {
                return chapter;
            }
        }
        return null;
    }

    /**
     * Complete a chapter
     */
    completeChapter(chapterNum) {
        if (!this.completedChapters.includes(chapterNum)) {
            this.completedChapters.push(chapterNum);

            // Unlock background if applicable
            const chapter = this.getChapter(chapterNum);
            if (chapter && chapter.backgroundUnlock) {
                this.unlockBackground(chapter.backgroundUnlock);
            }

            // Move to next chapter
            if (chapterNum < STORY_CHAPTERS.length) {
                this.currentChapter = chapterNum + 1;
            }

            this.saveProgress();
        }
    }

    /**
     * Unlock a background theme
     */
    unlockBackground(bgName) {
        if (!this.unlockedBackgrounds.includes(bgName)) {
            this.unlockedBackgrounds.push(bgName);
        }
    }

    /**
     * Check if background is unlocked
     */
    isBackgroundUnlocked(bgName) {
        // All backgrounds are available by default for accessibility
        return true;
    }

    /**
     * Record a plant being grown
     */
    recordPlantGrown() {
        this.totalPlantsGrown++;
        this.saveProgress();
    }

    /**
     * Get an encouraging progress message
     */
    getProgressMessage() {
        return PROGRESS_MESSAGES[Math.floor(Math.random() * PROGRESS_MESSAGES.length)];
    }

    /**
     * Get overall garden progress (0-1)
     */
    getOverallProgress() {
        const totalLevels = STORY_CHAPTERS.reduce((sum, ch) => sum + ch.levels.length, 0);
        let completedLevels = 0;

        this.completedChapters.forEach(chNum => {
            const chapter = this.getChapter(chNum);
            if (chapter) {
                completedLevels += chapter.levels.length;
            }
        });

        return totalLevels > 0 ? completedLevels / totalLevels : 0;
    }

    /**
     * Get chapter progress for display
     */
    getChapterProgressText() {
        const completed = this.completedChapters.length;
        const total = STORY_CHAPTERS.length;
        return `Chapter ${this.currentChapter} of ${total}`;
    }

    /**
     * Check if player is returning (has progress)
     */
    isReturningPlayer() {
        return this.totalPlantsGrown > 0 || this.completedChapters.length > 0;
    }

    /**
     * Get welcome message based on progress
     */
    getWelcomeMessage(playerCount) {
        if (!this.isReturningPlayer()) {
            if (playerCount === 2) {
                return "Welcome, gardeners! Let's grow together!";
            }
            return "Welcome to your new garden!";
        }

        if (this.completedChapters.length >= STORY_CHAPTERS.length) {
            if (playerCount === 2) {
                return `Welcome back, master gardeners! You've grown ${this.totalPlantsGrown} plants together!`;
            }
            return `Welcome back, master gardener! You've grown ${this.totalPlantsGrown} plants!`;
        }

        const chapter = this.getCurrentChapter();
        if (playerCount === 2) {
            return `Welcome back! Your garden awaits both of you in "${chapter.title}"`;
        }
        return `Welcome back! Your garden awaits in "${chapter.title}"`;
    }

    /**
     * Show chapter intro screen
     * @param {Object} chapter - Chapter data
     * @param {Function} onComplete - Callback when intro is dismissed
     */
    showChapterIntro(chapter, onComplete) {
        const introScreen = document.getElementById('chapterIntroScreen');
        if (!introScreen) {
            // If screen doesn't exist, just call callback
            if (onComplete) onComplete();
            return;
        }

        // Update content
        const titleEl = introScreen.querySelector('.chapter-title');
        const numberEl = introScreen.querySelector('.chapter-number');
        const introEl = introScreen.querySelector('.chapter-intro-text');
        const goalEl = introScreen.querySelector('.chapter-goal');
        const iconEl = introScreen.querySelector('.chapter-icon');

        if (titleEl) titleEl.textContent = chapter.title;
        if (numberEl) numberEl.textContent = `Chapter ${chapter.chapter}`;
        if (introEl) introEl.textContent = chapter.intro;
        if (goalEl) goalEl.textContent = chapter.goal;
        if (iconEl) iconEl.textContent = chapter.icon;

        // Show screen
        introScreen.classList.add('active');

        // Progress bar animation
        const progressFill = introScreen.querySelector('.chapter-progress-fill');
        const duration = 5000;
        const startTime = performance.now();
        let animFrameId = null;

        const dismissHandler = () => {
            if (animFrameId) cancelAnimationFrame(animFrameId);
            if (progressFill) progressFill.style.width = '0%';
            introScreen.classList.remove('active');
            introScreen.removeEventListener('click', dismissHandler);
            if (onComplete) onComplete();
        };

        const animateProgress = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            if (progressFill) progressFill.style.width = `${progress * 100}%`;

            if (progress >= 1) {
                if (introScreen.classList.contains('active')) dismissHandler();
                return;
            }
            animFrameId = requestAnimationFrame(animateProgress);
        };
        animFrameId = requestAnimationFrame(animateProgress);

        // Allow click to dismiss
        introScreen.addEventListener('click', dismissHandler);
    }

    /**
     * Show chapter complete celebration
     * @param {Object} chapter - Chapter data
     * @param {Function} onComplete - Callback when celebration is dismissed
     */
    showChapterComplete(chapter, onComplete) {
        const completeScreen = document.getElementById('chapterCompleteScreen');
        if (!completeScreen) {
            // If screen doesn't exist, just call callback
            if (onComplete) onComplete();
            return;
        }

        // Update content
        const titleEl = completeScreen.querySelector('.complete-title');
        const rewardEl = completeScreen.querySelector('.chapter-reward');
        const iconEl = completeScreen.querySelector('.complete-icon');

        if (titleEl) titleEl.textContent = `${chapter.title} Complete!`;
        if (rewardEl) rewardEl.textContent = chapter.reward;
        if (iconEl) iconEl.textContent = chapter.icon;

        // Show unlock message if applicable
        const unlockEl = completeScreen.querySelector('.unlock-message');
        if (unlockEl) {
            if (chapter.backgroundUnlock) {
                unlockEl.textContent = `New background unlocked: ${chapter.backgroundUnlock}!`;
                unlockEl.style.display = 'block';
            } else {
                unlockEl.style.display = 'none';
            }
        }

        // Show screen
        completeScreen.classList.add('active');

        // Play celebration sound
        if (typeof audioManager !== 'undefined') {
            audioManager.play('windChimes');
        }

        // Progress bar animation
        const progressFill = completeScreen.querySelector('.chapter-progress-fill');
        const duration = 6000;
        const startTime = performance.now();
        let animFrameId = null;

        const dismissHandler = () => {
            if (animFrameId) cancelAnimationFrame(animFrameId);
            if (progressFill) progressFill.style.width = '0%';
            completeScreen.classList.remove('active');
            completeScreen.removeEventListener('click', dismissHandler);
            if (onComplete) onComplete();
        };

        const animateProgress = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            if (progressFill) progressFill.style.width = `${progress * 100}%`;

            if (progress >= 1) {
                if (completeScreen.classList.contains('active')) dismissHandler();
                return;
            }
            animFrameId = requestAnimationFrame(animateProgress);
        };
        animFrameId = requestAnimationFrame(animateProgress);

        // Allow click to dismiss
        completeScreen.addEventListener('click', dismissHandler);
    }

    /**
     * Save progress to localStorage
     */
    saveProgress() {
        try {
            const data = {
                currentChapter: this.currentChapter,
                completedChapters: this.completedChapters,
                totalPlantsGrown: this.totalPlantsGrown,
                unlockedBackgrounds: this.unlockedBackgrounds,
                lastPlayed: Date.now()
            };
            localStorage.setItem('gardenGrow_story', JSON.stringify(data));
        } catch (e) {
            console.warn('Could not save story progress:', e);
        }
    }

    /**
     * Load progress from localStorage
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem('gardenGrow_story');
            if (saved) {
                const data = JSON.parse(saved);
                this.currentChapter = data.currentChapter || 1;
                this.completedChapters = data.completedChapters || [];
                this.totalPlantsGrown = data.totalPlantsGrown || 0;
                this.unlockedBackgrounds = data.unlockedBackgrounds || ['sky'];
            }
        } catch (e) {
            console.warn('Could not load story progress:', e);
        }
    }

    /**
     * Reset all story progress
     */
    reset() {
        this.currentChapter = 1;
        this.completedChapters = [];
        this.totalPlantsGrown = 0;
        this.unlockedBackgrounds = ['sky'];
        this.saveProgress();
    }
}

// Global story manager instance
const storyManager = new StoryManager();
