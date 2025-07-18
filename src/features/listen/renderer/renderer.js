// renderer.js
import * as listenCapture from './listenCapture.js';

let realtimeConversationHistory = [];

async function queryLoginState() {
    if (!window.electronAPI) {
        console.warn('[Renderer] electronAPI not available');
        return null;
    }
    const userState = await window.electronAPI.getCurrentUser();
    return userState;
}

function pickleGlassElement() {
    return document.getElementById('pickle-glass');
}

async function initializeopenai(profile = 'interview', language = 'en') {
    // The API key is now handled in the main process from .env file.
    // We just need to trigger the initialization.
    try {
        console.log(`Requesting OpenAI initialization with profile: ${profile}, language: ${language}`);
        // Note: initialize-openai IPC would need to be added to preload.js if needed
        // const success = await window.electronAPI.initializeOpenAI(profile, language);
        const success = true; // Simplified for assessment mode
        if (success) {
            // The status will be updated via 'update-status' event from the main process.
            console.log('OpenAI initialization successful.');
        } else {
            console.error('OpenAI initialization failed.');
            const appElement = pickleGlassElement();
            if (appElement && typeof appElement.setStatus === 'function') {
                appElement.setStatus('Initialization Failed');
            }
        }
    } catch (error) {
        console.error('Error during OpenAI initialization IPC call:', error);
        const appElement = pickleGlassElement();
        if (appElement && typeof appElement.setStatus === 'function') {
            appElement.setStatus('Error');
        }
    }
}

// Listen for status updates
if (window.electronAPI && window.electronAPI.onUpdateStatus) {
    // Note: onUpdateStatus would need to be added to preload.js if needed
    // window.electronAPI.onUpdateStatus((status) => {
    //     console.log('Status update:', status);
    //     pickleGlass.e().setStatus(status);
    // });
}

// Listen for real-time STT updates
if (window.electronAPI && window.electronAPI.onSttUpdate) {
    // Note: onSttUpdate would need to be added to preload.js if needed
    // window.electronAPI.onSttUpdate((data) => {
    //     console.log('Renderer.js stt-update', data);
    //     const { speaker, text, isFinal, isPartial, timestamp } = data;
    //
    //     if (isPartial) {
    //         console.log(`🔄 [${speaker} - partial]: ${text}`);
    //     } else if (isFinal) {
    //         console.log(`✅ [${speaker} - final]: ${text}`);
    //
    //         const speakerText = speaker.toLowerCase();
    //         const conversationText = `${speakerText}: ${text.trim()}`;
    //
    //         realtimeConversationHistory.push(conversationText);
    //
    //         if (realtimeConversationHistory.length > 30) {
    //             realtimeConversationHistory = realtimeConversationHistory.slice(-30);
    //         }
    //
    //         console.log(`📝 Updated realtime conversation history: ${realtimeConversationHistory.length} texts`);
    //         console.log(`📋 Latest text: ${conversationText}`);
    //     }
    //
    //     if (pickleGlass.e() && typeof pickleGlass.e().updateRealtimeTranscription === 'function') {
    //         pickleGlass.e().updateRealtimeTranscription({
    //             speaker,
    //             text,
    //             isFinal,
    //             isPartial,
    //             timestamp,
    //         });
    //     }
    // });
}

if (window.electronAPI && window.electronAPI.onUpdateStructuredData) {
    // Note: onUpdateStructuredData would need to be added to preload.js if needed
    // window.electronAPI.onUpdateStructuredData((structuredData) => {
    //     console.log('📥 Received structured data update:', structuredData);
    //     window.pickleGlass.structuredData = structuredData;
    //     window.pickleGlass.setStructuredData(structuredData);
    // });
}

window.pickleGlass.structuredData = {
    summary: [],
    topic: { header: '', bullets: [] },
    actions: [],
};

window.pickleGlass.setStructuredData = data => {
    window.pickleGlass.structuredData = data;
    pickleGlass.e()?.updateStructuredData?.(data);
};

function formatRealtimeConversationHistory() {
    if (realtimeConversationHistory.length === 0) return 'No conversation history available.';

    return realtimeConversationHistory.slice(-30).join('\n');
}

window.pickleGlass = {
    initializeopenai,
    startCapture: listenCapture.startCapture,
    stopCapture: listenCapture.stopCapture,
    isLinux: listenCapture.isLinux,
    isMacOS: listenCapture.isMacOS,
    captureManualScreenshot: listenCapture.captureManualScreenshot,
    getCurrentScreenshot: listenCapture.getCurrentScreenshot,
    e: pickleGlassElement,
};

// -------------------------------------------------------
// 🔔 React to session state changes from the main process
// When the session ends (isActive === false), ensure we stop
// all local capture pipelines (mic, screen, etc.).
// -------------------------------------------------------
if (window.electronAPI && window.electronAPI.onSessionStateChanged) {
    // Note: onSessionStateChanged would need to be added to preload.js if needed
    // window.electronAPI.onSessionStateChanged(({ isActive }) => {
    //     if (!isActive) {
    //         console.log('[Renderer] Session ended – stopping local capture');
    //         listenCapture.stopCapture();
    //     } else {
    //         console.log('[Renderer] New session started – clearing in-memory history and summaries');
    //
    //         // Reset live conversation & analysis caches
    //         realtimeConversationHistory = [];
    //
    //         const blankData = {
    //             summary: [],
    //             topic: { header: '', bullets: [] },
    //             actions: [],
    //             followUps: [],
    //         };
    //         window.pickleGlass.setStructuredData(blankData);
    //     }
    // });
}
