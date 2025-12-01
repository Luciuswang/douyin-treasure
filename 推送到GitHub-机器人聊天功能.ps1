# PowerShell 脚本：推送机器人聊天功能到 GitHub
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "推送机器人聊天功能到 GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

Write-Host "检查 Git 状态..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "检查已暂存的文件..." -ForegroundColor Yellow
git diff --cached --name-only

Write-Host ""
Write-Host "检查远程仓库..." -ForegroundColor Yellow
git remote -v

Write-Host ""
Write-Host "检查当前分支..." -ForegroundColor Yellow
git branch --show-current

Write-Host ""
$confirm = Read-Host "是否推送到 GitHub? (Y/N)"

if ($confirm -eq "Y" -or $confirm -eq "y") {
    Write-Host ""
    Write-Host "推送到 GitHub..." -ForegroundColor Yellow
    
    # 尝试推送到 main 分支
    git push origin main 2>&1 | Out-String
    
    # 如果失败，尝试 master 分支
    if ($LASTEXITCODE -ne 0) {
        Write-Host "尝试推送到 master 分支..." -ForegroundColor Yellow
        git push origin master 2>&1 | Out-String
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "推送完成！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
} else {
    Write-Host "已取消推送" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "按 Enter 键退出"

