import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/axiosConfig.js"; // Import file cấu hình Axios

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/login", {
        email,
        password,
      });

      if (response.status === 200) {
        console.log(response);
        localStorage.setItem("accessToken", response.data.accessToken); // Lưu token
        navigate("/dashboard"); // Điều hướng về dashboard
      }
    } catch (error) {
      alert("Đăng nhập thất bại!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-96"
      >
        <h2 className="text-xl font-bold mb-4">Đăng nhập</h2>
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-2 border"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          className="w-full mb-4 p-2 border"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Đăng nhập
        </button>
        <p className="mt-4">
          Chưa có tài khoản?{" "}
          <a href="/register" className="text-blue-600">
            Đăng ký
          </a>
        </p>
      </form>
    </div>
  );
};

export default Login;
