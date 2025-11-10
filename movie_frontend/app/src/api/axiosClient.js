import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.REACT_APP_API_URL || "http://localhost:8000",
    headers: {
        "Content-Type": "application/json",
    }
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token){
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/* ==========================================================
   🧩 AUTH ROUTES  ->  /auth
========================================================== */
export const signUp = (data) => API.post("/auth/signup", data);
export const login = (formData) =>
  API.post("/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
export const googleLogin = (data) => API.post("/auth/google", data);

/* ==========================================================
   🎬 MOVIE ROUTES  ->  /movie
========================================================== */
export const getMovies = () => API.get("/movie/list");
export const getMovieById = (id) => API.get(`/movie/${id}`);
export const getCurrentlyShowingMovies = () => API.get("/movie/currently-showing");
export const getUpcomingMovies = () => API.get("/movie/upcoming");
export const getTopRatedMovies = (minRating = 7) => API.get("/movie/top-rated", { params: { min_rating: minRating } });



/* ==========================================================
   🕒 SHOWTIME ROUTES  ->  /showtimes
========================================================== */
export const getShowtimes = (movieId) =>
  API.get("/showtimes/", { params: { movie_id: movieId } });
export const getShowtimeSeats = (showtimeId) =>
  API.get(`/showtimes/${showtimeId}/seats`);

/* ==========================================================
   🎟️ BOOKING ROUTES  ->  /bookings
========================================================== */
export const createBooking = (data) => API.post("/bookings/", data);
export const getShowtimeSeatsForBooking = (showtimeId) => API.get(`/bookings/showtime/${showtimeId}/seats`);
export const cancelBooking = (bookingId, data) => API.put(`/bookings/${bookingId}/cancel`, data);
export const updateBooking = (bookingId, data) => API.put(`/bookings/${bookingId}/update`, data);
export const getBookingById = (bookingId) => API.get(`/bookings/${bookingId}`);

/* ==========================================================
   💬 WEBSOCKET (real-time seat updates)
========================================================== */
// Just a helper for frontend WebSocket connections
export const getShowtimeSocket = (showtimeId) => {
  const wsUrl = process.env.REACT_APP_WS_URL || "ws://localhost:8000";
  return new WebSocket(`${wsUrl}/ws/showtime/${showtimeId}`);
};

export default API;