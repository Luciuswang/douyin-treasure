/**
 * Totofun 突突翻 - Service Worker
 * 提供离线缓存、后台同步等 PWA 功能
 */

const CACHE_NAME = 'totofun-cache-v3';
const RUNTIME_CACHE = 'totofun-runtime-v3';

// 需要缓存的核心文件
const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './assets/images/totofun-logo.png',
    './assets/images/icon-192x192.png',
    './assets/images/icon-512x512.png'
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: 安装中...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Service Worker: 缓存核心文件');
                return cache.addAll(CORE_ASSETS);
            })
            .then(() => {
                console.log('✅ Service Worker: 安装完成');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Service Worker: 安装失败', error);
            })
    );
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker: 激活中...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // 删除旧缓存
                        if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                            console.log('🗑️ Service Worker: 删除旧缓存', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker: 激活完成');
                return self.clients.claim();
            })
    );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // 只处理同源请求
    if (url.origin !== location.origin) {
        return;
    }
    
    // 跳过 API 请求和外部资源
    if (url.pathname.startsWith('/api/') || 
        url.hostname.includes('github.com') ||
        url.hostname.includes('deepseek.com') ||
        url.hostname.includes('firebase')) {
        return;
    }
    
    // HTML 请求：网络优先策略（带超时）
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            Promise.race([
                fetch(request, { 
                    cache: 'no-cache',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate'
                    }
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('网络超时')), 5000)
                )
            ])
                .then((response) => {
                    if (response && response.ok) {
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    console.log('使用缓存版本');
                    return caches.match(request);
                })
        );
        return;
    }
    
    // 静态资源：缓存优先策略
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(request)
                    .then((response) => {
                        // 只缓存成功的响应
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }
                        
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                        
                        return response;
                    });
            })
    );
});

// 后台同步（用于离线时保存数据）
self.addEventListener('sync', (event) => {
    console.log('🔄 Service Worker: 后台同步', event.tag);
    
    if (event.tag === 'sync-treasures') {
        event.waitUntil(
            // 这里可以实现离线数据同步逻辑
            Promise.resolve()
        );
    }
});

// 推送通知
self.addEventListener('push', (event) => {
    console.log('🔔 Service Worker: 收到推送', event);
    
    const options = {
        body: event.data ? event.data.text() : '新的宝藏已生成！',
        icon: './assets/images/icon-192x192.png',
        badge: './assets/images/icon-96x96.png',
        vibrate: [200, 100, 200],
        tag: 'totofun-notification',
        requireInteraction: false
    };
    
    event.waitUntil(
        self.registration.showNotification('Totofun 突突翻', options)
    );
});

// 通知点击
self.addEventListener('notificationclick', (event) => {
    console.log('👆 Service Worker: 通知被点击', event);
    
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('./')
    );
});

// 消息处理
self.addEventListener('message', (event) => {
    console.log('💬 Service Worker: 收到消息', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        return caches.delete(cacheName);
                    })
                );
            })
        );
    }
});

