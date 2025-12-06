# 🔒 解决SSL证书错误

## 问题：NET::ERR_CERT_COMMON_NAME_INVALID

这个错误表示SSL证书的域名不匹配。可能的原因：

1. **Vercel域名配置问题**
2. **浏览器缓存问题**
3. **DNS解析问题**

## 解决方案

### 方法1：清除浏览器缓存（最简单）

1. 按 `Ctrl + Shift + Delete` 打开清除浏览数据
2. 选择"缓存的图片和文件"
3. 时间范围选择"全部时间"
4. 点击"清除数据"
5. 重新访问：`https://totofun-server007.vercel.app/api/test`

### 方法2：使用隐私模式测试

1. 按 `Ctrl + Shift + N` 打开隐私模式
2. 访问：`https://totofun-server007.vercel.app/api/test`
3. 看是否能正常访问

### 方法3：检查Vercel域名配置

1. 在Vercel Dashboard → "Settings" → "Domains"
2. 确认域名配置正确
3. 等待SSL证书自动配置（可能需要几分钟）

### 方法4：使用HTTP访问（临时测试）

注意：这只是临时测试，生产环境必须使用HTTPS

尝试访问：`http://totofun-server007.vercel.app/api/test`

（Vercel默认强制HTTPS，可能无法访问HTTP）

## 推荐操作

1. 先尝试清除浏览器缓存
2. 或使用隐私模式测试
3. 如果还是不行，检查Vercel的域名配置

