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
        
        // Setup mute button
        setupMuteButton();
        
        // Show audio system status
        setTimeout(() => {
            const audioStatus = game.audioManager.getStatus();
            console.log('🎵 Audio System Status:', audioStatus);
            
            if (!audioStatus.enabled) {
                console.warn('⚠️ Audio system disabled');
            } else {
                const soundCount = audioStatus.soundsLoaded.good + audioStatus.soundsLoaded.bad;
                console.log(`🔊 Audio ${audioStatus.muted ? 'muted' : 'enabled'} - ${soundCount} sound effects loaded`);
                
                if (soundCount === 0) {
                    console.log('💡 No audio files found. To add audio, create:');
                    console.log('   - assets/sounds/ambience.mp3 (background music)');
                    console.log('   - assets/sounds/banker.mp3 (banker music)');
                    console.log('   - assets/sounds/deal-or-no-deal.mp3 (button sounds)');
                    console.log('   - assets/sounds/good/ folder with reaction sounds');
                    console.log('   - assets/sounds/bad/ folder with reaction sounds');
                }
            }
        }, 1000);
        
        // Setup development tools
        setupDevTools();
        
        console.log('🎲 Game initialized successfully!');
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        alert('Game failed to load. Please refresh the page.');
    }
});

/**
 * Setup mute button functionality
 */
function setupMuteButton() {
    const muteButton = document.getElementById('mute-toggle-btn');
    const muteIcon = document.getElementById('mute-icon');
    const muteText = document.getElementById('mute-text');
    
    if (!muteButton || !muteIcon || !muteText) {
        console.warn('Mute button elements not found');
        return;
    }
    
    // Set initial state based on saved preference
    updateMuteButtonUI(game.audioManager.isMuted);
    
    // Add click event listener
    muteButton.addEventListener('click', () => {
        const isMuted = game.audioManager.toggleMute();
        updateMuteButtonUI(isMuted);
    });
    
    function updateMuteButtonUI(isMuted) {
        if (isMuted) {
            muteIcon.textContent = '🔇';
            muteText.textContent = 'Muted';
            muteButton.classList.add('muted');
        } else {
            muteIcon.textContent = '🔊';
            muteText.textContent = 'Sound';
            muteButton.classList.remove('muted');
        }
    }
}

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
            },
            
            audioStatus: () => {
                return game ? game.audioManager.getStatus() : null;
            },
            
            testAudio: () => {
                if (game && game.audioManager) {
                    console.log('Testing audio system...');
                    console.log('Current audio status:', game.audioManager.getStatus());
                    game.audioManager.startBackgroundMusic();
                    setTimeout(() => game.audioManager.playSoundEffect('deal'), 2000);
                } else {
                    console.log('Audio manager not available');
                }
            },
            
            forceAmbience: () => {
                if (game && game.audioManager && game.audioManager.sounds.ambience) {
                    console.log('🎵 Force starting ambience...');
                    const audio = game.audioManager.sounds.ambience;
                    audio.volume = 0.3;
                    audio.currentTime = 0;
                    audio.play().then(() => {
                        console.log('✅ Ambience started successfully!');
                    }).catch(error => {
                        console.log('❌ Ambience failed to start:', error);
                    });
                } else {
                    console.log('Ambience audio not available');
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