// src/components/SeatSelection.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";// ✅ Import global auth context

const STATUS = {
  available: { label: "Available", cls: "bg-gray-400 text-gray-900 hover:bg-gray-300" },
  selected: { label: "Selected", cls: "bg-indigo-500 text-white border-indigo-500" },
  booked: { label: "Booked", cls: "bg-red-500 text-white cursor-not-allowed" },
  locked: { label: "Locked", cls: "bg-yellow-400 text-gray-900 cursor-not-allowed" },
};

export default function SeatSelection() {
  const { showtime_id } = useParams();
  const { token, user, isAuthenticated } = useAuth(); // ✅ Get from context
  const [seatData, setSeatData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef(null);

  // 🧩 Fetch seat data
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const res = await fetch(`http://localhost:8000/showtimes/${showtime_id}/seats`);
        if (!res.ok) throw new Error("Failed to load seats");
        const data = await res.json();
        setSeatData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSeats();
  }, [showtime_id]);

  // 🧩 WebSocket live updates
  useEffect(() => {
    if (!showtime_id) return;
    const ws = new WebSocket(`ws://localhost:8000/ws/showtime/${showtime_id}`);

    ws.onopen = () => console.log("✅ WebSocket connected");
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "seats_updated" && data.showtime_id == showtime_id) {
          setSeatData((prev) => {
            if (!prev) return prev;
            const updatedSeats = prev.seats.map((s) =>
              data.seat_ids.includes(s.id) ? { ...s, status: data.status } : s
            );
            return { ...prev, seats: updatedSeats };
          });
        }
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    };

    ws.onclose = () => console.log("❌ WebSocket disconnected");
    ws.onerror = (err) => console.error("⚠️ WebSocket error:", err);

    return () => ws.close();
  }, [showtime_id]);

  // 🧩 Organize seat map
  const seatMap = useMemo(() => {
    if (!seatData?.seats) return { rows: [], byId: {}, maxCols: 0 };
    const byId = {};
    const byRow = {};
    seatData.seats.forEach((s) => {
      byId[s.id] = s;
      (byRow[s.row] ||= []).push(s);
    });
    const rows = Object.keys(byRow)
      .sort()
      .map((r) => byRow[r].sort((a, b) => a.number - b.number));
    const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
    return { rows, byId, maxCols };
  }, [seatData]);

  const total = useMemo(
    () => selectedSeats.reduce((sum, id) => sum + (seatMap.byId[id]?.price || 0), 0),
    [selectedSeats, seatMap.byId]
  );

  const toggleSeat = (seatId) => {
    const seat = seatMap.byId[seatId];
    if (!seat || seat.status !== "available") return;
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]
    );
  };

  // 🧩 Booking with Auth token
  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      alert("Select seats first!");
      return;
    }

    if (!isAuthenticated || !token) {
      alert("Please log in before booking!");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/bookings/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ Context token
        },
        body: JSON.stringify({
          showtime_id: Number(showtime_id),
          seat_ids: selectedSeats,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Booking failed");

      alert(`🎉 Booking successful! Booking ID: ${data.booking_id}`);
      setSelectedSeats([]);
    } catch (err) {
      console.error("Booking error:", err);
      alert("Booking failed. Please try again.");
    }
  };

  // --- Render ---
  if (loading) return <p className="text-center mt-10 text-white">Loading seats...</p>;
  if (!seatData) return <p className="text-center mt-10 text-white">No seat data found.</p>;

  return (
    <div className="relative min-h-screen flex flex-col items-center text-white bg-gradient-to-b from-[#0a0f1c] to-[#111c33] overflow-hidden">
      {/* Screen indicator */}
      <div className="mt-10 flex flex-col items-center">
        <div className="h-2 w-48 rounded-full bg-gray-300 shadow-[0_0_25px_5px_rgba(255,255,255,0.3)]" />
        <span className="mt-2 text-sm text-gray-400">Screen</span>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap justify-center gap-5 text-sm">
        {Object.entries(STATUS).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-2">
            <span className={`inline-block w-4 h-4 rounded ${v.cls}`} />
            <span className="text-gray-300">{v.label}</span>
          </span>
        ))}
      </div>

      {/* Seats grid */}
      <div
        ref={gridRef}
        className="flex flex-col gap-10 items-center w-full px-8 overflow-x-auto mt-20"
      >
        {seatMap.rows.map((rowSeats, rIdx) => (
          <div key={rIdx} className="grid grid-cols-[auto_1fr] items-center gap-3">
            <div className="w-8 pr-1 text-right text-xs text-gray-400">{rowSeats[0]?.row}</div>
            <div
              className="grid gap-3 justify-items-center items-center"
              style={{
                gridTemplateColumns: `repeat(${seatMap.maxCols}, minmax(2rem, 3.5rem))`,
              }}
            >
              {Array.from({ length: seatMap.maxCols }).map((_, cIdx) => {
                const s = rowSeats[cIdx];
                if (!s) return <span key={`empty-${rIdx}-${cIdx}`} className="w-8 h-6" />;
                const isSelected = selectedSeats.includes(s.id);
                const isUnavailable = s.status === "booked" || s.status === "locked";
                const base = isUnavailable
                  ? STATUS[s.status].cls
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

      {/* Sticky summary bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-700 bg-gray-900/80 backdrop-blur-md p-3">
        <div className="mx-auto max-w-6xl flex items-center justify-between text-white">
          <div>
            <p className="text-sm text-gray-300">
              {selectedSeats.length
                ? `Selected: ${selectedSeats
                    .map((id) => `${seatMap.byId[id].row}${seatMap.byId[id].number}`)
                    .join(", ")}`
                : "No seats selected"}
            </p>
            <p className="text-lg font-semibold">₹{total}</p>
          </div>
          <button
            onClick={handleBooking}
            disabled={!selectedSeats.length}
            className="min-w-32 rounded-lg bg-indigo-600 px-5 py-2 font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
