import { Routes, Route } from 'react-router-dom';

import React from 'react';
import './App.css';

import MainPage from "./pages/MainPage/MainPage";
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <div className="app-container">
      <Header />
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<MainPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;