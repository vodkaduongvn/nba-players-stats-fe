import React, { createContext, useState, useEffect } from "react";
import axiosInstance from "./axiosConfig";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on mount
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post("/api/auth/login", {
        email,
        password,
      });

      const { token, user: userData } = response?.data;
      
      // Store token and user data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      
      // Update context state
      setIsAuthenticated(true);
      setUser(userData);

      return userData;
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

  // const isDonated = () => {
  //   return user?.isDonated === true;
  // };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    // isDonated
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 