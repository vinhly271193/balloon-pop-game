# Balloon Pop - Hand Tracking Game

A dementia-accessible browser game using webcam hand tracking.

**re-Action Health Technologies**

## How to Run

### Option 1: Local Server (Recommended)

1. Open Terminal
2. Navigate to this folder:
   ```bash
   cd ~/Desktop/re-Action\ Health\ Technologies
   ```
3. Start a local server:
   ```bash
   python3 -m http.server 8000
   ```
4. Open your browser to: **http://localhost:8000**

### Option 2: VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Open this folder in VS Code
3. Right-click on `index.html` and select "Open with Live Server"

## Requirements

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Webcam
- Internet connection (for MediaPipe hand tracking library)

## How to Play

1. Click **Start Game**
2. Allow camera access when prompted
3. Hold both hands up so the camera can see them
4. Follow the challenge instructions (e.g., "Pop 3 RED balloons!")
5. Move your hands over balloons to pop them
6. Complete the challenge before time runs out

## Features

- **Both-hand tracking** with visual feedback
- **Color-coded challenges** with progressive difficulty
- **Large, accessible UI** designed for dementia users
- **Forgiving collision detection** - easy to pop balloons
- **Positive reinforcement** - no failure states, just encouragement
- **Satisfying sound effects**

## Accessibility

- Extra-large text (32px minimum)
- High contrast colors
- Color names displayed alongside colors
- Simple, clear instructions
- Generous time limits
- Large balloon targets

## Levels

| Level | Challenge |
|-------|-----------|
| 1 | Pop 3 balloons (any color) |
| 2 | Pop 5 RED balloons |
| 3 | Pop 4 BLUE balloons |
| 4 | Pop 5 GREEN balloons |
| 5+ | Progressive difficulty with multi-color challenges |

## Technical Details

- **Hand Tracking**: MediaPipe Hands
- **Rendering**: HTML5 Canvas
- **Audio**: Web Audio API (synthesized sounds)
- **No build step required** - pure HTML/CSS/JavaScript

---

Created for re-Action Health Technologies

