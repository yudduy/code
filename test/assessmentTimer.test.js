import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AssessmentTimer from '../src/features/listen/AssessmentTimer.js';

describe('AssessmentTimer', () => {
  let timer;
  let mockOnUpdate;
  let mockOnComplete;

  beforeEach(() => {
    mockOnUpdate = vi.fn();
    mockOnComplete = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    if (timer) {
      timer.destroy();
    }
    vi.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default 90-minute duration', () => {
      timer = new AssessmentTimer();
      expect(timer.duration).toBe(90 * 60 * 1000);
      expect(timer.isRunning).toBe(false);
      expect(timer.remainingTime).toBe(90 * 60 * 1000);
    });

    it('should initialize with custom duration', () => {
      const customDuration = 60 * 60 * 1000; // 60 minutes
      timer = new AssessmentTimer({ duration: customDuration });
      expect(timer.duration).toBe(customDuration);
      expect(timer.remainingTime).toBe(customDuration);
    });

    it('should accept callback functions', () => {
      timer = new AssessmentTimer({
        onUpdate: mockOnUpdate,
        onComplete: mockOnComplete
      });
      expect(timer.onUpdate).toBe(mockOnUpdate);
      expect(timer.onComplete).toBe(mockOnComplete);
    });
  });

  describe('Timer Controls', () => {
    beforeEach(() => {
      timer = new AssessmentTimer({
        duration: 5000, // 5 seconds for testing
        onUpdate: mockOnUpdate,
        onComplete: mockOnComplete
      });
    });

    it('should start timer successfully', () => {
      const result = timer.start();
      expect(result).toBe(true);
      expect(timer.isRunning).toBe(true);
      expect(timer.timer).toBeDefined();
    });

    it('should not start timer if already running', () => {
      timer.start();
      const result = timer.start();
      expect(result).toBe(false);
    });

    it('should stop timer successfully', () => {
      timer.start();
      timer.stop();
      expect(timer.isRunning).toBe(false);
      expect(timer.timer).toBeNull();
    });

    it('should call onUpdate callback during timer tick', () => {
      timer.start();
      
      // Advance time by 1 second
      vi.advanceTimersByTime(1000);
      
      expect(mockOnUpdate).toHaveBeenCalled();
      const [remainingTime, formattedTime] = mockOnUpdate.mock.calls[0];
      expect(remainingTime).toBeLessThanOrEqual(5000);
      expect(formattedTime).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should call onComplete callback when timer expires', () => {
      timer.start();
      
      // Advance time beyond duration
      vi.advanceTimersByTime(6000);
      
      expect(mockOnComplete).toHaveBeenCalled();
      expect(timer.isRunning).toBe(false);
    });
  });

  describe('Time Formatting', () => {
    beforeEach(() => {
      timer = new AssessmentTimer();
    });

    it('should format time correctly', () => {
      expect(timer.formatTime(0)).toBe('00:00');
      expect(timer.formatTime(30000)).toBe('00:30'); // 30 seconds
      expect(timer.formatTime(60000)).toBe('01:00'); // 1 minute
      expect(timer.formatTime(90000)).toBe('01:30'); // 1.5 minutes
      expect(timer.formatTime(3600000)).toBe('60:00'); // 1 hour
    });

    it('should return formatted remaining time', () => {
      const formatted = timer.getFormattedTime();
      expect(formatted).toBe('90:00');
    });
  });

  describe('Progress Tracking', () => {
    beforeEach(() => {
      timer = new AssessmentTimer({
        duration: 10000, // 10 seconds for testing
        onUpdate: mockOnUpdate
      });
    });

    it('should track progress correctly', () => {
      timer.start();
      
      // Advance time by 5 seconds (50% progress)
      vi.advanceTimersByTime(5000);
      
      const progress = timer.getProgress();
      expect(progress).toBeCloseTo(50, 0);
    });

    it('should provide timer status', () => {
      timer.start();
      vi.advanceTimersByTime(2000);
      
      const status = timer.getStatus();
      expect(status).toHaveProperty('isRunning', true);
      expect(status).toHaveProperty('remainingTime');
      expect(status).toHaveProperty('elapsedTime');
      expect(status).toHaveProperty('progress');
      expect(status).toHaveProperty('formattedRemaining');
      expect(status).toHaveProperty('formattedElapsed');
    });
  });

  describe('Pause and Resume', () => {
    beforeEach(() => {
      timer = new AssessmentTimer({
        duration: 10000, // 10 seconds for testing
        onUpdate: mockOnUpdate
      });
    });

    it('should pause timer', () => {
      timer.start();
      timer.pause();
      
      expect(timer.isPaused).toBe(true);
      expect(timer.isRunning).toBe(true);
      expect(timer.timer).toBeNull();
    });

    it('should resume timer', () => {
      timer.start();
      timer.pause();
      timer.resume();
      
      expect(timer.isPaused).toBe(false);
      expect(timer.isRunning).toBe(true);
      expect(timer.timer).toBeDefined();
    });

    it('should not call onUpdate while paused', () => {
      timer.start();
      mockOnUpdate.mockClear();
      
      timer.pause();
      vi.advanceTimersByTime(2000);
      
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Reset Functionality', () => {
    beforeEach(() => {
      timer = new AssessmentTimer({
        duration: 10000, // 10 seconds for testing
        onUpdate: mockOnUpdate
      });
    });

    it('should reset timer to initial state', () => {
      timer.start();
      vi.advanceTimersByTime(3000);
      
      timer.reset();
      
      expect(timer.isRunning).toBe(false);
      expect(timer.remainingTime).toBe(10000);
      expect(timer.startTime).toBeNull();
    });
  });

  describe('Serialization', () => {
    beforeEach(() => {
      timer = new AssessmentTimer({
        duration: 10000,
        onUpdate: mockOnUpdate
      });
    });

    it('should serialize timer state', () => {
      timer.start();
      vi.advanceTimersByTime(2000);
      
      const serialized = timer.serialize();
      
      expect(serialized).toHaveProperty('duration', 10000);
      expect(serialized).toHaveProperty('isRunning', true);
      expect(serialized).toHaveProperty('remainingTime');
      expect(serialized).toHaveProperty('startTime');
    });

    it('should deserialize timer state', () => {
      const state = {
        duration: 15000,
        startTime: Date.now() - 3000,
        remainingTime: 12000,
        isRunning: true,
        isPaused: false
      };
      
      timer.deserialize(state);
      
      expect(timer.duration).toBe(15000);
      expect(timer.isRunning).toBe(true);
      expect(timer.remainingTime).toBe(12000);
    });
  });
});