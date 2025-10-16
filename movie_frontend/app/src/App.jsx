import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Home from "./components/Home/Home";
import Movies from "./components/Pages/Movies";
import Bookings from "./components/Pages/Bookings";
import Login from "./components/Pages/Login";

const App = () => {
  return (
    <Router>
      <Navbar />
      <main className="bg-gray-180 min-h-screen">
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/movies" element={<Movies/>}/>
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;
