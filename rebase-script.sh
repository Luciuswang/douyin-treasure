#!/bin/bash
# 修复提交信息的rebase脚本

git rebase -i HEAD~5 <<'EOF'
pick 2490948 Add update check script
reword 5e57b71 优先使用高德地图定位服务提高精度
reword 18ca389 修复GPS定位偏移：添加WGS84到GCJ-02坐标转换
reword 306ecf2 更新高德地图API Key
reword b3816fc 修复地图显示问题：移除占位符确保地图正常显示
EOF





