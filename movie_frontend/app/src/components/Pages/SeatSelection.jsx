import React, { useEffect, useState, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import {
  createBooking,
  getShowtimeSeatsForBooking,
  updateBooking,
  cancelBooking,
  getShowtimeSocket
} from "../../api/axiosClient";

const STATUS = {
  available: { label: "Available", cls: "bg-gray-400 text-gray-900 hover:bg-gray-300" },
  selected: { label: "Selected", cls: "bg-indigo-500 text-white border-indigo-500" },
  booked: { label: "Booked", cls: "bg-red-500 text-white cursor-not-allowed" },
  locked: { label: "Locked", cls: "bg-yellow-400 text-gray-900 cursor-not-allowed" },
};

const SeatSelection = () => {
  const { showtime_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();

  const isEditMode = location.state?.mode === "edit";
  const booking = location.state?.booking;

  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🧩 Fetch seat map
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const res = await getShowtimeSeatsForBooking(showtime_id);
        setSeats(res.data);

        // 🟡 Preselect seats if editing
        if (isEditMode && booking?.seats) {
          setSelected(booking.seats.map((s) => s.seat_id));
        }
      } catch (err) {
        console.error("Failed to load seats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSeats();
  }, [showtime_id, isEditMode, booking]);

  // ⚡ WebSocket real-time seat updates
  useEffect(() => {
    if (!showtime_id || loading) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/showtime/${showtime_id}`);
    ws.onopen = () => console.log("✅ WebSocket connected (SeatSelection)");
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "seats_updated" && data.showtime_id === Number(showtime_id)) {
          setSeats((prev) =>
            prev.map((s) =>
              data.seat_ids.includes(s.id)
                ? {
                  ...s,
                  status:
                    data.status === "available"
                      ? "available"
                      : data.status === "booked"
                        ? "booked"
                        : s.status,
                }
                : s
            )
          );
        }
      } catch (err) {
        console.error("⚠️ WebSocket message parse error:", err);
      }
    };
    ws.onclose = () => console.warn("❌ WebSocket closed");
    ws.onerror = (err) => console.error("⚠️ WebSocket error:", err);

    return () => ws.close();
  }, [showtime_id, loading]);

  // 🧮 Build seat map
  const seatMap = useMemo(() => {
    if (!seats.length) return { rows: [], byId: {}, maxCols: 0 };
    const byId = {};
    const byRow = {};
    seats.forEach((s) => {
      byId[s.id] = s;
      (byRow[s.row] ||= []).push(s);
    });
    const rows = Object.keys(byRow)
      .sort()
      .map((r) => byRow[r].sort((a, b) => a.number - b.number));
    const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
    return { rows, byId, maxCols };
  }, [seats]);

  // 🧮 Calculate total cost
  const total = useMemo(
    () => selected.reduce((sum, id) => sum + (seatMap.byId[id]?.price || 0), 0),
    [selected, seatMap.byId]
  );

  // 🪶 Toggle seat selection
  const toggleSeat = (seatId) => {
    const seat = seatMap.byId[seatId];
    if (!seat) return;

    // ⚙️ In edit mode, allow toggling user’s old seats too
    const isUserSeat =
      isEditMode && booking?.seats?.some((bs) => bs.seat_id === seatId);

    if (seat.status === "booked" && !isUserSeat) return;

    setSelected((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId]
    );
  };

  // 🟢 Handle booking, update or cancel
  const handleAction = async () => {
    if (!isAuthenticated || !token) {
      alert("Please log in to continue.");
      return;
    }

    try {
      if (isEditMode) {
        if (selected.length === 0) {
          // 🚨 No seats selected → cancel booking
          if (!window.confirm("Are you sure you want to cancel this booking?")) return;
          await cancelBooking(booking.id, {
            seat_ids: booking.seats.map((s) => s.seat_id),
          });
          alert("❌ Booking cancelled successfully!");
          navigate("/mybookings");
          return;
        }

        // ✅ Update booking normally
        await updateBooking(booking.id, { new_seat_ids: selected });
        alert("✅ Booking updated successfully!");
        navigate("/mybookings");
      } else {
        // 🟢 New Booking Flow → Navigate to confirmation page
        // 🟢 New Booking Flow → Navigate to confirmation page
        const res = await createBooking({
          showtime_id: Number(showtime_id),
          seat_ids: selected,
        });

        const data = res.data;

        // ✅ Construct a confirmation payload using backend data
        const bookingDetails = {
          movie: data.movie_title || "Unknown Movie",
          hall: data.hall || "Main Hall",
          showtime: data.showtime,
          seats: data.seats?.map((s) => `${s.row}${s.number}`),
          totalAmount: data.total_amount || 0,
          bookingId: data.booking_id,
        };

        navigate("/booking-confirmation", { state: bookingDetails });
      }
    } catch (err) {
      console.error("Booking/update failed:", err);
      alert(err.response?.data?.detail || "Something went wrong. Please try again.");
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-400">
        <p>Loading seats...</p>
      </div>
    );
  }

  // 🧾 Render UI
  return (
    <div className="relative min-h-screen flex flex-col items-center text-white bg-gradient-to-b from-[#0a0f1c] to-[#111c33] overflow-hidden">
      {/* Screen display */}
      <div className="mt-10 flex flex-col items-center">
        <div className="h-2 w-48 rounded-full bg-gray-300 shadow-[0_0_25px_5px_rgba(255,255,255,0.3)]" />
        <span className="mt-2 text-sm text-gray-400">Screen</span>
      </div>

      <h1 className="mt-8 text-2xl font-semibold text-indigo-400">
        {isEditMode ? "Edit Your Booking" : "Select Your Seats"}
      </h1>

      {/* Show currently booked seats if editing */}
      {isEditMode && booking?.seats?.length > 0 && (
        <p className="mt-3 text-gray-400 text-sm">
          <strong>Current booking:</strong>{" "}
          {booking.seats.map((s) => `${s.row}${s.number}`).join(", ")}
        </p>
      )}

      {/* Seat grid */}
      <div className="flex flex-col gap-10 items-center w-full px-8 overflow-x-auto mt-12">
        {seatMap.rows.map((rowSeats, rIdx) => (
          <div key={rIdx} className="grid grid-cols-[auto_1fr] items-center gap-3">
            <div className="w-8 pr-1 text-right text-xs text-gray-400">
              {rowSeats[0]?.row}
            </div>
            <div
              className="grid gap-3 justify-items-center items-center"
              style={{
                gridTemplateColumns: `repeat(${seatMap.maxCols}, minmax(2rem, 3.5rem))`,
              }}
            >
              {rowSeats.map((s) => {
                const isUserSeat =
                  isEditMode && booking?.seats?.some((bs) => bs.seat_id === s.id);
                const isSelected = selected.includes(s.id);
                const isUnavailable =
                  s.status === "booked" && !isUserSeat;

                const base = isUnavailable
                  ? STATUS.booked.cls
                  : isSelected
                    ? STATUS.selected.cls
                    : STATUS.available.cls;

                return (
                  <button
                    key={s.id}
                    onClick={() => toggleSeat(s.id)}
                    disabled={isUnavailable}
                    className={`rounded text-[10px] sm:text-xs leading-6 text-center border transition w-10 h-8 sm:w-12 sm:h-10 md:w-14 md:h-12 ${base}`}
                    title={`${s.row}${s.number} • ₹${s.price}`}
                  >
                    {s.row}
                    {s.number}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-700 bg-gray-900/80 backdrop-blur-md p-3">
        <div className="mx-auto max-w-6xl flex items-center justify-between text-white">
          <div>
            <p className="text-sm text-gray-300">
              {selected.length
                ? `Selected: ${selected
                  .map((id) => `${seatMap.byId[id]?.row}${seatMap.byId[id]?.number}`)
                  .join(", ")}`
                : "No seats selected"}
            </p>
            <p className="text-lg font-semibold">₹{total}</p>
          </div>

          <button
            onClick={handleAction}
            className={`min-w-32 rounded-lg px-5 py-2 font-medium ${isEditMode
                ? selected.length === 0
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-yellow-600 hover:bg-yellow-700"
                : "bg-indigo-600 hover:bg-indigo-700"
              }`}
          >
            {isEditMode
              ? selected.length === 0
                ? "Cancel Booking"
                : "Update Booking"
              : "Book Now"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;
