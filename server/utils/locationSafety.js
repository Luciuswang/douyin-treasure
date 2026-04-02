const https = require('https');

const AMAP_KEY = process.env.VITE_AMAP_KEY || process.env.AMAP_SERVER_KEY || 'a4fdcddda4024a6a4df12431a7e6c536';

const DANGEROUS_KEYWORDS = [
    '河流', '湖泊', '水库', '海域', '池塘', '水渠', '运河',
    '高速公路', '铁路', '高架', '立交桥', '隧道', '收费站',
    '施工', '工地', '军事', '靶场', '禁区', '变电站', '核电'
];

function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, res => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch { reject(new Error('JSON 解析失败')); }
            });
        });
        req.on('error', reject);
        req.setTimeout(5000, () => { req.destroy(); reject(new Error('请求超时')); });
    });
}

/**
 * 服务端位置安全检测 — 调用高德逆地理编码 REST API
 * @returns {{ safe: boolean, reason?: string, detail?: string }}
 */
async function checkLocationSafety(lng, lat) {
    try {
        const url = `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_KEY}&location=${lng},${lat}&extensions=all&radius=200`;
        const result = await fetchJSON(url);

        if (result.status !== '1' || !result.regeocode) {
            return { safe: true };
        }

        const desc = result.regeocode.formatted_address || '';
        const component = result.regeocode.addressComponent || {};
        const pois = result.regeocode.pois || [];
        const roads = result.regeocode.roads || [];

        for (const poi of pois.slice(0, 10)) {
            const name = poi.name || '';
            const poiType = poi.type || '';
            for (const keyword of DANGEROUS_KEYWORDS) {
                if (name.includes(keyword) || poiType.includes(keyword)) {
                    return { safe: false, reason: 'dangerous_poi', detail: `附近有危险区域：${name}` };
                }
            }
        }

        for (const road of roads.slice(0, 5)) {
            const name = road.name || '';
            if (name.includes('高速') || name.includes('快速路')) {
                return { safe: false, reason: 'highway', detail: `附近为高速公路：${name}` };
            }
        }

        const allText = desc + ' ' + (component.township || '');
        for (const keyword of DANGEROUS_KEYWORDS) {
            if (allText.includes(keyword)) {
                return { safe: false, reason: 'dangerous_area', detail: `该区域可能存在危险：${keyword}` };
            }
        }

        return { safe: true };
    } catch (e) {
        console.warn('服务端安全检测失败，放行:', e.message);
        return { safe: true };
    }
}

module.exports = { checkLocationSafety };
