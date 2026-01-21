import express from "express";
import { Op } from "sequelize";
import multer from "multer";
import path from "path";
import MedicalRecord from "../models/MedicalRecord.js";
import { deleteFile, saveUploadedFile } from "../services/fileService.js";
import { extractTextFromFile } from "../services/ocrService.js";
import config from "../config/environment.js";

const router = express.Router();

// 配置 multer 用于文件上传
const upload = multer({
  storage: multer.memoryStorage(), // 保存到内存，然后由 fileService 处理
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

/**
 * 修复文件名编码问题
 * 处理因 HTTP 传输导致的 UTF-8 文件名编码错误
 */
const fixFileName = (fileName) => {
  if (!fileName) return fileName;
  try {
    // 尝试修复 UTF-8 编码的文件名
    // 某些客户端可能将 UTF-8 编码的字节序列当作 Latin1 发送
    const buffer = Buffer.from(fileName, "latin1");
    const fixed = buffer.toString("utf8");
    return fixed;
  } catch (error) {
    return fileName;
  }
};

/**
 * POST /api/medical-records/upload
 * 批量上传医疗记录文件并进行 OCR 识别
 */
router.post("/upload", upload.array("file"), async (req, res) => {
  try {
    const { userId, patientId, recordType, remarks, checkTime } = req.body;
    const files = req.files;

    if (!userId || !patientId || !files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "缺少必要字段: userId, patientId, file",
      });
    }
    if (!recordType) {
      return res.status(400).json({
        success: false,
        message: "缺少字段: recordType",
      });
    }
    if (req.user?.userId && req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "无权访问该用户数据",
      });
    }

    // 统一检查时间
    const normalizeCheckDate = (val) => {
      if (!val) return new Date();
      return new Date(`${val}T00:00:00`);
    };
    const normalizedCheckTime = normalizeCheckDate(checkTime);

    const results = [];
    for (const file of files) {
      file.originalname = fixFileName(file.originalname);
      // 验证文件类型
      const ext = path.extname(file.originalname).toLowerCase();
      let fileType;
      if ([".jpg", ".jpeg", ".png"].includes(ext)) {
        fileType = "image";
      } else if (ext === ".pdf") {
        fileType = "pdf";
      } else {
        results.push({
          success: false,
          fileName: file.originalname,
          message: "不支持的文件类型，仅支持 JPG、PNG、PDF",
        });
        continue;
      }
      console.log(`[MedicalRecord] 收到文件上传请求: ${file.originalname}`);
      // 上传文件到文件服务器
      const {
        fileUrl,
        filePath,
        fileName: savedFileName,
        originalFileName,
      } = await saveUploadedFile(
        file.buffer,
        userId,
        patientId,
        file.originalname,
      );
      // OCR
      let extractedText = "";
      try {
        extractedText = await extractTextFromFile(
          file.buffer,
          fileType,
          file.originalname,
        );
      } catch (ocrError) {
        extractedText = `[OCR 识别失败] ${ocrError.message}`;
      }
      // 创建记录
      const medicalRecord = await MedicalRecord.create({
        patientId,
        recordType,
        checkTime: normalizedCheckTime,
        fileName: savedFileName,
        originalFileName: originalFileName,
        filePath: fileUrl,
        extractedText,
        fileType,
        remarks: remarks || "",
      });
      results.push({
        success: true,
        recordId: medicalRecord._id,
        fileName: medicalRecord.fileName,
        originalFileName: medicalRecord.originalFileName,
        filePath: medicalRecord.filePath,
        extractedText: medicalRecord.extractedText,
        uploadedAt: medicalRecord.uploadedAt,
      });
    }
    res.json({
      success: true,
      message: "文件上传处理完成",
      data: results,
    });
  } catch (error) {
    console.error("[MedicalRecord] 批量上传失败:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "文件上传失败",
    });
  }
});

/**
 * GET /api/medical-records/preview/:recordId
 * 获取医疗记录文件预览（从文件服务器代理转发）
 */
router.get("/preview/:recordId", async (req, res) => {
  try {
    const { recordId } = req.params;

    const record = await MedicalRecord.findByPk(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "医疗记录不存在",
      });
    }

    if (!record.filePath) {
      return res.status(404).json({
        success: false,
        message: "文件路径不存在",
      });
    }

    console.log(`[MedicalRecord] 请求文件预览 - 记录ID: ${recordId}`);
    console.log(`[MedicalRecord] 文件URL: ${record.filePath}`);

    // 从文件服务器下载文件
    const { readFile } = await import("../services/fileService.js");
    const fileBuffer = await readFile(record.filePath);

    // 设置正确的 Content-Type
    const ext = record.fileName.toLowerCase().split(".").pop();
    let contentType = "application/octet-stream";
    if (["jpg", "jpeg"].includes(ext)) {
      contentType = "image/jpeg";
    } else if (ext === "png") {
      contentType = "image/png";
    } else if (ext === "pdf") {
      contentType = "application/pdf";
    }

    console.log(
      `[MedicalRecord] 转发文件给前端 - 大小: ${fileBuffer.length} bytes`,
    );

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(record.fileName)}"`,
    );
    res.send(fileBuffer);
  } catch (error) {
    console.error("[MedicalRecord] 获取文件预览失败:", error.message);
    res.status(500).json({
      success: false,
      message: "获取文件预览失败",
    });
  }
});

/**
 * GET /api/medical-records/file/:recordId
 * 获取医疗记录文件（已弃用，保留向下兼容）
 */
router.get("/file/:recordId", async (req, res) => {
  try {
    const { recordId } = req.params;

    const record = await MedicalRecord.findByPk(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "医疗记录不存在",
      });
    }

    if (!record.filePath) {
      return res.status(404).json({
        success: false,
        message: "文件路径不存在",
      });
    }

    // 从文件服务器下载文件
    const { readFile } = await import("../services/fileService.js");
    const fileBuffer = await readFile(record.filePath);

    // 设置正确的 Content-Type
    const ext = record.fileName.toLowerCase().split(".").pop();
    let contentType = "application/octet-stream";
    if (["jpg", "jpeg"].includes(ext)) {
      contentType = "image/jpeg";
    } else if (ext === "png") {
      contentType = "image/png";
    } else if (ext === "pdf") {
      contentType = "application/pdf";
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(record.fileName)}"`,
    );
    res.send(fileBuffer);
  } catch (error) {
    console.error("[MedicalRecord] 获取文件失败:", error.message);
    res.status(500).json({
      success: false,
      message: "获取文件失败",
    });
  }
});

/**
 * GET /api/medical-records/detail/:recordId
 * 获取医疗记录详情（必须在 /:patientId 之前定义）
 */
router.get("/detail/:recordId", async (req, res) => {
  try {
    const { recordId } = req.params;

    const record = await MedicalRecord.findByPk(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "医疗记录不存在",
      });
    }

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error("[MedicalRecord] 获取详情失败:", error.message);
    res.status(500).json({
      success: false,
      message: "获取医疗记录详情失败",
    });
  }
});

/**
 * PATCH /api/medical-records/:recordId
 * 更新医疗记录（recordType, checkTime, extractedText）
 */
router.patch("/:recordId", async (req, res) => {
  try {
    const { recordId } = req.params;
    const { extractedText, recordType, checkTime } = req.body;

    const normalizeCheckDate = (val) => {
      if (!val) return null;
      return new Date(`${val}T00:00:00`);
    };

    const record = await MedicalRecord.findByPk(recordId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "医疗记录不存在",
      });
    }

    if (recordType) record.recordType = recordType;
    if (checkTime) {
      const normalized = normalizeCheckDate(checkTime);
      record.checkTime = normalized;
    }
    record.extractedText = extractedText ?? record.extractedText;
    await record.save();

    res.json({
      success: true,
      message: "更新成功",
      data: record,
    });
  } catch (error) {
    console.error("[MedicalRecord] 更新失败:", error.message);
    res.status(500).json({
      success: false,
      message: "更新医疗记录失败",
    });
  }
});

/**
 * GET /api/medical-records/:patientId
 * 获取指定就诊人的医疗记录列表
 */
router.get("/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      MedicalRecord.findAll({
        where: { patientId },
        order: [["checkTime", "DESC"]],
        offset: skip,
        limit: parseInt(limit),
      }),
      MedicalRecord.count({ where: { patientId } }),
    ]);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[MedicalRecord] 查询记录失败:", error.message);
    res.status(500).json({
      success: false,
      message: "查询医疗记录失败",
    });
  }
});

/**
 * DELETE /api/medical-records/:recordId
 * 删除医疗记录
 */
router.delete("/:recordId", async (req, res) => {
  try {
    const { recordId } = req.params;

    const record = await MedicalRecord.findByPk(recordId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "医疗记录不存在",
      });
    }

    // 先删文件服务器，再删数据库记录
    try {
      await deleteFile(record.filePath);
      console.log(`[MedicalRecord] 文件已删除: ${record.filePath}`);
    } catch (fileError) {
      console.error("[MedicalRecord] 文件删除失败:", fileError.message);
      return res.status(500).json({
        success: false,
        message: `文件删除失败: ${fileError.message}`,
      });
    }

    await record.destroy();

    res.json({
      success: true,
      message: "医疗记录删除成功",
    });
  } catch (error) {
    console.error("[MedicalRecord] 删除失败:", error.message);
    res.status(500).json({
      success: false,
      message: "删除医疗记录失败",
    });
  }
});

/**
 * POST /api/medical-records/batch-delete
 * 批量删除医疗记录
 */
router.post("/batch-delete", async (req, res) => {
  try {
    const { recordIds } = req.body;

    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "recordIds 必须是非空数组",
      });
    }

    const records = await MedicalRecord.findAll({
      where: { _id: { [Op.in]: recordIds } },
    });

    const successIds = [];
    const failed = [];

    // 先删除文件，成功的才删除数据库记录
    for (const record of records) {
      try {
        await deleteFile(record.filePath);
        successIds.push(record._id);
        console.log(`[MedicalRecord] 文件已删除: ${record.filePath}`);
      } catch (fileError) {
        failed.push({ id: record._id, reason: fileError.message });
        console.error(
          `[MedicalRecord] 文件删除失败 (recordId=${record._id}):`,
          fileError.message,
        );
      }
    }

    let deletedCount = 0;
    if (successIds.length) {
      deletedCount = await MedicalRecord.destroy({
        where: { _id: { [Op.in]: successIds } },
      });
    }

    res.json({
      success: true,
      message: `已删除 ${deletedCount} 条医疗记录`,
      failed,
    });
  } catch (error) {
    console.error("[MedicalRecord] 批量删除失败:", error.message);
    res.status(500).json({
      success: false,
      message: "批量删除医疗记录失败",
    });
  }
});

export default router;
