/**
 * Game Class - Main game controller that orchestrates all game logic
 */
class Game {
    constructor() {
        // Initialize all game components
        this.animator = new Animator();
        this.board = new Board(this.animator);
        this.banker = new Banker(this.animator);
        this.ui = new UI(this.animator);
        
        // Game state
        this.gameState = 'waiting'; // waiting, selecting, playing, banker_offer, game_over
        this.round = 1;
        this.casesToEliminate = 6; // Cases to eliminate in first round
        this.eliminatedThisRound = 0;
        this.gameHistory = [];
        
        this.init();
    }

    /**
     * Initialize the game
     */
    init() {
        this.attachEventListeners();
        this.startNewGame();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Board events
        document.addEventListener('briefcaseClicked', (e) => {
            this.handleBriefcaseClick(e.detail);
        });

        // UI events
        document.addEventListener('dealAccepted', () => {
            this.handleDealAccepted();
        });

        document.addEventListener('dealRejected', () => {
            this.handleDealRejected();
        });

        document.addEventListener('playAgain', () => {
            this.startNewGame();
        });

        document.addEventListener('continueGame', () => {
            this.handleContinueGame();
        });
    }

    /**
     * Start a new game
     */
    startNewGame() {
        // Reset all components
        this.board.reset();
        this.banker.reset();
        this.ui.reset();
        
        // Reset game state
        this.gameState = 'selecting';
        this.round = 1;
        this.casesToEliminate = 6;
        this.eliminatedThisRound = 0;
        this.gameHistory = [];
        
        // Update UI
        this.ui.updateGameMessage('Choose your briefcase to start the game!');
        this.board.highlightAvailableCases(true);
        
        this.logGameEvent('game_started');
    }

    /**
     * Handle briefcase click
     * @param {Object} detail - Click event detail
     */
    async handleBriefcaseClick(detail) {
        const { caseNumber, element, briefcase } = detail;

        if (this.gameState === 'selecting') {
            await this.selectPlayerCase(caseNumber);
        } else if (this.gameState === 'playing') {
            await this.eliminateCase(caseNumber);
        }
    }

    /**
     * Select player's briefcase
     * @param {number} caseNumber - Selected case number
     */
    async selectPlayerCase(caseNumber) {
        this.ui.setLoadingState(true);
        
        // Select the case
        await this.board.selectBriefcase(caseNumber);
        await this.ui.updateChosenCase(caseNumber);
        
        // Update game state
        this.gameState = 'playing';
        this.board.highlightAvailableCases(false);
        
        // Update UI message
        await this.ui.updateGameMessage(`Great choice! Now eliminate ${this.casesToEliminate} briefcases.`);
        
        this.ui.setLoadingState(false);
        this.logGameEvent('case_selected', { caseNumber });
    }

    /**
     * Eliminate a briefcase
     * @param {number} caseNumber - Case number to eliminate
     */
    async eliminateCase(caseNumber) {
        if (!this.board.isCaseAvailable(caseNumber)) {
            return;
        }

        this.ui.setLoadingState(true);

        // Eliminate the case and get its value
        const value = await this.board.eliminateBriefcase(caseNumber);
        
        if (value === null) {
            this.ui.setLoadingState(false);
            return;
        }

        // Show case opening animation (no modal)
        await this.ui.showCaseOpening(caseNumber, value);
        
        // Case is now eliminated, continue with game flow automatically
        this.currentEliminatedCase = { caseNumber, value };
        
        // Wait for the briefcase animation to complete, then continue
        setTimeout(async () => {
            await this.handleContinueGame();
        }, 3500); // Minimal delay since animation resolves immediately
    }

    /**
     * Handle continue after case reveal
     */
    async handleContinueGame() {
        if (!this.currentEliminatedCase) return;

        const { caseNumber, value } = this.currentEliminatedCase;
        
        // Modal auto-closes, no need to manually close
        
        // Eliminate from money board
        await this.ui.eliminateMoneyValue(value);
        
        // Update counters
        this.eliminatedThisRound++;
        const remainingCases = this.board.getRemainingCasesCount();
        await this.ui.updateCasesLeft(remainingCases);
        
        this.logGameEvent('case_eliminated', { caseNumber, value });
        
        // Check if round is complete
        if (this.eliminatedThisRound >= this.casesToEliminate) {
            await this.endRound();
        } else {
            // Continue eliminating cases
            const casesLeft = this.casesToEliminate - this.eliminatedThisRound;
            await this.ui.updateGameMessage(`Eliminate ${casesLeft} more briefcase${casesLeft === 1 ? '' : 's'}.`);
        }
        
        this.currentEliminatedCase = null;
        this.ui.setLoadingState(false);
    }

    /**
     * End the current round and show banker offer
     */
    async endRound() {
        this.eliminatedThisRound = 0;
        
        // Check if game should end - need exactly 2 cases total (1 chosen + 1 remaining)
        const totalRemainingCases = this.board.getRemainingCasesCount();
        
        if (totalRemainingCases <= 2) {
            // Offer switch option when only player's case + 1 other remains
            await this.offerSwitchOption();
            return;
        }

        // Make banker offer
        const remainingValues = this.board.getRemainingValues();
        const offer = this.banker.makeOffer(remainingValues, this.round);
        
        this.gameState = 'banker_offer';
        this.ui.setLoadingState(true);
        
        // Show "Answer Phone" button first
        await this.ui.showAnswerPhoneButton();
        
        // Then show banker offer
        await this.ui.showBankerOffer(offer);
        
        this.ui.setLoadingState(false);
        this.logGameEvent('banker_offer', { offer: offer.amount, round: this.round });
    }

    /**
     * Handle deal accepted
     */
    async handleDealAccepted() {
        this.ui.setLoadingState(true);
        
        // Hide banker
        await this.ui.hideBankerSection();
        
        // Get the banker's offer amount
        const bankerAmount = this.banker.getCurrentOffer();
        
        // Reveal what was in the player's original briefcase
        const selectedCaseValue = this.board.getSelectedCaseValue();
        const formattedCaseValue = this.banker.formatCurrency(selectedCaseValue);
        
        // Show what was in your briefcase
        await this.ui.showCaseOpening(this.selectedCase, selectedCaseValue);
        
        // Compare amounts and create message
        let comparisonMessage;
        if (selectedCaseValue > bankerAmount) {
            const difference = selectedCaseValue - bankerAmount;
            comparisonMessage = `Your briefcase contained ${formattedCaseValue}! You left ${this.banker.formatCurrency(difference)} on the table.`;
        } else if (selectedCaseValue < bankerAmount) {
            const savings = bankerAmount - selectedCaseValue;
            comparisonMessage = `Your briefcase only contained ${formattedCaseValue}. Smart choice! You saved ${this.banker.formatCurrency(savings)} by taking the deal.`;
        } else {
            comparisonMessage = `Incredible! Your briefcase contained exactly ${formattedCaseValue} - the same as the banker's offer!`;
        }
        
        // End game with banker's offer
        await this.ui.showGameOver({
            won: bankerAmount >= 50000, // Arbitrary threshold for "winning"
            finalAmount: bankerAmount,
            message: `You accepted the banker's offer and walked away with guaranteed money!\n\n${comparisonMessage}`,
            dealTaken: true
        });

        this.gameState = 'game_over';
        this.logGameEvent('deal_accepted', { 
            bankerAmount: bankerAmount, 
            briefcaseAmount: selectedCaseValue,
            difference: selectedCaseValue - bankerAmount
        });
        this.ui.setLoadingState(false);
    }

    /**
     * Handle deal rejected
     */
    async handleDealRejected() {
        this.ui.setLoadingState(true);
        
        // Hide banker
        await this.ui.hideBankerSection();
        
        // Continue to next round
        this.round++;
        this.gameState = 'playing';
        
        await this.ui.updateRoundCounter(this.round);
        
        // Determine cases to eliminate next round
        const remainingCases = this.board.getRemainingCasesCount();
        
        if (remainingCases > 10) {
            this.casesToEliminate = 5;
        } else if (remainingCases > 6) {
            this.casesToEliminate = 4;
        } else if (remainingCases > 3) {
            this.casesToEliminate = 2;
        } else {
            this.casesToEliminate = 1;
        }
        
        await this.ui.updateGameMessage(`Round ${this.round}: Eliminate ${this.casesToEliminate} briefcase${this.casesToEliminate === 1 ? '' : 's'}.`);
        
        this.logGameEvent('deal_rejected', { round: this.round });
        this.ui.setLoadingState(false);
    }

    /**
     * End the game
     */
    async endGame() {
        const selectedCaseValue = this.board.getSelectedCaseValue();
        const analysis = this.banker.getAnalysis(selectedCaseValue);
        
        let message;
        let won = false;
        
        if (analysis && selectedCaseValue > analysis.maxOffer) {
            message = `Congratulations! Your briefcase contained more than the banker's best offer of ${this.banker.formatCurrency(analysis.maxOffer)}!`;
            won = true;
        } else if (analysis) {
            message = `Your briefcase contained ${this.banker.formatCurrency(selectedCaseValue)}. The banker's best offer was ${this.banker.formatCurrency(analysis.maxOffer)}.`;
            won = selectedCaseValue >= analysis.maxOffer * 0.8; // Close to max offer
        } else {
            message = `Your briefcase contained ${this.banker.formatCurrency(selectedCaseValue)}!`;
            won = selectedCaseValue >= 100000;
        }

        await this.ui.showGameOver({
            won,
            finalAmount: selectedCaseValue,
            message,
            dealTaken: false
        });

        this.gameState = 'game_over';
        this.logGameEvent('game_ended', { 
            finalAmount: selectedCaseValue, 
            won,
            analysis 
        });
    }

    /**
     * Log game event for analytics
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    logGameEvent(event, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event,
            round: this.round,
            gameState: this.gameState,
            ...data
        };
        
        this.gameHistory.push(logEntry);
        
        // Optional: Send to analytics service
        // this.sendToAnalytics(logEntry);
    }

    /**
     * Get game statistics
     * @returns {Object} Game statistics
     */
    getGameStatistics() {
        const boardStats = this.board.getStatistics();
        const bankerOffers = this.banker.getOfferHistory();
        
        return {
            round: this.round,
            gameState: this.gameState,
            casesToEliminate: this.casesToEliminate,
            eliminatedThisRound: this.eliminatedThisRound,
            board: boardStats,
            offers: bankerOffers,
            history: this.gameHistory
        };
    }

    /**
     * Save game state (for potential resume functionality)
     * @returns {Object} Serializable game state
     */
    saveGameState() {
        return {
            gameState: this.gameState,
            round: this.round,
            casesToEliminate: this.casesToEliminate,
            eliminatedThisRound: this.eliminatedThisRound,
            boardState: {
                selectedCase: this.board.selectedCase,
                eliminatedCases: Array.from(this.board.eliminatedCases),
                caseValues: Array.from(this.board.caseValues.entries())
            },
            bankerState: {
                offers: this.banker.getOfferHistory(),
                currentOffer: this.banker.getCurrentOffer(),
                offerNumber: this.banker.offerNumber
            },
            gameHistory: this.gameHistory
        };
    }

    /**
     * Load game state (for potential resume functionality)
     * @param {Object} savedState - Previously saved game state
     */
    loadGameState(savedState) {
        // This would require additional methods in other classes
        // to restore their state. Implementing for completeness.
        console.log('Game state loading not fully implemented', savedState);
    }

    /**
     * Get help text for current game state
     * @returns {string} Help text
     */
    getHelpText() {
        const helpTexts = {
            selecting: 'Click on any briefcase to choose it as your case. This case will stay with you throughout the game.',
            playing: `You need to eliminate ${this.casesToEliminate - this.eliminatedThisRound} more briefcase${this.casesToEliminate - this.eliminatedThisRound === 1 ? '' : 's'} this round. Click on briefcases to eliminate them.`,
            banker_offer: 'The banker is making you an offer! Click "DEAL" to accept the guaranteed money, or "NO DEAL" to continue playing and risk it all.',
            game_over: 'Game completed! Click "Play Again" to start a new game.'
        };
        
        return helpTexts[this.gameState] || 'Welcome to Deal or No Deal!';
    }

    /**
     * Toggle sound effects (placeholder for future sound implementation)
     * @param {boolean} enabled - Whether sound is enabled
     */
    toggleSound(enabled) {
        // Placeholder for sound implementation
        console.log('Sound toggled:', enabled);
    }

    /**
     * Set game difficulty/banker aggressiveness
     * @param {string} difficulty - easy, normal, hard
     */
    setDifficulty(difficulty) {
        const aggressivenessLevels = {
            easy: 0.3,    // More generous offers
            normal: 0.5,  // Balanced offers
            hard: 0.7     // More conservative offers
        };
        
        const level = aggressivenessLevels[difficulty] || 0.5;
        this.banker.setAggressiveness(level);
        
        this.logGameEvent('difficulty_changed', { difficulty, aggressiveness: level });
    }

    /**
     * Get current game phase description
     * @returns {string} Phase description
     */
    getGamePhase() {
        const remainingCases = this.board.getRemainingCasesCount();
        
        if (this.gameState === 'selecting') return 'Case Selection';
        if (this.gameState === 'banker_offer') return 'Banker Negotiation';
        if (this.gameState === 'game_over') return 'Game Complete';
        
        if (remainingCases > 20) return 'Early Game';
        if (remainingCases > 10) return 'Mid Game';
        if (remainingCases > 5) return 'Late Game';
        return 'Final Rounds';
    }

    /**
     * Offer the player the option to switch briefcases with the last remaining one
     */
    async offerSwitchOption() {
        const remainingCases = this.board.getRemainingCases();
        
        if (remainingCases.length !== 1) {
            // If there's not exactly one case left (besides player's), end the game normally
            console.log('Switch not offered - remaining cases:', remainingCases.length);
            await this.endGame();
            return;
        }
        
        const lastRemainingCase = remainingCases[0];
        const playerCase = this.board.getChosenCase();
        
        console.log('Offering switch option!');
        console.log('Last remaining case:', lastRemainingCase);
        console.log('Player case:', playerCase);
        
        await this.ui.updateGameMessage('Final decision time!');
        
        // Show switch offer modal
        await this.showSwitchOfferModal(lastRemainingCase, playerCase);
    }

    /**
     * Show the switch offer modal
     * @param {Object} remainingCase - The last remaining briefcase
     * @param {Object} playerCase - The player's chosen briefcase
     */
    async showSwitchOfferModal(remainingCase, playerCase) {
        return new Promise(resolve => {
            // Create switch offer modal
            const switchModal = document.createElement('div');
            switchModal.className = 'modal active switch-modal';
            switchModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                backdrop-filter: blur(10px);
            `;
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content switch-modal-content';
            modalContent.style.cssText = `
                background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
                border: 3px solid #dc2626;
                border-radius: 20px;
                padding: 40px;
                text-align: center;
                max-width: 500px;
                color: white;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            `;
            
            modalContent.innerHTML = `
                <h2 style="color: #dc2626; font-family: 'Orbitron', monospace; font-size: 2rem; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);">
                    🔄 FINAL CHOICE 🔄
                </h2>
                <p style="font-size: 1.2rem; margin-bottom: 30px; line-height: 1.6;">
                    There are only <strong>two briefcases left</strong>:<br>
                    Your original choice <strong>Case ${playerCase.number}</strong><br>
                    and <strong>Case ${remainingCase.number}</strong>
                </p>
                <p style="font-size: 1.1rem; margin-bottom: 40px; color: #ffd700;">
                    Do you want to <strong>SWITCH</strong> briefcases<br>
                    or <strong>KEEP</strong> your original choice?
                </p>
                <div style="display: flex; gap: 20px; justify-content: center;">
                    <button id="switch-btn" style="
                        background: linear-gradient(135deg, #dc2626, #b91c1c);
                        color: white;
                        border: 2px solid #ffffff;
                        padding: 15px 30px;
                        font-size: 1.1rem;
                        font-weight: bold;
                        border-radius: 10px;
                        cursor: pointer;
                        font-family: 'Orbitron', monospace;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                    ">🔄 SWITCH to Case ${remainingCase.number}</button>
                    <button id="keep-btn" style="
                        background: linear-gradient(135deg, #059669, #047857);
                        color: white;
                        border: 2px solid #ffffff;
                        padding: 15px 30px;
                        font-size: 1.1rem;
                        font-weight: bold;
                        border-radius: 10px;
                        cursor: pointer;
                        font-family: 'Orbitron', monospace;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                    ">✋ KEEP Case ${playerCase.number}</button>
                </div>
            `;
            
            switchModal.appendChild(modalContent);
            document.body.appendChild(switchModal);
            
            // Add button hover effects
            const switchBtn = switchModal.querySelector('#switch-btn');
            const keepBtn = switchModal.querySelector('#keep-btn');
            
            [switchBtn, keepBtn].forEach(btn => {
                btn.addEventListener('mouseenter', () => {
                    btn.style.transform = 'scale(1.05) translateY(-2px)';
                    btn.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.transform = 'scale(1)';
                    btn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
                });
            });
            
            // Handle switch button click
            switchBtn.addEventListener('click', async () => {
                document.body.removeChild(switchModal);
                await this.handleSwitchDecision(true, remainingCase, playerCase);
                resolve();
            });
            
            // Handle keep button click
            keepBtn.addEventListener('click', async () => {
                document.body.removeChild(switchModal);
                await this.handleSwitchDecision(false, remainingCase, playerCase);
                resolve();
            });
        });
    }

    /**
     * Handle the player's switch decision
     * @param {boolean} switchChoice - Whether the player chose to switch
     * @param {Object} remainingCase - The remaining briefcase
     * @param {Object} originalPlayerCase - The player's original briefcase
     */
    async handleSwitchDecision(switchChoice, remainingCase, originalPlayerCase) {
        if (switchChoice) {
            // Player chose to switch
            this.board.switchPlayerCase(remainingCase.number);
            await this.ui.updateChosenCase(remainingCase.number);
            await this.ui.updateGameMessage(`You switched to Case ${remainingCase.number}!`);
            
            this.logGameEvent('switch_decision', { 
                switched: true, 
                originalCase: originalPlayerCase.number,
                newCase: remainingCase.number
            });
        } else {
            // Player chose to keep original case
            await this.ui.updateGameMessage(`You kept your original Case ${originalPlayerCase.number}!`);
            
            this.logGameEvent('switch_decision', { 
                switched: false, 
                keptCase: originalPlayerCase.number
            });
        }
        
        // Wait a moment for the message to be seen
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Now end the game and reveal both briefcases
        await this.endGameWithSwitch(switchChoice, remainingCase, originalPlayerCase);
    }

    /**
     * End the game after the switch decision, showing both briefcase values
     * @param {boolean} switched - Whether the player switched
     * @param {Object} remainingCase - The remaining briefcase
     * @param {Object} originalPlayerCase - The player's original briefcase
     */
    async endGameWithSwitch(switched, remainingCase, originalPlayerCase) {
        // Get the final player case (either original or switched)
        const finalPlayerCase = switched ? remainingCase : originalPlayerCase;
        const otherCase = switched ? originalPlayerCase : remainingCase;
        
        // Show both case values in a special modal
        const revealModal = document.createElement('div');
        revealModal.className = 'modal active final-reveal-modal';
        revealModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(10px);
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
            border: 3px solid #dc2626;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 600px;
            color: white;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
        `;
        
        const switchText = switched ? 
            `You SWITCHED from Case ${originalPlayerCase.number} to Case ${remainingCase.number}` :
            `You KEPT your original Case ${originalPlayerCase.number}`;
        
        modalContent.innerHTML = `
            <h2 style="color: #dc2626; font-family: 'Orbitron', monospace; font-size: 2rem; margin-bottom: 30px;">
                🎭 THE FINAL REVEAL 🎭
            </h2>
            <p style="font-size: 1.2rem; margin-bottom: 30px; color: #ffd700;">
                ${switchText}
            </p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
                <div style="text-align: center;">
                    <h3 style="color: ${switched ? '#dc2626' : '#059669'}; margin-bottom: 15px;">
                        ${switched ? '❌ You Left Behind' : '✅ Your Final Choice'}
                    </h3>
                    <div style="background: ${switched ? 'rgba(220, 38, 38, 0.2)' : 'rgba(5, 150, 105, 0.2)'}; border: 2px solid ${switched ? '#dc2626' : '#059669'}; border-radius: 10px; padding: 20px;">
                        <div style="font-size: 1.5rem; font-weight: bold;">Case ${originalPlayerCase.number}</div>
                        <div style="font-size: 2rem; font-family: 'Orbitron', monospace; margin-top: 10px;">
                            ${this.ui.formatCurrency(originalPlayerCase.value)}
                        </div>
                    </div>
                </div>
                <div style="text-align: center;">
                    <h3 style="color: ${switched ? '#059669' : '#dc2626'}; margin-bottom: 15px;">
                        ${switched ? '✅ Your Final Choice' : '❌ You Could Have Had'}
                    </h3>
                    <div style="background: ${switched ? 'rgba(5, 150, 105, 0.2)' : 'rgba(220, 38, 38, 0.2)'}; border: 2px solid ${switched ? '#059669' : '#dc2626'}; border-radius: 10px; padding: 20px;">
                        <div style="font-size: 1.5rem; font-weight: bold;">Case ${remainingCase.number}</div>
                        <div style="font-size: 2rem; font-family: 'Orbitron', monospace; margin-top: 10px;">
                            ${this.ui.formatCurrency(remainingCase.value)}
                        </div>
                    </div>
                </div>
            </div>
            <div style="margin-bottom: 30px;">
                <h3 style="color: #ffd700; font-size: 1.8rem; margin-bottom: 10px;">🎉 YOU WON 🎉</h3>
                <div style="font-size: 3rem; font-family: 'Orbitron', monospace; color: #ffd700; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);">
                    ${this.ui.formatCurrency(finalPlayerCase.value)}
                </div>
                <p style="margin-top: 15px; font-size: 1.1rem;">
                    ${switched ? 
                        (finalPlayerCase.value > originalPlayerCase.value ? 'Great switch! You won more!' : 'Your original case was better, but you still won!') :
                        (finalPlayerCase.value > remainingCase.value ? 'Good choice to keep your case!' : 'You could have won more by switching, but you still won!')
                    }
                </p>
            </div>
            <button id="play-again-final-btn" style="
                background: linear-gradient(135deg, #dc2626, #b91c1c);
                color: white;
                border: 2px solid #ffffff;
                padding: 15px 30px;
                font-size: 1.2rem;
                font-weight: bold;
                border-radius: 10px;
                cursor: pointer;
                font-family: 'Orbitron', monospace;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            ">🎮 PLAY AGAIN</button>
        `;
        
        revealModal.appendChild(modalContent);
        document.body.appendChild(revealModal);
        
        // Handle play again button
        const playAgainBtn = revealModal.querySelector('#play-again-final-btn');
        playAgainBtn.addEventListener('click', () => {
            document.body.removeChild(revealModal);
            this.startNewGame();
        });
        
        // Add hover effect
        playAgainBtn.addEventListener('mouseenter', () => {
            playAgainBtn.style.transform = 'scale(1.05)';
            playAgainBtn.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
        });
        playAgainBtn.addEventListener('mouseleave', () => {
            playAgainBtn.style.transform = 'scale(1)';
            playAgainBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        });
        
        // Log final game result
        this.logGameEvent('game_ended_with_switch', {
            switched,
            finalAmount: finalPlayerCase.value,
            originalCaseValue: originalPlayerCase.value,
            remainingCaseValue: remainingCase.value,
            switchWasGood: switched ? (finalPlayerCase.value > originalPlayerCase.value) : false
        });
    }

    /**
     * Export game data for analysis
     * @returns {Object} Complete game data
     */
    exportGameData() {
        return {
            gameStats: this.getGameStatistics(),
            gamePhase: this.getGamePhase(),
            savedState: this.saveGameState(),
            timestamp: new Date().toISOString()
        };
    }
}