// content_script.js

// 检查当前页面是否包含播放元素（例如video）
//const hasPlayingElement = document.querySelectorAll("htmlMediaElement") !== null;
/* const hasPlayingElement = false;
// 获取当前页面的域名
const currentDomain = window.location.hostname;

const audios = document.querySelectorAll('audio');
const videos = document.querySelectorAll('video');

if (audios.length > 0 || videos.length > 0) {
  // 存在播放元素
  hasPlayingElement == true
  // 向popup.js发送消息，包括检查结果和当前域名
  chrome.runtime.sendMessage({ hasPlayingElement, currentDomain });
} */
checkMedia();
function checkMedia() {

    const mediaEls = document.querySelectorAll('video, audio');
    let volume;
    if (mediaEls.length > 0) {
      for (let i = 0; i < mediaEls.length; i++) {
        const element = mediaEls[i];
        volume = element.volume;
      }
    
      const currentDomain = window.location.hostname;
      hasPlayingElement = true
      chrome.runtime.sendMessage({
        hasPlayingElement: true,
        volume,
        currentDomain 
      }, function(response) {
        // 处理返回值 
      });
    
    }else{
      chrome.runtime.sendMessage({
        hasPlayingElement: false
      }, function(response) {
        // 处理返回值 
      });
    }
  
}
chrome.runtime.onMessage.addListener(function (message,sender, sendResponse) {
  if(message.type === 'siteVolume'){
    let volume = message.volume;
    const mediaElements = document.querySelectorAll('video, audio');

    for (const element of mediaElements) {

      element.volume=volume;
    
    }
  }
})




