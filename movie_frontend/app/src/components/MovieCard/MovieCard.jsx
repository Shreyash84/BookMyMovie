import React, { useState, useEffect } from "react";
import { Star, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MovieCard = () => {
  const [movies, setMovies] = useState([]);
  const [expandedMovieId, setExpandedMovieId] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      const res = await fetch("http://localhost:8000/movie/list");
      const data = await res.json();
      setMovies(data);
    };
    fetchMovies();
  }, []);

  const toggleShowtimes = (id) =>
    setExpandedMovieId(expandedMovieId === id ? null : id);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Section */}
      <div className="text-center mb-12">
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

      {/* Carousel Container with proper scrollbar styling */}
      <div className="relative">
        <div
          className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(239, 68, 68, 0.5) rgba(30, 41, 59, 0.3)",
          }}
        >
          {movies.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="flex-shrink-0 w-[320px] snap-center"
            >
              <div className="h-full bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden hover:border-red-500/30 hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-300">
                {/* Movie Poster */}
                <div className="relative h-[400px] overflow-hidden">
                  <img
                    src={
                      movie.poster_url ||
                      "https://via.placeholder.com/320x400?text=No+Poster"
                    }
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  
                  {/* Rating Badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-white text-sm font-semibold">
                      {movie.rating || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 space-y-4">
                  {/* Title and Description */}
                  <div>
                    <h3 className="text-white text-xl font-bold mb-2 line-clamp-1">
                      {movie.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                      {movie.description || "No description available."}
                    </p>
                  </div>

                  {/* Release Date */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                    <span className="text-slate-500 text-xs uppercase tracking-wider">
                      Release Date
                    </span>
                    <span className="text-red-400 text-sm font-semibold">
                      {movie.release_date
                        ? new Date(movie.release_date).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )
                        : "TBA"}
                    </span>
                  </div>

                  {/* Showtimes Section */}
                  {movie.showtimes && movie.showtimes.length > 0 && (
                    <div className="pt-2">
                      <button
                        onClick={() => toggleShowtimes(movie.id)}
                        className="w-full flex items-center justify-between text-slate-300 hover:text-white transition-colors p-3 bg-slate-800/50 rounded-lg"
                      >
                        <span className="text-sm font-medium">
                          {movie.showtimes.length} Showtime
                          {movie.showtimes.length > 1 ? "s" : ""} Available
                        </span>
                        {expandedMovieId === movie.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedMovieId === movie.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-2 mt-3">
                              {movie.showtimes.map((showtime) => (
                                <div
                                  key={showtime.id}
                                  className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-700/30"
                                >
                                  <div className="flex items-center gap-2 text-slate-300">
                                    <Clock className="w-4 h-4 text-red-400" />
                                    <span className="text-sm font-medium">
                                      {new Date(
                                        showtime.start_time
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                  <span className="text-xs bg-red-600/20 text-red-400 px-3 py-1 rounded-full border border-red-500/30">
                                    {showtime.hall || "Hall 1"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Custom scrollbar styles for webkit browsers */}
        <style jsx>{`
          div::-webkit-scrollbar {
            height: 8px;
          }
          div::-webkit-scrollbar-track {
            background: rgba(30, 41, 59, 0.3);
            border-radius: 10px;
          }
          div::-webkit-scrollbar-thumb {
            background: rgba(239, 68, 68, 0.5);
            border-radius: 10px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: rgba(239, 68, 68, 0.7);
          }
        `}</style>
      </div>
    </div>
  );
};

export default MovieCard;
