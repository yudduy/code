import { describe, it, expect } from 'vitest';
import { identifyApp } from '../src/config/appSignatures.js';

describe('App Signatures - identifyApp', () => {
  describe('AI Tools', () => {
    it('should identify ChatGPT in various browsers', () => {
      const testCases = [
        {
          window: {
            title: 'ChatGPT - Google Chrome',
            owner: { name: 'Google Chrome' },
            url: 'https://chat.openai.com/chat/123'
          }
        },
        {
          window: {
            title: 'ChatGPT - Safari',
            owner: { name: 'Safari' },
            url: 'https://chat.openai.com'
          }
        },
        {
          window: {
            title: 'ChatGPT',
            owner: { name: 'Firefox' },
            url: 'chat.openai.com'
          }
        }
      ];

      testCases.forEach(({ window }) => {
        expect(identifyApp(window)).toBe('chatgpt');
      });
    });

    it('should identify Claude in various browsers', () => {
      const testCases = [
        {
          window: {
            title: 'Claude - Safari',
            owner: { name: 'Safari' },
            url: 'https://claude.ai'
          }
        },
        {
          window: {
            title: 'Claude',
            owner: { name: 'Chrome' },
            url: 'claude.ai/chat'
          }
        }
      ];

      testCases.forEach(({ window }) => {
        expect(identifyApp(window)).toBe('claude');
      });
    });

    it('should identify Cursor editor', () => {
      const windows = [
        { title: 'Cursor - index.js', owner: { name: 'Cursor' } },
        { title: 'Cursor', owner: { name: 'Cursor' } },
        { title: 'main.py - Cursor', owner: { name: 'Cursor' } }
      ];

      windows.forEach(window => {
        expect(identifyApp(window)).toBe('cursor');
      });
    });
  });

  describe('Development Tools', () => {
    it('should identify VSCode', () => {
      const windows = [
        { title: 'Visual Studio Code', owner: { name: 'Code' } },
        { title: 'main.js - myproject - Visual Studio Code', owner: { name: 'Code' } },
        { title: 'Code - Welcome', owner: { name: 'Code' } },
        { title: 'Code', owner: { name: 'Visual Studio Code' } }
      ];

      windows.forEach(window => {
        expect(identifyApp(window)).toBe('vscode');
      });
    });
  });

  describe('Browsers', () => {
    it('should identify Chrome', () => {
      const windows = [
        { title: 'GitHub - Google Chrome', owner: { name: 'Google Chrome' } },
        { title: 'Chrome - New Tab', owner: { name: 'Google Chrome' } }
      ];

      windows.forEach(window => {
        expect(identifyApp(window)).toBe('chrome');
      });
    });

    it('should identify Safari', () => {
      const windows = [
        { title: 'Apple - Safari', owner: { name: 'Safari' } },
        { title: 'Safari - Start Page', owner: { name: 'Safari' } }
      ];

      windows.forEach(window => {
        expect(identifyApp(window)).toBe('safari');
      });
    });

    it('should identify Firefox', () => {
      const windows = [
        { title: 'Mozilla Firefox', owner: { name: 'Firefox' } },
        { title: 'Firefox - Mozilla', owner: { name: 'Firefox' } }
      ];

      windows.forEach(window => {
        expect(identifyApp(window)).toBe('firefox');
      });
    });

    it('should identify Edge', () => {
      const windows = [
        { title: 'Microsoft Edge', owner: { name: 'Microsoft Edge' } },
        { title: 'Edge - Bing', owner: { name: 'Microsoft Edge' } }
      ];

      windows.forEach(window => {
        expect(identifyApp(window)).toBe('edge');
      });
    });
  });

  describe('Communication Tools', () => {
    it('should identify Slack', () => {
      const windows = [
        { title: 'Slack - Pickle Team', owner: { name: 'Slack' } },
        { title: 'Slack', owner: { name: 'Slack' } }
      ];

      windows.forEach(window => {
        expect(identifyApp(window)).toBe('slack');
      });
    });

    it('should identify Discord', () => {
      const windows = [
        { title: 'Discord - #general', owner: { name: 'Discord' } },
        { title: 'Discord', owner: { name: 'Discord' } }
      ];

      windows.forEach(window => {
        expect(identifyApp(window)).toBe('discord');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should return unknown for unrecognized apps', () => {
      const windows = [
        { title: 'Random App', owner: { name: 'RandomApp' } },
        { title: 'Some Application', owner: { name: 'Unknown' } }
      ];

      windows.forEach(window => {
        expect(identifyApp(window)).toBe('unknown');
      });
    });

    it('should handle missing window info', () => {
      expect(identifyApp(null)).toBe('unknown');
      expect(identifyApp({})).toBe('unknown');
      expect(identifyApp({ owner: {} })).toBe('unknown');
    });

    it('should prioritize URL patterns over title patterns', () => {
      // Even with wrong title, URL should win
      const window = {
        title: 'Random Page',
        owner: { name: 'Chrome' },
        url: 'https://chat.openai.com'
      };

      expect(identifyApp(window)).toBe('chatgpt');
    });
  });

  describe('Accuracy Test', () => {
    it('should achieve 95%+ accuracy on common apps', () => {
      const commonApps = [
        { window: { title: 'Code - Welcome', owner: { name: 'Code' } }, expected: 'vscode' },
        { window: { title: 'ChatGPT', owner: { name: 'Google Chrome' }, url: 'chat.openai.com' }, expected: 'chatgpt' },
        { window: { title: 'Claude', owner: { name: 'Safari' }, url: 'claude.ai' }, expected: 'claude' },
        { window: { title: 'Cursor', owner: { name: 'Cursor' } }, expected: 'cursor' },
        { window: { title: 'Google Chrome - GitHub', owner: { name: 'Google Chrome' } }, expected: 'chrome' },
        { window: { title: 'Safari - Apple', owner: { name: 'Safari' } }, expected: 'safari' },
        { window: { title: 'Slack', owner: { name: 'Slack' } }, expected: 'slack' },
        { window: { title: 'Discord', owner: { name: 'Discord' } }, expected: 'discord' },
        { window: { title: 'Visual Studio Code', owner: { name: 'Code' } }, expected: 'vscode' },
        { window: { title: 'Firefox - Mozilla', owner: { name: 'Firefox' } }, expected: 'firefox' }
      ];

      let correctIdentifications = 0;
      commonApps.forEach(({ window, expected }) => {
        const result = identifyApp(window);
        if (result === expected) {
          correctIdentifications++;
        }
      });

      const accuracy = (correctIdentifications / commonApps.length) * 100;
      expect(accuracy).toBeGreaterThanOrEqual(95);
    });
  });
});