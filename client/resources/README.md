# App 图标与启动画面

将以下两个文件放入此目录（resources/）：

1. **icon.png** — App 图标，1024×1024 px，PNG 格式
2. **splash.png** — 启动画面，2732×2732 px，PNG 格式，主要内容居中

然后运行：

```bash
npx @capacitor/assets generate --iconBackgroundColor '#00d4aa' --splashBackgroundColor '#00d4aa'
```

这会自动生成所有 Android/iOS 需要的尺寸图标。
