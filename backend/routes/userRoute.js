import express from "express";
import {
  loginUser,
  registerUser,
  adminLogin,
  changePassword,
  getUserProfile,
  updateUserProfile,
  getWallet,
} from "../controllers/userController.js";
import authUser from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/admin", adminLogin);
userRouter.post("/change-password", authUser, changePassword);
userRouter.get("/profile", authUser, getUserProfile);
userRouter.get("/wallet", authUser, getWallet);
userRouter.post("/update-profile", authUser, updateUserProfile);

export default userRouter;
