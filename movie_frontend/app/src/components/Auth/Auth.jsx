import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Avatar,
  Button,
  Paper,
  Grid,
  Typography,
  Container,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import Input from "./Input"; // Updated Input component

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
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isSignup) {
        const res = await axios.post("http://localhost:8000/auth/signup", {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          retype_password: formData.confirmPassword, // important
        });
        setMessage("Signup successful! Please login.");
        setIsSignup(false);
      } else {
        // ✅ LOGIN must send form data for OAuth2PasswordRequestForm
        const loginData = new URLSearchParams();
        loginData.append("username", formData.email); // Must be 'username'
        loginData.append("password", formData.password);

        const res = await axios.post("http://localhost:8000/auth/login", loginData, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        localStorage.setItem("token", res.data.access_token);
        localStorage.setItem("username", res.data.username || formData.email);
        navigate("/"); // redirect after login
      }
    } catch (error) {
      console.error("Auth error:", error);
      // ✅ Avoid rendering raw object error
      setMessage(
        typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : "Something went wrong"
      );
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleShowPassword = () =>
    setShowPassword((prevShowPassword) => !prevShowPassword);

  const switchMode = () => {
    setIsSignup((prevIsSignup) => !prevIsSignup);
    setShowPassword(false);
    setMessage("");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const googleSuccess = async (response) => {
    try {
      const decoded = jwtDecode(response?.credential);
      console.log("Google User:", decoded);

      localStorage.setItem("token", response?.credential);
      localStorage.setItem("username", decoded?.name);

      navigate("/");
    } catch (error) {
      console.error("Google Login Error:", error);
    }
  };

  const googleFailure = (error) =>
    console.log("Google-Login Failed! Please try again", error);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen py-1 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950"
      style={{ position: "relative" }}
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
            sx={{
              bgcolor: "primary.main",
              mb: 1.5,
              width: 56,
              height: 56,
            }}
          >
            <LockOutlinedIcon />
          </Avatar>
          <Typography variant="h5" gutterBottom>
            {isSignup ? "Sign Up" : "Sign In"}
          </Typography>

          <form onSubmit={handleSubmit} style={{ width: "100%", marginTop: "8px" }}>
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
                  message.toLowerCase().includes("success") ? "green" : "error"
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
  );
};

export default Auth;
