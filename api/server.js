// Vercel Serverless函数入口
// 将Express应用包装为Serverless函数

// 设置Vercel环境变量
process.env.VERCEL = '1';

// 导入Express应用
const app = require('../server/index.js');

// Vercel Serverless函数格式
// 直接导出Express app，Vercel会自动处理
module.exports = app;
