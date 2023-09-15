let url;
let favicon;

chrome.tabs.query({active: true,currentWindow: true }, function(tabs) {
  var tabId = tabs[0].id;
  console.log("tabId:"+tabId)
  url = tabs[0].url;
  favicon = tabs[0].favIconUrl;
  /* console.log("Current tab URL: " + url); 
  console.log("Current tab favicon: " + favicon); */
  // 使用tabId执行内容脚本
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['content_script.js'] 
  }); 
});

// 监听来自background.js的消息
let siteVolume;
//chrome.runtime.connect();
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("message:"+message.hasPlayingElement);
  if (message.hasPlayingElement) {
    siteVolume = message.volume;
    // 如果存在播放元素，将输入框设置为可编辑，并填入当前域名
    document.getElementById("siteNameInput").readOnly = false;
    document.getElementById("siteNameInput").value = message.currentDomain;
  } else {
    // 如果没有播放元素，将输入框设置为只读，并添加提示文本
    document.getElementById("siteNameInput").readOnly = true;
    document.getElementById("siteNameInput").value = "No playing elements";
  }
});


window.onload = function() {
  // 注册消息监听器
  
    // 示例数据
    /* const siteVolumes = {
      'YouTube': 0.5, 
      'Twitter': 0.8,
      'Bilibili': 0.6
    }; */
  
    // 获取 DOM 元素
    const siteList = document.getElementById('siteList');
    chrome.storage.local.get('mediaList', (result) => {
      let resultMediaList = result.mediaList;
      
      // 创建网站音量设置列表
      for (let i=0; i<resultMediaList.length;i++) {
        console.log("result:"+resultMediaList[i])
        //const volume = siteVolumes[site];
    
        const listItem = document.createElement('li');
        listItem.classList.add('flex', 'items-center', 'justify-between','my-4');
    
        listItem.innerHTML = `
          <img class="w-10 h-10 bg-white-500 rounded-lg" src="${resultMediaList[i].logo}"></img>
          <div class="ml-4 flex-grow">
            <strong class="block mb-1">${resultMediaList[i].url}</strong>
            <input class="w-full" type="range" min="0" max="1" step="0.1" value="${resultMediaList[i].volume}"> 
          </div>
          <span id="volumevalue" class="text-right w-10 mt-4">${resultMediaList[i].volume * 100}%</span>
        `;
    
        siteList.appendChild(listItem);
    
        // 监听滑动条变化
        const rangeInput = listItem.querySelector('input[type="range"]');
        rangeInput.addEventListener('input', handleRangeChange);
    
      }
    })
  
    
  
    // 处理滑动条变化
    function handleRangeChange(event) {

        // 获取数据
        const site = event.target.dataset.site;
        const volume = parseFloat(event.target.value);
      
        // 更新示例数据
        siteVolumes[site] = volume;
      
        // 更新页面显示
        const volumePercentage = volume * 100;
        // 通过父元素查找 span
        const rangeInput = event.target;
        const inputParent = rangeInput.parentNode; 
        // 输入框父元素的下一个兄弟元素
        const textSpan = inputParent.nextElementSibling;
        // 更新文本内容
        textSpan.textContent = `${volumePercentage}%`;
      
        // 保存到本地存储
        browser.storage.local.set({
          [site]: volume
        });
      
        // 降低音量
        browser.tabs.query({active: true, currentWindow: true}, tabs => {
          browser.tabs.sendMessage(tabs[0].id, {
            site, 
            volume 
          });
        });
      
    }

    // 监听"Add"按钮的点击事件
  document.getElementById("addSiteButton").addEventListener("click", function() {
      let mediaList = [];
      let url = document.getElementById("siteNameInput").value;
      const siteInfo = {
        url: url,
        logo: favicon,
        volume: siteVolume,
      };
      chrome.storage.local.get('mediaList', (result) => {

        let resultMediaList = result.mediaList || [];
        mediaList = Array.from(resultMediaList);
        mediaList.push(siteInfo);
        chrome.storage.local.set({"mediaList" : mediaList});
      })
    })

  
  }