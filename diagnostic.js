/**
 * Diagnostic Script - Run this in browser console to identify issues
 */

console.log('🔍 Running Deal or No Deal Diagnostics...');

// Check if all required elements exist
const requiredElements = [
    'briefcase-grid',
    'round-counter', 
    'cases-left',
    'chosen-case-number',
    'game-message',
    'banker-section',
    'banker-offer',
    'deal-btn',
    'no-deal-btn',
    'game-over-modal',
    'case-reveal-modal',
    'play-again-btn',
    'continue-btn'
];

console.log('✅ Checking required elements:');
const missingElements = [];
requiredElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        console.log(`✅ ${id}: Found`);
    } else {
        console.log(`❌ ${id}: Missing`);
        missingElements.push(id);
    }
});

// Check if classes are loaded
const requiredClasses = [Game, Board, Banker, UI, Animator];
console.log('\n✅ Checking required classes:');
requiredClasses.forEach(cls => {
    if (typeof cls === 'function') {
        console.log(`✅ ${cls.name}: Loaded`);
    } else {
        console.log(`❌ ${cls.name}: Missing`);
    }
});

// Check if game instance exists
console.log('\n✅ Checking game instance:');
if (typeof game !== 'undefined' && game) {
    console.log('✅ Game instance: Created');
    console.log('Game state:', game.gameState);
} else {
    console.log('❌ Game instance: Missing');
}

// Summary
console.log('\n📊 Diagnostic Summary:');
console.log(`Missing elements: ${missingElements.length}`);
if (missingElements.length > 0) {
    console.log('Missing elements:', missingElements);
}

console.log('🔍 Diagnostics complete!');