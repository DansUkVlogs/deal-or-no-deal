/**
 * UI Class - Handles all user interface updates and interactions
 */
class UI {
    constructor(animator, audioManager = null) {
        this.animator = animator;
        this.audioManager = audioManager;
        this.elements = {};
        this.init();
    }

    /**
     * Initialize UI elements
     */
    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.setupMobileDrawer();
    }

    /**
     * Cache frequently used DOM elements
     */
    cacheElements() {
        // Helper function to safely get elements
        const safeGetElement = (id) => {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`⚠️ Element missing: ${id}`);
            }
            return element;
        };

        const safeQuerySelector = (selector) => {
            const element = document.querySelector(selector);
            if (!element) {
                console.warn(`⚠️ Element missing: ${selector}`);
            }
            return element;
        };

        this.elements = {
            // Header elements
            roundCounter: safeGetElement('round-counter'),
            casesLeft: safeGetElement('cases-left'),
            
            // Game elements
            briefcaseGrid: safeGetElement('briefcase-grid'),
            chosenCaseNumber: safeGetElement('chosen-case-number'),
            gameMessage: safeGetElement('game-message'),
            
            // Banker elements
            bankerSection: safeGetElement('banker-section'),
            bankerOffer: safeGetElement('banker-offer'),
            dealBtn: safeGetElement('deal-btn'),
            noDealBtn: safeGetElement('no-deal-btn'),
            
            // Money board
            moneyItems: document.querySelectorAll('.money-item'),
            
            // Modals
            gameOverModal: safeGetElement('game-over-modal'),
            caseRevealModal: safeGetElement('case-reveal-modal'),
            bankerModal: safeGetElement('banker-modal'),
            caseOpeningModal: safeGetElement('case-opening-modal'),
            modalTitle: safeGetElement('modal-title'),
            modalMessage: safeGetElement('modal-message'),
            modalAmount: safeGetElement('modal-amount'),
            playAgainBtn: safeGetElement('play-again-btn'),
            continueBtn: safeGetElement('case-continue-btn'),
            revealCaseNumber: safeGetElement('reveal-case-number'),
            revealAmount: safeGetElement('reveal-amount')
        };
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Deal/No Deal buttons
        if (this.elements.dealBtn) {
            this.elements.dealBtn.addEventListener('click', () => {
                if (this.animator && this.animator.animateButtonPress) {
                    this.animator.animateButtonPress(this.elements.dealBtn);
                }
                this.triggerEvent('dealAccepted');
            });
        }

        if (this.elements.noDealBtn) {
            this.elements.noDealBtn.addEventListener('click', () => {
                if (this.animator && this.animator.animateButtonPress) {
                    this.animator.animateButtonPress(this.elements.noDealBtn);
                }
                this.triggerEvent('dealRejected');
            });
        }

        // Play again button
        if (this.elements.playAgainBtn) {
            this.elements.playAgainBtn.addEventListener('click', () => {
                if (this.animator && this.animator.animateButtonPress) {
                    this.animator.animateButtonPress(this.elements.playAgainBtn);
                }
                this.triggerEvent('playAgain');
            });
        }

        // Continue button
        if (this.elements.continueBtn) {
            this.elements.continueBtn.addEventListener('click', () => {
                if (this.animator && this.animator.animateButtonPress) {
                    this.animator.animateButtonPress(this.elements.continueBtn);
                }
                this.triggerEvent('continueGame');
            });
        }

        // Modal backdrop clicks
        if (this.elements.gameOverModal) {
            this.elements.gameOverModal.addEventListener('click', (e) => {
                if (e.target === this.elements.gameOverModal) {
                    this.closeModal(this.elements.gameOverModal);
                }
            });
        }

        if (this.elements.caseRevealModal) {
            this.elements.caseRevealModal.addEventListener('click', (e) => {
                if (e.target === this.elements.caseRevealModal) {
                    // Don't allow closing case reveal modal by clicking backdrop
                    // Players must click continue
                }
            });
        }

        // Banker modal event listeners
        if (this.elements.bankerModal) {
            // Deal button in popup
            const dealBtnPopup = document.getElementById('deal-btn-popup');
            const noDealBtnPopup = document.getElementById('no-deal-btn-popup');
            
            if (dealBtnPopup) {
                dealBtnPopup.addEventListener('click', () => {
                    if (this.animator && this.animator.animateButtonPress) {
                        this.animator.animateButtonPress(dealBtnPopup);
                    }
                    this.closeModal(this.elements.bankerModal);
                    this.triggerEvent('dealAccepted');
                });
            }
            
            if (noDealBtnPopup) {
                noDealBtnPopup.addEventListener('click', () => {
                    if (this.animator && this.animator.animateButtonPress) {
                        this.animator.animateButtonPress(noDealBtnPopup);
                    }
                    this.closeModal(this.elements.bankerModal);
                    this.triggerEvent('dealRejected');
                });
            }
        }

        // Case opening modal event listeners
        if (this.elements.caseOpeningModal) {
            this.elements.caseOpeningModal.addEventListener('click', (e) => {
                if (e.target === this.elements.caseOpeningModal) {
                    // Allow closing by clicking backdrop after animation completes
                    this.closeCaseOpening();
                    this.triggerEvent('continueGame');
                }
            });
        }

        // Case continue button
        const caseContinueBtn = document.getElementById('case-continue-btn');
        if (caseContinueBtn) {
            caseContinueBtn.addEventListener('click', () => {
                if (this.animator && this.animator.animateButtonPress) {
                    this.animator.animateButtonPress(caseContinueBtn);
                }
                this.closeCaseOpening();
                this.triggerEvent('continueGame');
            });
        }

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
    }

    /**
     * Handle keyboard presses
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyPress(e) {
        // Deal/No Deal shortcuts
        if (this.elements.bankerSection.classList.contains('active')) {
            if (e.key === 'd' || e.key === 'D') {
                this.elements.dealBtn.click();
            } else if (e.key === 'n' || e.key === 'N') {
                this.elements.noDealBtn.click();
            }
        }

        // Modal shortcuts
        if (e.key === 'Enter') {
            if (this.elements.caseRevealModal.classList.contains('active')) {
                this.elements.continueBtn.click();
            } else if (this.elements.gameOverModal.classList.contains('active')) {
                this.elements.playAgainBtn.click();
            }
        }

        // Escape to close modals
        if (e.key === 'Escape') {
            if (this.elements.gameOverModal.classList.contains('active')) {
                this.closeModal(this.elements.gameOverModal);
            }
        }
    }

    /**
     * Trigger custom event
     * @param {string} eventName - Event name
     * @param {Object} detail - Event detail
     */
    triggerEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    /**
     * Update round counter
     * @param {number} round - Current round
     */
    async updateRoundCounter(round) {
        if (!this.elements.roundCounter) {
            console.warn('Round counter element not found');
            return;
        }
        await this.animator.animateStatsUpdate(this.elements.roundCounter, round.toString());
    }

    /**
     * Update cases left counter
     * @param {number} casesLeft - Number of cases left
     */
    async updateCasesLeft(casesLeft) {
        if (!this.elements.casesLeft) {
            console.warn('Cases left element not found');
            return;
        }
        await this.animator.animateStatsUpdate(this.elements.casesLeft, casesLeft.toString());
    }

    /**
     * Update chosen case display
     * @param {number} caseNumber - Chosen case number
     */
    async updateChosenCase(caseNumber) {
        await this.animator.animateStatsUpdate(this.elements.chosenCaseNumber, caseNumber.toString());
    }

    /**
     * Update game message
     * @param {string} message - New message
     */
    async updateGameMessage(message) {
        await this.animator.animateMessageUpdate(this.elements.gameMessage, message);
    }

    /**
     * Show answer phone button before banker offer
     */
    async showAnswerPhoneButton() {
        return new Promise(resolve => {
            // Create answer phone modal
            const answerModal = document.createElement('div');
            answerModal.className = 'modal active';
            answerModal.id = 'answer-phone-modal';
            answerModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            `;
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            modalContent.style.cssText = `
                background: linear-gradient(135deg, #8B0000, #DC143C);
                padding: 40px;
                border-radius: 15px;
                text-align: center;
                border: 3px solid #FFD700;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                max-width: 400px;
                color: white;
            `;
            
            modalContent.innerHTML = `
                <h2 style="margin-bottom: 20px; color: #FFD700; font-family: 'Orbitron', monospace;">📞 Phone Ringing!</h2>
                <p style="margin-bottom: 30px; font-size: 18px;">The banker is calling with an offer...</p>
                <button id="answer-phone-btn" style="
                    background: linear-gradient(135deg, #32CD32, #228B22);
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    font-size: 20px;
                    font-weight: bold;
                    border-radius: 10px;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                    transition: all 0.3s ease;
                    font-family: 'Orbitron', monospace;
                ">📞 ANSWER PHONE</button>
            `;
            
            answerModal.appendChild(modalContent);
            document.body.appendChild(answerModal);
            
            // Add hover effect to button
            const answerBtn = answerModal.querySelector('#answer-phone-btn');
            answerBtn.addEventListener('mouseenter', () => {
                answerBtn.style.transform = 'scale(1.1)';
                answerBtn.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
            });
            answerBtn.addEventListener('mouseleave', () => {
                answerBtn.style.transform = 'scale(1)';
                answerBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
            });
            
            // Handle answer button click
            answerBtn.addEventListener('click', () => {
                document.body.removeChild(answerModal);
                resolve();
            });
        });
    }

    /**
     * Show banker popup modal with offer
     * @param {Object} offer - Offer object from banker
     */
    async showBankerOffer(offer) {
        const bankerModal = document.getElementById('banker-modal');
        const bankerMessage = document.querySelector('.banker-message');
        const bankerPopupOffer = document.querySelector('.banker-popup-offer');
        
        if (!bankerModal || !bankerMessage || !bankerPopupOffer) {
            console.error('Banker modal elements not found');
            return;
        }
        
        // Update banker message and offer
        bankerMessage.textContent = offer.message;
        bankerPopupOffer.textContent = offer.formattedAmount;
        
        // Show modal with animation
        bankerModal.classList.add('active');
        
        // Play deal or no deal sound when modal appears
        if (this.audioManager) {
            this.audioManager.onDealOrNoDealModal();
        }
        
        // Animate the offer counting up from £0
        await this.animator.animateOfferReveal(bankerPopupOffer, offer.formattedAmount);
    }

    /**
     * Hide banker section
     */
    async hideBankerSection() {
        await this.animator.animateBankerExit(this.elements.bankerSection);
    }

    /**
     * Eliminate money value from board
     * @param {number} value - Value to eliminate
     */
    async eliminateMoneyValue(value) {
        const moneyItem = document.querySelector(`[data-value="${value}"]`);
        if (moneyItem) {
            await this.animator.animateMoneyElimination(moneyItem);
        }
    }

    /**
     * Hide eliminated briefcase
     * @param {number} caseNumber - Case number to hide
     */
    async eliminateBriefcase(caseNumber) {
        const briefcase = document.querySelector(`.briefcase[data-case="${caseNumber}"]`);
        if (briefcase) {
            briefcase.classList.add('eliminated');
            await this.animator.animateBriefcaseElimination(briefcase);
        }
    }

    /**
     * Show case opening animation with realistic lid opening
     * @param {number} caseNumber - Case number
     * @param {number} value - Case value
     */
    async showCaseOpening(caseNumber, value) {
        console.log('showCaseOpening called:', caseNumber, value);
        
        // Find the actual briefcase element
        const briefcase = document.querySelector(`.briefcase[data-number="${caseNumber}"]`);
        
        if (!briefcase) {
            console.error('Briefcase not found:', caseNumber);
            return;
        }
        
        // Run briefcase opening animation (no modal needed)
        if (this.animator && this.animator.animateBriefcaseOpening) {
            await this.animator.animateBriefcaseOpening(briefcase, value);
        }
        
        return Promise.resolve();
    }

    /**
     * Show value reveal overlay
     * @param {number} caseNumber - Case number
     * @param {number} value - Case value
     * @param {HTMLElement} briefcase - Briefcase element
     */
    showValueReveal(caseNumber, value, briefcase) {
        // Create temporary value display
        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'value-reveal-overlay';
        valueDisplay.innerHTML = `
            <div class="value-reveal-content">
                <div class="revealed-amount">${this.formatCurrency(value)}</div>
                <button class="btn btn-continue" onclick="this.parentElement.parentElement.remove(); document.dispatchEvent(new CustomEvent('continueGame'))">Continue</button>
            </div>
        `;
        
        // Style the overlay
        valueDisplay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease-in-out;
        `;
        
        document.body.appendChild(valueDisplay);
    }

    /**
     * Close case opening modal
     */
    async closeCaseOpening() {
        const caseOpeningModal = document.getElementById('case-opening-modal');
        if (caseOpeningModal) {
            caseOpeningModal.classList.remove('active');
        }
    }

    /**
     * Show case reveal modal
     * @param {number} caseNumber - Case number
     * @param {number} value - Case value
     */
    async showCaseReveal(caseNumber, value) {
        const caseRevealModal = this.elements.caseRevealModal;
        const revealCaseNumber = this.elements.revealCaseNumber;
        const revealAmount = this.elements.revealAmount;
        
        if (!caseRevealModal || !revealCaseNumber || !revealAmount) {
            console.error('Case reveal modal elements not found');
            // Fallback: create a simple alert-style reveal
            this.showValueReveal(caseNumber, value);
            return;
        }
        
        // Update modal content
        revealCaseNumber.textContent = caseNumber;
        revealAmount.textContent = this.formatCurrency(value);
        
        // Show modal
        caseRevealModal.classList.add('active');
        
        return new Promise(resolve => {
            // Auto-resolve after 2 seconds if continue button isn't clicked
            const autoResolve = setTimeout(() => {
                this.closeCaseReveal();
                resolve();
            }, 3000);
            
            // Listen for continue button or modal close
            const continueHandler = () => {
                clearTimeout(autoResolve);
                document.removeEventListener('continueGame', continueHandler);
                resolve();
            };
            
            document.addEventListener('continueGame', continueHandler);
        });
    }

    /**
     * Close case reveal modal
     */
    async closeCaseReveal() {
        await this.animator.animateModalClose(this.elements.caseRevealModal);
    }

    /**
     * Show game over modal
     * @param {Object} gameResult - Game result object
     */
    async showGameOver(gameResult) {
        const { won, finalAmount, message, dealTaken } = gameResult;
        
        let title = won ? '🎉 CONGRATULATIONS! 🎉' : '💸 GAME OVER 💸';
        let formattedAmount = this.formatCurrency(finalAmount);
        
        if (dealTaken) {
            title = '🤝 DEAL ACCEPTED! 🤝';
        }

        await this.animator.animateGameOver(
            this.elements.gameOverModal,
            title,
            message,
            formattedAmount
        );

        // Add celebration effect for big wins
        if (finalAmount >= 100000) {
            await this.animator.animateWinningCelebration(this.elements.gameOverModal);
        }
    }

    /**
     * Close modal
     * @param {HTMLElement} modal - Modal element
     */
    async closeModal(modal) {
        await this.animator.animateModalClose(modal);
    }

    /**
     * Format currency for British pounds
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    formatCurrency(amount) {
        // Handle invalid amounts
        if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
            console.error('Invalid amount for currency formatting:', amount);
            return '£0';
        }
        
        // Handle very small amounts (pence only)
        if (amount < 1) {
            const pence = Math.round(amount * 100);
            return `${pence}p`;
        }
        
        // Format larger amounts as pounds
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            minimumFractionDigits: 0,
            maximumFractionDigits: amount >= 1 ? 0 : 2
        }).format(amount);
    }

    /**
     * Set loading state
     * @param {boolean} loading - Whether in loading state
     */
    setLoadingState(loading) {
        const briefcases = document.querySelectorAll('.briefcase');
        briefcases.forEach(briefcase => {
            if (loading) {
                briefcase.style.pointerEvents = 'none';
                briefcase.style.opacity = '0.7';
            } else {
                briefcase.style.pointerEvents = '';
                briefcase.style.opacity = '';
            }
        });

        // Disable/enable buttons
        const buttons = [this.elements.dealBtn, this.elements.noDealBtn];
        buttons.forEach(button => {
            button.disabled = loading;
        });
    }

    /**
     * Show tooltip
     * @param {HTMLElement} element - Element to show tooltip on
     * @param {string} text - Tooltip text
     */
    showTooltip(element, text) {
        // Remove existing tooltips
        this.hideTooltips();

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.9rem;
            z-index: 10000;
            pointer-events: none;
            white-space: nowrap;
        `;

        document.body.appendChild(tooltip);

        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        }, 3000);
    }

    /**
     * Hide all tooltips
     */
    hideTooltips() {
        const tooltips = document.querySelectorAll('.tooltip');
        tooltips.forEach(tooltip => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        });
    }

    /**
     * Highlight element
     * @param {HTMLElement} element - Element to highlight
     * @param {number} duration - Highlight duration in ms
     */
    highlightElement(element, duration = 2000) {
        element.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
        element.style.borderColor = '#ffd700';
        element.style.transition = 'all 0.3s ease';

        setTimeout(() => {
            element.style.boxShadow = '';
            element.style.borderColor = '';
        }, duration);
    }

    /**
     * Update progress indicator
     * @param {number} current - Current progress
     * @param {number} total - Total progress
     */
    updateProgress(current, total) {
        const percentage = (current / total) * 100;
        
        // Create or update progress bar if it doesn't exist
        let progressBar = document.querySelector('.progress-bar');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            progressBar.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 4px;
                background: rgba(255, 255, 255, 0.2);
                z-index: 9999;
            `;
            
            const progressFill = document.createElement('div');
            progressFill.className = 'progress-fill';
            progressFill.style.cssText = `
                height: 100%;
                background: linear-gradient(90deg, #ffd700, #ffed4a);
                transition: width 0.5s ease;
                width: 0%;
            `;
            
            progressBar.appendChild(progressFill);
            document.body.appendChild(progressBar);
        }

        const progressFill = progressBar.querySelector('.progress-fill');
        progressFill.style.width = percentage + '%';
    }

    /**
     * Remove progress indicator
     */
    removeProgress() {
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.parentNode.removeChild(progressBar);
        }
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, info)
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            info: '#3498db',
            warning: '#f39c12'
        };

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10001;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Slide in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    /**
     * Reset UI for new game
     */
    reset() {
        // Reset counters
        this.elements.roundCounter.textContent = '1';
        this.elements.casesLeft.textContent = '25';
        this.elements.chosenCaseNumber.textContent = '?';
        
        // Reset message
        this.elements.gameMessage.textContent = 'Choose your briefcase to start the game!';
        
        // Hide banker
        this.elements.bankerSection.classList.remove('active');
        
        // Reset money board
        this.elements.moneyItems.forEach(item => {
            item.classList.remove('eliminated');
        });
        
        // Hide modals
        this.elements.gameOverModal.classList.remove('active');
        this.elements.caseRevealModal.classList.remove('active');
        
        // Clear any tooltips or notifications
        this.hideTooltips();
        this.removeProgress();
        
        // Remove loading state
        this.setLoadingState(false);
    }

    /**
     * Get UI statistics
     * @returns {Object} UI statistics
     */
    getStatistics() {
        return {
            modalsOpen: document.querySelectorAll('.modal.active').length,
            tooltipsShown: document.querySelectorAll('.tooltip').length,
            notificationsShown: document.querySelectorAll('.notification').length,
            bankerVisible: this.elements.bankerSection.classList.contains('active'),
            loadingState: this.elements.dealBtn.disabled
        };
    }

    /**
     * Setup mobile drawer functionality for prize values
     */
    setupMobileDrawer() {
        // Setup prizes modal button
        const prizesModalBtn = document.getElementById('prizes-modal-btn');
        const prizesModal = document.getElementById('prizes-modal');
        const closePrizesModal = document.getElementById('close-prizes-modal');
        
        if (prizesModalBtn && prizesModal) {
            // Open prizes modal
            prizesModalBtn.addEventListener('click', () => {
                this.showPrizesModal();
            });
            
            // Close modal with X button
            if (closePrizesModal) {
                closePrizesModal.addEventListener('click', () => {
                    this.closePrizesModal();
                });
            }
            
            // Close modal by clicking backdrop
            prizesModal.addEventListener('click', (e) => {
                if (e.target === prizesModal) {
                    this.closePrizesModal();
                }
            });
            
            // Close modal with Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && prizesModal.classList.contains('active')) {
                    this.closePrizesModal();
                }
            });
        }
    }
    
    /**
     * Show prizes modal with current eliminated values
     */
    showPrizesModal() {
        const prizesModal = document.getElementById('prizes-modal');
        const prizeItems = prizesModal.querySelectorAll('.prize-item');
        const moneyItems = document.querySelectorAll('.money-item');
        
        // Update prizes modal to reflect current game state
        prizeItems.forEach(prizeItem => {
            const value = prizeItem.getAttribute('data-value');
            const correspondingMoneyItem = document.querySelector(`.money-item[data-value="${value}"]`);
            
            if (correspondingMoneyItem && correspondingMoneyItem.classList.contains('eliminated')) {
                prizeItem.classList.add('crossed-out');
            } else {
                prizeItem.classList.remove('crossed-out');
            }
        });
        
        // Show modal
        prizesModal.classList.add('active');
        
        // Add animation
        const modalContent = prizesModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.transform = 'scale(0.8)';
            modalContent.style.transition = 'transform 0.3s ease';
            setTimeout(() => {
                modalContent.style.transform = 'scale(1)';
            }, 50);
        }
    }
    
    /**
     * Close prizes modal
     */
    closePrizesModal() {
        const prizesModal = document.getElementById('prizes-modal');
        const modalContent = prizesModal.querySelector('.modal-content');
        
        if (modalContent) {
            modalContent.style.transform = 'scale(0.8)';
            setTimeout(() => {
                prizesModal.classList.remove('active');
                modalContent.style.transform = 'scale(1)';
            }, 200);
        } else {
            prizesModal.classList.remove('active');
        }
    }
}