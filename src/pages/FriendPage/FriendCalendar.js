import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import React from "react";
import "../../styles/Calendar.css";

// 날짜를 달력 응답의 날짜 키와 같은 형식으로 변환
const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function FriendCalendar({
  initialDate,
  onDateChange,
  onMonthChange,
  remainingByDate = {},
}) {
  const getDayMeta = (date) => {
    const day = remainingByDate[toDateKey(date)];

    return {
      hasTodos: day?.hasTodo === true,
      remaining: day?.remaining ?? 0,
      allDone: day?.hasTodo === true && day?.remaining === 0,
    };
  };

  return (
    <div className="calendar-container">
      <Calendar
        onChange={(value) => onDateChange?.(value instanceof Date ? value : value?.[0])}
        onActiveStartDateChange={({ activeStartDate }) => onMonthChange?.(activeStartDate)} // 월 변경 시 실행될 함수 연결
        value={initialDate} // 현재 선택된 날짜 반영
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
