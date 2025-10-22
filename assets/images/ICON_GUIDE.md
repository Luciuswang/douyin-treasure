# 📱 Totofun App 图标制作指南

## 🎯 任务说明

需要从 `totofun-logo.png` 中提取**纯图案部分**（不含"Totofun"文字），制作各种尺寸的 App 图标。

## 📐 需要的图标尺寸

### 方案一：在线工具生成（推荐⭐）

使用在线工具自动生成所有尺寸：

1. **访问工具网站**：
   - https://www.favicon-generator.org/
   - https://realfavicongenerator.net/
   - https://app-icon-generator.com/

2. **上传图片**：
   - 上传你处理好的纯图案 Logo（只要"突突"图案，不要文字）
   - 建议尺寸：1024x1024px，PNG 格式，透明背景

3. **生成并下载**：
   - 下载生成的图标包
   - 解压到 `assets/images/` 目录

### 方案二：手动制作

如果你用 Photoshop/AI/Figma 等工具：

#### 必需的图标尺寸：

```
icon-16x16.png      (浏览器 favicon)
icon-32x32.png      (浏览器 favicon)
icon-57x57.png      (iOS 老设备)
icon-60x60.png      (iOS)
icon-72x72.png      (iPad)
icon-76x76.png      (iPad)
icon-96x96.png      (Android)
icon-114x114.png    (iOS Retina)
icon-120x120.png    (iPhone Retina)
icon-128x128.png    (Chrome Web Store)
icon-144x144.png    (Windows)
icon-152x152.png    (iPad Retina)
icon-180x180.png    (iPhone 6 Plus)
icon-192x192.png    (Android Chrome)
icon-384x384.png    (Android Chrome)
icon-512x512.png    (Android Chrome, PWA splash)
```

#### 制作要点：

1. **图案提取**：
   - 只保留"突突"的图案部分
   - 删除下方的"Totofun"文字
   - 保持透明背景

2. **安全区域**：
   - 图案四周留 10% 的空白边距
   - 防止被裁切

3. **圆角处理**：
   - 移动系统会自动添加圆角
   - 不要预先做圆角

4. **导出设置**：
   - 格式：PNG-24
   - 透明背景
   - 无压缩或轻度压缩

## 🎨 推荐配色方案

由于图标较小，建议：
- 保持原有的渐变色
- 或使用纯色版本（青蓝色 #4FC3F7）

## 📁 文件命名规则

所有图标文件命名格式：
```
icon-{宽度}x{高度}.png
```

例如：
```
icon-192x192.png
icon-512x512.png
```

## ✅ 完成后的文件结构

```
assets/images/
├── totofun-logo.png          (原始完整 Logo)
├── icon-16x16.png
├── icon-32x32.png
├── icon-57x57.png
├── icon-60x60.png
├── icon-72x72.png
├── icon-76x76.png
├── icon-96x96.png
├── icon-114x114.png
├── icon-120x120.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-180x180.png
├── icon-192x192.png
├── icon-384x384.png
└── icon-512x512.png
```

## 🧪 测试方法

### iOS (iPhone/iPad)
1. 用 Safari 打开网站
2. 点击"分享"按钮
3. 选择"添加到主屏幕"
4. 查看图标效果

### Android
1. 用 Chrome 打开网站
2. 点击右上角菜单
3. 选择"添加到主屏幕"
4. 查看图标效果

## 🎯 快速开始

**最简单的方法**：

1. 提取纯图案，保存为 1024x1024 的 PNG
2. 访问：https://realfavicongenerator.net/
3. 上传图片，一键生成所有尺寸
4. 下载后放到 `assets/images/` 目录
5. Git 提交推送

就这么简单！🎉

