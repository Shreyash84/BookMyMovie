import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import confetti from "canvas-confetti"

const BookingConfirmation = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 🎉 Trigger confetti on load
    const duration = 2 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 70,
        origin: { x: 0 },
        colors: ["#ff0000", "#ffcc00", "#00ffcc", "#ffffff"],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 70,
        origin: { x: 1 },
        colors: ["#ff0000", "#ffcc00", "#00ffcc", "#ffffff"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-white">
        <h2 className="text-2xl mb-4">No booking details found!</h2>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
        >
          Go Home
        </button>
      </div>
    );
  }

  const { movie, showtime, seats, totalAmount, bookingId } = state;

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#0a0f1c] to-[#111c33] text-white px-4"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
    >
      {/* Header */}
      <motion.h1
        className="text-4xl font-bold text-green-400 mb-4 flex items-center gap-2"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        Booking Confirmed 🎉
      </motion.h1>

      {/* Ticket Card */}
      <motion.div
        className="relative bg-gray-800 text-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-700"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        {/* Perforated Edge Style */}
        <div className="absolute -left-3 top-1/2 w-6 h-6 bg-[#0a0f1c] rounded-full border border-gray-700"></div>
        <div className="absolute -right-3 top-1/2 w-6 h-6 bg-[#0a0f1c] rounded-full border border-gray-700"></div>

        <div className="space-y-3 text-sm sm:text-base">
          <p>
            <strong>🎬 Movie:</strong> {movie}
          </p>
          <p>
            <strong>🕒 Showtime:</strong>{" "}
            {new Date(showtime).toLocaleString()}
          </p>
          <p>
            <strong>💺 Seats:</strong> {seats.join(", ")}
          </p>
          <p>
            <strong>💰 Total:</strong> ₹{totalAmount}
          </p>
          <p>
            <strong>📘 Booking ID:</strong> #{bookingId}
          </p>
        </div>
      </motion.div>

      {/* Buttons */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={() => navigate("/mybookings")}
          className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-lg font-medium transition"
        >
          View My Bookings
        </button>
        <button
          onClick={() => navigate("/")}
          className="bg-gray-600 hover:bg-gray-700 px-5 py-2 rounded-lg font-medium transition"
        >
          Home
        </button>
      </div>
    </motion.div>
  );
};

export default BookingConfirmation;
