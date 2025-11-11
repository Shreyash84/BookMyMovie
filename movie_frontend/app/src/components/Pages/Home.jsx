import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Container,
  Typography,
  TextField,
  InputAdornment,
  Button,
} from "@mui/material";
import { Search, Ticket, LucideLogIn } from "lucide-react";
import { Link } from "react-router-dom";
import MovieCard from "../MovieCard/MovieCard";
import { getTopRatedMovies } from "../../api/axiosClient"; // ✅ import featured movies API

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

const Home = () => {
  const [search, setSearch] = useState("");
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🎬 Fetch featured (top-rated) movies for home
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await getTopRatedMovies(8);
        setFeaturedMovies(res.data || []);
      } catch (error) {
        console.error("❌ Error fetching featured movies:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen py-20 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 relative"
    >
      {/* Background overlay for cinema vibe */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.1)_0%,transparent_50%)]" />
      </div>

      <Container maxWidth="lg">
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="text-center mb-10">
          <Typography variant="h1" className="text-white mb-4">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent"
            >
              Book Your{" "}
              <span className="text-transparent bg-gradient-to-r from-red-400 to-red-600 bg-clip-text">
                Next Movie
              </span>
            </motion.div>
          </Typography>

          <motion.div
            variants={itemVariants}
            className="text-slate-300 mb-12 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed"
          >
            Experience the magic of cinema with seamless ticket booking.
            Discover blockbuster hits and indie gems in theaters near you.
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Button
              variant="contained"
              startIcon={<Ticket className="w-5 h-5" />}
              size="large"
              sx={{
                background:
                  "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                boxShadow: "0 8px 32px rgba(239,68,68,0.4)",
                padding: "14px 40px",
                borderRadius: "16px",
                textTransform: "none",
                fontSize: "1.1rem",
                fontWeight: 600,
                transition: "all 0.3s ease",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                  boxShadow: "0 12px 40px rgba(239,68,68,0.6)",
                  transform: "translateY(-2px)",
                },
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
                  color: "#dc2626",
                },
              }}
            >
              Login
            </Button>
          </motion.div>
        </motion.div>

        {/* Featured Movies Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                Featured
              </span>{" "}
              <span className="text-white">Movies</span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg">
              Don’t miss these top-rated picks from our collection!
            </p>
          </div>

          {loading ? (
            <div className="text-center text-slate-400 mt-4 animate-pulse">
              Loading featured movies...
            </div>
          ) : (
            <MovieCard movies={featuredMovies} />
          )}
        </motion.div>
      </Container>
    </motion.div>
  );
};

export default Home;
