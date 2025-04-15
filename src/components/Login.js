import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../services/AuthContext"; // Import AuthContext
import api from "../services/axiosConfig.js"; // Import file cấu hình Axios
import { toast } from "react-toastify";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext); // Lấy hàm login từ AuthContext
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userData = await login(email, password);
      console.log(userData);
      // Check isDonated status and navigate accordingly
      // if (userData && userData.isDonated) {
      //   navigate('/dashboard');
      // } else {
      //   navigate('/donation');
      // }
    } catch (error) {
      if (
        error.response?.status === 401 &&
        error.response?.data?.detail === "Failed"
      ) {
        toast.error("Incorrect email or password!");
      } else {
        toast.error("An error occurred. Please try again!");
      }
    }
  };

  // Handle Enter key press in input fields
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      // We need to manually trigger the form submission logic here.
      // Since handleLogin expects an event, we can simulate one or just call the core logic.
      // Let's call handleLogin directly, assuming it doesn't strictly need the form event 'e'
      // after preventDefault(). If it does, we might need a ref to the form to call requestSubmit().
      handleLogin(event); // Pass the keyboard event, handleLogin has preventDefault
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-96"
      >
        <h2 className="text-xl font-bold mb-4">Login</h2>
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-2 border"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown} // Add onKeyDown handler
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-2 border"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown} // Add onKeyDown handler
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Login
        </button>
        <p className="mt-4">
          Don't have an account?
          <a href="/register" className="text-blue-600">
            &nbsp; Register
          </a>
        </p>
      </form>
    </div>
  );
};

export default Login;
