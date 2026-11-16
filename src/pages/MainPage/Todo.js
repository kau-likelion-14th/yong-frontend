import React, {useEffect, useMemo, useRef, useState} from "react";
import {get} from "../../Api";
import config from "../../Config";
import "../../styles/Todo.css";
import TodoModal from "./TodoModal";
import { loadTodo, saveTodo, deleteTodo, CATEGORY_LABELS, CATEGORY_STYLES } from "./todoApi";

    const toDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const Todo = ({ selectedDate, todosByDate, onComplete, onChanged, loading, loadError, completingId }) => {
    const dateKey = toDateKey(selectedDate);
    const [categoryList, setCategoryList] = useState([]);
    const [error, setError] = useState("");
    const [categoryRetry, setCategoryRetry] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const busy = useRef(false);
    const detailRequest = useRef(null);

    const todos = useMemo(() => todosByDate[dateKey] ?? [], [todosByDate, dateKey]);
    const categories = useMemo(() => Object.fromEntries(
        categoryList.map((c, idx) => [
            c.categoryName,
            CATEGORY_STYLES[CATEGORY_LABELS[c.categoryName] || c.categoryName] || Object.values(CATEGORY_STYLES)[idx % Object.keys(CATEGORY_STYLES).length],
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
                setError("카테고리를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.");
            });

        return () => controller.abort();
    }, [categoryRetry]);

    const [isModalOpen, setIsModalOpen] = useState(false); 
    const [editingTodo, setEditingTodo] = useState(null);

    useEffect(() => {
        detailRequest.current?.abort();
        setIsModalOpen(false);
        setEditingTodo(null);
        return () => detailRequest.current?.abort();
    }, [dateKey]);

    const openModal = () => {
        if (busy.current) return;
        detailRequest.current?.abort();
        setError("");
        setEditingTodo(null);
        setIsModalOpen(true);
    };

    const openEditModal = async (todo) => {
        if (busy.current || loading || loadError || completingId != null) return;
        detailRequest.current?.abort();
        const controller = new AbortController();
        detailRequest.current = controller;
        setError("");
        try {
            const detail = await loadTodo(todo.id, { signal: controller.signal });
            if (controller.signal.aborted) return;
            setEditingTodo({ ...detail, completed: todo.completed });
            setIsModalOpen(true);
        } catch (error) {
            if (!controller.signal.aborted) setError("수정할 할 일을 불러오지 못했습니다.");
        }
    };

    const TodoCompleted = (id) => {
        onComplete(id);
    };

    const handledSaveTodo = async (values) => {
        if (busy.current) return;
        busy.current = true;
        setSubmitting(true);
        try {
            await saveTodo(values, dateKey, editingTodo);
            setIsModalOpen(false);
            onChanged();
        } catch (error) {
            if (error.remainingRepeatDays) onChanged();
            throw error;
        } finally {
            busy.current = false;
            setSubmitting(false);
        }
    };

    const handledDeleteTodo = async () => {
        if (!editingTodo || busy.current) return;
        busy.current = true;
        setSubmitting(true);
        try {
            await deleteTodo(editingTodo.id, dateKey);
            setIsModalOpen(false);
            onChanged();
        } finally {
            busy.current = false;
            setSubmitting(false);
        }
    };

    return (
        <div className="todo-container">
            <div className="todo-header">
                <div className="todo-title">To do List</div>
                <button type="button" className="todo-add" aria-label="할 일 추가" disabled={loading || submitting} onClick={openModal} />
            </div>
            {(error || loadError) && <div role="alert"><p>{error || loadError}</p><button type="button" className="secondary-button" onClick={() => { setError(""); setCategoryRetry((value) => value + 1); onChanged(); }}>다시 시도</button></div>}
            {loading && <p role="status">할 일을 불러오는 중...</p>}
            {!loading && !loadError && !todos.length && <p>등록된 할 일이 없습니다.</p>}
            <div className="todo-list">
                {todos.map((t) => (
                    <div 
                        key={t.id} 
                        className={`todo-item ${t.completed ? 'done' : ''}`}
                        onClick={() => openEditModal(t)}
                    >
                        <button 
                            className={`checkbox ${t.completed ? 'checked' : ''}`} 
                            aria-label={`${t.text} ${t.completed ? "완료 취소" : "완료"}`}
                            disabled={loading || completingId != null || submitting}
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
                            {CATEGORY_LABELS[t.category] || t.category}
                        </div>
                    </div>
                ))}
            </div>
            <TodoModal 
                isOpen={isModalOpen}
                onClose={() => { if (!busy.current) setIsModalOpen(false); }}
                onSave={handledSaveTodo}
                onDelete={handledDeleteTodo}
                initialTodo={editingTodo}
                categories={categories}
                isSubmitting={submitting}
            />
        </div>
    );
};

export default Todo;
