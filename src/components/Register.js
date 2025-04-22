import React, { useState, useContext } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../services/AuthContext"; // Import AuthContext
import api from "../services/axiosConfig.js"; // Import file cấu hình Axios
import { FiRefreshCw, FiCopy } from "react-icons/fi"; // Import icons

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext); // Get login function from context
  const navigate = useNavigate();

  // --- Generator & Copy Functions ---
  const generatePassword = () => {
    const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Copied to clipboard!", { autoClose: 1000 });
      })
      .catch((err) => {
        toast.error("Failed to copy!");
        console.error("Failed to copy text: ", err);
      });
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setPassword(newPassword);
    // Removed setting confirmPassword state
  };

  const handleCopyEmail = () => {
    copyToClipboard(email);
  };

  const handleCopyPassword = () => {
    copyToClipboard(password);
  };

  // --- Generator Function for Username ---
  const generateUsername = () => {
    // Generates a 9-digit random number as a string
    return Math.floor(100000000 + Math.random() * 900000000).toString();
  };
  const handleGenerateUsername = () => {
    setEmail(generateUsername()); // Set the generated username to the email state field
  };
  // --- End Functions ---

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Password confirmation check removed here

      const response = await api.post("api/Auth/register", {
        email, // Sending the value from the first input (which might be email or generated username)
        password,
        // Backend might expect ConfirmPassword, adjust if needed based on RegisterModel.cs
        // confirmPassword: confirmPassword
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

        {/* Email/Username Input with Refresh and Copy Buttons */}
        <div className="mb-4 flex items-center space-x-2">
          <input
            type="text" // Changed type
            placeholder="Email or Username" // Changed placeholder
            className="flex-grow p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // Still uses setEmail
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            onClick={handleGenerateUsername} // Added Refresh handler
            className="p-2 text-gray-600 hover:text-blue-500"
            title="Generate Username"
          >
            <FiRefreshCw size={20} />
          </button>
          <button
            type="button"
            onClick={handleCopyEmail} // Kept Copy handler
            className="p-2 text-gray-600 hover:text-blue-500"
            title="Copy Email"
          >
            <FiCopy size={20} />
          </button>
        </div>

        {/* Password Input with Refresh and Copy Buttons */}
        <div className="mb-4 flex items-center space-x-2">
          <input
            type="text"
            placeholder="Password"
            className="flex-grow p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            onClick={handleGeneratePassword}
            className="p-2 text-gray-600 hover:text-blue-500"
            title="Generate Password"
          >
            <FiRefreshCw size={20} />
          </button>
          <button
            type="button"
            onClick={handleCopyPassword}
            className="p-2 text-gray-600 hover:text-blue-500"
            title="Copy Password"
          >
            <FiCopy size={20} />
          </button>
        </div>

        {/* Confirm Password Input - Removed */}

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
