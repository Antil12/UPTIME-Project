import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "USER",
    });

    res.json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};