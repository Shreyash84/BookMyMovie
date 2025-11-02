import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import LocalMoviesIcon from "@mui/icons-material/LocalMovies";
import MovieCard from "../MovieCard/MovieCard";

const Movies = () => {
  const URL = "http://localhost:8000/movie/list";
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(URL);
        if (!res.ok) throw new Error("Failed to fetch data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return <div className="text-center mt-10 text-gray-300">Loading movies...</div>;
  if (error)
    return <div className="text-center text-red-400 mt-10">Error: {error}</div>;

  return (
    <div className="text-white">
      {/* HEADER */}
      <motion.div
        className="flex items-center justify-center space-x-3"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div
          whileHover={{ rotate: 10, scale: 1.2 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="text-red-500 drop-shadow-[0_0_12px_rgba(255,50,50,0.8)]"
        >
          <LocalMoviesIcon sx={{ fontSize: 60 }} />
        </motion.div>

        <motion.h1
          whileHover={{
            scale: 1.05,
            textShadow: "0px 0px 1px rgba(255, 0, 0, 0.9)",
          }}
          className="p-2 text-4xl sm:text-5xl font-extrabold text-transparent bg-gradient-to-r from-red-400 via-red-500 to-red-700 bg-clip-text drop-shadow-[0_0_8px_rgba(255,0,0,0.5)]"
        >
          Releasing Soon
        </motion.h1>
      </motion.div>

      {/* MOVIE CARDS */}
      <MovieCard movies={data} /> 
    </div>
  );
};

export default Movies;
