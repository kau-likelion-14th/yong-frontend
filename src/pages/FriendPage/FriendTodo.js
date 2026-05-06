import React from "react";
import "../../styles/Todo.css";

/**
상세 페이지에서 날짜를 찍으면 그 날의 할 일들을 보여주는 역할
FriendDetailPage에서 필터링된 할 일 목록(todos)을 props로 받아옴
 */
function FriendTodo({ 
  title = "To do List", 
  todos = [], // 날짜별로 걸러진 할 일 데이터 배열          
  categories = {} // 카테고리별 색깔 정보
}) {
  return (
    <div className="todo-container">
      <div className="todo-header">
        <div className="todo-title">{title}</div>
      </div>

      <div className="todo-list">
        {/* 할 일 목록이 하나도 없으면 '없다'는 메시지를 띄움 */}
        {todos.length === 0 ? (
          <div className="todo-empty">할 일이 없습니다.</div>
        ) : (
          // map을 써서 할 일 배열에 든 것들을 하나씩 꺼내 <li> 같은 요소로 만들어줌
          todos.map((todo) => (
            <div
              key={todo.id}
              // 이미 다 한 일(completed)이면 'done' 클래스를 붙여서 취소선을 그어줌
              className={`todo-item ${todo.completed ? "done" : ""}`}
              style={{ cursor: "default" }}
            >
              {/* 다 한 일이면 체크된 표시를 해줌 */}
              <div className={`checkbox ${todo.completed ? "checked" : ""}`} />
              
              {/* 할 일의 글자 내용 */}
              <div className="todo-text">{todo.text || todo.title}</div>
              
              {/* '공부', '일상' 같은 카테고리가 적혀있으면 옆에 태그를 달아줌 */}
              {todo.category && (
                <div
                  className="todo-category"
                  // categories 객체에 들어있는 이 카테고리의 색깔을 입혀줌
                  style={categories[todo.category]}
                >
                  {todo.category}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FriendTodo;
