// src/components/ShowtimeList.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const ShowtimeList = () => {
  const { movieId } = useParams();
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!movieId) return;
    const fetchShowtimes = async () => {
      try {
        const res = await fetch(`http://localhost:8000/showtimes/?movie_id=${movieId}`);
        if (!res.ok) throw new Error("Failed to fetch showtimes");
        const data = await res.json();
        setShowtimes(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchShowtimes();
  }, [movieId]);

  if (loading) return <p className="text-center mt-4">Loading showtimes...</p>;
  if (showtimes.length === 0) return <p className="text-center mt-4">No showtimes available.</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4 text-center">Select Showtime</h2>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {showtimes.map((st) => (
          <div
            key={st.id}
            onClick={() => navigate(`/seats/${st.id}`)}
            className="border rounded-xl p-3 shadow-md hover:bg-gray-100 cursor-pointer transition"
          >
            <h3 className="text-lg font-medium">{st.hall || "Theater"}</h3>
            <p>Date: {new Date(st.start_time).toLocaleDateString()}</p>
            <p>Time: {new Date(st.start_time).toLocaleTimeString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShowtimeList;
