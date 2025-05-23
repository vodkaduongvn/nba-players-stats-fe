import React, { createContext, useState, useEffect } from "react";
import axiosInstance from "./axiosConfig";
import { jwtDecode } from "jwt-decode"; // Import jwt-decode

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on mount
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user"); // Rename variable
    if (token && userStr) {
      try {
        const storedUser = JSON.parse(userStr);
        // Check if the token is expired before setting state
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp < currentTime) {
          console.log("Token expired on initial load, clearing storage.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        } else {
          setIsAuthenticated(true);
          setUser(storedUser); // Set the full user object from storage
        }
      } catch (e) {
        console.error(
          "Failed to parse user data or token from localStorage",
          e
        );
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (usernameOrEmail, password) => {
    // Changed parameter name
    try {
      // Correct the API endpoint and payload key
      const response = await axiosInstance.post("/api/Auth/login", {
        usernameOrEmail: usernameOrEmail, // Send with the correct key
        password,
      });

      const { token, user: apiUserData } = response.data; // Use response.data
      const decodedToken = jwtDecode(token); // Decode the token

      // Combine API user data and decoded token claims
      const roleClaim =
        decodedToken[
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ];
      // Explicitly extract the username claim
      const usernameClaim =
        decodedToken[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
        ];
      const fullUserData = {
        ...apiUserData, // { id, email, isDonated }
        ...decodedToken, // Add other claims like exp, nameidentifier, etc.
        name: usernameClaim, // Add the username under the 'name' property
        role: roleClaim, // Explicitly add role property
      };

      // Store token and the combined user data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(fullUserData));

      // Update context state with the combined user data
      setIsAuthenticated(true);
      setUser(fullUserData);

      return fullUserData; // Return the combined data
    } catch (error) {
      throw new Error(error.response?.data || "Login failed");
    }
  };

  const logout = () => {
    // Clear stored data
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Update context state
    setIsAuthenticated(false);
    setUser(null);
  };

  const isDonated = () => {
    return user?.isDonated === true;
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    isDonated,
    setUser, // Expose setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
