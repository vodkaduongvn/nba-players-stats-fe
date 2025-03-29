import React, { useState, useContext } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../services/AuthContext";
import api from "../services/axiosConfig.js"; // Import file cấu hình Axios

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  //const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/register", {
        email,
        password,
      });
      console.log("res:", response);
      console.log("status", response.status);
      if (response.status === 200) {
        // const accessToken = response.data.accessToken;
        // localStorage.setItem("accessToken", accessToken); // Lưu token
        //login(accessToken, email);
        console.log("status", response.status);
        navigate("/dashboard"); // Điều hướng về trang đăng nhập
      }
    } catch (error) {
      handleValidationErrors(error.response.data);
    }
  };
  function handleValidationErrors(errorData) {
    const { title, errors } = errorData;

    // Duyệt qua các lỗi validation và hiển thị chúng
    if (errors) {
      const messages = Object.values(errors).flatMap((messages) => messages);

      // Hiển thị các lỗi mà không kèm trường
      toast.error(messages.join("\n"));
    } else {
      toast.error(title || "Validation error occurred.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded shadow-md w-96"
      >
        <h2 className="text-xl font-bold mb-4">Đăng ký</h2>
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
          Đăng ký
        </button>
        <p className="mt-4">
          Đã có tài khoản?{" "}
          <a href="/login" className="text-blue-600">
            Đăng nhập
          </a>
        </p>
      </form>
    </div>
  );
};

export default Register;
