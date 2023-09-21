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
            } else { 
                content.classList.add('hidden'); 
            } 
         } 
    } 
}