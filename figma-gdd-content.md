# Garden Grow — Game Design Board Content

All content ready to populate into Figma once rate limit resets.
Sections marked DONE are already on the FigJam board.

---

## FigJam Board File Key: `5URYdE6zVi59guDMHhYIh2`
## Design File Key: `gG0pNxqErnOOnFEuUcjhTC`

---

## Section 1: GAME OVERVIEW — DONE
## Section 2: DESIGN PILLARS — DONE
## Section 3: TARGET AUDIENCE — DONE
## Section 4: CORE LOOP — DONE

---

## Section 5: GAMEPLAY MECHANICS (x:1400, y:1000)

### Sticky 1 (blue, wide)
HAND TRACKING

MediaPipe Hands via CDN
Max 2 hands (1 per player)
6 collision points per hand:
- Palm center (landmark 9)
- All 5 fingertips (landmarks 4, 8, 12, 16, 20)

Camera: 640x480
Confidence: 0.5 detect, 0.3 track

### Sticky 2 (yellow, wide)
PLAYER ASSIGNMENT

Hands sorted by wrist x-position
Leftmost in camera = P1 (right on screen)
Rightmost = P2 (left on screen)

Canvas mirrored with scaleX(-1)
MediaPipe 'Left' = user's RIGHT hand

### Sticky 3 (orange, wide)
CARTOON GLOVES

Solo: Teal outline (#4ECDC4)
P1: Orange (#FF8C42) warm white fill
P2: Blue (#4A90D9) cool white fill

Puffy fingertips with highlights
Colored outer glow
80% hand size for clean look

### Sticky 4 (green, wide)
CALIBRATION FLOW

1. Welcome > 'Start Growing' (3s hover)
2. Player Select > 1 or 2 Players
3. Mode Select (if 2P)
4. Calibrate P1 - show hand right side
5. Calibrate P2 - show hand left side
6. Divider = midpoint of wrists
7. Game begins!

---

## Section 6: GAME MODES (x:2800, y:1000)

### Sticky 1 (green, wide)
SOLO MODE (1 Player)

Full-width garden
2-3 plant pots
One player uses all tools
Standard challenge progression
DDA adjusts to ability

### Sticky 2 (blue, wide)
COMMUNITY GARDEN (Co-op)

Shared garden, shared goal
"Together, grow 8 plants!"

P1 = orange glove, P2 = blue glove
Magic Pumpkin bonus: both touch = confetti + timer pause

Team celebration at end!

### Sticky 3 (orange, wide)
VILLAGE FAIR (Competitive)

Split garden with dashed divider
Individual scoring per zone
Dual HUD - orange right, blue left

Cross-zone assist: harvest goes to zone owner
Glowing bridge effect at divider

### Sticky 4 (pink, wide)
RUBBER BAND MECHANIC

Score gap > 20%:
Trailing player gets Golden Watering Can
Instantly maxes all plant needs

No "you're losing" message
Just a helpful bonus

Both get ribbons at end!
Blue = leader, Red = runner-up

### Sticky 5 (violet)
MAGIC PUMPKIN (Co-op)

Large pumpkin spawns in center
Both players touch simultaneously
= Confetti explosion!
= Timer pauses 3 seconds

Rewards cooperation
Encourages communication:
"Ready? NOW!"

---

## Section 7: FAIR PLAY DDA (x:0, y:2000)

### Sticky 1 (yellow, wide)
DDA ENGINE OVERVIEW

Monitors each player independently every 5 seconds
Keeps both in "Flow State" (not bored, not overwhelmed)
Replaces traditional difficulty settings entirely

"Invisible Equity" — level playing field
without anyone selecting a difficulty

### Sticky 2 (blue, wide)
METRICS TRACKED (Per Player)

- Harvest rate: harvests in last 10s window
- Success rate: target harvests / total harvests
- Idle time: seconds since last interaction

All tracked independently per player
Updated every 5 seconds

### Sticky 3 (green, wide)
DIFFICULTY PARAMETERS

seedSpeed (0.5x - 2.0x)
  How fast plant needs deplete
  Higher = harder

hitBoxMultiplier (0.7x - 1.8x)
  Collision detection radius
  Higher = easier (magnetic mode)

### Sticky 4 (orange, wide)
ADJUSTMENT RULES

High performer (>3 harvests/10s):
  Needs deplete faster, hit boxes shrink

Struggling (<1 harvest/10s):
  Depletion 30% slower, hit boxes +50%

Idle (>5s no interaction):
  Further eased, magnetic mode

All changes interpolate over ~2 seconds
No jarring transitions

### Sticky 5 (pink, wide)
DEMENTIA-TUNED THRESHOLDS

Struggling threshold: < 2 harvests / 10s
Idle threshold: > 3 seconds
Plant growth rate: 0.25 * satisfaction
~8s per stage, 4 stages = ~32s total

Growth pulse: 15% scale on stage advance
Decays over 0.4 seconds

### Sticky 6 (violet)
RUBBER BAND (Competitive)

Score gap > 20%:
Golden Watering Can appears
in trailing player's zone

Lasts 10 seconds
Maxes all plant needs instantly

Appears as "helpful garden tool"
No score comparison shown

---

## Section 8: THERAPEUTIC FRAMEWORK (x:1400, y:2000)

### Sticky 1 (violet, wide)
THERAPEUTIC PRINCIPLES

Based on research from Lancet Commission 2024:
"45% of dementia cases could be prevented or delayed"

- Errorless learning (no failure states)
- Building on remaining capacities
- Multi-domain stimulation (motor + cognitive)
- Self-efficacy through positive feedback

### Sticky 2 (pink, wide)
COGNITIVE DESIGN

Attention: Limited span, 5-15 min sessions
Memory: No rules to remember
Processing: Generous timing, no pressure
Executive: Single clear objectives always visible

Current task always displayed
No reliance on remembering previous steps

### Sticky 3 (blue, wide)
PHYSICAL THERAPY MAPPING

Game movements map to physiotherapy:
- Reaching (catching seeds)
- Hovering (watering, sunlight)
- Grasping (picking up tools)
- Sweeping (gardening motions)

Supports seated and standing play
Both fine and gross motor engagement

### Sticky 4 (green, wide)
SOCIAL INTERACTION DESIGN

"Connection Over Correction"
"Us vs. The Garden" — not adversarial

Co-op: shared goals, team celebrations
Competitive: always celebratory language
2-player modes designed for intergenerational pairs:
Grandmother with dementia + teenage grandson

### Sticky 5 (orange, wide)
NARRATIVE & PURPOSE

Every task has a reason — not just movements
3 Chapters of "The Forgotten Garden":

Ch1: The Forgotten Garden (L1-3)
  "Help the garden bloom again"
Ch2: Spring Awakening (L4-6)
  "Different plants want to join"
Ch3: The Greenhouse (L7-10)
  "Special plants await inside"

### Sticky 6 (yellow)
AUTO-HELP SYSTEM

Progressive invisible assistance:
15s: "Take your time!"
30s: Target seeds get subtle glow
45s: Seeds move 50% slower
60s: Only target plants spawn

Help appears naturally
Player feels supported, not corrected
No "Having trouble?" messages

---

## Section 9: ART & AUDIO (x:2800, y:2000)

### Sticky 1 (orange, wide)
VISUAL IDENTITY

Brand: re:Action Health Technologies
Colors: Magenta-to-purple gradient
4 Pillars design language

Garden setting: peaceful sky, grass, soil
Static garden background

Player colors:
P1: Orange (#FF8C42)
P2: Blue (#4A90D9)

### Sticky 2 (blue, wide)
SOUND EFFECTS (Web Audio API)

All synthesized — no audio files!

Plant: Soft rising tone with rustling
Harvest: Satisfying pluck/pick
Water: Gentle droplet
Bird Song: Gentle chirp (ambient)
Wind Chimes: Soft metallic (chapter complete)
Garden Ambient: Layered nature loop

### Sticky 3 (green, wide)
PER-PLAYER AUDIO (2P)

P1: 0.8x frequency (lower octave)
  Warmer, deeper tones

P2: 1.25x frequency (higher octave)
  Brighter, lighter tones

Both within 200ms window:
  Harmonized chord plays!
  "Playing together" audio reward

### Sticky 4 (yellow, wide)
AUDIO PRINCIPLES

All sounds gentle and non-startling
Longer attack times, softer tones
Volume easily adjustable
Can be muted entirely

Audio routes through masterGain node
Noise buffer cached — no per-play allocation

### Sticky 5 (pink)
VISUAL EFFECTS

Confetti burst on harvest
Growth pulse (15% scale) on stage advance
Glowing plant when harvestable
Hint arrows for struggling players
Golden watering can glow
Magic pumpkin confetti explosion

### Sticky 6 (violet)
BACKGROUND THEMES

Sky (default) - always available
Garden - Ch1 reward (unlocked by default)
Forest - Ch3 reward (unlocked by default)

All unlocked from start for accessibility
Themes change garden backdrop

---

## Section 10: TECH STACK (x:0, y:3100)

### Sticky 1 (blue, wide)
TECHNOLOGY STACK

Runtime: Browser (Chrome, Edge, Safari)
Language: Vanilla JavaScript (no frameworks!)
Hand Tracking: MediaPipe Hands (legacy CDN)
Rendering: HTML5 Canvas (single element)
Audio: Web Audio API (synthesized)
Storage: localStorage
Hosting: GitHub Pages

No build step. No bundler. No npm.

### Sticky 2 (yellow, wide)
BROWSER REQUIREMENTS

Chrome 88+
Edge 88+
Safari 14+
Firefox 78+

### Sticky 3 (green, wide)
HARDWARE REQUIREMENTS

Minimum:
  Webcam 720p, Display 1024x768
  Dual-core CPU, 4GB RAM

Recommended:
  Webcam 1080p, Display 1920x1080
  Quad-core CPU, 8GB RAM

### Sticky 4 (orange, wide)
KEY ARCHITECTURE

Single-page app — index.html loads everything
Canvas rendering — one <canvas> mirrored scaleX(-1)
State machine: WELCOME > PLAYER_SELECT > MODE_SELECT > CALIBRATION > PLAYING > ROUND_END
Global objects: window.game, window.gardenManager
CSS custom properties for theming

### Sticky 5 (violet)
FILE STRUCTURE

index.html — entry point
css/styles.css — all styling
js/game.js — state machine
js/garden/ — garden subsystem
  garden-bed.js, plant-pot.js
  tools.js, plant-needs.js
  effects.js, constants.js
js/handTracking.js — MediaPipe
js/dda.js — difficulty
js/ui.js — screens & hover
js/audio.js — synthesized sounds
js/challenges.js — challenges
js/story.js — narrative

---

## Section 11: ACCESSIBILITY (x:1400, y:3100)

### Sticky 1 (green, wide)
VISUAL ACCESSIBILITY

Text: Minimum 32px primary text
Contrast: WCAG AA (4.5:1 minimum)
Color Independence: Names always shown with colors
Motion: No rapid flashing (<3 per second)
Target Size: 70px+ hit zones

### Sticky 2 (blue, wide)
MOTOR ACCESSIBILITY

Both hands tracked, either works
Generous hit detection windows
Fatigue: Seated play fully supported
3-second dwell activation (no clicking)
DDA adapts to motor ability

### Sticky 3 (yellow, wide)
COGNITIVE ACCESSIBILITY

Clear single objective always visible
Fixed UI positions throughout
No penalty for wrong touches
Current task always displayed
All challenges eventually completable
No time pressure (timers generous)
Memory-independent design

### Sticky 4 (pink, wide)
DESIGN PHILOSOPHY

"No failure states"
Every interaction is rewarded
Every round celebrates growth

Help appears naturally without
drawing attention to struggle

The player should feel supported,
not corrected

### Sticky 5 (orange)
SUCCESS METRICS

Avg session: 5-15 minutes
Task completion: >90%
7-day return rate: >60%
Staff setup time: <30 seconds
Frustration incidents: <5%
Hand calibration success: >95%

---

## Section 12: FUTURE ROADMAP (x:2800, y:3100)

### Sticky 1 (violet, wide)
NEAR TERM

4-Hand Tracking
  Migrate to @mediapipe/tasks-vision
  Enable numHands: 4
  Both players use both hands

Web Worker Offloading
  Move MediaPipe to Web Worker
  Free main thread for rendering
  Better frame rates on low-end devices

### Sticky 2 (blue, wide)
EXPANDED DDA

Visual distractions for high-ability players
Spawn rate adjustment per player
Asymmetric scoring (accuracy vs engagement)
Need complexity (more simultaneous needs)

### Sticky 3 (orange, wide)
SOCIAL METRICS

Head-turn detection (Face Mesh)
  Are players looking at each other?

Microphone volume monitoring
  Are they talking and laughing?

Smile detection
  Facial expression for engagement

Verbal encouragement detection
  NLP on speech-to-text

### Sticky 4 (green, wide)
NEW GAME THEMES

Kitchen — pouring, whisking, flipping
Workshop — hammering, painting, assembly
Aquarium — fish feeding, coral growing
Music — virtual instruments with gestures
Driving — scenic steering

All share same DDA engine,
hand tracking, and 2-player infrastructure

### Sticky 5 (pink, wide)
PLATFORM EXPANSION

Free Play Mode — untimed sandbox
Tablet Mode — touch fallback
Smart TV — cast to big screen
Kiosk Mode — auto-start for care facilities
PWA — installable, offline-capable
Native Apps — iOS/Android wrappers

### Sticky 6 (yellow, wide)
DATA & ANALYTICS DASHBOARD

Clinician-facing dashboard:
- Session frequency & duration trends
- Motor engagement heatmaps
- DDA difficulty curves over time
- Social interaction scores
- Exportable reports for care plans

---

# POLISHED FIGMA DESIGN FILE PLAN

## File Key: `gG0pNxqErnOOnFEuUcjhTC`

### Brand Colors
- Primary gradient: Magenta (#E91E8C) to Purple (#7B2D8E)
- "re:" = magenta/pink
- "Action" = purple gradient
- "Health Technologies" = purple
- Pillar card backgrounds: Light lavender/pink (#F5E6F5)
- Pillar card borders: Teal (#2B7A78)
- P1 Orange: #FF8C42
- P2 Blue: #4A90D9
- Success Green: #27AE60
- Warning Yellow: #F1C40F
- Background: White / Light gray (#F8F9FA)

### Pages to Create
1. **Cover** — re:Action logo, Garden Grow title, tagline, 4 pillars
2. **Game Overview** — Elevator pitch, key differentiators, core values, personas
3. **Core Loop & Mechanics** — Visual loop diagram, plant types table, needs system, tools
4. **Game Modes** — Solo, Co-op, Competitive cards with visual layouts
5. **DDA System** — Fair Play engine diagram, parameters table, adjustment rules
6. **Therapeutic Framework** — 4 pillars detail, cognitive design, research citations
7. **Hand Tracking** — MediaPipe setup, collision points, player assignment, gloves
8. **Art & Audio** — Color palette, sound effects list, visual effects, themes
9. **Accessibility** — Visual/Motor/Cognitive requirements grid
10. **Tech Stack** — Architecture diagram, file structure, browser requirements
11. **Storyline** — 3 chapters with progression and unlock rewards
12. **Roadmap** — Future features organized by timeline

### Design System for GDD
- Section header cards: Purple gradient background, white text, 48px bold
- Content cards: White background, subtle shadow, 16px rounded corners
- Info stickies: Colored left border (matching category)
- Tables: Clean with alternating row colors
- Typography: Inter family (Bold for headers, Regular for body)
- Spacing: 24px grid
