# Product Requirements Document (PRD)
## Balloon Pop - Therapeutic Hand Tracking Game

**Version:** 1.1
**Last Updated:** January 8, 2025
**Product Owner:** re-Action Health Technologies
**Document Status:** Living Document

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Product Vision](#product-vision)
3. [Target Users](#target-users)
4. [Design Decisions](#design-decisions)
5. [Design Principles](#design-principles)
6. [Accessibility Requirements](#accessibility-requirements)
7. [Functional Requirements](#functional-requirements)
8. [Technical Specifications](#technical-specifications)
9. [Game Mechanics](#game-mechanics)
10. [User Experience Flow](#user-experience-flow)
11. [Future Roadmap](#future-roadmap)
12. [Success Metrics](#success-metrics)
13. [References](#references)

---

## 1. Executive Summary

Balloon Pop is a browser-based therapeutic game designed specifically for individuals with mild-to-moderate dementia in care facility settings. Using webcam-based hand tracking technology, players engage in intuitive balloon-popping activities that provide cognitive stimulation, motor engagement, and emotional well-being—all without requiring physical controllers or complex instructions.

### Key Differentiators
- **Zero-learning-curve interaction:** Natural hand movements via webcam
- **Dementia-specific design:** Built on clinical research and accessibility guidelines
- **Care facility optimized:** Designed for supervised play with staff assistance
- **Progressive therapeutic value:** Gentle cognitive and motor stimulation

---

## 2. Product Vision

### Mission Statement
To create joyful, accessible gaming experiences that enhance quality of life for individuals with dementia while providing measurable therapeutic value for care providers.

### Core Values
1. **Dignity First:** Never infantilize; challenge appropriately while ensuring success
2. **Joy Over Achievement:** Prioritize positive emotional experiences over scores
3. **Universal Success:** Every session should end with accomplishment
4. **Clinical Validity:** Ground all design decisions in research

### Problem Statement
Individuals with dementia often experience:
- Limited engagement opportunities in care settings
- Difficulty with traditional gaming interfaces (controllers, touchscreens)
- Reduced cognitive stimulation leading to faster decline
- Social isolation and reduced quality of life

### Solution
A gesture-based game that transforms simple hand movements into engaging, rewarding gameplay—providing cognitive stimulation, motor exercise, and emotional fulfillment without frustration barriers.

---

## 3. Target Users

### Primary Users: Individuals with Dementia

#### Demographics
- **Age Range:** Typically 65-95 years
- **Cognitive Status:** Mild to moderate dementia (MMSE scores approximately 10-24)
- **Physical Abilities:** Variable; may have limited mobility, arthritis, or tremors
- **Technology Experience:** Generally low; may have never used computers

#### User Needs
| Need | Priority | Solution |
|------|----------|----------|
| Simple, intuitive interaction | Critical | Hand tracking—no buttons or controllers |
| Clear visual feedback | Critical | Large balloons, high contrast, color labels |
| Positive reinforcement | Critical | No failure states, celebratory feedback |
| Appropriate cognitive challenge | High | Color matching, counting, pattern recognition |
| Sensory stimulation | High | Colorful visuals, pleasant sounds, movement |
| Sense of accomplishment | High | Completable challenges, progress indicators |

#### Cognitive Considerations
- **Attention:** Limited attention span; sessions should be 5-15 minutes
- **Memory:** Short-term memory impairment; minimize reliance on remembering rules
- **Processing Speed:** Slower processing; generous time limits, no time pressure
- **Executive Function:** Difficulty with complex decisions; single clear objectives

### Secondary Users: Care Staff

#### Demographics
- Care facility staff (nurses, caregivers, activity coordinators)
- Variable technology proficiency
- Limited time per resident

#### User Needs
| Need | Priority | Solution |
|------|----------|----------|
| Quick setup | Critical | One-click start, minimal configuration |
| Easy to supervise | High | Clear visual feedback, no complex controls |
| Progress visibility | High | Session analytics, improvement tracking |
| Multiple resident support | Medium | Profile system, saved preferences |

### Tertiary Users: Family Members
- May assist with home play (future consideration)
- Want to see progress and engagement
- Value emotional connection through shared activity

---

## 4. Design Decisions

This section documents the specific design choices made for this product based on stakeholder input, research, and best practices for dementia-friendly therapeutic games.

### 4.1 Core Design Decisions Summary

| Category | Decision | Rationale |
|----------|----------|-----------|
| Visual Theme | Nature-focused | Calming, familiar, non-infantilizing; research shows nature themes reduce anxiety |
| Session Endings | Celebration focus | Creates positive emotional associations; ends on high note |
| Audio Experience | Familiar 1940s-60s music + pleasant sounds | Era-appropriate music triggers positive memories (reminiscence therapy) |
| Personalization | Session-only settings | Simple for staff; no complex profile management needed |
| Pop Feedback | Multi-sensory burst | Visual particles + sound + brief flash creates satisfying feedback loop |
| Struggle Handling | Auto-help system | Automatically adapts without requiring staff intervention |
| Hand Visualization | Friendly cartoon hands | Welcoming, clear, non-threatening; white gloves are universally recognized |
| Progress Indicators | Large, simple progress bar | Easy to understand at a glance; provides clear goal visibility |
| Staff Tools | Quick setup + patient focused | Minimal training required; focus stays on patient experience |
| Balloon Style | Classic round balloons | Familiar, recognizable, universally understood |
| Onboarding | Playful warm-up | "Wave hello!" creates positive first interaction; practice pops build confidence |
| Time Pressure | No visible timers | Eliminates anxiety; accommodates slower processing speeds |
| Celebrations | Joyful but brief (2-3 seconds) | Maintains positive feedback without disrupting flow |
| Language/Tone | Warm and encouraging | Dignified praise without condescension |

### 4.2 Game Modes

Based on stakeholder input, the following game modes will be implemented:

#### Primary Mode: Challenge Mode (Current)
- Color-based challenges ("Pop 5 RED balloons")
- Very gentle difficulty progression
- Celebration on completion

#### Calm/Zen Mode (Priority: High)
- **Description:** No challenges, no scoring, just peaceful balloon popping
- **Purpose:** Reduces cognitive load; pure sensory enjoyment
- **Audio:** Nature ambience (birds, gentle wind, water)
- **Pacing:** Slower balloon spawning, gentle movement
- **Use Case:** Patients having a difficult day, evening relaxation, those who find challenges stressful

#### Memory Matching Mode (Priority: Medium)
- **Description:** Simple shape/color matching mini-game
- **Mechanics:** Show a shape, find the matching balloon
- **Cognitive Target:** Short-term memory, visual recognition
- **Difficulty:** Very simple patterns, generous timing

#### Two-Player Mode (Priority: Medium)
- **Description:** Cooperative/competitive play for two players
- **Mechanics:**
  - Screen divided into two courts
  - Players knock balloons into each other's side
  - Can be cooperative (work together to pop) or playful competition
- **Requirements:**
  - Must detect and track two distinct players
  - Clear visual separation of play areas
  - Works with two people standing/sitting side by side
- **Social Benefit:** Encourages social interaction; can play with staff, family, or another resident
- **Technical Consideration:** MediaPipe can track multiple hands; need to distinguish between players

### 4.3 Visual Design Specifications

#### Nature-Focused Theme
```
Background Options:
├── Garden (default) - Soft greens, flowers, gentle sunlight
├── Beach - Calm ocean, sand, blue sky
├── Forest - Trees, dappled light, earth tones
└── Sky - Clouds, soft blue gradient, peaceful
```

#### Balloon Appearance
- **Shape:** Classic round party balloon with tied bottom
- **Size:** Large (minimum 100px diameter for visibility)
- **Colors:** Solid, saturated colors with color name labels
- **Animation:** Gentle float upward with subtle wobble
- **Pop Effect:** Colorful particle burst, satisfying "pop" sound

#### Hand Visualization
- **Style:** Friendly white cartoon gloves
- **Outline:** Teal/green accent color for visibility
- **Animation:** Subtle finger movement tracking
- **Feedback:** Brief glow or pulse on successful pop

### 4.4 Audio Design Specifications

#### Music
- **Era:** 1940s-1960s familiar melodies
- **Style:** Instrumental, gentle, nostalgic
- **Volume:** Background level, never overwhelming
- **Examples:** Classic jazz, big band, easy listening instrumentals
- **Implementation:** Royalty-free or licensed period-appropriate music

#### Sound Effects
| Sound | Description | Trigger |
|-------|-------------|---------|
| Pop | Satisfying balloon pop | Hand touches balloon |
| Success Chime | Pleasant ascending notes | Challenge completed |
| Celebration | Brief joyful fanfare | Level completed |
| Encouragement | Soft positive tone | Auto-help activated |
| Ambient | Nature sounds (optional) | Calm mode background |

#### Audio Settings
- Master volume slider (0-100%)
- Sound effects on/off toggle
- Music on/off toggle (future)
- Calm mode ambient sounds option

### 4.5 Feedback Systems

#### Pop Feedback (Multi-Sensory Burst)
When a balloon is popped:
1. **Visual:** Colorful particle explosion (8-12 particles)
2. **Audio:** Satisfying "pop" sound
3. **Screen:** Brief subtle flash/glow at pop location
4. **Optional:** Verbal praise ("Great!", "Wonderful!") for target balloons

#### Progress Feedback
- Large horizontal progress bar at top of screen
- Fills with color as target balloons are popped
- Clear contrast between filled and unfilled portions
- Subtle animation when progress increases

#### Celebration Feedback
On challenge completion:
- Confetti particle effect (2-3 seconds)
- Applause or chime sound
- Large "Wonderful!" or "Well done!" message
- Brief pause before next challenge

### 4.6 Auto-Help System

When a player appears to be struggling (detected via inactivity or low success rate):

#### Detection Triggers
- No balloon popped for 15+ seconds
- Multiple missed attempts (hands moving but not connecting)
- Very slow progress on current challenge

#### Help Responses (Progressive)
1. **Level 1 - Encouragement** (after 15 sec)
   - Display: "Take your time!"
   - Audio: Gentle encouraging tone

2. **Level 2 - Highlight** (after 30 sec)
   - Target balloons get subtle glow/pulse
   - Spawn rate of target color increases

3. **Level 3 - Slow Down** (after 45 sec)
   - Balloon speed decreases 50%
   - Fewer balloons on screen
   - Larger hit zones

4. **Level 4 - Simplify** (after 60 sec)
   - Only target-colored balloons spawn
   - Maximum hit zone size
   - Staff notification (if enabled)

#### Design Principle
Help is given automatically without drawing attention to struggle. The player should feel supported, not corrected.

### 4.7 Onboarding Experience

#### Playful Warm-Up Flow
```
[Camera Detected]
     │
     ▼
"Wave hello!"
     │   - Friendly cartoon hands appear
     │   - Player waves, hands mirror on screen
     │   - "There you are! Looking good!"
     ▼
"Let's practice!"
     │   - 3 large, slow balloons appear
     │   - "Touch the balloons to pop them!"
     │   - Player pops practice balloons
     │   - "Wonderful! You're a natural!"
     ▼
"Ready to play!"
     │   - Brief pause
     │   - First real challenge begins
```

#### Onboarding Principles
- Use warm, encouraging language
- Show, don't tell (visual demonstrations)
- Celebrate small successes ("You're a natural!")
- Keep it brief (under 30 seconds)
- Can be skipped by staff for returning players

### 4.8 Session End Experience

#### Celebration Focus
```
[Final Challenge Completed]
     │
     ▼
[Full-Screen Celebration]
     │   - Confetti burst
     │   - "You did wonderfully!" message
     │   - Applause sound effect
     │   - Duration: 3-4 seconds
     ▼
[Summary Screen]
     │   - "Great Session!" header
     │   - Large, friendly statistics:
     │     • Balloons popped: 47
     │     • Challenges completed: 8
     │     • Play time: 12 minutes
     │   - "You should feel proud!"
     ▼
[Options]
     │   - Large "Play Again" button
     │   - Smaller "Finished" button
     │   - Staff can review session data
```

### 4.9 Staff Interface

#### Quick Setup Controls
Located in easily accessible settings panel:

| Control | Type | Options |
|---------|------|---------|
| Volume | Slider | 0-100% |
| Difficulty | 3-Button Toggle | Easy / Normal / Gentle |
| Timer | Toggle | On / Off (default: Off) |
| Game Mode | Dropdown | Challenge / Calm / Memory |
| Start | Large Button | Begins session |

#### Design Requirements
- All controls reachable with one click/tap
- Large touch targets (minimum 44px)
- No nested menus or complex navigation
- Changes take effect immediately
- No login required

---

## 5. Design Principles

Based on established research in therapeutic game design, the following principles guide all design decisions:

### 5.1 Dementia-Specific Design Principles

#### Principle 1: Simplify Without Infantilizing
> "Design should simplify without infantilizing—focus on enjoyment of the activity rather than complexity."
> — [AssistEx Store Design Guidelines](https://assistexstore.com/blogs/news/tips-for-design-your-own-games-for-seniors-with-dementia)

**Implementation:**
- Use adult-appropriate visual themes (nature, gardens—not cartoons)
- Celebrate achievements without condescension
- Maintain dignified language in all UI text
- Provide real challenge within achievable bounds

#### Principle 2: Familiar and Calming Environments
> "Interventions commonly addressed sensory and cognitive impairments through simplified visual interfaces, calming and familiar environments."
> — [ScienceDirect VR Design Principles Study 2025](https://www.sciencedirect.com/science/article/pii/S2451958825001733)

**Implementation:**
- Nature-based backgrounds (gardens, beaches, forests)
- Soft, pleasant color palettes
- Gentle, non-startling audio
- Recognizable visual metaphors (balloons are universally understood)

#### Principle 3: Multisensory Stimulation
> "The game should provide multisensory stimulation, including lights, sounds and colors."
> — [Frontiers Psychology Cognitive Training Study](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2017.01837/full)

**Implementation:**
- Visual: Colorful balloons, particle effects, animations
- Auditory: Pop sounds, success chimes, ambient nature sounds
- Kinesthetic: Hand movement tracking, physical engagement

#### Principle 4: Sense of Accomplishment
> "The game tasks should give users a sense of accomplishment to motivate them to play regularly."
> — [Frontiers Psychology Expert Recommendations](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2017.01837/full)

**Implementation:**
- Every challenge is completable (no fail states)
- Generous time limits that don't create pressure
- Celebratory feedback on all completions
- Visual progress indicators

### 5.2 Accessibility Design Principles (WCAG + Game Accessibility Guidelines)

#### Visual Accessibility
| Guideline | Requirement | Implementation |
|-----------|-------------|----------------|
| Text Size | Minimum 32px for primary text | All UI uses 32px+ fonts |
| Contrast | WCAG AA minimum (4.5:1) | High contrast mode available |
| Color Independence | Don't rely solely on color | Color names displayed on/near balloons |
| Motion | Avoid rapid flashing (>3/sec) | All animations <3 flashes/sec |
| Target Size | Large interactive areas | Balloons: 70px+ hit zones |

#### Auditory Accessibility
| Guideline | Requirement | Implementation |
|-----------|-------------|----------------|
| Visual Alternatives | Audio cues have visual equivalents | All sounds paired with visuals |
| Volume Control | User-adjustable volume | Settings panel with slider |
| Mute Option | Ability to disable all sound | Sound toggle in settings |

#### Motor Accessibility
| Guideline | Requirement | Implementation |
|-----------|-------------|----------------|
| Input Flexibility | Accommodate limited mobility | Both hands tracked; either works |
| Timing Tolerance | No precise timing requirements | Generous hit detection windows |
| Fatigue Consideration | Seated play supported | No standing required |

#### Cognitive Accessibility
| Guideline | Requirement | Implementation |
|-----------|-------------|----------------|
| Clear Instructions | Simple, visible objectives | Challenge displayed prominently |
| Consistent Interface | Predictable UI patterns | Fixed UI positions throughout |
| Error Prevention | Minimize wrong actions | No penalty for popping wrong colors |
| Memory Independence | Don't require remembering | Current objective always visible |

**Source:** [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/) and [Xbox Accessibility Guidelines](https://learn.microsoft.com/en-us/gaming/accessibility/guidelines)

### 5.3 Dynamic Difficulty Adjustment (DDA)

> "By preventing extreme levels of difficulty or monotony, DDA promotes sustained user motivation throughout the rehabilitation process."
> — [Springer VR Cognitive Rehabilitation Review](https://link.springer.com/article/10.1007/s10055-024-00968-3)

#### Very Gentle Progression Model
For dementia patients, traditional difficulty curves are inappropriate. Instead:

| Level | Balloons | Speed | Challenge Type | Time Limit |
|-------|----------|-------|----------------|------------|
| 1-3 | 3-4 on screen | Very slow | Single color, low count | Unlimited |
| 4-6 | 4-5 on screen | Slow | Single color, medium count | Very generous |
| 7-10 | 5-6 on screen | Moderate | Simple variety | Generous |

**Key DDA Rules:**
- Never increase difficulty if player shows signs of struggle
- Allow regression to easier levels without stigma
- Celebrate effort, not just achievement
- Staff can manually adjust difficulty floor

---

## 5. Accessibility Requirements

### 5.1 WCAG 2.2 Compliance Targets

| Success Criterion | Level | Status | Notes |
|-------------------|-------|--------|-------|
| 1.4.3 Contrast (Minimum) | AA | Required | 4.5:1 for text |
| 1.4.6 Contrast (Enhanced) | AAA | Target | 7:1 for critical UI |
| 1.4.11 Non-text Contrast | AA | Required | 3:1 for UI components |
| 2.3.1 Three Flashes | A | Required | No rapid flashing |
| 2.5.5 Target Size | AAA | Required | 44x44px minimum touch targets |
| 3.2.3 Consistent Navigation | AA | Required | Fixed UI positions |
| 3.3.4 Error Prevention | AA | Required | No destructive actions |

### 5.2 Dementia-Specific Accessibility

Beyond standard accessibility:

| Requirement | Rationale | Implementation |
|-------------|-----------|----------------|
| No time pressure | Reduces anxiety, accommodates slow processing | Optional/very generous timers |
| Repetitive positive feedback | Reinforces engagement, aids memory | Consistent reward sounds/visuals |
| Minimal text | Reading comprehension often impaired | Icon-based UI, spoken prompts (future) |
| Familiar metaphors | Leverages preserved long-term memory | Universal concepts (balloons, colors) |
| No failure states | Failure causes frustration, disengagement | All challenges eventually completable |
| Staff override | Different patients have different needs | Manual settings accessible to staff |

---

## 6. Functional Requirements

### 6.1 Core Game Features

#### FR-001: Hand Tracking
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001.1 | Detect hands via webcam using MediaPipe | Critical |
| FR-001.2 | Track both hands simultaneously | Critical |
| FR-001.3 | Display visual hand indicators on screen | Critical |
| FR-001.4 | Generous collision detection (70px+ radius) | Critical |
| FR-001.5 | Handle tracking loss gracefully | High |

#### FR-002: Balloon Mechanics
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-002.1 | Spawn balloons at bottom of screen | Critical |
| FR-002.2 | Balloons float upward with gentle wobble | Critical |
| FR-002.3 | Multiple balloon colors with labels | Critical |
| FR-002.4 | Pop animation with particle effects | High |
| FR-002.5 | Pop sound effect on collision | High |
| FR-002.6 | Weight spawning toward target colors | Medium |

#### FR-003: Challenge System
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-003.1 | Color-based challenges ("Pop 5 RED balloons") | Critical |
| FR-003.2 | Clear challenge display at top of screen | Critical |
| FR-003.3 | Progress indicator for current challenge | Critical |
| FR-003.4 | Celebration on challenge completion | High |
| FR-003.5 | Very gentle difficulty progression | High |
| FR-003.6 | No fail states—challenges always completable | Critical |

#### FR-004: Scoring and Progress
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-004.1 | Points for popping target balloons | Medium |
| FR-004.2 | Bonus points for non-target balloons | Low |
| FR-004.3 | Session score tracking | Medium |
| FR-004.4 | High score persistence (localStorage) | Low |

### 6.2 Settings and Customization

#### FR-005: Visual Settings
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-005.1 | Contrast modes (Normal, High, Maximum) | High |
| FR-005.2 | Background themes (Garden, Beach, Forest, Sky) | Medium |
| FR-005.3 | Balloon size options (future) | Low |

#### FR-006: Audio Settings
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-006.1 | Master volume control | High |
| FR-006.2 | Sound effects toggle | High |
| FR-006.3 | Individual sound category controls (future) | Low |

#### FR-007: Gameplay Settings
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-007.1 | Difficulty presets (Very Easy, Easy, Moderate) | High |
| FR-007.2 | Timer toggle (on/off) | Medium |
| FR-007.3 | Session length presets | Medium |

### 6.3 Progress Tracking (New Feature)

#### FR-008: Session Analytics
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-008.1 | Track balloons popped per session | High |
| FR-008.2 | Track challenges completed per session | High |
| FR-008.3 | Track session duration | High |
| FR-008.4 | Track accuracy (target vs. non-target) | Medium |
| FR-008.5 | Store session history locally | High |
| FR-008.6 | Display session summary at end | High |

#### FR-009: Progress Reports
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-009.1 | Visual progress over time (chart) | Medium |
| FR-009.2 | Exportable session data (CSV/PDF) | Medium |
| FR-009.3 | Multi-user profile support | Medium |
| FR-009.4 | Simple metrics dashboard | Medium |

### 6.4 Game Variety (New Feature)

#### FR-010: Additional Game Modes
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-010.1 | Free Play mode (no challenges) | Medium |
| FR-010.2 | Counting mode ("Pop exactly 3") | Medium |
| FR-010.3 | Pattern mode (pop in sequence) | Low |
| FR-010.4 | Calm mode (slower, ambient) | High |

#### FR-011: Visual Variety
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-011.1 | Seasonal themes | Low |
| FR-011.2 | Additional nature backgrounds | Medium |
| FR-011.3 | Special balloon types (shapes, patterns) | Low |

### 6.5 Sensory Customization (New Feature)

#### FR-012: Enhanced Sensory Options
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-012.1 | Ambient background sounds (nature) | Medium |
| FR-012.2 | Reduced stimulation mode | High |
| FR-012.3 | Enhanced visual feedback mode | Medium |
| FR-012.4 | Haptic feedback via device (future) | Low |
| FR-012.5 | Animation intensity control | Medium |

---

## 7. Technical Specifications

### 7.1 Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Runtime | Browser (Chrome, Edge, Safari) | No installation required |
| Language | Vanilla JavaScript | Simple, maintainable, no build step |
| Hand Tracking | MediaPipe Hands | Industry standard, client-side |
| Rendering | HTML5 Canvas | Performant, widely supported |
| Audio | Web Audio API | Synthesized sounds, no asset loading |
| Styling | CSS3 with Variables | Theming support, accessibility |
| Storage | localStorage | Simple persistence, no backend |

### 7.2 Browser Requirements

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 88+ | Primary target |
| Edge | 88+ | Chromium-based |
| Safari | 14+ | iOS/macOS support |
| Firefox | 78+ | Limited testing |

### 7.3 Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Webcam | 720p | 1080p |
| Display | 1024x768 | 1920x1080 |
| CPU | Dual-core | Quad-core |
| RAM | 4GB | 8GB |
| Connection | N/A (offline capable) | Broadband for CDN |

### 7.4 File Structure

```
balloon-pop-game/
├── index.html              # Main HTML structure
├── PRD.md                  # This document
├── README.md               # Quick start guide
├── css/
│   └── styles.css          # Accessibility-first styling
├── js/
│   ├── main.js             # Entry point, initialization
│   ├── game.js             # Game state machine, main loop
│   ├── balloon.js          # Balloon entity, spawner
│   ├── challenges.js       # Challenge definitions, manager
│   ├── handTracking.js     # MediaPipe integration
│   ├── ui.js               # Screen management, HUD
│   ├── audio.js            # Sound synthesis
│   ├── analytics.js        # Session tracking (new)
│   └── profiles.js         # User profiles (new)
├── assets/
│   └── images/
│       └── logo.png        # Company branding
└── docs/
    ├── ACCESSIBILITY.md    # Accessibility documentation
    └── DEPLOYMENT.md       # Deployment guide
```

---

## 8. Game Mechanics

### 8.1 Core Loop

```
┌─────────────────────────────────────────────────────────┐
│                     GAME SESSION                        │
├─────────────────────────────────────────────────────────┤
│  1. Welcome Screen                                      │
│     └─> Press "Start" (large button)                    │
│                                                         │
│  2. Calibration                                         │
│     └─> "Wave your hands!" (confirm tracking works)     │
│                                                         │
│  3. Challenge Introduction                              │
│     └─> "Pop 5 RED balloons!" (3-second countdown)      │
│                                                         │
│  4. Active Play                                         │
│     ├─> Balloons spawn and float upward                 │
│     ├─> Player pops balloons with hand movements        │
│     ├─> Progress bar fills as targets are hit           │
│     └─> Challenge completes when target reached         │
│                                                         │
│  5. Challenge Complete                                  │
│     ├─> Celebration animation and sound                 │
│     └─> Brief pause, then next challenge                │
│                                                         │
│  6. Session End                                         │
│     ├─> Summary screen (balloons popped, time, score)   │
│     └─> "Play Again" or "Exit" options                  │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Balloon Behavior

| Property | Value | Notes |
|----------|-------|-------|
| Spawn Position | Bottom of screen, random X | Never spawn at extreme edges |
| Float Speed | 0.5-2.0 px/frame | Based on difficulty level |
| Wobble | Sinusoidal horizontal motion | Amplitude: 20px, natural feel |
| Hit Zone | 70px radius (generous) | Forgives imprecise movement |
| Despawn | When exiting top of screen | No penalty for missed balloons |

### 8.3 Color System

| Color | Hex | Name Displayed | Accessibility |
|-------|-----|----------------|---------------|
| Red | #E63946 | "RED" | High contrast |
| Blue | #457B9D | "BLUE" | Distinguishable |
| Yellow | #F4D35E | "YELLOW" | High visibility |
| Green | #2A9D8F | "GREEN" | Distinct from blue |
| Purple | #9B5DE5 | "PURPLE" | Distinct hue |
| Orange | #F77F00 | "ORANGE" | Warm tone |

**Note:** Color names are always displayed to support colorblind users and those with color perception difficulties.

### 8.4 Challenge Types

#### Current Challenges
| Type | Example | Difficulty |
|------|---------|------------|
| Single Color Count | "Pop 5 RED balloons" | Easy |
| Single Color Higher | "Pop 8 BLUE balloons" | Easy-Medium |
| Any Color Count | "Pop 10 balloons" | Very Easy |

#### Planned Challenges (Future)
| Type | Example | Difficulty |
|------|---------|------------|
| Two Colors | "Pop RED and BLUE" | Medium |
| Exact Count | "Pop exactly 3 GREEN" | Medium |
| Sequence | "Pop RED, then BLUE" | Hard |

### 8.5 Scoring (Optional Display)

| Action | Points | Notes |
|--------|--------|-------|
| Pop target balloon | 10 | Primary goal |
| Pop non-target balloon | 2 | Still rewarded |
| Complete challenge | 50 | Bonus |
| Complete level | 100 | Bonus |

**Design Note:** Scoring is secondary to experience. Consider hiding score for some users to reduce pressure.

---

## 9. User Experience Flow

### 9.1 First-Time User Flow

```
[Page Load]
     │
     ▼
[Loading Screen] ──── MediaPipe loads from CDN
     │
     ▼
[Welcome Screen]
     │   - Large "START" button
     │   - Settings gear icon
     │   - Simple instructions
     ▼
[Camera Permission]
     │   - Clear explanation why
     │   - Large "Allow" prompt
     ▼
[Calibration]
     │   - "Wave your hands!"
     │   - Visual confirmation when detected
     │   - "Great! Let's play!"
     ▼
[First Challenge]
     │   - Very easy (Pop 3 balloons)
     │   - Extended time limit
     │   - Extra celebration on success
     ▼
[Continue Playing...]
```

### 9.2 Returning User Flow

```
[Page Load]
     │
     ▼
[Welcome Screen] ──── Settings remembered
     │
     ▼
[Quick Calibration] ── Faster if recently played
     │
     ▼
[Resume Progress] ──── Start at appropriate level
```

### 9.3 Staff-Assisted Flow

```
[Staff Opens Game]
     │
     ▼
[Select/Create Profile] ── Choose resident
     │
     ▼
[Adjust Settings] ──── Difficulty, volume, contrast
     │
     ▼
[Start Session]
     │
     ▼
[Resident Plays] ──── Staff supervises
     │
     ▼
[Session Summary] ──── Staff reviews progress
     │
     ▼
[Export Data] ──── Optional reporting
```

---

## 10. Future Roadmap

### Phase 1: Polish & Analytics (Current Priority)
- [ ] Session analytics and tracking
- [ ] End-of-session summary screen
- [ ] User profile system (basic)
- [ ] Improved visual polish
- [ ] "Calm mode" with reduced stimulation

### Phase 2: Game Variety
- [ ] Free Play mode (no challenges)
- [ ] Additional background themes
- [ ] Counting-focused game mode
- [ ] Special event themes (holidays)

### Phase 3: Care Facility Features
- [ ] Multi-resident profile management
- [ ] Progress reporting dashboard
- [ ] Data export (CSV, PDF)
- [ ] Staff admin panel

### Phase 4: Advanced Features
- [ ] Voice instructions/prompts
- [ ] Additional languages
- [ ] Adaptive difficulty (AI-based)
- [ ] Integration with care management systems

### Phase 5: Platform Expansion
- [ ] Standalone tablet app
- [ ] Offline mode improvements
- [ ] Smart TV support
- [ ] VR/AR exploration (research)

---

## 11. Success Metrics

### 11.1 Engagement Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Average session length | 5-15 minutes | Analytics |
| Sessions per week per user | 3+ | Analytics |
| Challenge completion rate | >90% | Analytics |
| Return rate (7-day) | >60% | Analytics |

### 11.2 Accessibility Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Successful hand calibration | >95% | Analytics |
| Task completion without assistance | >80% | Staff feedback |
| User frustration incidents | <5% of sessions | Staff observation |

### 11.3 Therapeutic Metrics (Long-term)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Improved engagement scores | Measurable improvement | Clinical assessment |
| Motor coordination maintenance | No decline | Longitudinal tracking |
| Positive affect during play | >80% sessions | Staff observation |

### 11.4 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page load time | <5 seconds | Performance monitoring |
| Hand tracking FPS | >24 fps | In-game monitoring |
| Crash/error rate | <1% | Error logging |
| Browser compatibility | 95%+ | Testing matrix |

---

## 12. References

### Research Sources

1. **VR Design Principles for Dementia Care (2025)**
   - [ScienceDirect - Virtual reality design principles for psychophysiological interventions in dementia](https://www.sciencedirect.com/science/article/pii/S2451958825001733)

2. **Serious Games for Cognitive Rehabilitation**
   - [MDPI - Serious Games for Cognitive Rehabilitation in Older Adults: A Conceptual Framework](https://www.mdpi.com/2414-4088/8/8/64)

3. **Cognitive Training Game Development**
   - [Frontiers - Development and Evaluation of a Cognitive Training Game for Older People](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2017.01837/full)

4. **Serious Games for Dementia Care Review**
   - [PMC - A Review on Serious Games for Dementia Care in Ageing Societies](https://pmc.ncbi.nlm.nih.gov/articles/PMC7279699/)

5. **VR Games for Cognitive Rehabilitation**
   - [Springer - Virtual reality games for cognitive rehabilitation of older adults](https://link.springer.com/article/10.1007/s10055-024-00968-3)

### Accessibility Guidelines

6. **Game Accessibility Guidelines**
   - [Game Accessibility Guidelines - Full List](https://gameaccessibilityguidelines.com/full-list/)

7. **Xbox Accessibility Guidelines (XAGs)**
   - [Microsoft - Xbox Accessibility Guidelines](https://learn.microsoft.com/en-us/gaming/accessibility/guidelines)

8. **WCAG 2.2 Standards**
   - [W3C - Web Content Accessibility Guidelines](https://www.w3.org/TR/WCAG22/)

9. **Accessibility Trends in Gaming 2025**
   - [Game Designing - Accessibility Trends Shaping Inclusive Game Design](https://gamedesigning.org/learn/accessibility-trends-shaping-inclusive-game-design-in-2025/)

### Design Resources

10. **Dementia-Friendly Game Design Tips**
    - [AssistEx Store - Tips for designing games for seniors with dementia](https://assistexstore.com/blogs/news/tips-for-design-your-own-games-for-seniors-with-dementia)

11. **Care Considerations for Dementia**
    - [CareYaya - The Science Behind the Best Games for Dementia Prevention](https://www.careyaya.org/resources/blog/brain-games-dementia)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2025 | re-Action Health Technologies | Initial PRD creation |
| 1.1 | January 2025 | re-Action Health Technologies | Added comprehensive Design Decisions section with game modes, visual specs, audio design, feedback systems, auto-help system, onboarding flow, and staff interface requirements |

---

*This is a living document and will be updated as the product evolves.*
