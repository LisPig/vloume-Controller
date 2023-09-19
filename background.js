// background.js
let hasPlayingElement = false;
let currentDomain = ''
chrome.runtime.onMessage.addListener(function (message,sender, sendResponse) {
    if (message.hasPlayingElement) {
        // 如果存在播放元素，则向popup.js发送消息，包括当前域名
        hasPlayingElement == true;
        currentDomain = message.currentDomain
      } else {
        hasPlayingElement == false;
      }
    
    if(message.type === 'siteVolume'){
      const site = message.site;
      const volume = message.volume;
      const tabId = message.tabId;
      chrome.tabs.sendMessage(tabId,{type:'siteVolume',site,volume})
    }
});

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