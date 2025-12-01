@echo off
chcp 65001 >nul
echo ========================================
echo Checking Update Status
echo ========================================
echo.

echo [1] Checking local Git status...
git status
echo.

echo [2] Recent commits...
git log --oneline -5
echo.

echo [3] Fetching remote updates...
git fetch origin
echo.

echo [4] Comparing local vs remote...
git log HEAD..origin/main --oneline
if %errorlevel% == 0 (
    echo [OK] Local code is up to date
) else (
    echo [WARNING] Remote has updates, need to pull
)
echo.

echo [5] GitHub deployment status...
echo Visit: https://github.com/Luciuswang/douyin-treasure/actions
echo.

echo ========================================
echo Check Complete!
echo ========================================
echo.
echo Latest version includes:
echo - Gaode Map location service (improved accuracy)
echo - GPS coordinate conversion (WGS84 to GCJ-02)
echo - Delete chat history feature
echo - Map display fix
echo.
pause





