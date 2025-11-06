/**
 * AudioManager Class - Handles all game audio including background music,
 * sound effects, and contextual crowd reactions
 */
class AudioManager {
    constructor() {
        this.sounds = {};
        this.currentBackground = null;
        this.phoneRingLoop = null;
        this.isEnabled = true;
        this.isMuted = this.loadMutedState(); // Load from localStorage
        this.volumes = {
            background: 0.3,
            effects: 0.7,
            phone: 0.6
        };
        this.fadeTime = 1000; // 1 second fade
        
        this.init();
    }

    /**
     * Initialize audio system and load all sound files
     */
    async init() {
        try {
            console.log('🎵 Initializing audio system...');
            
            // Load background music (optional)
            try {
                console.log('🎵 Loading ambience.mp3...');
                this.sounds.ambience = await this.loadAudio('assets/sounds/ambience.mp3', true);
                console.log('✅ Ambience loaded successfully');
            } catch (e) {
                console.warn('❌ Background music failed to load:', e);
                console.warn('Continuing without background music');
            }
            
            try {
                this.sounds.banker = await this.loadAudio('assets/sounds/banker.mp3', true);
            } catch (e) {
                console.warn('Banker music not found, continuing without it');
            }
            
            // Load event sounds (optional)
            try {
                this.sounds.dealOrNoDeal = await this.loadAudio('assets/sounds/deal-or-no-deal.mp3');
            } catch (e) {
                console.warn('Deal or No Deal sound not found, continuing without it');
            }
            
            try {
                this.sounds.phoneRing = await this.loadAudio('assets/sounds/phone-ring.mp3', true);
            } catch (e) {
                console.warn('Phone ring sound not found, continuing without it');
            }
            
            try {
                this.sounds.swapBox = await this.loadAudio('assets/sounds/would-you-like-to-swap-your-box.mp3');
            } catch (e) {
                console.warn('Swap box sound not found, continuing without it');
            }
            
            // Load good reaction sounds (optional)
            try {
                this.sounds.good = await this.loadSoundFolder('assets/sounds/good');
            } catch (e) {
                console.warn('Good reaction sounds not found, continuing without them');
                this.sounds.good = [];
            }
            
            // Load bad reaction sounds (optional)
            try {
                this.sounds.bad = await this.loadSoundFolder('assets/sounds/bad');
            } catch (e) {
                console.warn('Bad reaction sounds not found, continuing without them');
                this.sounds.bad = [];
            }
            
            console.log('✅ Audio system initialized successfully');
            
            // Try to start ambience after a short delay to ensure everything is ready
            setTimeout(() => {
                this.startBackgroundMusic();
            }, 1000);
            
        } catch (error) {
            console.warn('⚠️ Audio system failed to initialize:', error);
            this.isEnabled = false;
        }
    }

    /**
     * Load a single audio file
     * @param {string} src - Audio file path
     * @param {boolean} loop - Whether to loop the audio
     * @returns {Promise<HTMLAudioElement>}
     */
    loadAudio(src, loop = false) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(src);
            audio.loop = loop;
            audio.preload = 'auto';
            
            audio.addEventListener('canplaythrough', () => resolve(audio));
            audio.addEventListener('error', () => reject(`Failed to load: ${src}`));
            
            // Timeout fallback
            setTimeout(() => reject(`Timeout loading: ${src}`), 10000);
        });
    }

    /**
     * Load specific known audio files from a folder (no mass probing)
     * @param {string} folderPath - Path to folder containing audio files
     * @returns {Promise<Array<HTMLAudioElement>>}
     */
    async loadSoundFolder(folderPath) {
        const sounds = [];
        
        // Only try to load the files we KNOW exist based on what you told us
        let knownFiles = [];
        
        if (folderPath.includes('good')) {
            knownFiles = [
                'applause-med-fade.mp3',
                'applause.mp3'
            ];
        } else if (folderPath.includes('bad')) {
            knownFiles = [
                'audiencegroan.mp3',
                'oh-no.mp3'
            ];
        }
        
        console.log(`🎵 Loading known audio files from ${folderPath}...`);
        
        for (const filename of knownFiles) {
            try {
                const audio = await this.loadAudio(`${folderPath}/${filename}`);
                sounds.push(audio);
                console.log(`✅ Loaded: ${filename}`);
            } catch (error) {
                console.log(`⚠️ Failed to load: ${filename} - ${error}`);
            }
        }
        
        console.log(`🎵 Successfully loaded ${sounds.length} audio files from ${folderPath}`);
        return sounds;
    }

    /**
     * Start playing ambience music
     */
    startAmbience() {
        if (!this.shouldPlaySound()) {
            console.log('🔇 Audio disabled or muted');
            return;
        }
        
        if (!this.sounds.ambience) {
            console.log('🔇 No ambience audio loaded');
            return;
        }
        
        console.log('🎵 Starting ambience music...');
        this.sounds.ambience.volume = this.volumes.background;
        this.sounds.ambience.currentTime = 0;
        
        const tryStartAmbience = (retryCount = 0) => {
            this.sounds.ambience.play().then(() => {
                console.log('✅ Ambience started successfully');
            }).catch(error => {
                if (error.name === 'NotAllowedError') {
                    console.log('🔇 Audio autoplay blocked - will start on user interaction');
                    // Set up listener for first user interaction
                    const startOnInteraction = () => {
                        console.log('🎵 User interaction detected, starting ambience...');
                        this.sounds.ambience.play().catch(e => 
                            console.warn('Failed to start audio on interaction:', e));
                        document.removeEventListener('click', startOnInteraction);
                        document.removeEventListener('keydown', startOnInteraction);
                    };
                    document.addEventListener('click', startOnInteraction, { once: true });
                    document.addEventListener('keydown', startOnInteraction, { once: true });
                } else {
                    console.warn(`❌ Ambience play failed (attempt ${retryCount + 1}):`, error.message);
                    // Retry up to 3 times with increasing delays
                    if (retryCount < 3) {
                        setTimeout(() => tryStartAmbience(retryCount + 1), 1000 * (retryCount + 1));
                    }
                }
            });
        };
        
        tryStartAmbience();
        this.currentBackground = this.sounds.ambience;
    }

    /**
     * Switch to banker background music with fade
     */
    async switchToBankerMusic() {
        if (!this.isEnabled || !this.sounds.banker) return;
        
        // Fade out current background
        if (this.currentBackground && this.currentBackground !== this.sounds.banker) {
            await this.fadeOut(this.currentBackground);
        }
        
        // Start banker music
        this.sounds.banker.volume = 0;
        this.sounds.banker.currentTime = 0;
        this.sounds.banker.play().catch(e => console.warn('Banker music play failed:', e));
        
        // Fade in banker music
        await this.fadeIn(this.sounds.banker, this.volumes.background);
        this.currentBackground = this.sounds.banker;
    }

    /**
     * Switch back to ambience music with fade
     */
    async switchToAmbience() {
        if (!this.isEnabled || !this.sounds.ambience) return;
        
        // Fade out banker music
        if (this.currentBackground && this.currentBackground !== this.sounds.ambience) {
            await this.fadeOut(this.currentBackground);
        }
        
        // Start ambience music
        this.sounds.ambience.volume = 0;
        this.sounds.ambience.play().catch(e => console.warn('Ambience play failed:', e));
        
        // Fade in ambience
        await this.fadeIn(this.sounds.ambience, this.volumes.background);
        this.currentBackground = this.sounds.ambience;
    }

    /**
     * Fade in audio
     * @param {HTMLAudioElement} audio - Audio element to fade in
     * @param {number} targetVolume - Target volume level
     * @returns {Promise}
     */
    fadeIn(audio, targetVolume) {
        return new Promise(resolve => {
            const steps = 20;
            const stepTime = this.fadeTime / steps;
            const volumeStep = targetVolume / steps;
            let currentStep = 0;
            
            const interval = setInterval(() => {
                currentStep++;
                audio.volume = Math.min(volumeStep * currentStep, targetVolume);
                
                if (currentStep >= steps) {
                    clearInterval(interval);
                    resolve();
                }
            }, stepTime);
        });
    }

    /**
     * Fade out audio
     * @param {HTMLAudioElement} audio - Audio element to fade out
     * @returns {Promise}
     */
    fadeOut(audio) {
        return new Promise(resolve => {
            const steps = 20;
            const stepTime = this.fadeTime / steps;
            const startVolume = audio.volume;
            const volumeStep = startVolume / steps;
            let currentStep = 0;
            
            const interval = setInterval(() => {
                currentStep++;
                audio.volume = Math.max(startVolume - (volumeStep * currentStep), 0);
                
                if (currentStep >= steps || audio.volume <= 0) {
                    clearInterval(interval);
                    audio.pause();
                    resolve();
                }
            }, stepTime);
        });
    }

    /**
     * Play phone ring on loop
     */
    startPhoneRing() {
        if (!this.isEnabled || !this.sounds.phoneRing) return;
        
        this.sounds.phoneRing.volume = this.volumes.phone;
        this.sounds.phoneRing.currentTime = 0;
        this.sounds.phoneRing.play().catch(e => console.warn('Phone ring play failed:', e));
        this.phoneRingLoop = this.sounds.phoneRing;
    }

    /**
     * Stop phone ring
     */
    stopPhoneRing() {
        if (this.phoneRingLoop) {
            this.phoneRingLoop.pause();
            this.phoneRingLoop.currentTime = 0;
            this.phoneRingLoop = null;
        }
    }

    /**
     * Play deal or no deal sound
     */
    playDealOrNoDeal() {
        if (!this.isEnabled || !this.sounds.dealOrNoDeal) return;
        
        this.sounds.dealOrNoDeal.volume = this.volumes.effects;
        this.sounds.dealOrNoDeal.currentTime = 0;
        this.sounds.dealOrNoDeal.play().catch(e => console.warn('Deal or no deal sound failed:', e));
    }

    /**
     * Play swap box sound
     */
    playSwapBox() {
        if (!this.isEnabled || !this.sounds.swapBox) return;
        
        this.sounds.swapBox.volume = this.volumes.effects;
        this.sounds.swapBox.currentTime = 0;
        this.sounds.swapBox.play().catch(e => console.warn('Swap box sound failed:', e));
    }

    /**
     * Play a random good reaction sound
     */
    playGoodReaction() {
        if (!this.shouldPlaySound() || !this.sounds.good || this.sounds.good.length === 0) return;
        
        const randomSound = this.sounds.good[Math.floor(Math.random() * this.sounds.good.length)];
        randomSound.volume = this.volumes.effects;
        randomSound.currentTime = 0;
        randomSound.play().catch(e => console.warn('Good reaction sound failed:', e));
    }

    /**
     * Play a random bad reaction sound
     */
    playBadReaction() {
        if (!this.shouldPlaySound() || !this.sounds.bad || this.sounds.bad.length === 0) return;
        
        const randomSound = this.sounds.bad[Math.floor(Math.random() * this.sounds.bad.length)];
        randomSound.volume = this.volumes.effects;
        randomSound.currentTime = 0;
        randomSound.play().catch(e => console.warn('Bad reaction sound failed:', e));
    }

    /**
     * Determine if eliminating a value is good or bad for the player
     * @param {number} eliminatedValue - The value that was eliminated
     * @param {Array<number>} remainingValues - Values still in play
     * @returns {boolean} True if elimination was good for player
     */
    isGoodElimination(eliminatedValue, remainingValues) {
        // Calculate thresholds
        const lowThreshold = 1000;
        const highThreshold = 100000;
        
        // Count remaining value types
        const highValuesRemaining = remainingValues.filter(v => v >= highThreshold).length;
        const lowValuesRemaining = remainingValues.filter(v => v <= lowThreshold).length;
        const totalRemaining = remainingValues.length;
        
        // If eliminated value is low (good for player)
        if (eliminatedValue <= lowThreshold) {
            return true;
        }
        
        // If eliminated value is very high and there are still other high values
        if (eliminatedValue >= highThreshold && highValuesRemaining > 1) {
            return false; // Bad - lost a high value
        }
        
        // If eliminated value is medium-high but mostly low values remain
        if (eliminatedValue >= 50000 && lowValuesRemaining > highValuesRemaining) {
            return false; // Bad - needed to keep this higher value
        }
        
        // Default to neutral/slightly positive for mid-range eliminations
        return eliminatedValue <= 25000;
    }

    /**
     * Play contextual reaction based on elimination
     * @param {number} eliminatedValue - The value that was eliminated
     * @param {Array<number>} remainingValues - Values still in play
     */
    playEliminationReaction(eliminatedValue, remainingValues) {
        const isGood = this.isGoodElimination(eliminatedValue, remainingValues);
        
        if (isGood) {
            this.playGoodReaction();
        } else {
            this.playBadReaction();
        }
    }

    /**
     * Handle banker-related audio events
     */
    onBankerEvent() {
        // Switch to banker music and start phone ring
        this.switchToBankerMusic();
        
        // Small delay then start phone ringing
        setTimeout(() => {
            this.startPhoneRing();
        }, 500);
    }

    /**
     * Handle phone answered event
     */
    onPhoneAnswered() {
        this.stopPhoneRing();
        // Banker music continues playing
    }

    /**
     * Handle deal/no deal modal appearance
     */
    onDealOrNoDealModal() {
        this.playDealOrNoDeal();
    }

    /**
     * Handle final switch modal appearance
     */
    onSwitchModal() {
        this.playSwapBox();
        // Keep banker music playing in background
    }

    /**
     * Handle end of banker interaction
     */
    onBankerEnd() {
        // Switch back to ambience music
        setTimeout(() => {
            this.switchToAmbience();
        }, 1000); // Small delay for natural transition
    }

    /**
     * Set master volume
     * @param {number} volume - Volume level (0-1)
     */
    setMasterVolume(volume) {
        this.volumes.background *= volume;
        this.volumes.effects *= volume;
        this.volumes.phone *= volume;
        
        // Update current playing audio
        if (this.currentBackground) {
            this.currentBackground.volume = this.volumes.background;
        }
    }

    /**
     * Enable/disable audio system
     * @param {boolean} enabled - Whether audio should be enabled
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        if (!enabled) {
            // Stop all audio
            Object.values(this.sounds).forEach(sound => {
                if (sound && sound.pause) {
                    sound.pause();
                } else if (Array.isArray(sound)) {
                    sound.forEach(s => s.pause && s.pause());
                }
            });
            this.stopPhoneRing();
        } else if (enabled && !this.currentBackground) {
            // Restart ambience if re-enabling
            this.startAmbience();
        }
    }

    /**
     * Stop all audio (background music, phone rings, etc.)
     */
    stopAllAudio() {
        // Stop background music
        if (this.currentBackground) {
            this.currentBackground.pause();
            this.currentBackground.currentTime = 0;
            this.currentBackground = null;
        }
        
        // Stop phone ring loop
        this.stopPhoneRing();
        
        // Stop any other playing sounds
        Object.values(this.sounds).forEach(sound => {
            if (sound && typeof sound.pause === 'function') {
                sound.pause();
                sound.currentTime = 0;
            } else if (Array.isArray(sound)) {
                sound.forEach(s => {
                    if (s && typeof s.pause === 'function') {
                        s.pause();
                        s.currentTime = 0;
                    }
                });
            }
        });
    }

    /**
     * Start background music (alias for startAmbience for compatibility)
     */
    startBackgroundMusic() {
        console.log('🎵 startBackgroundMusic() called');
        this.startAmbience();
    }

    /**
     * Stop banker music and return to ambience
     */
    async stopBankerMusic() {
        if (this.currentBackground === this.sounds.banker) {
            await this.switchToAmbience();
        }
    }

    /**
     * Play a sound effect by name
     * @param {string} effectName - Name of the effect to play
     */
    async playSoundEffect(effectName) {
        if (!this.shouldPlaySound()) return;

        const effectMap = {
            'deal': 'dealOrNoDeal',
            'no_deal': 'dealOrNoDeal', 
            'answer_phone': 'dealOrNoDeal', // Using dealOrNoDeal as fallback
            'switch_yes': 'swapBox',
            'final_reveal': 'dealOrNoDeal' // Using dealOrNoDeal as fallback
        };

        const soundKey = effectMap[effectName];
        if (soundKey && this.sounds[soundKey]) {
            try {
                const sound = this.sounds[soundKey];
                sound.volume = this.volumes.effects;
                sound.currentTime = 0;
                await sound.play();
            } catch (error) {
                console.warn(`Failed to play sound effect: ${effectName}`, error);
            }
        }
    }

    /**
     * Load muted state from localStorage
     * @returns {boolean} Whether audio is muted
     */
    loadMutedState() {
        try {
            const saved = localStorage.getItem('dealOrNoDeal_muted');
            return saved === 'true';
        } catch (error) {
            console.warn('Failed to load muted state from localStorage:', error);
            return false;
        }
    }

    /**
     * Save muted state to localStorage
     * @param {boolean} muted - Whether audio is muted
     */
    saveMutedState(muted) {
        try {
            localStorage.setItem('dealOrNoDeal_muted', muted.toString());
        } catch (error) {
            console.warn('Failed to save muted state to localStorage:', error);
        }
    }

    /**
     * Toggle mute state
     * @returns {boolean} New muted state
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.saveMutedState(this.isMuted);
        
        if (this.isMuted) {
            // Mute all currently playing audio
            this.muteAllAudio();
            console.log('🔇 Audio muted');
        } else {
            // Unmute and restart background music if it was playing
            this.unmuteAllAudio();
            console.log('🔊 Audio unmuted');
        }
        
        return this.isMuted;
    }

    /**
     * Mute all currently playing audio
     */
    muteAllAudio() {
        // Mute background music
        if (this.currentBackground) {
            this.currentBackground.volume = 0;
        }
        
        // Stop phone ring
        this.stopPhoneRing();
        
        // Mute any other playing sounds
        Object.values(this.sounds).forEach(sound => {
            if (sound && typeof sound.pause === 'function') {
                sound.volume = 0;
            } else if (Array.isArray(sound)) {
                sound.forEach(s => {
                    if (s && typeof s.pause === 'function') {
                        s.volume = 0;
                    }
                });
            }
        });
    }

    /**
     * Unmute all audio and restore volumes
     */
    unmuteAllAudio() {
        // Restore background music volume
        if (this.currentBackground) {
            this.currentBackground.volume = this.volumes.background;
        }
        
        // Note: Other sounds will get proper volume when they're played next
    }

    /**
     * Check if a sound should play (not muted)
     * @returns {boolean} Whether sound should play
     */
    shouldPlaySound() {
        return this.isEnabled && !this.isMuted;
    }

    /**
     * Get audio system status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            muted: this.isMuted,
            currentBackground: this.currentBackground ? 'playing' : 'none',
            phoneRinging: !!this.phoneRingLoop,
            soundsLoaded: {
                ambience: !!this.sounds.ambience,
                banker: !!this.sounds.banker,
                dealOrNoDeal: !!this.sounds.dealOrNoDeal,
                phoneRing: !!this.sounds.phoneRing,
                swapBox: !!this.sounds.swapBox,
                good: this.sounds.good?.length || 0,
                bad: this.sounds.bad?.length || 0
            }
        };
    }
}