# Changelog

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
