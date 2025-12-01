# PowerShell 脚本：准备 GitHub 提交
# 编码设置为 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "准备双聊天功能文件提交到 GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 切换到项目目录
Set-Location $PSScriptRoot

# 检查文件是否存在
$files = @(
    "totofun_treasure\lib\services\deepseek_service.dart",
    "totofun_treasure\lib\providers\chat_provider.dart",
    "totofun_treasure\lib\screens\chat\bot_chat_widget.dart",
    "totofun_treasure\lib\screens\chat\friend_chat_widget.dart",
    "totofun_treasure\lib\screens\chat\dual_chat_screen.dart",
    "totofun_treasure\lib\screens\home_screen.dart",
    "totofun_treasure\lib\screens\chat\friends_screen.dart",
    "totofun_treasure\pubspec.yaml"
)

Write-Host "检查文件..." -ForegroundColor Yellow
$allExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file (未找到)" -ForegroundColor Red
        $allExist = $false
    }
}

if (-not $allExist) {
    Write-Host ""
    Write-Host "错误：部分文件不存在，请检查！" -ForegroundColor Red
    Read-Host "按 Enter 键退出"
    exit 1
}

Write-Host ""
Write-Host "添加文件到 Git..." -ForegroundColor Yellow
foreach ($file in $files) {
    git add $file
    Write-Host "  + $file" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "当前 Git 状态：" -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "文件已添加到暂存区！" -ForegroundColor Green
Write-Host ""
Write-Host "现在可以在 GitHub Desktop 中：" -ForegroundColor Yellow
Write-Host "1. 查看所有更改的文件" -ForegroundColor White
Write-Host "2. 填写提交信息（建议使用）：" -ForegroundColor White
Write-Host "   feat: 添加双聊天界面 - 左下角机器人聊天，右下角好友聊天" -ForegroundColor Gray
Write-Host "3. 点击 Commit 提交" -ForegroundColor White
Write-Host "4. 点击 Push 推送到 GitHub" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Read-Host "按 Enter 键退出"


