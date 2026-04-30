import { Routes, Route, useLocation } from 'react-router-dom';
import React from 'react';
import './App.css';

import MainPage from "./pages/MainPage/MainPage";
import Header from './components/Header';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage/Loginpage';
import MyPage from './pages/MyPage/MyPage';
import FriendPage from './pages/FriendPage/FriendPage';

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="app-container">
      {!isLoginPage && <Header />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/login" element={<LoginPage/>} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/friends" element={<FriendPage />} />
        </Routes>
      </main>
      {!isLoginPage && <Footer />}
    </div>
  );
}

export default App;
