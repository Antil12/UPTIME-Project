import axios from "axios";

// ================= BASE CONFIG =================
axios.defaults.baseURL = "http://localhost:5000/api";
axios.defaults.withCredentials = true; // send refresh cookie

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

    // If access token expired
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint
        const res = await axios.post("/auth/refresh");

        const newAccessToken = res.data.accessToken;

        // Store new access token
        localStorage.setItem("loginToken", newAccessToken);

        // Attach new token to failed request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry original request
        return axios(originalRequest);

      } catch (refreshError) {
        // Refresh failed → logout
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
