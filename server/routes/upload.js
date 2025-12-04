const express = require('express');
const router = express.Router();

/**
 * @route   POST /api/upload/image
 * @desc    上传图片（占位路由，待实现）
 * @access  Private
 */
router.post('/image', (req, res) => {
    // 暂时返回占位响应
    // TODO: 实现文件上传功能（需要multer包）
    res.status(501).json({
        success: false,
        message: '文件上传功能暂未实现'
    });
});

module.exports = router;

module.exports = router;

