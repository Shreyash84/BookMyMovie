import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { getMovies } from "../../api/axiosClient"; // centralized axios import

const MovieCard = ({ movies: propMovies = [] }) => {
  const [movies, setMovies] = useState(propMovies);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch only if no prop data is passed
  useEffect(() => {
    if (propMovies.length === 0) {
      const fetchMovies = async () => {
        try {
          setLoading(true);
          const res = await getMovies();
          setMovies(res.data || []);
        } catch (error) {
          console.error("❌ Error fetching movies:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchMovies();
    } else {
      // Use the prop data directly
      setMovies(propMovies);
    }
  }, [propMovies]);

  if (loading)
    return (
      <div className="text-center text-slate-400 mt-4 animate-pulse">
        Loading movies...
      </div>
    );

  if (!movies || movies.length === 0)
    return (
      <p className="text-center text-slate-400 mt-4">
        No movies available.
      </p>
    );

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-10">
      <div className="relative">
        {/* Horizontal scrollable movie carousel */}
        <div
          className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(239, 68, 68, 0.5) rgba(30, 41, 59, 0.3)",
          }}
        >
          {movies.map((movie, index) => (
            <Link key={movie.id} to={`/movie/${movie.id}`}>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="flex-shrink-0 w-[320px] snap-center cursor-pointer"
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
                        {movie.rating ?? "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-5 space-y-4">
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
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
