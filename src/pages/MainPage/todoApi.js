import { get, post, put, del } from "../../Api";
import config from "../../Config";

export const WEEK_CODES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export const CATEGORY_LABELS = {
  공부: "오늘", 운동: "할 일", 일상: "일정", 동아리: "일정",
  Today: "오늘", Do: "할 일",
};

export const CATEGORY_STYLES = {
  오늘: { backgroundColor: "#E5F8F1", color: "#333" },
  "할 일": { backgroundColor: "#FFC8BE", color: "#333" },
  일정: { backgroundColor: "#B6DAFF", color: "#333" },
};

export function validateRoutine(routine) {
  const start = new Date(`${routine.startDate}T12:00:00`);
  const end = new Date(`${routine.endDate}T12:00:00`);
  const days = routine.repeatDays;
  const validDate = (text, date) => /^\d{4}-\d{2}-\d{2}$/.test(text || "") &&
    Number.isFinite(date.getTime()) &&
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` === text;
  if (!validDate(routine.startDate, start) || !validDate(routine.endDate, end) || start > end || !Array.isArray(days) ||
      !days.length || days.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
    throw new Error("루틴의 시작일, 종료일과 반복 요일을 확인해주세요.");
  }
  for (const day of days) {
    const first = new Date(start);
    first.setDate(first.getDate() + ((day + 1) % 7 - first.getDay() + 7) % 7);
    if (first > end) throw new Error("선택한 기간에 반복 요일이 모두 포함되도록 날짜를 설정해주세요.");
  }
}

export function toTodoModel(todo) {
  if (todo?.todoId == null || typeof todo.description !== "string" || typeof todo.categoryName !== "string" ||
      (todo.completed != null && typeof todo.completed !== "boolean") ||
      (todo.routineEnabled && !WEEK_CODES.includes(todo.week))) {
    throw new Error("할 일 응답을 확인하지 못했습니다. 새로고침 후 확인해주세요.");
  }
  return {
    id: todo.todoId,
    text: todo.description,
    category: todo.categoryName,
    completed: todo.completed === true,
    routine: todo.routineEnabled ? {
      startDate: todo.startDate,
      endDate: todo.endDate,
      repeatDays: [WEEK_CODES.indexOf(todo.week)],
    } : null,
  };
}

export async function loadTodo(id, options) {
  const response = await get(config.TODOS.DETAIL(id), {}, options);
  return toTodoModel(response?.result);
}

export async function saveTodo({ text, category, routine }, date, editingTodo) {
  if (!text.trim() || !category) throw new Error("내용과 카테고리를 선택해주세요.");
  let days = [null];
  if (routine) {
    validateRoutine(routine);
    days = [...new Set(routine.repeatDays)];
  }
  if (editingTodo && Boolean(editingTodo.routine) !== Boolean(routine)) {
    throw new Error("일반 할 일과 루틴의 종류는 바꿀 수 없습니다. 새 항목으로 등록해주세요.");
  }
  if (editingTodo && days.length !== 1) {
    throw new Error("이 루틴의 반복 요일은 하나만 선택해주세요. 다른 요일은 새 루틴으로 등록할 수 있습니다.");
  }

  const saved = [];
  for (let index = 0; index < days.length; index++) {
    const payload = {
      description: text.trim(), categoryName: category, routineEnabled: Boolean(routine),
      ...(routine && { startDate: routine.startDate, endDate: routine.endDate, week: WEEK_CODES[days[index]] }),
    };
    try {
      const response = editingTodo
        ? await put(config.TODOS.DETAIL(editingTodo.id), payload)
        : await post(config.TODOS.GET, payload, { params: { date } });
      saved.push(toTodoModel(response?.result));
    } catch (error) {
      if (saved.length) {
        const partial = new Error("일부 요일은 저장됐지만 나머지는 저장하지 못했습니다. 남은 요일만 다시 저장해주세요.");
        partial.remainingRepeatDays = days.slice(index);
        throw partial;
      }
      throw error;
    }
  }
  return saved;
}

export async function deleteTodo(id, date) {
  await del(config.TODOS.DELETE(id, date));
}
