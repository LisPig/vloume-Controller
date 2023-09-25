// content_script.js

// 检查当前页面是否包含播放元素（例如video）


checkMedia();
linkage();
function checkMedia() {
    const mediaEls = document.querySelectorAll('video, audio');
    const vedio = document.querySelector('video');
    let volume;
    if (mediaEls.length > 0) {
      for (let i = 0; i < mediaEls.length; i++) {
        const element = mediaEls[i];
        volume = element.volume;
        mediaEls[i].addEventListener('volumechange', handleVolumeChange);
      }

      const currentDomain = window.location.hostname;
      hasPlayingElement = true
      chrome.runtime.sendMessage({
        hasPlayingElement: true,
        volume,
        currentDomain 
      });
    
    }else{
      chrome.runtime.sendMessage({
        hasPlayingElement: false
      });
    }
  
}

function linkage(){
  const mediaElements = document.querySelectorAll('video, audio');
  const currentDomain = window.location.hostname;
  if(mediaElements.length > 0){
    chrome.storage.local.get('mediaList', (result) => {
      let mediaList =  [...new Set(result.mediaList)];

      const item = mediaList.find(item => item.url === currentDomain);
      for (const element of mediaElements) {

        element.volume=item.volume;
      
      }
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
//监测页面音量更改
function handleVolumeChange(event) {
  const site = window.location.hostname;
  // 获取元素和新音量
  const el = event.target;
  const newVolume = el.volume;

  chrome.storage.local.get('mediaList', (result) => {
    let mediaList =  [...new Set(result.mediaList)];

    const item = mediaList.find(item => item.url === site);
    item.volume = newVolume;
    // 获得更新项的索引
    const index = mediaList.findIndex(item => item.url === site);
    // 用新项替换旧项
    mediaList.splice(index, 1, item);
    chrome.storage.local.set({
      "mediaList": mediaList
    });
  })

  

}



