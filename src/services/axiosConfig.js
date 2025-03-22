import axios from "axios";
import { toast } from "react-toastify";

const baseUrl = "http://localhost:5087"; // Thay bằng URL API của bạn

// Tạo một instance của Axios
const api = axios.create({
  baseURL: baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Gắn token vào header Authorization
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken"); // Lấy token từ localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Gắn token vào header
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Xử lý lỗi và tự động refresh token nếu cần
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      const errorMessage =
        error.response?.data?.detail || "Unauthorized access";

      // Nếu là lỗi xác thực đăng nhập
      if (errorMessage === "Failed") {
        toast.error("Sai tên đăng nhập hoặc mật khẩu!"); // Hiển thị lỗi cụ thể
      } else {
        toast.error(errorMessage); // Hiển thị lỗi khác (nếu có)
      }

      localStorage.removeItem("accessToken"); // Xóa token khi hết hạn
    }
    return Promise.reject(error);
  }
);

export default api;
