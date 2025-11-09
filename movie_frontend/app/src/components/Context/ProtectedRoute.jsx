import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext"; // ✅ Access global auth state

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const location = useLocation();

  // 🧠 If not authenticated, redirect to login page
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // ✅ Otherwise, render the protected page
  return children;
};

export default ProtectedRoute;
