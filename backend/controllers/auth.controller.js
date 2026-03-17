import User from "../models/user.model.js";
import { generateToken } from "../utils/token.js";

export const register = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? "Email already in use" : "Username already taken",
      });
    }

    const user = await User.create({ username, email, password, fullName });
    generateToken(user._id, res);

    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        followers: user.followers,
        following: user.following,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        followers: user.followers,
        following: user.following,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie("jwt");
  res.json({ success: true, message: "Logged out successfully" });
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("followers", "username avatar fullName")
      .populate("following", "username avatar fullName");

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
