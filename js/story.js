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
     * Animate a screen with progress bar and auto-dismiss
     * @param {HTMLElement} screen - The screen element
     * @param {number} duration - Duration in ms
     * @param {Function} onComplete - Callback when dismissed
     */
    _animateScreen(screen, duration, onComplete) {
        screen.classList.add('active');

        const progressFill = screen.querySelector('.chapter-progress-fill');
        let dismissed = false;
        let timerId = null;

        // Use CSS transition for progress bar instead of RAF loop
        if (progressFill) {
            progressFill.style.transition = 'none';
            progressFill.style.width = '0%';
            // Force reflow then animate
            progressFill.offsetWidth;
            progressFill.style.transition = `width ${duration}ms linear`;
            progressFill.style.width = '100%';
        }

        const dismissHandler = () => {
            if (dismissed) return;
            dismissed = true;
            if (timerId) clearTimeout(timerId);
            if (progressFill) {
                progressFill.style.transition = 'none';
                progressFill.style.width = '0%';
            }
            screen.classList.remove('active');
            screen.removeEventListener('click', dismissHandler);
            if (onComplete) onComplete();
        };

        // Auto-dismiss after duration
        timerId = setTimeout(dismissHandler, duration);

        // Allow tap/click to skip
        screen.addEventListener('click', dismissHandler);
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
