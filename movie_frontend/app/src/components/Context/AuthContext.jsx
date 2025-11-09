import React, { createContext, useContext, useEffect, useState } from "react";
import { Snackbar, Alert } from "@mui/material";

// 🧠 Create the Auth Context
const AuthContext = createContext(null);

// ✅ Custom hook for consuming the context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // ✅ Safe JSON parsing for stored user
  const getStoredUser = () => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored || stored === "undefined") return null;
      return JSON.parse(stored);
    } catch (err) {
      console.error("Failed to parse user from localStorage:", err);
      return null;
    }
  };

  // ✅ Initialize states safely
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" }); // ✅ New snackbar state

  const isAuthenticated = !!token;

  // -----------------------------
  // 🟢 LOGIN HANDLER
  // -----------------------------
  const login = (userData, accessToken) => {
    if (!accessToken) {
      console.warn("⚠️ Missing access token during login");
      return;
    }

    setUser(userData || null);
    setToken(accessToken);
    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(userData || {}));
  };

  // -----------------------------
  // 🔴 LOGOUT HANDLER
  // -----------------------------
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // ✅ Trigger logout Snackbar
    setSnackbar({
      open: true,
      message: "You’ve been logged out successfully!",
      severity: "info",
    });
  };

  // -----------------------------
  // ⏱️ AUTO LOGOUT ON TOKEN EXPIRY
  // -----------------------------
  useEffect(() => {
    if (!token) return;
    try {
      const [, payloadBase64] = token.split(".");
      const payload = JSON.parse(atob(payloadBase64));
      const expiry = payload.exp * 1000;

      if (expiry < Date.now()) {
        console.log("🔒 Token expired — logging out");
        logout();
        setSnackbar({
          open: true,
          message: "Session expired. Please log in again.",
          severity: "warning",
        });
      }
    } catch (err) {
      console.warn("⚠️ Invalid token detected:", err);
      logout();
    }
  }, [token]);

  // -----------------------------
  // 🔕 CLOSE SNACKBAR HANDLER
  // -----------------------------
  const handleCloseSnackbar = () =>
    setSnackbar((prev) => ({ ...prev, open: false }));

  // -----------------------------
  // ✅ CONTEXT VALUE
  // -----------------------------
  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    loading,
    setLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}

      {/* ✅ Global Snackbar (works app-wide) */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AuthContext.Provider>
  );
};
