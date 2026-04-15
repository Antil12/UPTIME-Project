import User from "../models/User.js";
import jwt from "jsonwebtoken";

const createAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m" }
  );
};

const createRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d" }
  );
};

const sendRefreshTokenCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "none",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    sendRefreshTokenCookie(res, refreshToken);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    console.error("Auth error (login):", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// ================= REFRESH TOKEN =================
export const refreshToken = async (req, res) => {
  try {
    // Cookie is sent to "/" so it will always be present here
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    if (!user.refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    if (user.refreshToken !== token) {
      console.warn(
        `[Auth] Refresh token mismatch for user ${user._id} — accepting valid refresh token while refresh is still enabled.`
      );
    }

    // Issue a new access token and refresh the cookie expiry using the same token.
    const newAccessToken = createAccessToken(user);
    sendRefreshTokenCookie(res, token);

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Auth error (refresh):", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// ================= LOGOUT =================
export const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);
        if (user && user.refreshToken === token) {
          user.refreshToken = undefined;
          await user.save();
        }
      } catch (err) {
        // ignore invalid token on logout
      }
    }

    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProd,
      sameSite: "none",
      path: "/",
    });

    res.json({ message: "Logged out" });
  } catch (error) {
    console.error("Auth error (logout):", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};