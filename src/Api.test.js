import axios from 'axios';
import api, { get, post, renewAccessToken, uploadProfile } from './Api';
const response = (config, result, isSuccess = true) => ({ data: { isSuccess, result, message: '검증 오류' }, status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' }, config });
beforeEach(() => { localStorage.clear(); localStorage.setItem('accessToken', 'isolated-old-session'); });
afterEach(() => { jest.restoreAllMocks(); delete global.createImageBitmap; });

test('HTTP 200이어도 업무 실패 응답은 저장 성공으로 처리하지 않는다', async () => {
  api.defaults.adapter = async (config) => response(config, null, false);
  await expect(post('/api/todos', {})).rejects.toThrow('검증 오류');
});

test.each([[401, 'JWT_4011'], [403, 'JWT_4032'], [403, 'JWT_4033']])('인증 오류 %s %s의 동시 요청들은 토큰을 한 번만 갱신하고 재요청한다', async (status, code) => {
  let renewals = 0;
  axios.defaults.adapter = async (config) => {
    expect(config.url).toBe('/api/auth/reissue'); renewals++;
    return response(config, 'isolated-new-session');
  };
  api.defaults.adapter = async (config) => {
    if (config.headers.Authorization !== 'Bearer isolated-new-session') {
      const res = { ...response(config, null), status };
      res.data.code = code;
      throw new axios.AxiosError('Expired isolated session', 'ERR_BAD_REQUEST', config, {}, res);
    }
    return response(config, { ok: true });
  };
  const results = await Promise.all([get('/api/profile'), get('/api/statistic')]);
  expect(renewals).toBe(1); expect(results.every((item) => item.result.ok)).toBe(true);
  expect(localStorage.getItem('accessToken')).toBe('isolated-new-session');
});

test('Todo 접근 권한 오류는 토큰을 갱신하거나 로그인 정보를 지우지 않는다', async () => {
  const renew = jest.spyOn(axios, 'post');
  api.defaults.adapter = async (config) => {
    const res = { ...response(config, null), status: 403 };
    res.data.code = 'TODO_4031';
    throw new axios.AxiosError('Forbidden Todo', 'ERR_BAD_REQUEST', config, {}, res);
  };
  await expect(get('/api/todos/42')).rejects.toHaveProperty('response.status', 403);
  expect(renew).not.toHaveBeenCalled();
  expect(localStorage.getItem('accessToken')).toBe('isolated-old-session');
});

test.each([null, 'isolated-other-session'])('재발급 중 로그인 상태가 %s로 변경되면 늦은 응답을 저장하지 않는다', async (nextToken) => {
  let finishRefresh;
  axios.defaults.adapter = (config) => new Promise((resolve) => {
    finishRefresh = () => resolve(response(config, 'isolated-renewed-session'));
  });
  const renewal = renewAccessToken();
  const rejected = expect(renewal).rejects.toThrow('로그인 상태가 변경되었습니다.');
  await Promise.resolve();
  if (nextToken === null) localStorage.removeItem('accessToken');
  else localStorage.setItem('accessToken', nextToken);
  finishRefresh();
  await rejected;
  expect(localStorage.getItem('accessToken')).toBe(nextToken);
});

test('토큰이 없는 상태의 재발급 중 로그아웃해도 이전 로그인 정보를 복원하지 않는다', async () => {
  localStorage.removeItem('accessToken');
  localStorage.setItem('user', JSON.stringify({ id: 1 }));
  let finishRefresh;
  axios.defaults.adapter = (config) => new Promise((resolve) => {
    finishRefresh = () => resolve(response(config, 'isolated-renewed-session'));
  });
  const renewal = renewAccessToken();
  const rejected = expect(renewal).rejects.toThrow('로그인 상태가 변경되었습니다.');
  await Promise.resolve();
  localStorage.removeItem('user');
  finishRefresh();
  await rejected;
  expect(localStorage.getItem('accessToken')).toBeNull();
});

test('이전 세션의 재발급 실패가 새로 로그인한 계정 정보를 지우지 않는다', async () => {
  let failRefresh;
  let refreshStarted;
  const started = new Promise((resolve) => { refreshStarted = resolve; });
  axios.defaults.adapter = () => new Promise((resolve, reject) => {
    failRefresh = () => reject(new Error('이전 세션 만료'));
    refreshStarted();
  });
  api.defaults.adapter = async (config) => {
    const res = { ...response(config, null), status: 401 };
    throw new axios.AxiosError('Expired isolated session', 'ERR_BAD_REQUEST', config, {}, res);
  };
  const request = get('/api/profile');
  const rejected = expect(request).rejects.toThrow('이전 세션 만료');
  await started;
  localStorage.setItem('accessToken', 'isolated-other-session');
  localStorage.setItem('user', JSON.stringify({ username: '새 계정' }));
  failRefresh();
  await rejected;
  expect(localStorage.getItem('accessToken')).toBe('isolated-other-session');
  expect(JSON.parse(localStorage.getItem('user')).username).toBe('새 계정');
});

test('계정을 전환한 뒤 도착한 인증 오류로 이전 저장 요청을 다시 보내지 않는다', async () => {
  localStorage.setItem('user', JSON.stringify({ id: 1 }));
  let rejectOldRequest;
  let requestStarted;
  const started = new Promise((resolve) => { requestStarted = resolve; });
  const renew = jest.spyOn(axios, 'post').mockResolvedValue(response({}, 'isolated-other-renewed-session'));
  let writes = 0;
  api.defaults.adapter = (config) => {
    if (config.headers.Authorization === 'Bearer isolated-old-session') {
      return new Promise((resolve, reject) => {
        rejectOldRequest = () => reject(new axios.AxiosError('Expired old account', 'ERR_BAD_REQUEST', config, {}, { ...response(config, null), status: 401 }));
        requestStarted();
      });
    }
    writes++;
    return Promise.resolve(response(config, { ok: true }));
  };
  const request = post('/api/profile/intro', { introduce: '이전 계정 소개' });
  const rejected = expect(request).rejects.toThrow('Expired old account');
  await started;
  localStorage.setItem('accessToken', 'isolated-other-session');
  localStorage.setItem('user', JSON.stringify({ id: 2 }));
  rejectOldRequest();
  await rejected;
  expect(renew).not.toHaveBeenCalled();
  expect(writes).toBe(0);
  expect(localStorage.getItem('accessToken')).toBe('isolated-other-session');
});

test('큰 프로필 이미지를 중앙 정사각형 256px PNG로 변환해서 업로드한다', async () => {
  const bitmap = { width: 4000, height: 3000, close: jest.fn() };
  global.createImageBitmap = jest.fn().mockResolvedValue(bitmap);
  const drawImage = jest.fn();
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage });
  jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (callback, type) {
    expect(this.width).toBe(256); expect(this.height).toBe(256); expect(type).toBe('image/png');
    callback(new Blob(['isolated-image'], { type }));
  });
  let uploaded;
  api.defaults.adapter = async (config) => { uploaded = config.data.get('image'); return response(config, { profileImageUrl: '/isolated-profile.png' }); };
  await uploadProfile('/api/profile', { imageFile: new File(['source'], 'large.jpg', { type: 'image/jpeg' }) });
  expect(uploaded.type).toBe('image/png'); expect(uploaded.name).toBe('profile.png');
  expect(drawImage).toHaveBeenCalledWith(bitmap, 500, 0, 3000, 3000, 0, 0, 256, 256);
  expect(bitmap.close).toHaveBeenCalledTimes(1);
});

test('이미지 변환 실패는 서버에 빈 파일을 보내지 않고 메모리를 해제한다', async () => {
  const bitmap = { width: 100, height: 100, close: jest.fn() };
  global.createImageBitmap = jest.fn().mockResolvedValue(bitmap);
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: jest.fn() });
  jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(null));
  const adapter = jest.fn(); api.defaults.adapter = adapter;
  await expect(uploadProfile('/api/profile', { imageFile: new File(['x'], 'photo.png') })).rejects.toThrow('변환');
  expect(adapter).not.toHaveBeenCalled(); expect(bitmap.close).toHaveBeenCalledTimes(1);
});
