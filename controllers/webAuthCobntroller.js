
import jwt from "jsonwebtoken";
import { hashPassword,comparePassword } from "../service/encryption.js";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
import { Employee } from "../models/employee.js";

const otpStore = new Map();
dotenv.config();

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn("SENDGRID_API_KEY not set; emails will be logged to console");
}

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "username and password are required",
      });
    }

    const employee = await Employee.findOne({ email: username });
    if (!employee) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!employee.password) {
      console.error("Employee password is empty/null - please reset password");
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const match = await comparePassword(password, employee.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // prepare data to store in cookie (avoid including sensitive fields)
    const empData = {
      empId: employee._id,
      firstName: employee.name,
      email: employee.email,
    };

    const token = jwt.sign(
      empData,
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,    
      secure: false,      
      path: "/",          
      sameSite: "lax",    
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token: token, 
      data: empData,
    });


  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Email not found" });
    }

    // generate 6-digit OTP and expiration
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 60 * 60 * 1000; // 1h minutes

    // replace any previous entry
    otpStore.set(email, { otp, expires });

    const msg = {
      to: email,
      from: "praveenbesetti0@gmail.com",
      subject: "Your password reset code",
      text: `Your OTP for password reset is ${otp}. It expires in 5 minutes.`,
    };

    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send(msg);
    }

    res.status(200).json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP required" });
    }

    const entry = otpStore.get(email);
    if (!entry || entry.otp !== otp || entry.expires < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    res.status(200).json({ success: true, message: "OTP valid" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: "Email, OTP and new password are required" });
        }

        // 1. Verify OTP (DO NOT DELETE YET)
        const entry = otpStore.get(email);
        if (!entry || entry.otp !== otp || entry.expires < Date.now()) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        // 2. Find the employee
        const employee = await Employee.findOne({ email });
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        // 3. Encrypt using your existing service function
        const hashedPassword = await hashPassword(newPassword);

        // 4. Update the password field and save
        employee.password = hashedPassword;
        await employee.save();

        // 5. SUCCESS: Now safe to delete the OTP
        otpStore.delete(email);

        res.status(200).json({ 
            success: true, 
            message: "Password reset and encrypted successfully" 
        });

    } catch (error) {
        console.error("Reset Password Error:", error.message);
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error during password reset" 
        });
    }
};



export const logout = async (req, res) => {
  try {

    const { empId, timestamp, workAccumulated, breakAccumulated, isOnBreak } = req.body; // Date from frontend (e.g., "2026-02-27")
    const logoutTime = new Date();

    // 1. Find the existing attendance for today
    const attendance = await Attendance.findOne({ empId, date: new Date().toISOString().split("T")[0] });


    if (!attendance) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    // 2. Set logout time
    attendance.logoutTime = logoutTime;


    // 4. Calculate Net Work Duration (Total - Breaks)
    // totalBreakDuration is already stored in ms in your schema
    const netWorkMs = (attendance.totalWorkDuration || 0) + (attendance.totalBreakDuration || 0);

    // Convert to hours for status check
    const netWorkHours = netWorkMs / (1000 * 60 * 60);

    // 5. Apply Business Rules for Status
    if (netWorkHours < 4) {
      attendance.status = "Absent";
    } else if (netWorkHours < 5) {
      attendance.status = "Half-Day";
    } else {
      attendance.status = "Present";
    }

    // Optional: Update final work duration in schema
    attendance.totalBreakDuration = attendance.totalBreakDuration + breakAccumulated;
    attendance.isOnBreak = isOnBreak;
    attendance.totalWorkDuration = attendance.totalWorkDuration + workAccumulated;


    const dat = await attendance.save();
    // 6. Clear Cookies
    res.clearCookie("username");
    res.clearCookie("department");
    res.clearCookie("employee");

    return res.status(200).json({
      success: true,
      message: `Logged out. Work Hours: ${netWorkHours.toFixed(2)}. Status: ${attendance.status}`,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
