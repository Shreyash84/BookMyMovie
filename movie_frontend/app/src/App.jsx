import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Home from "./components/Pages/Home";
import Movies from "./components/Pages/Movies";
import Showtimes from "./components/Pages/Showtimes";
import Auth from "./components/Auth/Auth";
import PageWrapper from "./components/PageWrapper/PageWrapper";
import MovieDetails from "./components/MovieDescription/MovieDesciption";
import SeatSelection from "./components/Pages/SeatSelection";
import BookingConfirmation from "./components/Pages/BookingConfirmation";
import MyBookings from "./components/Pages/MyBookings";
import ProtectedRoute from "./components/Context/ProtectedRoute";
import EditBooking from "./components/Pages/EditBooking";

import { GoogleOAuthProvider } from "@react-oauth/google";

const App = () => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Router>
        <Navbar />
        <PageWrapper>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/showtimes/:movieId" element={<Showtimes />} />
            <Route path="/login" element={<Auth />} />

            {/* Protected Routes */}
            <Route
              path="/seats/:showtime_id"
              element={
                <ProtectedRoute>
                  <SeatSelection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking-confirmation"
              element={
                <ProtectedRoute>
                  <BookingConfirmation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mybookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-booking/:booking_id"
              element={
                <ProtectedRoute>
                  <EditBooking />
                </ProtectedRoute>
              }
            />
          </Routes>
        </PageWrapper>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
