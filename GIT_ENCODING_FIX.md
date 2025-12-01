# Git 编码问题修复说明

## 问题原因
GitHub上显示的提交信息出现乱码，是因为Windows系统下Git的编码设置不正确导致的。

## 已修复的配置
已设置以下Git配置，确保未来提交使用UTF-8编码：

```bash
git config --global core.quotepath false
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8
git config --global core.encoding utf-8
```

## 验证配置
运行以下命令验证配置：

```bash
git config --global --list | findstr -i "i18n\|encoding\|utf\|quotepath"
```

## 注意事项
- **已提交的乱码信息无法修改**：GitHub上已经显示的乱码提交信息无法直接修改
- **未来提交将正常显示**：配置修复后，新的提交信息将正确显示中文
- **如果需要修改历史提交信息**：需要使用 `git rebase` 或 `git commit --amend`，但这会改变提交哈希，需要强制推送

## 查看正确的提交信息
在本地使用以下命令查看提交信息（应该能正确显示中文）：

```bash
git log --oneline -10
```

## 建议
- 未来提交时，确保使用UTF-8编码
- 如果使用PowerShell，可以设置：`$env:LANG="zh_CN.UTF-8"`
- 或者使用Git Bash，它默认支持UTF-8





