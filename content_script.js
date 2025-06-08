// content_script.js

// 全局变量
let mediaObserver = null;
let playingElements = new Set();
let mediaDetectionInterval = null;
let lastKnownVolume = 1.0;
let hasNotifiedPopup = false; // 防止重复通知

// 初始化
initialize();

function initialize() {
    console.log('Content script initialized');
    
    // 等待DOM完全加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setupMediaDetection();
        });
    } else {
        setupMediaDetection();
    }
    
    // 设置linkage功能
    linkage();
}

// 设置全面的媒体检测
function setupMediaDetection() {
    // 1. 初始检测
    checkMedia();
    
    // 2. 设置DOM变化观察者
    setupMutationObserver();
    
    // 3. 设置定期检测
    startPeriodicCheck();
    
    // 4. 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 5. 监听页面focus/blur事件
    window.addEventListener('focus', checkMedia);
    window.addEventListener('blur', checkMedia);
}

// 主要的媒体元素检测函数 - 保持原有逻辑，但增强检测能力
function checkMedia() {
    console.log('Starting comprehensive media detection...');
    
    try {
        // 1. 检测直接的audio和video元素
        const directMediaElements = detectDirectMediaElements();
        
        // 2. 检测iframe中的媒体元素
        const iframeMediaElements = detectIframeMediaElements();
        
        // 3. 检测其他音频源
        const otherAudioSources = detectOtherAudioSources();
        
        // 合并所有检测到的元素
        const allDetectedElements = [
            ...directMediaElements,
            ...iframeMediaElements,
            ...otherAudioSources
        ];
        
        // 更新播放元素集合
        updatePlayingElements(allDetectedElements);
        
        // **关键：按照原有逻辑通知popup**
        notifyPopupOfMediaElements(allDetectedElements);
        
        console.log(`Media detection completed. Found ${allDetectedElements.length} total elements, ${playingElements.size} playing`);
        
    } catch (error) {
        console.error('Error in media detection:', error);
        // 即使出错也要通知popup没有播放元素
        notifyPopupOfMediaElements([]);
    }
}

// 按照原有逻辑通知popup
function notifyPopupOfMediaElements(elements) {
    const currentDomain = window.location.hostname;
    
    // 筛选出真正的媒体元素（audio/video）
    const realMediaElements = elements.filter(el => 
        el.type === 'audio' || el.type === 'video'
    );
    
    if (realMediaElements.length > 0) {
        // 获取第一个有效元素的音量
        let volume = 1.0;
        const firstPlayingElement = realMediaElements.find(el => el.volume !== undefined);
        if (firstPlayingElement) {
            volume = firstPlayingElement.volume;
            lastKnownVolume = volume;
        }
        
        // **按照原有格式发送消息给background，然后转发给popup**
        chrome.runtime.sendMessage({
            hasPlayingElement: true,
            volume: volume,
            currentDomain: currentDomain
        });
        
        hasNotifiedPopup = true;
        console.log(`Notified popup: has playing elements on ${currentDomain}, volume: ${volume}`);
        
    } else {
        // 没有播放元素
        chrome.runtime.sendMessage({
            hasPlayingElement: false
        });
        
        hasNotifiedPopup = false;
        console.log('Notified popup: no playing elements');
    }
}

// 检测直接的媒体元素
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
            
            // 添加事件监听器
            setupElementEventListeners(element);
            
            elements.push(elementInfo);
            
        } catch (error) {
            console.warn('Error processing media element:', error);
        }
    });
    
    return elements;
}

// 检测iframe中的媒体元素
function detectIframeMediaElements() {
    const elements = [];
    const iframes = document.querySelectorAll('iframe');
    
    iframes.forEach((iframe, index) => {
        try {
            // 检查iframe是否可访问（同源策略限制）
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
            // iframe跨域访问限制，这是正常情况
            console.debug('Cannot access iframe content (cross-origin):', error.message);
        }
    });
    
    return elements;
}

// 检测其他音频源
function detectOtherAudioSources() {
    const elements = [];
    
    try {
        // 1. 检测嵌入的Flash播放器
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
        
        // 2. 检测Web Audio API使用的迹象
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

// 设置元素事件监听器
function setupElementEventListeners(element) {
    // 防止重复添加监听器
    if (element.dataset.volumeControllerListeners) {
        return;
    }
    
    element.dataset.volumeControllerListeners = 'true';
    
    const events = ['play', 'pause', 'ended', 'volumechange', 'loadstart', 'canplay'];
    
    events.forEach(eventType => {
        element.addEventListener(eventType, (event) => {
            console.log(`Media event: ${eventType}`, element);
            
            // 延迟检测以确保状态更新，重新通知popup
            setTimeout(() => {
                checkMedia();
                
                if (eventType === 'volumechange') {
                    handleVolumeChange(event);
                }
            }, 100);
        });
    });
}

// 设置DOM变化观察者
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

// 开始定期检查
function startPeriodicCheck() {
    if (mediaDetectionInterval) {
        clearInterval(mediaDetectionInterval);
    }
    
    // 每10秒检查一次媒体状态（降低频率以减少性能影响）
    mediaDetectionInterval = setInterval(() => {
        checkMedia();
    }, 10000);
}

// 处理页面可见性变化
function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
        console.log('Page became visible, checking media');
        setTimeout(checkMedia, 500);
    }
}

// 更新播放元素集合
function updatePlayingElements(elements) {
    playingElements.clear();
    elements.forEach(el => {
        if (el.isPlaying) {
            playingElements.add(el);
        }
    });
}

// linkage函数：为当前网站应用已保存的音量设置
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

// **保持原有的消息监听逻辑**
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    try {
        // **关键：原有的siteVolume消息处理逻辑**
        if (message.type === 'siteVolume') {
            let volume = message.volume;
            const mediaElements = document.querySelectorAll('video, audio');

            console.log(`Content script received siteVolume message: volume=${volume}, elements found=${mediaElements.length}`);

            for (const element of mediaElements) {
                element.volume = volume;
                console.log(`Set volume ${volume} on element:`, element.tagName, element.src || element.currentSrc);
            }
            
            lastKnownVolume = volume;
            console.log(`Applied volume ${volume} from popup list control`);
            
            // **发送响应确认消息已处理**
            sendResponse({success: true, elementsUpdated: mediaElements.length});
            return true; // 保持消息通道开放
            
        } else if (message.type === 'getAudioStatus') {
            // 立即检测并响应
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
            
            for (const element of mediaElements) {
                element.volume = volume;
            }
            
            lastKnownVolume = volume;
            console.log(`Volume set to ${volume}`);
            
        } else if (message.type === 'forceRecheck') {
            checkMedia();
        }
    } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({ error: error.message });
    }
});

// **保持原有的音量变化处理逻辑**
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

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    if (mediaObserver) {
        mediaObserver.disconnect();
    }
    if (mediaDetectionInterval) {
        clearInterval(mediaDetectionInterval);
    }
});

// **保持向后兼容的函数**
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

