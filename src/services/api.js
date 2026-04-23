import axios from "axios";
export const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://chat-bot-production-ac8f.up.railway.app";
export const API_BASE = import.meta.env.VITE_API_BASE || "/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("at");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.get(`${API_BASE}/Auth/refresh-token`, {
          withCredentials: true,
        });
        const newToken =
          data.data?.accessToken ||
          data.accessToken ||
          data.access_token ||
          data.token;
        if (newToken) {
          localStorage.setItem("at", newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch {
        localStorage.removeItem("at");
        localStorage.removeItem("un");
        localStorage.removeItem("ue");
        window.location.reload();
      }
    }
    return Promise.reject(err);
  },
);

export default api;

export const authApi = {
  login: (data) => api.post("/Auth/login", data),
  signup: (data) => api.post("/Auth/signup", data),
  confirmEmail: (data) => api.post("/Auth/confirm-email", data),
  resendOtp: (email) => api.get("/Auth/resend-OTP", { params: { email } }),
  signupGoogle: (idToken) => api.post("/Auth/signup-Gmail", { idToken }),
  refresh: () => api.get("/Auth/refresh-token"),
};

export const chatApi = {
  getConversations: (cursor, limit = 20) =>
    api.get("/chat/conversations", { params: { cursor, limit } }),

  getHistory: (conversationId, cursor, limit = 20) =>
    api.get(`/chat/${conversationId}/history`, { params: { cursor, limit } }),
};
