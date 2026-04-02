# Garden Grow -- Figma Screen Specification Reference

> **Purpose:** Pixel-perfect rebuild reference for Figma. Every value comes directly from the source code (`index.html`, `css/styles.css`, `js/ui.js`).
>
> **Live URL:** https://vinhly271193.github.io/balloon-pop-game/
>
> **Canvas note:** The game canvas uses `transform: scaleX(-1)` (mirrored). UI overlays sit at `z-index: 10`, canvas at `z-index: 15`, settings at `z-index: 50`/`200`, loading at `z-index: 100`.

---

## Global Design Tokens

### Colors (CSS Custom Properties)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-tomato` | `#FF6347` | Plant color |
| `--color-sunflower` | `#FFD700` | Plant color, encouragement text |
| `--color-carrot` | `#FF8C00` | Plant color |
| `--color-lettuce` | `#90EE90` | Plant color |
| `--color-blueberry` | `#4169E1` | Plant color |
| `--bg-primary` | `#1a2e1a` | Base dark background |
| `--bg-secondary` | `#213e21` | Card/panel backgrounds |
| `--bg-overlay` | `rgba(0, 20, 0, 0.85)` | Screen overlay background |
| `--text-primary` | `#ffffff` | Primary text |
| `--text-secondary` | `#a8d5a8` | Secondary/muted text |
| `--accent-primary` | `#4ade80` | Primary accent (green) |
| `--accent-secondary` | `#22c55e` | Secondary accent (deeper green) |
| `--soil-brown` | `#8B4513` | Soil tone |
| `--soil-dark` | `#654321` | Dark soil tone |
| `--sky-blue` | `#87CEEB` | Sky color |
| `--sunlight-warm` | `#FFE4B5` | Warm light accent |
| `--terracotta` | `#E07A5F` | Terracotta pot tone |
| `--color-player1` | `#FF8C42` | Player 1 orange |
| `--color-player1-light` | `#FFF5E6` | Player 1 light tint |
| `--color-player2` | `#4A90D9` | Player 2 blue |
| `--color-player2-light` | `#E6F0FF` | Player 2 light tint |

### Typography

| Token | Desktop | Tablet (<=768px) | Phone (<=480px) |
|-------|---------|-------------------|------------------|
| `--text-huge` | 72px | 48px | 36px |
| `--text-large` | 48px | 36px | 28px |
| `--text-medium` | 32px | 24px | 20px |
| `--text-normal` | 24px | 18px | 18px |
| `--text-small` | 18px | 14px | 14px |

**Font stack:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif`

### Spacing

| Token | Desktop | Tablet (<=768px) |
|-------|---------|-------------------|
| `--spacing-large` | 40px | 24px |
| `--spacing-medium` | 24px | 16px |
| `--spacing-small` | 12px | 8px |

### Transitions

| Token | Value |
|-------|-------|
| `--transition-fast` | `0.2s ease` |
| `--transition-medium` | `0.4s ease` |

---

## Screen: Welcome

### Identity
- **HTML ID:** `#welcomeScreen`
- **CSS classes:** `.screen .light-screen .active` (default active on load)

### Background
Multi-layer radial + linear gradient (light-screen class):

```
radial-gradient(ellipse at 70% 15%, rgba(255, 220, 120, 0.5) 0%, transparent 45%)
radial-gradient(ellipse at 10% 85%, rgba(144, 238, 144, 0.25) 0%, transparent 40%)
radial-gradient(ellipse at 90% 80%, rgba(144, 238, 144, 0.2) 0%, transparent 35%)
linear-gradient(180deg, #FFF8F0 0%, #FFF5E6 20%, #FEFCE8 45%, #F0FDF4 70%, #DCFCE7 100%)
```

### Layout
- **Position:** absolute, fills viewport (100% x 100%)
- **Display:** flex
- **Justify/Align:** center / center
- **Content wrapper** (`.screen-content`): text-align center, padding 40px, max-width 800px

### Elements (top to bottom)

1. **Floating Particles Layer** (`.floating-particles`)
   - Position: absolute, fills parent, z-index 0, overflow hidden
   - 8 JS-generated `.particle` divs (leaf shapes: `border-radius: 50% 0 50% 0`)
   - Sizes: 10--24px width, height = width * 0.7
   - Colors: `rgba(74,222,128,0.3)`, `rgba(255,200,120,0.25)`, `rgba(255,182,193,0.25)`, `rgba(144,238,144,0.3)`, `rgba(255,223,186,0.2)`
   - Animation: `particleDrift` -- 10-20s duration, 0-8s random delay, drifts 80px right + 110vh down + 400deg rotation
   - Also has 2 CSS pseudo-element leaves: `::before` (18x12px green at 15% left, 12s) and `::after` (14x10px warm at 70% left, 15s)
   - Responds to hand parallax: max 15px horizontal, 10px vertical shift

2. **Company Logo** (`.company-logo`)
   - Element: `<img src="assets/images/logo.png">`
   - Max-width: 400px (280px on mobile)
   - Width: 80%
   - Height: auto
   - Margin-bottom: 40px
   - Filter: `drop-shadow(0 4px 15px rgba(0, 0, 0, 0.1))` (on light screens)

3. **Game Title** (`.game-title.garden-title`)
   - Tag: `<h1>`
   - Text: "Garden Grow!"
   - Font-size: 72px (var --text-huge)
   - Font-weight: 800
   - Gradient text fill: `linear-gradient(135deg, #FF6347, #FFD700, #90EE90, #4169E1)`
   - Technique: `-webkit-background-clip: text; -webkit-text-fill-color: transparent`
   - Margin-bottom: 24px

4. **Instruction Text** (`.instruction-text`)
   - Text: "Use your hands to help plants grow"
   - Font-size: 32px
   - Color: `#4b5563` (on light screens)
   - Line-height: 1.4
   - Margin-bottom: 40px

5. **Hand Demo** (`.hand-demo`)
   - Contains `.hand-icon.garden-icon` with text "🌱"
   - Font-size: 100px (60px on mobile)
   - Animation: `grow` -- 2s ease-in-out infinite, scales 1.0 to 1.2 and back
   - Margin-bottom: 40px
   - Parent `.hand-demo` has `wave` animation: rotates -10deg to +10deg, 1s

6. **Welcome Message** (`#welcomeMessage`, `.welcome-message`)
   - Dynamic text (empty by default, populated for returning players)
   - Font-size: 24px
   - Color: `#16a34a` (on light screens)
   - Min-height: 30px
   - Margin-bottom: 24px

7. **Start Button** (`#startBtn`, `.big-button.hoverable.has-border-progress`)
   - Text: "Start Growing"
   - Min-width: 280px (200px on mobile)
   - Padding: 24px 40px (12px 24px on mobile)
   - Font-size: 32px
   - Font-weight: 700
   - Border-radius: 20px
   - Background (light screen): `linear-gradient(135deg, #22c55e, #16a34a)`
   - Color: `#ffffff`
   - Box-shadow: `0 6px 24px rgba(34, 197, 94, 0.35)`
   - Margin: 12px
   - **Border progress track:** 9px outset from button edges, 9px solid `rgba(0, 0, 0, 0.12)` (light screen), border-radius 32px
   - **Border progress fill:** 12px outset, 12px solid white, border-radius 32px, box-shadow `0 0 15px rgba(255,255,255,0.8), 0 0 30px rgba(255,255,255,0.5)`, masked by conic-gradient driven by `--progress` CSS variable (0 to 1)
   - **Hover state:** scale(1.05)
   - **Active state:** scale(0.98)
   - **Hand hovering state:** scale(1.05), box-shadow `0 0 30px rgba(74, 222, 128, 0.6)`
   - Activation: 3s dwell time, border fills 360 degrees clockwise from top

8. **Camera Hint** (`.camera-hint`)
   - Text: "Camera access required"
   - Font-size: 18px
   - Color: `#9ca3af` (on light screens)
   - Margin-top: 24px

9. **Garden Preview Strip** (`#gardenPreviewCanvas`, `.garden-preview-strip`)
   - Position: absolute, bottom 0, left 0
   - Width: 100%, height: 20vh
   - Z-index: 0
   - Pointer-events: none
   - This is a `<canvas>` element drawn via JS (garden-bed.js preview rendering)

### Entrance Transition
- Screen: `opacity 0 -> 1` over `0.4s ease`
- Content: `fadeSlideUp` animation -- 0.6s ease-out, from `opacity:0, translateY(30px)` to `opacity:1, translateY(0)`

### Exit Transition
- `.active` class removed: `display: none`, opacity fades out over 0.4s

---

## Screen: Player Select

### Identity
- **HTML ID:** `#playerSelectScreen`
- **CSS classes:** `.screen .light-screen`

### Background
Same as Welcome screen (`.light-screen` gradient). Floating particles are spawned when shown.

### Layout
- Same flex center/center as Welcome
- `.screen-content`: text-align center, padding 40px, max-width 800px

### Elements (top to bottom)

1. **Floating Particles Layer** -- identical spec to Welcome

2. **Title** (`.player-select-title`)
   - Tag: `<h2>`
   - Text: "How Many Gardeners?"
   - Font-size: 48px (var --text-large)
   - Color: `#15803d` (overridden on light screens)
   - Margin-bottom: 12px

3. **Instruction Text** (`.instruction-text`)
   - Text: "Choose how many players"
   - Font-size: 32px
   - Color: `#4b5563`
   - Margin-bottom: 40px

4. **Button Group** (`.player-select-buttons`)
   - Display: flex
   - Justify-content: center
   - Gap: 40px
   - Margin-top: 40px
   - Flex-wrap: wrap
   - **Responsive (<=768px):** flex-direction column, align-items center, gap 24px

5. **1 Player Button** (`.big-button.player-select-btn`)
   - Min-width: 240px (200px on mobile)
   - Flex-direction: column
   - Padding: 40px 24px (24px on mobile)
   - Inner `<span>` is flex column, center aligned, gap 12px
   - **Icon** (`.player-btn-icon`): "🧑‍🌾", font-size 56px (40px on mobile)
   - **Label** (`.player-btn-label`): "1 Player", font-size 32px, weight 700
   - Background (light screen): `linear-gradient(135deg, #22c55e, #16a34a)`
   - Same border-progress system as Start button
   - `data-hover-action="selectOnePlayer"`

6. **2 Players Button** -- identical structure
   - Icon: "🧑‍🌾🧑‍🌾"
   - Label: "2 Players"
   - `data-hover-action="selectTwoPlayers"`

### Transitions
- Same fadeSlideUp entrance as Welcome
- Same opacity fade in/out

---

## Screen: Mode Select

### Identity
- **HTML ID:** `#modeSelectScreen`
- **CSS classes:** `.screen .light-screen`
- **Shown:** Only after selecting "2 Players"

### Background
Same light-screen gradient. Floating particles spawned.

### Layout
Same as Player Select.

### Elements (top to bottom)

1. **Floating Particles Layer**

2. **Title** (`.mode-select-title`)
   - Text: "Choose Your Garden"
   - Font-size: 48px
   - Color: `#15803d` (light screen override)
   - Margin-bottom: 12px

3. **Instruction Text**
   - Text: "How would you like to play together?"
   - Font-size: 32px
   - Color: `#4b5563`

4. **Button Group** (`.mode-select-buttons`)
   - Same flex layout as player-select-buttons

5. **Community Garden Button** (`.mode-select-btn`)
   - Min-width: 240px
   - Padding: 40px 24px
   - Inner span: flex column, center, gap 12px
   - **Icon** (`.mode-btn-icon`): "🧺", font-size 56px
   - **Label** (`.mode-btn-label`): "Community Garden", font-size 32px, weight 700
   - **Description** (`.mode-btn-desc`): "Work together, share the harvest", font-size 18px, color `#6b7280`, weight 400
   - `data-hover-action="selectCoop"`

6. **Village Fair Button**
   - Icon: "🎀"
   - Label: "Village Fair"
   - Description: "Friendly contest, earn ribbons"
   - `data-hover-action="selectCompetitive"`

### Transitions
Same as Welcome/Player Select.

---

## Screen: Calibration (1-Player)

### Identity
- **HTML ID:** `#calibrationScreen`
- **CSS classes:** `.screen` (NOT light-screen)

### Background
`var(--bg-overlay)` = `rgba(0, 20, 0, 0.85)` -- dark semi-transparent green-black overlay

### Layout
- Flex center/center
- `.screen-content`: text-align center, padding 40px, max-width 800px

### Elements (top to bottom)

1. **Title** (`.calibration-title`)
   - Text: "Show Your Gardening Hands!"
   - Font-size: 48px
   - Color: `#ffffff` (default --text-primary)
   - Margin-bottom: 24px

2. **Instruction Text**
   - Text: "Hold your hands up so the camera can see them"
   - Font-size: 32px
   - Color: `#ffffff`
   - Margin-bottom: 40px

3. **Hand Status Container** (`#handStatus`)
   - Display: flex
   - Justify-content: center
   - Gap: 40px
   - Margin: 40px 0
   - **Responsive (<=768px):** flex-direction column, gap 24px

4. **Left Hand Indicator** (`#leftHandIndicator`, `.hand-indicator`)
   - Display: flex, flex-direction column, align-items center
   - Padding: 24px
   - Background: `#213e21` (var --bg-secondary)
   - Border-radius: 20px
   - Min-width: 200px (160px on mobile)
   - Border: 4px solid `#a8d5a8` (var --text-secondary)
   - **Label** (`.hand-label`): "Left Hand", font-size 24px, weight 700, margin-bottom 12px
   - **Status** (`.hand-status`): "Not detected", font-size 18px, color `#a8d5a8`
   - **Detected state** (`.hand-indicator.detected`):
     - Border-color: `#4ade80`
     - Background: `rgba(74, 222, 128, 0.1)`
     - Status text changes to "Detected!", color `#4ade80`
   - Transition: border-color 0.2s ease, background 0.2s ease

5. **Right Hand Indicator** (`#rightHandIndicator`)
   - Same structure as Left Hand
   - Label: "Right Hand"

6. **Wave Instruction** (`.wave-instruction`)
   - Text: "Wave to start gardening!"
   - Font-size: 32px
   - Color: `#4ade80` (var --accent-primary)
   - Animation: `pulse` -- 1.5s ease-in-out infinite, opacity 1 to 0.5

7. **Calibration Progress Bar** (`.calibration-progress-bar`)
   - Width: 50%, max-width 300px
   - Height: 6px
   - Background: `rgba(255, 255, 255, 0.15)`
   - Border-radius: 3px
   - Margin: 24px auto 0
   - **Fill** (`.calibration-progress-fill`, `#calibrationProgressFill`):
     - Height: 100%, width: 0% (JS-driven)
     - Background: `linear-gradient(90deg, #4ade80, #22c55e)`
     - Border-radius: 3px

### Transitions
- Opacity fade 0.4s (no slideUp -- not a light-screen)

---

## Screen: Calibration P2 (2-Player Sequential)

### Identity
- **HTML ID:** `#calibrationP2Screen`
- **CSS classes:** `.screen`

### Background
`rgba(0, 20, 0, 0.85)` (dark overlay)

### Layout
Same as Calibration 1P.

### Elements (top to bottom)

1. **Title** (`.calibration-title.calibration-p2-title`)
   - Text: "Player 2, Join the Garden!"
   - Font-size: 48px
   - Color: `#4ade80` (`.calibration-p2-title` override)
   - Margin-bottom: 24px

2. **Instruction Text**
   - Text: "Now show your hand on the **left side** of the screen" (bold tag on "left side")
   - Font-size: 32px
   - Color: `#ffffff`

3. **Calibration Players Container** (`.calibration-players`)
   - Display: flex
   - Justify-content: center
   - Gap: 40px
   - Margin: 40px 0
   - **Responsive (<=768px):** flex-direction column, align-items center, gap 24px

4. **Player 1 Card** (`.calibration-player.p1-ready`)
   - Display: flex, flex-direction column, align-items center
   - Padding: 24px
   - Background: `rgba(255, 140, 66, 0.1)` (p1-ready state)
   - Border-radius: 20px
   - Min-width: 180px (160px on mobile)
   - Border: 4px solid `#FF8C42` (p1-ready state)
   - **Icon** (`.cal-player-icon`): "✋", font-size 48px, inline style `color: #FF8C42`
   - **Label** (`.cal-player-label`): "Player 1", font-size 24px, weight 700, margin-bottom 4px
   - **Status** (`.cal-player-status`): "Ready!", font-size 18px, color `#FF8C42` (p1-ready override)

5. **Player 2 Card** (`.calibration-player.p2-waiting`, `#p2CalStatus`)
   - Same structure as P1 card
   - Border: 4px solid `#a8d5a8` (text-secondary, waiting state)
   - Animation: `pulse` 1.5s ease-in-out infinite (while waiting)
   - Icon: "✋" with `color: #4A90D9`
   - Label: "Player 2"
   - Status: "Waiting..." (updated by JS via `#p2CalStatusText`)
   - Color: `#a8d5a8` (default secondary)

6. **Wave Instruction**
   - Text: "Both hands detected? Let's grow!"
   - Same styling as Calibration 1P

7. **Calibration Progress Bar**
   - Same spec as Calibration 1P, using `#calibrationP2ProgressFill`

### Transitions
Same opacity fade as Calibration 1P.

---

## Screen: Challenge Intro

### Identity
- **HTML ID:** `#challengeIntroScreen`
- **CSS classes:** `.screen`

### Background
`rgba(0, 20, 0, 0.85)` (dark overlay)

### Layout
Same flex center/center. `.screen-content` with 40px padding, 800px max-width.

### Elements (top to bottom)

1. **Chapter Header** (`#chapterHeader`, `.chapter-header`) -- conditionally shown
   - Display: none by default (JS sets `display: block` on first level of each chapter)
   - Margin-bottom: 24px
   - Padding: 24px
   - Background: `rgba(74, 222, 128, 0.1)`
   - Border-radius: 16px
   - Border: 2px solid `rgba(74, 222, 128, 0.3)`
   - **Chapter Icon** (`.chapter-header-icon`): "🌱", font-size 48px, display block, margin-bottom 12px
     - Animation: `float` -- 3s ease-in-out infinite, translateY 0 to -10px
   - **Chapter Number** (`.chapter-header-number`): e.g. "Chapter 1", font-size 18px, color `#a8d5a8`, uppercase, letter-spacing 3px, margin-bottom 4px
   - **Chapter Title** (`.chapter-header-title`): e.g. "The Forgotten Garden", font-size 32px, weight 800, color `#4ade80`, margin 0

2. **Level Label** (`.level-label`)
   - Text: "Level " + `<span id="levelNumber">1</span>`
   - Font-size: 48px
   - Color: `#a8d5a8`
   - Level number span color: `#4ade80`
   - Margin-bottom: 12px

3. **Challenge Text** (`#challengeDisplay`, `.challenge-text`)
   - Dynamic text from challenge templates (e.g. "Grow 3 Tomatoes")
   - Font-size: 72px
   - Font-weight: 800
   - Color: `#ffffff`
   - Margin: 24px 0
   - Line-height: 1.3

4. **Challenge Colors / Plant Indicators** (`#challengeColors`, `.challenge-colors`)
   - Display: flex
   - Justify-content: center
   - Gap: 24px
   - Margin: 40px 0
   - **Responsive (<=480px):** flex-wrap: wrap
   - Each indicator (`.color-target.plant-indicator`):
     - Display: flex, flex-direction column, align-items center
     - Padding: 24px (12px on <=480px)
     - Background: `#213e21`
     - Border-radius: 16px
     - Min-width: 120px (80px on <=480px)
     - **Plant Icon** (`.plant-icon`): emoji, font-size 40px, margin-bottom 12px
     - **Plant Name** (`.plant-name`): dynamic, font-size 24px, weight 700, color matches plant type
     - **Plant Count** (`.plant-count`): number, font-size 48px, weight 800, color `#ffffff`

5. **Ready Text** (`.ready-text`)
   - Text: "Get Ready to Grow!"
   - Font-size: 32px
   - Color: `#a8d5a8`
   - Margin-top: 24px

6. **Countdown** (`#countdown`, `.countdown`)
   - Text: "3" (counts down 3, 2, 1)
   - Font-size: 120px (80px on mobile)
   - Font-weight: 800
   - Color: `#4ade80`
   - Margin-top: 24px
   - Animation: `countdownPulse` -- 1s ease-in-out infinite, scale 1 to 1.1

### Behavior
- Countdown ticks every 1000ms (setInterval)
- Plays `countdown` sound on each tick, `gameStart` on completion
- After reaching 0, triggers game start callback

### Transitions
Same opacity fade.

---

## HUD: Game HUD (1-Player / Co-op)

### Identity
- **HTML ID:** `#gameHUD`
- **CSS classes:** `.hud .hidden`

### Position/Layout
- Position: absolute, top 0, left 0, width 100%
- Padding: 24px
- Pointer-events: none
- Hidden via `.hidden` class (`display: none`)

### Elements

1. **Top Row** (`.hud-top`)
   - Display: flex
   - Justify-content: space-between
   - Align-items: flex-start

2. **Timer** (`.hud-item.timer-display`)
   - Background: `rgba(0, 0, 0, 0.7)`
   - Padding: 12px 24px
   - Border-radius: 16px
   - Text-align: center
   - **Label** (`.hud-label`): "Time", font-size 18px, color `#a8d5a8`, uppercase, letter-spacing 1px, display block
   - **Value** (`#timerValue`, `.hud-value`): "60", font-size 48px, weight 800, color `#FFD700` (--color-yellow)
   - **Low time state (<=10s):** color `#FF3B30`, animation `pulse 0.5s ease-in-out infinite`

3. **Challenge Display** (`.hud-item.challenge-display`)
   - Flex: 1
   - Margin: 0 24px
   - Same background/padding/radius as timer
   - **Challenge Mini** (`#currentChallenge`, `.challenge-mini`): font-size 32px, weight 700

4. **Score** (`.hud-item.score-display`)
   - Same background styling
   - **Label**: "Plants", same as timer label
   - **Value** (`#scoreValue`): "0", font-size 48px, weight 800, color `#4ade80`

5. **Progress Row** (`.hud-progress`)
   - Margin-top: 24px
   - Display: flex
   - Align-items: center
   - Gap: 24px

6. **Progress Bar** (`#progressBar`, `.progress-bar`)
   - Flex: 1
   - Height: 20px
   - Background: `rgba(0, 0, 0, 0.7)`
   - Border-radius: 10px
   - Overflow: hidden
   - **Fill** (`#progressFill`, `.progress-fill`):
     - Height: 100%, width: 0% (JS-driven)
     - Background: `linear-gradient(90deg, #4ade80, #22c55e)`
     - Border-radius: 10px
     - Transition: width 0.2s ease

7. **Progress Text** (`#progressText`, `.progress-text`)
   - Text: "0 / 3"
   - Font-size: 24px, weight 700
   - Background: `rgba(0, 0, 0, 0.7)`
   - Padding: 12px 24px
   - Border-radius: 10px
   - Min-width: 100px
   - Text-align: center

---

## HUD: Game HUD 2-Player (Competitive)

### Identity
- **HTML ID:** `#gameHUD2P`
- **CSS classes:** `.hud .hud-2p .hidden`

### Position/Layout
Same as 1P HUD but with competitive layout.

### Elements

1. **Top Row** (`.hud-top.hud-top-2p`)
   - Display: flex
   - Justify-content: space-between
   - Align-items: flex-start
   - Gap: 12px (4px on mobile)

2. **Player 2 Score** (left side of screen due to mirror) (`.hud-item.hud-player-score.hud-p2-score`)
   - Flex: 1, max-width 280px (160px on mobile)
   - Text-align: left
   - Same dark background styling
   - **Label** (`.hud-label.hud-label-p2`): "Player 2", color `#4A90D9`
   - **Value** (`#p2ScoreValue`, `.hud-value.hud-value-p2`): "0", color `#4A90D9`, font-size 48px (32px on mobile)
   - **Progress Bar** (`.progress-bar.progress-bar-p2`):
     - Background: `rgba(74, 144, 217, 0.2)`
     - Margin-top: 8px
   - **Progress Fill** (`.progress-fill.progress-fill-p2`):
     - Background: `linear-gradient(90deg, #4A90D9, #6AB0F0)`

3. **Timer** (center) (`.hud-item.timer-display.timer-display-center`)
   - Flex-shrink: 0
   - Same spec as 1P timer, uses `#timerValue2P`

4. **Player 1 Score** (right side) (`.hud-item.hud-player-score.hud-p1-score`)
   - Same as P2 but right-aligned
   - Text-align: right
   - Margin-right: 70px (to clear settings gear)
   - **Label** (`.hud-label-p1`): "Player 1", color `#FF8C42`
   - **Value** (`#p1ScoreValue`, `.hud-value-p1`): color `#FF8C42`
   - **Progress Bar** (`.progress-bar-p1`): background `rgba(255, 140, 66, 0.2)`
   - **Progress Fill** (`.progress-fill-p1`): background `linear-gradient(90deg, #FF8C42, #FFB066)`

---

## Screen: Round End (1-Player / Co-op)

### Identity
- **HTML ID:** `#roundEndScreen`
- **CSS classes:** `.screen`

### Background
`rgba(0, 20, 0, 0.85)`

### Layout
Same flex center/center.

### Elements (top to bottom)

1. **Result Title** (`#roundResult`, `.result-title`)
   - Dynamic text: "Great Job!" (if complete) or "Good Try!" (if not)
   - Font-size: 72px
   - Color: `#4ade80` (complete) or `#FFCC00` (not complete)
   - Margin-bottom: 40px

2. **Score Summary** (`.score-summary`)
   - Display: flex
   - Justify-content: center
   - Gap: 40px
   - Margin-bottom: 40px
   - **Responsive (<=768px):** flex-direction column, gap 24px

3. **Final Score Card** (`.final-score`)
   - Background: `#213e21`
   - Padding: 24px 40px
   - Border-radius: 20px
   - Min-width: 180px
   - **Label** (`.score-label`): "Score", font-size 18px, color `#a8d5a8`, uppercase, margin-bottom 12px
   - **Number** (`#finalScore`, `.score-number`): "0", font-size 72px, weight 800, color `#4ade80`

4. **Plants Grown Card** (`.plants-grown`)
   - Same styling as Final Score card
   - **Label** (`.grown-label`): "Plants Grown"
   - **Number** (`#plantsGrown`, `.grown-number`): "0"

5. **Encouragement Text** (`#encouragementText`, `.encouragement-text`)
   - Dynamic text
   - Font-size: 24px
   - Color: `#FFD700` (--color-sunflower)
   - Font-style: italic
   - Min-height: 30px
   - Margin-bottom: 24px

6. **Chapter Complete Section** (`#chapterCompleteSection`) -- conditionally shown
   - Display: none by default
   - Margin: 24px 0
   - **Banner** (`.chapter-complete-banner`):
     - Padding: 24px
     - Background: `radial-gradient(ellipse at center, rgba(74, 222, 128, 0.15) 0%, transparent 70%)`
     - Border-radius: 16px
     - Border: 2px solid `rgba(74, 222, 128, 0.4)`
   - **Icon**: "🎉", font-size 64px, animation `celebrate` 0.5s infinite alternate (scale 1 rotate -5deg to scale 1.1 rotate +5deg)
   - **Title**: "Chapter Complete!", font-size 32px, weight 800, color `#4ade80`
   - **Reward text**: font-size 24px, color `#ffffff`, line-height 1.4
   - **Unlock text**: font-size 18px, color `#FFD700`, weight 700

7. **End Buttons** (`.end-buttons`)
   - Display: flex
   - Justify-content: center
   - Flex-wrap: wrap
   - Gap: 24px

8. **Keep Growing Button** (`#nextLevelBtn`, `.big-button.primary`)
   - Text: "Keep Growing"
   - Shown when challenge completed, hidden otherwise
   - Same `.big-button` styling
   - Background: `linear-gradient(135deg, #4ade80, #22c55e)`
   - Color: `#1a2e1a`
   - Box-shadow: `0 8px 30px rgba(74, 222, 128, 0.4)`
   - `data-hover-action="nextLevel"`

9. **Try Again Button** (`#retryLevelBtn`, `.big-button.primary`)
   - Text: "Try Again"
   - Shown when challenge NOT completed, hidden otherwise
   - `data-hover-action="retryLevel"`

10. **Start Over Button** (`#playAgainBtn`, `.big-button.secondary`)
    - Text: "Start Over"
    - Always visible
    - Background: `#213e21`
    - Color: `#ffffff`
    - Border: 3px solid `#a8d5a8`
    - `data-hover-action="playAgain"`

### Transitions
Opacity fade 0.4s.

---

## Screen: Round End Competitive (2-Player)

### Identity
- **HTML ID:** `#roundEndScreen2P`
- **CSS classes:** `.screen`

### Background
`rgba(0, 20, 0, 0.85)`

### Layout
Same flex center/center.

### Elements (top to bottom)

1. **Result Title** (`.result-title.result-title-2p`)
   - Text: "Village Fair Results!"
   - Font-size: 72px
   - Color: `#4ade80`
   - Margin-bottom: 24px

2. **Ribbon Results** (`.ribbon-results`)
   - Display: flex
   - Justify-content: center
   - Gap: 40px
   - Margin-bottom: 40px
   - Flex-wrap: wrap
   - **Responsive (<=768px):** flex-direction column, align-items center, gap 24px

3. **Player 1 Ribbon Card** (`#ribbonP1`, `.ribbon-card.ribbon-p1`)
   - Display: flex, flex-direction column, align-items center
   - Padding: 40px 24px (24px on mobile)
   - Background: `#213e21`
   - Border-radius: 24px
   - Min-width: 200px (180px on mobile)
   - Border: 4px solid `#FF8C42`
   - Box-shadow: `0 4px 20px rgba(255, 140, 66, 0.3)`
   - Hover: scale(1.02)
   - **Ribbon Icon** (`.ribbon-icon`): "🎀", font-size 56px (40px on mobile), margin-bottom 12px
   - **Player Label** (`.ribbon-player-label`): inline style `color: #FF8C42`, font-size 24px, weight 700, margin-bottom 4px
   - **Score** (`#ribbonP1Score`, `.ribbon-score`): "0", font-size 72px, weight 800, color `#4ade80`, margin-bottom 12px
   - **Title** (`#ribbonP1Title`, `.ribbon-title`): "Blue Ribbon" or "Red Ribbon" (dynamic), font-size 32px, weight 700, color `#FFD700`

4. **Player 2 Ribbon Card** (`#ribbonP2`, `.ribbon-card.ribbon-p2`)
   - Same structure as P1
   - Border: 4px solid `#4A90D9`
   - Box-shadow: `0 4px 20px rgba(74, 144, 217, 0.3)`
   - Player label color: `#4A90D9`

5. **Encouragement Text** (`#encouragementText2P`)
   - Text: "Both gardens are blooming beautifully!"
   - Same styling as 1P encouragement

6. **End Buttons** -- same structure as 1P Round End
   - Keep Growing (`#nextLevelBtn2P`)
   - Try Again (`#retryLevelBtn2P`)
   - Start Over (`#playAgainBtn2P`)

### Dynamic Behavior
- Winner gets "Blue Ribbon!" title, other gets "Red Ribbon!"
- Both always celebrate -- no "loser" messaging (therapeutic design)

---

## Overlay: Settings

### Identity
- **HTML ID:** `#settingsOverlay`
- **CSS classes:** `.settings-overlay .hidden`

### Background
- Position: fixed, fills viewport
- Background: `rgba(0, 20, 0, 0.85)` (var --bg-overlay)
- Z-index: 200
- Opacity transition 0.4s

### Panel (`.settings-panel`)
- Background: `#213e21`
- Border-radius: 24px
- Padding: 40px
- Max-width: 600px
- Width: 95%
- Max-height: 90vh
- Overflow-y: auto
- Position: relative

### Elements (top to bottom)

1. **Close X Button** (`#closeSettingsX`, `.close-x-btn`)
   - Position: absolute, top 12px, right 12px
   - Width: 40px, height: 40px
   - Border-radius: 50%
   - Background: `rgba(255, 255, 255, 0.1)`
   - Border: 2px solid `rgba(255, 255, 255, 0.3)`
   - Color: `#a8d5a8`
   - Contains SVG X icon (24x24)
   - Hover: background `rgba(255,255,255,0.2)`, color white, scale(1.1)
   - Z-index: 10

2. **Settings Title** (`.settings-title`)
   - Text: "Settings"
   - Font-size: 32px
   - Text-align: center
   - Color: `#ffffff`
   - Margin-bottom: 24px

3. **Sound Section** (`.settings-section`)
   - Margin-bottom: 24px
   - Padding-bottom: 12px
   - Border-bottom: 2px solid `rgba(255, 255, 255, 0.1)`

4. **Section Title** (`.settings-section-title`)
   - Text: "Sound"
   - Font-size: 18px
   - Color: `#a8d5a8`
   - Uppercase, letter-spacing 1px
   - Margin-bottom: 12px

5. **Sound Effects Row** (`.setting-row`)
   - Display: flex, justify-content space-between, align-items center
   - Margin-bottom: 12px, flex-wrap wrap, gap 12px
   - **Label** (`.setting-label`): "Sound Effects", font-size 18px, color `#ffffff`
   - **Toggle Button** (`#soundToggle`, `.toggle-button`):
     - Min-width: 70px, padding 8px 16px
     - Font-size: 14px, weight 700
     - Border: 2px solid `#4ade80`
     - Border-radius: 8px
     - Background: transparent
     - Color: `#4ade80`
     - Text: "ON"
     - **Off state** (`.toggle-button.off`): border-color and color change to `#a8d5a8`, text "OFF"
     - Hover: scale(1.05)

6. **Volume Row**
   - Label: "Volume"
   - **Volume Control** (`.volume-control`): display flex, align-items center, gap 8px
   - **Minus Button** (`#volumeDown`, `.volume-btn`):
     - Width: 36px, height: 36px
     - Border-radius: 50%
     - Border: 2px solid `#a8d5a8`
     - Background: transparent
     - Color: `#ffffff`
     - Font-size: 18px, weight 700
     - Text: "-"
     - Hover: border-color and color `#4ade80`, scale(1.1)
   - **Volume Slider** (`#volumeSlider`, `.volume-bar.volume-slider`):
     - Width: 120px, height: 16px
     - Background: `rgba(255, 255, 255, 0.2)`
     - Border-radius: 8px
     - Overflow: visible
     - Cursor: pointer
     - **Fill** (`#volumeFill`, `.volume-fill`):
       - Height: 100%, default width 70%
       - Background: `#4ade80`
       - Border-radius: 8px
       - Pointer-events: none
     - **Handle** (`#volumeHandle`, `.volume-handle`):
       - Position: absolute, top 50%, left 70% (JS-driven)
       - Width: 24px, height: 24px
       - Background: `#4ade80`
       - Border: 3px solid white
       - Border-radius: 50%
       - Transform: translate(-50%, -50%)
       - Cursor: grab (grabbing when active)
       - Box-shadow: `0 2px 8px rgba(0, 0, 0, 0.3)`
       - Hover: scale(1.15), Active: scale(1.2)
   - **Plus Button** (`#volumeUp`): same as minus, text "+"

7. **Display Section** (`.settings-section`)
   - Same section styling, title "Display"
   - No border-bottom (last section)

8. **Contrast Row**
   - Label: "Contrast"
   - **Contrast Options** (`.contrast-options`): display flex, gap 6px, flex-wrap wrap
   - **Contrast Buttons** (`.contrast-btn`):
     - Padding: 6px 12px
     - Font-size: 12px, weight 700
     - Border: 2px solid `#a8d5a8`
     - Border-radius: 8px
     - Background: transparent
     - Color: `#a8d5a8`
     - Hover: border-color and color `#ffffff`
     - **Active state** (`.contrast-btn.active`): border-color `#4ade80`, background `#4ade80`, color `#1a2e1a`
     - Options: "Normal" (default active), "High", "Maximum"

9. **Background Row** (`.setting-row.setting-row-vertical`)
   - Flex-direction: column, align-items flex-start
   - Label: "Background"
   - **Background Options** (`.background-options`): display flex, gap 8px, flex-wrap wrap, width 100%, margin-top 8px
   - **Background Buttons** (`.bg-btn.bg-preview`):
     - Display: flex, flex-direction column, align-items center
     - Padding: 6px, min-width 60px, gap 4px
     - Border: 2px solid `#a8d5a8`
     - Border-radius: 8px
     - Background: `rgba(0, 0, 0, 0.3)`
     - Color: `#a8d5a8`
     - **Active state**: background `rgba(74, 222, 128, 0.2)`, border-color `#4ade80`, color `#4ade80`
     - Label `<span>`: font-size 10px
     - **Preview Box** (`.bg-preview-box`): 50x35px, border-radius 4px, border 1px solid `rgba(255,255,255,0.3)`
     - Options with preview gradients:
       - **None**: dark bg with X (two pseudo-element lines at 45deg/-45deg)
       - **Garden** (default active): green gradient preview
       - **Beach**: blue-to-sand gradient preview
       - **Forest**: dark green gradient preview
       - **Sky**: light blue with cloud dots preview

10. **Close Button** (`#closeSettingsBtn`, `.settings-close-btn`)
    - Width: 100%
    - Padding: 12px 24px
    - Font-size: 16px, weight 700
    - Border: none
    - Border-radius: 12px
    - Background: `linear-gradient(135deg, #4ade80, #22c55e)`
    - Color: `#1a2e1a`
    - Box-shadow: `0 4px 15px rgba(74, 222, 128, 0.3)`
    - Margin-top: 12px
    - Contains `.hover-progress-bar` (same spec as other hover bars, radius bottom 12px)
    - Hover: scale(1.02)
    - Text: "Close"

---

## Settings Button (Global)

### Identity
- **HTML ID:** `#settingsBtn`
- **CSS classes:** `.settings-button .hoverable`

### Position
- Position: fixed
- Top: 20px, right: 20px
- **During gameplay** (`.hud-active`): top auto, bottom 20px, right 20px
- Z-index: 50
- Transition: top 0.3s ease

### Appearance
- Width: 60px, height: 60px
- Border-radius: 50%
- Background: `rgba(0, 0, 0, 0.7)`
- Border: 3px solid `rgba(255, 255, 255, 0.3)`
- Color: white
- Contains gear SVG icon (32x32px `viewBox="0 0 24 24"`)
- Hover: background `rgba(0,0,0,0.9)`, scale(1.1)

### Hover Progress Ring
- Position: absolute, -8px outset all sides
- SVG circle: cx/cy 50, r 45
- Background circle: stroke `rgba(255,255,255,0.2)`, stroke-width 4, no fill
- Progress circle: stroke `#4ade80`, stroke-width 4, stroke-dasharray 283, stroke-dashoffset 283 (JS-driven)
- SVG rotated -90deg so progress starts from top
- Circumference: 2 * PI * 45 = ~283

---

## Overlay: Loading

### Identity
- **HTML ID:** `#loadingOverlay`
- **CSS classes:** `.loading`

### Position/Layout
- Position: absolute, fills viewport
- Z-index: 100
- Display: flex, flex-direction column, justify-content center, align-items center

### Background
```
radial-gradient(ellipse at 70% 15%, rgba(255, 220, 120, 0.4) 0%, transparent 45%)
linear-gradient(180deg, #FFF8F0 0%, #FEFCE8 45%, #F0FDF4 70%, #DCFCE7 100%)
```

### Elements

1. **Spinner** (`.loading-spinner.garden-spinner`)
   - Width: 80px, height: 80px
   - Border: 6px solid `rgba(139, 69, 19, 0.2)` (soil-tinted)
   - Border-top-color: `#22c55e` (green)
   - Border-radius: 50%
   - Animation: `spin` -- 1s linear infinite (360deg)
   - Margin-bottom: 24px
   - **Center icon** (`::after`): "🌱", font-size 30px, centered with transform
     - Animation: `sprout` -- 1s ease-in-out infinite, scale 1 to 1.2

2. **Loading Text** (`.loading-text`)
   - Text: "Preparing the garden..."
   - Font-size: 24px
   - Color: `#6b7280`

### Hidden State
- `.loading.hidden`: opacity 0, pointer-events none
- Transition: opacity 0.4s ease

---

## Nature Background Layer

### Identity
- **HTML ID:** `#natureBackground`
- **CSS classes:** `.nature-bg`

### Position
- Position: absolute, fills viewport
- Z-index: 0
- Pointer-events: none
- Opacity: 0 by default, 1 when `.active`
- Transition: opacity 0.5s ease

### Themes

**Garden** (`.bg-garden`) -- default:
```
radial-gradient(circle at 85% 10%, rgba(255,220,100,0.6) 0%, rgba(255,200,50,0.3) 8%, transparent 15%)
radial-gradient(ellipse at 15% 15%, rgba(255,255,255,0.8) 0%, transparent 20%)
radial-gradient(ellipse at 35% 12%, rgba(255,255,255,0.6) 0%, transparent 15%)
radial-gradient(ellipse at 60% 18%, rgba(255,255,255,0.7) 0%, transparent 18%)
radial-gradient(ellipse at 10% 65%, rgba(34,100,34,0.8) 0%, transparent 15%)
radial-gradient(ellipse at 25% 62%, rgba(50,120,50,0.7) 0%, transparent 12%)
radial-gradient(ellipse at 75% 60%, rgba(40,110,40,0.8) 0%, transparent 14%)
radial-gradient(ellipse at 90% 63%, rgba(34,100,34,0.7) 0%, transparent 13%)
linear-gradient(180deg, #87CEEB 0%, #98D8E8 25%, #90EE90 50%, #228B22 65%, #8B4513 80%, #654321 100%)
```

**Beach** (`.bg-beach`):
```
radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.3) 0%, transparent 50%)
linear-gradient(180deg, rgba(135,206,235,0.8) 0%, rgba(100,180,220,0.7) 30%, rgba(70,160,200,0.6) 50%, rgba(194,178,128,0.7) 80%, rgba(210,190,140,0.8) 100%)
```

**Forest** (`.bg-forest`):
```
radial-gradient(ellipse at 30% 20%, rgba(100,140,80,0.5) 0%, transparent 40%)
radial-gradient(ellipse at 70% 60%, rgba(60,100,50,0.4) 0%, transparent 50%)
linear-gradient(180deg, rgba(34,80,50,0.8) 0%, rgba(45,90,55,0.7) 30%, rgba(55,100,60,0.7) 60%, rgba(40,70,45,0.8) 100%)
```

**Sky** (`.bg-sky`):
```
radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.6) 0%, transparent 30%)
radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.5) 0%, transparent 25%)
radial-gradient(ellipse at 40% 50%, rgba(255,255,255,0.4) 0%, transparent 35%)
radial-gradient(ellipse at 80% 60%, rgba(255,255,255,0.3) 0%, transparent 20%)
linear-gradient(180deg, rgba(135,206,250,0.9) 0%, rgba(175,225,255,0.8) 50%, rgba(200,235,255,0.7) 100%)
```

---

## Chapter Color Progression (Light Screens)

The light-screen gradient shifts warmer as chapters advance:

### Chapter 1 (default)
Standard light-screen gradient (cream-to-green).

### Chapter 2 (`.chapter-2`)
```
radial-gradient(ellipse at 70% 15%, rgba(255, 200, 80, 0.55) 0%, transparent 45%)
radial-gradient(ellipse at 10% 85%, rgba(180, 230, 130, 0.25) 0%, transparent 40%)
radial-gradient(ellipse at 90% 80%, rgba(255, 220, 160, 0.2) 0%, transparent 35%)
linear-gradient(180deg, #FFF6E8 0%, #FFF0D4 20%, #FEFADC 45%, #F5FCEC 70%, #E2F9D8 100%)
```

### Chapter 3+ (`.chapter-3`)
```
radial-gradient(ellipse at 70% 15%, rgba(255, 180, 60, 0.55) 0%, transparent 45%)
radial-gradient(ellipse at 10% 85%, rgba(200, 220, 100, 0.25) 0%, transparent 40%)
radial-gradient(ellipse at 90% 80%, rgba(255, 200, 120, 0.25) 0%, transparent 35%)
linear-gradient(180deg, #FFF3E0 0%, #FFECCC 20%, #FFF5D6 45%, #F8FAE4 70%, #E8F5CC 100%)
```

---

## Contrast Theme Overrides

### High Contrast (`body.theme-high-contrast`)

| Token | Value |
|-------|-------|
| `--bg-primary` | `#000000` |
| `--bg-secondary` | `#1a1a1a` |
| `--bg-overlay` | `rgba(0, 0, 0, 0.95)` |
| `--text-primary` | `#ffffff` |
| `--text-secondary` | `#e0e0e0` |
| `--color-red` | `#FF4444` |
| `--color-blue` | `#4444FF` |
| `--color-green` | `#44FF44` |
| `--color-yellow` | `#FFFF44` |
| `--color-purple` | `#FF44FF` |

Additional: `.big-button` gets `border: 4px solid white`

### Maximum Contrast (`body.theme-max-contrast`)

| Token | Value |
|-------|-------|
| `--bg-primary` | `#000000` |
| `--bg-secondary` | `#000000` |
| `--bg-overlay` | `#000000` |
| `--text-primary` | `#ffffff` |
| `--text-secondary` | `#ffffff` |
| `--accent-primary` | `#00FF00` |
| `--accent-secondary` | `#00FF00` |
| `--color-red` | `#FF0000` |
| `--color-blue` | `#0000FF` |
| `--color-green` | `#00FF00` |
| `--color-yellow` | `#FFFF00` |
| `--color-purple` | `#FF00FF` |

Additional:
- `.screen` background: `#000000`
- `.big-button`: border 5px solid white, background `#000000`, color `#ffffff`
- `.big-button.primary`: background `#00FF00`, color `#000000`
- `.settings-panel`: border 5px solid white
- `.hud-item`: background `#000000`, border 3px solid white

---

## Accessibility: Reduced Motion

When `prefers-reduced-motion: reduce`:
- All `animation-duration` set to `0.01ms`
- All `animation-iteration-count` set to `1`
- All `transition-duration` set to `0.01ms`

---

## System-Level High Contrast

When `prefers-contrast: high`:
- `--bg-primary: #000000`
- `--bg-secondary: #1a1a1a`
- `--text-primary: #ffffff`
- `--text-secondary: #cccccc`
- `.big-button` gets `border: 3px solid white`

---

## Hand Hover Interaction System

All interactive elements have class `.hoverable`. The hand hover system is the primary interaction method (designed for dementia patients who cannot click).

### Dwell Time
- **Duration:** 3000ms (3 seconds) to activate any button
- Configured in `UIManager.hoverState.hoverDuration`

### Visual Feedback Types

1. **General hover glow** (`.hoverable.hand-hovering`):
   - Transform: scale(1.05)
   - Box-shadow: `0 0 30px rgba(74, 222, 128, 0.6)`

2. **Border progress** (`.big-button.has-border-progress`):
   - CSS custom property `--progress` (0 to 1) drives a `conic-gradient` mask
   - 12px white border fills clockwise from top over 3 seconds
   - Glow intensifies during hover: `0 0 25px rgba(255,255,255,1), 0 0 50px rgba(255,255,255,0.6)`

3. **Ring progress** (settings button):
   - SVG circle stroke-dashoffset animated from 283 (empty) to 0 (full)
   - Green stroke (`#4ade80`)

4. **Bar progress** (settings close button):
   - Horizontal bar at bottom, width 0% to 100%
   - Green gradient fill

### Coordinate Mapping
- Canvas is mirrored: `screenX = canvas.width - pos.x`
- Scaled to viewport: `actualX = screenX * (window.innerWidth / canvas.width)`

---

## Animation Reference

| Name | Duration | Easing | Description |
|------|----------|--------|-------------|
| `fadeSlideUp` | 0.6s | ease-out | Content enters: translateY(30px)->0, opacity 0->1 |
| `wave` | 1s | ease-in-out | Hand demo rotation: -10deg to +10deg |
| `grow` | 2s | ease-in-out | Garden icon scale: 1.0 to 1.2 |
| `pulse` | 1.5s | ease-in-out | Opacity: 1 to 0.5 |
| `countdownPulse` | 1s | ease-in-out | Scale: 1.0 to 1.1 |
| `float` | 3s | ease-in-out | Chapter icon: translateY 0 to -10px |
| `celebrate` | 0.5s | ease-in-out | Chapter complete icon: scale+rotate alternating |
| `spin` | 1s | linear | Loading spinner: 360deg rotation |
| `sprout` | 1s | ease-in-out | Loading seedling: scale 1.0 to 1.2 |
| `particleDrift` | 10-20s | linear | Leaf drift: 80px right + 110vh down + 400deg rotation |

---

## State Machine Flow

```
WELCOME ──(Start Growing)──> PLAYER_SELECT
PLAYER_SELECT ──(1 Player)──> CALIBRATION ──(hands detected)──> CHALLENGE_INTRO ──(countdown)──> PLAYING
PLAYER_SELECT ──(2 Players)──> MODE_SELECT
MODE_SELECT ──(Community Garden | Village Fair)──> CALIBRATION ──> CALIBRATION_P2 ──> CHALLENGE_INTRO ──> PLAYING
PLAYING ──(timer expires)──> ROUND_END (1P/co-op) | ROUND_END_2P (competitive)
ROUND_END ──(Keep Growing)──> CHALLENGE_INTRO (next level)
ROUND_END ──(Try Again)──> CHALLENGE_INTRO (same level)
ROUND_END ──(Start Over)──> WELCOME
```

---

## Canvas Rendering (not CSS -- drawn in JS)

These elements live on the `<canvas>` and cannot be inspected via CSS. They are rendered in `js/garden/`:

- **Plant pots** -- terracotta trapezoids with soil
- **Growing plants** -- 4 growth stages per plant type (seed, sprout, growing, harvestable)
- **Draggable seeds** -- colored circles with plant icons
- **Watering can** -- blue container that follows hand
- **Fertilizer bag** -- brown bag item
- **Sun area** -- yellow glow zone
- **Plant needs** -- emoji bubbles above plants (💧 🌞 🌿)
- **Hand gloves** -- colored circles at fingertip positions (P1: #FF8C42, P2: #4A90D9)
- **Competitive divider** -- vertical dashed line at `handTracker.dividerX * canvas.width`
- **Magic pumpkin** -- co-op bonus element
- **Confetti particles** -- celebration effects
- **Growth pulse** -- 15% scale pulse on PlantPot stage advance
- **Hint arrows** -- directional guides for new players
- **Score popups** -- "+1" text that floats up and fades

For Figma, these canvas elements should be illustrated as separate component frames based on the constants in `js/garden/constants.js`.

---

*Generated from source code on 2026-04-02. Cross-reference with `index.html`, `css/styles.css`, and `js/ui.js` for any updates.*
