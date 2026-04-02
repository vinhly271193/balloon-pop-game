# Figma Component Specification Sheet -- Garden Grow

> **Purpose:** Reference document for building every reusable UI component in Figma.
> Each entry contains the exact colors, sizes, states, and property definitions extracted from the live source code so that components can be built in Figma without consulting the codebase.

---

## Design Tokens (Global)

These tokens should be created as Figma Variables and referenced by all components.

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `color/tomato` | `#FF6347` | Tomato plant, accents |
| `color/sunflower` | `#FFD700` | Sunflower plant, timer, encouragement |
| `color/carrot` | `#FF8C00` | Carrot plant |
| `color/lettuce` | `#90EE90` | Lettuce plant, sprout leaves |
| `color/blueberry` | `#4169E1` | Blueberry plant |
| `bg/primary` | `#1a2e1a` | Dark background |
| `bg/secondary` | `#213e21` | Cards, panels |
| `bg/overlay` | `rgba(0, 20, 0, 0.85)` | Screen overlays |
| `text/primary` | `#FFFFFF` | Headings, body on dark bg |
| `text/secondary` | `#a8d5a8` | Labels, hints on dark bg |
| `accent/primary` | `#4ade80` | CTA fills, highlights |
| `accent/secondary` | `#22c55e` | CTA gradient end |
| `soil/brown` | `#8B4513` | Pot stroke, soil |
| `soil/dark` | `#654321` | Deep soil |
| `terracotta` | `#E07A5F` | Plant pot body |
| `player1` | `#FF8C42` | P1 glove, labels, borders |
| `player1/light` | `#FFF5E6` | P1 glove fill |
| `player2` | `#4A90D9` | P2 glove, labels, borders |
| `player2/light` | `#E6F0FF` | P2 glove fill |

### Typography

| Token | Value |
|-------|-------|
| `text/huge` | 72 px, weight 800 |
| `text/large` | 48 px, weight 800 |
| `text/medium` | 32 px, weight 700 |
| `text/normal` | 24 px, weight 400 |
| `text/small` | 18 px, weight 400 |
| Font Family | System: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif |

### Spacing

| Token | Value |
|-------|-------|
| `spacing/large` | 40 px |
| `spacing/medium` | 24 px |
| `spacing/small` | 12 px |

### Transitions (for prototype animations)

| Token | Value |
|-------|-------|
| `transition/fast` | 200 ms ease |
| `transition/medium` | 400 ms ease |

---

## A. UI Components (DOM-Based)

---

### 1. Big Button

**Description:** The primary interactive button used across all screens. Supports hand-hover activation with a 360-degree border progress indicator.

**Figma type:** Component Set with variants

#### Variants

| Property | Options |
|----------|---------|
| Style | `Primary`, `Secondary` |
| State | `Default`, `Hover`, `Active`, `Hand-Hovering` |
| Size | `Standard`, `Card` (for player/mode select) |

#### Specs -- Primary (Default)

| Property | Value |
|----------|-------|
| Min Width | 280 px |
| Padding | 24 px vertical, 40 px horizontal |
| Font | 32 px, weight 700 |
| Background | Linear gradient 135 deg: `#4ade80` -> `#22c55e` |
| Text Color | `#1a2e1a` (bg/primary) |
| Border | None |
| Border Radius | 20 px |
| Box Shadow | `0 8px 30px rgba(74, 222, 128, 0.4)` |

#### Specs -- Primary on Light Screen

| Property | Value |
|----------|-------|
| Background | Linear gradient 135 deg: `#22c55e` -> `#16a34a` |
| Text Color | `#FFFFFF` |
| Box Shadow | `0 6px 24px rgba(34, 197, 94, 0.35)` |

#### Specs -- Secondary

| Property | Value |
|----------|-------|
| Background | `#213e21` (bg/secondary) |
| Text Color | `#FFFFFF` |
| Border | 3 px solid `#a8d5a8` |

#### States

| State | Transform | Box Shadow |
|-------|-----------|------------|
| Default | scale(1) | As above |
| Hover | scale(1.05) | As above |
| Active | scale(0.98) | As above |
| Hand-Hovering | scale(1.05) | `0 0 30px rgba(74, 222, 128, 0.6)` |

#### Border Progress Ring (sub-component)

Shown around the button during hand-hover. Uses a conic-gradient mask that fills from 12 o'clock clockwise.

| Property | Value |
|----------|-------|
| Inset | -9 px from button edges |
| Border Radius | 32 px |
| **Track** | 9 px solid `rgba(255, 255, 255, 0.3)` |
| **Fill** | 12 px solid `#FFFFFF` |
| Fill Glow | `0 0 15px rgba(255, 255, 255, 0.8), 0 0 30px rgba(255, 255, 255, 0.5)` |
| Fill Glow (active) | `0 0 25px rgba(255, 255, 255, 1), 0 0 50px rgba(255, 255, 255, 0.6)` |
| On Light Screen Fill | 12 px solid `#16a34a`, glow `0 0 12px rgba(22, 163, 74, 0.6)` |

#### Card Variant (Player Select / Mode Select)

| Property | Value |
|----------|-------|
| Min Width | 240 px |
| Padding | 40 px vertical, 24 px horizontal |
| Layout | Column (flex) with icon, label, optional description |
| Icon Size | 56 px emoji |
| Label Font | 32 px, weight 700 |
| Description Font | 18 px, weight 400, color `#a8d5a8` (dark) / `#6b7280` (light) |

#### Properties to Expose

| Property | Type | Description |
|----------|------|-------------|
| `label` | Text | Button label |
| `style` | Enum: Primary, Secondary | Visual variant |
| `state` | Enum: Default, Hover, Active, HandHovering | Interaction state |
| `icon` | Text (optional) | Emoji icon above label (card variant) |
| `description` | Text (optional) | Sub-text (card variant) |
| `progressPercent` | Number 0--1 | Controls border fill arc |

---

### 2. Settings Gear Button

**Description:** Circular button anchored to the top-right (or bottom-right when HUD active). Contains a gear SVG icon and a circular SVG progress ring for hand-hover.

**Figma type:** Component with boolean variants for state

#### Specs

| Property | Value |
|----------|-------|
| Size | 60 x 60 px |
| Shape | Circle |
| Background | `rgba(0, 0, 0, 0.7)` |
| Border | 3 px solid `rgba(255, 255, 255, 0.3)` |
| Icon | SVG gear, 32 x 32 px, fill `#FFFFFF` |
| Position (default) | Fixed, top: 20 px, right: 20 px |
| Position (HUD active) | Fixed, bottom: 20 px, right: 20 px |
| Z-Index | 50 |

#### Hover State

| Property | Value |
|----------|-------|
| Background | `rgba(0, 0, 0, 0.9)` |
| Transform | scale(1.1) |

#### Progress Ring (sub-component, SVG)

| Property | Value |
|----------|-------|
| Inset | -8 px from button edges (total 76 x 76 px) |
| SVG viewBox | 0 0 100 100 |
| Circle radius | 45 |
| Background stroke | `rgba(255, 255, 255, 0.2)`, width 4 |
| Fill stroke | `#4ade80`, width 4 |
| Stroke dasharray | 283 (2 * PI * 45) |
| Stroke dashoffset | 283 (empty) to 0 (full) |

#### Properties to Expose

| Property | Type | Description |
|----------|------|-------------|
| `state` | Enum: Default, Hover, HandHovering | Interaction state |
| `position` | Enum: TopRight, BottomRight | Placement |
| `progressPercent` | Number 0--1 | Ring fill |

---

### 3. HUD Bar (1-Player)

**Description:** Top-of-screen heads-up display showing timer, challenge text, score, and progress bar.

**Figma type:** Component

#### Specs

| Property | Value |
|----------|-------|
| Position | Absolute top: 0, full width |
| Padding | 24 px |
| Layout | Column: top row (flex space-between) + progress row below |
| Background | Transparent (items have own backgrounds) |

#### Top Row Items (3-column)

Left: Timer | Center: Challenge | Right: Score

Each item uses `.hud-item` styling (see HUD Item below).

#### Progress Row

| Property | Value |
|----------|-------|
| Margin Top | 24 px |
| Layout | Flex row, gap 24 px, items centered |
| Contains | Progress Bar (flex 1) + Progress Text badge |

---

### 4. HUD Item

**Description:** Individual data cell within the HUD.

**Figma type:** Component Set with variants

#### Specs (Base)

| Property | Value |
|----------|-------|
| Background | `rgba(0, 0, 0, 0.7)` |
| Padding | 12 px vertical, 24 px horizontal |
| Border Radius | 16 px |
| Text Align | Center |
| Label Font | 18 px, uppercase, letter-spacing 1 px, color `#a8d5a8` |
| Value Font | 48 px, weight 800 |

#### Variants

| Variant | Value Color | Label Color |
|---------|-------------|-------------|
| Timer | `#FFD700` | `#a8d5a8` |
| Score | `#4ade80` | `#a8d5a8` |
| Challenge | 32 px, weight 700, `#FFFFFF` | -- |
| Timer Warning | `#FF3B30` + pulse animation | `#a8d5a8` |
| P1 Score (2P) | `#FF8C42` | `#FF8C42` |
| P2 Score (2P) | `#4A90D9` | `#4A90D9` |

#### Properties to Expose

| Property | Type | Description |
|----------|------|-------------|
| `variant` | Enum | Timer, Score, Challenge, P1Score, P2Score |
| `label` | Text | "Time", "Plants", "Player 1", "Player 2" |
| `value` | Text | Numeric or challenge description |
| `isWarning` | Boolean | Timer turns red when <= 10 s |

---

### 5. Progress Bar

**Description:** Horizontal bar showing challenge completion, calibration progress, or volume level.

**Figma type:** Component Set with variants

#### Specs -- Challenge Progress

| Property | Value |
|----------|-------|
| Height | 20 px |
| Track Background | `rgba(0, 0, 0, 0.7)` |
| Track Border Radius | 10 px |
| Fill Gradient | Linear 90 deg: `#4ade80` -> `#22c55e` |
| Fill Border Radius | 10 px |
| Transition | width 200 ms ease |

#### Specs -- P1 Progress

| Property | Value |
|----------|-------|
| Track Background | `rgba(255, 140, 66, 0.2)` |
| Fill Gradient | Linear 90 deg: `#FF8C42` -> `#FFB066` |

#### Specs -- P2 Progress

| Property | Value |
|----------|-------|
| Track Background | `rgba(74, 144, 217, 0.2)` |
| Fill Gradient | Linear 90 deg: `#4A90D9` -> `#6AB0F0` |

#### Specs -- Calibration Progress

| Property | Value |
|----------|-------|
| Width | 50%, max 300 px |
| Height | 6 px |
| Track Background | `rgba(255, 255, 255, 0.15)` |
| Track Border Radius | 3 px |
| Fill Gradient | Linear 90 deg: `#4ade80` -> `#22c55e` |
| Fill Border Radius | 3 px |

#### Specs -- Volume Bar

| Property | Value |
|----------|-------|
| Width | 120 px |
| Height | 16 px |
| Track Background | `rgba(255, 255, 255, 0.2)` |
| Track Border Radius | 8 px |
| Fill Color | `#4ade80` |
| Fill Border Radius | 8 px |
| Handle Size | 24 x 24 px circle |
| Handle Fill | `#4ade80` |
| Handle Border | 3 px solid `#FFFFFF` |
| Handle Shadow | `0 2px 8px rgba(0, 0, 0, 0.3)` |

#### Properties to Expose

| Property | Type | Description |
|----------|------|-------------|
| `variant` | Enum | Challenge, P1, P2, Calibration, Volume |
| `fillPercent` | Number 0--1 | Fill width |
| `showHandle` | Boolean | Volume variant only |

#### Progress Text Badge (sub-component, appears next to Challenge bar)

| Property | Value |
|----------|-------|
| Font | 24 px, weight 700 |
| Background | `rgba(0, 0, 0, 0.7)` |
| Padding | 12 px vertical, 24 px horizontal |
| Border Radius | 10 px |
| Min Width | 100 px |
| Text Align | Center |

---

### 6. Hand Indicator Card

**Description:** Card shown on the calibration screen indicating hand detection status.

**Figma type:** Component Set with variants

#### Specs (Base -- Not Detected)

| Property | Value |
|----------|-------|
| Layout | Column, centered |
| Padding | 24 px |
| Background | `#213e21` |
| Border | 4 px solid `#a8d5a8` |
| Border Radius | 20 px |
| Min Width | 200 px |
| Label Font | 24 px, weight 700, color `#FFFFFF` |
| Status Font | 18 px, color `#a8d5a8` |
| Status Text | "Not detected" |

#### Detected State

| Property | Value |
|----------|-------|
| Border Color | `#4ade80` |
| Background | `rgba(74, 222, 128, 0.1)` |
| Status Color | `#4ade80` |
| Status Text | "Detected!" |

#### Calibration Player Card (2P variant)

| Property | Value |
|----------|-------|
| Same base styling as Hand Indicator |
| Min Width | 180 px |
| Icon | 48 px emoji (hand) |

| Sub-Variant | Border Color | Background | Status Color |
|-------------|-------------|------------|--------------|
| P1 Ready | `#FF8C42` | `rgba(255, 140, 66, 0.1)` | `#FF8C42` |
| P2 Waiting | `#a8d5a8` (pulsing) | `#213e21` | `#a8d5a8` |
| P2 Detected | `#4A90D9` | `rgba(74, 144, 217, 0.1)` | `#4A90D9` |

#### Properties to Expose

| Property | Type | Description |
|----------|------|-------------|
| `handLabel` | Text | "Left Hand" / "Right Hand" |
| `isDetected` | Boolean | Toggles visual state |
| `playerVariant` | Enum: None, P1, P2 | For 2P calibration |

---

### 7. Score Box

**Description:** Large stat card used on the Round End screen to show final score and plants grown.

**Figma type:** Component

#### Specs

| Property | Value |
|----------|-------|
| Background | `#213e21` |
| Padding | 24 px vertical, 40 px horizontal |
| Border Radius | 20 px |
| Min Width | 180 px |
| Label Font | 18 px, uppercase, color `#a8d5a8` |
| Label Margin Bottom | 12 px |
| Value Font | 72 px, weight 800, color `#4ade80` |

#### Properties to Expose

| Property | Type | Description |
|----------|------|-------------|
| `label` | Text | "Score" / "Plants Grown" |
| `value` | Text | Numeric value |

---

### 8. Ribbon Card

**Description:** Player result card on the 2P competitive round end screen. Shows emoji, player name, score, and ribbon title.

**Figma type:** Component Set with variants

#### Specs (Base)

| Property | Value |
|----------|-------|
| Layout | Column, centered |
| Padding | 40 px vertical, 24 px horizontal |
| Background | `#213e21` |
| Border | 4 px solid (player color) |
| Border Radius | 24 px |
| Min Width | 200 px |
| Ribbon Icon | 56 px emoji |
| Player Label Font | 24 px, weight 700 |
| Score Font | 72 px, weight 800, color `#4ade80` |
| Title Font | 32 px, weight 700, color `#FFD700` |

#### Player Variants

| Variant | Border Color | Box Shadow | Label Color |
|---------|-------------|------------|-------------|
| P1 | `#FF8C42` | `0 4px 20px rgba(255, 140, 66, 0.3)` | `#FF8C42` |
| P2 | `#4A90D9` | `0 4px 20px rgba(74, 144, 217, 0.3)` | `#4A90D9` |

#### Properties to Expose

| Property | Type | Description |
|----------|------|-------------|
| `player` | Enum: P1, P2 | Color variant |
| `playerName` | Text | "Player 1" / "Player 2" |
| `score` | Text | Numeric |
| `ribbonTitle` | Text | "Blue Ribbon!" / "Red Ribbon!" |
| `icon` | Text | Emoji |

---

### 9. Toggle Switch

**Description:** ON/OFF toggle used in Settings for Sound Effects.

**Figma type:** Component Set with variants

#### Specs -- ON State

| Property | Value |
|----------|-------|
| Min Width | 70 px |
| Padding | 8 px vertical, 16 px horizontal |
| Font | 14 px, weight 700 |
| Border | 2 px solid `#4ade80` |
| Border Radius | 8 px |
| Background | Transparent |
| Text Color | `#4ade80` |
| Text | "ON" |

#### Specs -- OFF State

| Property | Value |
|----------|-------|
| Border Color | `#a8d5a8` |
| Text Color | `#a8d5a8` |
| Text | "OFF" |

#### Hover

| Property | Value |
|----------|-------|
| Transform | scale(1.05) |

#### Properties to Expose

| Property | Type | Description |
|----------|------|-------------|
| `isOn` | Boolean | Toggles ON/OFF appearance |

---

### 10. Contrast Button

**Description:** Selection button for contrast modes in Settings (Normal, High, Maximum).

**Figma type:** Component Set with variants

#### Specs -- Default (Inactive)

| Property | Value |
|----------|-------|
| Padding | 6 px vertical, 12 px horizontal |
| Font | 12 px, weight 700 |
| Border | 2 px solid `#a8d5a8` |
| Border Radius | 8 px |
| Background | Transparent |
| Text Color | `#a8d5a8` |

#### Specs -- Active

| Property | Value |
|----------|-------|
| Border Color | `#4ade80` |
| Background | `#4ade80` |
| Text Color | `#1a2e1a` |

#### Hover (Inactive)

| Property | Value |
|----------|-------|
| Border Color | `#FFFFFF` |
| Text Color | `#FFFFFF` |

#### Properties to Expose

| Property | Type | Description |
|----------|------|-------------|
| `label` | Text | "Normal" / "High" / "Maximum" |
| `isActive` | Boolean | Active selection state |

---

### 11. Background Preview Swatch

**Description:** Small thumbnail button in Settings for selecting background theme. Contains a preview box and label.

**Figma type:** Component Set with variants

#### Specs (Base)

| Property | Value |
|----------|-------|
| Layout | Column, centered |
| Min Width | 60 px |
| Padding | 6 px |
| Gap | 4 px |
| Border | 2 px solid `#a8d5a8` |
| Border Radius | 8 px |
| Background | `rgba(0, 0, 0, 0.3)` |
| Label Font | 10 px, weight 600 |
| Label Color | `#a8d5a8` |

#### Active State

| Property | Value |
|----------|-------|
| Background | `rgba(74, 222, 128, 0.2)` |
| Border Color | `#4ade80` |
| Label Color | `#4ade80` |

#### Preview Box

| Property | Value |
|----------|-------|
| Size | 50 x 35 px |
| Border Radius | 4 px |
| Border | 1 px solid `rgba(255, 255, 255, 0.3)` |

#### Preview Fills per Variant

| Variant | Preview Background |
|---------|-------------------|
| None | `#1a2e1a` with diagonal X line (`#a8d5a8`, 2 px, 45 deg) |
| Garden | Gradient: `rgba(135, 206, 150, 0.9)` top -> `rgba(80, 150, 80, 0.9)` bottom, with pink + green radials |
| Beach | Gradient: `rgba(135, 206, 235, 0.9)` top -> `rgba(100, 180, 220, 0.9)` 40% -> `rgba(194, 178, 128, 0.9)` 70% -> `rgba(210, 190, 140, 0.9)` bottom |
| Forest | Gradient: `rgba(34, 80, 50, 0.9)` top -> `rgba(55, 100, 60, 0.9)` 60% -> `rgba(40, 70, 45, 0.9)` bottom, with green radial |
| Sky | Gradient: `rgba(135, 206, 250, 0.95)` top -> `rgba(175, 225, 255, 0.9)` 50% -> `rgba(200, 235, 255, 0.85)` bottom, with white cloud radials |

#### Properties to Expose

| Property | Type | Description |
|----------|------|-------------|
| `variant` | Enum: None, Garden, Beach, Forest, Sky | Preview fill |
| `isActive` | Boolean | Selection state |

---

### 12. Settings Panel

**Description:** Modal panel containing all game settings, centered on a dark overlay.

**Figma type:** Component

#### Overlay

| Property | Value |
|----------|-------|
| Position | Fixed, full screen |
| Background | `rgba(0, 20, 0, 0.85)` |
| Z-Index | 200 |

#### Panel

| Property | Value |
|----------|-------|
| Background | `#213e21` |
| Border Radius | 24 px |
| Padding | 40 px |
| Max Width | 600 px |
| Width | 95% |
| Max Height | 90vh |
| Overflow | Scroll Y |

#### Close X Button (top-right)

| Property | Value |
|----------|-------|
| Size | 40 x 40 px circle |
| Background | `rgba(255, 255, 255, 0.1)` |
| Border | 2 px solid `rgba(255, 255, 255, 0.3)` |
| Icon | X SVG, 20 x 20 px, color `#a8d5a8` |
| Position | top: 12 px, right: 12 px |
| Hover | bg `rgba(255, 255, 255, 0.2)`, icon color `#FFFFFF`, scale(1.1) |

#### Section Title

| Property | Value |
|----------|-------|
| Font | 18 px, uppercase, letter-spacing 1 px |
| Color | `#a8d5a8` |
| Margin Bottom | 12 px |

#### Section Divider

| Property | Value |
|----------|-------|
| Border Bottom | 2 px solid `rgba(255, 255, 255, 0.1)` |

#### Close Button (bottom)

| Property | Value |
|----------|-------|
| Width | 100% |
| Padding | 12 px vertical, 24 px horizontal |
| Font | 16 px, weight 700 |
| Background | Linear gradient 135 deg: `#4ade80` -> `#22c55e` |
| Text Color | `#1a2e1a` |
| Border Radius | 12 px |
| Shadow | `0 4px 15px rgba(74, 222, 128, 0.3)` |
| Hover Progress Bar | 8 px tall at bottom, same green gradient, border-radius `0 0 12px 12px` |

---

### 13. Countdown Circle

**Description:** Large number displayed during the challenge intro countdown (3, 2, 1).

**Figma type:** Component

#### Specs

| Property | Value |
|----------|-------|
| Font | 120 px, weight 800 |
| Color | `#4ade80` |
| Margin Top | 24 px |
| Animation | Pulse scale(1) -> scale(1.1) over 1 s, infinite |

#### Properties to Expose

| Property | Type | Description |
|----------|------|-------------|
| `number` | Text | "3", "2", "1" |

---

### 14. Challenge Text Box

**Description:** The challenge description shown during the challenge intro screen.

**Figma type:** Component

#### Specs

| Property | Value |
|----------|-------|
| Font | 72 px, weight 800, color `#FFFFFF` |
| Line Height | 1.3 |
| Margin | 24 px vertical |
| Background | None (inherits screen bg) |

The level label above it:

| Property | Value |
|----------|-------|
| Font | 48 px, color `#a8d5a8` |
| Level Number Color | `#4ade80` |
| Margin Bottom | 12 px |

---

### 15. Plant Indicator

**Description:** Card showing a plant type as a target in the challenge intro (emoji + name + count).

**Figma type:** Component

#### Specs

| Property | Value |
|----------|-------|
| Layout | Column, centered |
| Padding | 24 px |
| Background | `#213e21` |
| Border Radius | 16 px |
| Min Width | 120 px |
| Icon Font | 40 px emoji |
| Icon Margin Bottom | 12 px |
| Name Font | 24 px, weight 700, color = plant's `plantColor` |
| Count Font | 48 px, weight 800, color `#FFFFFF` |

#### Plant Color Reference (for name text)

| Plant | plantColor |
|-------|-----------|
| Tomato | `#FF6347` |
| Sunflower | `#FFD700` |
| Carrot | `#FF8C00` |
| Lettuce | `#90EE90` |
| Blueberry | `#4169E1` |
| Any | `#4ade80` (accent) |

#### Properties to Expose

| Property | Type | Description |
|----------|------|-------------|
| `icon` | Text | Emoji: tomato, sunflower, etc. |
| `name` | Text | Plant name |
| `nameColor` | Color | Per-plant color |
| `count` | Text | Target number |

---

### 16. Floating Particle

**Description:** Decorative leaf/petal shapes that drift across light screen backgrounds. 8 particles are spawned per screen.

**Figma type:** Component Set with 5 color variants

#### Specs

| Property | Value |
|----------|-------|
| Shape | Rounded: `border-radius: 50% 0 50% 0` (leaf shape) |
| Width | 10--24 px (randomized) |
| Height | width * 0.7 |
| Opacity | Animated 0 -> 0.6 -> 0 |
| Animation | `particleDrift` -- translates right 80 px and down 110vh while rotating 400 deg |
| Duration | 10--20 s per particle |

#### Color Variants

| Variant | Background Color |
|---------|-----------------|
| Green Leaf | `rgba(74, 222, 128, 0.3)` |
| Warm Petal | `rgba(255, 200, 120, 0.25)` |
| Pink Blossom | `rgba(255, 182, 193, 0.25)` |
| Light Green | `rgba(144, 238, 144, 0.3)` |
| Peach | `rgba(255, 223, 186, 0.2)` |

#### CSS Pseudo-Element Particles (2 always present)

| Particle | Width | Height | Color | Left | Duration |
|----------|-------|--------|-------|------|----------|
| Leaf 1 (::before) | 18 px | 12 px | `rgba(74, 222, 128, 0.35)` | 15% | 12 s |
| Leaf 2 (::after) | 14 px | 10 px | `rgba(255, 200, 120, 0.3)` | 70% | 15 s, delay 3 s |

---

## B. Canvas Components (Illustration Reference)

---

### 17. Plant Pot

**Description:** Terracotta plant pot drawn on canvas. Trapezoid body with rim and soil ellipse.

**Figma type:** Component (illustration frame)

#### Dimensions

| Property | Value |
|----------|-------|
| Pot Width | 120 px |
| Pot Height | 100 px |
| Rim Height | 15 px |
| Hit Radius | 80 px |

#### Body (Trapezoid)

The pot is a trapezoid narrowing toward the bottom by 15 px on each side.

| Point | X Offset | Y Offset |
|-------|----------|----------|
| Top Left | -60 | -100 |
| Bottom Left | -45 | 0 |
| Bottom Right | +45 | 0 |
| Top Right | +60 | -100 |

#### Gradient (left to right across body)

| Stop | Color | Hex |
|------|-------|-----|
| 0% | Light tan | `#C4A484` |
| 30% | Terracotta | `#E07A5F` |
| 70% | Terracotta | `#E07A5F` |
| 100% | Dark gold | `#B8860B` |

#### Stroke

| Property | Value |
|----------|-------|
| Color | `#8B4513` |
| Width | 3 px |

#### Rim (Rectangle extending 5 px past body on each side)

| Property | Value |
|----------|-------|
| Fill | `#D2691E` |
| Stroke | `#8B4513`, 3 px |
| Width | potWidth + 10 px (130 px total) |
| Height | 15 px |

#### Soil (Ellipse at pot opening)

| Property | Value |
|----------|-------|
| Fill | `#5D4037` |
| Rx | 55 px (potWidth/2 - 5) |
| Ry | 15 px |
| Position | Centered at pot top + 5 px |

#### Water Fill (visible when plant is being watered)

| Property | Value |
|----------|-------|
| Fill | `rgba(100, 180, 255, 0.35)` |
| Max Height | 60% of pot height |
| Wavy Surface | 8 segments, 2 px sine amplitude |

---

### 18. Plant

**Description:** Growing plant with 5 type variants and 5 growth stages (plus empty).

**Figma type:** Component Set (Plant Type x Growth Stage matrix)

#### Plant Type Colors

| Type | Seed Color | Plant Color | Stem Color | Icon |
|------|-----------|-------------|------------|------|
| Tomato | `#8B0000` | `#FF6347` | `#228B22` | tomato |
| Sunflower | `#8B4513` | `#FFD700` | `#228B22` | sunflower |
| Carrot | `#D2691E` | `#FF8C00` | `#228B22` | carrot |
| Lettuce | `#556B2F` | `#90EE90` | `#228B22` | lettuce |
| Blueberry | `#483D8B` | `#4169E1` | `#228B22` | blueberry |

#### Growth Stages

**SEED_PLANTED**
- Ellipse at soil surface: rx 8 px, ry 12 px, fill = `seedColor`

**SPROUTING**
- Stem: curved line from base upward, 20--50 px tall (animated by growthProgress 0--1)
- Stem color: `#90EE90`
- Stem width: 4 px, round cap
- Two small leaf ellipses appear when growthProgress > 0.5, size 10 px, fill `#90EE90`

**GROWING**
- Stem: 60--100 px tall, width 6 px, fill = `stemColor`
- 2--3 leaves at 30%, 50%, 70% height
- Leaf gradient: `#228B22` -> `#90EE90`
- Leaf size: 20 x 30 px (lower), 15 x 25 px (upper)

**MATURE / HARVESTABLE**
- Full stem: 120 px tall, width 8 px
- 4 leaves at 25%, 40%, 55%, 70% height, size 25 x 40 px and 20 x 35 px
- Fruit at top (see Fruit sub-variants below)
- Harvestable: additional golden glow circle, r 40 px, fill `rgba(255, 255, 100, 0.2)`

#### Fruit Sub-Variants

**Sunflower:**
- 12 petals, each ellipse rx 8, ry 20, arranged radially at r 25
- Petal color: `#FFD700`
- Center circle: r 15, fill `#8B4513`

**All others (Tomato, Carrot, Lettuce, Blueberry):**
- Round fruit: r 25
- Radial gradient: center `#FFFFFF` at 0%, `plantColor` at 30%, `seedColor` at 100%
- Small stem on top: 7 px line, stroke `stemColor`, width 3

#### Growth Pulse Effect

On every stage advance, the plant scales 115% briefly (decays over 0.4 s).

#### Growth Ring (sub-component, below pot)

| Property | Value |
|----------|-------|
| Semicircle | r 50 px, below pot center (cy = potY + 20) |
| 5 segments | One per stage (SEED, SPROUT, GROWING, MATURE, HARVESTABLE) |
| Segment gap | 0.04 radians |
| Stroke width | 6 px |
| Completed color | `rgba(74, 222, 128, 0.8)` |
| Current unfilled | `rgba(74, 222, 128, 0.3)` |
| Future | `rgba(255, 255, 255, 0.15)` |
| Stage icons | 12 px font: seedling, herb, tree, blossom, sparkles |
| Icon opacity | 1.0 (reached), 0.4 (future) |

---

### 19. Need Meter (Bars Panel)

**Description:** Panel showing water, sun, and food levels as horizontal bars with icons and labels.

**Figma type:** Component

#### Panel Background

| Property | Value |
|----------|-------|
| Fill | `rgba(0, 0, 0, 0.6)` |
| Border Radius | 15 px |
| Width | ~225 px (35 icon + 150 bar + 40 padding) |
| Height | ~150 px (3 bars * 40 spacing + 30 padding) |

#### Title

| Property | Value |
|----------|-------|
| Text | "Plant Needs" |
| Font | bold 16 px Arial |
| Color | `#FFFFFF` |

#### Individual Bar

| Property | Value |
|----------|-------|
| Icon | 18 px emoji (water droplet / sun / seedling) |
| Bar Width | 150 px |
| Bar Height | 25 px |
| Bar Border Radius | 5 px |
| Bar Track | `rgba(255, 255, 255, 0.2)` -- or pulsing red `rgba(239, 68, 68, 0.2--0.35)` when critical (< 30%) |
| Bar Border | 2 px stroke `rgba(255, 255, 255, 0.5)` |
| Bar Spacing | 40 px vertical between bars |
| Label | bold 12 px, `#FFFFFF`, centered in bar |

#### Fill Colors (by level)

| Level | Fill Color |
|-------|-----------|
| > 60% | `#4ade80` (green) |
| 30--60% | `#fbbf24` (yellow) |
| < 30% | `#ef4444` (red) |

#### Need Types

| Need | Icon | Label |
|------|------|-------|
| Water | water droplet | "Water" |
| Sun | sun | "Sun" |
| Food | seedling | "Food" |

#### Properties to Expose

| Property | Type | Description |
|----------|------|-------------|
| `waterLevel` | Number 0--1 | Water bar fill |
| `sunLevel` | Number 0--1 | Sun bar fill |
| `foodLevel` | Number 0--1 | Food bar fill |

---

### 20. Cartoon Glove

**Description:** Hand overlay drawn from MediaPipe landmarks. Consists of a smooth palm blob, thick finger capsules, puffy fingertips with shine, and a wrist cuff.

**Figma type:** Component Set with 3 color variants

#### Color Variants

| Variant | Main Fill | Shadow | Outline | Highlight |
|---------|----------|--------|---------|-----------|
| Solo (1P) | `#F0FFF0` | `#C8E6C8` | `#2E8B57` | `#FFFFFF` |
| Player 1 | `#FFF5E6` | `#F0D9B5` | `#FF8C42` | `#FFFFFF` |
| Player 2 | `#E6F0FF` | `#B5C9E6` | `#4A90D9` | `#FFFFFF` |

#### Palm

- Shape: Smooth closed curve through 6 anchor points (wrist, thumb_cmc, index_mcp, middle_mcp, ring_mcp, pinky_mcp) using quadratic bezier curves
- Fill: `main` color
- Outline: `outline` color, 3 px
- Shadow: `rgba(0,0,0,0.15)`, blur 12, offset Y 4

#### Fingers (5 total)

| Finger | Joint Count | Base Width |
|--------|------------|------------|
| Thumb | 4 joints (1-2-3-4) | 16 px |
| Index | 4 joints (5-6-7-8) | 14 px |
| Middle | 4 joints (9-10-11-12) | 14 px |
| Ring | 4 joints (13-14-15-16) | 13 px |
| Pinky | 4 joints (17-18-19-20) | 12 px |

- Each segment tapers by 1.5 px toward the tip
- Fill: `main` color, stroke width = segWidth * 2
- Outline: `outline` color, alpha 0.5, width = segWidth * 2 + 3
- Shadow: `rgba(0,0,0,0.1)`, blur 6, offset Y 2

#### Fingertips

| Finger | Radius |
|--------|--------|
| Thumb (landmark 4) | 12 px |
| Index (landmark 8) | 11 px |
| Middle (landmark 12) | 11 px |
| Ring (landmark 16) | 10 px |
| Pinky (landmark 20) | 9 px |

- Glow ring: r + 4 px, fill `outline` at alpha 0.4
- Main circle: fill `main`
- Outline: `outline`, 2.5 px, alpha 0.7
- Shine highlight: circle at (-25% x, -30% y) offset, r * 0.35, fill `rgba(255, 255, 255, 0.7)`

#### Wrist Cuff

- Width: ~80% of distance between thumb base and pinky base
- Height: 10 px
- Fill: `outline` at alpha 0.5
- Border Radius: 5 px
- Highlight stripe: inset 4 px, 40% height, fill `rgba(255, 255, 255, 0.4)`, border-radius 3 px

#### Scale Factor

All glove rendering is scaled to 80% around the center of all landmark points.

---

### 21. Watering Can

**Description:** Draggable watering can tool with tilt animation when held over a pot. Comes in Standard and Golden variants.

**Figma type:** Component Set with variants

#### Color Variants

| Variant | Body Color | Stroke Color | Held Glow |
|---------|-----------|-------------|-----------|
| Standard | `#4A90D9` | `#2E5A87` | `rgba(100, 200, 255, 0.3)` |
| Golden | `#FFD700` | `#DAA520` | `rgba(255, 215, 0, 0.5)` |

#### Dimensions

| Property | Value |
|----------|-------|
| Body | Ellipse: rx 35, ry 25 |
| Hit Radius | 60 px |
| Spout | Trapezoid path from body to tip |
| Handle | Arc, r 20, stroke width 8 px |

#### Spout Path

Points (relative to center):
- (25, -5) -> (50, -20) -> (55, -15) -> (30, 5) -> closed

#### Handle

- Arc from (-10, -30), r 20, from 0.5 to PI - 0.5 radians
- Stroke: `strokeColor`, width 8 px

#### States

| State | Visual |
|-------|--------|
| Default | No glow, tilt 0 |
| Held | Glow circle (hitRadius), glow color per variant |
| Over Pot | Tilts to -0.85 radians (pouring position) |
| Pouring | Water particles spawn from spout tip |

#### Pour Progress Ring (when held over pot)

| Property | Value |
|----------|-------|
| Center | Watering can center |
| Radius | 45 px |
| Stroke | `rgba(100, 200, 255, 0.7)`, width 4 |
| Glow | `rgba(100, 200, 255, 0.6)`, blur 10 |
| Arc | From -90 deg, clockwise by progress * 360 deg |

#### Golden Sparkle Effect

- 3 sparkle dots orbiting at r 40 (horizontal) x r 30 (vertical)
- Each dot: r 3 px, fill `rgba(255, 255, 200, 0.8)`
- Evenly spaced 120 deg apart, rotating over time

#### Pour Particles

| Property | Value |
|----------|-------|
| Color | `rgba(100, 180, 255, alpha)` |
| Size | 2--5 px radius |
| Initial Alpha | 0.8--1.0 |
| Gravity | 8 px/s^2 |
| Lifetime | 0.8 s max |

#### Properties to Expose

| Property | Type | Description |
|----------|------|-------------|
| `variant` | Enum: Standard, Golden | Color set |
| `state` | Enum: Default, Held, Pouring | Visual state |
| `tiltAngle` | Number | Rotation in degrees |
| `pourProgress` | Number 0--1 | Progress ring fill |

---

### 22. Seed Bag

**Description:** Draggable seed packet that shows the plant type icon and name.

**Figma type:** Component

#### Specs

| Property | Value |
|----------|-------|
| Shape | Rounded rectangle |
| Width | 60 px (size * 2) |
| Height | 72 px (size * 2.4) |
| Border Radius | 8 px |
| Fill | `#F5DEB3` (wheat) |
| Stroke | `#8B4513`, 2 px |
| Icon | 30 px emoji (plant type icon), centered |
| Label | bold 10 px, `#5D4037`, centered below icon |
| Hit Radius | 50 px |

#### Held Glow

| Property | Value |
|----------|-------|
| Circle | r = size + 10 (40 px) |
| Fill | `rgba(255, 255, 200, 0.4)` |

#### Properties to Expose

| Property | Type | Description |
|----------|------|-------------|
| `plantType` | Enum: Tomato, Sunflower, Carrot, Lettuce, Blueberry | Icon and label |
| `isHeld` | Boolean | Shows glow |

---

### 23. Fertilizer Bag

**Description:** Draggable fertilizer/food bag tool.

**Figma type:** Component

#### Specs

| Property | Value |
|----------|-------|
| Shape | Rounded rectangle |
| Width | 60 px |
| Height | 70 px |
| Border Radius | 8 px |
| Fill | `#8B4513` (saddlebrown) |
| Stroke | `#5D4037`, 3 px |
| Icon | 30 px seedling emoji, centered |
| Label | bold 10 px, `#FFFFFF`, text "FOOD", below icon |
| Hit Radius | 50 px |

#### Held Glow

| Property | Value |
|----------|-------|
| Circle | r = 50 px (hitRadius) |
| Fill | `rgba(144, 238, 144, 0.3)` |

#### Properties to Expose

| Property | Type | Description |
|----------|------|-------------|
| `isHeld` | Boolean | Shows glow |

---

### 24. Magic Pumpkin

**Description:** Co-op special item that appears for simultaneous touch by both players. Features a glowing pumpkin with magical aura.

**Figma type:** Component Set with states

#### Specs

| Property | Value |
|----------|-------|
| Activation Radius | 70 px |
| Body | Ellipse: rx 50, ry 45 |
| Stem | Rounded rect: 16 x 15 px, r 3, fill `#228B22`, positioned at top |

#### Pumpkin Body Gradient (radial)

| Stop | Color |
|------|-------|
| Center (offset -20, -20) | `#FF8C00` |
| Edge | `#FF4500` |

#### Pumpkin Ridges

- 5 vertical curve lines at x offsets: -30, -15, 0, +15, +30
- Stroke: `#D2691E`, width 2 px

#### Magical Glow Aura (radial gradient)

| Stop | Color |
|------|-------|
| 0% | `rgba(255, 165, 0, 0.6)` (orange) |
| 50% | `rgba(138, 43, 226, 0.4)` (purple) |
| 100% | `rgba(255, 20, 147, 0)` (pink, transparent) |

- Radius: 70 px, pulsing +/- 10%

#### Sparkle Dots (inactive state)

- 5 dots orbiting at r 60 px
- Each dot: r 3 px, fill `rgba(255, 215, 0, 0.8)`

#### States

| State | Changes |
|-------|---------|
| Hidden | Not drawn |
| Visible (idle) | Normal size, sparkles orbiting |
| 1 Player Touching | Shows tooltip "Both players touch!" (bold 16 px, white, black outline 3 px) |
| Activated (both touching) | Scales to 120%, no sparkles, 3 s duration then hides |

#### Properties to Expose

| Property | Type | Description |
|----------|------|-------------|
| `state` | Enum: Hidden, Idle, OneTouching, Activated | Visual state |

---

### 25. Confetti Particle

**Description:** Celebratory particle burst on harvest and magic pumpkin activation. Two shapes: circle and square.

**Figma type:** Component Set with color + shape variants

#### Specs

| Property | Value |
|----------|-------|
| Size | 4--12 px (randomized) |
| Shapes | Circle, Square |
| Initial Velocity | vx: -4 to +4, vy: -15 to -5 |
| Gravity | 0.3 per frame |
| Rotation Speed | -0.15 to +0.15 rad/frame |
| Max Lifetime | 3 s |
| Alpha | 1.0 -> 0.0 over lifetime |

#### 8 Color Variants

| Index | Hex | Description |
|-------|-----|-------------|
| 1 | `#FF6B6B` | Coral red |
| 2 | `#4ECDC4` | Teal |
| 3 | `#45B7D1` | Sky blue |
| 4 | `#FFA07A` | Light salmon |
| 5 | `#98D8C8` | Mint |
| 6 | `#F7DC6F` | Pale gold |
| 7 | `#BB8FCE` | Soft purple |
| 8 | `#85C1E2` | Light blue |

#### Properties to Expose

| Property | Type | Description |
|----------|------|-------------|
| `color` | Enum (8 options) | Particle color |
| `shape` | Enum: Circle, Square | Particle shape |

---

### 26. Hint Arrow

**Description:** Animated guidance arrow showing idle players what to do next. Connects a source (tool) to a target (pot/plant) with a curved dashed line. Harvest variant shows a pulsing ring instead.

**Figma type:** Component Set with 5 type variants

#### 5 Color Variants

| Hint Type | Color | Hex | Tooltip Text |
|-----------|-------|-----|-------------|
| `seed_to_pot` | Warm wheat | `#F5DEB3` | "Grab the seed and place it in the pot!" |
| `water_to_pot` | Light blue | `#87CEEB` | "Your plant is thirsty! Use the watering can!" |
| `sun_to_pot` | Soft gold | `#FFD700` | "Your plant needs sunlight! Touch the sun!" |
| `food_to_pot` | Light green | `#90EE90` | "Feed your plant! Grab the fertilizer!" |
| `harvest` | Soft peach | `#FFDAB9` | "Your plant is ready! Touch it to harvest!" |

#### Arrow Variant (seed_to_pot, water_to_pot, sun_to_pot, food_to_pot)

| Property | Value |
|----------|-------|
| Path | Quadratic bezier curve with 30% perpendicular control offset |
| Dash | 12 px dash, 8 px gap |
| Stroke Width | 3 px |
| Glow | shadowColor = hint color, blur 15 |
| Source Circle | r 12 px (pulsing +/- 20%), fill at alpha 0.4, stroke 2 px |
| Arrowhead | 14 px equilateral triangle, fill = hint color, glow blur 10 |

#### Harvest Variant

| Property | Value |
|----------|-------|
| Shape | Circle centered on plant |
| Outer Ring | r 50 px (pulsing +/- 15%), stroke 4 px, glow blur 20 |
| Inner Ring | Same radius, dashed [10, 6], stroke 3 px, animated dash offset |

#### Tooltip Bubble (all variants)

| Property | Value |
|----------|-------|
| Font | bold 20 px Arial |
| Text Color | `#FFFFFF` |
| Background | `rgba(0, 0, 0, 0.7)` |
| Padding | 14 px horizontal |
| Height | 36 px |
| Border Radius | 12 px |
| Border | 2 px solid (hint color) |
| Shadow | `rgba(0, 0, 0, 0.3)`, blur 12, offset Y 3 |
| Pointer | 8 px triangle pointing down, same bg and border |
| Animation | Gentle 4 px sine bounce vertically |

#### Alpha Animation

| State | Alpha Range |
|-------|-------------|
| Fading In | 0 -> 1.0 over 1.0 s |
| Visible | 0.4 -- 1.0 (sine pulse) |
| Fading Out | 1.0 -> 0 over 0.5 s |

#### Properties to Expose

| Property | Type | Description |
|----------|------|-------------|
| `hintType` | Enum (5 options) | Color and tooltip variant |
| `state` | Enum: Hidden, FadingIn, Visible, FadingOut | Visibility state |

---

### 27. Zone Divider

**Description:** Vertical dashed line separating Player 1 and Player 2 zones in competitive mode. Full canvas height with player labels at top.

**Figma type:** Component

#### Line Specs

| Property | Value |
|----------|-------|
| Dash Pattern | 15 px dash, 10 px gap |
| Stroke Color | `rgba(255, 255, 255, 0.3)` |
| Stroke Width | 3 px |
| Glow | Shadow color `rgba(255, 255, 255, 0.3)`, blur 15 |
| Length | Full canvas height |

#### Player Labels (at top of each zone)

| Property | Value |
|----------|-------|
| Font | bold 24 px Arial |
| Position | Y = 40 px, centered in each zone |
| Stroke | `#000000`, width 3 (text outline) |

| Player | Fill Color | Zone Side (mirrored) |
|--------|-----------|---------------------|
| Player 1 | `#FF8C42` | Right side |
| Player 2 | `#4A90E2` | Left side |

#### Properties to Expose

| Property | Type | Description |
|----------|------|-------------|
| `dividerX` | Number | X position (normalized 0--1, multiply by canvas width) |

---

### 28. Sun Area

**Description:** Interactive sun zone where players touch to provide sunlight to plants.

**Figma type:** Component (illustration frame)

#### Specs

| Property | Value |
|----------|-------|
| Radius | 120 px |
| Icon | 100 px sun emoji, centered |
| Pulse | +/- 10% radius oscillation |

#### Glow Gradient (radial)

| Stop | Color |
|------|-------|
| 0% | `rgba(255, 220, 100, 0.8)` |
| 50% | `rgba(255, 200, 50, 0.4)` |
| 100% | `rgba(255, 180, 0, 0)` |

---

### 29. Water Progress Ring (on pot)

**Description:** Circular progress indicator shown around a pot when a watering can is held over it.

**Figma type:** Component

#### Specs

| Property | Value |
|----------|-------|
| Center | Pot center (x, y - potHeight/2) |
| Radius | potWidth/2 + 25 = 85 px |
| Track | Full circle, stroke `rgba(100, 180, 255, 0.15)`, width 10, round cap |
| Fill | Arc from -90 deg clockwise, stroke `rgba(100, 180, 255, 0.85)`, width 10, round cap |
| Glow | shadow `rgba(100, 180, 255, 0.6)`, blur 12 |
| Leading Icon | 18 px water droplet emoji at arc end |

#### Properties to Expose

| Property | Type | Description |
|----------|------|-------------|
| `progress` | Number 0--1 | Arc fill |

---

### 30. Chapter Header

**Description:** Banner shown at the start of each chapter's first level in the challenge intro screen.

**Figma type:** Component

#### Specs

| Property | Value |
|----------|-------|
| Padding | 24 px |
| Background | `rgba(74, 222, 128, 0.1)` |
| Border | 2 px solid `rgba(74, 222, 128, 0.3)` |
| Border Radius | 16 px |
| Icon | 48 px emoji, floating animation (translateY 0 -> -10 px, 3 s) |
| Number Text | 18 px, uppercase, letter-spacing 3 px, color `#a8d5a8` |
| Title Text | 32 px, weight 800, color `#4ade80` |

---

### 31. Chapter Complete Banner

**Description:** Celebratory section on the round end screen when a chapter is completed.

**Figma type:** Component

#### Specs

| Property | Value |
|----------|-------|
| Padding | 24 px |
| Background | Radial gradient center: `rgba(74, 222, 128, 0.15)` -> transparent at 70% |
| Border | 2 px solid `rgba(74, 222, 128, 0.4)` |
| Border Radius | 16 px |
| Icon | 64 px emoji, wobble animation (scale 1--1.1, rotate -5 to +5 deg) |
| Title | 32 px, weight 800, color `#4ade80` |
| Reward Text | 24 px, color `#FFFFFF`, line-height 1.4 |
| Unlock Text | 18 px, weight 700, color `#FFD700` |

---

### 32. Loading Spinner

**Description:** Full-screen loading overlay with spinning ring and seedling icon.

**Figma type:** Component

#### Background

Same warm gradient as light screens:
- `radial-gradient(ellipse at 70% 15%, rgba(255, 220, 120, 0.4) 0%, transparent 45%)`
- `linear-gradient(180deg, #FFF8F0 0%, #FEFCE8 45%, #F0FDF4 70%, #DCFCE7 100%)`

#### Spinner Ring

| Property | Value |
|----------|-------|
| Size | 80 x 80 px |
| Border | 6 px solid `rgba(0, 0, 0, 0.1)` |
| Top Border | `#22c55e` |
| Border Radius | 50% |
| Animation | 360 deg rotation, 1 s linear infinite |

#### Center Icon

| Property | Value |
|----------|-------|
| Icon | seedling emoji, 30 px |
| Animation | Scale 1 -> 1.2 -> 1, 1 s ease-in-out infinite |

#### Loading Text

| Property | Value |
|----------|-------|
| Text | "Preparing the garden..." |
| Font | 24 px |
| Color | `#6b7280` |

---

## Light Screen Background Variants

The welcome, player select, and mode select screens use a warm gradient background with chapter-based color progression.

### Chapter 1 (Default)

```
radial-gradient(ellipse at 70% 15%, rgba(255, 220, 120, 0.5) 0%, transparent 45%),
radial-gradient(ellipse at 10% 85%, rgba(144, 238, 144, 0.25) 0%, transparent 40%),
radial-gradient(ellipse at 90% 80%, rgba(144, 238, 144, 0.2) 0%, transparent 35%),
linear-gradient(180deg, #FFF8F0 0%, #FFF5E6 20%, #FEFCE8 45%, #F0FDF4 70%, #DCFCE7 100%)
```

### Chapter 2

```
radial-gradient(ellipse at 70% 15%, rgba(255, 200, 80, 0.55) 0%, transparent 45%),
radial-gradient(ellipse at 10% 85%, rgba(180, 230, 130, 0.25) 0%, transparent 40%),
radial-gradient(ellipse at 90% 80%, rgba(255, 220, 160, 0.2) 0%, transparent 35%),
linear-gradient(180deg, #FFF6E8 0%, #FFF0D4 20%, #FEFADC 45%, #F5FCEC 70%, #E2F9D8 100%)
```

### Chapter 3+

```
radial-gradient(ellipse at 70% 15%, rgba(255, 180, 60, 0.55) 0%, transparent 45%),
radial-gradient(ellipse at 10% 85%, rgba(200, 220, 100, 0.25) 0%, transparent 40%),
radial-gradient(ellipse at 90% 80%, rgba(255, 200, 120, 0.25) 0%, transparent 35%),
linear-gradient(180deg, #FFF3E0 0%, #FFECCC 20%, #FFF5D6 45%, #F8FAE4 70%, #E8F5CC 100%)
```

---

## Nature Background Themes (Full-Screen Canvas Backgrounds)

### Garden

Sky-to-grass-to-soil gradient with clouds and tree silhouettes:
- Sun: radial at 85% 10%, `rgba(255, 220, 100, 0.6)` -> `rgba(255, 200, 50, 0.3)` at 8% -> transparent at 15%
- Clouds: 3 white elliptical radials (15%, 35%, 60% positions)
- Trees: 4 green radials at bottom third
- Main gradient: `#87CEEB` (sky) -> `#98D8E8` -> `#90EE90` (grass) -> `#228B22` -> `#8B4513` -> `#654321` (soil)

### Beach

Ocean blues to sandy beige:
- White highlight at top center
- Gradient: `rgba(135, 206, 235, 0.8)` -> `rgba(100, 180, 220, 0.7)` -> `rgba(70, 160, 200, 0.6)` -> `rgba(194, 178, 128, 0.7)` -> `rgba(210, 190, 140, 0.8)`

### Forest

Deep peaceful greens:
- Two green radial highlights
- Gradient: `rgba(34, 80, 50, 0.8)` -> `rgba(45, 90, 55, 0.7)` -> `rgba(55, 100, 60, 0.7)` -> `rgba(40, 70, 45, 0.8)`

### Sky

Light blue with soft white clouds:
- 4 white radial cloud puffs
- Gradient: `rgba(135, 206, 250, 0.9)` -> `rgba(175, 225, 255, 0.8)` -> `rgba(200, 235, 255, 0.7)`

---

## Component Hierarchy Summary

```
App
 +-- Nature Background (5 theme variants)
 +-- Canvas Layer (mirrored, z-index 15)
 |    +-- Plant Pot
 |    |    +-- Plant (5 types x 6 stages)
 |    |    +-- Growth Ring
 |    |    +-- Water Progress Ring
 |    +-- Seed Bag (5 plant type variants)
 |    +-- Watering Can (Standard / Golden)
 |    +-- Fertilizer Bag
 |    +-- Sun Area
 |    +-- Need Meter Panel
 |    +-- Hint Arrow (5 type variants)
 |    +-- Magic Pumpkin
 |    +-- Confetti Particle (8 colors x 2 shapes)
 |    +-- Zone Divider
 |    +-- Cartoon Glove (Solo / P1 / P2)
 +-- UI Overlay (z-index 10)
 |    +-- Welcome Screen
 |    |    +-- Company Logo
 |    |    +-- Game Title
 |    |    +-- Big Button (Start)
 |    |    +-- Floating Particles (8 particles)
 |    +-- Player Select Screen
 |    |    +-- Big Button Card x2 (1P / 2P)
 |    |    +-- Floating Particles
 |    +-- Mode Select Screen
 |    |    +-- Big Button Card x2 (Coop / Competitive)
 |    |    +-- Floating Particles
 |    +-- Calibration Screen
 |    |    +-- Hand Indicator Card x2
 |    |    +-- Progress Bar (Calibration)
 |    +-- Calibration P2 Screen
 |    |    +-- Calibration Player Card (P1 Ready, P2 Waiting)
 |    |    +-- Progress Bar (Calibration)
 |    +-- Challenge Intro Screen
 |    |    +-- Chapter Header (optional)
 |    |    +-- Challenge Text Box
 |    |    +-- Plant Indicator x N
 |    |    +-- Countdown Circle
 |    +-- HUD Bar (1P)
 |    |    +-- HUD Item (Timer)
 |    |    +-- HUD Item (Challenge)
 |    |    +-- HUD Item (Score)
 |    |    +-- Progress Bar + Progress Text
 |    +-- HUD Bar (2P)
 |    |    +-- HUD Item (P2 Score + Progress)
 |    |    +-- HUD Item (Timer, center)
 |    |    +-- HUD Item (P1 Score + Progress)
 |    +-- Round End Screen (1P / Coop)
 |    |    +-- Score Box x2
 |    |    +-- Chapter Complete Banner (optional)
 |    |    +-- Big Button (Next Level / Retry / Start Over)
 |    +-- Round End Screen (2P)
 |    |    +-- Ribbon Card x2
 |    |    +-- Big Button (Next Level / Retry / Start Over)
 +-- Settings Gear Button
 +-- Settings Panel
 |    +-- Toggle Switch (Sound)
 |    +-- Volume Bar with Handle
 |    +-- Contrast Button x3
 |    +-- Background Preview Swatch x5
 +-- Loading Spinner
```

---

*Generated from source code analysis on 2026-04-02. All values extracted from `css/styles.css`, `js/ui.js`, `js/garden/constants.js`, `js/garden/plant-pot.js`, `js/garden/tools.js`, `js/garden/effects.js`, `js/garden/plant-needs.js`, `js/garden/garden-bed.js`, and `js/handTracking.js`.*
