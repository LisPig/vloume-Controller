window.onload = function(){
    // 获取所有的菜单项元素 
    let menus = document.querySelectorAll('#app   > div:nth-child(1) > ul > li'); 
    // 遍历所有的菜单项元素，绑定一个click事件，调用select函数，传入当前元素 
    for (let menu of menus) { 
        menu.addEventListener('click', function () { 
            select(this); 
        }); 
    } 
    // 定义一个函数，用于切换菜单栏和内容框 
    let mediaList = [];
    const siteList = document.getElementById('siteList');
    function select(element) {
         // 获取当前点击的菜单项的data-id属性，即对应的内容框的id 
         let id = element.dataset.id; 
         // 获取所有的内容框元素 
         let contents = document.querySelectorAll('#app  > div:nth-child(2) > div'); 
         
         // 遍历所有的内容框元素，如果id匹配，则显示，否则隐藏 
         for (let content of contents) { 
            if (content.id === id) { 
                content.classList.remove('hidden'); 
                
                if(content.id === "option1"){
                    document.getElementById('siteList').innerHTML = '';
                    build();
                }
            } else { 
                content.classList.add('hidden'); 
            } 
         } 
    }
    
    function build(){
        chrome.storage.local.get('mediaList', (result) => {
            let resultMediaList =  [...new Set(result.mediaList)];
            mediaList = resultMediaList;
            for (let i=0; i<resultMediaList.length;i++) {
                const listItem = document.createElement('li');
                listItem.classList.add('flex', 'items-center', 'justify-between','my-4');
            
                listItem.innerHTML = `
                <div class="w-8 h-8 mr-4 flex-none ring-2 ring-offset-2 ring-gray-200 display flex align-items-center justify-content-center">
                <img  src="${resultMediaList[i].logo}" class="object-fit cover object-position 50% 50%"></img>
                </div>
                <div class="ml-4 flex-grow">
                    <strong class="block mb-1">${resultMediaList[i].url}</strong>
                    <input class="w-full" type="range" min="0" max="1" step="0.1" value="${resultMediaList[i].volume}" data-site="${resultMediaList[i].url}"> 
                </div>
                <span id="volumevalue" class="text-right w-10 mt-4">${resultMediaList[i].volume * 100}%</span>
                <span id="remove" class="w-5 h-5" data-site="${resultMediaList[i].url}" ><img src="images/delete.png" class="object-fit cover object-position 50% 50%" data-site="${resultMediaList[i].url}"></span>
                `;
            
                siteList.appendChild(listItem);
                const removeBtn = listItem.querySelector('span[id="remove"]')
                
                removeBtn.addEventListener('click',removeMedia)

                // 监听滑动条变化
                const rangeInput = listItem.querySelector('input[type="range"]');
                rangeInput.addEventListener('input', handleRangeChange);
            }
        })
    }

    function removeMedia(event){
        const btn = event.target;
  
        // 获取data-site的值
        const site = btn.dataset.site;
        chrome.storage.local.get('mediaList', (result) => {
                let mediaList = result.mediaList || [];
                
                // 找到索引
                const index = mediaList.findIndex(item => item.url === site);
                
                // 从数组中删除
                if(index > -1) {
                mediaList.splice(index, 1); 
                }
                
                // 设置回storage
                chrome.storage.local.set({mediaList}, function() {
                console.log('Deleted site');
                renderList();
            });
        })
    }

    // 重新渲染列表的函数
    function renderList() {
        // 清空列表
        document.getElementById('siteList').innerHTML = '';
        build();
    }

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
    }
}