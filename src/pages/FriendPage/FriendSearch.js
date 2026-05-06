import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/FriendSearch.css";
import searchIcon from "../../assets/icon/search.png";

// 검색 대상이 될 더미 유저 데이터
const dummyUsers = [
    {
        id: "1",
        userId: 1,
        name: "나나",
        tag: "1234",
        bio: "안녕하세요! 저는 나나입니다.",
        profileImageUrl: null,
    },
    {
        id: "2",
        userId: 2,
        name: "얀",
        tag: "2342",
        bio: "^^",
        profileImageUrl: null,
    },
    {
        id: "3",
        userId: 3,
        name: "지말",
        tag: "1214",
        bio: "ㅎㅎ",
        profileImageUrl: null,
    },
    {
        id: "4",
        userId: 4,
        name: "코다",
        tag: "1223",
        bio: ";ㅁ;",
        profileImageUrl: null,
    },
    {
        id: "5",
        userId: 5,
        name: "딜런",
        tag: "1777",
        bio: ".",
        profileImageUrl: null,
    },
];

// 친구를 검색하고 팔로우할 수 있는 컴포넌트
function FriendSearch({
  title = "팔로우 요청",
  placeholder = "이름/태그로 검색",
  onFollow, // 부모 컴포넌트(FriendPage)에서 전달받은 팔로우 실행 함수
  followingList = [], // 이미 팔로우 중인 목록
}) {
  const navigate = useNavigate();
  
  // 사용자가 입력한 검색어를 저장하는 state
  const [query, setQuery] = useState("");

  // 이미 팔로우 중인 유저들의 ID를 Set 객체로 변환하여 저장
  const followingIdSet = useMemo(() => {
    return new Set(followingList.map((x) => x.id));
  }, [followingList]);

  // 검색 결과 리스트를 필터링하여 저장
  // 사용자가 입력한 query가 변경될 때마다 dummyUsers에서 일치하는 유저를 찾아냄
  const results = useMemo(() => {
    const q = query.trim();

    // 검색어가 없으면 빈 배열 반환
    if (!q) return [];

    return dummyUsers.filter((user) => {
      return (
        user.name.includes(q) ||
        user.tag.includes(q) ||
        `${user.name}#${user.tag}`.includes(q)
      );
    });
  }, [query]);

  // 검색 결과 유저를 클릭했을 때 상세 페이지로 이동 함
  const goFriendDetail = (friend) => {
    navigate("/friends/detail", { state: { friend } });
  };

  return (
    <section className="friend-search">
      <h2 className="friend-search__title">{title}</h2>

      {/* 검색 입력창 영역 */}
      <div className="friend-search__input-box">
        <span className="friend-search__icon" aria-hidden="true">
          <img
            src={searchIcon}
            alt="검색"
            className="friend-search__icon-img"
          />
        </span>

        <input
          className="friend-search__input"
          value={query} // state와 input 값을 연결
          onChange={(e) => setQuery(e.target.value)} // 입력할 때마다 query state 업데이트
          placeholder={placeholder}
        />
      </div>

      {/* 
        검색창이 비어있으면 아무것도 안 보여주고, 
        검색 결과가 없으면 '결과 없음' 메시지를 보여주고,
        결과가 있으면 유저 리스트를 보여줌
      */}
      {query.trim() === "" ? null : results.length === 0 ? (
        <div className="friend-search__empty">검색 결과가 없습니다.</div>
      ) : (
        <ul className="friend-search__list">
          {results.map((user) => {
            // 현재 유저가 이미 팔로잉 중인 유저인지 확인 함
            const isFollowing = followingIdSet.has(user.id);

            return (
              <li key={user.id} className="friend-search__item">
                {/* 유저 정보 클릭 시 상세 페이지로 이동 */}
                <div
                  className="friend-search__left"
                  role="button"
                  tabIndex={0}
                  onClick={() => goFriendDetail(user)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") goFriendDetail(user);
                  }}
                >
                  <div className="friend-avatar" aria-hidden="true">
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt=""
                        className="friend-avatar__img"
                      />
                    ) : (
                      <UserIcon />
                    )}
                  </div>

                  <div className="friend-info">
                    <div className="friend-info__top">
                      <span className="friend-info__name">{user.name}</span>
                      <span className="friend-info__tag">#{user.tag}</span>
                    </div>

                    <div className="friend-info__bio">
                      {user.bio || "한 줄 소개"}
                    </div>
                  </div>
                </div>

                {/* 
                  이미 팔로잉 중이면 버튼 비활성화 및 텍스트 변경 함
                  클릭 시 부모의 onFollow 함수를 실행해서 팔로우 처리
                */}
                <button
                  type="button"
                  className={`friend-follow-btn ${
                    isFollowing ? "is-disabled" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFollow?.(user);
                  }}
                  disabled={isFollowing}
                >
                  {isFollowing ? "팔로잉" : "팔로우"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

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

export default FriendSearch;