import React from "react";

import "../../styles/Todo.css";
import "../../styles/FriendTodo.css";

const FriendTodo = ({ title = "To do List", todos = [], categories = {} }) => {

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
