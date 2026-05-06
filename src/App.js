import React from 'react';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import MainPage from './pages/MainPage/MainPage';
import LoginPage from './pages/LoginPage/Loginpage';
import FriendPage from './pages/FriendPage/FriendPage';
import FriendDetailPage from './pages/FriendPage/FriendDetailPage';
import MyPage from './pages/MyPage/MyPage';
import { Routes, Route, useLocation } from 'react-router-dom';

/**
어떤 주소로 들어왔냐에 따라 화면을 바꿔주고,
위아래에 공통으로 들어갈 헤더랑 푸터를 여기서 관리
 */
function App() {
  // useLocation은 현재 브라우저 주소창에 뭐라고 적혀있는지 정보를 가져옴
  // 이걸로 지금 내가 어느 페이지에 와있는지 알아냄
  const location = useLocation();
  
  // 지금 내 위치가 '/login'이면 true
  // 로그인 페이지에서는 화면을 꽉 차게 보여주기 위해 헤더랑 푸터를 숨길 때 이 값을 씀
  const isLoginPage = location.pathname === '/login';

  return (
    <div>
      {/* 
        로그인 페이지가 아닐 때만 Header를 화면에 보여줌
        isLoginPage가 false면 && 뒤의 <Header />가 실행돼서 화면에 나타남
      */}
      {!isLoginPage && <Header />}

      {/* 
        Routes와 Route를 통해 URL 경로에 따라 각기 다른 페이지 컴포넌트를 렌더링 함
        - / : 메인 페이지 (MainPage)
        - /login : 로그인 페이지 (LoginPage)
        - /friends : 친구 목록 및 검색 페이지 (FriendPage)
        - /friends/:id : 특정 친구의 상세 정보를 보여주는 페이지 (FriendDetailPage)
        - /mypage : 마이페이지 (MyPage)
      */}
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/friends" element={<FriendPage />} />
        <Route path="/friends/:id" element={<FriendDetailPage />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>

      {/* 
        Header랑 마찬가지로 로그인 페이지에서는 안 보이게 해서 화면을 깔끔하게 유지
      */}
      {!isLoginPage && <Footer />}
    </div>
  );
}

export default App;