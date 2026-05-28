# Garden Grow Mechanics Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the 1,388-line `js/garden/garden-bed.js` into state, interaction, and renderer layers, then drop in four new gameplay rules: auto-calibrated play zone, drag-and-release tools driven by open and closed hand pose, passive sunrise-to-sunset sun cycle, and droopy-but-never-dying plants.

**Architecture:** Vanilla JS, no build step, `<script>` tags in `index.html`. New `js/hand-pose.js` and `js/play-zone.js` sit beside `js/handTracking.js`. Inside `js/garden/`, new files `garden-state.js`, `garden-interaction.js`, `garden-renderer.js`, and `sun-cycle.js` are added alongside the existing modules. `garden-bed.js` is rewritten as a thin coordinator under 200 lines. Existing files (`plant-pot.js`, `plant-needs.js`, `tools.js`) get targeted edits only.

**Tech Stack:** HTML5 Canvas 2D, MediaPipe Hands (legacy `@mediapipe/hands` via CDN), Web Audio API. No tests, no bundler, no npm. Live build runs on GitHub Pages at https://vinhly271193.github.io/balloon-pop-game/.

**Spec:** [docs/superpowers/specs/2026-05-28-garden-grow-mechanics-revamp-design.md](../specs/2026-05-28-garden-grow-mechanics-revamp-design.md)

**Execution model:** Orchestrated from the main session. Phases 1, 5, and 6 fan out into three parallel subagents. Phases 2, 3, 4 are serial because each builds on the previous. After every phase, run the smoke checklist in the browser, commit, push to `main`, confirm the GitHub Pages build picks it up.

**Copy rules across all files, commits, and comments:** British spelling. No em-dashes. No "It's not X, it's Y" patterns. No AI tropes.

---

## File map

**New files**

| Path | Phase | Purpose |
|---|---|---|
| `js/hand-pose.js` | 1 | Open/closed classifier from MediaPipe landmarks |
| `js/play-zone.js` | 1 | Auto-calibrated active play rectangle, raw-to-canvas coord mapping |
| `js/garden/sun-cycle.js` | 1 | Sunrise-to-sunset progress, sun position, sky gradient, growth multiplier |
| `js/garden/garden-state.js` | 2 | Pure state: zones, pots, tools, scores, droop flags |
| `js/garden/garden-renderer.js` | 3 | All canvas drawing, reads state, writes nothing |
| `js/garden/garden-interaction.js` | 4 | Hand input to state changes: grab, release, apply, hover, harvest |

**Existing files modified**

| Path | Phases | Change |
|---|---|---|
| `index.html` | 1, 5 | Add new `<script>` tags. Rename calibration screen heading to "Wave to Start". |
| `js/garden/garden-bed.js` | 2, 3, 4, 5 | Progressively gutted into the new modules. Ends under 200 lines. |
| `js/garden/plant-needs.js` | 5 | Remove `sun` field. Water and food only. |
| `js/garden/plant-pot.js` | 6 | Add `drooped` flag, lean transform on draw, happy-bounce animation. |
| `js/game.js` | 5 | Wire `playZone.calibrate` into the calibration completion. Wire `sunCycle.update` into the round loop. Rename `GameState.CALIBRATION` label-facing copy. |
| `js/ui.js` | 5 | Update calibration screen text references if any. |
| `css/styles.css` | 5 | Update `.calibration-title` content if the class name changes, otherwise no-op. |

**Manual smoke checklist (run after every phase)**

In a fresh browser tab on https://vinhly271193.github.io/balloon-pop-game/ (after the push lands):

1. Page loads with no console errors.
2. Solo: Welcome to Wave to Start to first round. Pick up seed, plant in pot, water, harvest. Open dev tools, confirm no red errors.
3. Co-op (2 players): both gloves render in different colours. Two-hand pickup of two different tools works.
4. Competitive (2 players): split-zone scoring works, each side shows its own score.
5. Phase-specific check (listed in each phase below).

---

## Phase 1: Scaffolding, no behaviour change

**Goal:** Three new module files exist, are loaded by `index.html`, and define empty-but-callable APIs that compile without errors. Game behaviour does not change.

**Parallelism:** Three subagents in parallel. Tasks 1, 2, 3 are independent (different new files).

### Task 1: Create `js/hand-pose.js`

**Files:**
- Create: `js/hand-pose.js`

- [ ] **Step 1: Create the file with full content**

Write `js/hand-pose.js`:

```javascript
/**
 * Hand Pose Classifier
 * Reads MediaPipe Hands landmarks and reports whether a hand is open or closed.
 * Edge events (grab, release) come from getGrabEvent().
 *
 * No dependencies on other game modules.
 */

const HandPose = {
    // Hysteresis band: a finger has to cross it fully before the state flips.
    OPEN_RATIO: 0.55,
    CLOSED_RATIO: 0.40,

    /**
     * Classify a single hand as 'open' or 'closed' from its 21-landmark array.
     * landmarks[0] is the wrist. Fingertips are 4, 8, 12, 16, 20. MCP joints are 5, 9, 13, 17.
     *
     * Strategy: average fingertip-to-palm distance, normalised by palm width.
     * Open hand: ratio > OPEN_RATIO. Closed hand: ratio < CLOSED_RATIO. In between: stay where you were.
     *
     * @param {Array<{x:number,y:number,z:number}>} landmarks
     * @param {'open'|'closed'|null} prev previous classification for hysteresis
     * @returns {'open'|'closed'}
     */
    classify(landmarks, prev) {
        if (!landmarks || landmarks.length < 21) return prev || 'open';
        const wrist = landmarks[0];
        const indexMCP = landmarks[5];
        const pinkyMCP = landmarks[17];
        const palmWidth = Math.hypot(indexMCP.x - pinkyMCP.x, indexMCP.y - pinkyMCP.y) || 0.001;

        const tipIds = [8, 12, 16, 20];
        let sum = 0;
        for (const id of tipIds) {
            const tip = landmarks[id];
            const d = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
            sum += d;
        }
        const avgTipDist = sum / tipIds.length;
        const ratio = avgTipDist / palmWidth;

        if (ratio > this.OPEN_RATIO) return 'open';
        if (ratio < this.CLOSED_RATIO) return 'closed';
        return prev || 'open';
    },

    /**
     * Edge detector. Returns 'grab' on open-to-closed, 'release' on closed-to-open, else null.
     * @param {'open'|'closed'|null} prev
     * @param {'open'|'closed'} current
     * @returns {'grab'|'release'|null}
     */
    getGrabEvent(prev, current) {
        if (prev === 'open' && current === 'closed') return 'grab';
        if (prev === 'closed' && current === 'open') return 'release';
        return null;
    },
};

window.HandPose = HandPose;
```

- [ ] **Step 2: Add `<script>` tag to `index.html`**

In `index.html`, after the `<script src="js/handTracking.js"></script>` line (currently around line 437), add:

```html
<script src="js/hand-pose.js"></script>
```

- [ ] **Step 3: Verify the file loads in the browser**

Open the live site. In dev tools console, run `window.HandPose.classify(null, 'open')` and confirm it returns `'open'`. Run `window.HandPose.getGrabEvent('open', 'closed')` and confirm it returns `'grab'`. No red console errors during page load.

### Task 2: Create `js/play-zone.js`

**Files:**
- Create: `js/play-zone.js`

- [ ] **Step 1: Create the file with full content**

Write `js/play-zone.js`:

```javascript
/**
 * Play Zone
 * Auto-calibrated active rectangle inside the camera frame.
 * Maps raw MediaPipe normalised coords (0 to 1 across the camera frame) into
 * canvas coordinates that fill the active play area.
 *
 * Calibrated once at "Wave to Start" by sampling where the player's hands sit.
 */

class PlayZone {
    constructor() {
        // Normalised raw-frame bounds (0 to 1). Defaults span the full frame
        // so the game is playable even if calibration is skipped.
        this.minX = 0;
        this.maxX = 1;
        this.minY = 0;
        this.maxY = 1;
        this.calibrated = false;
    }

    /**
     * Calibrate from a snapshot of recent wrist positions.
     * Expands the zone around the median wrist position so the player's natural
     * resting hand height becomes the centre of the play area.
     *
     * @param {Array<{x:number,y:number}>} wristSamples normalised camera coords
     */
    calibrate(wristSamples) {
        if (!wristSamples || wristSamples.length === 0) return;

        const xs = wristSamples.map(s => s.x).sort((a, b) => a - b);
        const ys = wristSamples.map(s => s.y).sort((a, b) => a - b);
        const medX = xs[Math.floor(xs.length / 2)];
        const medY = ys[Math.floor(ys.length / 2)];

        // Generous box around the median, clamped to the camera frame.
        const halfW = 0.45;
        const halfH = 0.35;
        this.minX = Math.max(0, medX - halfW);
        this.maxX = Math.min(1, medX + halfW);
        this.minY = Math.max(0, medY - halfH);
        this.maxY = Math.min(1, medY + halfH);
        this.calibrated = true;
    }

    /**
     * Map a raw normalised camera coord into canvas pixel coords.
     * The zone fills the full canvas, so a hand at the edge of the play zone
     * lands at the edge of the canvas.
     *
     * @param {number} rawX 0 to 1
     * @param {number} rawY 0 to 1
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     * @returns {{x:number, y:number}}
     */
    mapPoint(rawX, rawY, canvasWidth, canvasHeight) {
        const w = this.maxX - this.minX || 1;
        const h = this.maxY - this.minY || 1;
        const nx = (rawX - this.minX) / w;
        const ny = (rawY - this.minY) / h;
        const cx = Math.max(0, Math.min(1, nx)) * canvasWidth;
        const cy = Math.max(0, Math.min(1, ny)) * canvasHeight;
        return { x: cx, y: cy };
    }

    /**
     * Optional debug outline for the calibration screen.
     */
    draw(ctx, canvasWidth, canvasHeight) {
        if (!this.calibrated) return;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
    }
}

window.playZone = new PlayZone();
```

- [ ] **Step 2: Add `<script>` tag to `index.html`**

Right after the `js/hand-pose.js` line (added in Task 1), add:

```html
<script src="js/play-zone.js"></script>
```

- [ ] **Step 3: Verify in browser**

Open the live site. In console, run `window.playZone.calibrated` (returns `false`), then `window.playZone.mapPoint(0.5, 0.5, 800, 600)` (returns `{x: 400, y: 300}`). No console errors.

### Task 3: Create `js/garden/sun-cycle.js`

**Files:**
- Create: `js/garden/sun-cycle.js`

- [ ] **Step 1: Create the file with full content**

Write `js/garden/sun-cycle.js`:

```javascript
/**
 * Sun Cycle
 * Drives the round timer visually: sunrise at the start, midday in the middle,
 * sunset at the end. Plants grow faster when the sun is high.
 *
 * Replaces the old player-driven sun bar entirely. There is no top-up gesture.
 */

class SunCycle {
    constructor() {
        this.progress = 0; // 0 at sunrise, 0.5 at midday, 1 at sunset
    }

    /**
     * @param {number} roundElapsed seconds since the round started
     * @param {number} roundDuration total round length in seconds
     */
    update(roundElapsed, roundDuration) {
        if (roundDuration <= 0) {
            this.progress = 0;
            return;
        }
        this.progress = Math.max(0, Math.min(1, roundElapsed / roundDuration));
    }

    /**
     * Sun position in canvas coords. Arcs from bottom-left at sunrise,
     * through top-centre at midday, to bottom-right at sunset.
     *
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     * @returns {{x:number, y:number, radius:number}}
     */
    getSunPosition(canvasWidth, canvasHeight) {
        const t = this.progress;
        const x = canvasWidth * t;
        const y = canvasHeight * 0.7 - Math.sin(t * Math.PI) * canvasHeight * 0.55;
        const radius = 60 + Math.sin(t * Math.PI) * 10;
        return { x, y, radius };
    }

    /**
     * Sky gradient: warm peach at dawn and dusk, soft blue at midday.
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     * @returns {CanvasGradient}
     */
    getSkyGradient(ctx, canvasWidth, canvasHeight) {
        const t = this.progress;
        // Distance from midday (0 = midday, 1 = dawn or dusk)
        const dist = Math.abs(t - 0.5) * 2;

        const top = this._mixColour([135, 206, 235], [255, 183, 119], dist); // sky blue to warm peach
        const bot = this._mixColour([224, 247, 250], [255, 215, 175], dist); // soft cyan to soft peach

        const g = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        g.addColorStop(0, `rgb(${top[0]}, ${top[1]}, ${top[2]})`);
        g.addColorStop(1, `rgb(${bot[0]}, ${bot[1]}, ${bot[2]})`);
        return g;
    }

    /**
     * Plants grow at 0.5x at dawn and dusk, 1.5x at midday.
     * @returns {number}
     */
    getGrowthMultiplier() {
        return 0.5 + Math.sin(this.progress * Math.PI) * 1.0;
    }

    _mixColour(a, b, t) {
        return [
            Math.round(a[0] + (b[0] - a[0]) * t),
            Math.round(a[1] + (b[1] - a[1]) * t),
            Math.round(a[2] + (b[2] - a[2]) * t),
        ];
    }
}

window.sunCycle = new SunCycle();
```

- [ ] **Step 2: Add `<script>` tag to `index.html`**

In `index.html`, after `<script src="js/garden/plant-needs.js"></script>` and before `<script src="js/garden/effects.js"></script>`, add:

```html
<script src="js/garden/sun-cycle.js"></script>
```

- [ ] **Step 3: Verify in browser**

Open the live site. In console, run `window.sunCycle.update(30, 60); window.sunCycle.getGrowthMultiplier()` (returns 1.5 at midday). No console errors.

### Phase 1 Wrap-up

- [ ] **Step 4: Run smoke checklist**

Open live site (after push), confirm all three modes still play exactly as before. No console errors. Solo, co-op, competitive happy-paths still work.

- [ ] **Step 5: Commit and push**

```bash
git add js/hand-pose.js js/play-zone.js js/garden/sun-cycle.js index.html
git commit -m "$(cat <<'EOF'
feat: scaffold hand-pose, play-zone, and sun-cycle modules

Three new modules wired into index.html but not yet called from gameplay.
Sets up the foundation for the mechanics revamp (drag-and-release with
hand pose, auto-calibrated play zone, passive sunrise-to-sunset sun).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin main
```

---

## Phase 2: Extract `gardenState`

**Goal:** All state fields move out of `js/garden/garden-bed.js` into a new `js/garden/garden-state.js`. `garden-bed.js` keeps the same outward API (`update`, `draw`, `init`, `reset`, mode switches, scoring queries) but reads and writes through `gardenState`. Behaviour does not change.

**Parallelism:** None. This is one task, executed by a single subagent.

### Task 4: Create `js/garden/garden-state.js` and route reads/writes through it

**Files:**
- Create: `js/garden/garden-state.js`
- Modify: `js/garden/garden-bed.js`
- Modify: `index.html` (add script tag)

- [ ] **Step 1: Read the current state surface of `garden-bed.js`**

Read `js/garden/garden-bed.js` end-to-end. List every instance field set in the constructor (look for `this.X = ...`). List every method that mutates one of those fields. Group them into:

- Plant state: `plantPots`, `plantPotsMap`, the per-zone pots
- Tool state: `wateringCan`, `seeds`, `fertilizerBag`, the per-zone equivalents, `goldenWateringCans`, `heldItem`, `heldItemsMap`
- Needs state: `plantNeeds`, `plantNeedsMap`, `sunArea`
- Score state: `score`, `playerScores`
- Mode state: `gameMode`, `playerCount`, `dividerX`
- Animation state: `roundGeneration`, interaction timers (`waterInteractionTime`, `foodInteractionTime`, `sunInteractionTime` and their `Map` variants)

- [ ] **Step 2: Create the `GardenState` class**

Write `js/garden/garden-state.js`:

```javascript
/**
 * Garden State
 * Pure state container for the garden play loop. No drawing, no input.
 * GardenBed delegates all data reads and writes here.
 *
 * Shape:
 *  zones: Map<zoneKey, ZoneState>
 *  mode: 'solo' | 'coop' | 'competitive'
 *  playerCount: 1 | 2
 *  dividerX: number (pixel coord of the competitive divider)
 *  roundGeneration: number (incremented on reset, used to guard async callbacks)
 *
 * ZoneState shape:
 *  pots: PlantPot[]
 *  tools: { seeds: DraggableSeed[], wateringCan: WateringCan, fertilizerBag: FertilizerBag }
 *  needs: PlantNeeds
 *  score: number
 *  heldItem: DraggableSeed | WateringCan | FertilizerBag | null
 *  goldenWateringCan: WateringCan | null
 *  interactionTimers: { water: number, food: number, sun: number }
 *  droopTimers: Map<potIndex, number>
 *  bounceTimers: Map<potIndex, number>
 */

class GardenState {
    constructor() {
        this.zones = new Map();
        this.mode = 'solo';
        this.playerCount = 1;
        this.dividerX = 0.5;
        this.roundGeneration = 0;
        this.sunArea = null; // Phase 5 removes this; keep for now to preserve behaviour.
    }

    /**
     * Create or reset a zone for the given key.
     */
    initZone(zoneKey, { pots, tools, needs }) {
        this.zones.set(zoneKey, {
            pots,
            tools,
            needs,
            score: 0,
            heldItem: null,
            goldenWateringCan: null,
            interactionTimers: { water: 0, food: 0, sun: 0 },
            droopTimers: new Map(),
            bounceTimers: new Map(),
        });
    }

    getZone(zoneKey) {
        return this.zones.get(zoneKey);
    }

    getAllZoneKeys() {
        return Array.from(this.zones.keys());
    }

    setMode(mode, playerCount) {
        this.mode = mode;
        this.playerCount = playerCount;
    }

    reset() {
        this.zones.clear();
        this.roundGeneration += 1;
    }
}

window.gardenState = new GardenState();
```

- [ ] **Step 3: Add `<script>` tag to `index.html`**

In `index.html`, immediately after `<script src="js/garden/sun-cycle.js"></script>` (added in Task 3), add:

```html
<script src="js/garden/garden-state.js"></script>
```

`<script>` order matters: `garden-state.js` must load before `garden-bed.js`. Confirm the order in `index.html` matches: constants → plant-pot → tools → plant-needs → sun-cycle → garden-state → effects → power-ups → garden-bed.

- [ ] **Step 4: Refactor `garden-bed.js` to delegate to `gardenState`**

Open `js/garden/garden-bed.js`. For each state field identified in Step 1, replace direct reads and writes with calls to `gardenState`:

- Replace `this.plantPotsMap.get(zk)` style reads with `gardenState.getZone(zk).pots`.
- Replace `this.heldItem = item` style writes with `gardenState.getZone(zk).heldItem = item` (shared mode uses the zone key `'shared'`).
- For mode setting, replace direct `this.gameMode = mode` with `gardenState.setMode(mode, playerCount)`.
- `garden-bed.js` keeps the outward methods (`init`, `update`, `draw`, `reset`, `setMode`, `getScore`, etc.) and their existing signatures. Only the inside changes.

The aim: every `this.X` field used elsewhere in the codebase becomes a getter on `GardenBed` that proxies through to `gardenState`. Public API of `gardenBed` does not change.

Add this proxy pattern at the top of `GardenBed`:

```javascript
get gameMode() { return gardenState.mode; }
get playerCount() { return gardenState.playerCount; }
get dividerX() { return gardenState.dividerX; }
set dividerX(v) { gardenState.dividerX = v; }
get roundGeneration() { return gardenState.roundGeneration; }
```

For backwards compatibility, keep `getZoneKeys`, `getZoneNeeds`, `getZonePot` etc. as thin proxies that hit `gardenState`.

- [ ] **Step 5: Manual smoke check**

Open the live site in a fresh tab. Run the smoke checklist for all three modes. Confirm no behaviour change. If a regression appears, the most likely cause is a missed `this.X` read in the renderer half of `garden-bed.js`. Search for `this.plantPots`, `this.heldItem`, `this.wateringCan`, `this.sunArea` and confirm each is now a getter or moved to `gardenState`.

- [ ] **Step 6: Commit and push**

```bash
git add js/garden/garden-state.js js/garden/garden-bed.js index.html
git commit -m "$(cat <<'EOF'
refactor: extract garden state into GardenState module

State fields previously held on GardenBed now live on a dedicated
GardenState container. GardenBed keeps the same outward API and
proxies reads and writes through gardenState. No behaviour change.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin main
```

---

## Phase 3: Extract `gardenRenderer`

**Goal:** All canvas drawing moves out of `garden-bed.js` into a new `js/garden/garden-renderer.js`. `garden-bed.js.draw(ctx)` becomes a thin delegate. Behaviour does not change.

**Parallelism:** None. Serial after Phase 2.

### Task 5: Create `js/garden/garden-renderer.js` and move all draw code

**Files:**
- Create: `js/garden/garden-renderer.js`
- Modify: `js/garden/garden-bed.js`
- Modify: `index.html`

- [ ] **Step 1: Inventory the draw code in `garden-bed.js`**

Read `garden-bed.js` end-to-end. List every method whose name starts with `draw` or that calls `ctx.X` on the canvas context. Common candidates:

- `draw(ctx)` (the public entry point)
- `drawCompetitiveDivider(ctx)`
- `drawZoneBackgrounds(ctx)`
- `drawNeedsBars(ctx)`
- Anything calling `pot.draw(ctx)`, `tool.draw(ctx)`, `sunArea.draw(ctx)`

- [ ] **Step 2: Create the `GardenRenderer` class**

Write `js/garden/garden-renderer.js`:

```javascript
/**
 * Garden Renderer
 * Draws the full garden scene each frame. Reads from gardenState and sunCycle.
 * Writes nothing back.
 *
 * Draw order (back to front):
 *  1. Sky gradient (Phase 5 wires this to sunCycle; for now, draws nothing)
 *  2. Sun sprite (Phase 5)
 *  3. Ground band (Phase 5)
 *  4. Competitive divider
 *  5. Plant pots and plants
 *  6. Tools at home positions
 *  7. Held tools at hand position
 *  8. Needs bars per zone
 *  9. Floating feedback effects
 */

class GardenRenderer {
    /**
     * Draw the full garden frame.
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        const mode = gardenState.mode;

        // Sky and ground placeholder; Phase 5 fills these from sunCycle.

        if (mode === 'competitive') {
            this._drawDivider(ctx);
        }

        for (const zoneKey of gardenState.getAllZoneKeys()) {
            const zone = gardenState.getZone(zoneKey);
            this._drawZone(ctx, zone, zoneKey);
        }

        // Sun area survives Phase 3 unchanged; Phase 5 removes it.
        if (gardenState.sunArea) {
            gardenState.sunArea.draw(ctx);
        }
    }

    _drawDivider(ctx) {
        const x = gardenState.dividerX * ctx.canvas.width;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.setLineDash([12, 8]);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ctx.canvas.height);
        ctx.stroke();
        ctx.restore();
    }

    _drawZone(ctx, zone, zoneKey) {
        // Draw pots and plants
        for (const pot of zone.pots) {
            pot.draw(ctx);
        }

        // Draw seeds at home positions (held seeds follow the hand and are drawn last)
        for (const seed of zone.tools.seeds) {
            if (!seed.isBeingHeld) seed.draw(ctx);
        }

        // Draw watering can and fertiliser at home position when not held
        if (zone.tools.wateringCan && !zone.tools.wateringCan.isBeingHeld) {
            zone.tools.wateringCan.draw(ctx);
        }
        if (zone.tools.fertilizerBag && !zone.tools.fertilizerBag.isBeingHeld) {
            zone.tools.fertilizerBag.draw(ctx);
        }
        if (zone.goldenWateringCan) {
            zone.goldenWateringCan.draw(ctx);
        }

        // Held item draws on top
        if (zone.heldItem) {
            zone.heldItem.draw(ctx);
        }

        // Needs bars
        if (zone.needs) {
            zone.needs.draw(ctx, this._needsBarPosition(zoneKey, ctx).x, this._needsBarPosition(zoneKey, ctx).y);
        }
    }

    _needsBarPosition(zoneKey, ctx) {
        // Match existing positions used by garden-bed.js before this refactor.
        // Vinh: confirm the actual x/y from current code before swapping in. Defaults:
        if (zoneKey === 'p1') return { x: ctx.canvas.width - 240, y: 20 };
        if (zoneKey === 'p2') return { x: 20, y: 20 };
        return { x: 20, y: 20 };
    }
}

window.gardenRenderer = new GardenRenderer();
```

- [ ] **Step 3: Add `<script>` tag to `index.html`**

After `<script src="js/garden/garden-state.js"></script>`, add:

```html
<script src="js/garden/garden-renderer.js"></script>
```

- [ ] **Step 4: Replace `garden-bed.js.draw(ctx)` with a delegate**

In `js/garden/garden-bed.js`, find the `draw(ctx)` method. Replace its entire body with:

```javascript
draw(ctx) {
    gardenRenderer.draw(ctx);
}
```

Delete all `_drawX` helper methods that have moved into `gardenRenderer`. If a helper draws something the renderer does not yet cover, leave a TODO comment and move the body into a private method on `gardenRenderer` before deleting from `garden-bed.js`. The end state: `garden-bed.js` has zero references to `ctx.X` other than the one-line delegate.

- [ ] **Step 5: Reconcile needs-bar positions**

Open the old `draw` body before deletion. Note the exact x and y used for each `needs.draw(ctx, x, y)` call. Update `GardenRenderer._needsBarPosition` to match those values exactly. This step exists because the placeholder positions in the renderer file may not match the originals.

- [ ] **Step 6: Manual smoke check**

Reload the live site. Verify visual parity in solo, co-op, and competitive. The needs bars should sit in exactly the same spot. The competitive divider should look identical. The plant pots and tools should render in the same positions.

- [ ] **Step 7: Commit and push**

```bash
git add js/garden/garden-renderer.js js/garden/garden-bed.js index.html
git commit -m "$(cat <<'EOF'
refactor: extract garden rendering into GardenRenderer module

All canvas drawing moves out of garden-bed.js into a dedicated
GardenRenderer that reads from gardenState. GardenBed.draw(ctx) is
now a one-line delegate. No visual change.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin main
```

---

## Phase 4: Extract `gardenInteraction`

**Goal:** All hand-input-to-state-change logic moves out of `garden-bed.js` into a new `js/garden/garden-interaction.js`. `garden-bed.js.update(...)` becomes a thin delegate. Behaviour does not change yet (pose-driven grab arrives in Phase 5).

**Parallelism:** None. Serial after Phase 3.

### Task 6: Create `js/garden/garden-interaction.js` and move all input logic

**Files:**
- Create: `js/garden/garden-interaction.js`
- Modify: `js/garden/garden-bed.js`
- Modify: `index.html`

- [ ] **Step 1: Inventory the input code in `garden-bed.js`**

Read `garden-bed.js`. List every method that takes hand positions, hand collision points, or otherwise reacts to player input. Common candidates:

- `update(deltaTime, handPositions)`
- `processHandInteraction(handPos, zoneKey)`
- Pickup branches (`seed.pickup`, `wateringCan.pickup`, `fertilizerBag.pickup`)
- Release branches (`releaseItem`, `dropToHome` style logic)
- Sun hover timer accumulation
- Watering and fertilising timers, harvest detection

- [ ] **Step 2: Create the `GardenInteraction` class**

Write `js/garden/garden-interaction.js`:

```javascript
/**
 * Garden Interaction
 * Maps hand input to state changes on gardenState. Owns pickup, release,
 * apply, hover, harvest. Reads gardenState; writes back via its methods.
 *
 * Phase 4 preserves the existing touch-to-pickup behaviour. Phase 5
 * swaps the entry point over to pose-driven grab and release.
 */

class GardenInteraction {
    constructor() {
        // Per-hand pose memory for Phase 5
        this._posePrev = new Map(); // handId -> 'open'|'closed'|null
    }

    /**
     * Top-level entry: process all hands for this frame.
     * @param {number} deltaTime seconds
     * @param {Array} handPositions collision points from handTracker
     */
    process(deltaTime, handPositions) {
        if (!handPositions || handPositions.length === 0) return;

        for (const hand of handPositions) {
            const zoneKey = this._zoneForHand(hand);
            this._processHand(hand, zoneKey, deltaTime);
        }
    }

    _zoneForHand(hand) {
        // Mirror existing behaviour: shared mode uses 'shared'; competitive uses 'p1'/'p2'.
        const mode = gardenState.mode;
        if (mode !== 'competitive') return 'shared';
        return hand.playerId === 1 ? 'p1' : 'p2';
    }

    _processHand(hand, zoneKey, deltaTime) {
        // Move the body of the old processHandInteraction here, retaining its existing semantics.
        // Read from gardenState.getZone(zoneKey) instead of `this.X`.
    }
}

window.gardenInteraction = new GardenInteraction();
```

- [ ] **Step 3: Move the body of `processHandInteraction` into `_processHand`**

In `garden-bed.js`, locate `processHandInteraction(handPos, zoneKey)`. Copy its entire body into `GardenInteraction._processHand(hand, zoneKey, deltaTime)`. Replace every `this.X` reference with the equivalent on `gardenState.getZone(zoneKey)`. Tool references (`seed`, `wateringCan`, `fertilizerBag`) come from `zone.tools`. Timers (`sunInteractionTime`, `waterInteractionTime`, `foodInteractionTime`) come from `zone.interactionTimers`. Held item comes from `zone.heldItem`. Pots come from `zone.pots`. Needs come from `zone.needs`. Maintain the existing behaviour exactly. No new logic in this task.

- [ ] **Step 4: Add `<script>` tag to `index.html`**

After `<script src="js/garden/garden-renderer.js"></script>`, add:

```html
<script src="js/garden/garden-interaction.js"></script>
```

- [ ] **Step 5: Replace `garden-bed.js.update(...)` with a delegate**

In `garden-bed.js`, find the `update(deltaTime, handPositions, ...)` method. Replace its body with:

```javascript
update(deltaTime, handPositions) {
    this.lastDeltaTime = deltaTime;

    // Update each zone's needs
    for (const zk of gardenState.getAllZoneKeys()) {
        const zone = gardenState.getZone(zk);
        if (zone.needs) zone.needs.update(deltaTime);
        for (const pot of zone.pots) pot.update(deltaTime, zone.needs);
    }

    // Update sun area (Phase 5 removes this)
    if (gardenState.sunArea) gardenState.sunArea.update(deltaTime);

    // Update tools that need per-frame ticks (watering can pour animation, etc.)
    for (const zk of gardenState.getAllZoneKeys()) {
        const zone = gardenState.getZone(zk);
        if (zone.tools.wateringCan && zone.tools.wateringCan.update) {
            zone.tools.wateringCan.update(deltaTime);
        }
        if (zone.goldenWateringCan && zone.goldenWateringCan.update) {
            zone.goldenWateringCan.update(deltaTime);
        }
    }

    // Apply DDA every frame (per existing behaviour)
    if (typeof this.applyDDA === 'function') this.applyDDA();

    // Hand interaction
    gardenInteraction.process(deltaTime, handPositions);
}
```

- [ ] **Step 6: Manual smoke check**

Reload the live site. Solo: pick up a seed, plant, water, fertilise, harvest. Co-op: two hands picking up two different tools at once. Competitive: each side independently scores. Sun bar still depletes and refills with hover (Phase 5 replaces this). No console errors.

- [ ] **Step 7: Commit and push**

```bash
git add js/garden/garden-interaction.js js/garden/garden-bed.js index.html
git commit -m "$(cat <<'EOF'
refactor: extract garden input handling into GardenInteraction module

All hand-to-state input logic moves out of garden-bed.js into a
dedicated GardenInteraction module. GardenBed.update is now a thin
coordinator that ticks state, tools, and hands off interaction to
the new module. No behaviour change.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin main
```

---

## Phase 5: Wire the new mechanics

**Goal:** The four gameplay changes go live. Pose-driven grab and release. Play-zone-mapped hand positions. Sunrise-to-sunset sun. Sun bar gone from `PlantNeeds`. Calibration screen renamed "Wave to Start".

**Parallelism:** Three subagents in parallel. Tasks 7, 8, 9 are independent.

### Task 7: Pose-driven grab and release in `GardenInteraction`

**Files:**
- Modify: `js/garden/garden-interaction.js`
- Modify: `js/handTracking.js` (expose per-hand landmarks alongside collision points)

- [ ] **Step 1: Surface landmarks on handPositions in `handTracking.js`**

In `js/handTracking.js`, locate the `onResults` method (around line 164) where collision points are pushed. Each collision point already has `landmark` (a single 3D point). Add `handId` (string, e.g. `"left"` or `"right"` or `"p1"`/`"p2"` depending on mode) and the full `landmarks` array on each collision point or on a single representative point per hand.

The simplest approach: add a parallel `hands` array on the handTracker that is updated each frame, indexed by `handId`, holding `{ landmarks, handedness, playerId }`. Then `gardenInteraction` reads from `handTracker.hands` directly when it needs pose.

Add to `HandTracker` constructor:

```javascript
this.hands = []; // { handId, playerId, landmarks }
```

In `onResults`, after the existing handData processing, populate `this.hands`:

```javascript
this.hands = handData.map((d, i) => ({
    handId: this.playerCount === 2 ? (i === 0 ? 'p1' : 'p2') : 'solo',
    playerId: this.playerCount === 2 ? (i === 0 ? 1 : 2) : 1,
    landmarks: d.landmarks,
}));
```

- [ ] **Step 2: Switch pickup and release to pose events in `GardenInteraction`**

In `js/garden/garden-interaction.js`, change `process(deltaTime, handPositions)` to also iterate `handTracker.hands` (not the collision points) and run the pose pipeline per hand:

```javascript
process(deltaTime, handPositions) {
    // Per-hand pose pipeline (Phase 5)
    if (typeof handTracker !== 'undefined' && handTracker.hands) {
        for (const hand of handTracker.hands) {
            this._processPose(hand, deltaTime);
        }
    }

    // Per-collision-point pipeline (hover, harvest, sun bar accumulation)
    if (!handPositions || handPositions.length === 0) return;
    for (const hand of handPositions) {
        const zoneKey = this._zoneForHand(hand);
        this._processHand(hand, zoneKey, deltaTime);
    }
}

_processPose(hand, deltaTime) {
    const prev = this._posePrev.get(hand.handId) || null;
    const curr = HandPose.classify(hand.landmarks, prev);
    const event = HandPose.getGrabEvent(prev, curr);
    this._posePrev.set(hand.handId, curr);
    if (!event) return;

    const zoneKey = gardenState.mode === 'competitive'
        ? (hand.playerId === 1 ? 'p1' : 'p2')
        : 'shared';
    const zone = gardenState.getZone(zoneKey);
    if (!zone) return;

    // Hand world point: use the index fingertip (landmark 8) mapped through playZone.
    const tip = hand.landmarks[8];
    const canvas = handTracker.canvas;
    const point = playZone.mapPoint(tip.x, tip.y, canvas.width, canvas.height);

    if (event === 'grab') {
        this._tryPickup(zone, point);
    } else if (event === 'release') {
        this._tryRelease(zone, point);
    }
}

_tryPickup(zone, point) {
    if (zone.heldItem) return;
    // Seed
    const seed = zone.tools.seeds.find(s => !s.isPlanted && s.isPointOver(point.x, point.y));
    if (seed) { seed.pickup(); zone.heldItem = seed; return; }
    // Watering can
    if (zone.tools.wateringCan && zone.tools.wateringCan.isPointOver(point.x, point.y)) {
        zone.tools.wateringCan.pickup();
        zone.heldItem = zone.tools.wateringCan;
        return;
    }
    // Fertiliser
    if (zone.tools.fertilizerBag && zone.tools.fertilizerBag.isPointOver(point.x, point.y)) {
        zone.tools.fertilizerBag.pickup();
        zone.heldItem = zone.tools.fertilizerBag;
        return;
    }
    // Golden watering can (competitive rubber-band)
    if (zone.goldenWateringCan && zone.goldenWateringCan.isPointOver(point.x, point.y)) {
        zone.goldenWateringCan.pickup();
        zone.heldItem = zone.goldenWateringCan;
        return;
    }
}

_tryRelease(zone, point) {
    const held = zone.heldItem;
    if (!held) return;

    // Apply over a plant if relevant
    const targetPot = zone.pots.find(p => p.isPointOver(point.x, point.y));
    if (targetPot) {
        if (held instanceof DraggableSeed && targetPot.isEmpty && targetPot.isEmpty()) {
            targetPot.plantSeed(held.plantType);
            held.plant();
            zone.heldItem = null;
            if (typeof audioManager !== 'undefined') audioManager.play('plant');
            return;
        }
        if (held instanceof WateringCan) {
            zone.needs.addWater();
            if (typeof audioManager !== 'undefined') audioManager.play('water');
        } else if (held instanceof FertilizerBag) {
            zone.needs.addFood();
            if (typeof audioManager !== 'undefined') audioManager.play('food');
        }
    }

    // Always release: tool flies home, seed returns home if not planted
    held.returnHome();
    zone.heldItem = null;
}
```

While held, the existing `process` loop already updates the held item's position via `_processHand` (it calls `moveTo(point.x, point.y)`). Confirm that continues to work for pose-grabbed items. If the existing logic only moved items because of touch-based pickup, port the `moveTo` call into the pose loop too.

- [ ] **Step 3: Strip touch-based pickup from `_processHand`**

Open `_processHand`. Delete every branch that calls `.pickup()` on a tool when a finger touches it (`seed.pickup()`, `wateringCan.pickup()`, `fertilizerBag.pickup()`, and the equivalent on `goldenWateringCan`). Pickup is now pose-driven only.

Also delete the dwell-watering and dwell-fertilising branches that accumulated `interactionTimers.water` and `interactionTimers.food` to trigger `addWater`/`addFood` over time. Those effects now fire on the `release` pose event in `_tryRelease`. Watering can pour particles can still spawn while held over a pot using the existing tilt-detection logic inside the can's own `update` method, which is untouched.

After this step, `_processHand` should contain only:

1. Moving a held item to the hand position (`zone.heldItem.moveTo(hand.x, hand.y)` when `zone.heldItem` is set).
2. The hover-harvest branch: if an open hand sits over a ripe pot for about 0.4 seconds, call `pot.harvest()` and trigger the harvest sound and seed respawn.

If `_processHand` no longer needs the sun branch either, that gets removed cleanly in Task 9; for now, leave the sun hover branch in place so the sun bar still behaves as before until Task 9 lands.

- [ ] **Step 4: Manual smoke check**

Reload the live site. With an open hand, hover over the watering can. Nothing happens (this is correct; touch no longer picks up). Close your hand over the watering can. It sticks to your hand. Move your hand over a plant. Open your hand. The plant is watered, the can flies back to its home position. Open your hand over empty space while holding a tool. The tool flies home with no apply. Solo, co-op, competitive all behave consistently.

- [ ] **Step 5: Commit and push**

```bash
git add js/garden/garden-interaction.js js/handTracking.js
git commit -m "$(cat <<'EOF'
feat: pose-driven grab and release for tools

Tools no longer stick to your hand on touch. Closing your hand over a
tool picks it up. Opening your hand near a plant applies the tool.
Opening your hand anywhere else releases the tool and it flies home.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin main
```

### Task 8: Play-zone calibration on "Wave to Start"

**Files:**
- Modify: `js/game.js`
- Modify: `index.html` (rename calibration screen copy)

- [ ] **Step 1: Sample wrist positions during calibration**

Open `js/game.js`. Locate the calibration progress section (around line 380, the `if (this.state === GameState.CALIBRATION)` block).

Add a `calibrationSamples` array on the game state, initialised in the same place `calibrationWaveDetected` is reset (look for `this.calibrationWaveDetected = false`). Each frame the calibration screen is active, push the wrist position of every detected hand onto the array:

```javascript
if (!this._calibrationSamples) this._calibrationSamples = [];
if (handTracker.hands && handTracker.hands.length > 0) {
    for (const h of handTracker.hands) {
        const wrist = h.landmarks[0];
        this._calibrationSamples.push({ x: wrist.x, y: wrist.y });
    }
}
```

Place this inside the existing `if (handsDetected)` branch so it only samples when hands are visible.

- [ ] **Step 2: Calibrate `playZone` when the wave completes**

In the same block, locate the line `this.calibrationWaveDetected = true;`. Immediately before that line (so the sample buffer is non-empty), call:

```javascript
playZone.calibrate(this._calibrationSamples || []);
this._calibrationSamples = [];
```

Do the same for the `CALIBRATION_P2` block.

- [ ] **Step 3: Rename the calibration screen copy**

In `index.html`, replace this block:

```html
<h2 class="calibration-title">Show Your Gardening Hands!</h2>
<p class="instruction-text">Hold your hands up so the camera can see them</p>
```

With:

```html
<h2 class="calibration-title">Wave to Start</h2>
<p class="instruction-text">Show me your hands wherever feels comfortable</p>
```

And replace:

```html
<p class="wave-instruction">Wave to start gardening!</p>
```

With:

```html
<p class="wave-instruction">Wave a little so the camera knows where you are</p>
```

For the P2 screen (`calibrationP2Screen`), replace:

```html
<h2 class="calibration-title calibration-p2-title">Player 2, Join the Garden!</h2>
<p class="instruction-text">Now show your hand on the <strong>left side</strong> of the screen</p>
```

With:

```html
<h2 class="calibration-title calibration-p2-title">Player 2, Wave to Join</h2>
<p class="instruction-text">Show your hand on the <strong>left side</strong> of the screen</p>
```

Do not rename the DOM ids or CSS class names (they are referenced in CSS and JS). Only the user-facing copy changes.

- [ ] **Step 4: Use mapped coords in the existing collision-point pipeline**

In `js/handTracking.js.onResults`, where `collisionPoints` are pushed into `this.handPositions`, replace the raw `point.x * this.canvas.width` and `point.y * this.canvas.height` translations with a call through `playZone.mapPoint`. Concretely, replace:

```javascript
const x = point.x * this.canvas.width;
const y = point.y * this.canvas.height;
```

with:

```javascript
const mapped = (typeof playZone !== 'undefined')
    ? playZone.mapPoint(point.x, point.y, this.canvas.width, this.canvas.height)
    : { x: point.x * this.canvas.width, y: point.y * this.canvas.height };
const x = mapped.x;
const y = mapped.y;
```

- [ ] **Step 5: Manual smoke check**

Reload the live site. On the Wave to Start screen, hold your hands at chest height in front of you (not raised). Wave once. Calibration completes. In the round, your hands at chest height should reach the full canvas, no need to raise them. Repeat seated at a desk, repeat with one hand only. No console errors.

- [ ] **Step 6: Commit and push**

```bash
git add js/game.js js/handTracking.js index.html
git commit -m "$(cat <<'EOF'
feat: auto-calibrate play zone on Wave to Start

The calibration screen is now called Wave to Start and samples the
player's natural wrist height during the wave. PlayZone maps raw
camera coords into canvas coords through that calibrated box, so
hands at any comfortable height reach the full play area.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin main
```

### Task 9: Sunrise-to-sunset sun cycle and drop the sun field from `PlantNeeds`

**Files:**
- Modify: `js/game.js` (call `sunCycle.update` each frame in the round)
- Modify: `js/garden/garden-bed.js` (apply growth multiplier, stop creating `SunArea`)
- Modify: `js/garden/garden-renderer.js` (draw sky and sun from `sunCycle`)
- Modify: `js/garden/plant-needs.js` (remove `sun`)
- Modify: `js/garden/garden-interaction.js` (remove sun hover branch)

- [ ] **Step 1: Drive `sunCycle.update` from the round loop**

In `js/game.js`, find where the round timer counts down (search for `roundTimer`, `timerValue`, or the round update loop). Each frame the round is active, call:

```javascript
const elapsed = this.roundDuration - this.roundTimeRemaining;
sunCycle.update(elapsed, this.roundDuration);
```

Use whichever variable names exist in `game.js` for round duration and elapsed time. The contract is: `roundElapsed = 0` at round start, `roundElapsed = roundDuration` at round end.

- [ ] **Step 2: Apply growth multiplier in `garden-bed.js`**

In `js/garden/garden-bed.js.update`, where pots get ticked (`for (const pot of zone.pots) pot.update(deltaTime, zone.needs);`), pass a third argument:

```javascript
for (const pot of zone.pots) {
    pot.update(deltaTime, zone.needs, sunCycle.getGrowthMultiplier());
}
```

In `js/garden/plant-pot.js`, find the `update` method. Locate the growth-rate calculation (look for `0.25 * satisfaction` or similar). Multiply by the growth multiplier:

```javascript
update(deltaTime, needs, growthMultiplier = 1) {
    const satisfaction = needs ? needs.getAverageSatisfaction() : 1;
    const baseRate = 0.25;
    this.growthProgress += baseRate * satisfaction * growthMultiplier * deltaTime;
    // ... rest of update unchanged
}
```

- [ ] **Step 3: Draw sky and sun from `sunCycle` in `garden-renderer.js`**

In `js/garden/garden-renderer.js.draw`, at the top before any zone drawing, fill the sky:

```javascript
draw(ctx) {
    // Sky gradient
    ctx.save();
    ctx.fillStyle = sunCycle.getSkyGradient(ctx, ctx.canvas.width, ctx.canvas.height);
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();

    // Sun sprite
    const sun = sunCycle.getSunPosition(ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    const grad = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, sun.radius * 2);
    grad.addColorStop(0, 'rgba(255, 240, 180, 0.95)');
    grad.addColorStop(0.5, 'rgba(255, 210, 120, 0.6)');
    grad.addColorStop(1, 'rgba(255, 180, 80, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sun.x, sun.y, sun.radius * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 240, 180, 1)';
    ctx.beginPath();
    ctx.arc(sun.x, sun.y, sun.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ... rest of draw unchanged
}
```

Remove the old `gardenState.sunArea` draw call from `garden-renderer.js`.

- [ ] **Step 4: Drop `sun` from `PlantNeeds`**

In `js/garden/plant-needs.js`:

- Remove the `sun`, `displaySun`, `sunDepleteRate`, and `addSun` fields/methods from the `PlantNeeds` class.
- In `update`, remove the `this.sun = Math.max(0, ...)` line and the lerp for `displaySun`.
- In `getAverageSatisfaction`, change from `(this.water + this.sun + this.food) / 3` to `(this.water + this.food) / 2`.
- In `draw`, remove the sun bar draw call. Adjust `panelHeight` from `spacing * 3 + 30` to `spacing * 2 + 30`.
- In `maxAll`, remove the `this.sun = 1` line.

- [ ] **Step 5: Remove the sun hover and `SunArea` references**

In `js/garden/garden-interaction.js._processHand`, remove the entire `if (sunArea && sunArea.isPointOver(...))` branch. The sun is passive now.

In `js/garden/garden-bed.js`, remove the line(s) that instantiate `SunArea` and the `gardenState.sunArea = ...` assignment. Search for `SunArea` and `sunArea` and delete every reference outside of `plant-needs.js` (which no longer needs the import either).

In `js/garden/plant-needs.js`, delete the `SunArea` class entirely (it currently lives at the bottom of the file). The file then contains only the `PlantNeeds` class. Verify nothing else imports it by running `grep -rn SunArea js/` and confirming there are zero matches. If a match remains, remove that reference too.

- [ ] **Step 6: Manual smoke check**

Reload the live site. The HUD now shows water and food bars only. The sky shifts colour over the round duration. The sun visibly arcs across the sky. Plants grow faster around the middle of the round. Solo, co-op, competitive all play through to round end with no errors.

- [ ] **Step 7: Commit and push**

```bash
git add js/game.js js/garden/garden-bed.js js/garden/garden-renderer.js js/garden/plant-needs.js js/garden/garden-interaction.js js/garden/plant-pot.js
git commit -m "$(cat <<'EOF'
feat: replace sun bar with passive sunrise-to-sunset sky

Sun is now a passive ambient cycle driven by the round timer. Plants
grow faster around midday. The sun bar and sun-zone hover gesture
are gone. PlantNeeds tracks water and food only.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin main
```

---

## Phase 6: Polish

**Goal:** Plants droop visibly when neglected and bounce when topped up. `garden-bed.js` is under 200 lines. Visual polish and HUD details are tidied.

**Parallelism:** Three subagents in parallel. Tasks 10, 11, 12 are independent.

### Task 10: Droop and happy-bounce on `PlantPot`

**Files:**
- Modify: `js/garden/plant-pot.js`
- Modify: `js/garden/plant-needs.js` (expose `getAverageSatisfaction` if not already public)

- [ ] **Step 1: Add droop state to `PlantPot`**

In `js/garden/plant-pot.js`, add to the constructor:

```javascript
this.droopAmount = 0;     // 0 to 1, current droop level
this.bouncePulse = 0;     // 0 to 1, decays after a top-up
```

- [ ] **Step 2: Update droop and bounce in `PlantPot.update`**

Append to the existing `update(deltaTime, needs, growthMultiplier = 1)`:

```javascript
const sat = needs ? needs.getAverageSatisfaction() : 1;
const targetDroop = sat < 0.3 ? Math.min(1, (0.3 - sat) / 0.3) : 0;
this.droopAmount += (targetDroop - this.droopAmount) * Math.min(1, 3 * deltaTime);

if (sat > 0.6 && this.droopAmount > 0.05 && this.bouncePulse < 0.05) {
    this.bouncePulse = 1; // trigger a bounce
}
this.bouncePulse = Math.max(0, this.bouncePulse - deltaTime * 2);
```

- [ ] **Step 3: Apply droop and bounce in `PlantPot.draw`**

Wrap the existing plant drawing block in `draw(ctx)` with a transform:

```javascript
draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const droopAngle = this.droopAmount * -0.35; // lean left up to ~20 degrees
    const bounceScale = 1 + Math.sin(this.bouncePulse * Math.PI) * 0.15;

    ctx.rotate(droopAngle);
    ctx.scale(bounceScale, bounceScale);
    ctx.translate(-this.x, -this.y);

    // ...existing pot and plant drawing calls...

    ctx.restore();
}
```

Apply desaturation when drooped: before drawing the plant leaves, multiply the leaf colour by `(1 - droopAmount * 0.4)` on each RGB channel. The simplest approach is to compute a tinted colour string at the top of `draw` and use it in the leaf fill paths.

- [ ] **Step 4: Manual smoke check**

Reload the live site. Plant a seed, water once, then stop interacting. After 10 seconds, the plant visibly leans and desaturates. Water again. The plant pops back upright with a happy bounce. No errors.

- [ ] **Step 5: Commit and push**

```bash
git add js/garden/plant-pot.js js/garden/plant-needs.js
git commit -m "$(cat <<'EOF'
feat: plants droop when neglected and bounce when topped up

When average needs fall below 0.3 a plant leans and desaturates. When
the player tops a need above 0.6 the plant pops back upright with a
short scale bounce. Plants never die.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin main
```

### Task 11: Trim `garden-bed.js` to under 200 lines

**Files:**
- Modify: `js/garden/garden-bed.js`

- [ ] **Step 1: Audit what is still in `garden-bed.js`**

`wc -l js/garden/garden-bed.js`. Read the file end to end. Catalogue every method. For each, classify it as one of:

- Coordinator (legitimate to keep: `init`, `update`, `draw`, `reset`, `setMode`, getters that proxy to state)
- State, render, or interaction code that escaped the earlier phases (move to its proper module)
- Dead code (delete)

- [ ] **Step 2: Move escapees to the right module**

For each method classified as "state", "render", or "interaction" that still lives in `garden-bed.js`, move it to its destination module. Add a forwarding stub on `GardenBed` only if external callers exist; otherwise delete from `garden-bed.js` entirely. Use `grep -rn 'gardenBed\.<methodName>' js/` to check.

- [ ] **Step 3: Delete dead helpers**

Delete any helpers that no longer have a caller. Re-run `wc -l js/garden/garden-bed.js` and confirm under 200 lines.

- [ ] **Step 4: Manual smoke check**

Full smoke checklist across all three modes. Confirm no regression. No console errors.

- [ ] **Step 5: Commit and push**

```bash
git add js/garden/garden-bed.js js/garden/garden-state.js js/garden/garden-renderer.js js/garden/garden-interaction.js
git commit -m "$(cat <<'EOF'
refactor: trim garden-bed.js to a thin coordinator under 200 lines

Methods that escaped Phases 2-4 are now back in their proper modules
or deleted. GardenBed is now a small coordinator that ticks state,
hands off to interaction, and delegates rendering.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin main
```

### Task 12: Changelog entry and update memory gotchas

**Files:**
- Modify: `docs/CHANGELOG.md` (create if missing) or wherever the changelog lives in the repo
- Modify: `CLAUDE.md` (refresh the Key Files table)

- [ ] **Step 1: Add a changelog entry**

If `docs/CHANGELOG.md` does not exist yet, create it with this content:

```markdown
# Changelog

## 2026-05-28: Garden Grow mechanics revamp

- Calibration screen renamed "Wave to Start" and auto-calibrates the play zone to wherever the player's hands sit.
- Tools now picked up with a closed hand and put down with an open hand. Releasing over a plant applies the tool; releasing anywhere else sends the tool flying home.
- Sun is now a passive sunrise-to-sunset cycle. The sun bar has been removed. Plants grow faster around midday.
- Plants droop when neglected and bounce back when a need is topped up. No plant ever dies.
- `garden-bed.js` split into `garden-state.js`, `garden-interaction.js`, `garden-renderer.js`, and a thin coordinator. New modules `hand-pose.js`, `play-zone.js`, and `sun-cycle.js` live alongside.
```

If the changelog already exists, prepend the same dated entry under any "Unreleased" heading.

- [ ] **Step 2: Refresh the Key Files table in `CLAUDE.md`**

Open `CLAUDE.md`, locate the Key Files table under "Architecture Overview". Add new rows for `js/hand-pose.js`, `js/play-zone.js`, `js/garden/sun-cycle.js`, `js/garden/garden-state.js`, `js/garden/garden-interaction.js`, `js/garden/garden-renderer.js`. Update the row for `js/garden/garden-bed.js` to read "Thin coordinator: ticks state, hands off to interaction, delegates rendering."

Under "Critical Gotchas", replace any entry about `SunArea` or the sun bar with a one-liner: "Sun is a passive sunrise-to-sunset cycle driven by `sunCycle`; there is no sun bar or hover gesture."

- [ ] **Step 3: Commit and push**

```bash
git add docs/CHANGELOG.md CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: log the Garden Grow mechanics revamp in CHANGELOG and CLAUDE

Records the new modules, the Wave to Start rename, the passive sun
cycle, the pose-driven tools, and the droopy-but-never-dying plants.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin main
```

---

## Definition of done

- All twelve tasks shipped, each pushed to `main` with the live build verified.
- Smoke checklist passes in solo, co-op, and competitive.
- "Calibration" no longer appears in user-facing UI; "Wave to Start" replaces it.
- Sun bar is gone from the HUD.
- A plant left alone for 10 seconds visibly droops, and a water tops it up with a bounce.
- `wc -l js/garden/garden-bed.js` is under 200.
- `docs/CHANGELOG.md` records the revamp.
- `CLAUDE.md` Key Files and Gotchas reflect the new structure.

## Out of scope (covered in separate work)

- `docs.html` screen-map page restructure (removing the dividing line, switching to flow cards plus arrows).
- Whole-site visual restyle and the four user-facing doc pages (GDD, one-page pitch, stakeholder demo sheet, player and carer guide).
- Audio additions beyond preserving the existing sound triggers.
