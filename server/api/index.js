// Vercel Serverless函数入口
// 这个文件会被Vercel自动识别为/api路由

const app = require('../index.js');

// Vercel Serverless函数格式 - 导出为handler
module.exports = app;


