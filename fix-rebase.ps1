# Git Rebase 修复脚本
# 修复乱码的提交信息

# 设置编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$env:LANG = "zh_CN.UTF-8"

# 创建rebase todo文件
$rebaseTodo = @"
pick 2490948 Add update check script
reword 5e57b71 优先使用高德地图定位服务提高精度
reword 18ca389 修复GPS定位偏移：添加WGS84到GCJ-02坐标转换
reword 306ecf2 更新高德地图API Key
reword b3816fc 修复地图显示问题：移除占位符确保地图正常显示
"@

# 设置GIT_SEQUENCE_EDITOR
$script:rebaseEditor = {
    param($file)
    $rebaseTodo | Out-File -FilePath $file -Encoding UTF8 -NoNewline
}

# 导出函数供git使用
function Set-RebaseEditor {
    param($file)
    $rebaseTodo | Out-File -FilePath $file -Encoding UTF8 -NoNewline
}

# 设置环境变量指向这个函数
$env:GIT_SEQUENCE_EDITOR = "powershell -File $PSScriptRoot\set-rebase-todo.ps1"

Write-Host "开始修复提交信息..." -ForegroundColor Green

# 执行rebase
git rebase -i HEAD~5

Write-Host "Rebase完成！" -ForegroundColor Green




