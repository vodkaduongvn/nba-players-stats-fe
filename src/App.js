import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import { AuthContextProvider, AuthContext } from "./services/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ProtectedRoute = ({ children, redirectTo }) => {
  const { isAuthenticated } = useContext(AuthContext);

  // Nếu chưa đăng nhập và truy cập login hoặc register, cho phép truy cập
  if (
    !isAuthenticated &&
    (redirectTo === "/login" || redirectTo === "/register")
  ) {
    return children;
  }

  // Nếu đã đăng nhập và truy cập login hoặc register, chuyển hướng đến dashboard
  if (
    isAuthenticated &&
    (redirectTo === "/login" || redirectTo === "/register")
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  // Nếu chưa đăng nhập và truy cập các trang khác, chuyển hướng đến dashboard
  if (!isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const App = () => {
  return (
    <AuthContextProvider>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              <ProtectedRoute redirectTo="/login">
                <Login />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <ProtectedRoute redirectTo="/register">
                <Register />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </AuthContextProvider>
  );
};

export default App;
