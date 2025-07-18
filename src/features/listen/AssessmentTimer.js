/**
 * AssessmentTimer - Manages the 90-minute countdown timer for Codexel assessments
 * Provides real-time updates and auto-stop functionality
 */

class AssessmentTimer {
    constructor(options = {}) {
        this.duration = options.duration || 90 * 60 * 1000; // 90 minutes in milliseconds
        this.interval = options.interval || 1000; // Update every second
        this.onUpdate = options.onUpdate || (() => {});
        this.onComplete = options.onComplete || (() => {});
        
        this.startTime = null;
        this.remainingTime = this.duration;
        this.isRunning = false;
        this.isPaused = false;
        this.timer = null;
        
        console.log('[AssessmentTimer] Initialized with duration:', this.formatTime(this.duration));
    }

    /**
     * Start the timer
     * @returns {boolean} True if started successfully
     */
    start() {
        if (this.isRunning) {
            console.warn('[AssessmentTimer] Timer is already running');
            return false;
        }

        this.startTime = Date.now();
        this.isRunning = true;
        this.isPaused = false;
        
        console.log('[AssessmentTimer] Starting 90-minute assessment timer');
        
        // Start the countdown
        this.timer = setInterval(() => {
            this.tick();
        }, this.interval);
        
        // Initial update
        this.onUpdate(this.getRemainingTime(), this.getFormattedTime());
        
        return true;
    }

    /**
     * Stop the timer
     * @param {boolean} completed - Whether timer was stopped due to completion
     */
    stop(completed = false) {
        if (!this.isRunning) {
            console.warn('[AssessmentTimer] Timer is not running');
            return;
        }

        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        this.isRunning = false;
        this.isPaused = false;
        
        const reason = completed ? 'completion' : 'manual stop';
        console.log(`[AssessmentTimer] Timer stopped due to: ${reason}`);
        
        if (completed) {
            this.onComplete();
        }
    }

    /**
     * Pause the timer
     */
    pause() {
        if (!this.isRunning || this.isPaused) {
            console.warn('[AssessmentTimer] Cannot pause timer in current state');
            return;
        }

        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        this.isPaused = true;
        console.log('[AssessmentTimer] Timer paused');
    }

    /**
     * Resume the timer
     */
    resume() {
        if (!this.isRunning || !this.isPaused) {
            console.warn('[AssessmentTimer] Cannot resume timer in current state');
            return;
        }

        // Adjust start time to account for pause duration
        const pausedDuration = Date.now() - (this.startTime + (this.duration - this.remainingTime));
        this.startTime += pausedDuration;

        this.timer = setInterval(() => {
            this.tick();
        }, this.interval);

        this.isPaused = false;
        console.log('[AssessmentTimer] Timer resumed');
    }

    /**
     * Reset the timer to initial state
     */
    reset() {
        this.stop();
        this.remainingTime = this.duration;
        this.startTime = null;
        console.log('[AssessmentTimer] Timer reset');
    }

    /**
     * Timer tick function - called every interval
     */
    tick() {
        if (!this.isRunning || this.isPaused) {
            return;
        }

        const elapsed = Date.now() - this.startTime;
        this.remainingTime = Math.max(0, this.duration - elapsed);

        // Update callback
        this.onUpdate(this.remainingTime, this.getFormattedTime());

        // Check if timer is complete
        if (this.remainingTime <= 0) {
            this.stop(true);
        }
    }

    /**
     * Get remaining time in milliseconds
     * @returns {number} Remaining time in ms
     */
    getRemainingTime() {
        return this.remainingTime;
    }

    /**
     * Get remaining time as formatted string (MM:SS)
     * @returns {string} Formatted time string
     */
    getFormattedTime() {
        return this.formatTime(this.remainingTime);
    }

    /**
     * Get elapsed time in milliseconds
     * @returns {number} Elapsed time in ms
     */
    getElapsedTime() {
        if (!this.startTime) return 0;
        return Math.min(this.duration, Date.now() - this.startTime);
    }

    /**
     * Get elapsed time as formatted string
     * @returns {string} Formatted elapsed time
     */
    getFormattedElapsedTime() {
        return this.formatTime(this.getElapsedTime());
    }

    /**
     * Get timer progress as percentage (0-100)
     * @returns {number} Progress percentage
     */
    getProgress() {
        const elapsed = this.getElapsedTime();
        return Math.min(100, (elapsed / this.duration) * 100);
    }

    /**
     * Format time in milliseconds to MM:SS string
     * @param {number} timeMs - Time in milliseconds
     * @returns {string} Formatted time string
     */
    formatTime(timeMs) {
        const totalSeconds = Math.floor(timeMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Get timer status information
     * @returns {Object} Timer status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            remainingTime: this.remainingTime,
            elapsedTime: this.getElapsedTime(),
            progress: this.getProgress(),
            formattedRemaining: this.getFormattedTime(),
            formattedElapsed: this.getFormattedElapsedTime(),
            duration: this.duration
        };
    }

    /**
     * Add time to the timer (extend assessment)
     * @param {number} additionalMs - Additional time in milliseconds
     */
    addTime(additionalMs) {
        this.duration += additionalMs;
        this.remainingTime += additionalMs;
        console.log(`[AssessmentTimer] Added ${this.formatTime(additionalMs)} to timer`);
    }

    /**
     * Set warning thresholds and callbacks
     * @param {Array} warnings - Array of {threshold: ms, callback: function}
     */
    setWarnings(warnings = []) {
        this.warnings = warnings;
        this.warningsTriggered = new Set();
    }

    /**
     * Check and trigger warnings if thresholds are met
     */
    checkWarnings() {
        if (!this.warnings) return;

        this.warnings.forEach((warning, index) => {
            if (this.remainingTime <= warning.threshold && !this.warningsTriggered.has(index)) {
                this.warningsTriggered.add(index);
                if (typeof warning.callback === 'function') {
                    warning.callback(this.remainingTime, this.getFormattedTime());
                }
            }
        });
    }

    /**
     * Serialize timer state for persistence
     * @returns {Object} Serialized state
     */
    serialize() {
        return {
            duration: this.duration,
            startTime: this.startTime,
            remainingTime: this.remainingTime,
            isRunning: this.isRunning,
            isPaused: this.isPaused
        };
    }

    /**
     * Restore timer state from serialized data
     * @param {Object} state - Serialized state
     */
    deserialize(state) {
        this.duration = state.duration || this.duration;
        this.startTime = state.startTime;
        this.remainingTime = state.remainingTime || this.duration;
        this.isRunning = state.isRunning || false;
        this.isPaused = state.isPaused || false;

        // Restart timer if it was running
        if (this.isRunning && !this.isPaused) {
            this.timer = setInterval(() => {
                this.tick();
            }, this.interval);
        }

        console.log('[AssessmentTimer] State restored from serialized data');
    }

    /**
     * Clean up timer resources
     */
    destroy() {
        this.stop();
        this.onUpdate = null;
        this.onComplete = null;
        this.warnings = null;
        this.warningsTriggered = null;
        console.log('[AssessmentTimer] Timer destroyed');
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AssessmentTimer = AssessmentTimer;
}

export default AssessmentTimer;