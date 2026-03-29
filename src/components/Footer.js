import React from 'react';
import '../styles/Footer.css';
import logo from '../assets/img/logo.png';

function Footer() {
  return (
    <footer className="footer-fixed">
      <div className="footer-top">
        <div className="footer-logo-area">
          <img src={logo} alt="LTE 로고" className="footer-logo" />
          <span className="footer-title">Lion To-do Everyday</span>
        </div>
      </div>

      <div className="footer-bottom-info">
        <p className="footer-description">LTE는 한국항공대학교 멋쟁이사자처럼에서 개발한 투두 관리 기반의 웹 서비스입니다.</p>
        
        <div className="business-info-grid">
          <div className="info-item">상호명: 한국항공대학교 멋쟁이사자처럼</div>
          <div className="info-item">대표자: 권아영</div>
          <div className="info-item">주소: 경기도 고양시 항공대학로 76 항공우주센터 3층 창업카페</div>

          <div className="info-item new-line">사업자 등록번호: 333-22-55555</div>
          <div className="info-item">개인정보보호책임자: 권아영</div>
          <div className="info-item">이메일: kokoya0526@naver.com</div>
          <div className="info-item">전화번호: 010-8348-8177</div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;