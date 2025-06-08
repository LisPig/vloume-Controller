// background.js
// background.js
let hasPlayingElement = false;
let currentDomain = '';
let audioContext = null;
let gainNode = null;
chrome.runtime.onInstalled.addListener(function() {
  console.log("Extension installed");

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabCapture.capture({audio: true, video: false}, function(stream) {
          if (chrome.runtime.lastError || !stream) {
              console.error('Error capturing tab: ' + chrome.runtime.lastError.message);
              return;
          }
          console.log('Tab capture started successfully');
      });
  });
});

// 检查 chrome.tabCapture 是否可用
if (chrome && chrome.tabCapture && typeof chrome.tabCapture.capture === 'function') {
  console.log('tabCapture API is available.');

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.hasPlayingElement) {
      // 如果存在播放元素，则向popup.js发送消息，包括当前域名
      hasPlayingElement = true;
      currentDomain = message.currentDomain;
    } else {
      hasPlayingElement = false;
    }

    if (message.type === 'siteVolume') {
      const { site, volume, tabId } = message;
      console.log(`Background: Forwarding siteVolume message - site: ${site}, volume: ${volume}, tabId: ${tabId}`);
      
      // 直接发送到content script，让popup处理重试逻辑
      chrome.tabs.sendMessage(tabId, { type: 'siteVolume', site, volume }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Background: Error sending message to content script:', chrome.runtime.lastError.message);
          // 通知popup发送失败
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          console.log('Background: Successfully sent siteVolume message to content script');
          sendResponse({ success: true });
        }
      });
      return true; // 保持消息通道开放以发送响应
    }

    if (message.type === 'checkForAudio') {
      chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          sendResponse({ hasAudio: true });
        } else {
          sendResponse({ hasAudio: false });
        }
      });
      return true; // 保持消息通道开放
    }
  });

  chrome.action.onClicked.addListener((tab) => {
    if (!audioContext) {
      chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
        if (stream) {
          audioContext = new AudioContext();
          const source = audioContext.createMediaStreamSource(stream);
          gainNode = audioContext.createGain();
          source.connect(gainNode);
          gainNode.connect(audioContext.destination);
        }
      });
    }
  });
} else {
  console.error('tabCapture API is not available.');
}

/* chrome.runtime.onConnect.addListener(function (message,sender, sendResponse) {
    if (message.hasPlayingElement) {
      // 如果存在播放元素，则向popup.js发送消息，包括当前域名
      chrome.runtime.sendMessage({ hasPlayingElement: true, currentDomain: currentDomain });
      //chrome.runtime.sendMessage({message: "hello world"});
    } else {
      // 如果没有播放元素，则向popup.js发送消息，标记为没有播放元素
      chrome.runtime.sendMessage({ hasPlayingElement: false });
      //chrome.runtime.sendMessage({message: "hello world"});
    }
}); */