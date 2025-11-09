import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Avatar,
  Button,
  Paper,
  Grid,
  Typography,
  Container,
  Snackbar,
  Alert,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate, useLocation } from "react-router-dom";
import Input from "./Input";
import { useAuth } from "../Context/AuthContext";
import {
  signUp,
  login as loginAPI,
  googleLogin,
} from "../../api/axiosClient"; // ✅ imported from axiosClient

const initialState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const Auth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState(initialState);
  const [message, setMessage] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // 🧠 Show toast if redirected from protected route
  useEffect(() => {
    if (location.state?.from) {
      setOpenSnackbar(true);
    }
  }, [location.state]);

  // ---------------- Handle Manual Signup / Login ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      if (isSignup) {
        // --- SIGNUP ---
        await signUp({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          retype_password: formData.confirmPassword,
        });

        setMessage("Signup successful! Please login.");
        setIsSignup(false);
      } else {
        // --- LOGIN ---
        const loginData = new URLSearchParams();
        loginData.append("username", formData.email);
        loginData.append("password", formData.password);

        const res = await loginAPI(loginData);

        // ✅ handle both normal + google-style tokens
        if (res.data.user) {
          login(res.data.user, res.data.access_token);
        } else {
          login(
            {
              name: formData.email.split("@")[0],
              email: formData.email,
              picture: null,
            },
            res.data.access_token
          );
        }

        setMessage("Login successful!");
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error("Auth error:", error);
      setMessage(
        typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : "Something went wrong, please try again."
      );
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleShowPassword = () => setShowPassword((prev) => !prev);
  const switchMode = () => {
    setIsSignup((prev) => !prev);
    setShowPassword(false);
    setMessage("");
  };

  // ---------------- Google Login ----------------
  const googleSuccess = async (credentialResponse) => {
    try {
      const id_token = credentialResponse.credential;
      console.log("🟢 Google login successful, token received");

      const res = await googleLogin({ id_token });

      login(res.data.user, res.data.access_token);

      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Google Login Error:", err);
      setMessage("Google login failed. Please try again.");
    }
  };

  const googleFailure = (error) => {
    console.error("Google Login Failed:", error);
    setMessage("Google login failed. Try again.");
  };

  // ---------------- Animations ----------------
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  return (
    <>
      {/* ✅ Snackbar for redirect notice */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="info"
          variant="filled"
          sx={{ width: "100%" }}
        >
          You must log in to continue.
        </Alert>
      </Snackbar>

      {/* Main Auth UI */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="min-h-screen py-1 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950"
      >
        <Container
          component="main"
          maxWidth="xs"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
          }}
        >
          <Paper
            elevation={6}
            sx={{
              padding: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              borderRadius: 3,
            }}
          >
            <Avatar
              sx={{ bgcolor: "primary.main", mb: 1.5, width: 56, height: 56 }}
            >
              <LockOutlinedIcon />
            </Avatar>

            <Typography variant="h5" gutterBottom>
              {isSignup ? "Sign Up" : "Sign In"}
            </Typography>

            <form
              onSubmit={handleSubmit}
              style={{ width: "100%", marginTop: "8px" }}
            >
              <Grid container spacing={2}>
                {isSignup && (
                  <>
                    <Input
                      name="firstName"
                      label="First Name"
                      handleChange={handleChange}
                      autoFocus
                      half
                    />
                    <Input
                      name="lastName"
                      label="Last Name"
                      handleChange={handleChange}
                      half
                    />
                  </>
                )}
                <Input
                  name="email"
                  label="Email Address"
                  handleChange={handleChange}
                  type="email"
                />
                <Input
                  name="password"
                  label="Password"
                  handleChange={handleChange}
                  type={showPassword ? "text" : "password"}
                  handleShowPassword={handleShowPassword}
                />
                {isSignup && (
                  <Input
                    name="confirmPassword"
                    label="Repeat Password"
                    handleChange={handleChange}
                    type="password"
                  />
                )}
              </Grid>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 3, mb: 2 }}
              >
                {isSignup ? "Sign Up" : "Sign In"}
              </Button>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "1rem",
                }}
              >
                <GoogleLogin onSuccess={googleSuccess} onError={googleFailure} />
              </div>

              {message && (
                <Typography
                  color={
                    message.toLowerCase().includes("success")
                      ? "green"
                      : "error"
                  }
                  sx={{ textAlign: "center", mt: 1 }}
                >
                  {message}
                </Typography>
              )}

              <Grid container justifyContent="flex-end">
                <Grid>
                  <Button onClick={switchMode}>
                    {isSignup
                      ? "Already have an account? Sign In"
                      : "Don't have an account? Sign Up"}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Container>
      </motion.div>
    </>
  );
};

export default Auth;
