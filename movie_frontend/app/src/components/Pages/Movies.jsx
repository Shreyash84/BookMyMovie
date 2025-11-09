import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getCurrentlyShowingMovies, getUpcomingMovies } from "../../api/axiosClient";
import { Film, Calendar, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

// ✨ Animation Variants
const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const gridVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const Movies = () => {
  const [nowPlaying, setNowPlaying] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🧠 Fetch movie data
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const [nowRes, upcomingRes] = await Promise.all([
          getCurrentlyShowingMovies(),
          getUpcomingMovies(),
        ]);

        setNowPlaying(nowRes.data || []);
        setUpcoming(upcomingRes.data || []);
      } catch (err) {
        console.error("❌ Error fetching movies:", err);
        setError("Failed to load movies. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-300 gap-3">
        <Loader2 className="animate-spin w-7 h-7 text-red-400" />
        <p className="animate-pulse text-sm tracking-wider">Loading movies...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-red-400">
        {error}
      </div>
    );

  return (
    <div className="bg-slate-900 text-white min-h-screen py-16 px-6 overflow-hidden">
      <motion.div
        className="max-w-7xl mx-auto"
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.3 }}
      >
        {/* 🎥 Now Showing */}
        <MovieSection
          title="Now Showing"
          icon={<Film className="text-green-400 w-7 h-7" />}
          movies={nowPlaying}
          delay={0.1}
        />

        {/* 🎬 Coming Soon */}
        <MovieSection
          title="Coming Soon"
          icon={<Calendar className="text-yellow-400 w-7 h-7" />}
          movies={upcoming}
          delay={0.3}
        />
      </motion.div>
    </div>
  );
};

// 🎞️ Movie Section Component (with Cinematic Split Text Header)
const MovieSection = ({ title, icon, movies, delay }) => (
  <motion.section
    variants={sectionVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.2 }}
    transition={{ delay }}
    className="mb-24"
  >
    {/* 🔥 Cinematic Split-Text Title (Side by Side Layout) */}
    <motion.div
      className="flex items-center justify-center gap-4 mb-16 overflow-visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.05, delayChildren: 0.2 },
        },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* 🎞️ Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 2, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex-shrink-0 pb-3 pr-1"
      >
        {icon}
      </motion.div>

      {/* 🅰️ Split-Text Animation */}
      <motion.h2
        className="text-center text-5xl md:text-6xl font-extrabold tracking-wide leading-none pb-3"
        style={{ marginBottom: "0.4rem" }}
      >
        {title.split("").map((char, index) => (
          <motion.span
            key={index}
            variants={{
              hidden: { y: 50, opacity: 0 },
              visible: {
                y: 0,
                opacity: 1,
                transition: { duration: 0.4, ease: "easeOut" },
              },
            }}
            className={`pb-3 inline-block text-transparent bg-gradient-to-r from-red-400 via-red-500 to-red-700 bg-clip-text drop-shadow-[0_0_18px_rgba(255,0,0,0.7)] ${
              char === " " ? "mx-2" : ""
            }`}
          >
            {char}
          </motion.span>
        ))}
      </motion.h2>
    </motion.div>

    {/* 🎞️ Movie Grid */}
    {movies.length === 0 ? (
      <motion.p
        className="text-slate-400 text-center italic"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        No movies found in this category.
      </motion.p>
    ) : (
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10"
        variants={gridVariants}
        initial="hidden"
        animate="visible"
      >
        {movies.map((movie) => (
          <motion.div
            key={movie.id}
            variants={cardVariants}
            whileHover={{
              scale: 1.05,
              y: -8,
              boxShadow:
                "0px 0px 35px rgba(255, 0, 0, 0.6), 0px 0px 70px rgba(255, 50, 50, 0.35)",
              transition: { duration: 0.3, ease: "easeOut" },
            }}
            className="relative bg-slate-800/50 border border-slate-700/50 hover:border-red-500/70 rounded-2xl overflow-hidden backdrop-blur-sm cursor-pointer group transition-all duration-300"
          >
            <Link to={`/movie/${movie.id}`}>
              {/* Poster */}
              <motion.div
                className="relative overflow-hidden h-[420px]"
                whileHover={{ scale: 1.02 }}
              >
                <img
                  src={
                    movie.poster_url ||
                    "https://via.placeholder.com/300x400?text=No+Poster"
                  }
                  alt={movie.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent opacity-80 group-hover:opacity-90 transition duration-500" />
              </motion.div>

              {/* Info */}
              <motion.div
                className="absolute bottom-0 w-full p-5 bg-gradient-to-t from-slate-900/95 via-slate-900/60 to-transparent"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-lg font-semibold line-clamp-1 mb-1">
                  {movie.title}
                </h3>
                <p className="text-sm text-slate-400 line-clamp-2 mb-2">
                  {movie.description || "No description available."}
                </p>

                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>⭐ {movie.rating || "N/A"}</span>
                  <span>
                    {movie.release_date
                      ? new Date(movie.release_date).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )
                      : "TBA"}
                  </span>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    )}
  </motion.section>
);

export default Movies;
