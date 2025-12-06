# 🔄 Git同步操作指南

## 📋 当前情况

根据GitHub Desktop显示：
- ✅ 本地有未提交的更改（index.html已修改）
- ⚠️ 本地分支落后远程96个提交
- 📦 有一些文件被stash（暂存）

---

## 🎯 推荐操作步骤

### 方法1：使用GitHub Desktop（推荐）

#### 步骤1：恢复Stash的更改
1. 在GitHub Desktop中，点击"Stashed changes"
2. 点击"Restore"按钮，恢复暂存的更改
3. 这样你的更改会回到"Changes"列表中

#### 步骤2：提交本地更改
1. 在"Changes"标签中，确认要提交的文件
2. 在底部输入提交信息，例如：
   ```
   修复AI聊天功能：优化GitHub Pages静态托管时的降级机制
   ```
3. 点击"Commit to main"按钮提交

#### 步骤3：拉取远程最新代码
1. 点击顶部工具栏的"Pull origin"按钮
2. 如果有冲突，GitHub Desktop会提示你解决
3. 如果没有冲突，会自动合并

#### 步骤4：推送更改
1. 拉取完成后，点击"Push origin"按钮
2. 等待推送完成

---

### 方法2：使用命令行（如果GitHub Desktop有问题）

#### 步骤1：恢复Stash
```bash
git stash pop
```

#### 步骤2：提交本地更改
```bash
git add .
git commit -m "修复AI聊天功能：优化GitHub Pages静态托管时的降级机制"
```

#### 步骤3：拉取远程代码
```bash
git pull origin main
```

如果有冲突：
```bash
# 查看冲突文件
git status

# 手动解决冲突后
git add .
git commit -m "合并远程更改"
```

#### 步骤4：推送
```bash
git push origin main
```

---

## ⚠️ 注意事项

### 1. 冲突处理
如果拉取时出现冲突：
- GitHub Desktop会高亮冲突文件
- 手动编辑文件解决冲突
- 标记为已解决后继续

### 2. 重要文件保护
确保以下重要更改不要丢失：
- ✅ `index.html` - AI聊天功能修复
- ✅ 其他你修改的重要文件

### 3. 备份建议
在操作前，可以：
```bash
# 创建备份分支
git branch backup-$(date +%Y%m%d)
```

---

## 🔍 检查状态

### 查看本地更改
```bash
git status
```

### 查看Stash列表
```bash
git stash list
```

### 查看远程差异
```bash
git log HEAD..origin/main --oneline
```

---

## ✅ 完成后的验证

推送完成后，检查：
1. GitHub仓库页面是否显示最新提交
2. GitHub Pages是否自动更新
3. 手机测试AI聊天功能是否正常

---

## 🆘 如果遇到问题

### 问题1：冲突太多
**解决**：可以放弃本地更改，使用远程版本
```bash
git reset --hard origin/main
```
⚠️ 注意：这会丢失所有本地未提交的更改！

### 问题2：Stash恢复失败
**解决**：查看stash内容
```bash
git stash show -p stash@{0}
```
然后手动应用更改

### 问题3：推送被拒绝
**解决**：先拉取再推送
```bash
git pull --rebase origin main
git push origin main
```

---

## 📞 需要帮助？

如果操作过程中遇到问题，告诉我具体的错误信息，我会帮你解决。

---

**建议：优先使用GitHub Desktop，操作更直观安全！** 🚀

