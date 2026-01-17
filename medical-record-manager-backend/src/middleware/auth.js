import jwt from "jsonwebtoken";
import config from "../config/environment.js";

const TOKEN_PREFIX = "Bearer ";

export const authenticateToken = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    const tokenFromHeader =
      header && header.startsWith(TOKEN_PREFIX)
        ? header.slice(TOKEN_PREFIX.length)
        : null;
    const token = tokenFromHeader || req.query.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "未登录",
      });
    }

    const payload = jwt.verify(token, config.jwtSecret);
    req.user = {
      userId: payload.userId,
      username: payload.username,
      tokenExpiresAt: payload.exp ? payload.exp * 1000 : null,
    };
    return next();
  } catch (err) {
    console.error("[Auth] Token 校验失败:", err.message);
    return res.status(401).json({
      success: false,
      message: "登录已失效，请重新登录",
    });
  }
};
