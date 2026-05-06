import { useNavigate } from "react-router-dom";
import deleteIcon from "../../assets/icon/delete.png";
import "../../styles/FriendList.css";

/**
FriendPage 컴포넌트에서 이 친구 목록을 갖다 씀
내가 팔로우하고 있는 친구들을 쭉 보여주는 역할
 */
function FriendList(
  {
    title = "팔로우 목록",
    friends = [], // 부모(FriendPage)가 관리하는 친구 배열 데이터를 props로 넘겨받음
    onClickRemove,
    emptyText = "팔로우하는 친구가 없습니다.",
  }
) {
  // 페이지 이동할 때 쓰는 도구
  const navigate = useNavigate();
  
  // 친구 클릭하면 실행되는 함수
  // navigate 기능을 써서 URL을 상세 페이지 주소로 바꾸고, 
  // 해당 친구의 모든 정보를 state라는 주머니에 담아서 전달함
  const goFriendDetail = (friend) => {
    navigate(`/friends/${friend.id}`, { state: { friend } });
  };

  return (
    <section className="friend-list">
      <h2 className="friend-list__title">{title}</h2>

      {/* 
        friends 배열 안에 데이터가 없으면 '친구가 없다'는 문구를 보여주고, 
        데이터가 있으면 map을 돌려서 친구 리스트를 하나씩 화면에 그림
      */}
      {friends.length === 0 ? (
        <div className="friend-list__empty">{emptyText}</div>
      ) : (
        <ul className="friend-list__items">
          {/* 
            배열에 담긴 친구 객체 하나하나를 꺼내서 <li> 태그로 만들어줌 
          */}
          {friends.map((friend) => (
            <li key={friend.id} className="friend-list__item">
              {/* 왼쪽 영역 클릭 시: 상세 페이지로 이동하는 goFriendDetail 실행 */}
              <div
                className="friend-list__left"
                role="button"
                tabIndex={0}
                onClick={() => {
                  goFriendDetail(friend);
                }}
                >

                <div className="friend-avatar" aria-hidden="true">
                  {/* 프로필 이미지가 있으면 보여주고, 없으면 기본 아이콘 표시 */}
                  {friend.profileImageUrl ? (
                    <img
                      className="friend-avatar__img"
                      src={friend.profileImageUrl}
                      alt="프로필 사진"
                      />
                  ) : (
                    <UserIcon/>
                  )}
                </div>


                <div className="friend-info">
                  <div className = "friend-info__top">
                    <span className="friend-info__name">{friend.name}</span>
                    <span className="friend-info__tag">#{friend.tag}</span>
                  </div>

                  {/* 소개글(bio)이 있을 때만 화면에 해당 영역을 보여줌 */}
                  {friend.bio ?(
                    <div className="friend-info__bio">{friend.bio}</div>
                  ) : (
                    <div className="friend-info__empty">소개글이 없습니다.</div>
                  )}
                </div>
              </div>

              {/* 
                e.stopPropagation()이 부모 div의 클릭 이벤트(상세 이동)가 터지는 걸 막음
                부모에게서 받은 onClickRemove 함수를 실행해서 삭제 확인 모달을 띄움
              */}
              <button
                className="friend-remove-btn"
                type="button"
                aria-label="삭제"
                onClick={(e)=>{
                  e.stopPropagation();
                  onClickRemove?.(friend);
                }}
                >
                  <img className="friend-remove-icon" src={deleteIcon} alt="삭제 아이콘" />
                </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// 유저 프로필이 없을 때 보여줄 기본 아이콘 그림
function UserIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Z"
        fill="#ffffff"
        opacity="0.9"
      />
      <path
        d="M4 22c0-4.418 3.582-8 8-8s8 3.582 8 8"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default FriendList;