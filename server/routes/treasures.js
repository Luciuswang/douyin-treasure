const express = require('express');
const router = express.Router();
const Treasure = require('../models/Treasure');

/**
 * @route   GET /api/treasures
 * @desc    获取宝藏列表
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        const { lat, lng, radius = 5000 } = req.query;
        
        let query = {};
        
        // 如果提供了位置信息，查找附近的宝藏
        if (lat && lng) {
            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(radius)
                }
            };
        }
        
        const treasures = await Treasure.find(query)
            .populate('creator', 'username avatar')
            .limit(50)
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: treasures
        });
    } catch (error) {
        console.error('获取宝藏列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * @route   POST /api/treasures
 * @desc    创建新宝藏
 * @access  Private
 */
router.post('/', async (req, res) => {
    try {
        const { name, description, location, reward } = req.body;
        
        if (!name || !location) {
            return res.status(400).json({
                success: false,
                message: '名称和位置是必填项'
            });
        }
        
        const treasure = new Treasure({
            name,
            description,
            location: {
                type: 'Point',
                coordinates: [location.lng, location.lat]
            },
            reward: reward || {},
            creator: req.user.id
        });
        
        await treasure.save();
        
        res.status(201).json({
            success: true,
            data: treasure
        });
    } catch (error) {
        console.error('创建宝藏错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

module.exports = router;

