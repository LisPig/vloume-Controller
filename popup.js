let currentUrl;
let favicon;
let tabId;
chrome.tabs.query({active: true,currentWindow: true }, function(tabs) {
  tabId = tabs[0].id;
  console.log("tabId:"+tabId)
  currentUrl = tabs[0].url;
  favicon = tabs[0].favIconUrl;
  /* console.log("Current tab URL: " + url); 
  console.log("Current tab favicon: " + favicon); */
  console.log(currentUrl)
  if (/^chrome:\/\/extensions\//.test(currentUrl)) {
    
    /* const text = document.createElement('div');
    text.textContent = 'The current page has no operation permission';
    document.body.appendChild(text);  */
    return; 
  }else{
    // 使用tabId执行内容脚本
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content_script.js'] 
    }); 
  }
});

// 监听来自background.js的消息
let siteVolume;
const addButton = document.getElementById("addSiteButton");
//chrome.runtime.connect();
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("message:"+message.hasPlayingElement);
  if (message.hasPlayingElement) {
    siteVolume = message.volume;
    // 如果存在播放元素，将输入框设置为可编辑，并填入当前域名
    document.getElementById("siteNameInput").readOnly = false;
    document.getElementById("siteNameInput").value = message.currentDomain;

    addButton.classList.remove("bg-gray-400", "cursor-not-allowed");
    addButton.classList.add("bg-blue-500", "cursor-pointer");
    addButton.disabled = false;
  } else {
    addButton.classList.remove("bg-blue-500", "cursor-pointer");
    addButton.classList.add("bg-gray-400", "cursor-not-allowed");
    addButton.disabled = true;
    // 如果没有播放元素，将输入框设置为只读，并添加提示文本
    document.getElementById("siteNameInput").readOnly = false;
    document.getElementById("siteNameInput").value = "No playing elements";    
  }
});


window.onload = function() {
  const addButton = document.getElementById("addSiteButton");
  // 获取 DOM 元素
  const siteList = document.getElementById('siteList');
  let mediaList = [];
  
    
    chrome.storage.local.get('mediaList', (result) => {
      let resultMediaList =  [...new Set(result.mediaList)];
      mediaList = resultMediaList;
      // 创建网站音量设置列表
      for (let i=0; i<resultMediaList.length;i++) {
        console.log("result:"+resultMediaList[i])
        //const volume = siteVolumes[site];
        // 如果已经存在站点信息并且站点URL匹配，禁用"Add"按钮
        if (resultMediaList[i].url === currentUrl) {
          addButton.classList.remove("bg-blue-500", "cursor-pointer");
          addButton.classList.add("bg-gray-400", "cursor-not-allowed");
          addButton.disabled = true;
        }
    
        const listItem = document.createElement('li');
        listItem.classList.add('flex', 'items-center', 'justify-between','my-4');
    
        listItem.innerHTML = `
          <div class="w-8 h-8 flex-none display flex align-items-center justify-content-center">
            <img  src="${resultMediaList[i].logo}" class="object-fit cover object-position 50% 50%"></img>
          </div>
          <div class="ml-4 flex-grow">
            <strong class="block mb-1">${resultMediaList[i].url}</strong>
            <input class="w-full" type="range" min="0" max="1" step="0.1" value="${resultMediaList[i].volume}" data-site="${resultMediaList[i].url}"> 
          </div>
          <span id="volumevalue" class="text-right w-10 mt-4">${parseInt(resultMediaList[i].volume * 100)}%</span>
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
        // 找到对应的列表项
        const item = mediaList.find(item => item.url === site);
        item.volume = volume;
        // 获得更新项的索引
        const index = mediaList.findIndex(item => item.url === site);
        // 用新项替换旧项
        mediaList.splice(index, 1, item);
      
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
        chrome.storage.local.set({
          "mediaList": mediaList
        });
      
        // 降低音量
        //如果当前站点对应调节的站点，那就进行通信同步音量
        if(document.getElementById("siteNameInput").value === site){
          chrome.runtime.sendMessage({type:'siteVolume',tabId, site,volume});
        }
        
    }

    // 监听"Add"按钮的点击事件
  document.getElementById("addSiteButton").addEventListener("click", function() {
      let mediaList = [];
      let currentUrl = document.getElementById("siteNameInput").value;
      const siteInfo = {
        url: currentUrl,
        logo: favicon,
        volume: siteVolume,
      };
      chrome.storage.local.get('mediaList', (result) => {

        let resultMediaList = result.mediaList || [];
        mediaList = Array.from(resultMediaList);
         // 检查是否存在
        const exists = mediaList.some(item => item.url === currentUrl);
        // 如果已存在,不再添加
        if(exists) {
          return; 
        }
        mediaList.push(siteInfo);
        chrome.storage.local.set({"mediaList" : mediaList});
        // 调用刷新站点列表的函数
        insertItem(siteInfo);
      })
       
    })

    // 插入单个列表项 
    function insertItem(siteInfo) {

      const listItem = document.createElement('li');
        listItem.classList.add('flex', 'items-center', 'justify-between','my-4');
    
        listItem.innerHTML = `
          <div class="w-8 h-8 flex-none  display flex align-items-center justify-content-center">
          <img  src="${siteInfo.logo}" class="object-fit cover object-position 50% 50%"></img>
          </div>
          <div class="ml-4 flex-grow">
            <strong class="block mb-1">${siteInfo.url}</strong>
            <input class="w-full" type="range" min="0" max="1" step="0.1" value="${siteInfo.volume}"> 
          </div>
          <span id="volumevalue" class="text-right w-10 mt-4">${siteInfo.volume * 100}%</span>
        `;
    
        siteList.appendChild(listItem);
    }

    let settingMenu = document.getElementById("settingMenu");
    settingMenu.onclick = function(){
      window.open("option.html")
    }
  }