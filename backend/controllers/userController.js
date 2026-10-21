import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import userModel from "../models/userModel.js";
import walletTransactionModel from "../models/walletTransactionModel.js";
import { queueMail } from "../utils/mail.js";
import { sendResetEmail, sendWelcomeEmail } from "../utils/accountMail.js";

const hashResetToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const findUserByEmail = (email) => {
  const safe = String(email).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return userModel.findOne({ email: { $regex: new RegExp(`^${safe}$`, "i") } });
};

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

// Route for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "User doesn't exist",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = createToken(user._id);

      res.json({
        success: true,
        token,
      });
    } else {
      res.json({
        success: false,
        message: "Invalid credentials",
      });
    }
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Route for user register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // checking user already exists or not
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }

    // validating email format & strong password
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password",
      });
    }

    // hashing user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
    });

    const user = await newUser.save();
    queueMail(() => sendWelcomeEmail(user));

    const token = createToken(user._id);

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Route for admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId; // set by your authUser middleware

    if (!currentPassword || !newPassword) {
      return res.json({ success: false, message: "All fields are required" });
    }

    if (newPassword.length < 8) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await userModel.findByIdAndUpdate(userId, { password: hashed });

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim();
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Enter a valid email" });
    }

    const generic = {
      success: true,
      message: "If this email is registered, a reset link is on its way.",
    };

    const user = await findUserByEmail(email);
    if (!user) return res.json(generic);

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = hashResetToken(token);
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000;
    await user.save();

    const result = await sendResetEmail(user, token);
    if (!result?.sent) {
      user.resetPasswordToken = "";
      user.resetPasswordExpires = 0;
      await user.save();
      return res.json({
        success: false,
        message: "We could not send the reset email. Try again in a moment.",
      });
    }

    res.json(generic);
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const token = String(req.body.token || "").trim();
    const password = String(req.body.password || "");

    if (!token) {
      return res.json({ success: false, message: "Reset link is invalid" });
    }
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const user = await userModel.findOne({
      resetPasswordToken: hashResetToken(token),
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.json({
        success: false,
        message: "This reset link is invalid or has expired",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = "";
    user.resetPasswordExpires = 0;
    await user.save();

    res.json({ success: true, message: "Password updated. You can sign in now." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await userModel
      .findById(req.userId)
      .select("-password -resetPasswordToken -resetPasswordExpires");
    if (!user) return res.json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

const getWallet = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId).select("walletBalance");
    if (!user) return res.json({ success: false, message: "User not found" });
    const transactions = await walletTransactionModel
      .find({ userId: String(req.userId) })
      .sort({ date: -1 })
      .limit(40);
    res.json({
      success: true,
      balance: user.walletBalance || 0,
      transactions,
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { name, phone, location } = req.body;
    await userModel.findByIdAndUpdate(req.userId, { name, phone, location });
    res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};



export {
  loginUser,
  registerUser,
  adminLogin,
  changePassword,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  getWallet,
};
