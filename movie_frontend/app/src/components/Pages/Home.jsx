import { motion } from "framer-motion";
import { Container, Typography, TextField, InputAdornment, Button, Box } from "@mui/material";
import { Search, Ticket, LucideLogIn } from "lucide-react";
import React, { useState } from "react";
import MovieCard from "../MovieCard/MovieCard";  // Adjust path as needed (e.g., '../components/FeaturedMovies')
import { Link } from "react-router-dom";

// Staggered animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const Home = () => {
  const [search, setSearch] = useState("");

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen py-20 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950"
      style={{ position: "relative" }}
    >
      {/* Optional: Subtle background overlay for cinema vibe */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.1)_0%,transparent_50%)]" />
      </div>

      <Container maxWidth="lg">
        {/* Hero Section */}
        <motion.div
          variants={itemVariants}
          className="text-center mb-10"
        >
          <Typography variant="h1" className="text-white mb-4">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent"
            >
              Book Your <span className="text-transparent bg-gradient-to-r from-red-400 to-red-600 bg-clip-text">Next Movie</span>
            </motion.div>
          </Typography>
          <motion.div
            variants={itemVariants}
            className="text-slate-300 mb-12 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed"
          >
            Experience the magic of cinema with seamless ticket booking. Discover blockbuster hits and indie gems in theaters near you.
          </motion.div>

          {/* Enhanced Search Bar */}
          <motion.div variants={itemVariants} className="max-w-md mx-auto mb-8">
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search for movies, theaters, or genres..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search className="text-slate-400 w-5 h-5" />
                    </InputAdornment>
                  )
                }
              }}
              sx={{
                backgroundColor: "white",
                borderRadius: "16px",
                "& .MuiOutlinedInput-root": {
                  borderRadius: "16px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                  transition: "all 0.3s ease",
                  "&:hover": { boxShadow: "0 12px 40px rgba(0,0,0,0.3)" },
                  "&.Mui-focused": { boxShadow: "0 12px 40px rgba(239,68,68,0.3)" }
                }
              }}
            />
          </motion.div>

          {/* Enhanced Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="contained"
              startIcon={<Ticket className="w-5 h-5" />}
              size="large"
              sx={{
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                boxShadow: "0 8px 32px rgba(239,68,68,0.4)",
                padding: "14px 40px",
                borderRadius: "16px",
                textTransform: "none",
                fontSize: "1.1rem",
                fontWeight: 600,
                transition: "all 0.3s ease",
                "&:hover": {
                  background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                  boxShadow: "0 12px 40px rgba(239,68,68,0.6)",
                  transform: "translateY(-2px)"
                }
              }}
            >
              Book Tickets
            </Button>
            <Button
              component={Link} 
              to="/login"
              variant="outlined"
              startIcon={<LucideLogIn className="w-5 h-5" />}
              sx={{
                borderColor: "#ef4444",
                color: "#ef4444",
                padding: "14px 40px",
                borderRadius: "16px",
                textTransform: "none",
                fontSize: "1.1rem",
                fontWeight: 600,
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "rgba(239,68,68,0.1)",
                  borderColor: "#dc2626",
                  color: "#dc2626"
                }
              }}
            >
                Login
            </Button>
          </motion.div>
        </motion.div>

        {/* Render the Separated Featured Movies Component */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
        
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            Featured
          </span>{" "}
          <span className="text-white">Movies</span>
        </h1>
        <p className="text-slate-400 text-base md:text-lg">
          Don't miss out on these upcoming releases!
        </p>
      </div>  
          <MovieCard />
        </motion.div>
      </Container>
    </motion.div>
  );
};

export default Home;