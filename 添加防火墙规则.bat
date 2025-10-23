@echo off
chcp 65001 >nul
cls

echo.
echo ════════════════════════════════════════════════════
echo    🔥 添加防火墙规则 - 允许3000端口
echo ════════════════════════════════════════════════════
echo.
echo ⚠️  此操作需要管理员权限
echo.
echo 正在检查管理员权限...

net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ 已获取管理员权限
    echo.
    echo 正在添加防火墙规则...
    netsh advfirewall firewall add rule name="NodeJS Server 3000" dir=in action=allow protocol=TCP localport=3000
    
    if %errorLevel% == 0 (
        echo.
        echo ✅ 防火墙规则添加成功！
        echo.
        echo 📱 现在可以用手机访问了：
        echo    http://10.21.32.147:3000/location-diagnosis.html
        echo.
    ) else (
        echo.
        echo ❌ 添加失败，请手动设置防火墙
        echo.
    )
) else (
    echo ❌ 没有管理员权限！
    echo.
    echo 💡 请右键点击此文件，选择"以管理员身份运行"
    echo.
)

pause

