/**
 * Main Entry Point for Garden Grow Game
 * re-Action Health Technologies
 *
 * A therapeutic browser game for dementia patients using webcam hand tracking
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Garden Grow Game - Initializing...');
    console.log('re-Action Health Technologies');
    console.log('URL:', window.location.href);
    console.log('Secure context:', window.isSecureContext);
    console.log('navigator.mediaDevices:', navigator.mediaDevices);

    // Initialize the game (camera check happens when user clicks Start)
    try {
        const success = await game.init();

        if (success) {
            console.log('Garden ready!');
        } else {
            console.error('Game initialization failed');
            showInitializationError();
        }
    } catch (error) {
        console.error('Error during initialization:', error);
        showInitializationError();
    }
});

/**
 * Check if browser supports required features
 */
function checkBrowserSupport() {
    const requirements = {
        mediaDevices: !!(navigator && navigator.mediaDevices),
        getUserMedia: !!(navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        canvas: 'HTMLCanvasElement' in window
    };

    console.log('Browser support check:', requirements);

    // If all checks pass, return true
    const supported = requirements.mediaDevices &&
                      requirements.getUserMedia &&
                      requirements.canvas;

    if (!supported) {
        console.error('Browser support failed:', requirements);
    }

    return supported;
}

/**
 * Show browser support error
 */
function showBrowserSupportError() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.innerHTML = `
            <div style="text-align: center; padding: 40px; max-width: 600px;">
                <h2 style="font-size: 36px; margin-bottom: 20px; color: #FF6347;">
                    Browser Not Supported
                </h2>
                <p style="font-size: 24px; margin-bottom: 20px; color: #ffffff;">
                    This game requires a modern browser with camera support.
                </p>
                <p style="font-size: 20px; color: #a0a0a0;">
                    Please try using:
                </p>
                <ul style="font-size: 20px; color: #ffffff; list-style: none; margin-top: 20px;">
                    <li style="margin: 10px 0;">Google Chrome</li>
                    <li style="margin: 10px 0;">Mozilla Firefox</li>
                    <li style="margin: 10px 0;">Microsoft Edge</li>
                    <li style="margin: 10px 0;">Safari (macOS/iOS)</li>
                </ul>
            </div>
        `;
    }
}

/**
 * Show initialization error
 */
function showInitializationError() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.innerHTML = `
            <div style="text-align: center; padding: 40px; max-width: 600px;">
                <h2 style="font-size: 36px; margin-bottom: 20px; color: #FF6347;">
                    Unable to Start Garden
                </h2>
                <p style="font-size: 24px; margin-bottom: 20px; color: #ffffff;">
                    There was a problem loading the hand tracking system.
                </p>
                <p style="font-size: 20px; color: #a0a0a0; margin-bottom: 30px;">
                    Please check your internet connection and try again.
                </p>
                <button onclick="location.reload()" style="
                    padding: 16px 40px;
                    font-size: 24px;
                    background: #4ade80;
                    color: #1a2e1a;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    font-weight: bold;
                ">
                    Retry
                </button>
            </div>
        `;
    }
}

/**
 * Handle visibility change (pause when tab is hidden)
 */
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        game.pause();
    }
});

/**
 * Handle before unload (cleanup)
 */
window.addEventListener('beforeunload', () => {
    game.destroy();
});

/**
 * Prevent context menu on right-click (better for touch devices)
 */
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

/**
 * Log game info
 */
console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║    🌱 GARDEN GROW - Therapeutic Hand Tracking Game 🌻    ║
║                                                           ║
║    re-Action Health Technologies                          ║
║    Helping gardens bloom, one hand at a time              ║
║                                                           ║
║    Touch seeds with your hands to grow beautiful plants!  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
