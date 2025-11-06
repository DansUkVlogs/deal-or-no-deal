/**
 * Deal or No Deal - Clean Application Entry Point
 */

// Global game instance
let game;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🚀 Starting Deal or No Deal...');
        
        // Create game instance
        game = new Game();
        
        // Setup development tools
        setupDevTools();
        
        console.log('🎲 Game initialized successfully!');
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        alert('Game failed to load. Please refresh the page.');
    }
});

/**
 * Setup development tools
 */
function setupDevTools() {
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        window.location.search.includes('debug=true')) {
        
        window.devTools = {
            revealCases: () => {
                if (game && game.board) {
                    console.table(Array.from(game.board.caseValues.entries()));
                } else {
                    console.log('Game not initialized or board not available');
                }
            },
            
            forceOffer: () => {
                if (game && game.gameState === 'playing') {
                    game.endRound();
                } else {
                    console.log('Game not in playing state');
                }
            },
            
            getStats: () => {
                return game ? game.getGameStatistics() : null;
            },
            
            setDifficulty: (level) => {
                if (game) {
                    game.setDifficulty(level);
                    console.log('Difficulty set to:', level);
                } else {
                    console.log('Game not initialized');
                }
            }
        };
        
        console.log('🔧 Dev tools loaded. Use devTools.revealCases(), devTools.forceOffer(), etc.');
    }
}

// Global error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});