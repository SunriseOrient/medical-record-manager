import express from "express";
import jwt from "jsonwebtoken";
import config from "../config/environment.js";
import { User } from "../models/User.js";

const router = express.Router();

/**
 * 用户登录
 * POST /api/auth/login
 * 入参: { username, password }
 * 出参: { success, message, userId, username }
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "用户名和密码不能为空",
      });
    }

    // 查找用户
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "用户名或密码错误",
      });
    }

    // TODO: 实现密码校验（临时跳过加密验证）
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "用户名或密码错误",
      });
    }

    // 更新最后登录时间
    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn },
    );

    res.json({
      success: true,
      message: "登录成功",
      userId: user._id,
      username: user.username,
      token,
      expiresIn: config.jwtExpiresIn,
    });
  } catch (error) {
    console.error("登录错误:", error);
    res.status(500).json({
      success: false,
      message: "登录失败",
      error: error.message,
    });
  }
});

/**
 * 用户注册
 * POST /api/auth/register
 * 入参: { username, password }
 * 出参: { success, message, userId }
 */
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "用户名和密码不能为空",
      });
    }

    // 验证用户名格式（3-20个字符，只允许字母数字下划线）
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: "用户名必须为3-20个字符，只能包含字母、数字和下划线",
      });
    }

    // 验证密码长度（至少6个字符）
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "密码长度至少为6个字符",
      });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "用户名已存在",
      });
    }

    // 创建新用户
    const user = await User.create({
      username,
      password, // TODO: 使用 bcrypt 进行密码加密
    });

    res.status(201).json({
      success: true,
      message: "注册成功",
      userId: user._id,
      username: user.username,
    });
  } catch (error) {
    console.error("注册错误:", error);
    res.status(500).json({
      success: false,
      message: "注册失败",
      error: error.message,
    });
  }
});

/**
 * 用户登出
 * POST /api/auth/logout
 */
router.post("/logout", (req, res) => {
  // TODO: 实现 Session/Token 清理
  res.json({
    success: true,
    message: "登出成功",
  });
});

export default router;
