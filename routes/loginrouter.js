import express from "express";
import { login, logout, forgotPassword,verifyOTP ,resetPassword } from "../controllers/webAuthCobntroller.js";

const router = express.Router();


router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);
router.post("/login",login)
export default router;
