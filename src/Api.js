import axios from "axios";
import config from "./Config";

const api = axios.create({
    baseURL: config.API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

let refreshPromise = null;

export const renewAccessToken = () => {
    if (!refreshPromise) {
        const previousToken = localStorage.getItem("accessToken");
        const previousUser = localStorage.getItem("user");
        refreshPromise = axios.post(config.AUTH.REISSUE, {}, { baseURL: config.API_URL, withCredentials: true })

        .then(({data}) => {
            const token = data?.result;

        if (
            data?.isSuccess === false ||
            typeof token !== "string" ||
            !token
        ) {
            throw new Error("토큰 재발급에 실패했습니다.");
        }
        if (localStorage.getItem("accessToken") !== previousToken || localStorage.getItem("user") !== previousUser) {
            throw new Error("로그인 상태가 변경되었습니다.");
        }
        localStorage.setItem("accessToken", token);

        window.dispatchEvent(new Event("auth:changed"));

        return token;
    })
    .finally(() => {
        refreshPromise = null;
    });
    }
    return refreshPromise;
};

api.interceptors.request.use((request) => {
    request._sessionUser = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");
    if (token) {
        request.headers["Authorization"] = `Bearer ${token}`;
    }
    return request;
});

api.interceptors.response.use(
    (response) => {
        if (response.data?.isSuccess === false) {
            const error = new Error(response.data.message || "요청을 처리하지 못했습니다.");
            error.response = response;
            throw error;
        }
        return response;
    },
    async (error) => {
        const original = error.config;
        const url = original?.url || "";
        const status = error.response?.status;
        const code = error.response?.data?.code;
        const authenticationError = status === 401 ||
            (status === 403 && ["JWT_4032", "JWT_4033"].includes(code));

        if (
            !authenticationError ||
            !original ||
            original._retry ||
            original._sessionUser !== localStorage.getItem("user") ||
            url.includes(config.AUTH.KAKAO) ||
            url.includes(config.AUTH.REISSUE)
        ) {
            return Promise.reject(error);
        }

        original._retry = true;
        const previousToken = localStorage.getItem("accessToken");

        try {
            const token = await renewAccessToken();
            original.headers = original.headers || {};

            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
        } catch (refreshError) {
            if (localStorage.getItem("accessToken") === previousToken) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                window.dispatchEvent(new Event("auth:changed"));
            }
            return Promise.reject(refreshError);
        }
    }
    

    

);

// ===== 공통 요청 함수들 =====

const validateContentType = (response) => {
  const contentType = response.headers?.["content-type"] || "";
  if (!contentType.includes("json")) {
    console.warn("JSON이 아닌 응답 Content-qType:", contentType);
  }
};

// GET
export const get = async (endpoint, params = {}, options = {}) => {
  const response = await api.get(endpoint, { params, ...options });
  validateContentType(response);
  return response.data;
};

// POST (JSON)
export const post = async (endpoint, data, options = {}) => {
  const response = await api.post(endpoint, data, options);
  validateContentType(response);
  return response.data;
};

// PUT (JSON)
export const put = async (endpoint, data = {}, options = {}) => {
  const response = await api.put(endpoint, data, options);
  validateContentType(response);
  return response.data;
};

// DELETE
export const del = async (endpoint, options = {}) => {
  const response = await api.delete(endpoint, options);
  validateContentType(response);
  return response.data;
};

// PATCH (일반 JSON PATCH)
export const patch = async (endpoint, data = {}, options = {}) => {
  const response = await api.patch(endpoint, data, options);
  validateContentType(response);
  return response.data;
};

export const uploadImageWithJson = async (
  endpoint,
  imageFile,
  jsonData,
  {
    imageField = "coverImage",
    jsonField = "readingLog",
    method = "post",
    ...options
  } = {}
) => {
  const formData = new FormData();
  if (imageFile) formData.append(imageField, imageFile);

  formData.append(jsonField, JSON.stringify(jsonData));

  const response = await api.request({
    url: endpoint,
    method, // "post" | "put" | "patch"
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
    ...options,
  });

  validateContentType(response);
  return response.data;
};

export const uploadProfile = async (
  endpoint,
  { intro, song, imageFile },
  {
    introField = "intro",
    songField = "song",
    imageField = "image",
    method = "put",
    ...options
  } = {}
) => {
  const formData = new FormData();

  if (intro !== undefined) formData.append(introField, intro);
  if (song !== undefined) formData.append(songField, song);

  if (imageFile) {
    // 서버의 프로필 규격에 맞춰 줄여서 원본 이미지 처리 중 메모리 부족을 방지합니다.
    const image = await createImageBitmap(imageFile);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;

      const size = Math.min(image.width, image.height);
      const context = canvas.getContext("2d");
      context.drawImage(
        image,
        (image.width - size) / 2, (image.height - size) / 2, size, size,
        0, 0, canvas.width, canvas.height
      );

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) {
        throw new Error("프로필 사진을 변환하지 못했습니다. 다른 사진으로 다시 시도해주세요.");
      }
      formData.append(imageField, blob, "profile.png");
    } finally {
      image.close();
    }
  }

  const response = await api.request({
    url: endpoint,
    method,
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
    ...options,
  });

  validateContentType(response);
  return response.data;
};
export default api;
