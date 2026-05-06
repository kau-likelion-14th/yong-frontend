import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import FriendCalendar from "./FriendCalendar";
import FriendTodo from "./FriendTodo";

import "../../styles/FriendDetailPage.css";

// 할 일 분류에 따라 줄 색깔들
const Categories = {
  공부: { backgroundColor: "#E5F8F1", color: "#333" },
  일상: { backgroundColor: "#FFC8BE", color: "#333" },
  동아리: { backgroundColor: "#B6DAFF", color: "#333" },
};

// 날짜를 "2026-05-06" 같은 글자로 바꿔주는 도구
const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// 혹시 정보가 안 넘어왔을 때 보여줄 기본 친구 데이터
const dummyFriend = {
  followId: "1",
  name: "나나",
  tag: "1234",
  bio: "안녕하세요! 저는 나나입니다.",
  profileImage: null,
};

// 친구가 추천하는 곡 데이터
const dummySavedSongs = [
  {
    id: 1,
    title: "Ditto",
    artist: "NewJeans",
    imageUrl: null,
  },
];

// 친구의 날짜별 할 일들
const dummyTodosByDate = {
  "2026-05-04": [
    { id: 1, text: "프론트 보충자료 읽기", category: "공부", completed: true },
    { id: 2, text: "FriendDetailPage 주석 달기", category: "공부", completed: false },
  ],
  "2026-05-06": [
    { id: 3, text: "친구 페이지 과제 제출", category: "동아리", completed: true },
  ],
  "2026-05-10": [
    { id: 4, text: "React 복습하기", category: "공부", completed: false },
    { id: 5, text: "동아리 회의", category: "동아리", completed: false },
    { id: 6, text: "산책하기", category: "일상", completed: true },
  ],
};

const dummyRemainingByDate = {
  "2026-05-04": { hasTodo: true, remaining: 1 },
  "2026-05-06": { hasTodo: true, remaining: 0 },
  "2026-05-10": { hasTodo: true, remaining: 2 },
};

/**
친구를 클릭해서 들어왔을 때 보이는 상세 페이지 
친구가 뭘 하고 사는지, 오늘 할 일은 다 했는지 한눈에 보여줌
 */
function FriendDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // FriendList에서 보낸 정보를 location.state에서 꺼냄
  const passedFriend = location.state?.friend ?? null;

  // state: 화면이 바뀌어야 할 정보들을 담아둠
  const [friend] = useState(passedFriend ?? dummyFriend); 
  const [savedSongs] = useState(dummySavedSongs);

  // 달력에서 내가 찍은 날짜를 기억함. 날짜를 찍을 때마다 이 값이 바뀌고 화면이 다시 그려짐
  const [selectedDate, setSelectedDate] = useState(new Date("2026-05-04"));
  const [viewDate, setViewDate] = useState(new Date("2026-05-04"));

  const [todosByDate] = useState(dummyTodosByDate);
  const [remainingByDate] = useState(dummyRemainingByDate);

  // 가장 최근 곡 하나만 골라냄
  const latestSong = useMemo(() => {
    if (!Array.isArray(savedSongs) || savedSongs.length === 0) return null;
    return savedSongs[0];
  }, [savedSongs]);

  // 선택된 날짜(selectedDate)가 변경될 때마다 해당 날짜의 할 일 리스트를 다시 계산 함
  const todos = useMemo(() => {
    const key = toDateKey(selectedDate);
    // 전체 할 일 목록 중에서 내가 찍은 날짜(key)에 해당하는 배열만 뽑아옴
    return todosByDate[key] ?? [];
  }, [selectedDate, todosByDate]);

  return (
    <div className="friend-detail-page">
      <div className="friend-detail-page__inner">
        <div className="friend-detail-page__top">
          {/* 뒤로가기 버튼 클릭 시: 이전 화면으로 돌려보냄 */}
          <button
            type="button"
            className="friend-detail-page__back"
            aria-label="뒤로가기"
            onClick={() => navigate(-1)}
          >
            ‹
          </button>

          <div className="friend-detail-page__profile">
            <div className="friend-detail-page__avatar" aria-hidden="true">
              {friend?.profileImage ? (
                <img
                  src={friend.profileImage}
                  alt="profile"
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <UserIcon />
              )}
            </div>

            <div className="friend-detail-page__profile-info">
              <div className="friend-detail-page__name-line">
                <span className="friend-detail-page__name">
                  {friend?.name || " "}
                </span>
              </div>
              <div className="friend-detail-page__bio">
                {friend?.bio || "한 줄 소개"}
              </div>
            </div>
          </div>

          {/* 친구의 추천 곡 정보 영역 */}
          <div className="friend-detail-page__songs-inline">
            {latestSong ? (
              <div className="friend-detail-page__song-inline-item">
                <div className="friend-detail-page__song-inline-cover">
                  {latestSong?.imageUrl ? (
                    <img
                      src={latestSong.imageUrl}
                      alt={latestSong.title || "album"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "10px",
                      }}
                    />
                  ) : null}
                </div>

                <div className="friend-detail-page__song-inline-info">
                  <div className="friend-detail-page__song-inline-title">
                    {latestSong?.title || "제목 없음"}
                  </div>
                  <div className="friend-detail-page__song-inline-artist">
                    {latestSong?.artist || "아티스트 정보 없음"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="friend-detail-page__songs-inline-empty">
                저장한 곡이 없습니다.
              </div>
            )}
          </div>
        </div>

        <div className="friend-detail-page__grid">
          {/* 활동 달력 컴포넌트: 날짜 클릭 시 onDateChange를 통해 selectedDate를 업데이트 */}
          <div className="friend-detail-page__calendar">
            <FriendCalendar
              initialDate={selectedDate}
              onDateChange={(date) => date && setSelectedDate(date)}
              onMonthChange={(date) => {
                if (!date) return;
                setViewDate(date);
              }}
              todosByDate={todosByDate}
              remainingByDate={remainingByDate}
            />
          </div>

          {/* 위에서 필터링해서 뽑아낸 'todos' 배열을 넘겨받아서 화면에 보여줌 */}
          <div className="friend-detail-page__todo">
            <FriendTodo
              title="To do List"
              todos={todos}
              categories={Categories}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function UserIcon() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
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

export default FriendDetailPage;