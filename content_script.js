// content_script.js

// Global variables
let mediaObserver = null;
let playingElements = new Set();
let mediaDetectionInterval = null;
let lastKnownVolume = 1.0;
let hasNotifiedPopup = false; // Prevent duplicate notifications
let isInitialized = false; // **New: Initialization status flag**

// **新增：防抖相关变量**
let checkMediaTimeout = null;
let isCheckingMedia = false;
let lastCheckTime = 0;
const MIN_CHECK_INTERVAL = 1000; // 最小检查间隔1秒

// **Optimized initialization process**
initialize();

function initialize() {
    if (isInitialized) {
        return;
    }
    
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
        // Setup linkage functionality
        linkage();
        
        // Setup media detection (delayed to give page more time to load)
        setTimeout(() => {
            setupMediaDetection();
            isInitialized = true;
        }, 500);
        
    } catch (error) {
        console.error('Error finishing initialization:', error);
        isInitialized = true; // Mark as initialized even if failed
    }
}

// Setup comprehensive media detection
function setupMediaDetection() {
    // 1. Initial detection
    debouncedCheckMedia();
    
    // 2. Setup DOM change observer
    setupMutationObserver();
    
    // 3. Setup periodic check
    startPeriodicCheck();
    
    // 4. Listen for page visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 5. Listen for page focus/blur events
    window.addEventListener('focus', debouncedCheckMedia);
    window.addEventListener('blur', debouncedCheckMedia);
}

// **新增：防抖版本的checkMedia**
function debouncedCheckMedia() {
    const now = Date.now();
    
    // 如果距离上次检查时间太短，则延迟执行
    if (now - lastCheckTime < MIN_CHECK_INTERVAL) {
        if (checkMediaTimeout) {
            clearTimeout(checkMediaTimeout);
        }
        
        checkMediaTimeout = setTimeout(() => {
            checkMedia();
        }, MIN_CHECK_INTERVAL - (now - lastCheckTime));
        return;
    }
    
    // 如果正在检查中，则跳过
    if (isCheckingMedia) {
        return;
    }
    
    checkMedia();
}

// Main media element detection function - keep original logic, but enhance detection capability
function checkMedia() {
    // 防止重复执行
    if (isCheckingMedia) {
        return;
    }
    
    isCheckingMedia = true;
    lastCheckTime = Date.now();
    
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
        
    } catch (error) {
        console.error('Error in media detection:', error);
        // Even if error, notify popup that there are no playing elements
        notifyPopupOfMediaElements([]);
    } finally {
        // 重置检查状态
        isCheckingMedia = false;
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
        try {
            chrome.runtime.sendMessage({
                hasPlayingElement: true,
                volume: volume,
                currentDomain: currentDomain
            }, (response) => {
                                 if (chrome.runtime.lastError) {
                     // 静默处理连接错误，避免控制台spam
                     return;
                 }
            });
                 } catch (error) {
             // 静默处理错误
         }
         
         hasNotifiedPopup = true;
         
     } else {
         // No playing elements
         try {
             chrome.runtime.sendMessage({
                 hasPlayingElement: false
             }, (response) => {
                 if (chrome.runtime.lastError) {
                     return;
                 }
             });
         } catch (error) {
             // 静默处理错误
         }
        
        hasNotifiedPopup = false;
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
    
    // **分离关键事件和普通事件，减少不必要的检查**
    const criticalEvents = ['play', 'pause', 'ended']; // 关键播放状态事件
    const normalEvents = ['volumechange', 'loadstart', 'canplay']; // 普通事件
    
         // 关键事件需要立即检查
     criticalEvents.forEach(eventType => {
         element.addEventListener(eventType, (event) => {
             debouncedCheckMedia();
         });
     });
     
     // 普通事件使用更长的延迟
     normalEvents.forEach(eventType => {
         element.addEventListener(eventType, (event) => {
             if (eventType === 'volumechange') {
                 handleVolumeChange(event);
                 // 音量变化时不需要重新检查媒体元素
                 return;
             }
             
             // 对于其他普通事件，使用防抖检查
             setTimeout(() => {
                 debouncedCheckMedia();
             }, 500);
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
            setTimeout(() => {
                debouncedCheckMedia();
            }, 800);
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
    
    // Check media status every 15 seconds (increased from 10 seconds)
    mediaDetectionInterval = setInterval(() => {
        debouncedCheckMedia();
    }, 15000);
}

// Handle page visibility change
function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
        setTimeout(() => {
            debouncedCheckMedia();
        }, 800);
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
        // **New: ping message response, used to check content script status**
        if (message.type === 'ping') {
            sendResponse({status: 'alive', timestamp: Date.now()});
            return true;
        }
        
        // **Key: Original siteVolume message processing logic, enhanced error handling**
        if (message.type === 'siteVolume') {
            let volume = message.volume;
            const mediaElements = document.querySelectorAll('video, audio');

            if (mediaElements.length === 0) {
                sendResponse({success: false, error: 'No media elements found', elementsUpdated: 0});
                return true;
            }

            let successCount = 0;
            for (const element of mediaElements) {
                try {
                    element.volume = volume;
                    successCount++;
                } catch (err) {
                    // 静默处理错误
                }
            }
            
            lastKnownVolume = volume;
            
            // **Send detailed response confirming message processed**
            sendResponse({
                success: successCount > 0, 
                elementsUpdated: successCount,
                totalElements: mediaElements.length,
                volume: volume
            });
            return true; // Keep message channel open
            
        } else if (message.type === 'getAudioStatus') {
            // 使用防抖检查
            debouncedCheckMedia();
            setTimeout(() => {
                const hasAudio = playingElements.size > 0 || 
                                document.querySelectorAll('video, audio').length > 0;
                sendResponse({ hasAudio: hasAudio });
            }, 200);
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
                    // 静默处理错误
                }
            }
            
            lastKnownVolume = volume;
            sendResponse({success: successCount > 0, elementsUpdated: successCount});
            return true;
            
        } else if (message.type === 'forceRecheck') {
            debouncedCheckMedia();
            // Give some time for detection to complete
            setTimeout(() => {
                const mediaElements = document.querySelectorAll('video, audio');
                sendResponse({
                    success: true, 
                    mediaElementsFound: mediaElements.length,
                    playingElements: playingElements.size
                });
            }, 300);
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
    if (checkMediaTimeout) {
        clearTimeout(checkMediaTimeout);
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

