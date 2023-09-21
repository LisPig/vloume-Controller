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
    function select(element) {
         // 获取当前点击的菜单项的data-id属性，即对应的内容框的id 
         let id = element.dataset.id; 
         // 获取所有的内容框元素 
         let contents = document.querySelectorAll('#app  > div:nth-child(2) > div'); 
         // 遍历所有的内容框元素，如果id匹配，则显示，否则隐藏 
         for (let content of contents) { 
            if (content.id === id) { 
                content.classList.remove('hidden'); 
                const siteList = document.getElementById('siteList');
                if(content.id === "option1"){
                    document.getElementById('siteList').innerHTML = '';
                    chrome.storage.local.get('mediaList', (result) => {
                        let resultMediaList =  [...new Set(result.mediaList)];
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
                            `;
                        
                            siteList.appendChild(listItem);
                        }
                    })
                }
            } else { 
                content.classList.add('hidden'); 
            } 
         } 
    } 
}