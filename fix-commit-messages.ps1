# Git提交信息修复脚本
# 修复乱码的提交信息

# 设置编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$env:LANG = "zh_CN.UTF-8"

# 提交信息映射（提交哈希 -> 正确的中文信息）
$commitMessages = @{
    "5e57b71" = "优先使用高德地图定位服务提高精度"
    "18ca389" = "修复GPS定位偏移：添加WGS84到GCJ-02坐标转换"
    "306ecf2" = "更新高德地图API Key"
    "b3816fc" = "修复地图显示问题：移除占位符确保地图正常显示"
    "d650225" = "优化删除按钮：缩小尺寸并移至右下角，降低误触风险"
}

Write-Host "开始修复提交信息..." -ForegroundColor Green

# 获取当前分支
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "当前分支: $currentBranch" -ForegroundColor Yellow

# 创建备份分支
$backupBranch = "backup-before-fix-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
git branch $backupBranch
Write-Host "已创建备份分支: $backupBranch" -ForegroundColor Yellow

# 注意：修改已推送的提交需要强制推送，请谨慎操作
Write-Host ""
Write-Host "警告：这将修改Git历史，需要强制推送！" -ForegroundColor Red
Write-Host "如果确定要继续，请手动执行以下命令：" -ForegroundColor Yellow
Write-Host ""
Write-Host "方法1：使用git commit --amend逐个修改最近的提交" -ForegroundColor Cyan
Write-Host "方法2：使用git rebase -i交互式修改" -ForegroundColor Cyan
Write-Host ""

# 显示需要修复的提交
Write-Host "需要修复的提交：" -ForegroundColor Green
git log --oneline -10 | ForEach-Object {
    $line = $_
    foreach ($hash in $commitMessages.Keys) {
        if ($line -match $hash) {
            Write-Host "  $hash -> $($commitMessages[$hash])" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "由于修改已推送的提交需要强制推送，建议：" -ForegroundColor Yellow
Write-Host "1. 保持现状，未来提交使用正确编码" -ForegroundColor White
Write-Host "2. 或者手动使用 git commit --amend 修改最近的提交" -ForegroundColor White
Write-Host ""




