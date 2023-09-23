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
                <div class="w-8 h-8 mr-4 flex-none  display flex align-items-center justify-content-center">
                <img  src="${resultMediaList[i].logo}" class="object-fit cover object-position 50% 50%"></img>
                </div>
                <div class="ml-4 flex-grow">
                    <strong class="block mb-1">${resultMediaList[i].url}</strong>
                    <input class="w-full" type="range" min="0" max="1" step="0.1" value="${resultMediaList[i].volume}" data-site="${resultMediaList[i].url}"> 
                </div>
                <span id="volumevalue" class="text-right w-10 mt-4">${parseInt(resultMediaList[i].volume * 100)}%</span>
                <span id="remove" class="w-5 h-5 ml-3 mt-4" data-site="${resultMediaList[i].url}" >
                    
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 icon hover:text-red-500" data-site="${resultMediaList[i].url}">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>  
                </span>
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