window.onload = function() {

    // 获取输入框和当前页面的域名
    const siteNameInput = document.getElementById("siteNameInput");
    const currentSite = window.location.hostname;

    // 检测当前页面是否包含播放元素，这里使用示例条件检测是否存在video元素
    const hasPlayingElement = document.querySelector("video") !== null;

    // 根据条件设置输入框的只读状态和内容
    if (hasPlayingElement) {
        siteNameInput.readOnly = false; // 如果有播放元素，使输入框可编辑
        siteNameInput.value = currentSite; // 将当前域名填入输入框
    } else {
        siteNameInput.readOnly = true; // 如果没有播放元素，使输入框只读
        siteNameInput.value = "No playing elements"; // 或者设置其他提示信息
    }

    // 示例数据
    const siteVolumes = {
      'YouTube': 0.5, 
      'Twitter': 0.8,
      'Bilibili': 0.6
    };
  
    // 获取 DOM 元素
    const siteList = document.getElementById('siteList');
  
    // 创建网站音量设置列表
    for (const site in siteVolumes) {
  
      const volume = siteVolumes[site];
  
      const listItem = document.createElement('li');
      listItem.classList.add('flex', 'items-center', 'justify-between','my-4');
  
      listItem.innerHTML = `
        <div class="w-10 h-10 bg-blue-500 rounded-full"></div>
        <div class="ml-4 flex-grow">
          <strong class="block mb-1">${site}</strong>
          <input class="w-full" type="range" min="0" max="1" step="0.1" value="${volume}"> 
        </div>
        <span id="volumevalue" class="text-right w-10 mt-4">${volume * 100}%</span>
      `;
  
      siteList.appendChild(listItem);
  
      // 监听滑动条变化
      const rangeInput = listItem.querySelector('input[type="range"]');
      rangeInput.addEventListener('input', handleRangeChange);
  
    }
  
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
  
  }