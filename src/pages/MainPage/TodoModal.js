import React, {useEffect, useState} from "react";
import "../../styles/Todo.css";
import RoutineModal from "./RoutineModal";

const TodoModal = ({ 
    isOpen, 
    onClose, 
    onSave, 
    onDelete, 
    initialTodo,
    categories,
    isSubmitting = false,
}) => {
    const isEditMode = Boolean(initialTodo); 

    const [category, setCategory] = useState("");
    const [text, setText] = useState("");
    const [routine, setRoutine] = useState(null);
    const [error, setError] = useState("");

    const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        setCategory(initialTodo?.category || "");
        setText(initialTodo?.text || "");
        setRoutine(initialTodo?.routine || null);
        setError("");
        setIsRoutineModalOpen(false);
    }, [isOpen, initialTodo]);

    useEffect(() => {
        if (!isOpen) return;
        setCategory((prev) => prev || Object.keys(categories)[0] || "");
    }, [isOpen, categories]);

    useEffect(() => {
        if (!isOpen || isSubmitting || isRoutineModalOpen) return;
        const close = (event) => { if (event.key === "Escape") onClose(); };
        document.addEventListener("keydown", close);
        return () => document.removeEventListener("keydown", close);
    }, [isOpen, isSubmitting, isRoutineModalOpen, onClose]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if(!text.trim() || !category || isSubmitting) return;
        setError("");
        try {
            await onSave({ text: text.trim(), category, routine });
        } catch (error) {
            setError(error?.response?.data?.message || error.message || "저장하지 못했습니다. 다시 시도해주세요.");
            if (error.remainingRepeatDays) setRoutine((value) => ({ ...value, repeatDays: error.remainingRepeatDays }));
        }
    };

    const handleDelete = async () => {
        if (isSubmitting) return;
        setError("");
        try { await onDelete(); }
        catch (error) { setError(error?.response?.data?.message || "삭제하지 못했습니다. 다시 시도해주세요."); }
    };

    const categoryKeys = Object.keys(categories);

    return (
        <div className="modal-overlay" onClick={onClose}> 
            <div 
                className="modal-container" 
                role="dialog"
                aria-modal="true"
                aria-label={isEditMode ? "할 일 수정하기" : "할 일 추가하기"}
                aria-busy={isSubmitting}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-title">
                    {isEditMode ? "할 일 수정하기" : "할 일 추가하기"}
                </div>
                <div className="modal-section">
                    <div className="modal-label">카테고리</div>
                    <div className="modal-categories">
                        {categoryKeys.map((c) => (
                            <label
                                key={c}
                                className={`modal-categoryitem ${category === c ? 'selected' : ''}`}
                            >
                                <span style={category === c ? {} : categories[c]}>{c}</span> 
                                <input
                                    type="radio"
                                    name="category"
                                    value={c}
                                    checked={category === c}
                                    onChange={() => setCategory(c)}
                                />
                            </label>
                        ))}
                    </div>
                </div>
                <div className="modal-section">
                    <label className="modal-label" htmlFor="todo-text">내용</label>
                    <div className="input-wrapper">
                        <input
                            type="text"
                            id="todo-text"
                            className="text-input"
                            placeholder="내용을 입력해주세요"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </div>
                </div>
                <div className="modal-section">
                    <button
                        type="button"
                        className="routine-row"
                        disabled={isSubmitting || (isEditMode && !initialTodo.routine)}
                        onClick={() => setIsRoutineModalOpen(true)}
                    >
                        <div className="routine-label">{routine ? "루틴 수정하기" : "루틴 등록하기"}</div>
                        <div className="routine-button">{"›"}</div>
                    </button>
                </div>
                {routine && <p>반복 요일: {routine.repeatDays.map((day) => ["월", "화", "수", "목", "금", "토", "일"][day]).join(", ")} / {routine.startDate} ~ {routine.endDate}</p>}
                {isEditMode && routine && <p>삭제하면 선택한 날짜의 할 일만 삭제됩니다.</p>}
                {!isEditMode && routine && <button type="button" disabled={isSubmitting} onClick={() => setRoutine(null)}>루틴 해제</button>}
                {error && <p role="alert">{error}</p>}
                <div className="modal-actions">
                    <button
                        className={`leftbutton ${isEditMode ? '' : 'disabled'}`}
                        onClick={handleDelete}
                        disabled={!isEditMode || isSubmitting}
                    >
                        삭제
                    </button>
                    <button
                        className={`rightbutton ${text.trim() ? '' : 'disabled'}`}
                        onClick={handleSave}
                        disabled={!text.trim() || !category || isSubmitting}
                    >
                        {isSubmitting ? "저장 중..." : "저장"}
                    </button>
                </div>
                <RoutineModal
                    isOpen={isRoutineModalOpen}
                    initialRoutine={routine}
                    singleDay={isEditMode}
                    onClose={() => setIsRoutineModalOpen(false)}
                    onSave={(newRoutine) => {
                        setRoutine(newRoutine);
                        setIsRoutineModalOpen(false);
                    }}
                />
            </div>
        </div>
    );
};

export default TodoModal;
