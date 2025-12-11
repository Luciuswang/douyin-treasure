/**
 * Totofun 突突翻 - 本地存储管理
 * 提供统一的本地存储接口
 */

const storageManager = {
    /**
     * 保存数据到 localStorage
     * @param {string} key - 存储键名
     * @param {any} data - 要存储的数据
     * @returns {boolean} 是否成功
     */
    save: (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('存储失败:', error);
            return false;
        }
    },

    /**
     * 从 localStorage 读取数据
     * @param {string} key - 存储键名
     * @returns {any} 存储的数据，如不存在返回 null
     */
    load: (key) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('读取失败:', error);
            return null;
        }
    },

    /**
     * 从 localStorage 删除数据
     * @param {string} key - 存储键名
     * @returns {boolean} 是否成功
     */
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('删除失败:', error);
            return false;
        }
    },

    /**
     * 清空所有 localStorage 数据
     * @returns {boolean} 是否成功
     */
    clear: () => {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('清空失败:', error);
            return false;
        }
    },

    /**
     * 检查 localStorage 是否可用
     * @returns {boolean} 是否可用
     */
    isAvailable: () => {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
};

// ==================== 用户数据存储 ====================

/**
 * 保存用户数据
 */
function saveUserData() {
    userData.lastActiveAt = new Date();
    storageManager.save('totofun_userData', userData);
    
    // 同步到 Firebase (如果启用)
    if (firebaseEnabled && database && userData.username) {
        try {
            database.ref(`users/${userData.username}/data`).set({
                level: userData.level,
                stats: userData.stats,
                lastActiveAt: userData.lastActiveAt.toISOString()
            });
        } catch (error) {
            console.error('Firebase同步失败:', error);
        }
    }
}

/**
 * 加载用户数据
 */
function loadUserData() {
    const saved = storageManager.load('totofun_userData');
    if (saved) {
        userData = { ...userData, ...saved };
        if (saved.lastActiveAt) {
            userData.lastActiveAt = new Date(saved.lastActiveAt);
        }
        console.log('✅ 用户数据已加载');
    }
}

console.log('✅ storage.js 加载完成');

