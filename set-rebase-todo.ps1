$rebaseTodo = "pick 2490948 Add update check script`nreword 5e57b71 优先使用高德地图定位服务提高精度`nreword 18ca389 修复GPS定位偏移：添加WGS84到GCJ-02坐标转换`nreword 306ecf2 更新高德地图API Key`nreword b3816fc 修复地图显示问题：移除占位符确保地图正常显示`n"
[System.IO.File]::WriteAllText($args[0], $rebaseTodo, [System.Text.Encoding]::UTF8)
