# Garden Grow Mechanics Revamp: Design Spec

**Date:** 2026-05-28
**Author:** Vinh + Claude (brainstorm)
**Status:** Approved, ready for implementation plan

## Why this work exists

Player feedback from in-session testing flagged three things that make Garden Grow feel clunky:

1. The player has to hold their arms up for long stretches because the tracked region is the whole camera frame and the tools sit high on the canvas.
2. Picking up tools is intuitive (touch a tool, it follows your hand) but putting them down is not. The current rule is "drag the tool back to its home slot", which is rarely discovered without coaching.
3. The sun bar drains over time and the player has no clear way to refill it. The interaction zone exists but its purpose is not obvious.

The target audience is people living with dementia in therapeutic care settings. The product priorities are gentleness, clarity, low cognitive load, and visible positive feedback. These pain points cut against all four.

This spec proposes a full rebuild of the garden play loop, splitting the monolithic `garden-bed.js` into three layers (state, interaction, rendering) and introducing four new gameplay rules at the same time:

- A play zone that auto-calibrates to wherever the player's hands rest at "Wave to Start".
- Drag-and-release tools driven by open and closed hand pose, so an open hand puts a tool down where you are and an open hand near a plant applies it.
- A passive sunrise-to-sunset sun that drives the round timer visually and modulates plant growth, with no bar and no top-up gesture.
- Plants droop visibly when neglected and bounce back happily when a need is topped up. No plant ever dies.

## Scope

In scope:

- Refactor `js/garden/garden-bed.js` into `gardenState`, `gardenInteraction`, `gardenRenderer` plus a thin coordinator
- New `js/hand/playZone.js` and `js/hand/handPose.js` modules
- New `js/garden/sunCycle.js` module
- Remove the `sun` field from `PlantNeeds`, replace with sun-cycle growth multiplier
- Add droop and happy-bounce visual states to `PlantPot`
- Rename the "Calibration" screen to "Wave to Start" and rework what it does
- Sky gradient and sun arc rendering driven by sun-cycle progress
- HUD update to remove the sun bar and show water and food only

Out of scope (handled separately):

- Screen-map page restructure on `docs.html`
- Whole-site visual restyle and the four new user-facing doc pages (GDD, one-page pitch, stakeholder demo sheet, player and carer guide)
- Audio changes beyond keeping the existing sound triggers wired up

## Confirmed direction (from brainstorm)

1. **Play zone auto-calibrates at "Wave to Start".** Whatever height the player's hands sit at becomes the centre of a comfortable play box. Works whether the player is seated at a table, in an armchair facing a TV, or standing.
2. **Tools are drag-and-release with hand pose.** A closed hand near a tool picks it up. An open hand near a plant applies the tool to that plant. An open hand anywhere else releases the tool and it flies back to its home slot. MediaPipe gives 21 landmarks per hand, so open versus closed is reliable with a hysteresis band.
3. **Sun is passive sunrise to sunset.** The sun arcs across the sky over the round duration. Plants grow faster when the sun is high (0.5x at dawn and dusk, peaking at 1.5x at midday). No bar, no top-up gesture, no separate sun field on `PlantNeeds`.
4. **Plants droop, never die.** When the average need on a plant drops below 0.3 the plant leans visibly and the leaves desaturate slightly. Topping up any need restores it with a happy bounce. The plant keeps its growth progress.

## Architecture

The current `garden-bed.js` is roughly 1,220 lines and owns state, interaction, and rendering with `competitive` versus shared branching at most call sites. We split it three ways.

### New layout

**`js/hand/`**

| File | Purpose |
|---|---|
| `handTracker.js` | Existing, moved here. MediaPipe init, raw landmark capture, glove rendering. |
| `handPose.js` | New. Per-hand open / closed classification from landmarks. |
| `playZone.js` | New. Auto-calibrated active rectangle and raw-to-play coordinate mapping. |

**`js/garden/`**

| File | Purpose |
|---|---|
| `gardenState.js` | New. Pure state: zones, pots, tools, scores, droop flags. No drawing, no input. |
| `gardenInteraction.js` | New. Hand input to state changes: grab, release, apply, hover, harvest. |
| `gardenRenderer.js` | New. State to canvas: sky, ground, pots, plants, held tools, bars, effects. |
| `sunCycle.js` | New. Owns sunrise-to-sunset progress, sun position, sky gradient, growth multiplier. |
| `gardenBed.js` | Existing, rewritten as a thin coordinator (about 150 lines). |
| `plantPot.js` | Existing. Adds `drooped` flag, lean transform, happy-bounce animation. |
| `tools.js` | Existing. Pickup and release are driven externally by `gardenInteraction`. |
| `plantNeeds.js` | Existing. Sun field removed. Water and food only. |
| `constants.js` | Existing. Untouched. |

### Frame loop

`game.js` continues to call `gardenBed.update(deltaTime, handPositions, handLandmarks)` and `gardenBed.draw(ctx)`. Inside `gardenBed`, each frame runs:

```
1. sunCycle.update(roundElapsed, roundDuration)
2. gardenState.update(deltaTime, sunCycle.getGrowthMultiplier())
3. gardenInteraction.process(handPositions, handLandmarks, playZone, gardenState)
4. gardenRenderer.draw(ctx, gardenState, sunCycle, playZone)
5. handTracker.drawHands(ctx)   // last so gloves render on top
```

### Module contracts

**`playZone.js`**

- `calibrate(handSnapshot)`: captures wrist height range and width from the "Wave to Start" snapshot, sets a comfortable play rectangle in normalised coords.
- `mapPoint(rawX, rawY)` returning `{x, y}`: translates a raw camera point into play-zone canvas coords, clamping to the zone bounds so a player whose hand is at chest height still reaches all the plants.
- `draw(ctx)`: soft outline shown during the calibration screen only.

**`handPose.js`**

- `classify(landmarks)` returning `'open'` or `'closed'`: fingertip-to-palm distance ratio with hysteresis (a finger has to cross the band fully before the state flips).
- `getGrabEvent(handId, prevClass, currentClass)` returning `'grab'`, `'release'`, or `null`: edge detection helper so `gardenInteraction` reacts to transitions, not every frame.

**`sunCycle.js`**

- `update(roundElapsed, roundDuration)`: advances `progress` from 0 to 1 over the round.
- `getSunPosition()` returning `{x, y, radius}`: arc from bottom-left at dawn through top-centre at noon to bottom-right at dusk, with a small radius pulse for life.
- `getSkyGradient(ctx)` returning a `CanvasGradient`: warm peach at dawn, soft blue at noon, warm orange at dusk.
- `getGrowthMultiplier()` returning a number: 0.5 at the start and end of the round, peaking at 1.5 at midday. Plants grow visibly faster when the sun is high.

**`gardenState.js`**

Internal shape (sketch):

```
{
  mode: 'solo' | 'coop' | 'competitive',
  zones: Map<zoneKey, {
    pots: PlantPot[],
    tools: { watering: WateringCan, fertiliser: FertilizerBag, seeds: DraggableSeed[] },
    needsByPot: Map<plantId, { water, food }>,
    score: number,
    heldToolByHand: Map<handId, toolRef | null>
  }>
}
```

Public methods:

- `update(deltaTime, growthMultiplier)`: decays water and food per plant, advances growth by `(growthMultiplier * baseRate * avgNeedSatisfaction * deltaTime)`, advances droop state, runs the happy-bounce timer.
- `pickupTool(zoneKey, toolRef, handId)`
- `releaseTool(handId, atPoint, mode)` where `mode` is `'apply'` or `'free'`. `'free'` triggers the fly-home tween.
- `applyTool(handId, plantId)`: applies whatever the hand is holding to the plant.
- `harvestPlant(zoneKey, plantId)`: returns the harvested plant for the scoring layer.

**`gardenInteraction.js`**

`process(hands, landmarksByHand, playZone, state)`. For each hand:

1. Map raw position into play-zone coords.
2. Classify pose, derive grab event.
3. On `'grab'`: if a tool is under the hand and the hand is not already holding one, call `state.pickupTool`.
4. On `'release'`: if a plant is under the hand and a tool is held, call `state.applyTool` then `state.releaseTool(..., 'free')`. Otherwise call `state.releaseTool(..., 'free')` so the tool flies home from wherever the hand was.
5. Without a grab event, check for hover-harvest: an open hand sitting on a ripe plant for about 0.4 seconds harvests it (no closed-hand requirement, so the gesture stays gentle).

**`gardenRenderer.js`**

`draw(ctx, state, sunCycle, playZone)` runs a fixed draw order:

1. Sky gradient from `sunCycle.getSkyGradient`
2. Sun sprite from `sunCycle.getSunPosition`
3. Ground band
4. Competitive divider (if `state.mode === 'competitive'`)
5. Tool home slots (faded silhouette so the player learns where things live)
6. Plant pots and plants with droop lean and growth pulse
7. Held tools, drawn at the hand position
8. Water and food bars per plant
9. Floating feedback effects (e.g. `+💧`, `+🌱`)

## New gameplay rules and where they live

| Rule | Module |
|---|---|
| Auto-calibrated play zone | `playZone.js` plus the renamed "Wave to Start" screen |
| Closed hand grabs a tool | `gardenInteraction` listening to `handPose.getGrabEvent` |
| Open hand near a plant applies tool | `gardenInteraction` on release event |
| Open hand anywhere releases tool to home | `gardenInteraction` default release path |
| Passive sunrise to sunset | `sunCycle.js` drives sky and growth multiplier |
| Plants droop when needs low | `gardenState.update` flips `drooped`, renderer applies lean |
| Top-up triggers a happy bounce | `gardenState.update` sets a bounce timer, renderer animates scale pulse |

## Migration order

Each phase ends with a working game, a commit, a manual smoke test, and a push so the live build on GitHub Pages reflects the latest state.

**Phase 1, scaffolding, no behaviour change.** Create `handPose.js`, `playZone.js`, `sunCycle.js`. Add to `index.html` script load order. None of them are called yet.

**Phase 2, extract `gardenState`.** Lift state fields out of `garden-bed.js` into `gardenState.js`. `garden-bed.js` keeps the same outward API but reads and writes through `gardenState`.

**Phase 3, extract `gardenRenderer`.** Move all draw methods out of `garden-bed.js`. `garden-bed.js.draw(ctx)` delegates.

**Phase 4, extract `gardenInteraction`.** Move `processHandInteraction` and the pickup and release branches into `gardenInteraction.js`. `garden-bed.js.update()` delegates.

**Phase 5, wire the new mechanics.** Hook `handPose` into `gardenInteraction` for grab and release. Hook `playZone` into the calibration screen, rename it "Wave to Start". Hook `sunCycle` into the game loop, swap out `SunArea`, strip the sun field from `PlantNeeds`.

**Phase 6, polish.** Droop lean and happy-bounce in renderer. Sky gradient and sun arc art. HUD update for water and food only.

## Risks and mitigations

- **Pose classification jitter.** Hands drift in and out of the closed band as fingers naturally curl. Mitigation: hysteresis band on the open/close threshold so a finger has to cross it fully before the state flips. Frame-stability also helps because edge events drive interaction.
- **Play-zone calibration off when only one hand is present at "Wave to Start".** Mitigation: if only one hand is detected for the calibration window, expand the play zone symmetrically around that hand. Recalibrate silently mid-round if both hands have been visible for a few seconds.
- **Mode-specific state regressions during the `garden-bed.js` split.** Mitigation: a smoke checklist runs at the end of every phase, covering solo, coop, and competitive happy-paths. The build never lands on `main` with a regressed mode.
- **Pre-existing competitive-vs-shared branching is tangled.** Mitigation: `gardenState` makes mode a property on state, not a branch on every callsite. The interaction layer reads mode from state when it matters.

## Testing approach

This codebase has no automated tests. We use a manual smoke checklist after each phase. The user runs the checklist in the live build at https://vinhly271193.github.io/balloon-pop-game/ after every push.

**Smoke checklist (each mode):**

- Title to "Wave to Start" to first round, no console errors
- One seed pickup, plant, water, harvest cycle
- One fertiliser application
- Two-hand pickup of two different tools at the same time (coop)
- Competitive split-zone scoring
- Plant droop appears when a plant is ignored
- Plant bounces back on top-up
- Sun visibly arcs over the round duration

## Open questions

None at design time. New questions will be raised during the implementation plan if they appear.

## Definition of done

- All six phases shipped, each pushed to `main`
- Manual smoke checklist passes in all three modes
- "Calibration" no longer appears anywhere in the live game UI, replaced with "Wave to Start"
- The sun bar is gone from the HUD
- A plant left alone for 10 seconds visibly droops; a watering tops it up with a bounce
- `garden-bed.js` is under 200 lines and contains coordinator logic only
- The changelog has an entry for the revamp
