import React from 'react';
import Profile from './Profile';
import Status from './Status';
import "../../styles/MyPage.css";

const MyPage = () => {
    return (
        <div className="mypage-container">
            <Profile />
            <Status />
        </div>
    );
};

export default MyPage;
