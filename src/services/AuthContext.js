import React, { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("accessToken")
  );
  const [user, setUser] = useState(localStorage.getItem("userName") || "");

  const login = (token, email) => {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("userName", email);
    setIsAuthenticated(true);
    setUser(email);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userName");
    setIsAuthenticated(false);
    setUser("");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
