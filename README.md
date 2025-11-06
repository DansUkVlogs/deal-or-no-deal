# 🎪 Deal or No Deal - HTML5 Game

A professional, fully-featured HTML5 recreation of the classic TV game show "Deal or No Deal" with UK styling, mobile optimization, animated briefcase reveals, and authentic game mechanics including the final switch decision.

## 🎮 Features

### 🎯 Core Game Features
- **26 Briefcases** with randomized values from 1p to £1,000,000 (UK Version)
- **Authentic UK Styling** - Red theme and British currency formatting
- **Final Switch Decision** - Classic end-game choice to switch or keep your briefcase
- **Intelligent Banker AI** with psychological offer calculations
- **Progressive Round System** - Eliminate cases in rounds (6-5-4-3-2-1-1-1...)
- **Flashcard Briefcase Animation** - Smooth flip animation revealing prize values
- **Deal Acceptance Reveal** - Shows your original briefcase contents when accepting deals

### 📱 Mobile & Responsive Features
- **Mobile-First Design** - Optimized for all screen sizes
- **Floating Prizes Button** - Corner button opens full-screen prize modal on mobile
- **Touch-Friendly Interface** - Large touch targets and gesture support
- **Custom Scrollbar** - Themed scrolling for briefcase grid
- **Collapsible Prize Drawer** - Space-efficient mobile prize viewing
- **Responsive Briefcase Grid** - Consistent spacing across all devices

### 🎨 Visual & Animation Features
- **UK Red Theme** - Authentic British Deal or No Deal styling
- **Smooth Briefcase Reveals** - Center-focused flip animations
- **Elimination Effects** - Fade-out transitions for opened briefcases
- **Modal System** - Professional modals for all game interactions
- **Hover Effects** - Interactive feedback on all clickable elements
- **Loading States** - Visual feedback during game transitions

### 🏗️ Technical Architecture
- **Modular ES6 Classes** - Clean separation of concerns with 5 main classes
- **Event-Driven Design** - Custom event system for loose coupling
- **Mobile-Responsive CSS Grid** - Flexible briefcase layout system
- **British Currency Formatting** - Proper £ and pence display using Intl API
- **Touch Event Handling** - Optimized for mobile interactions
- **Memory Efficient** - Clean DOM manipulation and state management

### 🎪 Advanced Game Features
- **Banker Phone Animation** - "Answer phone" modal before each offer
- **Switch Decision Modal** - Dramatic final choice between two briefcases
- **Dual Briefcase Reveal** - Shows both values and switch comparison
- **Prize Elimination Tracking** - Visual strikethrough of eliminated prizes
- **Contextual Banker Messages** - Dynamic dialogue based on game state
- **Play Again Functionality** - Instant game restart from any end state

## 📁 Project Structure

```
deal-or-no-deal/
├── index.html          # Main game interface
├── css/
│   └── styles.css      # Professional styling with animations
├── js/
│   ├── Game.js         # Main game controller and switch logic
│   ├── Board.js        # Briefcase management and grid rendering  
│   ├── Banker.js       # AI offer calculations and messaging
│   ├── UI.js           # Interface updates and mobile modal system
│   ├── Animator.js     # Briefcase flip animations and effects
│   └── app-clean.js    # Game initialization and startup
└── assets/             # Future assets (images, sounds, etc.)
```

## 🚀 Getting Started

1. **Open the game**: Simply open `index.html` in any modern web browser
2. **Choose your briefcase**: Click on any briefcase (1-26) to select it as yours
3. **Eliminate cases**: Click on other briefcases to eliminate them and reveal their values
4. **Banker offers**: After each round, the banker will make you an offer
5. **Deal or No Deal**: Choose to accept the guaranteed money or continue playing
6. **Win big**: Try to keep the high values and get the best deal possible!

## 🎯 How to Play

### Game Rules
1. **Select Your Case**: Choose one briefcase to keep (this is your potential prize)
2. **Elimination Rounds**: Remove other briefcases to reveal their values
3. **Banker Offers**: The banker analyzes remaining values and makes offers
4. **Decision Time**: Accept the deal for guaranteed money, or risk it for potentially more
5. **Final Reveal**: If you reject all offers, you win whatever is in your chosen briefcase

### Round Structure
- **Round 1**: Eliminate 6 cases
- **Round 2**: Eliminate 5 cases  
- **Round 3**: Eliminate 4 cases
- **Round 4**: Eliminate 3 cases
- **Round 5**: Eliminate 2 cases
- **Rounds 6-8**: Eliminate 1 case each
- **Final Decision**: Switch or keep your original briefcase - classic TV show ending!

## 🛠️ Development Tools

The game includes built-in development tools accessible via browser console:

```javascript
// Reveal all case values (for testing)
devTools.revealCases()

// Force banker offer
devTools.forceOffer()

// Skip to final cases
devTools.skipToEnd()

// Get game statistics
devTools.getStats()

// Export game data
devTools.exportData()

// Set difficulty level
devTools.setDifficulty("easy") // "easy", "normal", "hard"
```

## ⌨️ Keyboard Shortcuts

- **Tab**: Navigate between available briefcases
- **Enter**: Select focused briefcase
- **D**: Accept deal (when banker is offering)
- **N**: Reject deal (when banker is offering)  
- **F1**: Show help dialog
- **Escape**: Close modals

## 🎨 Customization

### Changing Values
Edit the `values` array in `Board.js`:
```javascript
this.values = [1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750, 1000,
               5000, 10000, 25000, 50000, 75000, 100000, 200000, 
               300000, 400000, 500000, 750000, 1000000];
```

### Adjusting Banker AI
Modify banker aggressiveness in `Banker.js`:
```javascript
// More generous offers
this.aggressiveness = 0.3;

// More conservative offers  
this.aggressiveness = 0.7;
```

### Styling Changes
All visual customization can be done in `css/styles.css`:
- Colors and gradients
- Animation timings
- Layout and spacing
- Responsive breakpoints

## 🔧 Architecture Details

### Class Responsibilities

**Game.js** - Main Controller
- Orchestrates game flow and state management
- Handles round progression and win conditions
- Manages event coordination between classes

**Board.js** - Briefcase Management  
- Handles briefcase grid rendering and interactions
- Manages case selection and elimination
- Tracks remaining values and statistics

**Banker.js** - AI & Offer Logic
- Calculates intelligent offers based on game state
- Implements psychological pressure tactics
- Provides contextual banker messages

**UI.js** - Interface Management
- Updates all UI elements and displays
- Manages modals and notifications
- Handles user input and feedback

**Animator.js** - Animation System
- Provides smooth animations for all interactions
- Manages particle effects and celebrations
- Handles loading states and transitions

## 📱 Responsive Design

### Desktop (768px+)
- **Traditional Layout** - Prize board always visible alongside briefcases
- **Hover Effects** - Rich mouse interactions and animations
- **Full Feature Set** - All game elements displayed simultaneously

### Mobile (767px and below)  
- **Clean Interface** - Hidden prize board for maximum briefcase space
- **Floating Prize Button** - Corner button with money emoji for prize access
- **Touch Optimized** - Large touch targets and scroll-friendly briefcase grid
- **Modal Prize View** - Full-screen prize modal with eliminated value tracking
- **Custom Scrolling** - Prominent red scrollbar for briefcase navigation

## ♿ Accessibility Features

- **Keyboard Navigation**: Full game playable without mouse
- **Screen Reader Support**: ARIA labels and semantic HTML
- **High Contrast Mode**: Automatic detection and styling
- **Reduced Motion**: Respects user animation preferences
- **Focus Management**: Clear visual focus indicators

## 🐛 Browser Support

- **Chrome 80+**: Full support
- **Firefox 75+**: Full support  
- **Safari 13+**: Full support
- **Edge 80+**: Full support
- **Mobile Browsers**: iOS Safari 13+, Chrome Mobile 80+

## 📊 Performance

- **Load Time**: < 2 seconds on standard connections
- **Memory Usage**: < 50MB typical usage
- **Smooth Animations**: 60fps on modern devices
- **Optimized Assets**: Compressed and efficient code

## � Latest Updates

### Version 2.0 Features
- ✅ **UK Version Styling** - Complete red theme makeover  
- ✅ **British Currency** - £ and pence formatting throughout
- ✅ **Mobile Optimization** - Responsive design with floating prize button
- ✅ **Final Switch Decision** - Authentic TV show ending experience
- ✅ **Animated Briefcase Reveals** - Smooth flip animations
- ✅ **Touch-Friendly Interface** - Optimized for mobile devices
- ✅ **Custom Scrollbars** - Themed scrolling indicators
- ✅ **Modal System** - Professional popups for all interactions

## 🎉 Future Enhancements

- [ ] **Sound Effects** - Audio feedback and dramatic music
- [ ] **Multiple Themes** - US version, other international variants  
- [ ] **Statistics Tracking** - Game history and performance analytics
- [ ] **PWA Support** - Install as mobile app
- [ ] **Multiplayer Mode** - Play against friends
- [ ] **Difficulty Levels** - Banker AI variants

## 📄 License

This project is created for educational and entertainment purposes. Feel free to modify and enhance!

## 🤝 Contributing

Want to improve the game? Here's how:
1. Fork the repository
2. Create a feature branch
3. Make your enhancements
4. Test thoroughly
5. Submit a pull request

## 🙏 Acknowledgments

- Inspired by the original "Deal or No Deal" TV show
- Built with modern web technologies
- Designed for maximum user experience

---

**Enjoy the game and may the odds be in your favor!** 🍀