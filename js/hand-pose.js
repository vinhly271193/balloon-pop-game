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
     * landmarks[0] is the wrist. Landmark 9 is the palm centre (middle-finger MCP).
     * Fingertips are 4, 8, 12, 16, 20. MCP joints are 5, 9, 13, 17.
     *
     * Strategy: average fingertip-to-palm-centre distance, normalised by palm width.
     * The thumb (landmark 4) is excluded because its distance to the palm centre
     * barely changes between an open hand and a closed fist.
     *
     * Open hand: ratio > OPEN_RATIO. Closed hand: ratio < CLOSED_RATIO.
     * Inside the band: stay where you were (hysteresis).
     *
     * @param {Array<{x:number,y:number,z:number}>} landmarks
     * @param {'open'|'closed'|null} prev previous classification for hysteresis
     * @returns {'open'|'closed'}
     */
    classify(landmarks, prev) {
        if (!landmarks || landmarks.length < 21) return prev || 'open';
        const palm = landmarks[9];
        const indexMCP = landmarks[5];
        const pinkyMCP = landmarks[17];
        // Floor at 0.001 so a degenerate frame (both MCPs collapsed) does not divide by zero.
        const palmWidth = Math.hypot(indexMCP.x - pinkyMCP.x, indexMCP.y - pinkyMCP.y) || 0.001;

        const tipIds = [8, 12, 16, 20];
        let sum = 0;
        for (const id of tipIds) {
            const tip = landmarks[id];
            const d = Math.hypot(tip.x - palm.x, tip.y - palm.y);
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
