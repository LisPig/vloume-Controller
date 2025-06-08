# VolumeController - Chrome音量控制扩展

## 项目简介

VolumeController是一个Chrome浏览器扩展程序，专门用于控制不同网站的音频音量。该扩展允许用户为不同的网站设置独立的音量控制，实现更个性化的浏览体验。

## 主要功能

### 🎵 音量控制
- **实时音量调节**: 为当前播放音频的标签页提供实时音量控制
- **网站独立音量**: 为不同网站设置和记忆独立的音量设置
- **音频检测**: 自动检测页面是否包含音频内容

### 🌐 网站管理
- **网站列表**: 管理已添加音量控制的网站列表
- **自动应用**: 访问已保存的网站时自动应用预设音量
- **可视化界面**: 直观的滑块控制和网站图标显示

### ⚙️ 存储与同步
- **本地存储**: 使用Chrome存储API保存用户设置
- **设置持久化**: 音量设置在浏览器重启后仍然保持

## 项目结构

```
volumeController/
│
├── manifest.json              # Chrome扩展配置文件
├── package.json              # npm包配置文件
├── tailwind.config.js        # Tailwind CSS配置
│
├── 核心文件/
│   ├── background.js         # 后台服务脚本
│   ├── content_script.js     # 内容脚本，注入到网页中
│   ├── popup.html           # 扩展弹出窗口HTML
│   └── popup.js             # 弹出窗口逻辑脚本
│
├── 界面文件/
│   ├── option.html          # 选项页面HTML
│   └── option.js            # 选项页面脚本
│
├── 样式文件/
│   ├── src/tailwind.css     # Tailwind源文件
│   ├── dist/output.css      # 编译后的CSS
│   └── content_styles.css   # 内容脚本样式
│
├── 资源文件/
│   └── images/              # 图标和图片资源
│       ├── logo.png         # 主logo (48x48, 128x128)
│       ├── logo125.png      # 小logo (16x16, 32x32)
│       └── setting.png      # 设置图标
│
└── 其他/
    ├── popup0.html          # 备用弹出窗口
    └── node_modules/        # 依赖包
```

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **样式框架**: Tailwind CSS 3.3.3
- **API**: Chrome Extensions API
  - `tabCapture` - 音频捕获
  - `storage` - 数据存储
  - `scripting` - 脚本注入
  - `tabs` - 标签页操作
  - `activeTab` - 活动标签页访问

## 核心功能模块

### 1. 后台脚本 (background.js)
- 管理音频捕获和播放控制
- 处理扩展图标点击事件
- 在popup和content script之间中继消息

### 2. 内容脚本 (content_script.js)
- 检测页面中的音频/视频元素
- 应用存储的音量设置
- 监听音量变化事件
- 与后台脚本通信

### 3. 弹出窗口 (popup.html/popup.js)
- 提供用户界面进行音量控制
- 显示当前网站的音量设置
- 管理网站列表
- 实时音量滑块控制

### 4. 选项页面 (option.html/option.js)
- 扩展的高级设置界面
- 批量管理网站音量设置

## 安装说明

### 开发环境安装
1. 克隆项目到本地
```bash
git clone [repository-url]
cd volumeController
```

2. 安装依赖
```bash
npm install
```

3. 构建CSS文件
```bash
npm run build:tailwind
```

### Chrome扩展安装
1. 打开Chrome浏览器
2. 进入 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目根目录

## 使用方法

### 基本使用
1. **安装扩展后，浏览器工具栏会出现音量控制图标**
2. **访问包含音频的网页时，点击扩展图标**
3. **使用音量滑块调节当前页面音量**
4. **点击"Add"按钮将当前网站添加到管理列表**

### 高级功能
- **网站音量管理**: 在弹出窗口中查看和调整已保存网站的音量
- **自动应用**: 再次访问已保存的网站时，音量会自动设置为预设值
- **设置页面**: 点击设置图标访问更多选项

## 权限说明

该扩展需要以下权限：
- `tabCapture`: 捕获标签页音频流
- `activeTab`: 访问当前活动标签页
- `storage`: 存储用户设置
- `scripting`: 向页面注入脚本
- `tabs`: 获取标签页信息
- `<all_urls>`: 在所有网站上工作

## 开发脚本

```bash
# 构建Tailwind CSS
npm run build:tailwind
```

## 版本信息

- **当前版本**: 0.0.2
- **Manifest版本**: 3 (支持最新Chrome扩展规范)

## 浏览器兼容性

- Chrome 88+ (支持Manifest V3)
- 基于Chromium的浏览器 (Edge, Brave等)

## 注意事项

1. **音频检测**: 扩展只在检测到音频播放时才显示音量控制
2. **权限范围**: 不在chrome://页面上工作，这是浏览器安全限制
3. **数据存储**: 所有设置存储在本地，不会上传到服务器

## 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

## 许可证

ISC License

---

**注意**: 这是一个音量控制扩展，旨在为用户提供更好的音频浏览体验。如有任何问题或建议，请通过GitHub Issues联系我们。 