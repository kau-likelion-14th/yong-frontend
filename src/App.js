import {Routes, Route} from 'react-router-dom';


import React from 'react';
import './App.css';

import MainPage from "./pages/MainPage/MainPage";
import Header from './components/Header';


function App() {
  return (
    <div>
      <Header />
      
      <Routes>
        <Route path="/" element={<MainPage/>} />
      </Routes>

    </div>
  );
}

export default App;