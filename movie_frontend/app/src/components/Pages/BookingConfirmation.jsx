import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const BookingConfirmation = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

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

  const { movie, showtime, seats, totalAmount } = state;

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-screen text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1 className="text-4xl font-bold text-green-400 mb-6">
        Booking Confirmed 🎉
      </h1>

      <div className="bg-gray-800 p-6 rounded-xl shadow-md w-96 space-y-3">
        <p><strong>Movie:</strong> {movie}</p>
        <p><strong>Showtime:</strong> {new Date(showtime).toLocaleString()}</p>
        <p><strong>Seats:</strong> {seats.join(", ")}</p>
        <p><strong>Total:</strong> ₹{totalAmount}</p>
      </div>

      <div className="mt-6 flex space-x-4">
        <button
          onClick={() => navigate("/mybookings")}
          className="bg-blue-500 px-4 py-2 rounded-md hover:bg-blue-600"
        >
          View My Bookings
        </button>
        <button
          onClick={() => navigate("/")}
          className="bg-gray-600 px-4 py-2 rounded-md hover:bg-gray-700"
        >
          Home
        </button>
      </div>
    </motion.div>
  );
};

export default BookingConfirmation;
