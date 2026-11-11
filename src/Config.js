const config = {
    API_URL: "",

    AUTH: {
        KAKAO: "/api/auth/kakao",
        REISSUE: "/api/auth/reissue",
        LOGOUT: "/api/auth/logout",
        WITHDRAW: "/api/auth/withdraw",
    },

    TODOS: {
        GET: "/api/todos",
        CALENDAR: "/api/todos/calendar",
        COMPLETE: (id, date) => `/api/todos/${encodeURIComponent(id)}/dates/${encodeURIComponent(date)}/complete`,
    },

    CATEGORIES: {
        GET: "/api/categories",
    },

    FOLLOW: {
        PROFILE: (id) => `/api/follow/${encodeURIComponent(id)}`,
        TODOS: (id) => `/api/follow/${encodeURIComponent(id)}/todos`,
        CALENDAR: (id) => `/api/follow/${encodeURIComponent(id)}/calendar`,
        FOLLOWINGS: "/api/follow/followings",
        AVAILABLE: "/api/follow",
        DELETE: "/api/follow",
        SEARCH: "/api/follow/search",
        CREATE: "/api/follow",
    },

    PROFILE: {
        GET: "/api/profile",
        PUT: "/api/profile",
        DELETE: "/api/profile",
        INTRO: "/api/profile/intro",
    },
};

export default config;
