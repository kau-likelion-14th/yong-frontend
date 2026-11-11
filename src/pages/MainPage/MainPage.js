import React, {useEffect, useRef, useState} from "react";
import {get, patch} from "../../Api";
import config from "../../Config";
import CustomCalendar from "./Calendar";
import Todo from "./Todo";
import "../../styles/MainPage.css";

const toDateKey = (date) => { // 날짜 객체를 "YYYY-MM-DD" 문자열로 바꾸는 함수 (달력과 Todo가 같은 키를 쓰기 위함)
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const MainPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date()); // 1. 현재 어떤 날짜가 선택되었는지 관리 (기본값: 오늘)
  const [viewDate, setViewDate] = useState(new Date());
  const [todosByDate, setTodosByDate] = useState({}); // 2. 전체 할 일 데이터를 관리하는 객체 상태
  const [remainingByDate, setRemainingByDate] = useState({});
  const [refresh, setRefresh] = useState(0);
  const completeRequest = useRef(null);
  const dateKey = toDateKey(selectedDate);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;

  useEffect(() => {
    const controller = new AbortController();

    get(config.TODOS.GET, { date: dateKey }, { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;
        if (response?.isSuccess === false || !Array.isArray(response?.result)) {
          throw new Error("유효하지 않은 Todo 데이터 형식");
        }

        const todos = response.result.map((todo) => ({
          id: todo.todoId,
          text: todo.description,
          category: todo.categoryName,
          completed: todo.completed,
        }));

        setTodosByDate((prev) => ({ ...prev, [dateKey]: todos }));
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setTodosByDate((prev) => ({ ...prev, [dateKey]: [] }));
        console.error("할 일을 불러오지 못했습니다.");
      });

    return () => controller.abort();
  }, [dateKey, refresh]);

  useEffect(() => {
    const controller = new AbortController();

    setRemainingByDate({});

    get(config.TODOS.CALENDAR, { year, month }, { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;
        const days = response?.result?.days;

        if (response?.isSuccess === false || !Array.isArray(days)) {
          throw new Error("유효하지 않은 캘린더 데이터 형식");
        }

        setRemainingByDate(Object.fromEntries(days.map((day) => [day.date, day])));
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        console.error("캘린더를 불러오지 못했습니다.");
      });

    return () => controller.abort();
  }, [year, month, refresh]);

  useEffect(() => {
    return () => completeRequest.current?.abort();
  }, []);

  const TodoCompleted = async (id) => {
    if (completeRequest.current) return;
    const todo = todosByDate[dateKey]?.find((t) => t.id === id);
    if (!todo) return;

    const controller = new AbortController();
    completeRequest.current = controller;

    try {
      const response = await patch(
        config.TODOS.COMPLETE(id, dateKey),
        { completed: !todo.completed },
        { signal: controller.signal }
      );

      if (controller.signal.aborted) return;
      if (response?.isSuccess === false || typeof response?.result?.completed !== "boolean") {
        throw new Error("완료 상태 변경 실패");
      }

      setRefresh((prev) => prev + 1);
    } catch {
      if (!controller.signal.aborted) {
        console.error("완료 상태를 변경하지 못했습니다.");
      }
    } finally {
      completeRequest.current = null;
    }
  };

  return (
    <div className="mainpage-container">
      <CustomCalendar 
        initialDate={selectedDate} // 현재 선택된 날짜 전달
        onDateChange={setSelectedDate} // 달력에서 날짜 클릭 시 selectedDate를 바꾸는 함수 전달
        onMonthChange={setViewDate}
        remainingByDate={remainingByDate} // 달력에 숫자/별표를 표시하기 위해 전체 데이터 전달
      />
      <Todo 
        selectedDate={selectedDate} // "지금 몇 일을 보고 있는가?" 정보 전달
        todosByDate={todosByDate} // 할 일 목록을 보여주기 위한 데이터 전달
        setTodosByDate={setTodosByDate} // 새로운 할 일을 추가하거나 완료 처리할 때 쓸 변경 함수 전달
        onComplete={TodoCompleted}
      />
    </div>
  );
};

export default MainPage; //MainPage라는 컴포넌트를 다른 파일에서도 가져다 쓸 수 있도록 "밖으로 내보내는" 명령어
