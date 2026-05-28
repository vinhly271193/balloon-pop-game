/**
 * Garden State
 * Pure state container for the garden play loop. No drawing, no input.
 * GardenBed delegates all data reads and writes here.
 *
 * Zone keys:
 *   'shared' — used for solo and coop modes
 *   1, 2     — used for competitive mode (player ids matching existing callers)
 *
 * ZoneState shape:
 *   pots: PlantPot[]
 *   tools: {
 *     seed: DraggableSeed | null,
 *     wateringCan: WateringCan,
 *     fertilizerBag: FertilizerBag,
 *     sunArea: SunArea
 *   }
 *   needs: PlantNeeds
 *   heldItem: DraggableSeed | WateringCan | FertilizerBag | null
 *   heldItemHand: string | null
 *   goldenWateringCan: WateringCan | null
 *   interactionTimers: { water: number, food: number, sun: number }
 */

class GardenState {
    constructor() {
        // Map<zoneKey, ZoneState>
        this.zones = new Map();

        // Mode fields
        this.mode = 'coop';      // 'solo' | 'coop' | 'competitive'
        this.playerCount = 1;
        this.dividerX = null;

        // Round generation counter — guards stale setTimeout callbacks
        this.roundGeneration = 0;

        // Sun area legacy field (Phase 5 removes this; kept to preserve behaviour)
        this.sunArea = null;
    }

    /**
     * Create or replace a zone.
     * @param {string|number} zoneKey
     * @param {{ pots: PlantPot[], tools: object, needs: PlantNeeds }} config
     */
    initZone(zoneKey, { pots, tools, needs }) {
        this.zones.set(zoneKey, {
            pots,
            tools,
            needs,
            heldItem: null,
            heldItemHand: null,
            goldenWateringCan: null,
            interactionTimers: { water: 0, food: 0, sun: 0 },
        });
    }

    /** @returns {ZoneState|undefined} */
    getZone(zoneKey) {
        return this.zones.get(zoneKey);
    }

    /** @returns {Array<string|number>} */
    getAllZoneKeys() {
        return Array.from(this.zones.keys());
    }

    setMode(mode, playerCount) {
        this.mode = mode;
        this.playerCount = playerCount;
    }

    /**
     * Clear all zones and increment the generation counter.
     * Called at the start of configure() and clear() on GardenBed.
     */
    reset() {
        this.zones.clear();
        this.roundGeneration += 1;
    }
}

window.gardenState = new GardenState();
