# Volume Controller 隐私政策

**生效日期：** 2024年1月1日  
**最后更新：** 2024年1月1日

## 概述

Volume Controller（"我们的扩展"、"插件"）致力于保护您的隐私。本隐私政策说明了我们如何收集、使用和保护您在使用我们的浏览器扩展时的信息。

## 收集的信息

### 我们收集的数据
我们的扩展仅收集以下必要信息来提供核心功能：

1. **网站域名信息**
   - 目的：识别和保存特定网站的音量设置
   - 收集方式：当您调整网站音量时自动获取当前网站域名
   - 示例：www.youtube.com, www.bilibili.com

2. **音量设置数据**
   - 目的：记住您为每个网站设置的音量偏好
   - 收集方式：当您使用音量滑动条调整音量时
   - 数据类型：0.0到1.0之间的数值

3. **网站图标（favicon）**
   - 目的：在插件界面中显示网站图标，提升用户体验
   - 收集方式：从浏览器标签页获取
   - 用途：仅用于界面显示

### 我们不收集的数据
- ❌ 个人身份信息（姓名、邮箱、电话等）
- ❌ 浏览历史记录
- ❌ 网页内容或敏感数据
- ❌ 用户位置信息
- ❌ 登录凭据或密码
- ❌ 音频内容本身

## 数据存储和处理

### 本地存储
- **存储位置：** 所有数据都存储在您的本地设备上，使用Chrome的本地存储API（chrome.storage.local）
- **存储内容：** 仅包括网站域名、对应的音量设置和网站图标
- **访问权限：** 只有我们的扩展可以访问这些数据

### 数据安全
- 数据加密：使用浏览器提供的标准加密机制
- 访问控制：数据仅限于插件内部使用
- 传输安全：不涉及网络传输，所有数据处理都在本地进行

## 权限使用说明

我们的扩展请求以下权限，仅用于核心功能：

1. **"tabCapture"权限**
   - 用途：控制标签页音频流，实现音量调节功能
   - 范围：仅限当前活动标签页
   - 数据处理：不录制或存储音频内容

2. **"activeTab"权限**
   - 用途：与当前标签页的媒体元素交互
   - 范围：仅限用户主动操作的标签页
   - 数据处理：检测和控制音视频元素

3. **"storage"权限**
   - 用途：在本地保存音量设置偏好
   - 范围：仅限插件相关数据
   - 数据处理：读写音量配置信息

4. **"tabs"权限**
   - 用途：获取标签页基本信息（域名、图标）
   - 范围：仅获取必要的标识信息
   - 数据处理：不访问页面内容

## 数据使用

### 使用目的
收集的数据仅用于以下目的：
- 为每个网站保存和应用音量设置
- 在插件界面中显示网站列表和图标
- 提供个性化的音量控制体验

### 数据处理原则
- **最小化原则：** 仅收集实现功能所必需的最少数据
- **目的限制：** 数据仅用于声明的功能目的
- **准确性：** 确保数据的准确性和及时更新
- **透明度：** 对数据处理保持完全透明

## 数据分享

### 我们不会分享您的数据
- ❌ 不向第三方出售个人数据
- ❌ 不与广告商分享数据
- ❌ 不进行数据挖掘或分析
- ❌ 不上传数据到外部服务器

### 唯一例外
仅在法律要求的情况下，我们可能需要披露信息以：
- 遵守适用的法律法规
- 响应政府机关的合法要求
- 保护用户和公众的权利和安全

## 用户权利和控制

### 您的权利
- **访问权：** 您可以随时查看插件存储的数据
- **删除权：** 您可以随时删除特定网站的设置或清除所有数据
- **控制权：** 您可以随时启用或禁用插件

### 数据管理
- **查看数据：** 点击插件图标即可查看所有保存的网站设置
- **删除单个设置：** 在插件界面中删除特定网站的音量设置
- **清除所有数据：** 卸载插件将自动清除所有相关数据
- **导出设置：** 通过浏览器的扩展管理功能备份设置

## 儿童隐私

我们的扩展不专门针对13岁以下的儿童。我们不会故意收集儿童的个人信息。如果您是家长或监护人，发现您的孩子向我们提供了个人信息，请联系我们，我们将立即删除相关信息。

## 数据保留

- **保留期限：** 数据将保留直至您主动删除或卸载插件
- **自动清除：** 卸载插件时，所有相关数据将自动从您的设备中删除
- **用户控制：** 您可以随时通过插件界面管理和删除数据

## 安全措施

我们采取以下措施保护您的信息：
- 使用浏览器提供的安全存储API
- 实施最小权限原则
- 定期安全审查和更新
- 不传输敏感数据到外部服务

## 隐私政策更新

### 更新通知
如果我们对本隐私政策进行重大更改，我们将：
- 更新本文档的"最后更新"日期
- 在可能的情况下通过插件更新通知用户
- 在我们的官方渠道发布更新公告

### 持续使用
在隐私政策更新后继续使用插件即表示您同意修订后的政策。

## 第三方服务

### 浏览器APIs
我们的插件使用以下浏览器提供的APIs：
- Chrome Extensions API
- Chrome Storage API  
- Chrome Tab Capture API

这些APIs由浏览器提供商（如Google）管理，受其相应的隐私政策约束。

### 无外部依赖
我们的插件不依赖任何第三方服务或库，所有功能都在本地运行。

## 法律依据（GDPR合规）

根据《通用数据保护条例》(GDPR)，我们处理您数据的法律依据是：
- **同意：** 您安装和使用插件即表示同意数据处理
- **合法利益：** 为您提供音量控制功能的合法利益

## 联系我们

如果您对本隐私政策有任何疑问或担忧，请通过以下方式联系我们：

- **邮箱：** [请填写您的联系邮箱]
- **问题反馈：** [请填写您的反馈渠道，如GitHub Issues链接]

## 管辖法律

本隐私政策受[请填写适用法律管辖区]法律管辖和解释。

---

**免责声明：** 本隐私政策模板基于常见的扩展功能和最佳实践制作。在发布前，建议咨询法律专业人士以确保完全符合您所在地区的法律要求。

最后更新：2024年1月1日 