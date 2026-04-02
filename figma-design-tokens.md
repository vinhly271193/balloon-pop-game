# Garden Grow -- Figma Design Token Reference

> Extracted from the live codebase on 2 April 2026.
> Every value below is the **exact hex / rgba / px** value used in the shipped game.

---

## 1. Brand Colors (re:Action Health Technologies)

| Token | Hex | Usage |
|-------|-----|-------|
| Brand Magenta | `#E91E8C` | Primary brand color (logo) |
| Brand Purple | `#7B2D8E` | Secondary brand color (logo) |
| Brand White | `#FFFFFF` | Logo text / reversed mark |

The logo is loaded from `assets/images/logo.png`. These brand colors do not appear as CSS custom properties -- they exist only in the logo asset.

---

## 2. Game UI Colors (CSS Custom Properties)

### Core Palette (`:root`)

#### Backgrounds
| CSS Variable | Value | Notes |
|---|---|---|
| `--bg-primary` | `#1a2e1a` | Body / dark screen bg |
| `--bg-secondary` | `#213e21` | Cards, panels, settings |
| `--bg-overlay` | `rgba(0, 20, 0, 0.85)` | Screen overlays |

#### Text
| CSS Variable | Value | Notes |
|---|---|---|
| `--text-primary` | `#ffffff` | Headings, body text |
| `--text-secondary` | `#a8d5a8` | Labels, hints, muted text |

#### Accents
| CSS Variable | Value | Notes |
|---|---|---|
| `--accent-primary` | `#4ade80` | Primary green accent (buttons, scores, progress) |
| `--accent-secondary` | `#22c55e` | Gradient pair for accent-primary |

#### Plant Colors
| CSS Variable | Value | Plant |
|---|---|---|
| `--color-tomato` | `#FF6347` | Tomato |
| `--color-sunflower` | `#FFD700` | Sunflower |
| `--color-carrot` | `#FF8C00` | Carrot |
| `--color-lettuce` | `#90EE90` | Lettuce |
| `--color-blueberry` | `#4169E1` | Blueberry |

#### Legacy Aliases (map to same values)
| CSS Variable | Value |
|---|---|
| `--color-red` | `#FF6347` |
| `--color-blue` | `#4169E1` |
| `--color-green` | `#90EE90` |
| `--color-yellow` | `#FFD700` |
| `--color-purple` | `#9370DB` |
| `--color-orange` | `#FF8C00` |

#### Garden / Environment
| CSS Variable | Value | Notes |
|---|---|---|
| `--soil-brown` | `#8B4513` | Pot outline, soil |
| `--soil-dark` | `#654321` | Dark soil |
| `--sky-blue` | `#87CEEB` | Sky / garden background |
| `--sunlight-warm` | `#FFE4B5` | Warm light accents |
| `--terracotta` | `#E07A5F` | Pot body gradient |

#### Player Colors
| CSS Variable | Value | Player |
|---|---|---|
| `--color-player1` | `#FF8C42` | Player 1 (orange) |
| `--color-player1-light` | `#FFF5E6` | Player 1 light bg |
| `--color-player2` | `#4A90D9` | Player 2 (blue) |
| `--color-player2-light` | `#E6F0FF` | Player 2 light bg |

### Light Screen Gradients (Welcome, Player Select, Mode Select)

**Chapter 1 (default):**
```
linear-gradient(180deg, #FFF8F0 0%, #FFF5E6 20%, #FEFCE8 45%, #F0FDF4 70%, #DCFCE7 100%)
```
With radial overlays: `rgba(255, 220, 120, 0.5)`, `rgba(144, 238, 144, 0.25)`, `rgba(144, 238, 144, 0.2)`

**Chapter 2 (warmer):**
```
linear-gradient(180deg, #FFF6E8 0%, #FFF0D4 20%, #FEFADC 45%, #F5FCEC 70%, #E2F9D8 100%)
```

**Chapter 3 (warmest):**
```
linear-gradient(180deg, #FFF3E0 0%, #FFECCC 20%, #FFF5D6 45%, #F8FAE4 70%, #E8F5CC 100%)
```

### Light Screen Text Overrides
| Element | Color | Notes |
|---|---|---|
| `.light-screen .welcome-message` | `#16a34a` | Green on light bg |
| `.light-screen .instruction-text` | `#4b5563` | Gray-700 |
| `.light-screen .camera-hint` | `#9ca3af` | Gray-400 |
| `.light-screen .player-select-title` | `#15803d` | Dark green |
| `.light-screen .big-button` | `linear-gradient(135deg, #22c55e, #16a34a)` | Button gradient on light bg |

### HUD Colors (In-Game)
| Element | Color | Notes |
|---|---|---|
| HUD item background | `rgba(0, 0, 0, 0.7)` | Semi-transparent black |
| Timer value | `var(--color-yellow)` = `#FFD700` | Yellow timer |
| Timer warning (<10s) | `#FF3B30` | iOS red |
| Score value | `var(--accent-primary)` = `#4ade80` | Green score |
| Progress bar fill | `linear-gradient(90deg, #4ade80, #22c55e)` | Green gradient |
| Progress bar track | `rgba(0, 0, 0, 0.7)` | Dark track |

### 2-Player HUD
| Element | Color |
|---|---|
| P1 label + value | `#FF8C42` |
| P2 label + value | `#4A90D9` |
| P1 progress bar track | `rgba(255, 140, 66, 0.2)` |
| P1 progress fill | `linear-gradient(90deg, #FF8C42, #FFB066)` |
| P2 progress bar track | `rgba(74, 144, 217, 0.2)` |
| P2 progress fill | `linear-gradient(90deg, #4A90D9, #6AB0F0)` |

### Ribbon Cards (2P Round End)
| Element | Color |
|---|---|
| P1 border | `#FF8C42` |
| P1 shadow | `rgba(255, 140, 66, 0.3)` |
| P2 border | `#4A90D9` |
| P2 shadow | `rgba(74, 144, 217, 0.3)` |
| Ribbon title color | `var(--color-sunflower)` = `#FFD700` |

### Round End
| Element | Color | Condition |
|---|---|---|
| Result title (success) | `#4ade80` | Challenge complete |
| Result title (try again) | `#FFCC00` | Challenge incomplete |

### Contrast Themes

**High Contrast (`theme-high-contrast`):**
| Variable | Override |
|---|---|
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

**Maximum Contrast (`theme-max-contrast`):**
| Variable | Override |
|---|---|
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

---

## 3. Canvas Colors (from JS)

### Glove Rendering (`handTracking.js`)

**Solo Mode (1P):**
| Property | Value | Notes |
|---|---|---|
| Main | `#F0FFF0` | Honeydew white |
| Shadow | `#C8E6C8` | Light green shadow |
| Outline | `#2E8B57` | Sea green |
| Highlight | `#FFFFFF` | Pure white |

**Player 1 (2P mode):**
| Property | Value | Notes |
|---|---|---|
| Main | `#FFF5E6` | Warm cream |
| Shadow | `#F0D9B5` | Warm tan |
| Outline | `#FF8C42` | Orange |
| Highlight | `#FFFFFF` | Pure white |

**Player 2 (2P mode):**
| Property | Value | Notes |
|---|---|---|
| Main | `#E6F0FF` | Cool light blue |
| Shadow | `#B5C9E6` | Cool gray-blue |
| Outline | `#4A90D9` | Blue |
| Highlight | `#FFFFFF` | Pure white |

### Plant Types (`constants.js`)

| Plant | Seed Color | Plant Color | Stem Color |
|---|---|---|---|
| Tomato | `#8B0000` | `#FF6347` | `#228B22` |
| Sunflower | `#8B4513` | `#FFD700` | `#228B22` |
| Carrot | `#D2691E` | `#FF8C00` | `#228B22` |
| Lettuce | `#556B2F` | `#90EE90` | `#228B22` |
| Blueberry | `#483D8B` | `#4169E1` | `#228B22` |

All stems share `#228B22` (Forest Green).

### Plant Rendering (`plant-pot.js`)

**Pot body:**
| Element | Color(s) | Notes |
|---|---|---|
| Pot gradient left | `#C4A484` | Tan edge |
| Pot gradient center | `#E07A5F` | Terracotta body |
| Pot gradient right | `#B8860B` | Dark goldenrod edge |
| Pot outline | `#8B4513` | Saddle brown |
| Pot rim | `#D2691E` | Chocolate |
| Soil ellipse | `#5D4037` | Dark brown |

**Water effects:**
| Element | Color |
|---|---|
| Water fill inside pot | `rgba(100, 180, 255, 0.35)` |
| Overflow particles | `rgba(100, 180, 255, <alpha>)` |
| Water progress ring track | `rgba(100, 180, 255, 0.15)` |
| Water progress ring fill | `rgba(100, 180, 255, 0.85)` |
| Water progress ring glow | `rgba(100, 180, 255, 0.6)` |

**Growth ring:**
| State | Color |
|---|---|
| Completed stage | `rgba(74, 222, 128, 0.8)` |
| Current stage (track) | `rgba(74, 222, 128, 0.3)` |
| Future stage | `rgba(255, 255, 255, 0.15)` |

**Harvestable glow:** `rgba(255, 255, 100, 0.2)`

**Leaf gradient:** `#228B22` to `#90EE90`

**Sprout color:** `#90EE90`

**Sunflower center:** `#8B4513`

### Tools (`tools.js`)

**Seed Packet:**
| Element | Color |
|---|---|
| Packet background | `#F5DEB3` (Wheat) |
| Packet stroke | `#8B4513` |
| Packet label text | `#5D4037` |
| Held glow | `rgba(255, 255, 200, 0.4)` |

**Watering Can (Normal):**
| Element | Color |
|---|---|
| Can body | `#4A90D9` |
| Can stroke | `#2E5A87` |
| Held glow | `rgba(100, 200, 255, 0.3)` |
| Dwell progress ring | `rgba(100, 200, 255, 0.7)` |
| Pour particles | `rgba(100, 180, 255, <alpha>)` |

**Watering Can (Golden / Rubber-band):**
| Element | Color |
|---|---|
| Can body | `#FFD700` |
| Can stroke | `#DAA520` |
| Held glow | `rgba(255, 215, 0, 0.5)` |
| Sparkle particles | `rgba(255, 255, 200, 0.8)` |

**Fertilizer Bag:**
| Element | Color |
|---|---|
| Bag body | `#8B4513` |
| Bag stroke | `#5D4037` |
| Bag label text | `#fff` |
| Held glow | `rgba(144, 238, 144, 0.3)` |

### Plant Needs Bars (`plant-needs.js`)

| Element | Color | Condition |
|---|---|---|
| Bar fill (healthy) | `#4ade80` | Level > 0.6 |
| Bar fill (warning) | `#fbbf24` | Level 0.3--0.6 |
| Bar fill (critical) | `#ef4444` | Level < 0.3 |
| Bar background | `rgba(255, 255, 255, 0.2)` | Normal |
| Bar background (critical pulse) | `rgba(239, 68, 68, 0.2-0.35)` | Level < 0.3 |
| Bar border | `rgba(255, 255, 255, 0.5)` | All states |
| Panel background | `rgba(0, 0, 0, 0.6)` | |
| Labels / text | `#fff` | |

### Sun Area (`plant-needs.js`)

| Element | Color |
|---|---|
| Glow center | `rgba(255, 220, 100, 0.8)` |
| Glow mid | `rgba(255, 200, 50, 0.4)` |
| Glow edge | `rgba(255, 180, 0, 0)` |

### Effects (`effects.js`)

**Magic Pumpkin (Co-op):**
| Element | Color |
|---|---|
| Glow center | `rgba(255, 165, 0, 0.6)` |
| Glow mid | `rgba(138, 43, 226, 0.4)` |
| Glow edge | `rgba(255, 20, 147, 0)` |
| Pumpkin body center | `#FF8C00` |
| Pumpkin body edge | `#FF4500` |
| Pumpkin ridges | `#D2691E` |
| Pumpkin stem | `#228B22` |
| Sparkle dots | `rgba(255, 215, 0, 0.8)` |
| Instruction text | `#fff` on `#000` stroke |

**Hint Arrow System:**
| Hint Type | Arrow Color |
|---|---|
| Seed to pot | `#F5DEB3` (Wheat) |
| Water to pot | `#87CEEB` (Light blue) |
| Sun to pot | `#FFD700` (Gold) |
| Food to pot | `#90EE90` (Light green) |
| Harvest ring | `#FFDAB9` (Peach puff) |
| Tooltip bg | `rgba(0, 0, 0, 0.7)` |
| Tooltip text | `#FFFFFF` |
| Tooltip shadow | `rgba(0, 0, 0, 0.3)` |

**Confetti Particles:**
| Index | Color |
|---|---|
| 0 | `#FF6B6B` |
| 1 | `#4ECDC4` |
| 2 | `#45B7D1` |
| 3 | `#FFA07A` |
| 4 | `#98D8C8` |
| 5 | `#F7DC6F` |
| 6 | `#BB8FCE` |
| 7 | `#85C1E2` |

### Divider & Score Labels (`garden-bed.js`)

| Element | Color |
|---|---|
| Divider line | `rgba(255, 255, 255, 0.3)` |
| Divider glow | `rgba(255, 255, 255, 0.5)` |
| P1 label (canvas) | `#FF8C42` |
| P2 label (canvas) | `#4A90E2` |
| Instructions text | `rgba(255, 255, 255, 0.8)` |

### Return-to-Home Beacon (`garden-bed.js`)

| Element | Color |
|---|---|
| Pulsing ring stroke | `rgba(255, 255, 200, 0.2-0.5)` |
| Inner glow center | `rgba(255, 255, 200, 0.15-0.25)` |
| Inner glow edge | `rgba(255, 255, 200, 0)` |

### UI Particles (`ui.js`)

Floating particles on light screens:
| Index | Color |
|---|---|
| 0 | `rgba(74, 222, 128, 0.3)` -- green leaf |
| 1 | `rgba(255, 200, 120, 0.25)` -- warm petal |
| 2 | `rgba(255, 182, 193, 0.25)` -- pink blossom |
| 3 | `rgba(144, 238, 144, 0.3)` -- light green |
| 4 | `rgba(255, 223, 186, 0.2)` -- peach |

CSS pseudo-element particles:
| Element | Color |
|---|---|
| `::before` leaf | `rgba(74, 222, 128, 0.35)` |
| `::after` leaf | `rgba(255, 200, 120, 0.3)` |

### Audio Module (`audio.js`)

No visual colors. Audio is purely synthesized via Web Audio API with no visual indicators of its own.

---

## 4. Typography Scale

### Desktop (default)
| Token | Value |
|---|---|
| `--text-huge` | `72px` |
| `--text-large` | `48px` |
| `--text-medium` | `32px` |
| `--text-normal` | `24px` |
| `--text-small` | `18px` |

### Tablet (`max-width: 768px`)
| Token | Value |
|---|---|
| `--text-huge` | `48px` |
| `--text-large` | `36px` |
| `--text-medium` | `24px` |
| `--text-normal` | `18px` |
| `--text-small` | `14px` |

### Mobile (`max-width: 480px`)
| Token | Value |
|---|---|
| `--text-huge` | `36px` |
| `--text-large` | `28px` |
| `--text-medium` | `20px` |

(Normal and small remain at tablet values.)

### Other Fixed Font Sizes (Canvas)
| Context | Size |
|---|---|
| Countdown number | `120px` (CSS) / `80px` (tablet) |
| Hand demo emoji | `100px` (CSS) / `60px` (tablet) |
| Canvas instructions | `18px Arial` |
| Canvas score labels | `bold 24px Arial` |
| Need bar labels | `bold 12px Arial` |
| Need bar title | `bold 16px Arial` |
| Seed packet label | `bold 10px Arial` |
| Sun icon | `100px Arial` |
| Plant icon on seed packet | `30px Arial` |
| Hint tooltip | `bold 20px Arial` |
| Pumpkin instruction | `bold 16px Arial` |
| Growth ring icons | `12px Arial` |

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
```
Canvas text uses `Arial` exclusively.

---

## 5. Spacing Scale

### Desktop (default)
| Token | Value |
|---|---|
| `--spacing-large` | `40px` |
| `--spacing-medium` | `24px` |
| `--spacing-small` | `12px` |

### Tablet (`max-width: 768px`)
| Token | Value |
|---|---|
| `--spacing-large` | `24px` |
| `--spacing-medium` | `16px` |
| `--spacing-small` | `8px` |

### Fixed Spacing Values (CSS)
| Context | Value |
|---|---|
| Chapter header letter-spacing | `3px` |
| HUD label letter-spacing | `1px` |
| Settings section border-bottom | `2px solid rgba(255, 255, 255, 0.1)` |
| Volume control gap | `8px` |
| Background options gap | `8px` |
| Contrast options gap | `6px` |

---

## 6. Border Radius Values

| Context | Radius | Notes |
|---|---|---|
| Big button | `20px` | Primary action buttons |
| Ribbon card | `24px` | 2P round-end cards |
| Settings panel | `24px` | Settings overlay |
| Hand indicator | `20px` | Calibration screen |
| Calibration player card | `20px` | P2 calibration |
| HUD item | `16px` | Timer, score badges |
| Chapter header | `16px` | Chapter intro banner |
| Chapter complete banner | `16px` | Round-end chapter block |
| Color target / plant indicator | `16px` | Challenge intro targets |
| Settings close button | `12px` | Close button |
| Progress bar | `10px` | HUD progress bar |
| Progress text | `10px` | HUD progress text badge |
| Seed packet | `8px` | `ctx.roundRect(..., 8)` |
| Fertilizer bag | `8px` | `ctx.roundRect(..., 8)` |
| Contrast button | `8px` | Settings option btn |
| Toggle button | `8px` | Sound toggle |
| Background button | `8px` | Background selector |
| Volume bar | `8px` | Volume slider track |
| Calibration progress bar | `3px` | Thin progress bar |
| Plant needs bar (canvas) | `5px` | `ctx.roundRect(..., 5)` |
| Plant needs panel (canvas) | `15px` | `ctx.roundRect(..., 15)` |
| Settings button | `50%` (circle) | Gear icon |
| Volume handle | `50%` (circle) | Slider thumb |
| Color circle | `50%` (circle) | Challenge color dots |
| Close X button | `50%` (circle) | Settings close X |
| Loading spinner | `50%` (circle) | |
| Border progress track | `32px` | Around big buttons |
| Border progress fill | `32px` | Animated progress ring |

---

## 7. Shadows / Effects

### Box Shadows (CSS)
| Context | Value |
|---|---|
| Big button (primary) | `0 8px 30px rgba(74, 222, 128, 0.4)` |
| Light-screen big button | `0 6px 24px rgba(34, 197, 94, 0.35)` |
| Settings close button | `0 4px 15px rgba(74, 222, 128, 0.3)` |
| Color circle | `0 4px 15px rgba(0, 0, 0, 0.3)` |
| Volume handle | `0 2px 8px rgba(0, 0, 0, 0.3)` |
| Hand hovering glow | `0 0 30px rgba(74, 222, 128, 0.6)` |
| Hover progress fill glow | `0 0 10px var(--accent-primary)` |
| Border progress fill | `0 0 15px rgba(255, 255, 255, 0.8), 0 0 30px rgba(255, 255, 255, 0.5)` |
| Border progress fill (hovering) | `0 0 25px rgba(255, 255, 255, 1), 0 0 50px rgba(255, 255, 255, 0.6)` |
| Light-screen border progress | `0 0 12px rgba(22, 163, 74, 0.6), 0 0 24px rgba(22, 163, 74, 0.3)` |
| P1 ribbon card | `0 4px 20px rgba(255, 140, 66, 0.3)` |
| P2 ribbon card | `0 4px 20px rgba(74, 144, 217, 0.3)` |

### Drop Shadows (CSS)
| Context | Value |
|---|---|
| Company logo (dark bg) | `drop-shadow(0 4px 20px rgba(255, 255, 255, 0.2))` |
| Company logo (light bg) | `drop-shadow(0 4px 15px rgba(0, 0, 0, 0.1))` |

### Canvas Shadows (JS `ctx.shadow*`)
| Context | Color | Blur |
|---|---|---|
| Palm shadow | `rgba(0, 0, 0, 0.15)` | 12px, offset Y: 4 |
| Finger shadow | `rgba(0, 0, 0, 0.1)` | 6px, offset Y: 2 |
| Divider glow | `rgba(255, 255, 255, 0.5)` | 15px |
| Water progress ring | `rgba(100, 180, 255, 0.6)` | 12px |
| Hint arrow glow | Same as arrow color | 15px |
| Hint harvest ring | Same as ring color | 20px |
| Hint tooltip shadow | `rgba(0, 0, 0, 0.3)` | 12px, offset Y: 3 |

---

## 8. Animation Tokens

### CSS Transitions
| Token | Value |
|---|---|
| `--transition-fast` | `0.2s ease` |
| `--transition-medium` | `0.4s ease` |

### CSS Animation Durations
| Animation | Duration | Easing | Notes |
|---|---|---|---|
| `wave` | `1s` | `ease-in-out` | Hand wave on welcome |
| `grow` | `2s` | `ease-in-out` | Garden icon pulsing |
| `pulse` | `1.5s` | `ease-in-out` | Opacity pulse (calibration) |
| `countdownPulse` | `1s` | `ease-in-out` | Countdown number |
| `float` | `3s` | `ease-in-out` | Chapter icon float |
| `celebrate` | `0.5s` | `ease-in-out` | Chapter complete icon |
| `spin` | `1s` | `linear` | Loading spinner |
| `sprout` | `1s` | `ease-in-out` | Spinner sprout pulse |
| `fadeSlideUp` | `0.6s` | `ease-out` | Light screen entrance |
| `particleDrift` | `10-20s` | `linear` | Floating leaf particles |
| Timer warning flash | `0.5s` | `ease-in-out` | Low-time pulse (inline CSS) |
| Parallax shift | `0.3s` | `ease-out` | Hand-tracked particle offset |
| Nature bg fade | `0.5s` | `ease` | Background theme switch |

### Canvas Animation Constants (JS)
| Animation | Rate | Notes |
|---|---|---|
| Growth pulse decay | `2.5 / sec` | `growthPulse` decays from 1 to 0 |
| Growth pulse scale | `+15%` max | `1 + growthPulse * 0.15` |
| Watering can tilt speed | `4 / sec` | Lerp toward -0.85 rad |
| Sun area pulse | `3 rad/sec` | `pulsePhase += dt * 3` |
| Pumpkin pulse | `2 rad/sec` | `pulsePhase += dt * 2` |
| Hint arrow pulse | `2.5 rad/sec` | `pulsePhase += dt * 2.5` |
| Hint dash scroll | `40 px/sec` | `dashOffset -= dt * 40` |
| Hint fade-in | `1.0s` | Linear fade |
| Hint fade-out | `0.5s` | Linear fade |
| Confetti lifetime | `3s` | Gravity + alpha decay |
| Need bar pulse | `4 rad/sec` | Critical need indicator |
| Return beacon pulse | accumulates via `dt` | Sine-wave 0--1 |

---

## 9. Conflict Resolution

### Conflict 1: Player 2 Blue

| Location | Value | File |
|---|---|---|
| CSS `--color-player2` | `#4A90D9` | `css/styles.css` line 2073 |
| CSS HUD labels `.hud-label-p2`, `.hud-value-p2` | `#4A90D9` | `css/styles.css` lines 1963, 1971 |
| CSS P2 progress fill gradient start | `#4A90D9` | `css/styles.css` line 1995 |
| CSS ribbon border `.ribbon-p2` | `#4A90D9` | `css/styles.css` line 2037 |
| JS glove outline (2P, player 2) | `#4A90D9` | `js/handTracking.js` line 293 |
| JS watering can body color | `#4A90D9` | `js/garden/tools.js` line 287 |
| **JS canvas P2 label (divider)** | **`#4A90E2`** | `js/garden/garden-bed.js` line 1175 |

**Resolution:** The canonical value is **`#4A90D9`**, used in 6 out of 7 locations including the CSS custom property. The `#4A90E2` in `garden-bed.js` line 1175 is a typo and should be corrected to `#4A90D9` for consistency.

---

### Conflict 2: Solo Glove Outline Color

| Location | Value | File |
|---|---|---|
| JS `this.gloveColor.outline` (constructor) | `#2E8B57` (Sea Green) | `js/handTracking.js` line 38 |
| Confetti palette includes | `#4ECDC4` (Teal) | `js/garden/effects.js` line 461 |

**What actually renders in the game:** In solo (1P) mode, `this.gloveColor` is used directly (line 288), and its `outline` property is `#2E8B57`. The teal `#4ECDC4` appears only in the confetti particle color palette -- it is never used for the glove.

**Resolution:** The solo glove outline is definitively **`#2E8B57`** (Sea Green). `#4ECDC4` is a confetti particle color, not a glove color. No conflict exists in practice.

---

### Conflict 3: Purple

| Location | Value | File |
|---|---|---|
| CSS `--color-purple` | `#9370DB` (Medium Purple) | `css/styles.css` line 20 |
| Pumpkin glow gradient mid | `rgba(138, 43, 226, 0.4)` = `#8A2BE2` (Blue Violet) | `js/garden/effects.js` line 93 |

**Resolution:** These are used in completely different contexts. The CSS `#9370DB` is the "purple" plant/legacy color token. The `#8A2BE2` is a magical glow effect specific to the pumpkin. Both are canonical in their own context. For Figma, keep them as separate tokens:
- **Purple (UI):** `#9370DB`
- **Magic Violet (Effect):** `#8A2BE2`

---

### Conflict 4: Green Variants

| Value | Context | File |
|---|---|---|
| `#4ade80` | `--accent-primary`, score display, growth ring, need bars (healthy) | CSS + canvas |
| `#22c55e` | `--accent-secondary`, gradient pair, spinner border | CSS |
| `#16a34a` | Light-screen button gradient end, welcome message on light bg | CSS |
| `#15803d` | Light-screen select titles | CSS |
| `#27AE60` | Not found in codebase | -- |
| `#228B22` | Plant stems, pumpkin stem, leaf gradient start | Canvas JS |
| `#2E8B57` | Solo glove outline | Canvas JS |
| `#90EE90` | `--color-lettuce`, sprout color, leaf highlight, light-screen particles | CSS + Canvas JS |

**Resolution:** These are not conflicts -- they form a deliberate green scale:

| Name | Hex | Role |
|---|---|---|
| Green-50 (lightest) | `#90EE90` | Lettuce / sprout / leaf highlights |
| Green-400 | `#4ade80` | Primary accent (semantic: success, score, healthy) |
| Green-500 | `#22c55e` | Secondary accent (gradient pair) |
| Green-600 | `#16a34a` | Light-bg button end / welcome text |
| Green-700 | `#15803d` | Light-bg titles |
| Forest Green | `#228B22` | Plant stems (canvas) |
| Sea Green | `#2E8B57` | Solo glove outline (canvas) |

`#27AE60` does not appear anywhere in the codebase. Omit from the Figma library.

---

## 10. Figma Variable Collections Plan

### Collection 1: `Primitives`
Raw color values. No semantic meaning, just named swatches.

```
primitives/
  green/
    50:     #90EE90
    400:    #4ade80
    500:    #22c55e
    600:    #16a34a
    700:    #15803d
    forest: #228B22
    sea:    #2E8B57
    olive:  #556B2F

  orange/
    400:    #FF8C42
    500:    #FF8C00
    light:  #FFF5E6
    dark:   #FF4500

  blue/
    400:    #4A90D9
    royal:  #4169E1
    sky:    #87CEEB
    light:  #E6F0FF
    water:  rgba(100, 180, 255, 1) = #64B4FF
    steel:  #2E5A87
    bright: #45B7D1
    soft:   #85C1E2
    gradient-end: #6AB0F0

  red/
    tomato: #FF6347
    ios:    #FF3B30
    error:  #ef4444
    coral:  #FF6B6B
    salmon: #FFA07A

  yellow/
    gold:      #FFD700
    amber:     #fbbf24
    result:    #FFCC00
    goldenrod: #DAA520
    sun-warm:  rgba(255, 220, 100, 1) = #FFDC64

  brown/
    saddle:     #8B4513
    dark:       #654321
    chocolate:  #D2691E
    deep:       #5D4037
    tan:        #C4A484
    dark-gold:  #B8860B
    wheat:      #F5DEB3

  purple/
    medium:  #9370DB
    violet:  #8A2BE2
    orchid:  #BB8FCE

  pink/
    hot:     #FF20147 (pumpkin glow edge)
    peach:   #FFDAB9

  teal/
    400:     #4ECDC4
    muted:   #98D8C8

  neutral/
    white:    #FFFFFF
    black:    #000000
    cream-1:  #FFF8F0
    cream-2:  #FFF5E6
    cream-3:  #FEFCE8
    mint-1:   #F0FDF4
    mint-2:   #DCFCE7
    honeydew: #F0FFF0
    gray-400: #9ca3af
    gray-500: #6b7280
    gray-600: #4b5563

  terracotta/
    main:  #E07A5F
    warm:  #FFE4B5
```

### Collection 2: `Semantic`
Mapped to primitives by function.

```
semantic/
  background/
    primary:      {primitives.green.700-ish} = #1a2e1a (custom dark)
    secondary:    #213e21
    overlay:      rgba(0, 20, 0, 0.85)
    hud-item:     rgba(0, 0, 0, 0.7)

  text/
    primary:      {primitives.neutral.white}
    secondary:    #a8d5a8
    on-light:     {primitives.neutral.gray-600}
    hint:         {primitives.neutral.gray-400}

  accent/
    primary:      {primitives.green.400}
    secondary:    {primitives.green.500}

  success:        {primitives.green.400}
  warning:        {primitives.yellow.amber}
  error:          {primitives.red.error}
  timer:          {primitives.yellow.gold}
  timer-warning:  {primitives.red.ios}
```

### Collection 3: `Player`
Player-specific colors. Supports mode switching.

```
player/
  solo/
    glove-main:      #F0FFF0
    glove-shadow:    #C8E6C8
    glove-outline:   #2E8B57
    glove-highlight: #FFFFFF

  p1/
    primary:         #FF8C42
    light:           #FFF5E6
    glove-main:      #FFF5E6
    glove-shadow:    #F0D9B5
    glove-outline:   #FF8C42
    progress-track:  rgba(255, 140, 66, 0.2)
    progress-fill:   #FF8C42 to #FFB066

  p2/
    primary:         #4A90D9
    light:           #E6F0FF
    glove-main:      #E6F0FF
    glove-shadow:    #B5C9E6
    glove-outline:   #4A90D9
    progress-track:  rgba(74, 144, 217, 0.2)
    progress-fill:   #4A90D9 to #6AB0F0
```

### Collection 4: `Plant`
Per-plant-type color sets.

```
plant/
  tomato/
    seed:   #8B0000
    fruit:  #FF6347
    stem:   #228B22

  sunflower/
    seed:   #8B4513
    flower: #FFD700
    stem:   #228B22
    center: #8B4513

  carrot/
    seed:   #D2691E
    fruit:  #FF8C00
    stem:   #228B22

  lettuce/
    seed:   #556B2F
    leaf:   #90EE90
    stem:   #228B22

  blueberry/
    seed:   #483D8B
    fruit:  #4169E1
    stem:   #228B22

  shared/
    stem:     #228B22
    sprout:   #90EE90
    leaf-dark:  #228B22
    leaf-light: #90EE90
```

### Collection 5: `Spacing & Radius`
Responsive spacing with mode switching (Desktop / Tablet / Mobile).

```
spacing/
  large:   40px / 24px / 24px
  medium:  24px / 16px / 16px
  small:   12px /  8px /  8px

radius/
  xs:      3px   (calibration progress)
  sm:      5px   (canvas need bars)
  md:      8px   (seed packet, contrast buttons)
  lg:      10px  (progress bar)
  xl:      16px  (HUD items, chapter banners)
  2xl:     20px  (big buttons, hand indicators)
  3xl:     24px  (ribbon cards, settings panel)
  4xl:     32px  (border progress ring)
  pill:    50%   (circles: settings btn, volume handle)
  canvas:  15px  (need panel canvas)
```

### Figma Setup Notes

1. **Use Figma Variables (not Styles)** -- variables support mode switching (Light/Dark, Desktop/Tablet/Mobile) which maps perfectly to the contrast themes and responsive breakpoints.

2. **Create three modes in Semantic collection:** Normal, High Contrast, Max Contrast. Override the mapped values per mode.

3. **Create three modes in Spacing & Radius:** Desktop, Tablet, Mobile.

4. **Canvas colors are not CSS-driven** -- they are hardcoded in JS and will need to be documented as a "Canvas" sub-collection within Primitives. These cannot be themed via CSS variables today but should be captured for spec accuracy.

5. **Gradient tokens** -- Figma does not support gradient variables natively. Document gradients (light-screen backgrounds, button fills, progress bars) as Figma Color Styles instead.

6. **The P2 blue typo (`#4A90E2` in garden-bed.js)** should be fixed in code to `#4A90D9` before building the Figma library, so there is a single source of truth.
