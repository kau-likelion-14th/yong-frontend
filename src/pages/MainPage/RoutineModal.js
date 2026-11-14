import React, { useEffect, useState } from "react";
import "../../styles/Todo.css";
import { validateRoutine } from "./todoApi";

const Days = ["월", "화", "수", "목", "금", "토", "일"];

const RoutineModal = ({
    isOpen,
    onClose,
    onSave,
    initialRoutine,
    singleDay = false,
}) => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [repeatDays, setRepeatDays] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        setStartDate(initialRoutine?.startDate || "");
        setEndDate(initialRoutine?.endDate || "");
        setRepeatDays(initialRoutine?.repeatDays || []);
        setError("");
    }, [isOpen, initialRoutine]);

    useEffect(() => {
        if (!isOpen) return;
        const close = (event) => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } };
        document.addEventListener("keydown", close);
        return () => document.removeEventListener("keydown", close);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleDayToggle = (idx) => {
        if (singleDay) { setRepeatDays([idx]); return; }
        setRepeatDays((prev) =>
            prev.includes(idx)
                ? prev.filter((d) => d !== idx)
                : [...prev, idx].sort()
        );
    };

    const handleSave = () => {
        try {
            const routine = { startDate, endDate, repeatDays };
            validateRoutine(routine);
            setError("");
            onSave(routine);
        } catch (error) { setError(error.message); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-container"
                role="dialog"
                aria-modal="true"
                aria-label="루틴 등록하기"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="routine-header">
                    <div className="routine-close" onClick={onClose}>{"‹"}</div>
                    <div className="routine-title">루틴 등록하기</div>
                </div>

                <div className="modal-section">
                    <label className="modal-label" htmlFor="routine-start">시작 날짜</label>
                    <div className="date-wrapper">
                        <input
                            type="date"
                            id="routine-start"
                            className="date-input"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="modal-section">
                    <label className="modal-label" htmlFor="routine-end">종료 날짜</label>
                    <div className="date-wrapper">
                        <input
                            type="date"
                            id="routine-end"
                            className="date-input"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="modal-section">
                    <div className="modal-label">반복</div>
                    <div className="modal-categories">
                        {Days.map((day, idx) => (
                            <button
                                type="button"
                                aria-pressed={repeatDays.includes(idx)}
                                key={day}
                                className={`modal-categoryitem ${repeatDays.includes(idx) ? "on" : ""}`}
                                onClick={() => handleDayToggle(idx)}
                            >
                                <span>{day}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {error && <p role="alert">{error}</p>}

                <div className="modal-actions">
                    <button className="leftbutton2" onClick={onClose}>취소</button>
                    <button className="rightbutton" onClick={handleSave}>저장</button>
                </div>
            </div>
        </div>
    );
};

export default RoutineModal;
