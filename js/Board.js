/**
 * Board Class - Manages the briefcase grid, values, and selection logic
 */
class Board {
    constructor(animator) {
        this.animator = animator;
        this.briefcases = [];
        this.selectedCase = null;
        this.eliminatedCases = new Set();
        this.values = [
            0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750, 1000,
            5000, 10000, 25000, 50000, 75000, 100000, 200000, 
            300000, 400000, 500000, 750000, 1000000
        ];
        this.caseValues = new Map(); // Maps case number to value
        this.init();
    }

    /**
     * Initialize the board
     */
    init() {
        this.setupBriefcases();
        this.shuffleValues();
        this.renderBoard();
        this.attachEventListeners();
    }

    /**
     * Setup briefcase data structure
     */
    setupBriefcases() {
        this.briefcases = [];
        for (let i = 1; i <= 26; i++) {
            this.briefcases.push({
                number: i,
                isSelected: false,
                isEliminated: false,
                value: 0
            });
        }
    }

    /**
     * Shuffle and assign values to briefcases
     */
    shuffleValues() {
        // Validate we have the right number of values
        if (this.values.length !== this.briefcases.length) {
            console.error(`Mismatch: ${this.values.length} values for ${this.briefcases.length} briefcases`);
            throw new Error('Values and briefcases count mismatch');
        }

        // Create a copy of values and shuffle
        const shuffledValues = [...this.values];
        
        // Fisher-Yates shuffle algorithm
        for (let i = shuffledValues.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledValues[i], shuffledValues[j]] = [shuffledValues[j], shuffledValues[i]];
        }

        // Assign shuffled values to briefcases
        this.briefcases.forEach((briefcase, index) => {
            const value = shuffledValues[index];
            if (typeof value === 'undefined') {
                console.error(`Undefined value at index ${index} for briefcase ${briefcase.number}`);
                briefcase.value = 1; // Fallback value
            } else {
                briefcase.value = value;
            }
            this.caseValues.set(briefcase.number, briefcase.value);
        });

        // Validate all briefcases have values
        const invalidBriefcases = this.briefcases.filter(b => typeof b.value === 'undefined' || isNaN(b.value));
        if (invalidBriefcases.length > 0) {
            console.error('Briefcases with invalid values:', invalidBriefcases);
        }
    }

    /**
     * Render the briefcase grid
     */
    renderBoard() {
        const grid = document.getElementById('briefcase-grid');
        grid.innerHTML = '';

        this.briefcases.forEach(briefcase => {
            const briefcaseElement = this.createBriefcaseElement(briefcase);
            grid.appendChild(briefcaseElement);
        });
    }

    /**
     * Create a simple square briefcase with number
     * @param {Object} briefcase - Briefcase data
     * @returns {HTMLElement} Briefcase element
     */
    createBriefcaseElement(briefcase) {
        const element = document.createElement('div');
        element.className = 'briefcase';
        element.dataset.number = briefcase.number;
        
        // Simple number span
        const numberSpan = document.createElement('span');
        numberSpan.textContent = briefcase.number;
        element.appendChild(numberSpan);
        
        if (briefcase.isSelected) {
            element.classList.add('selected');
        }
        
        if (briefcase.isEliminated) {
            element.classList.add('eliminated');
        }

        return element;
    }

    /**
     * Attach event listeners to briefcases
     */
    attachEventListeners() {
        const grid = document.getElementById('briefcase-grid');
        
        grid.addEventListener('click', (e) => {
            // Find the briefcase element (either the clicked element or its parent)
            let briefcaseElement = e.target;
            
            // If clicked on a child element (like the number), find the parent briefcase
            if (!briefcaseElement.classList.contains('briefcase')) {
                briefcaseElement = briefcaseElement.closest('.briefcase');
            }
            
            // If we found a briefcase element, handle the click
            if (briefcaseElement && briefcaseElement.classList.contains('briefcase')) {
                const caseNumber = parseInt(briefcaseElement.dataset.number);
                this.handleBriefcaseClick(caseNumber, briefcaseElement);
            }
        });
    }

    /**
     * Handle briefcase click
     * @param {number} caseNumber - Clicked case number
     * @param {HTMLElement} element - Clicked element
     */
    async handleBriefcaseClick(caseNumber, element) {
        const briefcase = this.getBriefcase(caseNumber);
        
        if (!briefcase || briefcase.isEliminated) {
            return;
        }

        // Trigger custom event for game controller
        const event = new CustomEvent('briefcaseClicked', {
            detail: { caseNumber, element, briefcase }
        });
        document.dispatchEvent(event);
    }

    /**
     * Select a briefcase (player's choice)
     * @param {number} caseNumber - Case number to select
     */
    async selectBriefcase(caseNumber) {
        const briefcase = this.getBriefcase(caseNumber);
        const element = document.querySelector(`[data-number="${caseNumber}"]`);
        
        if (!briefcase || !element) {
            return false;
        }

        briefcase.isSelected = true;
        this.selectedCase = caseNumber;
        
        await this.animator.animateBriefcaseSelection(element);
        
        return true;
    }

    /**
     * Eliminate a briefcase
     * @param {number} caseNumber - Case number to eliminate
     * @returns {number} Value in the eliminated case
     */
    async eliminateBriefcase(caseNumber) {
        const briefcase = this.getBriefcase(caseNumber);
        const element = document.querySelector(`[data-number="${caseNumber}"]`);
        
        if (!briefcase || !element || briefcase.isEliminated) {
            return null;
        }

        briefcase.isEliminated = true;
        this.eliminatedCases.add(caseNumber);
        
        await this.animator.animateBriefcaseElimination(element);
        
        return briefcase.value;
    }

    /**
     * Get briefcase by number
     * @param {number} caseNumber - Case number
     * @returns {Object} Briefcase object
     */
    getBriefcase(caseNumber) {
        return this.briefcases.find(b => b.number === caseNumber);
    }

    /**
     * Get remaining values (not eliminated)
     * @returns {Array} Array of remaining values
     */
    getRemainingValues() {
        const remainingValues = this.briefcases
            .filter(b => !b.isEliminated)
            .map(b => b.value);
        
        // Debug log to check for invalid values
        const invalidValues = remainingValues.filter(v => typeof v !== 'number' || isNaN(v) || v <= 0);
        if (invalidValues.length > 0) {
            console.error('Invalid remaining values found:', invalidValues);
            console.error('All remaining values:', remainingValues);
        }
        
        return remainingValues;
    }

    /**
     * Get eliminated values
     * @returns {Array} Array of eliminated values
     */
    getEliminatedValues() {
        return this.briefcases
            .filter(b => b.isEliminated)
            .map(b => b.value);
    }

    /**
     * Get available cases for elimination (not selected, not eliminated)
     * @returns {Array} Array of available case numbers
     */
    getAvailableCases() {
        return this.briefcases
            .filter(b => !b.isSelected && !b.isEliminated)
            .map(b => b.number);
    }

    /**
     * Get selected case value
     * @returns {number} Value of selected case
     */
    getSelectedCaseValue() {
        if (!this.selectedCase) {
            return null;
        }
        
        const briefcase = this.getBriefcase(this.selectedCase);
        return briefcase ? briefcase.value : null;
    }

    /**
     * Get remaining cases count
     * @returns {number} Number of remaining cases
     */
    getRemainingCasesCount() {
        return this.briefcases.filter(b => !b.isEliminated).length;
    }

    /**
     * Check if case is available for selection
     * @param {number} caseNumber - Case number to check
     * @returns {boolean} True if available
     */
    isCaseAvailable(caseNumber) {
        const briefcase = this.getBriefcase(caseNumber);
        return briefcase && !briefcase.isSelected && !briefcase.isEliminated;
    }

    /**
     * Check if case is selected
     * @param {number} caseNumber - Case number to check
     * @returns {boolean} True if selected
     */
    isCaseSelected(caseNumber) {
        return this.selectedCase === caseNumber;
    }

    /**
     * Get random available case
     * @returns {number} Random available case number
     */
    getRandomAvailableCase() {
        const available = this.getAvailableCases();
        if (available.length === 0) {
            return null;
        }
        
        return available[Math.floor(Math.random() * available.length)];
    }

    /**
     * Get case statistics
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const remaining = this.getRemainingValues();
        const eliminated = this.getEliminatedValues();
        
        return {
            totalCases: this.briefcases.length,
            remainingCases: remaining.length,
            eliminatedCases: eliminated.length,
            selectedCase: this.selectedCase,
            remainingValues: remaining,
            eliminatedValues: eliminated,
            minRemainingValue: Math.min(...remaining),
            maxRemainingValue: Math.max(...remaining),
            averageRemainingValue: remaining.reduce((a, b) => a + b, 0) / remaining.length
        };
    }

    /**
     * Reset the board for a new game
     */
    reset() {
        this.selectedCase = null;
        this.eliminatedCases.clear();
        this.caseValues.clear();
        this.setupBriefcases();
        this.shuffleValues();
        this.renderBoard();
    }

    /**
     * Enable/disable board interaction
     * @param {boolean} enabled - Whether to enable interaction
     */
    setInteractionEnabled(enabled) {
        const grid = document.getElementById('briefcase-grid');
        const briefcases = grid.querySelectorAll('.briefcase');
        
        briefcases.forEach(briefcase => {
            if (enabled) {
                briefcase.style.pointerEvents = 'auto';
                if (!briefcase.classList.contains('eliminated') && 
                    !briefcase.classList.contains('selected')) {
                    briefcase.style.cursor = 'pointer';
                }
            } else {
                briefcase.style.pointerEvents = 'none';
                briefcase.style.cursor = 'default';
            }
        });
    }

    /**
     * Highlight available cases
     * @param {boolean} highlight - Whether to highlight
     */
    highlightAvailableCases(highlight) {
        const availableCases = this.getAvailableCases();
        
        availableCases.forEach(caseNumber => {
            const element = document.querySelector(`[data-number="${caseNumber}"]`);
            if (element) {
                if (highlight) {
                    element.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
                    element.style.borderColor = '#ffd700';
                } else {
                    element.style.boxShadow = '';
                    element.style.borderColor = '';
                }
            }
        });
    }

    /**
     * Get value distribution for AI/banker calculations
     * @returns {Object} Value distribution data
     */
    getValueDistribution() {
        const remaining = this.getRemainingValues();
        const lowValues = remaining.filter(v => v < 1000);
        const midValues = remaining.filter(v => v >= 1000 && v < 100000);
        const highValues = remaining.filter(v => v >= 100000);
        
        return {
            total: remaining.length,
            lowValues: lowValues.length,
            midValues: midValues.length,
            highValues: highValues.length,
            lowSum: lowValues.reduce((a, b) => a + b, 0),
            midSum: midValues.reduce((a, b) => a + b, 0),
            highSum: highValues.reduce((a, b) => a + b, 0),
            totalSum: remaining.reduce((a, b) => a + b, 0)
        };
    }

    /**
     * Get remaining cases (not eliminated, not chosen)
     * @returns {Array} Array of remaining briefcase objects
     */
    getRemainingCases() {
        return this.briefcases.filter(briefcase => 
            !briefcase.isEliminated && !briefcase.isSelected
        );
    }

    /**
     * Get the player's chosen case
     * @returns {Object} The chosen briefcase object
     */
    getChosenCase() {
        return this.briefcases.find(briefcase => briefcase.isSelected);
    }

    /**
     * Switch the player's chosen case to a different case
     * @param {number} newCaseNumber - The new case number to switch to
     */
    switchPlayerCase(newCaseNumber) {
        // Find current selected case and deselect it
        const currentSelected = this.briefcases.find(briefcase => briefcase.isSelected);
        if (currentSelected) {
            currentSelected.isSelected = false;
            // Update the DOM element
            const currentElement = document.querySelector(`[data-number="${currentSelected.number}"]`);
            if (currentElement) {
                currentElement.classList.remove('selected');
            }
        }

        // Select the new case  
        const newCase = this.briefcases.find(briefcase => briefcase.number === newCaseNumber);
        if (newCase) {
            newCase.isSelected = true;
            // Update the DOM element
            const newElement = document.querySelector(`[data-number="${newCaseNumber}"]`);
            if (newElement) {
                newElement.classList.add('selected');
            }
        }
    }
}