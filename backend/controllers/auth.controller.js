import User from "../models/User.js";
import jwt from "jsonwebtoken";

const createAccessToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role  }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  });
};

const createRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  });
};

const sendRefreshTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/",
  
  };

  res.cookie("refreshToken", token, cookieOptions);
};

// ================= SIGNUP =================
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password });

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    // store refresh token on user for rotation/revocation
    user.refreshToken = refreshToken;
    await user.save();

    sendRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email,   role: user.role   },
      accessToken,
    });
  } catch (error) {
    console.error("Auth error (signup):", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
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
      user: { id: user._id, name: user.name, email: user.email,role: user.role   },
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
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

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

    if (user.refreshToken !== token) {
      user.refreshToken = undefined;
      await user.save();
      return res.status(401).json({ message: "Refresh token revoked" });
    }

    const newAccessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    sendRefreshTokenCookie(res, newRefreshToken);

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
        // ignore invalid token
      }
    }

    res.clearCookie("refreshToken", { path: "/api/auth/" });
    res.json({ message: "Logged out" });
  } catch (error) {
    console.error("Auth error (logout):", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};
