// src/components/ShowtimeList.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, MapPin } from "lucide-react";
import { getShowtimes } from "../../api/axiosClient"; // ✅ uses your axios wrapper

const ShowtimeList = () => {
  const { movieId } = useParams();
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔹 Fetch showtimes
  useEffect(() => {
    const fetchShowtimes = async () => {
      try {
        const res = await getShowtimes(movieId);
        setShowtimes(res.data || []);
      } catch (error) {
        console.error("❌ Error fetching showtimes:", error);
      } finally {
        setLoading(false);
      }
    };

    if (movieId) fetchShowtimes();
  }, [movieId]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-400">
        <p>Loading showtimes...</p>
      </div>
    );

  if (showtimes.length === 0)
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-400">
        <p>No showtimes available for this movie.</p>
      </div>
    );

  return (
    <div className="p-6 text-white min-h-screen">
      {/* 🏷️ Title */}
      <motion.h2
        className="text-3xl font-bold mb-10 text-center text-indigo-400"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Select Showtime
      </motion.h2>

      {/* 🧩 Showtime Cards */}
      <motion.div
        className="grid gap-6 max-w-5xl mx-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.1 }}
      >
        {showtimes.map((st) => (
          <motion.div
            key={st.id}
            onClick={() => navigate(`/seats/${st.id}`)}
            whileHover={{
              scale: 1.05,
              y: -5,
              boxShadow: "0 0 30px rgba(255, 0, 0, 0.3)",
            }}
            transition={{ duration: 0.3 }}
            className="cursor-pointer bg-slate-800/40 border border-slate-700 rounded-2xl p-5 shadow-md hover:border-red-500/60 transition-all duration-300 backdrop-blur-sm"
          >
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="w-4 h-4 text-red-400" />
                <h3 className="text-lg font-semibold">
                  {st.hall || "Main Theater"}
                </h3>
              </div>

              {/* 🆕 Location */}
              <p className="text-sm text-gray-400 pl-6">
                {st.location || "Location not available"}
              </p>

              <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span>
                  {new Date(st.start_time).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                  })}
                  {" • "}
                  {new Date(st.start_time).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <motion.div
                className="mt-3 h-[2px] w-40 bg-gradient-to-r from-red-500 to-transparent"
                whileHover={{ width: "100%" }}
                transition={{ duration: 0.4 }}
              />

              <p className="text-sm text-gray-400 mt-2">
                Tap to view seat availability
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default ShowtimeList;
