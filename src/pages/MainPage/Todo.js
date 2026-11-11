import React, {useEffect, useMemo, useState} from "react";
import {get} from "../../Api";
import config from "../../Config";
import "../../styles/Todo.css";
import TodoModal from "./TodoModal";

const uid = () => Date.now() + Math.random();

const Categories = {
    Today: { backgroundColor: '#E5F8F1', color: '#333' },
    Do: { backgroundColor: '#FFC8BE', color: '#333' },
    일정: { backgroundColor: '#B6DAFF', color: '#333' },
};

    const toDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const Todo = ({ selectedDate, todosByDate, setTodosByDate, onComplete }) => {
    const dateKey = toDateKey(selectedDate);
    const [categoryList, setCategoryList] = useState([]);

    const todos = useMemo(() => todosByDate[dateKey] ?? [], [todosByDate, dateKey]);
    const categories = useMemo(() => Object.fromEntries(
        categoryList.map((c, idx) => [
            c.categoryName,
            Categories[c.categoryName] || Object.values(Categories)[idx % Object.keys(Categories).length],
        ])
    ), [categoryList]);

    useEffect(() => {
        const controller = new AbortController();

        get(config.CATEGORIES.GET, {}, { signal: controller.signal })
            .then((response) => {
                if (controller.signal.aborted) return;
                if (response?.isSuccess === false || !Array.isArray(response?.result)) {
                    throw new Error("유효하지 않은 카테고리 데이터 형식");
                }

                setCategoryList(response.result);
            })
            .catch(() => {
                if (controller.signal.aborted) return;
                console.error("카테고리를 불러오지 못했습니다.");
            });

        return () => controller.abort();
    }, []);

    const setTodos = (updater) => {
        setTodosByDate((prev) => {
            const current = prev[dateKey] ?? [];
            const nextTodos = typeof updater === "function" ? updater(current) : updater;
            return { ...prev, [dateKey]: nextTodos };
        });
    };

    const [isModalOpen, setIsModalOpen] = useState(false); 
    const [editingTodo, setEditingTodo] = useState(null);

    const openModal = () => {
        setEditingTodo(null);
        setIsModalOpen(true);
    };

    const openEditModal = (todo) => {
        setEditingTodo(todo);
        setIsModalOpen(true);
    };

    const TodoCompleted = (id) => {
        onComplete(id);
    };

    const handledSaveTodo = ({text, category, routine}) => { 
        if (editingTodo) {
            setTodos((prev) =>
                prev.map((t) => 
                    t.id === editingTodo.id 
                        ? { ...t, text, category, routine } 
                        : t
                )
            );
        } else if (routine && routine.startDate && routine.endDate && routine.repeatDays?.length > 0) {
            const start = new Date(routine.startDate);
            const end = new Date(routine.endDate);
            const daysToRepeat = routine.repeatDays.map(idx => (idx + 1) % 7);

            setTodosByDate((prev) => {
                const nextData = { ...prev };
                let current = new Date(start);

                while (current <= end) {
                    if (daysToRepeat.includes(current.getDay())) {
                        const key = toDateKey(current);
                        const list = nextData[key] ?? [];
                        nextData[key] = [
                            ...list,
                            { id: uid(), text, category, completed: false, routine }
                        ];
                    }
                    current.setDate(current.getDate() + 1);
                }
                return nextData;
            });
        } else {
            setTodos((prev) => [
                  ...prev, 
                { id: uid(), text, category, completed: false, routine },
            ]);
        }
        setIsModalOpen(false);
    };

    const handledDeleteTodo = () => {
        if (!editingTodo) return;
        setTodos((prev) => prev.filter((t) => t.id !== editingTodo.id));
        setIsModalOpen(false);
    };

    return (
        <div className="todo-container">
            <div className="todo-header">
                <div className="todo-title">To do List</div>
                <button className="todo-add" onClick={openModal}>+</button> 
            </div>
            <div className="todo-list">
                {todos.map((t) => (
                    <div 
                        key={t.id} 
                        className={`todo-item ${t.completed ? 'done' : ''}`}
                        onClick={() => openEditModal(t)}
                    >
                        <button 
                            className={`checkbox ${t.completed ? 'checked' : ''}`} 
                            onClick={(e) => {
                                e.stopPropagation();
                                TodoCompleted(t.id);
                            }}
                        >
                        </button>
                        <div className="todo-text">{t.text}</div>
                        <div 
                            className="todo-category"
                            style={categories[t.category]}
                        >
                            {t.category}
                        </div>
                    </div>
                ))}
            </div>
            <TodoModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handledSaveTodo}
                onDelete={handledDeleteTodo}
                initialTodo={editingTodo}
                categories={categories}
            />
        </div>
    );
};

export default Todo;
