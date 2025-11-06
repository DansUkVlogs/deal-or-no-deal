/**
 * Animator Class - Handles all animations and visual effects for the Deal or No Deal game
 */
class Animator {
    constructor() {
        this.animationQueue = [];
        this.isAnimating = false;
    }

    /**
     * Add animation to queue
     * @param {Function} animationFn - Animation function to execute
     * @param {number} delay - Delay before executing animation
     */
    addToQueue(animationFn, delay = 0) {
        this.animationQueue.push({ fn: animationFn, delay });
        if (!this.isAnimating) {
            this.processQueue();
        }
    }

    /**
     * Process animation queue
     */
    async processQueue() {
        this.isAnimating = true;
        
        while (this.animationQueue.length > 0) {
            const { fn, delay } = this.animationQueue.shift();
            
            if (delay > 0) {
                await this.wait(delay);
            }
            
            await fn();
        }
        
        this.isAnimating = false;
    }

    /**
     * Wait for specified duration
     * @param {number} ms - Milliseconds to wait
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Animate briefcase selection
     * @param {HTMLElement} briefcase - Briefcase element
     */
    async animateBriefcaseSelection(briefcase) {
        return new Promise(resolve => {
            briefcase.style.transform = 'scale(1.2)';
            briefcase.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                briefcase.classList.add('selected');
                briefcase.style.transform = '';
                resolve();
            }, 300);
        });
    }

    /**
     * Animate briefcase opening - completely new clean version
     * @param {HTMLElement} briefcase - Briefcase element
     * @param {number} value - Value inside the briefcase
     */
    async animateBriefcaseOpening(briefcase, value) {
        console.log('Starting clean briefcase animation:', briefcase, value);
        
        return new Promise(resolve => {
            // Get the briefcase number
            const briefcaseNumber = briefcase.textContent || briefcase.innerText;
            
            // Hide original briefcase immediately and mark as eliminated
            briefcase.classList.add('eliminated');
            
            // Create a completely new element for the animation
            const animationBox = document.createElement('div');
            animationBox.style.cssText = `
                position: fixed;
                left: 50%;
                top: 50%;
                width: 80px;
                height: 50px;
                background: linear-gradient(135deg, #DC143C, #B22222);
                color: white;
                border: 2px solid #8B0000;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Orbitron', monospace;
                font-size: 24px;
                font-weight: bold;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
                z-index: 1001;
                transform: translate(-50%, -50%) scale(4);
                transition: transform 1.2s ease-in-out;
            `;
            animationBox.textContent = briefcaseNumber;
            document.body.appendChild(animationBox);
            
            // RESOLVE IMMEDIATELY - Let game continue right away
            resolve();
            
            // Step 1: Wait a moment, then flip (after 1s)
            setTimeout(() => {
                // Flip and change to gold background
                animationBox.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
                animationBox.style.color = '#8B0000';
                animationBox.style.transform = 'translate(-50%, -50%) scale(4) rotateY(180deg)';
                animationBox.textContent = '';
                
                // Step 2: Fade in amount after flip (after 1.2s)
                setTimeout(() => {
                    const amountText = this.formatCurrency(value);
                    const amountSpan = document.createElement('span');
                    amountSpan.style.opacity = '0';
                    amountSpan.style.transition = 'opacity 1s ease-in';
                    amountSpan.style.transform = 'rotateY(180deg)'; // Counter-rotate the text
                    amountSpan.style.whiteSpace = 'nowrap';
                    amountSpan.style.overflow = 'hidden';
                    
                    // Dynamic font sizing based on text length
                    let fontSize = 16; // Start with smaller base size
                    if (amountText.length > 10) {
                        fontSize = 8; // Extra long amounts (like £1,000,000)
                    } else if (amountText.length > 8) {
                        fontSize = 10; // Very long amounts (like £100,000)
                    } else if (amountText.length > 6) {
                        fontSize = 12; // Medium amounts (like £10,000)
                    } else if (amountText.length > 4) {
                        fontSize = 14; // Short amounts (like £100)
                    }
                    
                    amountSpan.style.fontSize = fontSize + 'px';
                    amountSpan.textContent = amountText;
                    animationBox.appendChild(amountSpan);
                    
                    // Fade in the amount
                    setTimeout(() => {
                        amountSpan.style.opacity = '1';
                    }, 100);
                    
                    // Game already resolved, no need to resolve again
                    
                }, 1200);
                
                // Step 3: Clean up animation box later (after 3.5s total)
                setTimeout(() => {
                    if (document.body.contains(animationBox)) {
                        document.body.removeChild(animationBox);
                    }
                }, 3500);
                
            }, 1000);
        });
    }

    /**
     * Format currency for display
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    formatCurrency(amount) {
        if (amount < 1) {
            const pence = Math.round(amount * 100);
            return `${pence}p`;
        }
        
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            minimumFractionDigits: 0,
            maximumFractionDigits: amount >= 1 ? 0 : 2
        }).format(amount);
    }

    /**
     * Animate briefcase elimination
     * @param {HTMLElement} briefcase - Briefcase element
     */
    async animateBriefcaseElimination(briefcase) {
        return new Promise(resolve => {
            briefcase.classList.add('revealing');
            
            setTimeout(() => {
                briefcase.classList.add('eliminated');
                briefcase.classList.remove('revealing');
                resolve();
            }, 1000);
        });
    }

    /**
     * Animate money value elimination
     * @param {HTMLElement} moneyItem - Money item element
     */
    async animateMoneyElimination(moneyItem) {
        return new Promise(resolve => {
            moneyItem.style.transform = 'scale(1.2)';
            moneyItem.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                moneyItem.classList.add('eliminated');
                moneyItem.style.transform = '';
                resolve();
            }, 300);
        });
    }

    /**
     * Animate banker entrance
     * @param {HTMLElement} bankerSection - Banker section element
     */
    async animateBankerEntrance(bankerSection) {
        return new Promise(resolve => {
            bankerSection.classList.add('active');
            
            // Add phone ringing sound effect (visual)
            const phone = bankerSection.querySelector('.banker-phone');
            phone.style.animation = 'phoneRing 0.5s ease-in-out 6';
            
            setTimeout(() => {
                phone.style.animation = '';
                resolve();
            }, 3000);
        });
    }

    /**
     * Animate banker exit
     * @param {HTMLElement} bankerSection - Banker section element
     */
    async animateBankerExit(bankerSection) {
        return new Promise(resolve => {
            bankerSection.style.animation = 'slideUp 0.5s ease-in';
            
            setTimeout(() => {
                bankerSection.classList.remove('active');
                bankerSection.style.animation = '';
                resolve();
            }, 500);
        });
    }

    /**
     * Animate offer reveal
     * @param {HTMLElement} offerElement - Offer display element
     * @param {string} amount - Offer amount
     */
    async animateOfferReveal(offerElement, amount) {
        return new Promise(resolve => {
            // Parse the target amount (remove £, $ and commas, handle pence)
            let targetAmount = 0;
            if (amount.includes('p') && !amount.includes('£')) {
                // Handle pence only (e.g. "50p")
                targetAmount = parseInt(amount.replace(/[p,]/g, '')) / 100;
            } else {
                // Handle pounds (e.g. "£1,000")
                targetAmount = parseFloat(amount.replace(/[£$,]/g, ''));
            }
            
            // Reset display and start from £0
            offerElement.textContent = '£0';
            offerElement.style.transform = 'scale(1.1)';
            offerElement.style.transition = 'all 0.3s ease';
            
            // Animate counting up from 0 to target amount
            const duration = 2000; // 2 seconds
            const steps = 60; // 60 steps for smooth animation
            const increment = targetAmount / steps;
            let currentAmount = 0;
            let step = 0;
            
            const countUp = () => {
                step++;
                currentAmount = Math.min(targetAmount, increment * step);
                
                // Format and display current amount for British currency
                let formattedAmount;
                if (currentAmount < 1) {
                    const pence = Math.round(currentAmount * 100);
                    formattedAmount = `${pence}p`;
                } else {
                    formattedAmount = new Intl.NumberFormat('en-GB', {
                        style: 'currency',
                        currency: 'GBP',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: currentAmount >= 1 ? 0 : 2
                    }).format(currentAmount);
                }
                
                offerElement.textContent = formattedAmount;
                
                if (currentAmount < targetAmount) {
                    setTimeout(countUp, duration / steps);
                } else {
                    // Final scaling animation
                    setTimeout(() => {
                        offerElement.style.transform = 'scale(1)';
                        resolve();
                    }, 200);
                }
            };
            
            // Start counting after a brief delay
            setTimeout(countUp, 300);
        });
    }

    /**
     * Animate case reveal modal
     * @param {HTMLElement} modal - Modal element
     * @param {number} caseNumber - Case number
     * @param {string} amount - Amount in case
     */
    async animateCaseReveal(modal, caseNumber, amount) {
        return new Promise(resolve => {
            const caseNumberEl = modal.querySelector('#reveal-case-number');
            const amountEl = modal.querySelector('#reveal-amount');
            
            caseNumberEl.textContent = caseNumber;
            amountEl.textContent = amount;
            
            modal.classList.add('active');
            
            // Add dramatic reveal effect
            amountEl.style.transform = 'scale(0)';
            amountEl.style.opacity = '0';
            
            setTimeout(() => {
                amountEl.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                amountEl.style.transform = 'scale(1)';
                amountEl.style.opacity = '1';
                
                setTimeout(() => {
                    amountEl.style.transition = '';
                    resolve();
                }, 800);
            }, 500);
        });
    }

    /**
     * Animate game over modal
     * @param {HTMLElement} modal - Modal element
     * @param {string} title - Modal title
     * @param {string} message - Modal message
     * @param {string} amount - Final amount
     */
    async animateGameOver(modal, title, message, amount) {
        return new Promise(resolve => {
            const titleEl = modal.querySelector('#modal-title');
            const messageEl = modal.querySelector('#modal-message');
            const amountEl = modal.querySelector('#modal-amount');
            
            titleEl.textContent = title;
            messageEl.textContent = message;
            amountEl.textContent = amount;
            
            modal.classList.add('active');
            
            // Animate elements in sequence
            const elements = [titleEl, messageEl, amountEl];
            elements.forEach((el, index) => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    el.style.transition = 'all 0.6s ease-out';
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, index * 300);
            });
            
            setTimeout(() => {
                resolve();
            }, elements.length * 300 + 600);
        });
    }

    /**
     * Animate modal close
     * @param {HTMLElement} modal - Modal element
     */
    async animateModalClose(modal) {
        return new Promise(resolve => {
            const content = modal.querySelector('.modal-content');
            content.style.transform = 'scale(0.9) translateY(20px)';
            content.style.opacity = '0';
            content.style.transition = 'all 0.3s ease-in';
            
            setTimeout(() => {
                modal.classList.remove('active');
                content.style.transform = '';
                content.style.opacity = '';
                content.style.transition = '';
                resolve();
            }, 300);
        });
    }

    /**
     * Animate statistics update
     * @param {HTMLElement} element - Statistics element
     * @param {string} newValue - New value to display
     */
    async animateStatsUpdate(element, newValue) {
        return new Promise(resolve => {
            element.style.transform = 'scale(1.3)';
            element.style.transition = 'all 0.3s ease';
            element.style.color = '#ff6b6b';
            
            setTimeout(() => {
                element.textContent = newValue;
                element.style.transform = 'scale(1)';
                element.style.color = '';
                resolve();
            }, 150);
        });
    }

    /**
     * Animate message update
     * @param {HTMLElement} messageElement - Message element
     * @param {string} newMessage - New message text
     */
    async animateMessageUpdate(messageElement, newMessage) {
        return new Promise(resolve => {
            messageElement.style.opacity = '0';
            messageElement.style.transition = 'opacity 0.3s ease';
            
            setTimeout(() => {
                messageElement.textContent = newMessage;
                messageElement.style.opacity = '1';
                resolve();
            }, 300);
        });
    }

    /**
     * Create particle effect for special events
     * @param {HTMLElement} element - Element to create particles around
     * @param {string} color - Particle color
     */
    createParticleEffect(element, color = '#ffd700') {
        const rect = element.getBoundingClientRect();
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.left = rect.left + rect.width / 2 + 'px';
            particle.style.top = rect.top + rect.height / 2 + 'px';
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.backgroundColor = color;
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9999';
            
            document.body.appendChild(particle);
            
            const angle = (i / particleCount) * Math.PI * 2;
            const velocity = 100 + Math.random() * 100;
            const duration = 1000 + Math.random() * 500;
            
            particle.animate([
                {
                    transform: 'translate(0, 0) scale(1)',
                    opacity: 1
                },
                {
                    transform: `translate(${Math.cos(angle) * velocity}px, ${Math.sin(angle) * velocity}px) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: duration,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => {
                document.body.removeChild(particle);
            };
        }
    }

    /**
     * Animate winning celebration
     * @param {HTMLElement} container - Container element
     */
    async animateWinningCelebration(container) {
        return new Promise(resolve => {
            // Create confetti effect
            this.createParticleEffect(container, '#ffd700');
            
            setTimeout(() => {
                this.createParticleEffect(container, '#ff6b6b');
            }, 200);
            
            setTimeout(() => {
                this.createParticleEffect(container, '#4ecdc4');
            }, 400);
            
            // Add screen flash effect
            const flash = document.createElement('div');
            flash.style.position = 'fixed';
            flash.style.top = '0';
            flash.style.left = '0';
            flash.style.width = '100%';
            flash.style.height = '100%';
            flash.style.backgroundColor = 'rgba(255, 215, 0, 0.3)';
            flash.style.pointerEvents = 'none';
            flash.style.zIndex = '9998';
            
            document.body.appendChild(flash);
            
            flash.animate([
                { opacity: 0 },
                { opacity: 1 },
                { opacity: 0 }
            ], {
                duration: 600,
                easing: 'ease-in-out'
            }).onfinish = () => {
                document.body.removeChild(flash);
                resolve();
            };
        });
    }

    /**
     * Animate button press
     * @param {HTMLElement} button - Button element
     */
    async animateButtonPress(button) {
        return new Promise(resolve => {
            const originalTransform = button.style.transform;
            button.style.transform = 'scale(0.95)';
            button.style.transition = 'transform 0.1s ease';
            
            setTimeout(() => {
                button.style.transform = originalTransform;
                resolve();
            }, 100);
        });
    }

    /**
     * Clear all animations
     */
    clearAnimations() {
        this.animationQueue = [];
        this.isAnimating = false;
    }
}

// Add slideUp animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-50px);
        }
    }
`;
document.head.appendChild(style);