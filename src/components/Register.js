import React, { useState, useContext } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../services/AuthContext"; // Import AuthContext
import api from "../services/axiosConfig.js"; // Import file cấu hình Axios

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext); // Get login function from context
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("api/Auth/register", {
        email,
        password,
      });
      console.log("res:", response);
      console.log("status", response.status);
      if (response.status === 200) {
        console.log("Registration successful, attempting auto-login...");
        // Instead of navigating directly, call login to authenticate and then navigate
        try {
          await login(email, password);
          // login function in AuthContext should handle navigation on success
          toast.success("Registration and login successful!");
        } catch (loginError) {
          // Handle login specific errors if needed, otherwise login context might show a toast
          console.error("Auto-login after registration failed:", loginError);
          toast.error(
            "Registration successful, but auto-login failed. Please log in manually."
          );
          navigate("/login"); // Redirect to login page if auto-login fails
        }
      }
    } catch (error) {
      // Handle registration errors (e.g., email already exists)
      if (error.response?.data) {
        handleValidationErrors(error.response.data);
      } else {
        toast.error("Registration failed. Please try again.");
        console.error("Registration error:", error);
      }
    }
  };

  // Handle Enter key press in input fields
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleRegister(event); // Call the registration handler
    }
  };

  function handleValidationErrors(errorData) {
    const { message, errors } = errorData;

    if (errors) {
      const messages = Object.values(errors).flatMap((messages) => messages);

      toast.error(messages.join("\n"));
    } else {
      toast.error(message || "Validation error occurred.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded shadow-md w-96"
      >
        <h2 className="text-xl font-bold mb-4">Register</h2>
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
          Register
        </button>
        <p className="mt-4">
          Already have an account?
          <a href="/login" className="text-blue-600">
            &nbsp; Login
          </a>
        </p>
      </form>
    </div>
  );
};

export default Register;
