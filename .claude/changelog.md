# Changelog

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
