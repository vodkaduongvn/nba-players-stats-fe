import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:5087',  // URL của backend API
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor cho request
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor cho response
axiosInstance.interceptors.response.use(
    (response) => {
        if (response.config.url === '/api/auth/login' && response.data.token) {
            const token = response.data.token;
            const decodedToken = jwtDecode(token);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({
                ...response.data.user,
                ...decodedToken
            }));
        }
        return response;
    },
    (error) => {
        // Xử lý khi token hết hạn
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Helper functions
export const getDecodedToken = () => {
    const token = localStorage.getItem('token');
    if (token) {
        return jwtDecode(token);
    }
    return null;
};

export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        return JSON.parse(userStr);
    }
    return null;
};

export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    return decodedToken.exp > currentTime;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
};

export default axiosInstance;