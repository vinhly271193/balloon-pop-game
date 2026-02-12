# Changelog

## 2026-02-12 — Stability fixes: camera release, null guards, leak prevention

### Critical fixes
- **Camera stream released on stop**: `handTracker.stop()` now stops all MediaStream tracks and clears `videoElement.srcObject` — camera hardware is properly released when tracking stops, preventing the camera light staying on indefinitely
- **Stale hand data cleared on stop**: `lastResults`, `handPositions`, and detection flags are nulled when tracking stops — prevents drawing ghost hands from old data
- **Null targetPot guard**: `processHandInteraction()` and `processFreeHandInteraction()` now early-return if no pot is found — prevents crash when pots array is empty after a `clear()` call

### High-priority fixes
- **Interaction time maps cleared on reset**: `clear()` now resets all 6 interaction time tracking variables (`sunInteractionTime`, `waterInteractionTime`, `foodInteractionTime` + their Map counterparts) — prevents stale watering/feeding progress carrying across rounds
- **Timer interval leak guard**: `startRound()` clears any existing timer interval before creating a new one — prevents double-ticking timers if `startRound()` is called twice
- **Countdown interval safety clear**: `showChallengeIntro()` explicitly clears any existing countdown interval before starting a new countdown — belt-and-suspenders safety alongside `showScreen()`
- **DraggableSeed plantType fallback**: Constructor falls back to a default seed icon if an invalid plantType is passed — prevents crash in `draw()` when accessing `.icon` on undefined
- **Null challenge guard**: `showChallengeIntro()` now checks if `challengeManager.startChallenge()` returned null and falls back to welcome screen — prevents crash on retry
- **Division by zero guard**: `updateParallax()` checks `canvas.width` and `canvas.height` are non-zero before dividing — prevents NaN propagation

### Improvements
- **Browser support check wired in**: `checkBrowserSupport()` is now called at startup — users on unsupported browsers see a clear error instead of a silent failure
- **Golden sparkle uses deltaTime**: WateringCan sparkle animation now tracks time via accumulated `deltaTime` instead of `Date.now()` — consistent animation speed regardless of frame rate

### Files changed
- `js/handTracking.js` — Camera stream release, clear stale data on stop
- `js/garden/garden-bed.js` — Interaction time map reset in clear(), null targetPot guards
- `js/garden/tools.js` — DraggableSeed plantType fallback, golden sparkle deltaTime
- `js/ui.js` — Countdown interval safety clear, division by zero guard in parallax
- `js/game.js` — Timer interval leak guard, null challenge guard in showChallengeIntro
- `js/main.js` — Wire checkBrowserSupport() at startup

---

## 2026-02-12 — Code health: refactoring, audio pooling, DDA tuning, growth feedback

### Refactoring
- **Garden-bed zone helpers**: Added `getZoneKeys()`, `getZoneNeeds()`, `getZonePot()`, `getZoneSeed()`, `getZoneWateringCan()`, `getZoneFertilizer()`, `getZoneSunArea()` — replaces ~30 occurrences of `if (competitive) { map.get(key) } else { this.prop }` with single-line helper calls
- **Collapsed update/draw/setDifficulty**: Sun areas, watering cans, seeds, tools, and needs panels now iterate `getZoneKeys()` instead of branching on game mode
- **DDA works in all modes**: `applyDDA()` now maps playerId to zone key, applying hitbox and depletion adjustments in solo/co-op (previously only competitive)
- **UIManager DOM-ready guard**: Moved all 60+ `document.getElementById()` calls from constructor to `_cacheElements()` called at start of `init()` — prevents silent null references if script runs before DOM is ready

### New features
- **Growth pulse effect**: Plants visually scale up 15% on each growth stage transition (seed→sprout→growing→mature→harvestable) with a smooth 0.4s decay — gives clear visual feedback that the plant is progressing
- **Master audio gain node**: All sounds now route through a single master GainNode instead of connecting directly to `audioContext.destination` — proper volume control and single point for muting

### Improvements
- **DDA tuned for dementia patients**: Struggling threshold raised (1→2 harvests/10s triggers help sooner), high performer threshold raised (3→4, less aggressive difficulty increase), ease factors increased (speed 0.6x, hitbox 1.7x), idle timeout lowered (5s→3s for faster re-engagement), wider clamp range on easy side (hitbox up to 2.0x)
- **Cached noise buffer**: White noise AudioBuffer is now pre-generated once during init instead of recreating 0.5s of random data on every plant sound
- **Removed legacy pop alias**: Deleted `this.sounds.pop` from audio.js and replaced 4 remaining `audioManager.play('pop')` calls in ui.js with `'water'`

### Files changed
- `js/garden/garden-bed.js` — Zone helper methods, collapsed update/draw/setDifficulty, applyDDA for all modes
- `js/audio.js` — Master GainNode, cached noise buffer, removed pop alias
- `js/ui.js` — DOM queries moved to _cacheElements(), pop→water sound
- `js/dda.js` — Tuned thresholds and clamp ranges for dementia patients
- `js/garden/plant-pot.js` — Growth pulse property, trigger on stage advance, decay in update, scale transform in drawPlant

---

## 2026-02-12 — Major robustness overhaul: fix crashes, freezes, and gameplay blockers

### Game-breaking fixes
- **Plant growth rate 5x faster**: Plants now grow in ~32s at full satisfaction (was ~100s), making it possible to actually complete levels within 45-60s round timers
- **Double ROUND_END guard**: Added state guard preventing both timer and challenge-complete from triggering simultaneous ROUND_END transitions (race condition crash)
- **Resume from pause fixed**: Resuming after tab switch no longer resets the entire round — timer, HUD, and game state are properly restored
- **Null currentChallenge crash fixed**: stopRound() now null-checks currentChallenge before accessing properties

### New features
- **"Try Again" button**: When a challenge fails, players now see a "Try Again" button to retry the same level (previously only "Start Over" which reset to level 1)
- **DDA now active**: Dynamic Difficulty Adjustment values (seedSpeed, hitBoxMultiplier) are now applied to the garden every frame — previously calculated but never used
- **Challenge-aware seed spawning**: Seeds now use weighted random selection favoring target plants (3x weight), instead of cycling sequentially through all plant types
- **Competitive scoring fixed**: Harvest data now includes `isTargetPlant` flag so competitive mode correctly awards 100pts for target plants vs 50pts for others
- **Golden watering can spawning**: Rubber-band mechanic now properly spawns golden watering cans for trailing players in competitive mode

### Robustness improvements
- **Generation counter for setTimeout**: Replaced boolean `active` flag with incrementing `roundGeneration` counter — prevents stale callbacks across rapid clear/configure cycles
- **Countdown timer leak fixed**: Challenge intro countdown timer is now cleared on any screen change, not just in destroy()
- **Stale plantNeeds reference fixed**: Tool interactions now read plantNeeds fresh via getter, preventing stale reference after seed planting creates new PlantNeeds
- **Error boundaries**: Hand tracking onResults() and game's onHandsDetected() wrapped in try/catch to prevent silent tracking death
- **Debounced story saves**: localStorage writes for plant growth now batched with 2s debounce instead of writing on every single harvest
- **Timer paused on tab switch**: Timer interval is properly cleared when pausing, preventing time loss during tab switches

### Code health
- **Removed legacy balloon aliases**: Deleted `BALLOON_COLORS`, `recordPop()`, and `.balloon-*` CSS selectors
- **Updated CLAUDE.md**: Removed legacy alias documentation

### Files changed
- `js/garden/plant-pot.js` — Growth rate 0.05 → 0.25
- `js/game.js` — Double ROUND_END guard, resume fix, DDA wiring, retryLevel handler, null checks, error boundary
- `js/ui.js` — Countdown timer cleanup on screen change, retry button support
- `js/garden/garden-bed.js` — Generation counter, weighted spawning, isTargetPlant in harvest data, stale plantNeeds fix
- `js/handTracking.js` — Error boundary around onResults
- `js/challenges.js` — Removed recordPop aliases
- `js/story.js` — Debounced localStorage saves
- `js/garden/constants.js` — Removed BALLOON_COLORS alias
- `index.html` — Added retry buttons for 1P and 2P round end screens
- `css/styles.css` — Removed .balloon-* CSS selectors
- `CLAUDE.md` — Updated gotchas section

---

## 2026-02-12 — Rearrange gameplay HUD layout

### UI repositioning
- **Instruction text moved to bottom**: Gameplay instruction text ("Keep your plant healthy...") now appears at the bottom of the screen, inline with the water jug and food button, instead of overlapping the top HUD
- **Plant pot moved to bottom toolbar**: Plant pots now sit at the same Y level as the water jug and food button, creating a unified bottom toolbar row
- **Settings cog to bottom-right**: During gameplay, the settings gear now appears at the bottom-right corner (next to the food button) instead of floating below the HUD at top-right
- **Sun icon doubled in size**: Sun interaction area increased from 50px to 100px icon and 60→120 radius, positioned just below the progress bar for better visibility
- **Plant Needs panel fixed**: Tightened panel sizing (bars 150px wide, 25px tall, 40px spacing) so progress bars no longer overflow their container

### Files changed
- `js/garden/garden-bed.js` — Plant pot Y position, sun area Y position, instruction text Y, needs panel height, DDA sun radius
- `js/garden/plant-needs.js` — Panel dimensions, bar sizing, icon/label fonts, sun icon size and radius
- `css/styles.css` — Settings button `.hud-active` position from `top: 140px` to `bottom: 20px`

---

## 2026-02-12 — Fix crashes, merge loading screens, split garden.js

### Phase 1: Fix 6 crash/freeze bugs
- **Harvest loop break**: Replaced `forEach` with `for...of` loop + `roundEnded` flag so the game stops processing harvests immediately when a challenge completes, preventing double state transitions
- **Guard setTimeout spawns**: Added `this.active` flag to GardenBed — seed spawn timers now check `if (this.active)` before spawning, preventing ghost seeds after round ends
- **Double startChallenge guard**: `showChallengeIntro()` now checks if a challenge is already in progress before creating a new one
- **Tab visibility resume**: Added missing `game.resume()` call when tab becomes visible again — game no longer stays frozen after tabbing away and back
- **Fixed hardcoded deltaTime**: Garden animations now use actual frame delta instead of hardcoded `0.016`, preventing speed inconsistencies on different refresh rates

### Phase 2: Merge loading screens (3 screens → 1)
- **Removed CHAPTER_INTRO and CHAPTER_COMPLETE states**: Eliminated 2 non-interactive loading screens that added 7-10 seconds of dead time before gameplay — critical for dementia patients who may lose engagement
- **Chapter header in Challenge Intro**: When starting a new chapter, the Challenge Intro screen now shows the chapter icon, number, and title as a header banner
- **Chapter complete in Round End**: When completing a chapter's final level, the Round End screen shows a celebration section with the chapter icon, title, reward text, and any background unlock
- **Simplified state machine**: WELCOME → PLAYER_SELECT → MODE_SELECT → CALIBRATION → CHALLENGE_INTRO → PLAYING → ROUND_END (no more chapter detours)

### Phase 3: Split garden.js into 6 focused files
- **Broke up 2980-line monolith**: `js/garden.js` (9 classes) split into `js/garden/` directory with 6 files:
  - `constants.js` (75 lines) — `drawUnmirroredText()`, `PLANT_TYPES`, `GrowthStage`
  - `plant-pot.js` (552 lines) — `PlantPot` class
  - `tools.js` (426 lines) — `DraggableSeed`, `WateringCan`, `FertilizerBag`
  - `plant-needs.js` (244 lines) — `PlantNeeds`, `SunArea`
  - `effects.js` (499 lines) — `MagicPumpkin`, `HintArrow`, `ConfettiParticle`
  - `garden-bed.js` (1215 lines) — `GardenBed` coordinator
- **Removed dead code**: Deleted `_animateScreen()` from `story.js` (no longer called after Phase 2)
- Files changed: `js/game.js`, `js/main.js`, `js/ui.js`, `js/story.js`, `index.html`, `css/styles.css`, `js/garden.js` → `js/garden/*.js` (6 files)

## 2026-02-12 — Fix seed planting freeze (all modes) + settings gear overlap in 2P
- **Seed planting freeze fix**: `DraggableSeed` had a naming collision — the constructor set `this.plant = PLANT_TYPES[plantType]` which shadowed the prototype method `plant()`. When `seed.plant()` was called after dropping a seed into a pot, JavaScript tried to invoke the data object as a function, throwing `TypeError`. This crashed the hand tracking callback, freezing the game. Renamed the property to `this.plantInfo` to resolve the collision.
- **Settings gear overlap fix**: In competitive (2P) mode, the Player 1 score panel in the top-right corner overlapped with the settings gear button. Added right margin to the P1 score panel to clear the gear.
- Files changed: `js/garden.js`, `css/styles.css`

## 2026-02-12 — Fix gameplay freeze in solo/co-op mode + center Plant Needs panel
- **Gameplay freeze fix**: Solo/co-op mode was only passing the palm center point (landmark 9) to collision detection, but held-item movement requires the index finger point (landmark 8). All collision points per hand are now processed, matching how competitive mode already worked. Items can now be picked up, moved, and dropped on pots correctly.
- **Plant Needs panel centered**: Moved the Plant Needs panel from a fixed y=160 position to vertically centered on screen, making it easier to read during gameplay.
- Files changed: `js/garden.js`

## 2026-02-12 — Full-width garden preview strip on welcome screen
- **Garden strip**: Replaced the boxed "Your Garden: X plants grown" card with a full-width landscape strip spanning the bottom 20% of the welcome screen — grass with wavy edge, soil layers, planted emoji icons and empty soil mounds
- **Card removed**: Removed the white card wrapper and text label; the garden visual now blends naturally into the screen background
- **Retina-ready**: Canvas sized with `devicePixelRatio` for sharp rendering on high-DPI screens
- Files changed: `index.html`, `css/styles.css`, `js/game.js`

## 2026-02-12 — Fix hand-switching, mirrored text, settings overlap
- **Hand-switching fix**: Items picked up in one hand no longer jump to the other hand — solo/co-op mode now tracks which physical hand holds the item, and only that hand can move it. The free hand can still harvest plants and provide sunlight.
- **Mirrored text fix**: All canvas text (FOOD label, seed names, Plant Needs panel, instruction text, player labels) now reads correctly on the CSS-mirrored canvas via a `drawUnmirroredText` helper that counter-flips text and handles textAlign swapping.
- **Settings button repositioning**: Settings gear slides below the HUD during gameplay so it no longer overlaps the Plants score counter. Smooth CSS transition between positions.
- Files changed: `js/garden.js`, `js/ui.js`, `css/styles.css`

## 2026-02-12 — Canvas above UI overlays (hands always visible)
- **Canvas z-index raised**: Moved `#gameCanvas` from z-index 2 to 15 (above uiOverlay at 10, below settings button at 50) so hand gloves render on top of all screen backgrounds — the root fix for invisible hands on pre-game screens
- **pointer-events: none on canvas**: Mouse clicks pass through the transparent canvas to reach buttons underneath — hand tracking hover detection is unaffected since it uses collision math, not DOM events
- Files changed: `css/styles.css`

## 2026-02-12 — Parallax particles, chapter color progression, light loading screen
- **Parallax floating particles**: Leaves and petals now shift subtly in response to hand position detected via MediaPipe — a gentle parallax effect (max 15px) that makes the pre-game screens feel alive and responsive
- **Chapter color progression**: Light screens gradually shift warmer as players progress through chapters — Chapter 1 is the default cool cream/green, Chapter 2 adds golden warmth, Chapter 3 leans into rich amber/peach tones
- **Light loading screen**: Replaced the dark loading overlay with the same warm cream-to-green gradient used across all light screens — spinner and text updated for light background readability
- **Unmirrored canvas text**: Hint text on the gameplay canvas now renders correctly on the CSS-mirrored canvas using a `drawUnmirroredText` helper
- Files changed: `css/styles.css`, `js/ui.js`, `js/garden.js`

## 2026-02-12 — Visible hand gloves on light screens
- **Garden green gloves**: Changed default 1-player glove from white to garden green (#2E8B57 outline, honeydew fill) so hands are clearly visible against the light pastel background on Welcome, Player Select, and Mode Select screens
- **Stronger outlines**: Increased opacity on finger outlines (0.2→0.5), fingertip outlines (0.5→0.7), glow (0.25→0.4), wrist cuff (0.35→0.5), and thickened palm outline (2.5→3px)
- **Hands on Welcome screen**: Removed the restriction that hid hand rendering on the Welcome screen — hands now show on all screens once tracking is active
- Files changed: `js/handTracking.js`, `js/game.js`

## 2026-02-12 — Index finger item tracking + cartoon glove hand
- **Item follows index finger**: Held items (seed packets, watering can, fertilizer) now track the index fingertip instead of the pinky — each collision point now carries a `landmarkIndex` so garden.js can distinguish which finger is which
- **Cartoon glove hand**: Replaced the skeletal bone-style hand rendering with a playful filled cartoon glove — smooth rounded palm blob, thick tapered finger capsules, puffy fingertips with shine highlights, and a cute wrist cuff
- **Interaction precision**: Pickup detection still works from any fingertip/palm contact, but drop/pour/feed interactions are gated to the index finger only, preventing flickering from multiple collision points
- Files changed: `js/handTracking.js`, `js/garden.js`

## 2026-02-12 — Calibration progress bar, adaptive durations, chapter stats
- **Calibration progress bar**: A green bar fills over 2 seconds while hands are detected on the calibration screen — resets if hands are lost, giving clear "keep holding" feedback to patients
- **Adaptive chapter durations**: First-time players get longer reading time (7s intro, 8s complete); returning players get shorter durations (4s/5s) since they've already seen the story
- **Chapter complete stats**: Shows total plants grown count on the chapter completion celebration screen
- **Refactored progress animation**: Extracted shared `_animateScreen` helper in `story.js`, removing duplicated animation code
- **"Tap to skip"**: Changed from "Tap anywhere to continue" — clearer that the screen will auto-advance
- Files changed: `index.html`, `css/styles.css`, `js/story.js`, `js/game.js`

## 2026-02-12 — Light pre-game flow, floating particles, entrance animation
- **Light theme extended**: Player select ("How Many Gardeners?") and mode select ("Choose Your Garden") screens now share the same warm light garden theme as the welcome screen
- **Floating particles**: Subtle animated leaves and petals drift gently across all light screens — green, warm, pink, and peach tones
- **Entrance animation**: Content on all light screens fades in with a gentle upward slide when the screen appears
- **Shared `.light-screen` class**: Refactored from `welcome-screen` to a reusable class applied to welcome, player select, and mode select
- Files changed: `css/styles.css`, `index.html`, `js/ui.js`

## 2026-02-12 — Light welcome screen
- **Light garden theme**: Replaced the dark startup screen with a warm cream-to-soft-green gradient background with sunlight glow accents
- **Readable on light**: Text, buttons, logo shadow, welcome message, garden preview, and camera hint all updated for light background contrast
- **Scoped to welcome only**: Other gameplay screens remain dark so they work with the camera/canvas overlays
- Files changed: `css/styles.css`, `index.html`

## 2026-02-12 — Chapter screen progress bar
- **Progress bar on chapter intro**: A green progress bar fills smoothly over 5 seconds on the chapter intro screen ("The Forgotten Garden", etc.), showing players exactly how long before it auto-advances
- **Progress bar on chapter complete**: Same treatment on the chapter complete celebration screen (6-second duration)
- **Smooth animation**: Uses `requestAnimationFrame` instead of `setTimeout` for butter-smooth fill; properly cleans up on early tap dismiss
- Files changed: `index.html`, `css/styles.css`, `js/story.js`

## 2026-02-12 — Watering can tilt + water progress ring
- **Watering can tilt**: Increased tilt angle from -0.6 to -0.85 radians (~49°) and faster tilt speed for a more dramatic, visible pouring animation when the can is over a plant pot
- **Water progress ring on pot**: Added a prominent circular progress bar around the plant pot that fills as the player holds the watering can over it — clear visual feedback for dementia patients showing "keep holding here"
- **Water drop icon**: A 💧 emoji follows the leading edge of the progress ring for extra clarity
- Files changed: `js/garden.js`
