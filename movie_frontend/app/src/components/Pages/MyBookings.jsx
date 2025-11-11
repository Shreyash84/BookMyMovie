import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axiosClient";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🧩 Fetch user's bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await API.get("/bookings/me");
        setBookings(res.data || []);
      } catch (error) {
        console.error("❌ Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // 🟥 Cancel booking
  const handleCancel = async (bookingId, seats) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    try {
      await API.put(`/bookings/${bookingId}/cancel`, {
        seat_ids: seats.map((s) => s.seat_id),
      });

      // Optimistically update UI
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" } : b
        )
      );

      alert("✅ Booking cancelled successfully!");
    } catch (error) {
      console.error("❌ Error cancelling booking:", error);
      alert("Failed to cancel booking. Please try again.");
    }
  };

  // ✏️ Edit booking → redirect to SeatSelection in edit mode
  const handleEdit = (booking) => {
    if (!booking.showtime_id) {
      alert("Unable to edit: missing showtime ID. Please refresh the page.");
      return;
    }

    navigate(`/seats/${booking.showtime_id}`, {
      state: { mode: "edit", booking },
    });
  };

  // 🕓 Loading state
  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-400">
        Loading your bookings...
      </p>
    );
  }

  // 🧾 Render bookings
  return (
    <div className="p-6 text-white min-h-screen bg-gradient-to-b from-[#0a0f1c] to-[#111c33]">
      <h1 className="text-3xl font-bold mb-6 text-center">My Bookings</h1>

      {bookings.length === 0 ? (
        <p className="text-center text-gray-400">No bookings found.</p>
      ) : (
        <div className="grid gap-6 max-w-4xl mx-auto">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-gray-800 p-5 rounded-xl shadow-md hover:shadow-lg transition"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <p className="font-semibold text-lg text-indigo-400">
                    {b.movie_title}
                  </p>
                  <p className="text-sm text-gray-400">
                    {new Date(b.showtime).toLocaleString()}
                  </p>
                  <p className="mt-1">
                    <strong>Seats:</strong>{" "}
                    {b.seats.map((s) => `${s.row}${s.number}`).join(", ")}
                  </p>
                  <p>
                    <strong>Total:</strong> ₹{b.total_amount}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`${
                        b.status === "confirmed"
                          ? "text-green-400"
                          : b.status === "cancelled"
                          ? "text-red-400"
                          : "text-gray-400"
                      }`}
                    >
                      {b.status}
                    </span>
                  </p>
                </div>

                {/* Action buttons */}
                {b.status === "confirmed" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(b)}
                      className="bg-yellow-500 px-4 py-2 rounded-lg hover:bg-yellow-600 text-sm font-medium transition"
                    >
                      Edit Booking
                    </button>

                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
