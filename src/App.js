import { Routes, Route, useLocation } from 'react-router-dom';

import React from 'react';
import './App.css';

import MainPage from "./pages/MainPage/MainPage";
import Header from './components/Header';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage/Loginpage';

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div>
      {!isLoginPage && <Header />}
          <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/login" element={<LoginPage/>} />
        </Routes>
        {!isLoginPage && <Footer />}
      </div>
  );
}

export default App;
