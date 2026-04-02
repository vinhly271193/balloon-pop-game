# Garden Grow - Welcome Screen Visual Summary

**Game:** Garden Grow by re-Action Health Technologies
**Live URL:** https://vinhly271193.github.io/balloon-pop-game/
**Generated from:** Source code analysis of index.html, css/styles.css, js/ui.js

---

## Overall Layout

The welcome screen is a full-viewport overlay (`100% width x 100% height`) centered with flexbox. Content is vertically stacked in a centered column with a max width of 800px. The screen uses the CSS class `light-screen`, giving it a warm, nature-inspired appearance distinct from the darker in-game screens.

A **nature background layer** sits behind everything (default theme: "Sky" - soft blue with white cloud-like radial gradients). On top of that, the welcome screen renders its own layered gradient background.

---

## Background & Color Palette

### Welcome Screen Background (light-screen)
A multi-layered gradient creating a warm, sunlit garden feel:
- **Warm sunlight glow:** Radial gradient of soft gold (`rgba(255, 220, 120, 0.5)`) positioned at upper-right (70% across, 15% down)
- **Green foliage accents:** Two radial gradients of light green (`rgba(144, 238, 144)`) in the lower-left and lower-right corners
- **Main gradient (top to bottom):**
  - `#FFF8F0` (warm white/cream) at top
  - `#FFF5E6` (light peach) at 20%
  - `#FEFCE8` (pale yellow) at 45%
  - `#F0FDF4` (very light green) at 70%
  - `#DCFCE7` (soft mint green) at bottom

The overall effect is a cream-to-green gradient with a sun glow in the upper right, evoking a bright garden morning.

### Key Color Variables
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#1a2e1a` | Dark forest green (body background, behind overlays) |
| `--accent-primary` | `#4ade80` | Bright green (buttons, accents) |
| `--accent-secondary` | `#22c55e` | Deeper green (button gradients) |
| `--text-primary` | `#ffffff` | White text |
| `--text-secondary` | `#a8d5a8` | Muted sage green text |

---

## Content Elements (Top to Bottom)

### 1. Company Logo
- **File:** `assets/images/logo.png` (re-Action Health Technologies logo)
- **Size:** Max width 400px (80% of container on smaller screens, 280px on mobile)
- **Styling:** Subtle drop shadow (`0 4px 15px rgba(0, 0, 0, 0.1)` on light screens)
- **Spacing:** `40px` margin below

### 2. Game Title: "Garden Grow!"
- **Font size:** 72px (`--text-huge`)
- **Font weight:** 800 (extra bold)
- **Color:** Rainbow gradient text using `background-clip: text`
  - Gradient direction: 135 degrees (diagonal)
  - Colors: Tomato Red (`#FF6347`) -> Sunflower Gold (`#FFD700`) -> Lettuce Green (`#90EE90`) -> Blueberry Blue (`#4169E1`)
- **Spacing:** `24px` margin below

### 3. Instruction Text: "Use your hands to help plants grow"
- **Font size:** 32px (`--text-medium`)
- **Color:** `#4b5563` (medium gray, overridden on light screens from white)
- **Line height:** 1.4
- **Spacing:** `40px` margin below

### 4. Animated Seedling Icon
- **Content:** Seedling emoji at 100px font size
- **Animation:** "grow" - scales from 1.0 to 1.2 and back over 2 seconds, repeating infinitely (gentle breathing/pulsing effect)
- **Spacing:** `40px` margin below

### 5. Welcome Message (dynamic)
- **Content:** Empty by default, populated dynamically for returning players
- **Font size:** 24px (`--text-normal`)
- **Color:** `#16a34a` (green, on light screens)
- **Min height:** 30px (reserved space even when empty)
- **Spacing:** `24px` margin below

### 6. "Start Growing" Button
- **Type:** Primary big button with hand-hover dwell activation
- **Size:** Min width 280px, padding 24px vertically / 40px horizontally
- **Font:** 32px, weight 700
- **Background:** Green gradient (`#22c55e` -> `#16a34a`, 135 degrees)
- **Text color:** White
- **Border radius:** 20px
- **Shadow:** `0 6px 24px rgba(34, 197, 94, 0.35)` (green glow)
- **Hover effect:** Scales to 1.05x
- **Active effect:** Scales to 0.98x
- **Hand-hover system:**
  - 9px border progress track (subtle outline, `rgba(0, 0, 0, 0.12)` on light screens)
  - 12px animated border fill that sweeps 360 degrees as a conic-gradient mask
  - Border fill color: `#16a34a` with green glow shadow
  - Activation time: 3 seconds of sustained hand hover
  - When hovering: button scales to 1.05x with green glow (`0 0 30px rgba(74, 222, 128, 0.6)`)

### 7. Camera Hint: "Camera access required"
- **Font size:** 18px (`--text-small`)
- **Color:** `#9ca3af` (light gray, on light screens)
- **Spacing:** `24px` margin above

---

## Decorative Elements

### Floating Particles (Leaves & Petals)
The welcome screen has a full-screen particle container behind the content. Particles are leaf/petal-shaped elements that drift downward:

- **8 particles** spawned programmatically on screen load
- **Shapes:** Leaf-like (`border-radius: 50% 0 50% 0`), roughly 10-24px wide, 70% height ratio
- **Colors (semi-transparent):**
  - Green leaf: `rgba(74, 222, 128, 0.3)`
  - Warm petal: `rgba(255, 200, 120, 0.25)`
  - Pink blossom: `rgba(255, 182, 193, 0.25)`
  - Light green: `rgba(144, 238, 144, 0.3)`
  - Peach: `rgba(255, 223, 186, 0.2)`
- **Animation:** "particleDrift" - particles fade in, drift downward with rotation (~80px horizontal, full viewport vertical), taking 10-20 seconds per cycle
- **Parallax:** Particles shift subtly (up to 15px) in response to hand position when tracked
- **Two CSS pseudo-element particles** also exist (green and warm colored) with their own drift timings

### Garden Preview Strip
- A `<canvas>` element positioned at the absolute bottom of the welcome screen
- **Height:** 20% of viewport height (`20vh`)
- **Width:** Full screen width
- **Purpose:** Renders a preview of the garden scene (drawn via JavaScript on the canvas)
- **Z-index:** 0 (behind content)
- **Non-interactive:** `pointer-events: none`

### Entrance Animation
When the welcome screen becomes active, the content area fades in and slides up:
- **Animation:** "fadeSlideUp" - 0.6 seconds ease-out
- **From:** opacity 0, translateY(30px)
- **To:** opacity 1, translateY(0)

---

## Persistent UI Elements

### Settings Gear Button
- **Position:** Fixed, top-right corner (20px from top and right edges)
- **Size:** 60px diameter circle
- **Background:** `rgba(0, 0, 0, 0.7)` (semi-transparent dark)
- **Border:** 3px solid `rgba(255, 255, 255, 0.3)`
- **Icon:** White SVG gear icon (32x32)
- **Z-index:** 50 (above most content)
- **Hover:** Scales to 1.1x, darkens background
- **Hand-hover:** Circular SVG progress ring (green stroke, `--accent-primary`) sweeps around the button over 3 seconds

---

## Nature Background Layer (Behind Everything)

The default background theme is "Sky":
- Soft white cloud-like radial gradients at various positions
- Main linear gradient from light sky blue (`rgba(135, 206, 250, 0.9)`) at top to pale blue (`rgba(200, 235, 255, 0.7)`) at bottom
- This shows through behind the welcome screen's own gradient, adding depth

Other available backgrounds (selectable in settings): Garden (sky-to-grass-to-soil), Beach (blue-to-sand), Forest (deep greens), or None.

---

## Typography

- **Font family:** System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif`
- **No web fonts loaded** -- uses native system fonts for fast rendering

### Font Sizes (Desktop)
| Token | Size | Used For |
|-------|------|----------|
| `--text-huge` | 72px | Game title |
| `--text-large` | 48px | Section titles |
| `--text-medium` | 32px | Instruction text, buttons |
| `--text-normal` | 24px | Welcome message |
| `--text-small` | 18px | Camera hint, labels |

### Font Sizes (Mobile, <= 768px)
| Token | Size |
|-------|------|
| `--text-huge` | 48px |
| `--text-large` | 36px |
| `--text-medium` | 24px |
| `--text-normal` | 18px |
| `--text-small` | 14px |

---

## Accessibility Features

- **Reduced motion support:** All animations reduced to 0.01ms when `prefers-reduced-motion: reduce` is detected
- **High contrast modes:** Two built-in themes (High and Maximum) adjustable from settings
- **Large touch/hover targets:** Buttons min 280px wide, 3-second dwell time for hand activation
- **Floating particles marked `aria-hidden="true"`**
- **No fine motor requirements:** All interactions work with gross hand movements via webcam

---

## Screen Flow Context

The welcome screen is the first screen users see (state: `WELCOME`). After pressing "Start Growing" (via click or 3-second hand hover), the flow proceeds to:
1. **Player Select** ("How Many Gardeners?" - 1 or 2 players)
2. **Mode Select** (2-player only: "Community Garden" co-op or "Village Fair" competitive)
3. **Calibration** (hand detection)
4. **Playing** (game canvas)
5. **Round End** (score results)

---

## Visual Summary in Words

Imagine opening the game in a browser. You see a warm, cream-to-mint-green gradient filling the screen, with a soft golden glow in the upper right corner like morning sunlight. Behind everything, a pale sky-blue background with subtle cloud shapes adds depth.

Tiny leaf and petal shapes in greens, golds, and pinks drift slowly downward across the screen, rotating gently as they fall.

At the center of the screen, stacked vertically:
- The **re-Action Health Technologies logo** appears at the top
- Below it, **"Garden Grow!"** in large rainbow gradient text (red-gold-green-blue)
- **"Use your hands to help plants grow"** in medium gray text
- A large **seedling emoji** that gently pulses (grows and shrinks)
- A big green **"Start Growing"** button with rounded corners and a green glow shadow
- Small gray text reading **"Camera access required"**

In the top-right corner sits a circular **settings gear button** (dark with white gear icon).

At the very bottom of the screen, a canvas strip shows a garden preview scene.

Everything fades in with a gentle upward slide when the screen loads. The overall feeling is warm, inviting, simple, and nature-themed -- designed to be calming and accessible for dementia patients in therapeutic settings.
