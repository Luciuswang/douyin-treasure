@echo off
chcp 65001 >nul
echo ========================================
echo 检查更新状态
echo ========================================
echo.

echo [1] 检查本地Git状态...
git status
echo.

echo [2] 检查最近的提交记录...
git log --oneline -5
echo.

echo [3] 检查远程更新...
git fetch origin
echo.

echo [4] 对比本地和远程差异...
git log HEAD..origin/main --oneline
if %errorlevel% == 0 (
    echo ✅ 本地代码已是最新版本
) else (
    echo ⚠️ 远程有更新，需要拉取
)
echo.

echo [5] 检查GitHub部署状态...
echo 访问: https://github.com/Luciuswang/douyin-treasure/actions
echo.

echo ========================================
echo 检查完成！
echo ========================================
echo.
echo 最新版本应该包含以下功能：
echo ✅ 高德地图定位服务（提高精度）
echo ✅ GPS坐标转换（WGS84 → GCJ-02）
echo ✅ 删除聊天记录功能
echo ✅ 地图显示修复
echo.
pause





