import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentlyShowingMovies, getUpcomingMovies } from "../../api/axiosClient";
import { Film, Calendar, Loader2, Star } from "lucide-react";
import { Link } from "react-router-dom";
import SearchBar from "../SearchBar/SearchBar";


const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const gridVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.08,
      duration: 0.4 
    } 
  },
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { duration: 0.4, ease: "easeOut" } 
  },
};


const Movies = () => {
  const [nowPlaying, setNowPlaying] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");


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
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-300 gap-3">
        <Loader2 className="animate-spin w-7 h-7 text-red-400" />
        <p className="animate-pulse text-sm tracking-wider">Loading movies...</p>
      </div>
    );


  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-400">
        {error}
      </div>
    );


  return (
    <div className="min-h-screen text-white py-16 px-6">
      {/* 🎬 Hero Header */}
      <div className="max-w-6xl mx-auto mb-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-extrabold mb-3 bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent"
        >
          Experience Cinema Like Never Before
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-gray-400 text-lg"
        >
          Discover top movies, upcoming releases, and your next favorite story.
        </motion.p>
      </div>


      {/* 🔍 Search Bar */}
      <SearchBar onSearch={setSearchQuery} />


      {/* 🎥 Sections with Pagination */}
      <MovieSection
        title="Now Showing"
        icon={<Film className="text-green-400 w-7 h-7" />}
        movies={nowPlaying}
        searchQuery={searchQuery}
      />
      <MovieSection
        title="Coming Soon"
        icon={<Calendar className="text-yellow-400 w-7 h-7" />}
        movies={upcoming}
        searchQuery={searchQuery}
      />
    </div>
  );
};


const MovieSection = ({ title, icon, movies, searchQuery }) => {
  const [page, setPage] = useState(1);
  const moviesPerPage = 4;


  const filteredMovies = movies.filter(
    (movie) =>
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (movie.description && movie.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );


  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / moviesPerPage));


  // Ensure current page never exceeds available pages
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);


  // Automatically reset to first page when movie list or search changes
  useEffect(() => {
    setPage(1);
  }, [movies, searchQuery]);


  // Get movies for current page
  const startIndex = (page - 1) * moviesPerPage;
  const currentMovies = filteredMovies.slice(startIndex, startIndex + moviesPerPage);


  const handlePrev = () => setPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setPage((p) => Math.min(p + 1, totalPages));



  return (
    <motion.section
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="max-w-7xl mx-auto mb-24"
    >
      {/* Section Header */}
      <div className="flex items-center justify-center gap-3 mb-12">
        {icon}
        <h2 className="text-3xl md:text-4xl font-bold tracking-wide bg-gradient-to-r from-red-400 to-red-700 bg-clip-text text-transparent py-3">
          {title}
        </h2>
      </div>


      {/* Movie Grid */}
      {currentMovies.length === 0 ? (
        <p className="text-center text-gray-500 italic">
          {searchQuery ? `No movies found for "${searchQuery}".` : "No movies found."}
        </p>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10"
            variants={gridVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {currentMovies.map((movie) => (
              <motion.div
                key={movie.id}
                variants={cardVariants}
                whileHover={{
                  scale: 1.04,
                  y: -6,
                  boxShadow:
                    "0px 0px 35px rgba(255, 0, 0, 0.25), 0px 0px 60px rgba(255, 60, 60, 0.1)",
                }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="relative rounded-2xl overflow-hidden bg-slate-800/40 border border-slate-700 hover:border-red-500/60 transition-all duration-500 backdrop-blur-sm"
              >
                <Link to={`/movie/${movie.id}`} className="block">
                  <div className="relative h-[420px] overflow-hidden">
                    <motion.img
                      src={
                        movie.poster_url ||
                        "https://via.placeholder.com/300x400?text=No+Poster"
                      }
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out"
                      whileHover={{ scale: 1.08 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-90 transition-all duration-700" />
                  </div>


                  <div className="absolute bottom-0 w-full p-5 bg-gradient-to-t from-slate-900/95 via-slate-900/70 to-transparent">
                    <motion.h3
                      className="text-lg font-semibold mb-1"
                      whileHover={{ color: "#ef4444" }}
                      transition={{ duration: 0.2 }}
                    >
                      {movie.title}
                    </motion.h3>
                    <p className="text-sm text-slate-400 line-clamp-2">
                      {movie.description || "No description available."}
                    </p>
                    <div className="flex justify-between items-center mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-400" />
                        {movie.rating || "N/A"}
                      </span>
                      <span>
                        {movie.release_date
                          ? new Date(movie.release_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                          : "TBA"}
                      </span>
                    </div>
                  </div>


                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    whileHover={{
                      background:
                        "radial-gradient(circle at center, rgba(255,0,0,0.15) 0%, rgba(255,0,0,0) 70%)",
                      opacity: 0.8,
                    }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}


      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-10 gap-4">
          <button
            onClick={handlePrev}
            disabled={page === 1}
            className={`px-4 py-2 rounded-md border ${page === 1
              ? "border-gray-600 text-gray-500 cursor-not-allowed"
              : "border-red-500 text-red-400 hover:bg-red-500/10"
              } transition-all`}
          >
            Prev
          </button>
          <span className="text-gray-400 text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={page === totalPages}
            className={`px-4 py-2 rounded-md border ${page === totalPages
              ? "border-gray-600 text-gray-500 cursor-not-allowed"
              : "border-red-500 text-red-400 hover:bg-red-500/10"
              } transition-all`}
          >
            Next
          </button>
        </div>
      )}
    </motion.section>
  );
};


export default Movies;
