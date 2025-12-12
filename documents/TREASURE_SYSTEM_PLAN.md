# 🎁 自定义宝藏系统开发计划

> 创建时间：2024年12月12日
> 状态：开发中

## 📊 项目现状

### ✅ 已完成功能
- 🗺️ 高德地图集成、GPS定位、实时追踪
- 👤 用户注册/登录/游客模式
- 💬 好友聊天、AI助手
- 🔥 Firebase实时通信
- 🎁 系统随机宝藏生成

### ⚠️ 待开发功能
- 用户自定义宝藏发布
- 宝藏领取系统
- 前后端API对接

---

## 🎯 核心功能设计

### 宝藏类型

| 类型 | 图标 | 内容示例 | 领取方式 |
|------|------|---------|---------|
| 📝 纸条留言 | 信封 | 写给朋友的话、表白、祝福 | 阅读即领取 |
| 🎫 优惠券 | 票券 | 咖啡券、餐饮折扣、商品优惠 | 出示二维码 |
| 🎬 门票 | 电影票 | 电影票、演出票、展览票 | 兑换码 |
| 💼 招聘 | 公文包 | 招聘信息、实习机会 | 查看详情 |
| 🎉 活动 | 派对帽 | 聚会邀请、活动通知 | 报名参加 |
| 🎁 实物 | 礼盒 | 线下领取物品 | 到店领取 |
| ❓ 谜题 | 问号 | 需要解谜才能打开 | 回答正确 |
| 💌 自定义 | 爱心 | 任意内容 | 自定义 |

### 发布宝藏流程

```
用户点击"发布宝藏"
    ↓
选择宝藏类型
    ↓
填写内容（标题、描述、附件）
    ↓
设置位置（当前位置/地图选点）
    ↓
设置规则（有效期、可领取次数、密码）
    ↓
预览 → 发布
    ↓
保存到后端数据库
```

### 领取宝藏流程

```
用户靠近宝藏位置（30米内）
    ↓
点击宝藏标记
    ↓
查看宝藏详情
    ↓
点击"领取"按钮
    ↓
验证条件（位置/密码/任务）
    ↓
领取成功 → 获得奖励
    ↓
记录领取历史
```

---

## 📝 开发任务清单

### 第一阶段：发布宝藏界面 ⏳ 进行中

- [x] 创建开发计划文档
- [ ] 创建"发布宝藏"按钮
- [ ] 设计发布弹窗UI
- [ ] 实现宝藏类型选择
- [ ] 实现内容输入表单
- [ ] 实现位置选择功能
- [ ] 实现规则设置
- [ ] 对接后端API保存宝藏
- [ ] 在地图上显示用户发布的宝藏

### 第二阶段：领取宝藏功能

- [ ] 创建宝藏详情弹窗
- [ ] 实现位置验证
- [ ] 实现领取逻辑
- [ ] 实现奖励发放
- [ ] 记录领取历史

### 第三阶段：我的宝藏管理

- [ ] 我发布的宝藏列表
- [ ] 编辑宝藏功能
- [ ] 删除宝藏功能
- [ ] 宝藏续期功能
- [ ] 查看领取统计

### 第四阶段：社交互动

- [ ] 宝藏点赞功能
- [ ] 宝藏评论功能
- [ ] 宝藏分享功能
- [ ] 领取后评价

---

## 🗄️ 数据结构

### 后端 Treasure 模型（已有）

```javascript
{
    title: String,           // 标题
    description: String,     // 描述
    creator: ObjectId,       // 创建者
    location: {
        coordinates: [lng, lat],
        address: String,
        discoveryRadius: Number  // 领取半径（米）
    },
    category: String,        // 类型
    rewards: {
        experience: Number,
        coins: Number,
        specialReward: String
    },
    settings: {
        isPublic: Boolean,
        maxDiscoverers: Number,  // 最大领取次数
        expiresAt: Date          // 过期时间
    },
    status: String,          // active/inactive/expired
    discoveredBy: [{         // 领取记录
        user: ObjectId,
        discoveredAt: Date
    }]
}
```

### 前端宝藏类型配置

```javascript
const TREASURE_TYPES = [
    { id: 'note', name: '纸条留言', icon: '📝', color: '#FFB74D' },
    { id: 'coupon', name: '优惠券', icon: '🎫', color: '#4FC3F7' },
    { id: 'ticket', name: '门票', icon: '🎬', color: '#F06292' },
    { id: 'job', name: '招聘信息', icon: '💼', color: '#7986CB' },
    { id: 'event', name: '活动邀请', icon: '🎉', color: '#81C784' },
    { id: 'gift', name: '实物礼品', icon: '🎁', color: '#FF8A65' },
    { id: 'puzzle', name: '谜题挑战', icon: '❓', color: '#BA68C8' },
    { id: 'custom', name: '自定义', icon: '💌', color: '#E57373' }
];
```

---

## 📁 相关文件

- **前端主页**: `index.html`
- **后端宝藏模型**: `server/models/Treasure.js`
- **后端宝藏路由**: `server/routes/treasures.js`
- **样式文件**: `src/css/components.css`

---

## 🔗 API 接口

### 创建宝藏
```
POST /api/treasures
Body: { title, description, location, category, settings }
```

### 获取附近宝藏
```
GET /api/treasures?lat=31.23&lng=121.47&radius=5000
```

### 领取宝藏
```
POST /api/treasures/:id/discover
Body: { proof, location }
```

### 获取我发布的宝藏
```
GET /api/treasures/my
```

