# Changelog

## 2026-05-28: Garden Grow mechanics revamp

- Calibration screen renamed "Wave to Start" and auto-calibrates the play zone to wherever the player's hands sit, so the player no longer has to keep their arms raised.
- Tools now picked up with a closed hand and put down with an open hand. Releasing over a plant applies the tool; releasing anywhere else sends the tool flying home.
- Sun is now a passive sunrise-to-sunset cycle. The sun bar has been removed. Plants grow faster around midday.
- Plants droop when neglected and bounce back when a need is topped up. No plant ever dies.
- `garden-bed.js` split into `garden-state.js`, `garden-interaction.js`, `garden-renderer.js`, and a thin coordinator. New modules `hand-pose.js`, `play-zone.js`, and `sun-cycle.js` live alongside.
