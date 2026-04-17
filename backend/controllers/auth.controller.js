import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const createAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m" }
  );

const createRefreshToken = (user) =>
  jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d" }
  );

const sendRefreshTokenCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? "none" : "lax",
    path:     "/",
    maxAge:   7 * 24 * 60 * 60 * 1000,
  });
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
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

    const accessToken  = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    // Store hashed refresh token — never store plain tokens in the DB
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await user.save();

    sendRefreshTokenCookie(res, refreshToken);

    return res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
    });
  } catch (error) {
    console.error("Auth error (login):", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

// ── REFRESH TOKEN ─────────────────────────────────────────────────────────────
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // ✅ Correct: compare plain token against stored bcrypt hash
    const isValidToken = await bcrypt.compare(token, user.refreshToken);
    if (!isValidToken) {
      console.warn(`[Auth] Refresh token mismatch for user ${user._id} — possible token reuse.`);
      return res.status(401).json({ message: "Token reuse detected" });
    }

    const newAccessToken = createAccessToken(user);
    // Slide the cookie expiry (same token, new maxAge)
    sendRefreshTokenCookie(res, token);

    return res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Auth error (refresh):", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

// ── LOGOUT ────────────────────────────────────────────────────────────────────
export const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const user    = await User.findById(decoded.id);

        if (user && user.refreshToken) {
          // ✅ FIX: the stored value IS a bcrypt hash — use bcrypt.compare,
          // not raw string equality. The old code did `user.refreshToken === token`
          // which is always false because the stored value is the hash.
          const isOwner = await bcrypt.compare(token, user.refreshToken);
          if (isOwner) {
            user.refreshToken = undefined;
            await user.save();
          }
        }
      } catch {
        // Ignore invalid/expired token on logout — still clear the cookie
      }
    }

    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure:   isProd,
      sameSite: isProd ? "none" : "lax",
      path:     "/",
    });

    return res.json({ message: "Logged out" });
  } catch (error) {
    console.error("Auth error (logout):", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};