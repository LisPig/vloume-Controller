/**
 * Volume Controller Options Page
 * 优化版本 - 现代化代码结构和功能
 */

class VolumeControllerOptions {
    constructor() {
        this.mediaList = [];
        this.siteList = null;
        this.siteCount = null;
        this.emptyState = null;
        this.mediaListContainer = null;
        
        this.init();
    }

    /**
     * 初始化应用
     */
    init() {
        // 获取DOM元素
        this.siteList = document.getElementById('siteList');
        this.siteCount = document.getElementById('siteCount');
        this.emptyState = document.getElementById('emptyState');
        this.mediaListContainer = document.getElementById('mediaListContainer');
        
        this.setupNavigation();
        this.setupAdvancedSettings();
        this.loadMediaList();
        this.showDefaultPanel();
    }

    /**
     * 设置导航菜单
     */
    setupNavigation() {
        const menuItems = document.querySelectorAll('.sidebar-item');
        
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleMenuClick(e.currentTarget);
            });
        });
    }

    /**
     * 处理菜单点击
     */
    handleMenuClick(element) {
        // 更新菜单样式
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        element.classList.add('active');

        // 切换内容面板
        const targetId = element.dataset.id;
        this.showPanel(targetId);
    }

    /**
     * 显示指定面板
     */
    showPanel(panelId) {
        // 隐藏所有面板
        document.querySelectorAll('.content-panel').forEach(panel => {
            panel.classList.add('hidden');
        });

        // 显示目标面板
        const targetPanel = document.getElementById(panelId);
        if (targetPanel) {
            targetPanel.classList.remove('hidden');
            
            // 如果是媒体列表面板，刷新数据
            if (panelId === 'option1') {
                this.refreshMediaList();
            }
        }
    }

    /**
     * 显示默认面板
     */
    showDefaultPanel() {
        this.showPanel('option1');
    }

    /**
     * 加载媒体列表
     */
    async loadMediaList() {
        try {
            const result = await this.getStorageData('mediaList');
            this.mediaList = [...new Set(result.mediaList || [])];
            this.renderMediaList();
            this.updateSiteCount();
        } catch (error) {
            console.error('Error loading media list:', error);
            this.showError('加载媒体列表时出错');
        }
    }

    /**
     * 渲染媒体列表
     */
    renderMediaList() {
        // 清空现有列表
        if (this.siteList) {
            this.siteList.innerHTML = '';
        }

        // 检查是否为空
        if (this.mediaList.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();

        // 渲染每个媒体项
        this.mediaList.forEach((item, index) => {
            const listItem = this.createMediaItem(item, index);
            if (this.siteList) {
                this.siteList.appendChild(listItem);
            }
        });
    }

    /**
     * 创建媒体项DOM元素
     */
    createMediaItem(siteInfo, index) {
        const listItem = document.createElement('li');
        listItem.classList.add('media-item', 'flex', 'items-center', 'justify-between', 'p-4', 'rounded-lg', 'bg-gray-50');

        // 使用base64图片或默认图标
        const logoSrc = siteInfo.logo || this.getDefaultFavicon();
        
        listItem.innerHTML = `
            <div class="flex items-center flex-grow">
                <div class="w-10 h-10 mr-4 flex-shrink-0 rounded-lg overflow-hidden bg-white shadow-sm">
                    <img src="${logoSrc}" 
                         class="w-full h-full object-cover" 
                         onerror="this.src='${this.getDefaultFavicon()}'"
                         alt="Site logo">
                </div>
                <div class="flex-grow min-w-0">
                    <h4 class="font-medium text-gray-800 truncate">${siteInfo.url}</h4>
                    <div class="mt-2 flex items-center space-x-3">
                        <div class="flex-grow relative">
                            <div class="volume-slider-container">
                                <div class="volume-progress" data-index="${index}" style="width: ${siteInfo.volume * 100}%"></div>
                            </div>
                            <input class="volume-slider absolute top-0 left-0 w-full" 
                                   type="range" 
                                   min="0" 
                                   max="1" 
                                   step="0.1" 
                                   value="${siteInfo.volume}" 
                                   data-site="${siteInfo.url}"
                                   data-index="${index}"> 
                        </div>
                        <span class="volume-value text-sm font-medium text-blue-600 w-12 bg-blue-50 px-2 py-1 rounded">
                            ${Math.round(siteInfo.volume * 100)}%
                        </span>
                    </div>
                </div>
            </div>
            <button class="delete-btn ml-4 p-2 rounded-lg hover:bg-red-50 transition-colors" 
                    data-site="${siteInfo.url}" 
                    data-index="${index}"
                    title="删除此网站设置">
                <svg class="w-5 h-5" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
            </button>
        `;

        // 添加事件监听器
        this.attachMediaItemListeners(listItem);

        return listItem;
    }

    /**
     * 为媒体项添加事件监听器
     */
    attachMediaItemListeners(listItem) {
        // 音量滑动条事件
        const rangeInput = listItem.querySelector('.volume-slider');
        if (rangeInput) {
            rangeInput.addEventListener('input', (e) => {
                this.handleVolumeChange(e);
            });
        }

        // 滑动条容器点击事件
        const sliderContainer = listItem.querySelector('.volume-slider-container');
        if (sliderContainer && rangeInput) {
            sliderContainer.addEventListener('click', (e) => {
                this.handleSliderClick(e, rangeInput);
            });
        }

        // 删除按钮事件
        const deleteBtn = listItem.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                this.handleDeleteSite(e);
            });
        }
    }

    /**
     * 处理滑动条点击
     */
    handleSliderClick(event, rangeInput) {
        // 防止在拖拽时触发点击
        if (event.target === rangeInput) {
            return;
        }
        
        const rect = event.currentTarget.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const width = rect.width;
        const percentage = Math.max(0, Math.min(1, clickX / width));
        
        // 四舍五入到最近的0.1
        const newVolume = Math.round(percentage * 10) / 10;
        
        // 更新滑动条值
        rangeInput.value = newVolume;
        
        // 触发input事件来更新UI和保存数据
        const inputEvent = new Event('input', { bubbles: true });
        rangeInput.dispatchEvent(inputEvent);
        
        // 添加视觉反馈
        event.currentTarget.style.transform = 'scale(0.98)';
        setTimeout(() => {
            event.currentTarget.style.transform = 'scale(1)';
        }, 100);
    }

    /**
     * 处理音量变化
     */
    handleVolumeChange(event) {
        const site = event.target.dataset.site;
        const index = parseInt(event.target.dataset.index);
        const volume = parseFloat(event.target.value);

        // 更新内存中的数据
        if (this.mediaList[index]) {
            this.mediaList[index].volume = volume;
        }

        // 更新进度条显示
        const progressBar = event.target.parentNode.querySelector('.volume-progress');
        if (progressBar) {
            progressBar.style.width = `${volume * 100}%`;
        }

        // 更新百分比显示
        const volumeSpan = event.target.parentNode.parentNode.querySelector('.volume-value');
        if (volumeSpan) {
            volumeSpan.textContent = `${Math.round(volume * 100)}%`;
            
            // 根据音量大小改变颜色
            if (volume === 0) {
                volumeSpan.className = 'volume-value text-sm font-medium text-gray-500 w-12 bg-gray-100 px-2 py-1 rounded';
            } else if (volume < 0.3) {
                volumeSpan.className = 'volume-value text-sm font-medium text-green-600 w-12 bg-green-50 px-2 py-1 rounded';
            } else if (volume < 0.7) {
                volumeSpan.className = 'volume-value text-sm font-medium text-blue-600 w-12 bg-blue-50 px-2 py-1 rounded';
            } else {
                volumeSpan.className = 'volume-value text-sm font-medium text-purple-600 w-12 bg-purple-50 px-2 py-1 rounded';
            }
        }

        // 保存到存储
        this.saveMediaList();
    }

    /**
     * 处理删除网站
     */
    async handleDeleteSite(event) {
        const site = event.target.dataset.site;
        const index = parseInt(event.target.dataset.index);

        // 确认对话框
        if (!confirm(`确定要删除 ${site} 的音量设置吗？`)) {
            return;
        }

        try {
            // 从数组中删除
            this.mediaList.splice(index, 1);
            
            // 保存并重新渲染
            await this.saveMediaList();
            this.renderMediaList();
            this.updateSiteCount();
            
            this.showSuccess('网站设置已删除');
        } catch (error) {
            console.error('Error deleting site:', error);
            this.showError('删除失败，请重试');
        }
    }

    /**
     * 刷新媒体列表
     */
    refreshMediaList() {
        this.loadMediaList();
    }

    /**
     * 更新网站计数
     */
    updateSiteCount() {
        if (this.siteCount) {
            this.siteCount.textContent = this.mediaList.length;
        }
    }

    /**
     * 显示空状态
     */
    showEmptyState() {
        if (this.emptyState && this.mediaListContainer) {
            this.emptyState.classList.remove('hidden');
            this.mediaListContainer.classList.add('hidden');
        }
    }

    /**
     * 隐藏空状态
     */
    hideEmptyState() {
        if (this.emptyState && this.mediaListContainer) {
            this.emptyState.classList.add('hidden');
            this.mediaListContainer.classList.remove('hidden');
        }
    }

    /**
     * 保存媒体列表到存储
     */
    async saveMediaList() {
        try {
            await this.setStorageData({ mediaList: this.mediaList });
        } catch (error) {
            console.error('Error saving media list:', error);
            throw error;
        }
    }

    /**
     * 设置高级设置功能
     */
    setupAdvancedSettings() {
        // 清除所有数据按钮
        const clearAllBtn = document.getElementById('clearAllData');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.handleClearAllData();
            });
        }

        // 导出数据按钮
        const exportBtn = document.getElementById('exportData');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.handleExportData();
            });
        }

        // 默认音量设置
        const defaultVolumeSlider = document.getElementById('defaultVolume');
        const defaultVolumeValue = document.getElementById('defaultVolumeValue');
        
        if (defaultVolumeSlider && defaultVolumeValue) {
            defaultVolumeSlider.addEventListener('input', (e) => {
                const volume = parseFloat(e.target.value);
                defaultVolumeValue.textContent = `${Math.round(volume * 100)}%`;
                
                // 更新进度条
                const progressBar = document.getElementById('defaultVolumeProgress');
                if (progressBar) {
                    progressBar.style.width = `${volume * 100}%`;
                }
                
                // 根据音量大小改变颜色
                if (volume === 0) {
                    defaultVolumeValue.className = 'text-sm font-medium text-gray-500 w-12 bg-gray-100 px-2 py-1 rounded';
                } else if (volume < 0.3) {
                    defaultVolumeValue.className = 'text-sm font-medium text-green-600 w-12 bg-green-50 px-2 py-1 rounded';
                } else if (volume < 0.7) {
                    defaultVolumeValue.className = 'text-sm font-medium text-blue-600 w-12 bg-blue-50 px-2 py-1 rounded';
                } else {
                    defaultVolumeValue.className = 'text-sm font-medium text-purple-600 w-12 bg-purple-50 px-2 py-1 rounded';
                }
                
                this.saveDefaultVolume(volume);
            });

            // 为默认音量滑动条容器添加点击事件
            const defaultSliderContainer = defaultVolumeSlider.parentNode.querySelector('.volume-slider-container');
            if (defaultSliderContainer) {
                defaultSliderContainer.addEventListener('click', (e) => {
                    this.handleSliderClick(e, defaultVolumeSlider);
                });
            }
        }

        // 加载默认音量设置
        this.loadDefaultVolume();
    }

    /**
     * 清除所有数据
     */
    async handleClearAllData() {
        if (!confirm('确定要清除所有网站音量设置吗？此操作不可撤销！')) {
            return;
        }

        try {
            this.mediaList = [];
            await this.saveMediaList();
            this.renderMediaList();
            this.updateSiteCount();
            this.showSuccess('所有数据已清除');
        } catch (error) {
            console.error('Error clearing data:', error);
            this.showError('清除数据失败');
        }
    }

    /**
     * 导出数据
     */
    handleExportData() {
        try {
            const dataToExport = {
                mediaList: this.mediaList,
                exportDate: new Date().toISOString(),
                version: 'v0.0.6'
            };

            const dataStr = JSON.stringify(dataToExport, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `volume-controller-settings-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showSuccess('设置已导出');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showError('导出失败');
        }
    }

    /**
     * 保存默认音量
     */
    async saveDefaultVolume(volume) {
        try {
            await this.setStorageData({ defaultVolume: volume });
        } catch (error) {
            console.error('Error saving default volume:', error);
        }
    }

    /**
     * 加载默认音量
     */
    async loadDefaultVolume() {
        try {
            const result = await this.getStorageData('defaultVolume');
            const defaultVolume = result.defaultVolume || 1.0;
            
            const slider = document.getElementById('defaultVolume');
            const valueSpan = document.getElementById('defaultVolumeValue');
            const progressBar = document.getElementById('defaultVolumeProgress');
            
            if (slider) slider.value = defaultVolume;
            if (valueSpan) {
                valueSpan.textContent = `${Math.round(defaultVolume * 100)}%`;
                
                // 设置初始颜色
                if (defaultVolume === 0) {
                    valueSpan.className = 'text-sm font-medium text-gray-500 w-12 bg-gray-100 px-2 py-1 rounded';
                } else if (defaultVolume < 0.3) {
                    valueSpan.className = 'text-sm font-medium text-green-600 w-12 bg-green-50 px-2 py-1 rounded';
                } else if (defaultVolume < 0.7) {
                    valueSpan.className = 'text-sm font-medium text-blue-600 w-12 bg-blue-50 px-2 py-1 rounded';
                } else {
                    valueSpan.className = 'text-sm font-medium text-purple-600 w-12 bg-purple-50 px-2 py-1 rounded';
                }
            }
            if (progressBar) {
                progressBar.style.width = `${defaultVolume * 100}%`;
            }
        } catch (error) {
            console.error('Error loading default volume:', error);
        }
    }

    /**
     * 获取默认图标
     */
    getDefaultFavicon() {
        // 使用SVG图标的data URL
        const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#6b7280">
            <path d="M3 9v6h4l5 5V4L7 9H3zm10.5 3c0-.77-.33-1.47-.85-1.96l1.42-1.42c.95.95 1.52 2.27 1.52 3.73 0 1.46-.57 2.78-1.52 3.73l-1.42-1.42c.52-.49.85-1.19.85-1.96z"/>
        </svg>`;
        
        return `data:image/svg+xml;base64,${btoa(svgIcon)}`;
    }

    /**
     * 获取存储数据 (Promise化)
     */
    getStorageData(key) {
        return new Promise((resolve) => {
            if (chrome && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(key, resolve);
            } else {
                resolve({});
            }
        });
    }

    /**
     * 设置存储数据 (Promise化)
     */
    setStorageData(data) {
        return new Promise((resolve) => {
            if (chrome && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set(data, resolve);
            } else {
                resolve();
            }
        });
    }

    /**
     * 显示成功消息
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * 显示错误消息
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;

        // 添加到页面
        document.body.appendChild(notification);

        // 自动移除
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// 页面加载完成后初始化
window.onload = function() {
    new VolumeControllerOptions();
}; 