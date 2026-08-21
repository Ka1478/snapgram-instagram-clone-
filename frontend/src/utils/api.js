import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5003";

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,  // ✅ now correctly http://localhost:5003/api
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;