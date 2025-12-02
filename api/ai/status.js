// Vercel Serverless Function for AI Status Check

const DEEPSEEK_API_KEY = 'sk-d16822cef3994518bdd4977401edd3ec';

export default async function handler(req, res) {
    // 只允许 GET 请求
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method Not Allowed'
        });
    }

    return res.status(200).json({
        success: true,
        available: !!DEEPSEEK_API_KEY && DEEPSEEK_API_KEY !== '',
        message: DEEPSEEK_API_KEY ? 'AI服务已配置' : 'AI服务未配置'
    });
}

