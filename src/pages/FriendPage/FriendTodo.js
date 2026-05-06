import React from "react";
import "../../styles/Todo.css";

function FriendTodo({ title = "To do List", todos = [], categories = {} }) {
  return (
    <div className="todo-container">
      <div className="todo-header">
        <div className="todo-title">{title}</div>
      </div>
      <div className="todo-list">
        {todos.length === 0 ? (
          <div className="todo-empty">할 일이 없습니다.</div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={`todo-item ${todo.completed ? "done" : ""}`}
              style={{ cursor: "default" }}
            >
              <div className={`checkbox ${todo.completed ? "checked" : ""}`} />
              <div className="todo-text">{todo.text || todo.title}</div>
              {todo.category && (
                <div
                  className="todo-category"
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
