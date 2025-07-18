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

  // Claude Code (Terminal-based AI coding tool)
  claudecode: {
    displayName: 'Claude Code',
    icon: 'tools/claudecode.png',
    patterns: [
      /Claude Code/i,
      /^claude$/i
    ],
    processNames: ['claude', 'claude-code']
  },

  // Cline (VS Code Extension AI Agent)
  cline: {
    displayName: 'Cline',
    icon: 'tools/cline.png',
    patterns: [
      /Cline/i
    ],
    processNames: []
  },

  // Devin (AI Software Engineer)
  devin: {
    displayName: 'Devin',
    icon: 'tools/devin.png',
    patterns: [
      /Devin/i
    ],
    processNames: [],
    urlPatterns: ['preview.devin.ai', 'devin.ai']
  },

  // Magic Loop (AI Development Tool)
  magicloop: {
    displayName: 'Magic Loop',
    icon: 'tools/magic_loop.png',
    patterns: [
      /Magic Loop/i
    ],
    processNames: [],
    urlPatterns: ['magicloop.ai']
  },

  // MCP (Model Context Protocol)
  mcp: {
    displayName: 'MCP',
    icon: 'tools/mcp.png',
    patterns: [
      /MCP/i,
      /Model Context Protocol/i
    ],
    processNames: []
  },

  // Cluely (AI Assistant)
  cluely: {
    displayName: 'Cluely',
    icon: 'tools/cluely.png',
    patterns: [
      /Cluely/i
    ],
    processNames: [],
    urlPatterns: ['cluely.ai']
  },

  // Lovable (AI Web Development)
  lovable: {
    displayName: 'Lovable',
    icon: 'tools/lovable.png',
    patterns: [
      /Lovable/i
    ],
    processNames: [],
    urlPatterns: ['lovable.dev']
  },

  // Mistral (AI Language Model)
  mistral: {
    displayName: 'Mistral',
    icon: 'tools/mistral.png',
    patterns: [
      /Mistral/i
    ],
    processNames: [],
    urlPatterns: ['mistral.ai', 'chat.mistral.ai']
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
  github: {
    displayName: 'GitHub Desktop',
    icon: 'tools/github.png',
    patterns: [
      /GitHub Desktop/i,
      /^GitHub Desktop$/i
    ],
    processNames: ['GitHub Desktop', 'GitHubDesktop']
  },

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

  // Research & Productivity Tools
  perplexity: {
    displayName: 'Perplexity',
    icon: 'tools/perplexity.png',
    patterns: [
      /Perplexity/i
    ],
    processNames: ['Perplexity'],
    urlPatterns: ['perplexity.ai']
  },

  grok: {
    displayName: 'Grok',
    icon: 'tools/grok.png',
    patterns: [
      /Grok/i
    ],
    processNames: [],
    urlPatterns: ['x.com/i/grok']
  },

  notion: {
    displayName: 'Notion',
    icon: 'tools/notion.png',
    patterns: [
      /Notion/i,
      /^Notion$/i
    ],
    processNames: ['Notion'],
    urlPatterns: ['notion.so', 'notion.com']
  },

  linear: {
    displayName: 'Linear',
    icon: 'tools/linear.png',
    patterns: [
      /Linear/i,
      /^Linear$/i
    ],
    processNames: ['Linear'],
    urlPatterns: ['linear.app']
  },

  figma: {
    displayName: 'Figma',
    icon: 'tools/figma.png',
    patterns: [
      /Figma/i,
      /^Figma$/i
    ],
    processNames: ['Figma', 'figma_agent'],
    urlPatterns: ['figma.com']
  },

  canva: {
    displayName: 'Canva',
    icon: 'tools/canva.png',
    patterns: [
      /Canva/i,
      /^Canva$/i
    ],
    processNames: ['Canva'],
    urlPatterns: ['canva.com']
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

  // Additional Browsers
  arc: {
    displayName: 'Arc',
    icon: 'tools/arc.png',
    patterns: [
      /Arc/i,
      /^Arc$/i
    ],
    processNames: ['Arc']
  },

  brave: {
    displayName: 'Brave Browser',
    icon: 'tools/brave.png',
    patterns: [
      /Brave/i,
      /Brave Browser/i
    ],
    processNames: ['Brave Browser', 'Brave']
  },

  // AI Image & Video Tools
  midjourney: {
    displayName: 'Midjourney',
    icon: 'tools/midjourney.png',
    patterns: [
      /Midjourney/i
    ],
    processNames: [],
    urlPatterns: ['midjourney.com']
  },

  stablediffusion: {
    displayName: 'Stable Diffusion',
    icon: 'tools/stablediffusion.png',
    patterns: [
      /Stable Diffusion/i,
      /AUTOMATIC1111/i,
      /ComfyUI/i
    ],
    processNames: ['stable-diffusion-webui', 'ComfyUI']
  },

  runway: {
    displayName: 'Runway',
    icon: 'tools/runway.png',
    patterns: [
      /Runway/i,
      /RunwayML/i
    ],
    processNames: ['Runway', 'RunwayML'],
    urlPatterns: ['runwayml.com', 'app.runwayml.com']
  },

  dalle: {
    displayName: 'DALL-E',
    icon: 'tools/dalle.png',
    patterns: [
      /DALL-E/i,
      /DALLE/i
    ],
    processNames: [],
    urlPatterns: ['labs.openai.com']
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
    const isBrowser = ['chrome', 'safari', 'firefox', 'edge', 'arc', 'brave'].includes(appId);
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