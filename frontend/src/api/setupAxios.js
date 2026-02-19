import axios from "axios";

// ================= BASE CONFIG =================
axios.defaults.baseURL = "http://localhost:5000/api";

axios.defaults.withCredentials = true;

// ================= REQUEST INTERCEPTOR =================
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("loginToken");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (err) => Promise.reject(err)
);

// ================= RESPONSE INTERCEPTOR =================
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh-token")
    ) {
      originalRequest._retry = true;

      try {
        const res = await axios.post("/auth/refresh-token");

        const newAccessToken = res.data.accessToken;

        localStorage.setItem("loginToken", newAccessToken);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return axios(originalRequest);

      } catch (refreshError) {
        localStorage.removeItem("loginToken");
        localStorage.removeItem("user");

        try {
          await axios.post("/auth/logout");
        } catch (e) {}

        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axios;
