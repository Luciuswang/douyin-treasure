const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

let multer;
try {
    multer = require('multer');
} catch {
    console.warn('⚠️ multer 未安装，文件上传功能不可用。请运行 npm install multer');
}

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

if (!multer) {
    router.post('/image', (req, res) => {
        res.status(503).json({ success: false, message: '文件上传服务未就绪，请联系管理员安装 multer' });
    });
    router.post('/images', (req, res) => {
        res.status(503).json({ success: false, message: '文件上传服务未就绪' });
    });
    module.exports = router;
    return;
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${unique}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|gif|webp)$/;
    cb(null, allowed.test(file.mimetype));
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

/**
 * POST /api/upload/image
 * 上传单张图片
 */
router.post('/image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: '请上传有效的图片文件（jpg/png/gif/webp, <=10MB）' });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ success: true, data: { url, filename: req.file.filename, size: req.file.size } });
});

/**
 * POST /api/upload/images
 * 上传多张图片（最多 9 张）
 */
router.post('/images', upload.array('images', 9), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: '请上传有效的图片文件' });
    }
    const files = req.files.map(f => ({
        url: `/uploads/${f.filename}`,
        filename: f.filename,
        size: f.size
    }));
    res.json({ success: true, data: files });
});

module.exports = router;
