import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Clock, Globe, Film, Calendar, Ticket } from "lucide-react";
import { getMovieById } from "../../api/axiosClient"; // ✅ centralized import

const MovieDetails = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await getMovieById(id);
        setMovie(res.data);
      } catch (error) {
        console.error("❌ Error fetching movie:", error);
      }
    };
    fetchMovie();
  }, [id]);

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xl"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  const formattedReleaseDate = movie.release_date
    ? new Date(movie.release_date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "TBA";

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      {/* Hero Banner */}
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/20 to-transparent" />
        <div className="absolute inset-0 bg-red-600/5" />
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex items-end h-full px-6 md:px-12 py-8"
        >
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-6xl font-extrabold mb-4 drop-shadow-lg">
              {movie.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-slate-200 mb-6">
              <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold">{movie.rating || "N/A"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-red-400" />
                <span>{movie.duration || "N/A"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4 text-blue-400" />
                <span>{movie.language || "N/A"}</span>
              </div>
            </div>

            {/* ✅ "View Showtimes" Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/showtimes/${movie.id}`)}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg transition"
            >
              <Ticket className="w-5 h-5" />
              View Showtimes
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Description Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Film className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-semibold">Synopsis</h2>
          </div>
          <p className="text-slate-300 leading-relaxed text-lg">
            {movie.description || "No description available."}
          </p>
        </motion.div>

        {/* Details Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Poster Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-800/30"
          >
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-full h-96 object-cover"
            />
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Poster</h3>
              <p className="text-slate-400 text-sm">
                Official artwork for {movie.title}
              </p>
            </div>
          </motion.div>

          {/* Info Cards */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-slate-800/50 rounded-xl border border-slate-700 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-red-400" />
                <h3 className="text-xl font-semibold">Release Date</h3>
              </div>
              <p className="text-2xl font-bold text-white">
                {formattedReleaseDate}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-slate-800/50 rounded-xl border border-slate-700 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-red-400" />
                <h3 className="text-xl font-semibold">Duration</h3>
              </div>
              <p className="text-xl font-bold text-white">
                {movie.duration || "N/A"} min
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-slate-800/50 rounded-xl border border-slate-700 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-5 h-5 text-red-400" />
                <h3 className="text-xl font-semibold">Language</h3>
              </div>
              <p className="text-xl font-bold text-white">
                {movie.language || "N/A"}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Rating Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center bg-gradient-to-r from-red-600/20 to-slate-800/50 rounded-2xl border border-red-500/30 p-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
            <span className="text-4xl font-bold">{movie.rating || "N/A"}</span>
            <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
          </div>
          <p className="text-slate-300 text-lg">Audience Rating</p>
        </motion.div>
      </div>
    </div>
  );
};

export default MovieDetails;
