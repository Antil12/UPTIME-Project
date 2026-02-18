import axios from "axios";

// base URL for API
axios.defaults.baseURL = "http://localhost:5000/api";

// attach access token from localStorage
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("loginToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    // send cookies (for refresh token) by default
    config.withCredentials = true;
    return config;
  },
  (err) => Promise.reject(err)
);

// on 401 -> clear auth and redirect to login
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("loginToken");
      localStorage.removeItem("user");
      try {
        // best-effort: call backend logout to clear refresh cookie
        axios.post("/auth/logout", {}, { withCredentials: true }).catch(() => {});
      } catch (e) {}
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default axios;
