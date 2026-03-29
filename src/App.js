import { Routes, Route } from 'react-router-dom';

import React from 'react';
import './App.css';

import MainPage from "./pages/MainPage/MainPage";
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <div>
      <Header />
      
      <Routes>
        <Route path="/" element={<MainPage />} />
      </Routes>

      <Footer />
    </div>
  );
}

export default App;