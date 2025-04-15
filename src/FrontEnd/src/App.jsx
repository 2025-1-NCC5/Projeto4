import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import LandingPage from "./LandingPage";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import DashboardPage from "./DashboardPage"; // nova página

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/register" element={<RegisterPage/>}/>
        <Route path="/dashboard" element={<DashboardPage/>}/>
      </Routes>
    </Router>
  );
}

export default App;
