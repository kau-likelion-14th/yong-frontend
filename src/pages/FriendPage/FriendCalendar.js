import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import React, { useState } from "react";
import "../../styles/Calendar.css";

// dummyTodosByDate 객체에서 해당 날짜의 할 일을 찾음
const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// 친구의 날짜별 할 일 더미 데이터
const dummyTodosByDate = {
  "2026-05-04": [
    { id: 1, title: "프론트 보충자료 읽기", completed: true },
    { id: 2, title: "FriendCalendar 주석 달기", completed: false },
  ],
  "2026-05-06": [
    { id: 3, title: "친구 페이지 과제 제출", completed: true },
  ],
  "2026-05-10": [
    { id: 4, title: "React 복습하기", completed: false },
    { id: 5, title: "props 정리하기", completed: false },
    { id: 6, title: "useState 정리하기", completed: true },
  ],
};

// 친구의 활동 내역을 달력 형태로 보여주는 컴포넌트
export default function FriendCalendar() {
  // 사용자가 달력에서 선택한 날짜를 관리하는 state
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 달력에서 날짜를 클릭했을 때 실행되는 함수
  // 선택된 날짜 state를 업데이트하여 화면을 다시 렌더링 함
  const handleDateChange = (value) => {
    const next = value instanceof Date ? value : value?.[0];
    if (!next) return;
    setSelectedDate(next);
  };

  // 특정 날짜의 할 일 상태(메타 데이터)를 가져오는 함수
  // @param {Date} date - 확인할 날짜
  const getDayMeta = (date) => {
    const key = toDateKey(date);
    const list = dummyTodosByDate[key] ?? [];

    // 해당 날짜에 할 일이 없으면 기본 정보 반환
    if (list.length === 0) {
      return { hasTodos: false, remaining: 0, allDone: false };
    }

    // 완료되지 않은(completed: false) 할 일의 개수를 계산 함
    const remaining = list.filter((todo) => !todo.completed).length;

    return {
      hasTodos: true,
      remaining,
      allDone: remaining === 0, // 남은 할 일이 0개면 모두 완료(allDone) 상태
    };
  };

  return (
    <div className="calendar-container">
      <Calendar
        onChange={handleDateChange} // 날짜 클릭 시 실행될 함수 연결
        value={selectedDate} // 현재 선택된 날짜 반영
        calendarType="gregory"
        view="month"
        prev2Label={null}
        next2Label={null}
        showNeighboringMonth={true}
        formatDay={(locale, date) => String(date.getDate())}
        
        // 각 날짜 타일(칸) 안에 들어갈 추가 내용을 정의 함
        tileContent={({ date, view }) => {
          if (view !== "month") return null;

          // 해당 날짜의 할 일 상태를 가져옴
          const { hasTodos, remaining, allDone } = getDayMeta(date);
          if (!hasTodos) return null;

          // 모두 완료했으면 별표, 남은 일이 있으면 숫자를 표시 함
          return <div className="tile-meta">{allDone ? "★" : remaining}</div>;
        }}

        // 각 날짜 타일에 적용할 CSS 클래스를 동적으로 결정 함
        tileClassName={({ date, view }) => {
          if (view !== "month") return "";

          const { hasTodos, allDone } = getDayMeta(date);
          if (!hasTodos) return "";

          // 모두 완료했으면 'tile-done', 할 일이 남아있으면 'tile-has' 클래스 적용
          // 이 클래스들에 따라 달력의 배경색 등이 변경 됨
          return allDone ? "tile-done" : "tile-has";
        }}
      />
    </div>
  );
}