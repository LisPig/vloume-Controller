let currentUrl;
let favicon;
let tabId;
let siteVolume;
const addButton = document.getElementById("addSiteButton");
const siteList = document.getElementById('siteList');
let mediaList = [];

chrome.tabs.query({active: true, currentWindow: true }, function(tabs) {
  tabId = tabs[0].id;
  currentUrl = tabs[0].url;
  favicon = tabs[0].favIconUrl;
  console.log("tabId:" + tabId);
  console.log(currentUrl);
  
  if (/^chrome:\/\/extensions\//.test(currentUrl)) {
    return; 
  } else {
    // **依赖manifest.json中的自动注入，不再手动注入**
    console.log('Popup: Relying on manifest.json content script auto-injection');
    
    // 等待一下让content script自动注入并初始化，然后强制检查
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, {type: 'forceRecheck'}, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Popup: Content script not ready yet, will retry when needed');
        } else {
          console.log('Popup: Content script is ready and media elements checked');
        }
      });
    }, 1500); // 增加等待时间让自动注入完成
  }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("message:" + message.hasPlayingElement);
  if (message.hasPlayingElement) {
    siteVolume = message.volume;
    document.getElementById("siteNameInput").readOnly = false;
    document.getElementById("siteNameInput").value = message.currentDomain;

    addButton.classList.remove("bg-gray-400", "cursor-not-allowed");
    addButton.classList.add("bg-blue-500", "cursor-pointer");
    addButton.disabled = false;
  } else {
    addButton.classList.remove("bg-blue-500", "cursor-pointer");
    addButton.classList.add("bg-gray-400", "cursor-not-allowed");
    addButton.disabled = true;
    document.getElementById("siteNameInput").readOnly = false;
    document.getElementById("siteNameInput").value = "No playing elements";    
  }
});

window.onload = function() {
  loadMediaList();
  setupEventListeners();
}

function loadMediaList() {
  chrome.storage.local.get('mediaList', (result) => {
    let resultMediaList = [...new Set(result.mediaList)];
    mediaList = resultMediaList;
    
    resultMediaList.forEach(item => {
      if (item.url === currentUrl) {
        addButton.classList.remove("bg-blue-500", "cursor-pointer");
        addButton.classList.add("bg-gray-400", "cursor-not-allowed");
        addButton.disabled = true;
      }
      insertItem(item);
    });
  });
}

function setupEventListeners() {
  addButton.addEventListener("click", addSite);
  
  document.getElementById('settingMenu').onclick = function() {
    window.open("option.html");
  }
}

function handleRangeChange(event) {
  const site = event.target.dataset.site;
  const volume = parseFloat(event.target.value);
  
  updateSiteVolume(site, volume);
  
  // **修复关键逻辑：检查当前页面是否匹配调节的网站**
  let currentDomain;
  try {
    currentDomain = new URL(currentUrl).hostname;
  } catch (e) {
    // 如果currentUrl无效，尝试从input框获取
    const inputValue = document.getElementById("siteNameInput").value;
    currentDomain = inputValue;
  }
  
  console.log(`Adjusting volume for ${site}, current domain: ${currentDomain}`);
  
  if (currentDomain === site) {
    // **直接发送消息给content script，不通过background**
    chrome.tabs.sendMessage(tabId, {type: 'siteVolume', site, volume}, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Popup: Error sending siteVolume message directly to content script:', chrome.runtime.lastError.message);
        
        // 如果发送失败，等待一下再重试（content script可能还在初始化）
        console.log('Popup: First attempt failed, waiting and retrying...');
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, {type: 'siteVolume', site, volume}, (retryResponse) => {
            if (chrome.runtime.lastError) {
              console.error('Popup: Retry also failed:', chrome.runtime.lastError.message);
              console.log('Popup: Content script may not be ready. Please try adjusting volume again.');
            } else {
              console.log('Popup: Retry successful - volume applied directly!');
            }
          });
        }, 2000); // 等待2秒再重试
      } else {
        console.log(`Applied volume ${volume} to current page ${site} - direct message successful!`);
      }
    });
  }
}

function updateSiteVolume(site, volume) {
  const item = mediaList.find(item => item.url === site);
  if (item) {
    item.volume = volume;
    const index = mediaList.findIndex(item => item.url === site);
    mediaList.splice(index, 1, item);
    
    // 更新页面显示
    const listItem = siteList.querySelector(`input[data-site="${site}"]`).closest('li');
    const volumeSpan = listItem.querySelector('#volumevalue');
    volumeSpan.textContent = `${Math.round(volume * 100)}%`;
    
    // 保存到本地存储
    chrome.storage.local.set({"mediaList": mediaList});
  }
}

function addSite() {
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
    if (exists) {
      return; 
    }
    mediaList.push(siteInfo);
    chrome.storage.local.set({"mediaList" : mediaList});
    // 调用刷新站点列表的函数
    insertItem(siteInfo);
  });
}

function insertItem(siteInfo) {
  const listItem = document.createElement('li');
  listItem.classList.add('flex', 'items-center', 'justify-between','my-4');

  listItem.innerHTML = `
    <div class="w-8 h-8 flex-none display flex align-items-center justify-content-center">
      <img src="${siteInfo.logo}" class="object-fit cover object-position 50% 50%">
    </div>
    <div class="ml-4 flex-grow">
      <strong class="block mb-1">${siteInfo.url}</strong>
      <input class="w-full" type="range" min="0" max="1" step="0.1" value="${siteInfo.volume}" data-site="${siteInfo.url}"> 
    </div>
    <span id="volumevalue" class="text-right w-10 mt-4">${Math.round(siteInfo.volume * 100)}%</span>
  `;

  siteList.appendChild(listItem);

  // 监听滑动条变化
  const rangeInput = listItem.querySelector('input[type="range"]');
  rangeInput.addEventListener('input', handleRangeChange);
}