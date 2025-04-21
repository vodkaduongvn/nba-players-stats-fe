import axios from "axios";
import { jwtDecode } from "jwt-decode";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5087", // URL của backend API
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor cho request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
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
    if (response.config.url === "/api/auth/login" && response.data.token) {
      const token = response.data.token;
      const decodedToken = jwtDecode(token);
      localStorage.setItem("token", token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...response.data.user,
          ...decodedToken,
        })
      );
    }
    return response;
  },
  (error) => {
    // Check for 401 Unauthorized error
    if (error.response?.status === 401) {
      // Check if the error occurred during login attempt (no token) vs expired session (token exists)
      const tokenExists = localStorage.getItem("token");
      // Only redirect if a token existed (indicating an expired session, not a failed login)
      if (tokenExists) {
        console.log("Token expired or invalid, redirecting to login.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Use navigate or clear state instead of hard refresh if possible,
        // but for simplicity, window.location.href is used here.
        window.location.href = "/login";
      }
      // If no token existed, it's likely a login failure. Don't redirect here.
      // Let the calling component (e.g., Login.js) handle the error display.
    }
    // For all errors (including the 401 during login), reject the promise
    // so the calling code's catch block can execute.
    return Promise.reject(error);
  }
);

// Helper functions
export const getDecodedToken = () => {
  const token = localStorage.getItem("token");
  if (token) {
    return jwtDecode(token);
  }
  return null;
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  const decodedToken = jwtDecode(token);
  const currentTime = Date.now() / 1000;

  return decodedToken.exp > currentTime;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

export default axiosInstance;
