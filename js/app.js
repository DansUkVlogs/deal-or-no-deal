/**
 * Deal or No Deal - Main Application Entry Point
 * 
 * A professional HTML/CSS/JavaScript implementation of the popular game show
 * Built with modular, object-oriented architecture for easy maintenance and debugging
 */

// Global game instance
let game;

/**
 * Application initialization
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeApplication();
});

/**
 * Initialize the application
 */
function initializeApplication() {
    try {
        console.log('🚀 Initializing Deal or No Deal...');
        
        // Verify all required elements exist
        const requiredElements = [
            'briefcase-grid', 'round-counter', 'cases-left', 'chosen-case-number',
            'game-message', 'banker-section', 'banker-offer', 'deal-btn', 'no-deal-btn',
            'game-over-modal', 'case-reveal-modal', 'play-again-btn', 'continue-btn'
        ];
        
        const missingElements = [];
        requiredElements.forEach(id => {
            if (!document.getElementById(id)) {
                missingElements.push(id);
            }
        });

        if (missingElements.length > 0) {
            console.error('❌ Missing required HTML elements:', missingElements);
            showCriticalError(`Missing HTML elements: ${missingElements.join(', ')}`);
            return;
        }

        console.log('✅ All required HTML elements found');
        
        // Create the main game instance
        game = new Game();
        
        // Add global error handling
        setupErrorHandling();
        
        // Setup development tools (only in development)
        if (isDevelopmentMode()) {
            setupDevelopmentTools();
        }
        
        // Setup accessibility features
        setupAccessibility();
        
        console.log('🎲 Deal or No Deal game initialized successfully!');
        console.log('📝 Game instance available as global variable "game"');
        
    } catch (error) {
        console.error('❌ Failed to initialize game:', error);
        showCriticalError('Failed to initialize game. Please refresh the page.');
    }
}

/**
 * Setup error handling
 */
function setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        logError('global_error', event.error);
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        logError('unhandled_promise', event.reason);
    });
}

/**
 * Check if in development mode
 * @returns {boolean} True if in development mode
 */
function isDevelopmentMode() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.search.includes('debug=true');
}

/**
 * Setup development tools
 */
function setupDevelopmentTools() {
    // Add development console commands
    window.devTools = {
        // Reveal all case values (cheat for testing)
        revealCases: () => {
            if (game && game.board) {
                console.table(Array.from(game.board.caseValues.entries()));
            }
        },
        
        // Force banker offer
        forceOffer: () => {
            if (game && game.gameState === 'playing') {
                game.endRound();
            }
        },
        
        // Skip to final case
        skipToEnd: () => {
            if (game && game.board) {
                const availableCases = game.board.getAvailableCases();
                availableCases.slice(0, -2).forEach(caseNum => {
                    game.board.eliminateBriefcase(caseNum);
                });
                game.endRound();
            }
        },
        
        // Get game statistics
        getStats: () => {
            return game ? game.getGameStatistics() : null;
        },
        
        // Export game data
        exportData: () => {
            return game ? game.exportGameData() : null;
        },
        
        // Set difficulty
        setDifficulty: (level) => {
            if (game) {
                game.setDifficulty(level);
                console.log('Difficulty set to:', level);
            }
        }
    };
    
    console.log('🔧 Development tools loaded. Access via window.devTools');
    console.log('Available commands:');
    console.log('- devTools.revealCases() - Show all case values');
    console.log('- devTools.forceOffer() - Force banker offer');
    console.log('- devTools.skipToEnd() - Skip to final cases');
    console.log('- devTools.getStats() - Get game statistics');
    console.log('- devTools.exportData() - Export game data');
    console.log('- devTools.setDifficulty("easy"|"normal"|"hard") - Set difficulty');
}

/**
 * Setup accessibility features
 */
function setupAccessibility() {
    // Focus management for keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Tab navigation for briefcases
        if (e.key === 'Tab' && !e.shiftKey) {
            const briefcases = document.querySelectorAll('.briefcase:not(.eliminated):not(.selected)');
            if (briefcases.length > 0 && document.activeElement) {
                const currentIndex = Array.from(briefcases).indexOf(document.activeElement);
                if (currentIndex >= 0 && currentIndex < briefcases.length - 1) {
                    e.preventDefault();
                    briefcases[currentIndex + 1].focus();
                }
            }
        }
        
        // Enter to select focused briefcase
        if (e.key === 'Enter' && document.activeElement.classList.contains('briefcase')) {
            document.activeElement.click();
        }
        
        // Help key (F1)
        if (e.key === 'F1') {
            e.preventDefault();
            showHelpDialog();
        }
    });

    // Add ARIA labels and roles
    setupAriaLabels();
    
    // High contrast mode detection
    if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
        document.body.classList.add('high-contrast');
    }
    
    // Reduced motion detection
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.body.classList.add('reduced-motion');
    }
}

/**
 * Setup ARIA labels for accessibility
 */
function setupAriaLabels() {
    // Add labels to briefcases
    const observer = new MutationObserver(() => {
        const briefcases = document.querySelectorAll('.briefcase');
        briefcases.forEach(briefcase => {
            const number = briefcase.textContent;
            briefcase.setAttribute('role', 'button');
            briefcase.setAttribute('tabindex', '0');
            briefcase.setAttribute('aria-label', `Briefcase ${number}`);
            
            if (briefcase.classList.contains('selected')) {
                briefcase.setAttribute('aria-label', `Your chosen briefcase ${number}`);
            } else if (briefcase.classList.contains('eliminated')) {
                briefcase.setAttribute('aria-label', `Eliminated briefcase ${number}`);
            }
        });
    });
    
    observer.observe(document.getElementById('briefcase-grid'), {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
}

/**
 * Show help dialog
 */
function showHelpDialog() {
    if (!game) return;
    
    const helpText = game.getHelpText();
    const gamePhase = game.getGamePhase();
    
    alert(`Deal or No Deal - Help\n\nCurrent Phase: ${gamePhase}\n\n${helpText}\n\nKeyboard Shortcuts:\n- Tab: Navigate briefcases\n- Enter: Select briefcase\n- D: Deal (when banker offers)\n- N: No Deal (when banker offers)\n- F1: Show this help`);
}

/**
 * Log error for debugging
 * @param {string} type - Error type
 * @param {Error} error - Error object
 */
function logError(type, error) {
    const errorData = {
        type,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        gameState: game ? game.gameState : 'unknown',
        userAgent: navigator.userAgent
    };
    
    // In a real application, you would send this to your error tracking service
    console.error('Error logged:', errorData);
}

/**
 * Show critical error message
 * @param {string} message - Error message
 */
function showCriticalError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #e74c3c;
        color: white;
        padding: 30px;
        border-radius: 10px;
        z-index: 10002;
        text-align: center;
        font-size: 1.2rem;
        max-width: 400px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    `;
    
    errorDiv.innerHTML = `
        <h3>⚠️ Critical Error</h3>
        <p>${message}</p>
        <button onclick="location.reload()" style="
            background: white;
            color: #e74c3c;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin-top: 15px;
            cursor: pointer;
            font-weight: bold;
        ">Reload Page</button>
    `;
    
    document.body.appendChild(errorDiv);
}

/**
 * Performance monitoring (optional)
 */
function setupPerformanceMonitoring() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = {
                    loadTime: performance.now(),
                    navigation: performance.getEntriesByType('navigation')[0],
                    memory: performance.memory
                };
                
                console.log('Performance data:', perfData);
            }, 0);
        });
    }
}

/**
 * Service worker registration for offline capability (future enhancement)
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered:', registration);
            })
            .catch(error => {
                console.log('SW registration failed:', error);
            });
    }
}

// Optional: Setup performance monitoring
if (isDevelopmentMode()) {
    setupPerformanceMonitoring();
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Game, initializeApplication };
}