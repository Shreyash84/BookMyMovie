import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Home from "./components/Pages/Home";
import Movies from "./components/Pages/Movies";
import Showtimes from "./components/Pages/Showimes";
import Auth from "./components/Auth/Auth";
import PageWrapper from "./components/PageWrapper/PageWrapper";
import MovieDetails from "./components/MovieDescription/MovieDesciption";

import { GoogleOAuthProvider } from "@react-oauth/google";

const App = () => {
  return (
    <GoogleOAuthProvider clientId="1007634938595-q6nk08ig8jo75abo20ppuo9lbaj8o7ir.apps.googleusercontent.com" >
      <Router>
        <Navbar />
        <PageWrapper>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/showtimes" element={<Showtimes />} />
            <Route path="/login" element={<Auth />} />
          </Routes>

        </PageWrapper>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
