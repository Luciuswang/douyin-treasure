// 简单的测试端点，用于验证Vercel Serverless函数是否正常工作
module.exports = async (req, res) => {
    return res.json({ 
        status: 'ok', 
        message: 'Vercel Serverless函数正常工作！',
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.url
    });
};

