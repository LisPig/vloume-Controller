// content_script.js

// Global variables
let mediaObserver = null;
let playingElements = new Set();
let mediaDetectionInterval = null;
let lastKnownVolume = 1.0;
let hasNotifiedPopup = false; // Prevent duplicate notifications
let isInitialized = false; // **New: Initialization status flag**

// **Optimized initialization process**
initialize();

function initialize() {
    if (isInitialized) {
        console.log('Content script already initialized, skipping...');
        return;
    }
    
    console.log('Content script initializing...');
    
    try {
        // Wait for DOM to fully load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                finishInitialization();
            });
        } else {
            // DOM is already loaded
            finishInitialization();
        }
    } catch (error) {
        console.error('Error during content script initialization:', error);
        // Even if initialization fails, mark as initialized to prevent repeated attempts
        isInitialized = true;
    }
}

// **New: Function to finish initialization**
function finishInitialization() {
    try {
        console.log('Finishing content script initialization...');
        
        // Setup linkage functionality
        linkage();
        
        // Setup media detection (delayed to give page more time to load)
        setTimeout(() => {
            setupMediaDetection();
            isInitialized = true;
            console.log('✓ Content script fully initialized and ready');
        }, 500);
        
    } catch (error) {
        console.error('Error finishing initialization:', error);
        isInitialized = true; // Mark as initialized even if failed
    }
}

// Setup comprehensive media detection
function setupMediaDetection() {
    // 1. Initial detection
    checkMedia();
    
    // 2. Setup DOM change observer
    setupMutationObserver();
    
    // 3. Setup periodic check
    startPeriodicCheck();
    
    // 4. Listen for page visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 5. Listen for page focus/blur events
    window.addEventListener('focus', checkMedia);
    window.addEventListener('blur', checkMedia);
}

// Main media element detection function - keep original logic, but enhance detection capability
function checkMedia() {
    console.log('Starting comprehensive media detection...');
    
    try {
        // 1. Detect direct audio and video elements
        const directMediaElements = detectDirectMediaElements();
        
        // 2. Detect media elements in iframes
        const iframeMediaElements = detectIframeMediaElements();
        
        // 3. Detect other audio sources
        const otherAudioSources = detectOtherAudioSources();
        
        // Merge all detected elements
        const allDetectedElements = [
            ...directMediaElements,
            ...iframeMediaElements,
            ...otherAudioSources
        ];
        
        // Update playing element set
        updatePlayingElements(allDetectedElements);
        
        // **Key: Notify popup according to original logic**
        notifyPopupOfMediaElements(allDetectedElements);
        
        console.log(`Media detection completed. Found ${allDetectedElements.length} total elements, ${playingElements.size} playing`);
        
    } catch (error) {
        console.error('Error in media detection:', error);
        // Even if error, notify popup that there are no playing elements
        notifyPopupOfMediaElements([]);
    }
}

// Notify popup according to original logic
function notifyPopupOfMediaElements(elements) {
    const currentDomain = window.location.hostname;
    
    // Filter out actual media elements (audio/video)
    const realMediaElements = elements.filter(el => 
        el.type === 'audio' || el.type === 'video'
    );
    
    if (realMediaElements.length > 0) {
        // Get volume of the first valid element
        let volume = 1.0;
        const firstPlayingElement = realMediaElements.find(el => el.volume !== undefined);
        if (firstPlayingElement) {
            volume = firstPlayingElement.volume;
            lastKnownVolume = volume;
        }
        
        // **Send message to background according to original format, then forward to popup**
        chrome.runtime.sendMessage({
            hasPlayingElement: true,
            volume: volume,
            currentDomain: currentDomain
        });
        
        hasNotifiedPopup = true;
        console.log(`Notified popup: has playing elements on ${currentDomain}, volume: ${volume}`);
        
    } else {
        // No playing elements
        chrome.runtime.sendMessage({
            hasPlayingElement: false
        });
        
        hasNotifiedPopup = false;
        console.log('Notified popup: no playing elements');
    }
}

// Detect direct media elements
function detectDirectMediaElements() {
    const elements = [];
    const mediaElements = document.querySelectorAll('video, audio');
    
    mediaElements.forEach((element, index) => {
        try {
            const elementInfo = {
                element: element,
                type: element.tagName.toLowerCase(),
                index: index,
                isPlaying: !element.paused && !element.ended && element.readyState > 2,
                hasAudio: element.tagName.toLowerCase() === 'audio' || 
                         (element.tagName.toLowerCase() === 'video' && !element.muted),
                hasVideo: element.tagName.toLowerCase() === 'video',
                volume: element.volume,
                duration: element.duration || 0,
                currentTime: element.currentTime || 0,
                muted: element.muted,
                src: element.src || element.currentSrc || 'unknown'
            };
            
            // Setup event listeners
            setupElementEventListeners(element);
            
            elements.push(elementInfo);
            
        } catch (error) {
            console.warn('Error processing media element:', error);
        }
    });
    
    return elements;
}

// Detect media elements in iframes
function detectIframeMediaElements() {
    const elements = [];
    const iframes = document.querySelectorAll('iframe');
    
    iframes.forEach((iframe, index) => {
        try {
            // Check if iframe is accessible (same-origin policy restriction)
            if (iframe.contentDocument || iframe.contentWindow) {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const iframeMediaElements = iframeDoc.querySelectorAll('video, audio');
                
                iframeMediaElements.forEach((element, subIndex) => {
                    const elementInfo = {
                        element: element,
                        type: element.tagName.toLowerCase(),
                        index: `iframe-${index}-${subIndex}`,
                        isPlaying: !element.paused && !element.ended && element.readyState > 2,
                        hasAudio: true,
                        hasVideo: element.tagName.toLowerCase() === 'video',
                        volume: element.volume,
                        isInIframe: true,
                        iframeIndex: index
                    };
                    
                    setupElementEventListeners(element);
                    elements.push(elementInfo);
                });
            }
        } catch (error) {
            // iframe cross-origin access restriction, this is normal
            console.debug('Cannot access iframe content (cross-origin):', error.message);
        }
    });
    
    return elements;
}

// Detect other audio sources
function detectOtherAudioSources() {
    const elements = [];
    
    try {
        // 1. Detect embedded Flash players
        const embeds = document.querySelectorAll('embed[type*="flash"], object[type*="flash"]');
        embeds.forEach((embed, index) => {
            elements.push({
                type: 'flash',
                index: `flash-${index}`,
                isPlaying: true,
                hasAudio: true,
                hasVideo: true,
                volume: 1.0
            });
        });
        
        // 2. Detect signs of Web Audio API usage
        if (window.AudioContext || window.webkitAudioContext) {
            const scripts = document.querySelectorAll('script');
            let hasWebAudio = false;
            
            scripts.forEach(script => {
                if (script.textContent && 
                    (script.textContent.includes('AudioContext') || 
                     script.textContent.includes('webkitAudioContext'))) {
                    hasWebAudio = true;
                }
            });
            
            if (hasWebAudio) {
                elements.push({
                    type: 'webaudio',
                    index: 'webaudio-0',
                    isPlaying: true,
                    hasAudio: true,
                    hasVideo: false,
                    volume: 1.0
                });
            }
        }
        
    } catch (error) {
        console.warn('Error detecting other audio sources:', error);
    }
    
    return elements;
}

// Setup element event listeners
function setupElementEventListeners(element) {
    // Prevent duplicate adding listeners
    if (element.dataset.volumeControllerListeners) {
        return;
    }
    
    element.dataset.volumeControllerListeners = 'true';
    
    const events = ['play', 'pause', 'ended', 'volumechange', 'loadstart', 'canplay'];
    
    events.forEach(eventType => {
        element.addEventListener(eventType, (event) => {
            console.log(`Media event: ${eventType}`, element);
            
            // Delay detection to ensure state update, re-notify popup
            setTimeout(() => {
                checkMedia();
                
                if (eventType === 'volumechange') {
                    handleVolumeChange(event);
                }
            }, 100);
        });
    });
}

// Setup DOM change observer
function setupMutationObserver() {
    if (mediaObserver) {
        mediaObserver.disconnect();
    }
    
    mediaObserver = new MutationObserver((mutations) => {
        let shouldCheck = false;
        
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.matches && node.matches('video, audio, iframe, embed, object')) {
                            shouldCheck = true;
                        } else if (node.querySelector && node.querySelector('video, audio, iframe, embed, object')) {
                            shouldCheck = true;
                        }
                    }
                });
            }
        });
        
        if (shouldCheck) {
            console.log('DOM mutation detected, re-checking media elements');
            setTimeout(checkMedia, 500);
        }
    });
    
    mediaObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false
    });
}

// Start periodic check
function startPeriodicCheck() {
    if (mediaDetectionInterval) {
        clearInterval(mediaDetectionInterval);
    }
    
    // Check media status every 10 seconds (reduce frequency to reduce performance impact)
    mediaDetectionInterval = setInterval(() => {
        checkMedia();
    }, 10000);
}

// Handle page visibility change
function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
        console.log('Page became visible, checking media');
        setTimeout(checkMedia, 500);
    }
}

// Update playing element set
function updatePlayingElements(elements) {
    playingElements.clear();
    elements.forEach(el => {
        if (el.isPlaying) {
            playingElements.add(el);
        }
    });
}

// linkage function: Set volume for saved media elements for current website
function linkage() {
    const mediaElements = document.querySelectorAll('video, audio');
    const currentDomain = window.location.hostname;
    
    if (mediaElements.length > 0) {
        chrome.storage.local.get('mediaList', (result) => {
            try {
                let mediaList = [...new Set(result.mediaList || [])];
                const item = mediaList.find(item => item.url === currentDomain);
                
                if (item && item.volume !== undefined) {
                    for (const element of mediaElements) {
                        element.volume = item.volume;
                    }
                    console.log(`Applied saved volume ${item.volume} for ${currentDomain}`);
                }
            } catch (error) {
                console.error('Error in linkage function:', error);
            }
        });
    }
}

// **Keep original message listening logic**
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    try {
        console.log('Content script received message:', message.type);
        
        // **New: ping message response, used to check content script status**
        if (message.type === 'ping') {
            console.log('Content script responding to ping');
            sendResponse({status: 'alive', timestamp: Date.now()});
            return true;
        }
        
        // **Key: Original siteVolume message processing logic, enhanced error handling**
        if (message.type === 'siteVolume') {
            let volume = message.volume;
            const mediaElements = document.querySelectorAll('video, audio');

            console.log(`Content script received siteVolume message: volume=${volume}, elements found=${mediaElements.length}`);

            if (mediaElements.length === 0) {
                console.warn('No media elements found, but still responding to popup');
                sendResponse({success: false, error: 'No media elements found', elementsUpdated: 0});
                return true;
            }

            let successCount = 0;
            for (const element of mediaElements) {
                try {
                    element.volume = volume;
                    successCount++;
                    console.log(`Set volume ${volume} on element:`, element.tagName, element.src || element.currentSrc);
                } catch (err) {
                    console.warn('Failed to set volume on element:', err);
                }
            }
            
            lastKnownVolume = volume;
            console.log(`Applied volume ${volume} from popup list control to ${successCount}/${mediaElements.length} elements`);
            
            // **Send detailed response confirming message processed**
            sendResponse({
                success: successCount > 0, 
                elementsUpdated: successCount,
                totalElements: mediaElements.length,
                volume: volume
            });
            return true; // Keep message channel open
            
        } else if (message.type === 'getAudioStatus') {
            // Immediately detect and respond
            checkMedia();
            setTimeout(() => {
                const hasAudio = playingElements.size > 0 || 
                                document.querySelectorAll('video, audio').length > 0;
                sendResponse({ hasAudio: hasAudio });
            }, 100);
            return true;
            
        } else if (message.type === 'setVolume') {
            const volume = message.volume;
            const mediaElements = document.querySelectorAll('video, audio');
            
            let successCount = 0;
            for (const element of mediaElements) {
                try {
                    element.volume = volume;
                    successCount++;
                } catch (err) {
                    console.warn('Failed to set volume on element:', err);
                }
            }
            
            lastKnownVolume = volume;
            console.log(`Volume set to ${volume} on ${successCount} elements`);
            sendResponse({success: successCount > 0, elementsUpdated: successCount});
            return true;
            
        } else if (message.type === 'forceRecheck') {
            console.log('Content script performing forced media recheck');
            checkMedia();
            // Give some time for detection to complete
            setTimeout(() => {
                const mediaElements = document.querySelectorAll('video, audio');
                sendResponse({
                    success: true, 
                    mediaElementsFound: mediaElements.length,
                    playingElements: playingElements.size
                });
            }, 200);
            return true;
        }
    } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({ error: error.message, success: false });
        return true;
    }
});

// **Keep original volume change handling logic**
function handleVolumeChange(event) {
    const site = window.location.hostname;
    const el = event.target;
    const newVolume = el.volume;

    chrome.storage.local.get('mediaList', (result) => {
        try {
            let mediaList = [...new Set(result.mediaList || [])];
            const item = mediaList.find(item => item.url === site);
            
            if (item) {
                item.volume = newVolume;
                const index = mediaList.findIndex(item => item.url === site);
                mediaList.splice(index, 1, item);
                
                chrome.storage.local.set({
                    "mediaList": mediaList
                });
                
                console.log(`Volume changed to ${newVolume} for ${site}`);
            }
        } catch (error) {
            console.error('Error handling volume change:', error);
        }
    });
}

// Clean up when page is unloaded
window.addEventListener('beforeunload', () => {
    if (mediaObserver) {
        mediaObserver.disconnect();
    }
    if (mediaDetectionInterval) {
        clearInterval(mediaDetectionInterval);
    }
});

// **Keep backward compatible function**
function checkForAudio() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'checkForAudio' }, (response) => {
            resolve(response?.hasAudio || false);
        });
    });
}

function setVolume(volume) {
    chrome.runtime.sendMessage({ type: 'setVolume', volume: volume });
}

console.log('Enhanced content script loaded successfully - maintains original popup interaction logic');

