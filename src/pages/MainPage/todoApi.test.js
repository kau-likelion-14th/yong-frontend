import api from '../../Api';
import { saveTodo, loadTodo, validateRoutine } from './todoApi';
const ok = (config, result) => ({ data: { isSuccess: true, result }, config, status: 200, headers: { 'content-type': 'application/json' } });
const routine = { startDate: '2026-11-01', endDate: '2026-11-30', repeatDays: [0, 6] };

test('일부 요일 저장 실패 후 재시도는 이미 저장된 요일을 중복 생성하지 않는다', async () => {
  const stored = [];
  api.defaults.adapter = async (config) => {
    const data = JSON.parse(config.data);
    if (data.week === 'SUN' && !stored.some((item) => item.week === 'SUN')) {
      stored.push({ failedOnce: true, week: 'SUN' }); throw new Error('Isolated failure');
    }
    const item = { ...data, todoId: stored.length + 1 }; stored.push(item); return ok(config, item);
  };
  let failed;
  try { await saveTodo({ text: '운동', category: '일상', routine }, '2026-11-02'); } catch (error) { failed = error; }
  expect(failed.remainingRepeatDays).toEqual([6]);
  await saveTodo({ text: '운동', category: '일상', routine: { ...routine, repeatDays: failed.remainingRepeatDays } }, '2026-11-02');
  expect(stored.filter((item) => !item.failedOnce).map((item) => item.week)).toEqual(['MON', 'SUN']);
});

test('수정 전 서버 상세 정보에서 루틴 기간과 일요일을 복원한다', async () => {
  api.defaults.adapter = async (config) => ok(config, { todoId: 15, description: '일요일 루틴', categoryName: '공부', routineEnabled: true, startDate: routine.startDate, endDate: routine.endDate, week: 'SUN' });
  const detail = await loadTodo(15);
  expect(detail.routine).toEqual({ ...routine, repeatDays: [6] });
});

test.each([
  { ...routine, startDate: '2026-12-01' },
  { ...routine, repeatDays: [] },
  { ...routine, repeatDays: [7] },
  { ...routine, startDate: '2026-02-31' },
  { startDate: '2026-11-12', endDate: '2026-11-12', repeatDays: [6] },
])('저장될 날짜가 없거나 지원되지 않는 루틴은 저장 전에 거절한다: %j', (value) => {
  expect(() => validateRoutine(value)).toThrow();
});
