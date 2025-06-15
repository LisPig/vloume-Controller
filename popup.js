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
    // **改进的content script就绪检测机制**
    console.log('Popup: Checking content script readiness...');
    checkContentScriptReadiness();
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

// **新增：获取干净的logo**
async function getCleanFavicon(domain, fallbackUrl) {
  // 优先级策略：根域favicon -> Google服务 -> 原始favicon -> 默认图标
  const faviconSources = [
    `https://${domain}/favicon.ico`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
    `https://favicon.yandex.net/favicon/${domain}`,
    fallbackUrl || `https://${domain}/favicon.ico`
  ];
  
  for (const faviconUrl of faviconSources) {
    try {
      const base64Logo = await convertImageToBase64(faviconUrl);
      if (base64Logo && base64Logo !== 'data:,') {
        return base64Logo;
      }
    } catch (error) {
      console.debug(`Failed to load favicon from ${faviconUrl}:`, error);
      continue;
    }
  }
  
  // 如果所有方法都失败，返回默认图标
  return getDefaultFavicon();
}

// **新增：将图片URL转换为base64**
function convertImageToBase64(imageUrl) {
  return new Promise((resolve, reject) => {
    // 创建一个Image对象
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 处理跨域问题
    
    img.onload = function() {
      try {
        // 创建canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置canvas尺寸（统一为32x32以优化存储）
        canvas.width = 32;
        canvas.height = 32;
        
        // 绘制图片到canvas
        ctx.drawImage(img, 0, 0, 32, 32);
        
        // 转换为base64
        const base64 = canvas.toDataURL('image/png');
        resolve(base64);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = function() {
      reject(new Error('Failed to load image'));
    };
    
    // 设置超时
    setTimeout(() => {
      reject(new Error('Image load timeout'));
    }, 5000);
    
    img.src = imageUrl;
  });
}

// **新增：获取默认图标**
function getDefaultFavicon() {
  // 创建一个简单的默认图标（32x32像素的灰色圆形）
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  // 绘制默认图标
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(0, 0, 32, 32);
  ctx.fillStyle = '#6b7280';
  ctx.beginPath();
  ctx.arc(16, 16, 12, 0, 2 * Math.PI);
  ctx.fill();
  
  // 添加简单的音符图标
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('♪', 16, 16);
  
  return canvas.toDataURL('image/png');
}

// **新增：从URL提取域名**
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, ''); // 移除www前缀
  } catch (error) {
    // 如果URL解析失败，尝试从字符串中提取
    const match = url.match(/^https?:\/\/(?:www\.)?([^\/]+)/);
    return match ? match[1] : url;
  }
}

// **新增：获取干净的logo**
async function getCleanFavicon(domain, fallbackUrl) {
  // 优先级策略：根域favicon -> Google服务 -> 原始favicon -> 默认图标
  const faviconSources = [
    `https://${domain}/favicon.ico`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
    `https://favicon.yandex.net/favicon/${domain}`,
    fallbackUrl || `https://${domain}/favicon.ico`
  ];
  
  for (const faviconUrl of faviconSources) {
    try {
      const base64Logo = await convertImageToBase64(faviconUrl);
      if (base64Logo && base64Logo !== 'data:,') {
        return base64Logo;
      }
    } catch (error) {
      console.debug(`Failed to load favicon from ${faviconUrl}:`, error);
      continue;
    }
  }
  
  // 如果所有方法都失败，返回默认图标
  return getDefaultFavicon();
}

// **新增：将图片URL转换为base64**
function convertImageToBase64(imageUrl) {
  return new Promise((resolve, reject) => {
    // 创建一个Image对象
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 处理跨域问题
    
    img.onload = function() {
      try {
        // 创建canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置canvas尺寸（统一为32x32以优化存储）
        canvas.width = 32;
        canvas.height = 32;
        
        // 绘制图片到canvas
        ctx.drawImage(img, 0, 0, 32, 32);
        
        // 转换为base64
        const base64 = canvas.toDataURL('image/png');
        resolve(base64);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = function() {
      reject(new Error('Failed to load image'));
    };
    
    // 设置超时
    setTimeout(() => {
      reject(new Error('Image load timeout'));
    }, 5000);
    
    img.src = imageUrl;
  });
}

// **新增：获取默认图标**
function getDefaultFavicon() {
  // 创建一个简单的默认图标（32x32像素的灰色圆形）
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  // 绘制默认图标
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(0, 0, 32, 32);
  ctx.fillStyle = '#6b7280';
  ctx.beginPath();
  ctx.arc(16, 16, 12, 0, 2 * Math.PI);
  ctx.fill();
  
  // 添加简单的音符图标
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('♪', 16, 16);
  
  return canvas.toDataURL('image/png');
}

// **新增：从URL提取域名**
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, ''); // 移除www前缀
  } catch (error) {
    // 如果URL解析失败，尝试从字符串中提取
    const match = url.match(/^https?:\/\/(?:www\.)?([^\/]+)/);
    return match ? match[1] : url;
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
    // **使用增强的消息发送机制**
    sendVolumeChangeWithRetry(site, volume, 0);
  }
}

// **新增：增强的消息发送机制，带有智能重试**
function sendVolumeChangeWithRetry(site, volume, retryCount = 0) {
  const maxRetries = 5;
  const baseDelay = 200; // 基础延迟200ms
  
  // 计算指数退避延迟：200ms, 400ms, 800ms, 1600ms, 3200ms
  const delay = baseDelay * Math.pow(2, retryCount);
  
  console.log(`Attempt ${retryCount + 1}/${maxRetries + 1} to send volume message - site: ${site}, volume: ${volume}`);
  
  // 先尝试直接发送消息到content script
  chrome.tabs.sendMessage(tabId, {type: 'siteVolume', site, volume}, (response) => {
    if (chrome.runtime.lastError) {
      console.warn(`Direct message attempt ${retryCount + 1} failed:`, chrome.runtime.lastError.message);
      
      if (retryCount < maxRetries) {
        console.log(`Retrying in ${delay}ms...`);
        setTimeout(() => {
          sendVolumeChangeWithRetry(site, volume, retryCount + 1);
        }, delay);
      } else {
        // 所有直接重试都失败了，尝试通过content script重新注入的方式
        console.warn('All direct attempts failed, trying alternative approach...');
        tryAlternativeVolumeApplication(site, volume);
      }
    } else {
      console.log(`✓ Volume ${volume} successfully applied to ${site} on attempt ${retryCount + 1}`);
      // 可选：显示成功反馈给用户
      showVolumeAppliedFeedback(site, volume);
    }
  });
}

// **新增：替代方案 - 通过background script重新检查content script状态**
function tryAlternativeVolumeApplication(site, volume) {
  console.log('Trying alternative volume application method...');
  
  // 1. 先通知content script强制重新检查媒体元素
  chrome.tabs.sendMessage(tabId, {type: 'forceRecheck'}, (response) => {
    if (chrome.runtime.lastError) {
      console.warn('Force recheck also failed, trying script injection approach...');
      // 2. 如果还是失败，尝试重新检查content script是否存在
      tryScriptReinjection(site, volume);
    } else {
      // 3. 重新检查成功后，再次尝试发送音量消息
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, {type: 'siteVolume', site, volume}, (finalResponse) => {
          if (chrome.runtime.lastError) {
            console.error('Final attempt also failed:', chrome.runtime.lastError.message);
            showVolumeErrorFeedback(site);
          } else {
            console.log(`✓ Volume ${volume} applied to ${site} via alternative method`);
            showVolumeAppliedFeedback(site, volume);
          }
        });
      }, 1000);
    }
  });
}

// **新增：脚本重新检查和注入确认**
function tryScriptReinjection(site, volume) {
  console.log('Checking if content script needs reconfirmation...');
  
  // 发送一个简单的ping消息来检查content script状态
  chrome.tabs.sendMessage(tabId, {type: 'ping'}, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Content script appears to be missing, user may need to refresh the page');
      showScriptMissingError();
    } else {
      // content script存在但之前的消息失败了，再试一次
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, {type: 'siteVolume', site, volume}, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Even after script confirmation, volume setting failed');
            showVolumeErrorFeedback(site);
          } else {
            console.log(`✓ Volume ${volume} applied to ${site} after script reconfirmation`);
            showVolumeAppliedFeedback(site, volume);
          }
        });
      }, 500);
    }
  });
}

// **新增：用户反馈函数**
function showVolumeAppliedFeedback(site, volume) {
  // 可以在这里添加视觉反馈，比如短暂的绿色边框或成功图标
  const listItem = siteList.querySelector(`input[data-site="${site}"]`).closest('li');
  if (listItem) {
    listItem.style.borderLeft = '3px solid #10b981'; // 绿色边框表示成功
    setTimeout(() => {
      listItem.style.borderLeft = '';
    }, 2000);
  }
}

function showVolumeErrorFeedback(site) {
  // 红色边框表示失败
  const listItem = siteList.querySelector(`input[data-site="${site}"]`).closest('li');
  if (listItem) {
    listItem.style.borderLeft = '3px solid #ef4444'; // 红色边框表示失败
    setTimeout(() => {
      listItem.style.borderLeft = '';
    }, 3000);
  }
  console.warn(`Volume adjustment for ${site} failed. Page may need to be refreshed.`);
}

function showScriptMissingError() {
  // 显示更明显的错误提示
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed; top: 10px; left: 10px; right: 10px;
    background: #fee2e2; border: 1px solid #fca5a5; color: #b91c1c;
    padding: 8px; border-radius: 4px; font-size: 12px; z-index: 1000;
  `;
  errorDiv.textContent = 'Content script not responding. Please refresh the page and try again.';
  document.body.appendChild(errorDiv);
  
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 5000);
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

// **修改：优化addSite函数，添加logo获取和转换**
async function addSite() {
  let currentUrl = document.getElementById("siteNameInput").value;
  const domain = extractDomain(currentUrl);
  
  // 显示加载状态
  const originalButtonText = addButton.textContent;
  addButton.textContent = 'Adding...';
  addButton.disabled = true;
  
  try {
    // **获取干净的base64 logo**
    const base64Logo = await getCleanFavicon(domain, favicon);
    
    const siteInfo = {
      url: currentUrl,
      logo: base64Logo, // 使用base64格式的logo
      volume: siteVolume,
    };
    
    chrome.storage.local.get('mediaList', (result) => {
      let resultMediaList = result.mediaList || [];
      mediaList = Array.from(resultMediaList);
      
      // 检查是否存在
      const exists = mediaList.some(item => item.url === currentUrl);
      // 如果已存在,不再添加
      if (exists) {
        addButton.textContent = originalButtonText;
        return; 
      }
      
      mediaList.push(siteInfo);
      chrome.storage.local.set({"mediaList" : mediaList});
      // 调用刷新站点列表的函数
      insertItem(siteInfo);
      
      // 恢复按钮状态
      addButton.textContent = originalButtonText;
    });
    
  } catch (error) {
    console.error('Error adding site:', error);
    // 发生错误时使用默认图标
    const siteInfo = {
      url: currentUrl,
      logo: getDefaultFavicon(),
      volume: siteVolume,
    };
    
    chrome.storage.local.get('mediaList', (result) => {
      let resultMediaList = result.mediaList || [];
      mediaList = Array.from(resultMediaList);
      
      const exists = mediaList.some(item => item.url === currentUrl);
      if (!exists) {
        mediaList.push(siteInfo);
        chrome.storage.local.set({"mediaList" : mediaList});
        insertItem(siteInfo);
      }
      
      addButton.textContent = originalButtonText;
    });
  }
}

// **修改：优化insertItem函数，直接使用base64图片**
function insertItem(siteInfo) {
  const listItem = document.createElement('li');
  listItem.classList.add('flex', 'items-center', 'justify-between','my-4');

  // **使用base64图片，添加错误处理**
  const logoSrc = siteInfo.logo || getDefaultFavicon();
  
  listItem.innerHTML = `
    <div class="w-8 h-8 flex-none display flex align-items-center justify-content-center">
      <img src="${logoSrc}" 
           class="w-full h-full object-cover rounded" 
           onerror="this.src='${getDefaultFavicon()}'"
           alt="Site logo">
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

// **新增：智能的content script就绪检测**
function checkContentScriptReadiness(attempt = 1) {
  const maxAttempts = 10;
  const baseDelay = 300; // 基础延迟300ms
  
  console.log(`Checking content script readiness - attempt ${attempt}/${maxAttempts}`);
  
  chrome.tabs.sendMessage(tabId, {type: 'ping'}, (response) => {
    if (chrome.runtime.lastError) {
      if (attempt < maxAttempts) {
        console.log(`Content script not ready yet, retrying in ${baseDelay * attempt}ms...`);
        setTimeout(() => {
          checkContentScriptReadiness(attempt + 1);
        }, baseDelay * attempt); // 逐渐增加延迟
      } else {
        console.warn('Content script failed to initialize after maximum attempts');
        // 显示警告但不阻止用户使用
        showInitializationWarning();
      }
    } else {
      console.log('✓ Content script is ready and responsive');
      // Content script准备就绪，现在进行强制检查
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, {type: 'forceRecheck'}, (recheckResponse) => {
          if (chrome.runtime.lastError) {
            console.warn('Force recheck failed, but content script is responsive');
          } else {
            console.log('✓ Media elements recheck completed successfully');
          }
        });
      }, 200);
    }
  });
}

// **新增：初始化警告显示**
function showInitializationWarning() {
  const warningDiv = document.createElement('div');
  warningDiv.style.cssText = `
    background: #fef3c7; border: 1px solid #f59e0b; color: #92400e;
    padding: 8px; margin: 10px; border-radius: 4px; font-size: 12px;
    text-align: center;
  `;
  warningDiv.innerHTML = `
    <strong>Notice:</strong> Content script initialization is slow<br>
    <small>If volume control doesn't respond, please refresh the page and try again</small>
  `;
  
  // 插入到popup的顶部
  const popup = document.body;
  if (popup.firstChild) {
    popup.insertBefore(warningDiv, popup.firstChild);
  } else {
    popup.appendChild(warningDiv);
  }
  
  // 10秒后自动移除警告
  setTimeout(() => {
    if (warningDiv.parentNode) {
      warningDiv.parentNode.removeChild(warningDiv);
    }
  }, 10000);
}