# Project Instructions

## About This Project
Garden Grow — a therapeutic hand-tracking gardening game for dementia patients. Built with vanilla HTML/CSS/JS, MediaPipe Hands for webcam detection, and canvas rendering. Supports 1-2 players with solo, co-op, and competitive modes. Hosted on GitHub Pages for instant browser play.

**Live URL:** https://vinhly271193.github.io/balloon-pop-game/

## How I Work
- I come in knowing what I want — be decisive, don't over-ask
- Balance speed and quality — move fast, don't let debt pile up
- Flag issues then ask — show me what's wrong, let me decide to fix now or later
- Always be proactive — point out what could be better, even unprompted
- Go wide on exploration — understand the full feature area + neighbours before changing anything
- Broader cleanup is welcome — if touching one file means a shared component should improve, do it
- Demo-readiness matters — this is a therapeutic tool, visual polish and smooth interactions are critical
- File-level plans — tell me which files change and what changes in each, don't preview code
- Update the changelog after every iteration

## Git Auto-Push Rule
**After every code change, you MUST commit and push to `main`:**
1. Stage the changed files (by name, not `git add -A`)
2. Commit with a clear message describing what changed
3. Push to `origin main`
4. Confirm the push succeeded

This is required so changes go live on GitHub Pages immediately. Do NOT wait for me to ask — push automatically after every iteration.

## Architecture Overview
- **Single-page app** — `index.html` loads all JS/CSS, no build step
- **Canvas rendering** — one `<canvas>` element, mirrored with CSS `scaleX(-1)`
- **MediaPipe Hands** — legacy `@mediapipe/hands` via CDN for webcam hand detection
- **Web Audio API** — all sounds synthesized, no audio files
- **State machine** — WELCOME > PLAYER_SELECT > MODE_SELECT > CALIBRATION > PLAYING > ROUND_END

## Key Files
| File | Purpose |
|------|---------|
| `index.html` | Entry point, screen overlays, script loading |
| `css/styles.css` | All styling, screen layouts, animations |
| `js/game.js` | Game state machine, round coordination |
| `js/garden.js` | Plant pots, seeds, watering, growth lifecycle, MagicPumpkin, confetti |
| `js/handTracking.js` | MediaPipe hand detection, zone-based player assignment, glove rendering |
| `js/dda.js` | Dynamic Difficulty Adjustment per player |
| `js/ui.js` | Screen management, hand hover system (3s dwell activation) |
| `js/audio.js` | Synthesized sounds with per-player octave shifting |
| `js/challenges.js` | Challenge templates and progress tracking |
| `js/story.js` | Chapter/narrative progression |
| `js/main.js` | Bootstrap and initialization |
| `assets/images/logo.png` | re-Action Health Technologies logo |

## Critical Gotchas
- **Canvas is mirrored** (`scaleX(-1)`): camera left = screen right. All x-coordinate logic must account for this.
- **MediaPipe "Left" hand = user's RIGHT hand** (mirrored). Don't confuse handedness labels.
- **`handTracker.dividerX` is 0-1 normalized** — multiply by `canvas.width` before passing to garden.js.
- **No legacy aliases remain** — all balloon references have been removed.
- **No build step** — all changes are live-editable. No bundler, no transpiler, no npm.

## Coding Conventions
- **No frameworks** — vanilla JS only. No React, no jQuery, no imports.
- **Global objects** — modules expose globals (e.g., `window.game`, `window.gardenManager`).
- **Canvas drawing** — all visual elements drawn via `CanvasRenderingContext2D`, not DOM elements.
- **Sounds** — use `audioManager` with Web Audio API. Never add audio file dependencies.
- **CSS** — single stylesheet. Use CSS custom properties for theming where possible.
- **Player indexing** — Player 1 = index 0 (right side, orange #FF8C42), Player 2 = index 1 (left side, blue #4A90D9).

## Target Audience
Dementia patients in therapeutic settings. Every design decision should prioritize:
- **Simplicity** — clear, large visual elements
- **Positive feedback** — generous rewards, no failure states
- **Gentle pacing** — DDA ensures the game adapts to the player's ability
- **Accessibility** — high contrast, large hit areas, no fine motor requirements

## Change Summaries

After every code change, provide a clear summary covering:

### For anyone (product language):
1. **What changed** — Simple, non-technical description
2. **Why it was changed** — The problem or motivation
3. **User journey impact** — What the end user sees, feels, or does differently

### Technical notes:
4. **Files touched** — List with one-line descriptions
5. **Inconsistencies fixed** — What got cleaned up as part of this iteration
6. **Flagged for later** — Issues found but not addressed
7. **Suggestions** — 2-3 proactive ideas for what to improve next

Keep summaries jargon-free for the product section. Be specific with file paths for the technical section.

# Project Rules

- After completing each task:
  1. Commit and push all changes to git (see Git Auto-Push Rule above).
  2. Update all relevant documentation to reflect the changes.
  3. Summarize what was changed, why it was changed, and what it means for the user.
- Ask clarifying questions before starting a task if the requirements are unclear or ambiguous.
- Repeat the first prompt back as Gherkin stories (Given/When/Then) to confirm understanding before implementation.

# Available Skills

Use these slash commands to invoke specialized workflows. Skills are configured in Claude Code and trigger automatically based on keywords, or can be invoked directly with `/skillname`.

---

## `/session-start` — Start a Working Session

**Triggers:** "let's get started", "new session", "where were we", "pick up where we left off", "what's the status"

Loads project context at the beginning of a conversation. Use this to orient yourself on an existing project — it pulls in the current state, recent changes, and any in-progress work so you can hit the ground running.

---

## `/changelog` — View or Update Changelog

**Triggers:** "what changed", "what did we do last time", "what's the history", "show me recent changes", "catch me up", "where did we leave off"

Reviews what's been done on the project. Use this to see a history of changes, understand what was completed in previous sessions, or update the changelog after completing work.

---

## `/explore-area` — Explore the Codebase

**Triggers:** "explore", "look at", "understand", "what's in", "how does [area] work", "walk me through", "show me the [feature]", "deep dive into"

Explores and understands a specific area of the codebase before making changes. Use this when you need to understand how a feature is built, what files are involved, or how components connect before writing any code.

---

## `/iterate` — Implement a Change

**Triggers:** "I want to", "let's change", "can you update", "add a", "fix the", "make it so", "iterate on"

The main skill for making code changes. Use this when you want to add a feature, fix a bug, update UI, or make any improvement to the codebase. Follows the project rules: confirms understanding with Gherkin stories first, then implements, documents, and pushes to git.

---

## `/refactor` — Refactor Code

**Triggers:** "refactor", "consolidate", "clean up", "reduce duplication", "extract", "simplify", "tech debt", "DRY this up"

Improves existing code without adding new functionality. Use this to reduce duplication, extract shared patterns, simplify complex logic, or pay down technical debt.

---

## `/design-audit` — Audit Design & Code Health

**Triggers:** "check design tokens", "audit the design", "find hardcoded values", "check consistency", "health check", "code review"

Audits a feature or area for visual consistency, canvas rendering quality, and overall code health. Checks for hardcoded values, inconsistent patterns, and general code quality issues.

---

## `/demo-prep` — Prepare for a Demo

**Triggers:** "demo prep", "getting ready for a demo", "stakeholder presentation", "is the app demo ready", "check the flows"

Prepares for a stakeholder demo by checking all user flows for visual consistency, animation polish, and flow integrity. Run this before presenting the game to ensure everything looks and works correctly.
