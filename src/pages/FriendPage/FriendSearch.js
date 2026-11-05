import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../Api";
import config from "../../Config";
import { toFriendModel } from "./friendModel";
import "../../styles/FriendSearch.css";
import searchIcon from "../../assets/icon/search.png";

function requestSearch(nickname, page, signal) {
  if (!nickname) {
    return api.get(config.FOLLOW.AVAILABLE, {
      params: {
        page,
        size: 10,
      },
      signal,
    });
  }

  return api.get(config.FOLLOW.SEARCH, {
    params: {
      nickname,
      page,
      size: 10,
    },
    signal,
  });
}

// 친구를 검색하고 팔로우할 수 있는 컴포넌트
function FriendSearch({
  title = "팔로우 요청",
  placeholder = "닉네임으로 검색",
  onFollow, // 부모 컴포넌트(FriendPage)에서 전달받은 팔로우 실행 함수
  followingList = [], // 이미 팔로우 중인 목록
  followingId = null,
  followError = "",
  followDisabled = false,
  refreshKey = 0,
}) {
  const navigate = useNavigate();
  
  // 사용자가 입력한 검색어를 저장하는 state
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const [results, setResults] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nickname = query.trim();

  // 검색어가 없으면 팔로우 가능한 목록을, 입력하면 검색 결과를 받아옴
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    setLoading(true);
    setError("");
    setResults([]);

    const timer = setTimeout(async () => {
      try {
        const { data } = await requestSearch(nickname, page, controller.signal);

        if (
          data?.isSuccess === false ||
          !Array.isArray(data?.result?.content) ||
          !Number.isInteger(data.result.totalPages) ||
          data.result.totalPages < 0
        ) {
          throw new Error("검색 응답을 확인해 주세요.");
        }

        if (!active) return;

        // 팔로우 후 마지막 페이지가 사라지면 이전 페이지로 이동
        if (page > 0 && page >= data.result.totalPages) {
          setPage(Math.max(0, data.result.totalPages - 1));
          return;
        }

        setResults(data.result.content.map(toFriendModel));
        setTotalPages(data.result.totalPages);
      } catch {
        if (active) {
          setError("검색에 실패했습니다. 다시 시도해 주세요.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [nickname, page, retryCount, refreshKey]);

  const handleChange = (e) => {
    const nextQuery = e.target.value;
    setQuery(nextQuery);

    if (nextQuery.trim() !== nickname) {
      setPage(0);
      setResults([]);
      setError("");
    }
  };

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
          aria-label="닉네임 검색"
          value={query} // state와 input 값을 연결
          onChange={handleChange}
          placeholder={placeholder}
        />
      </div>

      {followError && <p role="alert">{followError}</p>}

      {/* 
        로딩과 오류를 먼저 확인하고, 검색어가 없으면 팔로우 가능한 목록을 보여줌
        결과가 있으면 유저 리스트를 보여줌
      */}
      {loading ? (
        <div className="friend-search__empty" role="status">검색 중...</div>
      ) : error ? (
        <div className="friend-search__empty">
          <p role="alert">{error}</p>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
            다시 시도
          </button>
        </div>
      ) : results.length === 0 ? (
        <div className="friend-search__empty">
          {nickname ? "검색 결과가 없습니다." : "팔로우 가능한 사용자가 없습니다."}
        </div>
      ) : (
        <ul className="friend-search__list">
          {results.map((user) => {
            // 현재 유저가 이미 팔로잉 중인 유저인지 확인 함
            const isFollowing = followingList.some((friend) => friend.id === user.id);
            const isPending = followingId === user.id;
            const isDisabled = isFollowing || followingId !== null || followDisabled;

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
                      {user.tag && (
                        <span className="friend-info__tag">#{user.tag}</span>
                      )}
                    </div>

                    <div className="friend-info__bio">
                      {user.bio || "소개글이 없습니다."}
                    </div>
                  </div>
                </div>

                {/* 
                  이미 팔로잉 중이거나 요청 중이면 버튼을 비활성화 함
                  클릭 시 부모의 onFollow 함수를 실행해서 팔로우 처리
                */}
                <button
                  type="button"
                  className={`friend-follow-btn ${
                    isDisabled ? "is-disabled" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFollow?.(user);
                  }}
                  disabled={isDisabled}
                >
                  {isPending ? "처리 중..." : isFollowing ? "팔로잉" : "팔로우"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && !error && totalPages > 1 && (
        <div>
          <button
            type="button"
            disabled={page === 0 || followingId !== null}
            onClick={() => setPage((value) => value - 1)}
          >
            이전
          </button>
          <span> {page + 1} / {totalPages} </span>
          <button
            type="button"
            disabled={page + 1 >= totalPages || followingId !== null}
            onClick={() => setPage((value) => value + 1)}
          >
            다음
          </button>
        </div>
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
