import React, { useEffect } from "react";
import "../../styles/FriendUnfollowModal.css";

// 친구를 목록에서 지울지 물어보는 팝업(모달)창
function FriendUnfollowModal({ isOpen, friend, onConfirm, onClose }) {
  
  // 모달이 열렸을 때만 키보드 입력을 지켜봄
  useEffect(() => {
    if (!isOpen) return;

    // ESC 키 누르면 팝업이 닫히도록 함
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleKeyDown);
    
    // 컴포넌트가 사라지거나 모달이 닫히면 감시 중단 함
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // isOpen이 false면 아예 화면에 아무것도 안 그림
  if (!isOpen) return null;

  // 부모에게 받은 friend 객체에서 이름이랑 태그를 꺼내옴
  const displayName = friend?.name ?? "";
  const displayTag = friend?.tag ? `#${friend.tag}` : "";

  // 팝업 바깥쪽 어두운 배경을 클릭하면 팝업을 닫음
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div className="friend-unfollow-modal__overlay" onClick={handleOverlayClick}>
      <div
        className="friend-unfollow-modal__content"
        role="dialog"
        aria-modal="true"
      >
        <p className="friend-unfollow-modal__text">
          <span className="friend-unfollow-modal__name">{displayName}</span>{" "}
          <span className="friend-unfollow-modal__tag">{displayTag}</span>
          님을 팔로우 목록에서
          <br />
          삭제하시겠습니까?
        </p>

        <div className="friend-unfollow-modal__actions">
          {/* 예: 부모(FriendPage)가 넘겨준 진짜 삭제 함수(onConfirm)를 실행 */}
          <button
            type="button"
            className="friend-unfollow-modal__btn friend-unfollow-modal__btn--yes"
            onClick={onConfirm}
          >
            예
          </button>

          {/* 아니오: 그냥 창만 닫음 */}
          <button
            type="button"
            className="friend-unfollow-modal__btn friend-unfollow-modal__btn--no"
            onClick={onClose}
          >
            아니오
          </button>
        </div>
      </div>
    </div>
  );
}

export default FriendUnfollowModal;