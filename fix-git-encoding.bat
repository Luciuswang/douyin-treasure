@echo off
chcp 65001 >nul
echo ========================================
echo Git 编码修复工具
echo ========================================
echo.

echo [1] 设置Git全局编码配置...
git config --global core.quotepath false
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8
git config --global core.encoding utf-8
echo ✅ Git编码配置已设置
echo.

echo [2] 设置PowerShell编码...
powershell -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8"
echo ✅ PowerShell编码已设置
echo.

echo [3] 验证配置...
echo Git配置:
git config --global --list | findstr /i "i18n encoding utf quotepath"
echo.

echo [4] 测试显示中文...
echo 测试: 中文显示测试
echo.

echo ========================================
echo 修复完成！
echo ========================================
echo.
echo 注意：
echo - 已提交的乱码信息无法修改
echo - 未来提交将使用UTF-8编码
echo - 建议使用Git Bash进行提交（支持UTF-8更好）
echo.
echo 如果GitHub上仍然显示乱码，可以：
echo 1. 使用Git Bash代替PowerShell
echo 2. 未来提交使用英文信息
echo 3. 或者使用 git commit --amend 修改最近的提交信息
echo.
pause

