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
import Admin from "./components/Admin"; // Import the Admin component
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

  // If not authenticated and trying to access a protected route, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />; // Change redirect to /login
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
          {/* Add the route for the Admin component */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute redirectTo="/admin">
                {" "}
                {/* Protect the admin route */}
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </AuthContextProvider>
  );
};

export default App;
