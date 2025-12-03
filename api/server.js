// Vercel Serverless函数包装器
// 将Express应用包装为Serverless函数

const express = require('express');
const server = require('../server/index.js');

// 导出为Vercel Serverless函数
module.exports = server.app || server;

