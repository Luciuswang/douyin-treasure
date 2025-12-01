#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Git本地与GitHub同步状态检查工具
"""
import subprocess
import os
import sys

def run_command(cmd):
    """执行命令并返回输出"""
    try:
        result = subprocess.run(
            cmd, 
            shell=True, 
            capture_output=True, 
            text=True,
            encoding='utf-8',
            errors='ignore'
        )
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except Exception as e:
        return "", str(e), 1

def main():
    print("=" * 50)
    print("Git本地与GitHub同步状态检查")
    print("=" * 50)
    print()
    
    # 检查Git仓库是否存在
    if not os.path.exists('.git'):
        print("[错误] Git仓库未初始化！")
        print("请先运行: git init")
        return
    
    # 1. 检查远程仓库配置
    print("[1] 远程仓库配置:")
    stdout, stderr, code = run_command('git remote -v')
    if stdout:
        print(stdout)
    else:
        print("  [警告] 未配置远程仓库")
        print("  预期仓库: https://github.com/Luciuswang/douyin-treasure.git")
    print()
    
    # 2. 当前分支
    print("[2] 当前分支:")
    stdout, stderr, code = run_command('git branch --show-current')
    if stdout:
        print(f"  {stdout}")
    print()
    
    # 3. 本地提交历史
    print("[3] 本地提交历史（最近5条）:")
    stdout, stderr, code = run_command('git log --oneline -5')
    if stdout:
        for line in stdout.split('\n'):
            print(f"  {line}")
    print()
    
    # 4. 工作区状态
    print("[4] 工作区状态:")
    stdout, stderr, code = run_command('git status --short')
    if stdout:
        for line in stdout.split('\n'):
            print(f"  {line}")
    else:
        print("  工作区干净，无未提交的更改")
    print()
    
    # 5. 获取远程更新
    print("[5] 获取远程更新信息...")
    stdout, stderr, code = run_command('git fetch origin')
    if stderr and 'fatal' not in stderr.lower():
        print(f"  {stderr}")
    print()
    
    # 6. 本地与远程对比
    print("[6] 本地与远程分支对比:")
    stdout, stderr, code = run_command('git status -sb')
    if stdout:
        for line in stdout.split('\n'):
            print(f"  {line}")
    print()
    
    # 7. 检查未推送的提交
    print("[7] 本地未推送的提交:")
    stdout, stderr, code = run_command('git log origin/main..HEAD --oneline')
    if code != 0:
        stdout, stderr, code = run_command('git log origin/master..HEAD --oneline')
    
    if stdout:
        for line in stdout.split('\n'):
            print(f"  {line}")
    else:
        print("  无未推送的提交")
    print()
    
    # 8. 检查未拉取的提交
    print("[8] 远程未拉取的提交:")
    stdout, stderr, code = run_command('git log HEAD..origin/main --oneline')
    if code != 0:
        stdout, stderr, code = run_command('git log HEAD..origin/master --oneline')
    
    if stdout:
        for line in stdout.split('\n'):
            print(f"  {line}")
    else:
        print("  无未拉取的提交")
    print()
    
    print("=" * 50)
    print("检查完成！")
    print("=" * 50)
    print()
    print("提示:")
    print("- 如果有未推送的提交，运行: 提交代码.bat")
    print("- 如果有未拉取的提交，运行: 更新代码.bat")

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    main()

