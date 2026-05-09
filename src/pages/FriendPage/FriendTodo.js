import React, { useMemo } from "react";

import "../../styles/Todo.css";
import "../../styles/FriendTodo.css";

// 친구의 할 일 목록 더미 데이터
const dummyTodos = [
  { id: 1, text: "프론트 보충자료 읽기", category: "공부", completed: true },
  { id: 2, text: "FriendTodo 구현하기", category: "공부", completed: false },
  { id: 3, text: "동아리 회의", category: "동아리", completed: false },
];

// 카테고리별 배경색과 글자색 설정
const dummyCategories = {
  공부: { backgroundColor: "#E5F8F1", color: "#333" },
  일상: { backgroundColor: "#FFC8BE", color: "#333" },
  동아리: { backgroundColor: "#B6DAFF", color: "#333" },
};

//FriendDetailPage에서 불러와서 사용하는 컴포넌트
//친구가 오늘 해야 할 일들이 무엇인지 리스트 형태로 보여줌
const FriendTodo = ({ title = "To do List" }) => {
  // 지금은 dummyTodos와 dummyCategories를 직접 할당해서 보여줌
  // 나중에 props를 여기에 연결해서 친구마다 다른 데이터를 보여줄 예정
  const todos = dummyTodos;
  const categories = dummyCategories;

  // useMemo -> todos 배열이 바뀔 때만 실행돼서 전체 할 일 개수와 완료된 개수를 계산
  const counts = useMemo(() => {
    const total = todos.length; // 전체 할 일의 개수
    const done = todos.filter((t) => t.completed).length; // filter로 true된 것만 개수 셈
    return { total, done };
  }, [todos]);

  return (
    <div className="friend-todo">
      <div className="todo-container">
        {/* props로 받은 title을 화면에 표시 */}
        <div className="todo-header">
          <div className="todo-title">{title}</div>
        </div>

        <div className="todo-list">
          {todos.length === 0 ? (
            <div className="friend-todo__empty">등록된 투두가 없습니다.</div>
          ) : (
            //map 함수로 todos 배열에 담긴 할 일 객체들을 하나씩 꺼냄 
            todos.map((t) => (
                // t.completed가 true면 'done' 클래스 추가해서 글자에 취소선 생기게 함
              <div key={t.id} className={`todo-item ${t.completed ? "done" : ""}`}>
                {/* t.completed 상태에 따라 체크박스의 색상을 바꿈. */}
                <div className={`checkbox ${t.completed ? "checked" : ""}`} />
                
                {/* 할 일 내용을 화면에 글자로 출력 */}
                <div className="todo-text">{t.text}</div>
                
                {/* 
                  categories 객체에서 현재 할 일의 카테고리에 
                  맞는 스타일을 가져와서 배경색과 글자색을 입힘.
                */}
                <div
                  className="todo-category"
                  style={categories[t.category] ?? undefined}
                >
                  {t.category}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendTodo;