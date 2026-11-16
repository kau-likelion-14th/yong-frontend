import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import api from './Api';
import App from './App';

jest.mock('./pages/MainPage/Calendar', () => function TestCalendar({ initialDate, onDateChange, remainingByDate }) {
  return <div>
    <span data-testid="calendar-remaining">{Object.values(remainingByDate).reduce((sum, day) => sum + day.remaining, 0)}</span>
    <button onClick={() => { const day = new Date(initialDate); day.setDate(day.getDate() + 1); onDateChange(day); }}>다음 날</button>
  </div>;
});
jest.mock('./pages/FriendPage/FriendCalendar', () => () => <div>친구 달력</div>);

const key = (day) => `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
const today = key(new Date());
const tomorrowDate = new Date(); tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const tomorrow = key(tomorrowDate);
let db, calls, failure, nextId;
const friend = { userId: 42, userName: '친구테스트#42', introduction: '친구의 서버 소개', profileImageUrl: null };
const songs = [{ songId: 'song-new', title: '새 노래', artist: '새 가수' }, { songId: 'song-old', title: '기존 노래', artist: '기존 가수' }];
const respond = (config, result, isSuccess = true) => ({ data: { isSuccess, result, message: isSuccess ? '성공' : '테스트 저장 실패' }, status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' }, config });
const body = (config) => typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
const rowsOn = (date) => [...db.todos.values()].filter((todo) => todo.dates.has(date));
const dto = (todo, date) => ({ todoId: todo.todoId, description: todo.description, categoryName: todo.categoryName, completed: todo.dates.get(date), routineEnabled: todo.routineEnabled, startDate: todo.startDate, endDate: todo.endDate, week: todo.week });

async function adapter(config) {
  const { url, method, params = {} } = config;
  calls.push({ url, method, params, data: config.data && body(config) });
  if (failure && failure(config)) return respond(config, null, false);
  if (url === '/api/categories') return respond(config, [{ categoryName: '공부' }, { categoryName: '일상' }]);
  if (url === '/api/todos' && method === 'get') return respond(config, rowsOn(params.date).map((todo) => dto(todo, params.date)));
  if (url === '/api/todos' && method === 'post') {
    const data = body(config), dates = new Map();
    if (data.routineEnabled) {
      const codes = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      for (let day = new Date(`${data.startDate}T12:00:00`); key(day) <= data.endDate; day.setDate(day.getDate() + 1)) {
        if (codes[day.getDay()] === data.week) dates.set(key(day), false);
      }
    } else dates.set(params.date, false);
    const todo = { ...data, todoId: nextId++, dates };
    db.todos.set(todo.todoId, todo);
    return respond(config, dto(todo, params.date));
  }
  if (url === '/api/todos/calendar') {
    const counts = new Map();
    for (const todo of db.todos.values()) for (const [date, completed] of todo.dates) {
      if (date.startsWith(`${params.year}-${String(params.month).padStart(2, '0')}`)) counts.set(date, (counts.get(date) || 0) + (completed ? 0 : 1));
    }
    return respond(config, { days: [...counts].map(([date, remaining]) => ({ date, remaining, hasTodo: true })) });
  }
  const match = url.match(/^\/api\/todos\/(\d+)(?:\/dates\/([\d-]+)(\/complete)?)?$/);
  if (match) {
    const todo = db.todos.get(Number(match[1]));
    if (!todo) throw new Error('Fixture record not found');
    if (method === 'get') return respond(config, dto(todo, match[2] || today));
    if (method === 'put') { Object.assign(todo, body(config)); return respond(config, dto(todo, today)); }
    if (method === 'patch') { todo.dates.set(match[2], body(config).completed); return respond(config, dto(todo, match[2])); }
    if (method === 'delete') { if (todo.routineEnabled) todo.dates.delete(match[2]); else db.todos.delete(todo.todoId); return respond(config, null); }
  }
  if (url === '/api/profile') return respond(config, db.profile);
  if (url === '/api/profile/intro') { db.profile.introduction = body(config).introduce; return respond(config, db.profile); }
  if (url === '/api/youtube/me') return respond(config, db.songs);
  if (url === '/api/youtube/search') return respond(config, songs);
  if (url === '/api/youtube/save') {
    const song = songs.find((item) => item.songId === body(config).songId);
    db.songs.push({ ...song, savedAt: new Date(Date.now() + db.songs.length * 1000).toISOString() });
    return respond(config, db.songs[db.songs.length - 1]);
  }
  if (url === '/api/statistic') {
    if (db.stats) return respond(config, db.stats);
    const items = rowsOn(today), completed = items.filter((todo) => todo.dates.get(today)).length;
    return respond(config, { streak: 0, monthPercent: items.length ? Math.floor(completed * 100 / items.length) : 0, mostTodoWeek: completed ? 'SUN' : null });
  }
  if (url === '/api/follow/followings') return respond(config, db.follows);
  if ((url === '/api/follow' || url === '/api/follow/search') && method === 'get') return respond(config, { content: db.follows.length ? [] : [friend], totalPages: db.follows.length ? 0 : 1 });
  if (url === '/api/follow' && method === 'post') { db.follows = [friend]; return respond(config, friend); }
  if (url === '/api/follow' && method === 'delete') { db.follows = []; return respond(config, null); }
  if (url === '/api/follow/42') return respond(config, { username: friend.userName, introduction: friend.introduction, profileImageUrl: null });
  if (url === '/api/follow/42/todos') return respond(config, []);
  if (url === '/api/follow/42/calendar') return respond(config, { days: [] });
  throw new Error(`Unexpected isolated test endpoint: ${method} ${url}`);
}

const mount = (path = '/') => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
async function addTodo(text = '저장 확인') {
  await waitFor(() => expect(screen.getByRole('button', { name: '할 일 추가' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: '할 일 추가' }));
  const dialog = screen.getByRole('dialog', { name: '할 일 추가하기' });
  fireEvent.change(within(dialog).getByLabelText('내용'), { target: { value: text } });
  await waitFor(() => expect(within(dialog).getByRole('button', { name: '저장' })).toBeEnabled());
  fireEvent.click(within(dialog).getByRole('button', { name: '저장' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await screen.findByText(text);
}

beforeEach(() => {
  db = { todos: new Map(), profile: { username: '테스트사용자#1', introduction: '서버 소개', profileImageUrl: null }, songs: [{ ...songs[1], savedAt: '2025-01-01T00:00:00' }], follows: [] };
  calls = []; failure = null; nextId = 100;
  api.defaults.adapter = adapter;
  axios.defaults.adapter = adapter;
  localStorage.clear();
  localStorage.setItem('accessToken', 'isolated-test-session');
  localStorage.setItem('user', JSON.stringify({ username: '테스트사용자' }));
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

test('일반 할 일 생성·수정·완료·삭제는 새 화면에서도 서버 기록을 복원한다', async () => {
  let view = mount();
  await addTodo();
  await waitFor(() => expect(screen.getByTestId('calendar-remaining')).toHaveTextContent('1'));
  expect(db.todos.size).toBe(1);
  expect([...db.todos.keys()][0]).toBe(100);
  view.unmount(); view = mount();
  fireEvent.click(await screen.findByText('저장 확인'));
  let dialog = await screen.findByRole('dialog', { name: '할 일 수정하기' });
  fireEvent.change(within(dialog).getByLabelText('내용'), { target: { value: '수정 확인' } });
  fireEvent.click(within(dialog).getByRole('button', { name: '저장' }));
  await screen.findByText('수정 확인');
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  view.unmount(); view = mount();
  const complete = await screen.findByRole('button', { name: '수정 확인 완료' });
  await waitFor(() => expect(complete).toBeEnabled()); fireEvent.click(complete);
  await screen.findByRole('button', { name: '수정 확인 완료 취소' });
  await waitFor(() => expect(screen.getByTestId('calendar-remaining')).toHaveTextContent('0'));
  view.unmount(); view = mount();
  await screen.findByRole('button', { name: '수정 확인 완료 취소' });
  fireEvent.click(screen.getByText('수정 확인'));
  dialog = await screen.findByRole('dialog', { name: '할 일 수정하기' });
  fireEvent.click(within(dialog).getByRole('button', { name: '삭제' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  view.unmount(); mount();
  await screen.findByText('등록된 할 일이 없습니다.'); expect(db.todos.size).toBe(0);
  await waitFor(() => expect(screen.getByTestId('calendar-remaining')).toHaveTextContent('0'));
});

test('저장 실패 시 입력을 유지하고 성공한 것처럼 목록에 추가하지 않는다', async () => {
  failure = ({ url, method }) => url === '/api/todos' && method === 'post';
  mount();
  await waitFor(() => expect(screen.getByRole('button', { name: '할 일 추가' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: '할 일 추가' }));
  const dialog = screen.getByRole('dialog', { name: '할 일 추가하기' });
  fireEvent.change(within(dialog).getByLabelText('내용'), { target: { value: '실패한 기록' } });
  await waitFor(() => expect(within(dialog).getByRole('button', { name: '저장' })).toBeEnabled());
  fireEvent.click(within(dialog).getByRole('button', { name: '저장' }));
  await within(dialog).findByRole('alert');
  expect(within(dialog).getByLabelText('내용')).toHaveValue('실패한 기록');
  expect(db.todos.size).toBe(0);
  failure = null;
  fireEvent.click(within(dialog).getByRole('button', { name: '저장' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(db.todos.size).toBe(1);
});

test('상세 조회 중 새 할 일을 열면 늦은 조회 응답이 작성 내용을 덮어쓰지 않는다', async () => {
  mount();
  await addTodo('이전 할 일');
  let finishDetail;
  api.defaults.adapter = (config) => {
    if (config.url === '/api/todos/100' && config.method === 'get') {
      return new Promise((resolve) => {
        finishDetail = () => resolve(respond(config, dto(db.todos.get(100), today)));
      });
    }
    return adapter(config);
  };
  fireEvent.click(screen.getByText('이전 할 일'));
  await waitFor(() => expect(finishDetail).toBeDefined());
  fireEvent.click(screen.getByRole('button', { name: '할 일 추가' }));
  const dialog = screen.getByRole('dialog', { name: '할 일 추가하기' });
  fireEvent.change(within(dialog).getByLabelText('내용'), { target: { value: '작성 중인 새 할 일' } });
  await act(async () => { finishDetail(); });
  expect(screen.getByRole('dialog', { name: '할 일 추가하기' })).toBeInTheDocument();
  expect(within(dialog).getByLabelText('내용')).toHaveValue('작성 중인 새 할 일');
});

test('여러 요일 루틴을 저장하고 날짜 이동·재진입 후 복원한다', async () => {
  let view = mount();
  await waitFor(() => expect(screen.getByRole('button', { name: '할 일 추가' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: '할 일 추가' }));
  const outer = screen.getByRole('dialog', { name: '할 일 추가하기' });
  fireEvent.change(within(outer).getByLabelText('내용'), { target: { value: '반복 운동' } });
  fireEvent.click(within(outer).getByRole('button', { name: /루틴 등록하기/ }));
  const routine = screen.getByRole('dialog', { name: '루틴 등록하기' });
  const end = new Date(); end.setDate(end.getDate() + 14);
  fireEvent.change(within(routine).getByLabelText('시작 날짜'), { target: { value: today } });
  fireEvent.change(within(routine).getByLabelText('종료 날짜'), { target: { value: key(end) } });
  const labels = ['일', '월', '화', '수', '목', '금', '토'];
  fireEvent.click(within(routine).getByRole('button', { name: labels[new Date().getDay()], exact: true }));
  fireEvent.click(within(routine).getByRole('button', { name: labels[tomorrowDate.getDay()], exact: true }));
  fireEvent.click(within(routine).getByRole('button', { name: '저장' }));
  fireEvent.click(within(outer).getByRole('button', { name: '저장' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(db.todos.size).toBe(2);
  view.unmount(); view = mount();
  await screen.findByText('반복 운동');
  fireEvent.click(screen.getByRole('button', { name: '다음 날' }));
  await waitFor(() => expect(calls.some((call) => call.url === '/api/todos' && call.params.date === tomorrow)).toBe(true));
  await screen.findByText('반복 운동');
  fireEvent.click(screen.getByText('반복 운동'));
  const edit = await screen.findByRole('dialog', { name: '할 일 수정하기' });
  expect(within(edit).getByText(/반복 요일:/)).toBeInTheDocument();
  fireEvent.click(within(edit).getByRole('button', { name: '삭제' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(rowsOn(tomorrow)).toHaveLength(0);
  expect(rowsOn(today)).toHaveLength(1);
});

test('소개와 선택 노래를 저장하면 마이페이지 재진입 후에도 유지한다', async () => {
  let view = mount('/mypage');
  await screen.findByDisplayValue('서버 소개');
  fireEvent.change(screen.getByLabelText('한 줄 소개'), { target: { value: '변경된 소개' } });
  fireEvent.change(screen.getByLabelText('좋아하는 노래'), { target: { value: '새 노래' } });
  fireEvent.click(screen.getByRole('button', { name: '노래 검색' }));
  fireEvent.click(await screen.findByRole('button', { name: '새 노래 새 가수' }));
  fireEvent.click(screen.getByRole('button', { name: '프로필 저장' }));
  await waitFor(() => expect(window.alert).toHaveBeenCalledWith('프로필이 저장되었습니다.'));
  expect(db.profile.introduction).toBe('변경된 소개');
  view.unmount(); mount('/mypage');
  await screen.findByDisplayValue('변경된 소개');
  await screen.findByDisplayValue('새 노래 - 새 가수');
});

test('노래 저장만 실패하면 이미 저장된 소개와 실패한 변경을 구분해 표시한다', async () => {
  failure = ({ url }) => url === '/api/youtube/save';
  mount('/mypage'); await screen.findByDisplayValue('서버 소개');
  fireEvent.change(screen.getByLabelText('한 줄 소개'), { target: { value: '소개만 저장' } });
  fireEvent.change(screen.getByLabelText('좋아하는 노래'), { target: { value: '새 노래' } });
  fireEvent.click(screen.getByRole('button', { name: '노래 검색' }));
  fireEvent.click(await screen.findByRole('button', { name: '새 노래 새 가수' }));
  fireEvent.click(screen.getByRole('button', { name: '프로필 저장' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('한 줄 소개는 저장되었습니다. 노래 저장에 실패했습니다.');
  expect(window.alert).not.toHaveBeenCalled();
  expect(db.songs).toHaveLength(1); expect(db.profile.introduction).toBe('소개만 저장');
});

test('노래 저장 후 재조회만 실패하면 곡을 다시 선택하거나 중복 저장하지 않고 재시도한다', async () => {
  failure = ({ url }) => url === '/api/youtube/me' &&
    calls.some((call) => call.url === '/api/youtube/save');
  mount('/mypage');
  await screen.findByDisplayValue('서버 소개');
  fireEvent.change(screen.getByLabelText('좋아하는 노래'), { target: { value: '새 노래' } });
  fireEvent.click(screen.getByRole('button', { name: '노래 검색' }));
  fireEvent.click(await screen.findByRole('button', { name: '새 노래 새 가수' }));
  fireEvent.click(screen.getByRole('button', { name: '프로필 저장' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('노래는 저장되었습니다. 저장 내용 다시 불러오기에 실패했습니다.');
  failure = null;
  fireEvent.click(screen.getByRole('button', { name: '프로필 저장' }));
  await waitFor(() => expect(window.alert).toHaveBeenCalledWith('프로필이 저장되었습니다.'));
  expect(screen.getByLabelText('좋아하는 노래')).toHaveValue('새 노래 - 새 가수');
  expect(calls.filter((call) => call.url === '/api/youtube/save')).toHaveLength(1);
});

test('검색한 친구 상세 경로와 팔로우·해제 기록은 재진입 후에도 일치한다', async () => {
  let view = mount('/friends');
  fireEvent.click(await screen.findByRole('button', { name: /친구테스트.*42/ }));
  await screen.findByText('친구의 서버 소개');
  expect(calls.some((call) => call.url === '/api/follow/42')).toBe(true);
  view.unmount(); view = mount('/friends');
  fireEvent.click(await screen.findByRole('button', { name: '팔로우', exact: true }));
  await waitFor(() => expect(db.follows).toHaveLength(1));
  view.unmount(); view = mount('/friends');
  await screen.findByRole('button', { name: '삭제' });
  fireEvent.click(screen.getByRole('button', { name: '삭제' }));
  fireEvent.click(within(screen.getByRole('dialog', { name: '언팔로우 확인' })).getByRole('button', { name: '예' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  view.unmount(); mount('/friends');
  await screen.findByText('팔로우하는 친구가 없습니다.');
  expect(db.follows).toHaveLength(0);
});

test('통계는 재진입 시 최신 값을 읽으며 잘못된 응답을 0으로 위장하지 않는다', async () => {
  let view = mount('/mypage');
  const card = () => screen.getByText('최근 30일 달성률').closest('.stat-card');
  await waitFor(() => expect(card()).toHaveTextContent('0%'));
  db.stats = { streak: 3, monthPercent: 75, mostTodoWeek: 'SUN' };
  view.unmount(); view = mount('/mypage');
  await waitFor(() => expect(card()).toHaveTextContent('75%')); await screen.findByText('일요일');
  failure = ({ url }) => url === '/api/statistic';
  view.unmount(); mount('/mypage');
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('통계를 불러오지 못했습니다.'));
  expect(card()).not.toHaveTextContent('0%');
});

test('다른 탭에서 로그아웃하면 보호된 기록 화면에서 로그인으로 이동한다', async () => {
  mount(); await screen.findByText('등록된 할 일이 없습니다.');
  localStorage.removeItem('accessToken'); localStorage.removeItem('user');
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'accessToken', newValue: null })));
  await screen.findByRole('button', { name: '카카오 로그인' });
});

test('초기 재발급 실패가 다른 탭에서 완료한 로그인을 되돌리지 않는다', async () => {
  localStorage.clear();
  let finishRefresh;
  let refreshStarted;
  const started = new Promise((resolve) => { refreshStarted = resolve; });
  axios.defaults.adapter = (config) => new Promise((resolve) => {
    finishRefresh = () => resolve(respond(config, null, false));
    refreshStarted();
  });
  mount();
  await started;
  localStorage.setItem('accessToken', 'isolated-other-session');
  localStorage.setItem('user', JSON.stringify({ username: '새 계정' }));
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'accessToken', newValue: 'isolated-other-session' })));
  await screen.findByText('등록된 할 일이 없습니다.');
  await act(async () => { finishRefresh(); });
  expect(screen.getByText('등록된 할 일이 없습니다.')).toBeInTheDocument();
});

test('프로필 초기 조회 실패 시 기본값을 서버에 덮어쓰지 않고 재시도할 수 있다', async () => {
  failure = ({ url }) => url === '/api/profile';
  mount('/mypage');
  await screen.findByRole('alert');
  expect(screen.getByRole('button', { name: '프로필 저장' })).toBeDisabled();
  expect(calls.filter((call) => ['post', 'put', 'patch', 'delete'].includes(call.method))).toHaveLength(0);
  failure = null;
  fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
  await screen.findByDisplayValue('서버 소개');
  expect(screen.getByRole('button', { name: '프로필 저장' })).toBeEnabled();
});

test('검색어만 입력하고 저장하면 곡이 저장된 것처럼 안내하지 않는다', async () => {
  mount('/mypage'); await screen.findByDisplayValue('서버 소개');
  fireEvent.change(screen.getByLabelText('좋아하는 노래'), { target: { value: '선택하지 않은 검색어' } });
  fireEvent.click(screen.getByRole('button', { name: '프로필 저장' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('검색 결과에서 저장할 노래를 선택해주세요.');
  expect(window.alert).not.toHaveBeenCalled();
  expect(calls.filter((call) => call.url === '/api/youtube/save')).toHaveLength(0);
});

test('프로필 저장을 연속 클릭해도 저장 요청은 한 번만 전송한다', async () => {
  mount('/mypage'); await screen.findByDisplayValue('서버 소개');
  fireEvent.change(screen.getByLabelText('한 줄 소개'), { target: { value: '한 번만 저장' } });
  const button = screen.getByRole('button', { name: '프로필 저장' });
  fireEvent.click(button); fireEvent.click(button);
  await waitFor(() => expect(window.alert).toHaveBeenCalledWith('프로필이 저장되었습니다.'));
  expect(calls.filter((call) => call.url === '/api/profile/intro')).toHaveLength(1);
});
