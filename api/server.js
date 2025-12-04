// Vercel Serverless函数入口
// 将Express应用包装为Serverless函数

// 设置Vercel环境变量
process.env.VERCEL = '1';

// 导入Express应用
// 注意：如果Vercel Root Directory设置为server，则路径应该是相对路径
const path = require('path');

// 尝试多种路径来加载Express应用
let app;
try {
    // 如果Root Directory是根目录（api/server.js -> ../server/index.js）
    app = require('../server/index.js');
    console.log('✅ 从根目录加载Express应用成功');
} catch (e) {
    try {
        // 如果Root Directory是server目录（api/server.js -> ./index.js，但api在根目录）
        // 需要从server目录向上找到api目录
        app = require(path.join(__dirname, '../server/index.js'));
        console.log('✅ 从server目录加载Express应用成功');
    } catch (e2) {
        console.error('❌ 无法加载Express应用');
        console.error('错误1 (根目录):', e.message);
        console.error('错误2 (server目录):', e2.message);
        // 创建一个简单的错误响应
        app = require('express')();
        app.use((req, res) => {
            res.status(500).json({
                success: false,
                message: '服务器配置错误：无法加载Express应用',
                error: e2.message
            });
        });
    }
}

// Vercel Serverless函数格式
// 直接导出Express app，Vercel会自动处理
module.exports = app;
