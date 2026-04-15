import axios from "axios";

// ================= BASE CONFIG =================
axios.defaults.baseURL = import.meta.env.VITE_API_URL;
axios.defaults.withCredentials = true;

// ================= TOKEN EXPIRY HELPERS =================

/**
 * Decode a JWT payload without verifying signature.
 * Returns null if the token is missing or malformed.
 */
const decodeJWT = (token) => {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

/**
 * Returns true if the token is missing or will expire within `bufferMs`
 * milliseconds (default 60 s — fires 60 s before the 15-min expiry).
 */
const isTokenExpiringSoon = (token, bufferMs = 60_000) => {
  if (!token) return true;
  const payload = decodeJWT(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 - Date.now() < bufferMs;
};

// ================= REFRESH LOGIC =================

let isRefreshing = false;
let waitingQueue = [];

const processQueue = (error, newToken = null) => {
  waitingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(newToken);
  });
  waitingQueue = [];
};

const forceLogout = async () => {
  localStorage.removeItem("loginToken");
  localStorage.removeItem("user");
  clearProactiveRefresh(); // stop the timer
  try {
    // Use fetch (not axios) to avoid triggering interceptors
    await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (_) {}
  window.location.href = "/login";
};

/**
 * Core refresh function — uses fetch (not axios) so it NEVER
 * triggers the response interceptor and creates a circular loop.
 */
const doRefresh = async () => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh-token`, {
    method: "POST",
    credentials: "include",          // sends the httpOnly refreshToken cookie
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body?.message || "Refresh failed");
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  return data.accessToken; // string
};

// ================= PROACTIVE REFRESH TIMER =================
// Fires 60 s before the current access token would expire,
// keeping the user logged in silently.

let proactiveTimer = null;

const scheduleProactiveRefresh = (token) => {
  clearProactiveRefresh();

  const payload = decodeJWT(token);
  if (!payload?.exp) return;

  // Refresh 60 s before expiry (minimum 5 s to avoid immediate fire)
  const msUntilRefresh = Math.max(payload.exp * 1000 - Date.now() - 60_000, 5_000);

  proactiveTimer = setTimeout(async () => {
    const current = localStorage.getItem("loginToken");
    if (!current) return; // user already logged out

    try {
      const newToken = await doRefresh();
      localStorage.setItem("loginToken", newToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      console.info("[Auth] Proactive token refresh successful.");
      scheduleProactiveRefresh(newToken); // schedule the next one
    } catch (err) {
      console.error("[Auth] Proactive refresh failed:", err.message);
      // Don't force-logout here; let the next 401 response handle it
      // so we don't log out users who simply closed the tab briefly.
    }
  }, msUntilRefresh);
};

const clearProactiveRefresh = () => {
  if (proactiveTimer) {
    clearTimeout(proactiveTimer);
    proactiveTimer = null;
  }
};

// Kick off proactive refresh for any token already in storage
// (e.g. page reload when user is still logged in)
const existingToken = localStorage.getItem("loginToken");
if (existingToken && !isTokenExpiringSoon(existingToken, 0)) {
  scheduleProactiveRefresh(existingToken);
}

// ================= REQUEST INTERCEPTOR =================
axios.interceptors.request.use(
  async (config) => {
    // Skip auth header for the refresh endpoint itself
    if (config.url?.includes("/auth/refresh-token")) return config;

    let token = localStorage.getItem("loginToken");

    // If token is expiring within the next 60 s, refresh proactively
    // before the request goes out (avoids a round-trip 401)
    if (token && isTokenExpiringSoon(token)) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await doRefresh();
          localStorage.setItem("loginToken", newToken);
          axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
          scheduleProactiveRefresh(newToken);
          processQueue(null, newToken);
          token = newToken;
        } catch (err) {
          processQueue(err, null);
          await forceLogout();
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Another refresh is in progress — wait for it
        token = await new Promise((resolve, reject) => {
          waitingQueue.push({ resolve, reject });
        });
      }
    }

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (err) => Promise.reject(err)
);

// ================= RESPONSE INTERCEPTOR =================
// Handles unexpected 401s that slip through (e.g. clock skew, server restart)
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const message = error.response?.data?.message || "";

    // ── CASE 1: User deleted → hard logout ─────────────────────────────────
    if (
      status === 401 &&
      (message.includes("User deleted") || message.includes("User no longer exists"))
    ) {
      await forceLogout();
      return Promise.reject(error);
    }

    // ── CASE 2: Unexpected 401 → try silent refresh once ──────────────────
    const isRefreshEndpoint = originalRequest?.url?.includes("/auth/refresh-token");
    if (status === 401 && !originalRequest._retry && !isRefreshEndpoint) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          waitingQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      try {
        const newToken = await doRefresh();
        localStorage.setItem("loginToken", newToken);
        axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        scheduleProactiveRefresh(newToken);
        processQueue(null, newToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        console.error(
          "[Auth] Reactive refresh failed — status:",
          refreshError.status,
          "| message:",
          refreshError.message
        );
        processQueue(refreshError, null);
        await forceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ================= EXPORTS =================
// Call scheduleProactiveRefresh after a successful login so the timer starts.
export { scheduleProactiveRefresh, clearProactiveRefresh };
export default axios;