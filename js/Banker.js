/**
 * Banker Class - Handles offer calculations and banker interactions
 */
class Banker {
    constructor(animator) {
        this.animator = animator;
        this.offers = [];
        this.currentOffer = 0;
        this.offerNumber = 0;
        this.aggressiveness = 0.5; // How aggressive the banker is (0-1)
    }

    /**
     * Calculate banker's offer based on remaining values
     * @param {Array} remainingValues - Array of remaining case values
     * @param {number} round - Current round number
     * @param {Object} gameState - Additional game state information
     * @returns {number} Calculated offer amount
     */
    calculateOffer(remainingValues, round, gameState = {}) {
        if (!remainingValues || remainingValues.length === 0) {
            return 0;
        }

        // Validate remaining values - filter out any invalid values
        const validValues = remainingValues.filter(value => 
            typeof value === 'number' && !isNaN(value) && value > 0
        );

        if (validValues.length === 0) {
            console.error('No valid remaining values for banker calculation:', remainingValues);
            return 1000; // Return a safe default offer
        }

        console.log('Banker calculating offer with values:', validValues);

        // Base calculation: Expected value with psychological adjustments
        const expectedValue = this.calculateExpectedValue(validValues);
        
        // Apply round-based multiplier
        const roundMultiplier = this.getRoundMultiplier(round, validValues.length);
        
        // Apply psychological factors
        const psychologyMultiplier = this.getPsychologyMultiplier(validValues, gameState);
        
        // Apply risk adjustment
        const riskMultiplier = this.getRiskMultiplier(validValues);
        
        // Calculate final offer
        let offer = expectedValue * roundMultiplier * psychologyMultiplier * riskMultiplier;
        
        // Special handling for final cases - ensure competitive offers
        if (validValues.length <= 3) {
            const minCompetitiveOffer = expectedValue * 0.85; // At least 85% of expected value
            offer = Math.max(offer, minCompetitiveOffer);
        }
        
        // Check for NaN at each step
        if (isNaN(offer)) {
            console.error('Offer calculation resulted in NaN:', {
                expectedValue,
                roundMultiplier,
                psychologyMultiplier,
                riskMultiplier
            });
            offer = expectedValue * 0.7; // Better fallback calculation
        }
        
        // Add some randomness to make it less predictable
        const randomFactor = 0.95 + (Math.random() * 0.1); // ±5% randomness
        offer *= randomFactor;
        
        // Round to reasonable amounts
        offer = this.roundOffer(offer);
        
        // Ensure offer progression (usually increasing over time)
        if (this.offers.length > 0 && round > 1) {
            const lastOffer = this.offers[this.offers.length - 1];
            const minIncrease = lastOffer * 1.05; // At least 5% increase
            offer = Math.max(offer, minIncrease);
        }
        
        // Cap the offer at reasonable maximum (allow up to 95% of expected value for final rounds)
        const maxOfferMultiplier = remainingValues.length <= 3 ? 0.95 : 0.85;
        const maxOffer = expectedValue * maxOfferMultiplier;
        offer = Math.min(offer, maxOffer);
        
        // Final safety check
        if (isNaN(offer) || offer <= 0) {
            console.error('Final offer is invalid:', offer);
            offer = Math.max(1, Math.min(...validValues) * 0.1); // Very conservative fallback
        }

        this.currentOffer = Math.round(offer);
        this.offers.push(this.currentOffer);
        this.offerNumber++;
        
        console.log('Banker final offer:', this.currentOffer);
        return this.currentOffer;
    }

    /**
     * Calculate expected value of remaining cases
     * @param {Array} values - Array of values
     * @returns {number} Expected value
     */
    calculateExpectedValue(values) {
        if (values.length === 0) return 0;
        return values.reduce((sum, value) => sum + value, 0) / values.length;
    }

    /**
     * Get round-based multiplier
     * @param {number} round - Current round
     * @param {number} remainingCases - Number of remaining cases
     * @returns {number} Multiplier
     */
    getRoundMultiplier(round, remainingCases) {
        // Make offers more generous, especially in later rounds
        
        // Final case scenarios - very generous offers
        if (remainingCases <= 2) return 0.95; // 95% of expected value with 2 cases left
        if (remainingCases <= 3) return 0.90; // 90% with 3 cases left
        if (remainingCases <= 5) return 0.85; // 85% with 5 or fewer cases
        if (remainingCases <= 10) return 0.80; // 80% with 10 or fewer cases
        
        // Early to mid rounds - still competitive
        if (round === 1) return 0.25; // Improved first offer
        if (round === 2) return 0.35;
        if (round === 3) return 0.45;
        if (round === 4) return 0.55;
        if (round === 5) return 0.65;
        if (round === 6) return 0.75;
        
        return 0.70; // Default for later rounds
    }

    /**
     * Get psychology-based multiplier
     * @param {Array} remainingValues - Remaining values
     * @param {Object} gameState - Game state
     * @returns {number} Multiplier
     */
    getPsychologyMultiplier(remainingValues, gameState) {
        let multiplier = 1.0;
        
        // If player has been rejecting good offers, banker gets more aggressive
        if (this.offers.length > 3) {
            const recentOffers = this.offers.slice(-3);
            const avgRecentOffer = recentOffers.reduce((a, b) => a + b, 0) / recentOffers.length;
            const currentExpected = this.calculateExpectedValue(remainingValues);
            
            if (avgRecentOffer > currentExpected * 0.6) {
                multiplier *= 1.1; // Player rejected good offers, increase pressure
            }
        }
        
        // High-value distribution analysis
        const highValues = remainingValues.filter(v => v >= 100000);
        const lowValues = remainingValues.filter(v => v < 1000);
        const totalValues = remainingValues.length;
        
        // When mostly high values are left, banker should offer competitively
        if (highValues.length / totalValues > 0.7) {
            // Mostly high values left - banker offers more competitively
            multiplier *= 1.05;
        } else if (highValues.length / totalValues > 0.5) {
            // Good mix with high values - slight premium
            multiplier *= 1.02;
        } else if (lowValues.length / totalValues > 0.6) {
            // Many low values left, banker is more aggressive
            multiplier *= 1.15;
        }
        
        // Special bonus for final cases with high values
        if (totalValues <= 3 && highValues.length >= 1) {
            multiplier *= 1.1; // Extra bonus when high values are in final cases
        }
        
        return multiplier;
    }

    /**
     * Get risk-based multiplier
     * @param {Array} remainingValues - Remaining values
     * @returns {number} Multiplier
     */
    getRiskMultiplier(remainingValues) {
        // Calculate variance to determine risk
        const mean = this.calculateExpectedValue(remainingValues);
        const variance = remainingValues.reduce((sum, value) => {
            return sum + Math.pow(value - mean, 2);
        }, 0) / remainingValues.length;
        
        const standardDeviation = Math.sqrt(variance);
        const coefficientOfVariation = standardDeviation / mean;
        
        // Higher variance = more risk = lower offers
        if (coefficientOfVariation > 2) return 0.85; // High risk
        if (coefficientOfVariation > 1.5) return 0.9; // Medium-high risk
        if (coefficientOfVariation > 1) return 0.95; // Medium risk
        
        return 1.0; // Low risk
    }

    /**
     * Round offer to reasonable amounts
     * @param {number} offer - Raw offer amount
     * @returns {number} Rounded offer
     */
    roundOffer(offer) {
        if (offer < 100) return Math.round(offer / 5) * 5;
        if (offer < 1000) return Math.round(offer / 10) * 10;
        if (offer < 10000) return Math.round(offer / 100) * 100;
        if (offer < 100000) return Math.round(offer / 500) * 500;
        if (offer < 500000) return Math.round(offer / 1000) * 1000;
        
        return Math.round(offer / 5000) * 5000;
    }

    /**
     * Format currency amount for British pounds
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency string
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
     * Get banker's message based on offer and game state
     * @param {number} offer - Current offer
     * @param {Array} remainingValues - Remaining values
     * @param {number} round - Current round
     * @returns {string} Banker's message
     */
    getBankerMessage(offer, remainingValues, round) {
        const expectedValue = this.calculateExpectedValue(remainingValues);
        const offerRatio = offer / expectedValue;
        
        const messages = {
            generous: [
                "This is an excellent offer! Don't let it slip away!",
                "I'm being very generous here. Take it!",
                "You won't see an offer like this again!",
                "This is more than fair - take the deal!",
                "I'm practically giving money away here!"
            ],
            fair: [
                "This is a solid offer. What do you say?",
                "A fair deal for both of us. Deal or no deal?",
                "This offer reflects the current situation well.",
                "A reasonable offer given what's left.",
                "This is what the math says it's worth."
            ],
            low: [
                "Let's start with this reasonable offer.",
                "This is what I can offer right now.",
                "Take this guaranteed money!",
                "A bird in the hand is worth two in the bush.",
                "Don't risk it all for potentially nothing!"
            ],
            pressure: [
                "The pressure is mounting! What's it going to be?",
                "Time is running out... Deal or no deal?",
                "The stakes are high! Make your choice!",
                "This could be your last good offer!",
                "Don't let greed cloud your judgment!"
            ],
            final: [
                "This is it - my final offer!",
                "Last chance to walk away with guaranteed money!",
                "All or nothing time! What's your decision?",
                "One briefcase left... is it worth the risk?",
                "Take the guaranteed money or risk it all!"
            ]
        };

        let category;
        
        if (remainingValues.length <= 2) {
            category = 'final';
        } else if (round > 4) {
            category = 'pressure';
        } else if (offerRatio > 0.7) {
            category = 'generous';
        } else if (offerRatio > 0.4) {
            category = 'fair';
        } else {
            category = 'low';
        }

        const categoryMessages = messages[category];
        return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
    }

    /**
     * Make an offer
     * @param {Array} remainingValues - Array of remaining values
     * @param {number} round - Current round number
     * @param {Object} gameState - Additional game state
     * @returns {Object} Offer object with amount and message
     */
    makeOffer(remainingValues, round, gameState = {}) {
        const amount = this.calculateOffer(remainingValues, round, gameState);
        const message = this.getBankerMessage(amount, remainingValues, round);
        
        return {
            amount,
            formattedAmount: this.formatCurrency(amount),
            message,
            round,
            offerNumber: this.offerNumber
        };
    }

    /**
     * Get offer history
     * @returns {Array} Array of previous offers
     */
    getOfferHistory() {
        return [...this.offers];
    }

    /**
     * Get current offer
     * @returns {number} Current offer amount
     */
    getCurrentOffer() {
        return this.currentOffer;
    }

    /**
     * Reset banker for new game
     */
    reset() {
        this.offers = [];
        this.currentOffer = 0;
        this.offerNumber = 0;
        this.aggressiveness = 0.5;
    }

    /**
     * Set banker aggressiveness
     * @param {number} level - Aggressiveness level (0-1)
     */
    setAggressiveness(level) {
        this.aggressiveness = Math.max(0, Math.min(1, level));
    }

    /**
     * Get statistical analysis of offers vs actual values
     * @param {number} finalValue - Final value player received
     * @returns {Object} Analysis object
     */
    getAnalysis(finalValue) {
        if (this.offers.length === 0) {
            return null;
        }

        const maxOffer = Math.max(...this.offers);
        const lastOffer = this.offers[this.offers.length - 1];
        const avgOffer = this.offers.reduce((a, b) => a + b, 0) / this.offers.length;

        return {
            totalOffers: this.offers.length,
            maxOffer,
            lastOffer,
            avgOffer,
            finalValue,
            maxOfferDifference: finalValue - maxOffer,
            lastOfferDifference: finalValue - lastOffer,
            playerMadeGoodChoice: finalValue > maxOffer,
            offers: [...this.offers]
        };
    }

    /**
     * Simulate what the banker would offer in different scenarios
     * @param {Array} scenarios - Array of scenario objects with remaining values
     * @returns {Array} Array of simulated offers
     */
    simulateOffers(scenarios) {
        return scenarios.map((scenario, index) => {
            return this.calculateOffer(scenario.remainingValues, index + 1, scenario.gameState);
        });
    }
}