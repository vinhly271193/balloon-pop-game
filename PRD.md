# Garden Grow — Product Requirements Document

**re:Action Health Technologies**
**Version:** 2.0 — "The Forgotten Garden" Social Edition
**Last Updated:** February 2026

---

## 1. Product Overview

Garden Grow is a therapeutic hand-tracking gardening game designed for people living with dementia and their care partners. Players use their hands — detected via webcam — to plant, water, and nurture virtual plants through their full growth lifecycle. The game is designed for two primary personas: a grandmother with dementia and her teenage grandson playing side-by-side on the same screen.

### Core Values
- **No failure states** — every interaction is rewarded, every round celebrates growth
- **Gentle, intuitive controls** — hand hovering and touching, no clicks or taps
- **Social connection** — 2-player modes encourage intergenerational play
- **Therapeutic benefit** — fine motor engagement, sensory feedback, shared attention
- **Adaptive difficulty** — the game meets each player where they are

### Key Differentiators
- Camera-based hand tracking (no controllers, no touchscreens)
- Real-time Dynamic Difficulty Adjustment per player
- Co-operative and competitive multiplayer on a single shared screen
- Fully synthesized audio (no external files required)
- Runs in any modern web browser — no installation needed

---

## 2. Target Users

### Primary: Person Living with Dementia
- Mild to moderate cognitive impairment
- May have reduced fine motor control
- Benefits from sensory stimulation, repetitive positive actions, and gentle encouragement
- May not understand complex instructions — the game must be self-evident

### Secondary: Care Partner / Family Member
- Teenager, adult child, or professional caregiver
- Plays alongside the primary user in 2-player mode
- Provides encouragement and shared experience
- Benefits from a structured, positive activity to do together

### Tertiary: Clinical / Activity Staff
- Uses the game in care facility group settings
- Needs minimal setup and no technical expertise
- Values observable engagement metrics

---

## 3. Game Design

### 3.1 Plant Types

| Plant | Seed Color | Plant Color | Icon |
|-------|-----------|-------------|------|
| Tomato | Dark Red | Tomato Red | 🍅 |
| Sunflower | Brown | Gold | 🌻 |
| Carrot | Sienna | Orange | 🥕 |
| Lettuce | Dark Green | Light Green | 🥬 |
| Blueberry | Dark Slate | Royal Blue | 🫐 |

### 3.2 Growth Lifecycle

Each plant progresses through six stages:

1. **Empty** — Pot is ready for a new seed
2. **Seed Planted** — Seed falls into the pot when the player's hand catches it
3. **Sprouting** — Small green shoot appears; plant begins needing care
4. **Growing** — Stem and leaves develop; needs become more active
5. **Mature** — Full plant visible; needs slow down
6. **Harvestable** — Plant glows and bounces; player touches to harvest and score

### 3.3 Plant Needs System

While growing, each plant has three needs that deplete over time:

| Need | Icon | Color | Interaction |
|------|------|-------|-------------|
| Water | 💧 | Blue | Touch the watering can tool, then touch the plant |
| Sunlight | ☀️ | Gold | Touch the sun tool, then touch the plant |
| Fertilizer | 🧪 | Green | Touch the fertilizer tool, then touch the plant |

- Needs are displayed as circular icons around the plant pot
- When a need is critical (below 20%), the icon pulses
- If all needs drop to zero, the plant wilts but does **not** die — it pauses growth until tended
- Need depletion rate is controlled by the DDA system (see Section 5)

### 3.4 Interaction Mechanics

- **Seed catching**: Seeds float down from the top of the screen. Moving a hand over a seed "catches" it and plants it in the nearest empty pot
- **Tool interaction**: Floating tools (watering can, sun, fertilizer) orbit around the garden. Touch a tool, then touch a plant pot to apply it
- **Harvesting**: When a plant reaches the harvestable stage, it glows and bounces. Touch it to harvest — confetti burst, score increase, pot resets to empty
- **Hand hover activation**: All UI buttons use a 3-second dwell system — hover your hand over a button and a circular progress indicator fills. No click required

---

## 4. Game Modes

### 4.1 Solo Mode (1 Player)

- Full-width garden with 2–3 plant pots
- One player interacts with all tools and plants
- Standard challenge progression through story chapters
- DDA adjusts to the single player's ability

### 4.2 Community Garden — Co-op (2 Player)

- **Shared garden** — both players interact with the same pots and tools
- **Shared goal** — "Together, grow 8 plants!" Both players' harvests count toward the same target
- **Player identification**: Player 1 wears an orange glove, Player 2 wears a blue glove
- **Magic Pumpkin bonus**: A large pumpkin spawns periodically in the center of the garden. If both players touch it simultaneously, a confetti explosion triggers and the timer pauses for 3 seconds. This rewards cooperation and shared attention
- Round ends with a team celebration: "Together you harvested X plants!"

### 4.3 Village Fair — Competitive (2 Player)

- **Split garden** — a soft dashed divider separates Player 1's zone (right side) from Player 2's zone (left side)
- **Individual scoring** — each player has their own pots, tools, seeds, and score
- **Dual HUD** — Player 1's score (orange) on the right, Player 2's score (blue) on the left, shared timer in the center
- **Cross-zone assist**: If a player's hand crosses into the other player's zone, any harvest awards points to the **zone owner** (not the crosser). A glowing bridge effect appears at the divider
- **Rubber-band mechanic**: When the score gap exceeds 20%, the trailing player receives a Golden Watering Can power-up that instantly maxes all plant needs, speeding growth to harvest. This is subtle — no "you're losing" message, just a helpful bonus
- **No "Game Over"**: Round ends with ribbons for both players — "Blue Ribbon" for the leader, "Red Ribbon" for the runner-up. Both gardens bloom regardless of score. The language is purely celebratory

---

## 5. The "Fair Play" DDA System

A Dynamic Difficulty Adjustment engine runs throughout gameplay, evaluating each player independently every 5 seconds.

### 5.1 Metrics Tracked (Per Player)

| Metric | Description |
|--------|-------------|
| Harvest rate | Number of harvests in the last 10-second window |
| Success rate | Target plant harvests / total harvests |
| Idle time | Seconds since last hand interaction |

### 5.2 Difficulty Parameters (Per Player)

| Parameter | Range | Effect |
|-----------|-------|--------|
| `seedSpeed` | 0.5x – 2.0x | Multiplier for how fast plant needs deplete. Higher = harder (needs drain faster) |
| `hitBoxMultiplier` | 0.7x – 1.8x | Scale factor for collision detection radius. Higher = easier (more forgiving touch targets) |

### 5.3 Adjustment Rules

- **High performer** (harvest rate > 3/10s): Needs deplete faster, hit boxes shrink slightly
- **Struggling player** (harvest rate < 1/10s): Needs deplete 30% slower, hit boxes grow 50% ("magnetic" mode)
- **Idle player** (>5s since last interaction): Further eased — slower depletion, larger hit boxes
- All adjustments interpolate smoothly over ~2 seconds to avoid jarring changes

### 5.4 Rubber-Band Mechanic (Competitive Only)

When the competitive score gap exceeds 20%, the trailing player receives a Golden Watering Can in their zone. This power-up lasts 10 seconds and instantly maxes all plant needs, accelerating growth. It appears naturally as a "helpful garden tool" without announcing any score comparison.

---

## 6. Hand Tracking & Player Assignment

### 6.1 Technology

- **Library**: MediaPipe Hands (legacy `@mediapipe/hands` via CDN)
- **Max hands**: 2 (one per player in 2-player mode)
- **Model complexity**: 0 (fastest, sufficient for large hand gestures)
- **Camera resolution**: 640x480 (performance-optimized)
- **Confidence thresholds**: Detection 0.5, Tracking 0.3

### 6.2 Collision Detection

Six points per hand are tracked for collision: palm center (landmark 9) and all five fingertips (landmarks 4, 8, 12, 16, 20). Each point is converted from normalized MediaPipe coordinates to canvas pixel coordinates.

### 6.3 Player Assignment (2-Player)

- Hands are sorted by wrist x-position in the camera frame
- Leftmost hand in camera → Player 1 (appears on **right** side of mirrored screen)
- Rightmost hand in camera → Player 2 (appears on **left** side of mirrored screen)
- Each collision point carries a `playerId` for zone-aware interactions

### 6.4 Visual Feedback — Cartoon Gloves

Each detected hand is rendered as a cartoon glove on the canvas:

| Mode | Player | Outline Color | Fill Color |
|------|--------|--------------|------------|
| Solo | Single | Teal (#4ECDC4) | White |
| 2-Player | Player 1 | Orange (#FF8C42) | Warm White (#FFF5E6) |
| 2-Player | Player 2 | Blue (#4A90D9) | Cool White (#E6F0FF) |

Gloves feature puffy fingertips with highlight shines, colored outer glow, and are scaled to 80% of raw hand size for a clean look.

### 6.5 Calibration Flow

1. **Welcome** → "Start Growing" button (3-second hand hover)
2. **Player Select** → "1 Player" or "2 Players" (hand hover buttons)
3. If 2 Players → **Mode Select** → "Community Garden" or "Village Fair"
4. **Calibration P1** → "Player 1, show your hand on the right side!" — waits for stable hand detection (2 seconds)
5. If 2P → **Calibration P2** → "Player 2, show your hand on the left!" — waits for second hand (2 seconds)
6. Divider position calculated as midpoint between both players' wrist x-positions
7. Game begins

### 6.6 Canvas Mirroring

The canvas uses CSS `transform: scaleX(-1)` to create a mirror effect. This means:
- Camera left = Screen right
- MediaPipe's "Left" hand label = User's actual RIGHT hand
- All coordinate systems account for this mirroring

---

## 7. Storyline Structure

The game is organized into three chapters with warm, encouraging narratives:

### Chapter 1: The Forgotten Garden (Levels 1–3)
> "An old garden has been waiting for someone special to help it bloom again..."
- **Goal**: Plant your first seeds and watch them grow
- **Reward**: "The garden is waking up! You can see tiny sprouts everywhere."
- **Unlocks**: Garden background theme

### Chapter 2: Spring Awakening (Levels 4–6)
> "The garden is coming alive! Different vegetables and flowers want to join..."
- **Goal**: Grow different types of plants
- **Reward**: "Colors are returning to the garden! Butterflies have started to visit."

### Chapter 3: The Greenhouse (Levels 7–10)
> "You've discovered an old greenhouse! Inside, special plants await..."
- **Goal**: Master the greenhouse
- **Reward**: "The garden is thriving! Birds sing and bees buzz happily among the flowers."
- **Unlocks**: Forest background theme

### Progress Messages

Random encouraging messages appear during gameplay:
- "Every plant you grow brings more life to the garden!"
- "Your hands bring magic to each seed."
- "The seeds trust your gentle hands."

Story progress persists in `localStorage` between sessions.

---

## 8. Audio Design

### 8.1 Synthesized Sounds (Web Audio API)

All audio is generated programmatically — no external audio files required.

| Sound | Description | Trigger |
|-------|-------------|---------|
| Plant | Soft rising tone with rustling | Seed planted in pot |
| Harvest | Satisfying pluck/pick | Plant harvested |
| Water | Gentle droplet | Watering can used |
| Bird Song | Gentle chirp | Random ambient |
| Wind Chimes | Soft metallic tones | Chapter complete |
| Garden Ambient | Layered nature sounds | Background loop |

### 8.2 Per-Player Audio (2-Player Mode)

To help players distinguish their own actions:

| Player | Frequency Shift | Effect |
|--------|----------------|--------|
| Player 1 | 0.8x (lower octave) | Warmer, deeper tones |
| Player 2 | 1.25x (higher octave) | Brighter, lighter tones |

### 8.3 Harmonized Co-op Sounds

When both players trigger actions within a 200ms window, a harmonized chord plays instead of two separate sounds. This creates a pleasant "playing together" audio reward.

---

## 9. Technical Specifications

### 9.1 Architecture

- **Pure browser application** — HTML5, CSS3, vanilla JavaScript
- **Single `<canvas>` element** for all game rendering
- **No build step** — served directly as static files
- **No external dependencies** beyond MediaPipe CDN

### 9.2 File Structure

```
├── index.html              # App shell, all UI screens
├── css/
│   └── styles.css          # All styles, responsive design
├── js/
│   ├── main.js             # Entry point
│   ├── game.js             # State machine, game loop, coordination
│   ├── garden.js           # Plant pots, seeds, growth, watering, MagicPumpkin
│   ├── handTracking.js     # MediaPipe integration, zone assignment, gloves
│   ├── ui.js               # Screen management, hand hover system, HUD
│   ├── audio.js            # Web Audio API synthesized sounds
│   ├── dda.js              # Dynamic Difficulty Adjustment engine
│   ├── challenges.js       # Challenge templates, progress tracking
│   └── story.js            # Chapter/narrative progression
└── assets/
    └── images/
        └── logo.png        # Company logo
```

### 9.3 State Machine

```
LOADING → WELCOME → PLAYER_SELECT → MODE_SELECT → CALIBRATION → CALIBRATION_P2 → PLAYING → ROUND_END
                                          ↓                           ↓
                                     (skip if 1P)              (skip if 1P)
```

Additional states: `CHAPTER_INTRO`, `CHALLENGE_INTRO`, `CHAPTER_COMPLETE`, `PAUSED`

### 9.4 Performance Targets

| Metric | Target |
|--------|--------|
| Frame rate | 25+ fps with 2 hands tracked |
| Camera resolution | 640x480 |
| MediaPipe model | Complexity 0 |
| Hand detection confidence | 0.5 |
| Hand tracking confidence | 0.3 |

### 9.5 Browser Support

- Chrome 90+ (primary target)
- Safari 15+ (iOS/macOS)
- Firefox 90+
- Edge 90+

Requires: WebRTC (camera access), Web Audio API, Canvas 2D, ES6+

---

## 10. Accessibility Requirements

- **No text-only instructions** — all guidance is visual with large icons
- **High contrast visuals** — bright colors on muted backgrounds
- **Large touch/hover targets** — minimum 80px collision radius
- **3-second dwell activation** — all buttons activate via sustained hover, not click
- **No failure penalties** — plants pause growth when neglected, never die
- **Auto-easing DDA** — idle or struggling players automatically receive easier parameters
- **Gentle audio** — all sounds are soft, non-startling, and therapeutic
- **Celebration-only outcomes** — no "game over," no negative scores, ribbons for all
- **Persistent progress** — localStorage saves chapter progress between sessions
- **Responsive layout** — scales to any screen size

---

## 11. Settings

- **Volume control**: Adjustable via on-screen slider
- **Hand indicator toggle**: Show/hide the cartoon glove overlay
- **Hand indicator size**: Adjustable
- **Background themes**: Sky (default), Garden (Chapter 1 reward), Forest (Chapter 3 reward) — all unlocked by default for accessibility

---

## 12. Success Metrics

### Engagement Metrics
- Session duration (target: 10–15 minutes per session)
- Number of plants grown per session
- Rounds completed per session
- Return visits (localStorage tracking)

### Therapeutic Metrics
- Hand movement range and frequency (observable via hand tracking data)
- Sustained attention (time actively interacting vs. idle)
- Co-play engagement (simultaneous 2-player activity rate)

### Social Play Metrics (2-Player)
- Frequency of Magic Pumpkin co-op bonuses triggered
- Cross-zone assists in competitive mode
- DDA gap between players (smaller gap = better matched experience)
- Time both players are actively engaged simultaneously

---

## 13. Future State

The following features are designed but not yet implemented. They represent the next iterations of Garden Grow.

### 13.1 4-Hand Tracking

**Current limitation**: MediaPipe legacy library tracks up to 2 hands with zone-based assignment (1 hand per player). This means each player uses one hand.

**Future**: Migrate to `@mediapipe/tasks-vision` (the maintained successor library) and enable `numHands: 4`. This would allow both players to use both hands simultaneously. Requires spatial clustering to associate hand pairs with players, since MediaPipe does not provide person identity.

### 13.2 Web Worker Offloading

Move MediaPipe inference to a Web Worker to free the main thread for rendering. Would improve frame rates on lower-powered devices and eliminate occasional frame drops during hand detection.

### 13.3 Expanded DDA Parameters

Beyond seed speed and hit-box size, additional difficulty levers:

- **Visual distractions** for high-ability players (butterflies, birds crossing the screen)
- **Spawn rate adjustment** — more/fewer seeds for each player
- **Asymmetric scoring** — accuracy-weighted scoring for the stronger player, engagement-weighted for the weaker player
- **Need complexity** — stronger players get plants with more simultaneous needs

### 13.4 Social Interaction Metrics

Capture non-game social behaviors to measure therapeutic impact:

- **Head-turn detection** (via Face Mesh) — are players looking at each other?
- **Microphone volume monitoring** — are players talking and laughing?
- **Smile detection** — facial expression analysis for engagement/joy metrics
- **Verbal encouragement detection** — NLP on speech-to-text for positive social cues

### 13.5 Free Play Mode

An untimed, goalless sandbox mode:
- No challenges, no timer, no score
- Players plant and grow at their own pace
- Ideal for low-stimulation sessions or first-time users
- Garden persists for the duration of the session

### 13.6 Depth-Calibrated Play

Use hand depth (z-coordinate from MediaPipe) to adjust interaction zones. Players farther from the camera would get proportionally larger hit boxes. This would accommodate different seating arrangements and wheelchair positions.

### 13.7 Sidekick Characters

Animated garden companions that provide non-verbal guidance:
- A friendly garden gnome that points toward plants that need attention
- A butterfly that leads the player's hand toward ripe harvests
- A robin that chirps encouragement when the player is idle
- Characters adapt behavior based on DDA parameters

### 13.8 Data & Analytics Dashboard

A clinician-facing dashboard that aggregates session data:
- Session frequency and duration trends
- Motor engagement heatmaps (where on screen do hands move most?)
- DDA difficulty curves over time (is the patient improving?)
- Social interaction scores (co-play metrics)
- Exportable reports for care plans

### 13.9 Additional Game Themes

The hand-tracking engine can power other therapeutic activities beyond gardening:

| Theme | Description |
|-------|-------------|
| Kitchen | Cooking/baking with ingredient mixing and stirring |
| Workshop | DIY crafting with hammering, painting, assembly |
| Aquarium | Fish feeding and coral growing |
| Music | Virtual instruments played with hand gestures |
| Driving | Gentle scenic drives with steering hand gestures |

Each theme would share the same DDA engine, hand tracking pipeline, and 2-player infrastructure.

### 13.10 Auto-Help System

An intelligent assistance layer that activates when players appear stuck:

- **Idle detection** (>10s no interaction) → Visual hint arrows pointing to the next action
- **Repeated failure** (same task failed 3x) → Simplify the challenge automatically
- **Tutorial tooltips** → Context-sensitive guidance that fades as the player demonstrates understanding
- **Caregiver alerts** → Subtle on-screen indicator when the primary user may need human assistance

### 13.11 Platform Expansion

- **Tablet mode**: Touch-based fallback when camera is unavailable
- **Smart TV**: Cast to large screen, use phone as controller
- **Kiosk mode**: Full-screen, auto-start for care facility common areas
- **Progressive Web App (PWA)**: Installable, offline-capable
- **Native apps**: iOS/Android wrappers for app store distribution

---

*Built with care by re:Action Health Technologies*
