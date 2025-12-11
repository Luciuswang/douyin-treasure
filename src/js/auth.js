/**
 * Totofun 突突翻 - 认证服务
 * 用户注册、登录、登出等认证功能
 */

const authService = {
    // 获取当前token
    getToken() {
        return storageManager.load('auth_token');
    },

    // 保存token
    saveToken(token) {
        storageManager.save('auth_token', token);
    },

    // 获取用户信息
    getUser() {
        return storageManager.load('auth_user');
    },

    // 保存用户信息
    saveUser(user) {
        storageManager.save('auth_user', user);
    },

    // 检查是否已登录
    isLoggedIn() {
        const token = this.getToken();
        const user = this.getUser();
        return !!(token && user);
    },

    // 注册
    async register(username, email, password) {
        try {
            const baseUrl = API_CONFIG.BASE_URL;
            const apiUrl = baseUrl + API_CONFIG.ENDPOINTS.REGISTER;
            console.log('📡 注册请求URL:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            if (!response.ok) {
                let errorMessage = '注册失败';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.errors?.join(', ') || `服务器错误 (${response.status})`;
                } catch (e) {
                    errorMessage = `服务器错误 (${response.status} ${response.statusText})`;
                }
                return { success: false, message: errorMessage };
            }

            const data = await response.json();
            
            if (data.success) {
                this.saveToken(data.data.tokens.accessToken);
                if (data.data.tokens.refreshToken) {
                    this.saveRefreshToken(data.data.tokens.refreshToken);
                }
                this.saveUser(data.data.user);
                return { success: true, user: data.data.user };
            } else {
                return { success: false, message: data.message || '注册失败' };
            }
        } catch (error) {
            console.error('注册错误:', error);
            return { success: false, message: `网络错误: ${error.message}` };
        }
    },

    // 登录
    async login(email, password) {
        try {
            const apiUrl = API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.LOGIN;
            console.log('📡 登录请求URL:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                let errorMessage = '登录失败';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || `服务器错误 (${response.status})`;
                } catch (e) {
                    errorMessage = `服务器错误 (${response.status})`;
                }
                return { success: false, message: errorMessage };
            }

            const data = await response.json();
            
            if (data.success) {
                this.saveToken(data.data.tokens.accessToken);
                if (data.data.tokens.refreshToken) {
                    this.saveRefreshToken(data.data.tokens.refreshToken);
                }
                this.saveUser(data.data.user);
                return { success: true, user: data.data.user };
            } else {
                return { success: false, message: data.message || '登录失败' };
            }
        } catch (error) {
            console.error('登录错误:', error);
            return { success: false, message: `网络错误: ${error.message}` };
        }
    },

    // 登出
    async logout() {
        try {
            const token = this.getToken();
            if (token) {
                try {
                    await fetch(API_CONFIG.BASE_URL + '/api/auth/logout', {
                        method: 'POST',
                        headers: this.getAuthHeaders()
                    });
                } catch (error) {
                    console.error('登出API调用失败:', error);
                }
            }
            
            storageManager.remove('auth_token');
            storageManager.remove('auth_user');
            storageManager.remove('refresh_token');
            location.reload();
        } catch (error) {
            console.error('登出错误:', error);
            storageManager.remove('auth_token');
            storageManager.remove('auth_user');
            storageManager.remove('refresh_token');
            location.reload();
        }
    },

    // 获取当前用户信息（从服务器）
    async getCurrentUser() {
        try {
            const token = this.getToken();
            if (!token) return null;

            const response = await fetch(API_CONFIG.BASE_URL + '/api/auth/me', {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            const data = await response.json();
            
            if (data.success && data.data.user) {
                this.saveUser(data.data.user);
                return data.data.user;
            } else {
                if (response.status === 401) {
                    this.logout();
                }
                return null;
            }
        } catch (error) {
            console.error('获取用户信息错误:', error);
            return null;
        }
    },

    // 刷新token
    async refreshToken() {
        try {
            const refreshToken = storageManager.load('refresh_token');
            if (!refreshToken) return false;

            const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.REFRESH, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            const data = await response.json();
            
            if (data.success && data.data.accessToken) {
                this.saveToken(data.data.accessToken);
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('刷新token错误:', error);
            return false;
        }
    },

    // 保存刷新token
    saveRefreshToken(token) {
        storageManager.save('refresh_token', token);
    },

    // 获取认证请求头
    getAuthHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }
};

console.log('✅ auth.js 加载完成');

