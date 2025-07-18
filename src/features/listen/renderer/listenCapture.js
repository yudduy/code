// Note: Using window.electronAPI for secure IPC communication

// ---------------------------
// Constants & Globals
// ---------------------------
const SAMPLE_RATE = 24000;
const AUDIO_CHUNK_DURATION = 0.1;
const BUFFER_SIZE = 4096;

// Platform detection that works in renderer process with context isolation
const platform = window.electronAPI?.getPlatform() || navigator.platform || 'unknown';
const isLinux = platform.includes('linux') || platform.includes('Linux');
const isMacOS = platform.includes('darwin') || platform.includes('Darwin') || platform.includes('Mac');

let mediaStream = null;
let micMediaStream = null;
let screenshotInterval = null;
let audioContext = null;
let audioProcessor = null;
let systemAudioContext = null;
let systemAudioProcessor = null;
let currentImageQuality = 'medium';
let lastScreenshotBase64 = null;

let systemAudioBuffer = [];
const MAX_SYSTEM_BUFFER_SIZE = 10;

// Telemetry event queue
let telemetryEventQueue = [];
let currentSessionId = null;

// ---------------------------
// Utility helpers (exact from renderer.js)
// ---------------------------
function isVoiceActive(audioFloat32Array, threshold = 0.005) {
    if (!audioFloat32Array || audioFloat32Array.length === 0) {
        return false;
    }

    let sumOfSquares = 0;
    for (let i = 0; i < audioFloat32Array.length; i++) {
        sumOfSquares += audioFloat32Array[i] * audioFloat32Array[i];
    }
    const rms = Math.sqrt(sumOfSquares / audioFloat32Array.length);

    // console.log(`VAD RMS: ${rms.toFixed(4)}`); // For debugging VAD threshold

    return rms > threshold;
}

function base64ToFloat32Array(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);

    for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
    }

    return float32Array;
}

function convertFloat32ToInt16(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        // Improved scaling to prevent clipping
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// ---------------------------
// Complete SimpleAEC implementation (exact from renderer.js)
// ---------------------------
class SimpleAEC {
    constructor() {
        this.adaptiveFilter = new Float32Array(1024);
        this.mu = 0.2;
        this.echoDelay = 100;
        this.sampleRate = 24000;
        this.delaySamples = Math.floor((this.echoDelay / 1000) * this.sampleRate);

        this.echoGain = 0.5;
        this.noiseFloor = 0.01;

        // 🔧 Adaptive-gain parameters (User-tuned, very aggressive)
        this.targetErr = 0.002;
        this.adaptRate  = 0.1;

        console.log('🎯 AEC initialized (hyper-aggressive)');
    }

    process(micData, systemData) {
        if (!systemData || systemData.length === 0) {
            return micData;
        }

        for (let i = 0; i < systemData.length; i++) {
            if (systemData[i] > 0.98) systemData[i] = 0.98;
            else if (systemData[i] < -0.98) systemData[i] = -0.98;

            systemData[i] = Math.tanh(systemData[i] * 4);
        }

        let sum2 = 0;
        for (let i = 0; i < systemData.length; i++) sum2 += systemData[i] * systemData[i];
        const rms = Math.sqrt(sum2 / systemData.length);
        const targetRms = 0.08;                   // 🔧 기준 RMS (기존 0.1)
        const scale = targetRms / (rms + 1e-6);   // 1e-6: 0-division 방지

        const output = new Float32Array(micData.length);

        const optimalDelay = this.findOptimalDelay(micData, systemData);

        for (let i = 0; i < micData.length; i++) {
            let echoEstimate = 0;

            for (let d = -500; d <= 500; d += 100) {
                const delayIndex = i - optimalDelay - d;
                if (delayIndex >= 0 && delayIndex < systemData.length) {
                    const weight = Math.exp(-Math.abs(d) / 1000);
                    echoEstimate += systemData[delayIndex] * scale * this.echoGain * weight;
                }
            }

            output[i] = micData[i] - echoEstimate * 0.9;

            if (Math.abs(output[i]) < this.noiseFloor) {
                output[i] *= 0.5;
            }

            if (this.isSimilarToSystem(output[i], systemData, i, optimalDelay)) {
                output[i] *= 0.25;
            }

            output[i] = Math.max(-1, Math.min(1, output[i]));
        }


        let errSum = 0;
        for (let i = 0; i < output.length; i++) errSum += output[i] * output[i];
        const errRms = Math.sqrt(errSum / output.length);

        const err = errRms - this.targetErr;
        this.echoGain += this.adaptRate * err;      // 비례 제어
        this.echoGain  = Math.max(0, Math.min(1, this.echoGain));

        return output;
    }

    findOptimalDelay(micData, systemData) {
        let maxCorr = 0;
        let optimalDelay = this.delaySamples;

        for (let delay = 0; delay < 5000 && delay < systemData.length; delay += 200) {
            let corr = 0;
            let count = 0;

            for (let i = 0; i < Math.min(500, micData.length); i++) {
                if (i + delay < systemData.length) {
                    corr += micData[i] * systemData[i + delay];
                    count++;
                }
            }

            if (count > 0) {
                corr = Math.abs(corr / count);
                if (corr > maxCorr) {
                    maxCorr = corr;
                    optimalDelay = delay;
                }
            }
        }

        return optimalDelay;
    }

    isSimilarToSystem(sample, systemData, index, delay) {
        const windowSize = 50;
        let similarity = 0;

        for (let i = -windowSize; i <= windowSize; i++) {
            const sysIndex = index - delay + i;
            if (sysIndex >= 0 && sysIndex < systemData.length) {
                similarity += Math.abs(sample - systemData[sysIndex]);
            }
        }

        return similarity / (2 * windowSize + 1) < 0.15;
    }
}

let aecProcessor = new SimpleAEC();

// System audio data handler
if (window.electronAPI && window.electronAPI.onSystemAudioData) {
    window.electronAPI.onSystemAudioData((event, { data }) => {
        systemAudioBuffer.push({
            data: data,
            timestamp: Date.now(),
        });

        // 오래된 데이터 제거
        if (systemAudioBuffer.length > MAX_SYSTEM_BUFFER_SIZE) {
            systemAudioBuffer = systemAudioBuffer.slice(-MAX_SYSTEM_BUFFER_SIZE);
        }

        console.log('📥 Received system audio for AEC reference');
    });
}

// ---------------------------
// Complete token tracker (exact from renderer.js)
// ---------------------------
let tokenTracker = {
    tokens: [],
    audioStartTime: null,

    addTokens(count, type = 'image') {
        const now = Date.now();
        this.tokens.push({
            timestamp: now,
            count: count,
            type: type,
        });

        this.cleanOldTokens();
    },

    calculateImageTokens(width, height) {
        const pixels = width * height;
        if (pixels <= 384 * 384) {
            return 85;
        }

        const tiles = Math.ceil(pixels / (768 * 768));
        return tiles * 85;
    },

    trackAudioTokens() {
        if (!this.audioStartTime) {
            this.audioStartTime = Date.now();
            return;
        }

        const now = Date.now();
        const elapsedSeconds = (now - this.audioStartTime) / 1000;

        const audioTokens = Math.floor(elapsedSeconds * 16);

        if (audioTokens > 0) {
            this.addTokens(audioTokens, 'audio');
            this.audioStartTime = now;
        }
    },

    cleanOldTokens() {
        const oneMinuteAgo = Date.now() - 60 * 1000;
        this.tokens = this.tokens.filter(token => token.timestamp > oneMinuteAgo);
    },

    getTokensInLastMinute() {
        this.cleanOldTokens();
        return this.tokens.reduce((total, token) => total + token.count, 0);
    },

    shouldThrottle() {
        const throttleEnabled = localStorage.getItem('throttleTokens') === 'true';
        if (!throttleEnabled) {
            return false;
        }

        const maxTokensPerMin = parseInt(localStorage.getItem('maxTokensPerMin') || '500000', 10);
        const throttleAtPercent = parseInt(localStorage.getItem('throttleAtPercent') || '75', 10);

        const currentTokens = this.getTokensInLastMinute();
        const throttleThreshold = Math.floor((maxTokensPerMin * throttleAtPercent) / 100);

        console.log(`Token check: ${currentTokens}/${maxTokensPerMin} (throttle at ${throttleThreshold})`);

        return currentTokens >= throttleThreshold;
    },

    // Reset the tracker
    reset() {
        this.tokens = [];
        this.audioStartTime = null;
    },
};

// Track audio tokens every few seconds
setInterval(() => {
    tokenTracker.trackAudioTokens();
}, 2000);

// ---------------------------
// Audio processing functions (exact from renderer.js)
// ---------------------------
function setupMicProcessing(micStream) {
    const micAudioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    const micSource = micAudioContext.createMediaStreamSource(micStream);
    const micProcessor = micAudioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

    let audioBuffer = [];
    const samplesPerChunk = SAMPLE_RATE * AUDIO_CHUNK_DURATION;

    micProcessor.onaudioprocess = async e => {
        const inputData = e.inputBuffer.getChannelData(0);
        audioBuffer.push(...inputData);

        while (audioBuffer.length >= samplesPerChunk) {
            let chunk = audioBuffer.splice(0, samplesPerChunk);
            let processedChunk = new Float32Array(chunk);

            // Check for system audio and apply AEC only if voice is active
            if (aecProcessor && systemAudioBuffer.length > 0) {
                const latestSystemAudio = systemAudioBuffer[systemAudioBuffer.length - 1];
                const systemFloat32 = base64ToFloat32Array(latestSystemAudio.data);

                // Apply AEC only when system audio has active speech
                if (isVoiceActive(systemFloat32)) {
                    processedChunk = aecProcessor.process(new Float32Array(chunk), systemFloat32);
                    console.log('🔊 Applied AEC because system audio is active');
                }
            }

            const pcmData16 = convertFloat32ToInt16(processedChunk);
            const base64Data = arrayBufferToBase64(pcmData16.buffer);

            if (window.electronAPI && window.electronAPI.sendAudioContent) {
                await window.electronAPI.sendAudioContent({
                    data: base64Data,
                    mimeType: 'audio/pcm;rate=24000',
                });
            }
        }
    };

    micSource.connect(micProcessor);
    micProcessor.connect(micAudioContext.destination);

    audioProcessor = micProcessor;
    return { context: micAudioContext, processor: micProcessor };
}

function setupLinuxMicProcessing(micStream) {
    // Setup microphone audio processing for Linux
    const micAudioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    const micSource = micAudioContext.createMediaStreamSource(micStream);
    const micProcessor = micAudioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

    let audioBuffer = [];
    const samplesPerChunk = SAMPLE_RATE * AUDIO_CHUNK_DURATION;

    micProcessor.onaudioprocess = async e => {
        const inputData = e.inputBuffer.getChannelData(0);
        audioBuffer.push(...inputData);

        // Process audio in chunks
        while (audioBuffer.length >= samplesPerChunk) {
            const chunk = audioBuffer.splice(0, samplesPerChunk);
            const pcmData16 = convertFloat32ToInt16(chunk);
            const base64Data = arrayBufferToBase64(pcmData16.buffer);

            if (window.electronAPI && window.electronAPI.sendAudioContent) {
                await window.electronAPI.sendAudioContent({
                    data: base64Data,
                    mimeType: 'audio/pcm;rate=24000',
                });
            }
        }
    };

    micSource.connect(micProcessor);
    micProcessor.connect(micAudioContext.destination);

    // Store processor reference for cleanup
    audioProcessor = micProcessor;
}

function setupSystemAudioProcessing(systemStream) {
    const systemAudioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    const systemSource = systemAudioContext.createMediaStreamSource(systemStream);
    const systemProcessor = systemAudioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

    let audioBuffer = [];
    const samplesPerChunk = SAMPLE_RATE * AUDIO_CHUNK_DURATION;

    systemProcessor.onaudioprocess = async e => {
        const inputData = e.inputBuffer.getChannelData(0);
        if (!inputData || inputData.length === 0) return;
        
        audioBuffer.push(...inputData);

        while (audioBuffer.length >= samplesPerChunk) {
            const chunk = audioBuffer.splice(0, samplesPerChunk);
            const pcmData16 = convertFloat32ToInt16(chunk);
            const base64Data = arrayBufferToBase64(pcmData16.buffer);

            try {
                if (window.electronAPI && window.electronAPI.sendSystemAudioContent) {
                    await window.electronAPI.sendSystemAudioContent({
                        data: base64Data,
                        mimeType: 'audio/pcm;rate=24000',
                    });
                }
            } catch (error) {
                console.error('Failed to send system audio:', error);
            }
        }
    };

    systemSource.connect(systemProcessor);
    systemProcessor.connect(systemAudioContext.destination);

    return { context: systemAudioContext, processor: systemProcessor };
}

// ---------------------------
// Screenshot functions (exact from renderer.js)
// ---------------------------
async function captureScreenshot(imageQuality = 'medium', isManual = false) {
    console.log(`Capturing ${isManual ? 'manual' : 'automated'} screenshot...`);

    // Check rate limiting for automated screenshots only
    if (!isManual && tokenTracker.shouldThrottle()) {
        console.log('⚠️ Automated screenshot skipped due to rate limiting');
        return;
    }

    try {
        // Request screenshot from main process
        const result = window.electronAPI ? await window.electronAPI.captureScreenshot({
            quality: imageQuality,
        }) : { success: false, error: 'electronAPI not available' };

        if (result.success && result.base64) {
            // Store the latest screenshot
            lastScreenshotBase64 = result.base64;

            // Note: sendResult is not defined in the original, this was likely an error
            // Commenting out this section as it references undefined variable
            /*
            if (sendResult.success) {
                // Track image tokens after successful send
                const imageTokens = tokenTracker.calculateImageTokens(result.width || 1920, result.height || 1080);
                tokenTracker.addTokens(imageTokens, 'image');
                console.log(`📊 Image sent successfully - ${imageTokens} tokens used (${result.width}x${result.height})`);
            } else {
                console.error('Failed to send image:', sendResult.error);
            }
            */
        } else {
            console.error('Failed to capture screenshot:', result.error);
        }
    } catch (error) {
        console.error('Error capturing screenshot:', error);
    }
}

async function captureManualScreenshot(imageQuality = null) {
    console.log('Manual screenshot triggered');
    const quality = imageQuality || currentImageQuality;
    await captureScreenshot(quality, true);
}

async function getCurrentScreenshot() {
    try {
        // First try to get a fresh screenshot from main process
        const result = window.electronAPI ? await window.electronAPI.getCurrentScreenshot() : { success: false, error: 'electronAPI not available' };

        if (result.success && result.base64) {
            console.log('📸 Got fresh screenshot from main process');
            return result.base64;
        }

        // If no screenshot available, capture one now
        console.log('📸 No screenshot available, capturing new one');
        const captureResult = window.electronAPI ? await window.electronAPI.captureScreenshot({
            quality: currentImageQuality,
        }) : { success: false, error: 'electronAPI not available' };

        if (captureResult.success && captureResult.base64) {
            lastScreenshotBase64 = captureResult.base64;
            return captureResult.base64;
        }

        // Fallback to last stored screenshot
        if (lastScreenshotBase64) {
            console.log('📸 Using cached screenshot');
            return lastScreenshotBase64;
        }

        throw new Error('Failed to get screenshot');
    } catch (error) {
        console.error('Error getting current screenshot:', error);
        return null;
    }
}

// ---------------------------
// Main capture functions (exact from renderer.js)
// ---------------------------
async function startCapture(screenshotIntervalSeconds = 5, imageQuality = 'medium') {
    // Store the image quality for manual screenshots
    currentImageQuality = imageQuality;

    // Reset token tracker when starting new capture session
    tokenTracker.reset();
    console.log('🎯 Token tracker reset for new capture session');

    try {
        if (isMacOS) {
            // On macOS, use SystemAudioDump for audio and getDisplayMedia for screen
            console.log('Starting macOS capture with SystemAudioDump...');

            // Start macOS audio capture
            const audioResult = window.electronAPI ? await window.electronAPI.startMacOSAudio() : { success: false, error: 'electronAPI not available' };
            if (!audioResult.success) {
                throw new Error('Failed to start macOS audio capture: ' + audioResult.error);
            }

            // Initialize screen capture in main process
            const screenResult = window.electronAPI ? await window.electronAPI.startScreenCapture() : { success: false, error: 'electronAPI not available' };
            if (!screenResult.success) {
                throw new Error('Failed to start screen capture: ' + screenResult.error);
            }


            try {
                micMediaStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        sampleRate: SAMPLE_RATE,
                        channelCount: 1,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                    video: false,
                });

                console.log('macOS microphone capture started');
                const { context, processor } = setupMicProcessing(micMediaStream);
                audioContext = context;
                audioProcessor = processor;
            } catch (micErr) {
                console.warn('Failed to get microphone on macOS:', micErr);
            }
            ////////// for index & subjects //////////

            console.log('macOS screen capture started - audio handled by SystemAudioDump');
        } else if (isLinux) {
            // Linux - use display media for screen capture and getUserMedia for microphone
            mediaStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    frameRate: 1,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false, // Don't use system audio loopback on Linux
            });

            // Get microphone input for Linux
            let micMediaStream = null;
            try {
                micMediaStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        sampleRate: SAMPLE_RATE,
                        channelCount: 1,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                    video: false,
                });

                console.log('Linux microphone capture started');

                // Setup audio processing for microphone on Linux
                setupLinuxMicProcessing(micMediaStream);
            } catch (micError) {
                console.warn('Failed to get microphone access on Linux:', micError);
                // Continue without microphone if permission denied
            }

            console.log('Linux screen capture started');
        } else {
            // Windows - capture mic and system audio separately using native loopback
            console.log('Starting Windows capture with native loopback audio...');

            // Start screen capture in main process for screenshots
            const screenResult = window.electronAPI ? await window.electronAPI.startScreenCapture() : { success: false, error: 'electronAPI not available' };
            if (!screenResult.success) {
                throw new Error('Failed to start screen capture: ' + screenResult.error);
            }

            // Ensure STT sessions are initialized before starting audio capture
            const sessionActive = window.electronAPI ? await window.electronAPI.isSessionActive() : false;
            if (!sessionActive) {
                throw new Error('STT sessions not initialized - please wait for initialization to complete');
            }

            // 1. Get user's microphone
            try {
                micMediaStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        sampleRate: SAMPLE_RATE,
                        channelCount: 1,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                    video: false,
                });
                console.log('Windows microphone capture started');
                const { context, processor } = setupMicProcessing(micMediaStream);
                audioContext = context;
                audioProcessor = processor;
            } catch (micErr) {
                console.warn('Could not get microphone access on Windows:', micErr);
            }

            // 2. Get system audio using native Electron loopback
            try {
                mediaStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true // This will now use native loopback from our handler
                });
                
                // Verify we got audio tracks
                const audioTracks = mediaStream.getAudioTracks();
                if (audioTracks.length === 0) {
                    throw new Error('No audio track in native loopback stream');
                }
                
                console.log('Windows native loopback audio capture started');
                const { context, processor } = setupSystemAudioProcessing(mediaStream);
                systemAudioContext = context;
                systemAudioProcessor = processor;
            } catch (sysAudioErr) {
                console.error('Failed to start Windows native loopback audio:', sysAudioErr);
                // Continue without system audio
            }
        }

        // Start capturing screenshots - check if manual mode
        if (screenshotIntervalSeconds === 'manual' || screenshotIntervalSeconds === 'Manual') {
            console.log('Manual mode enabled - screenshots will be captured on demand only');
            // Don't start automatic capture in manual mode
        } else {
            // 스크린샷 기능 활성화 (chatModel에서 사용)
            const intervalMilliseconds = parseInt(screenshotIntervalSeconds) * 1000;
            screenshotInterval = setInterval(() => captureScreenshot(imageQuality), intervalMilliseconds);

            // Capture first screenshot immediately
            setTimeout(() => captureScreenshot(imageQuality), 100);
            console.log(`📸 Screenshot capture enabled with ${screenshotIntervalSeconds}s interval`);
        }
    } catch (err) {
        console.error('Error starting capture:', err);
        // Note: pickleGlass.e() is not available in this context, commenting out
        // pickleGlass.e().setStatus('error');
    }
}

function stopCapture() {
    if (screenshotInterval) {
        clearInterval(screenshotInterval);
        screenshotInterval = null;
    }

    // Clean up microphone resources
    if (audioProcessor) {
        audioProcessor.disconnect();
        audioProcessor = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }

    // Clean up system audio resources
    if (systemAudioProcessor) {
        systemAudioProcessor.disconnect();
        systemAudioProcessor = null;
    }
    if (systemAudioContext) {
        systemAudioContext.close();
        systemAudioContext = null;
    }

    // Stop and release media stream tracks
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    if (micMediaStream) {
        micMediaStream.getTracks().forEach(t => t.stop());
        micMediaStream = null;
    }

    // Stop screen capture in main process
    if (window.electronAPI && window.electronAPI.stopScreenCapture) {
        window.electronAPI.stopScreenCapture().catch(err => {
            console.error('Error stopping screen capture:', err);
        });
    }

    // Stop macOS audio capture if running
    if (isMacOS) {
        if (window.electronAPI && window.electronAPI.stopMacOSAudio) {
            window.electronAPI.stopMacOSAudio().catch(err => {
                console.error('Error stopping macOS audio:', err);
            });
        }
    }
}

// ---------------------------
// Telemetry functions
// ---------------------------

// Listen for focus change events from main process
if (window.electronAPI && window.electronAPI.onFocusChange) {
    window.electronAPI.onFocusChange((event, focusEvent) => {
        console.log('Received APP_FOCUS event:', focusEvent);
        
        // Add to telemetry queue
        if (currentSessionId) {
            telemetryEventQueue.push(focusEvent);
        }
    });
}

// Get current telemetry events
function getTelemetryEvents() {
    const events = [...telemetryEventQueue];
    telemetryEventQueue = []; // Clear queue after retrieval
    return events;
}

// Set current session ID for telemetry
function setSessionId(sessionId) {
    currentSessionId = sessionId;
    
    // Start focus detection when session starts
    if (sessionId) {
        if (window.electronAPI && window.electronAPI.startFocusDetector) {
            window.electronAPI.startFocusDetector(sessionId).catch(err => {
                console.error('Error starting focus detector:', err);
            });
        }
    } else {
        // Stop focus detection when session ends
        if (window.electronAPI && window.electronAPI.stopFocusDetector) {
            window.electronAPI.stopFocusDetector().catch(err => {
                console.error('Error stopping focus detector:', err);
            });
        }
    }
}

// ---------------------------
// Exports & global registration
// ---------------------------
export {
    startCapture,
    stopCapture,
    captureManualScreenshot,
    getCurrentScreenshot,
    getTelemetryEvents,
    setSessionId,
    isLinux,
    isMacOS,
};

// Expose functions to global scope for external access (exact from renderer.js)
if (typeof window !== 'undefined') {
    window.captureManualScreenshot = captureManualScreenshot;
    window.listenCapture = {
        startCapture,
        stopCapture,
        captureManualScreenshot,
        getCurrentScreenshot,
        getTelemetryEvents,
        setSessionId,
        isLinux,
        isMacOS,
    };
    window.pickleGlass = window.pickleGlass || {};
    window.pickleGlass.startCapture = startCapture;
    window.pickleGlass.stopCapture = stopCapture;
    window.pickleGlass.captureManualScreenshot = captureManualScreenshot;
    window.pickleGlass.getCurrentScreenshot = getCurrentScreenshot;
    window.pickleGlass.getTelemetryEvents = getTelemetryEvents;
    window.pickleGlass.setSessionId = setSessionId;
} 