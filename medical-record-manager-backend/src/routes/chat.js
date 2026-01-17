import express from "express";
import ChatHistory from "../models/ChatHistory.js";
import MedicalRecord from "../models/MedicalRecord.js";
import { analyzeWithDeepSeek } from "../services/deepseekService.js";

const router = express.Router();

/**
 * POST /api/chat/message
 * 发送消息并获取 AI 回复
 */
router.post("/message", async (req, res) => {
  try {
    const { userId, patientId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        message: "用户ID和消息内容不能为空",
      });
    }

    if (req.user?.userId && req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "无权访问该用户数据",
      });
    }

    // 获取该就诊人的病例记录作为上下文
    let context = "";
    if (patientId) {
      const records = await MedicalRecord.findAll({
        where: { patientId },
        order: [["checkTime", "DESC"]],
        limit: 10,
      });

      if (records.length > 0) {
        context = "相关病例记录:\n";
        records.forEach((record, index) => {
          context += `\n${index + 1}. [${record.recordType}] ${
            record.checkTime
          }\n`;
          if (record.extractedText) {
            context += `内容: ${record.extractedText.substring(0, 500)}...\n`;
          }
        });
      }
    }

    // 调用 DeepSeek AI 进行分析
    const aiReply = await analyzeWithDeepSeek(message, context);

    // 保存聊天记录
    const chatHistory = await ChatHistory.create({
      userId,
      patientId: patientId || null,
      userMessage: message,
      aiReply,
      messageType: "text",
    });

    res.json({
      success: true,
      data: {
        userMessage: message,
        aiReply,
        timestamp: chatHistory.timestamp,
      },
    });
  } catch (error) {
    console.error("[Chat] 发送消息失败:", error);
    res.status(500).json({
      success: false,
      message: error.message || "AI 回复失败",
    });
  }
});

/**
 * GET /api/chat/history/:userId
 * 获取聊天历史记录
 */
router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { patientId, page = 1, limit = 50 } = req.query;

    if (req.user?.userId && req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "无权访问该用户数据",
      });
    }

    const query = { userId };
    if (patientId) {
      query.patientId = patientId;
    }

    const skip = (page - 1) * limit;

    const [chatHistory, total] = await Promise.all([
      ChatHistory.findAll({
        where: query,
        order: [["timestamp", "DESC"]],
        offset: skip,
        limit: parseInt(limit),
      }),
      ChatHistory.count({ where: query }),
    ]);

    res.json({
      success: true,
      data: {
        chatHistory: chatHistory.reverse(), // 反转为升序
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[Chat] 获取历史记录失败:", error);
    res.status(500).json({
      success: false,
      message: "获取聊天历史失败",
    });
  }
});

/**
 * DELETE /api/chat/history/:userId
 * 清空聊天历史记录
 */
router.delete("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { patientId } = req.query;

    if (req.user?.userId && req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "无权访问该用户数据",
      });
    }

    const query = { userId };
    if (patientId) {
      query.patientId = patientId;
    }

    const result = await ChatHistory.destroy({ where: query });

    res.json({
      success: true,
      message: `已删除 ${result} 条聊天记录`,
    });
  } catch (error) {
    console.error("[Chat] 清空历史记录失败:", error);
    res.status(500).json({
      success: false,
      message: "清空聊天历史失败",
    });
  }
});

export default router;
