// Map of app signatures for identifying applications from window titles and process names
const appSignatures = {
  // AI Tools
  chatgpt: {
    displayName: 'ChatGPT',
    icon: 'tools/chatgpt.png',
    patterns: [
      /^ChatGPT$/i,
      /ChatGPT - /i
    ],
    processNames: [],
    urlPatterns: ['chat.openai.com']
  },
  
  claude: {
    displayName: 'Claude',
    icon: 'tools/claude.png',
    patterns: [
      /^Claude$/i,
      /Claude - /i
    ],
    processNames: [],
    urlPatterns: ['claude.ai']
  },
  
  cursor: {
    displayName: 'Cursor',
    icon: 'tools/cursor.png',
    patterns: [
      /^Cursor$/i,
      /^Cursor - /i
    ],
    processNames: ['Cursor']
  },

  // Additional AI Tools
  copilot: {
    displayName: 'GitHub Copilot',
    icon: 'tools/copilot.png',
    patterns: [
      /GitHub Copilot/i,
      /Copilot/i
    ],
    processNames: []
  },

  gemini: {
    displayName: 'Gemini',
    icon: 'tools/gemini.png',
    patterns: [
      /^Gemini$/i,
      /Gemini - /i
    ],
    processNames: [],
    urlPatterns: ['gemini.google.com']
  },

  windsurf: {
    displayName: 'Windsurf',
    icon: 'tools/windsurf.png',
    patterns: [
      /^Windsurf$/i,
      /Windsurf - /i
    ],
    processNames: ['Windsurf']
  },

  bolt: {
    displayName: 'Bolt',
    icon: 'tools/bolt.png',
    patterns: [
      /^Bolt$/i,
      /Bolt - /i
    ],
    processNames: ['Bolt']
  },

  v0: {
    displayName: 'v0',
    icon: 'tools/v0.png',
    patterns: [
      /^v0$/i,
      /v0 - /i
    ],
    processNames: [],
    urlPatterns: ['v0.dev']
  },

  replit: {
    displayName: 'Replit',
    icon: 'tools/replit.png',
    patterns: [
      /^Replit$/i,
      /Replit - /i
    ],
    processNames: ['Replit'],
    urlPatterns: ['replit.com']
  },

  codexel: {
    displayName: 'Codexel',
    icon: '🧪',
    patterns: [
      /^Codexel$/i,
      /Codexel - /i,
      /^Codexel/i
    ],
    processNames: ['Codexel'],
    urlPatterns: ['codexel.com', 'codexel.ai']
  },
  
  // Development Tools
  vscode: {
    displayName: 'Visual Studio Code',
    icon: '📝',
    patterns: [
      /^Visual Studio Code$/i,
      /Visual Studio Code$/i,
      /^Code$/i
    ],
    processNames: ['Code', 'Visual Studio Code']
  },
  
  // Browsers
  chrome: {
    displayName: 'Google Chrome',
    icon: '🌐',
    patterns: [
      /Google Chrome$/i,
      /^Chrome - /i,
      /^Chrome$/i,
      /^Google Chrome - /i,
      /Google Chrome/i
    ],
    processNames: ['Google Chrome', 'Chrome']
  },
  
  safari: {
    displayName: 'Safari',
    icon: '🧭',
    patterns: [
      /^Safari$/i,
      /Safari - /i
    ],
    processNames: ['Safari']
  },
  
  firefox: {
    displayName: 'Firefox',
    icon: '🦊',
    patterns: [
      /^Firefox$/i,
      /Firefox - /i
    ],
    processNames: ['Firefox']
  },
  
  edge: {
    displayName: 'Microsoft Edge',
    icon: '🌊',
    patterns: [
      /Microsoft Edge$/i,
      /^Edge - /i
    ],
    processNames: ['Microsoft Edge']
  },
  
  // Communication
  slack: {
    displayName: 'Slack',
    icon: '💬',
    patterns: [
      /^Slack$/i,
      /Slack - /i
    ],
    processNames: ['Slack']
  },
  
  discord: {
    displayName: 'Discord',
    icon: '🎮',
    patterns: [
      /^Discord$/i,
      /Discord - /i
    ],
    processNames: ['Discord']
  },
  
  // Default fallback
  unknown: {
    displayName: 'Unknown',
    icon: '📱',
    patterns: [],
    processNames: []
  }
};

/**
 * Identify application from window info
 * @param {Object} windowInfo - Window information from active-win
 * @param {string} windowInfo.title - Window title
 * @param {string} windowInfo.owner.name - Process/application name
 * @param {string} [windowInfo.url] - URL for browser windows
 * @returns {string} Application ID
 */
function identifyApp(windowInfo) {
  if (!windowInfo || !windowInfo.title) {
    return 'unknown';
  }
  
  const { title, owner, url } = windowInfo;
  const processName = owner?.name || '';
  
  // First check web apps by URL (most specific)
  if (url) {
    for (const [appId, signature] of Object.entries(appSignatures)) {
      if (signature.urlPatterns) {
        for (const urlPattern of signature.urlPatterns) {
          if (url.includes(urlPattern)) {
            return appId;
          }
        }
      }
    }
  }
  
  // Then check by title patterns AND process name combination
  for (const [appId, signature] of Object.entries(appSignatures)) {
    // Skip unknown entry
    if (appId === 'unknown') continue;
    
    // For browser identification, we need to ensure it's not a web app
    const isBrowser = ['chrome', 'safari', 'firefox', 'edge'].includes(appId);
    if (isBrowser && url) {
      // Skip browser identification if we have a URL (web app takes precedence)
      continue;
    }
    
    // Check title patterns
    let titleMatch = false;
    for (const pattern of signature.patterns) {
      if (pattern.test(title)) {
        titleMatch = true;
        break;
      }
    }
    
    // Check process names (exact match)
    let processMatch = false;
    if (processName && signature.processNames) {
      for (const procName of signature.processNames) {
        if (processName.toLowerCase() === procName.toLowerCase()) {
          processMatch = true;
          break;
        }
      }
    }
    
    // For non-browsers, either title or process match is sufficient
    // For browsers, we need both to avoid false positives
    if (isBrowser) {
      if (titleMatch || processMatch) {
        return appId;
      }
    } else {
      if (titleMatch || processMatch) {
        return appId;
      }
    }
  }
  
  return 'unknown';
}

module.exports = {
  appSignatures,
  identifyApp
};