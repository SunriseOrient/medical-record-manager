import express from "express";
import { Patient } from "../models/Patient.js";

const router = express.Router();

/**
 * 获取用户的所有就诊人
 * GET /api/patients/:userId
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user?.userId && req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "无权访问该用户数据",
      });
    }

    const patients = await Patient.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: patients,
    });
  } catch (error) {
    console.error("获取就诊人失败:", error);
    res.status(500).json({
      success: false,
      message: "获取就诊人失败",
      error: error.message,
    });
  }
});

/**
 * 获取单个就诊人详情
 * GET /api/patients/:patientId/detail
 */
router.get("/:patientId/detail", async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "就诊人不存在",
      });
    }

    if (req.user?.userId && patient.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "无权访问该用户数据",
      });
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("获取就诊人详情失败:", error);
    res.status(500).json({
      success: false,
      message: "获取就诊人详情失败",
      error: error.message,
    });
  }
});

/**
 * 添加就诊人
 * POST /api/patients
 * 入参: { userId, patientName, birthDate, gender }
 */
router.post("/", async (req, res) => {
  try {
    const { userId, patientName, birthDate, gender } = req.body;

    if (!userId || !patientName) {
      return res.status(400).json({
        success: false,
        message: "缺少必要参数: userId 和 patientName",
      });
    }

    if (req.user?.userId && req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "无权访问该用户数据",
      });
    }

    if (!birthDate || !gender) {
      return res.status(400).json({
        success: false,
        message: "出生日期和性别为必填项",
      });
    }

    const patient = await Patient.create({
      userId,
      patientName,
      birthDate,
      gender,
    });

    res.status(201).json({
      success: true,
      message: "就诊人添加成功",
      data: patient,
    });
  } catch (error) {
    console.error("添加就诊人失败:", error);
    res.status(500).json({
      success: false,
      message: "添加就诊人失败",
      error: error.message,
    });
  }
});

/**
 * 更新就诊人信息（PATCH - 部分更新）
 * PATCH /api/patients/:patientId
 */
router.patch("/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    const { patientName, birthDate, gender } = req.body;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "就诊人不存在",
      });
    }

    if (req.user?.userId && patient.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "无权访问该用户数据",
      });
    }

    const updateData = {};
    if (patientName !== undefined) updateData.patientName = patientName;
    if (birthDate !== undefined) updateData.birthDate = birthDate;
    if (gender !== undefined) updateData.gender = gender;

    await patient.update(updateData);

    res.json({
      success: true,
      message: "就诊人信息更新成功",
      data: patient,
    });
  } catch (error) {
    console.error("更新就诊人失败:", error);
    res.status(500).json({
      success: false,
      message: "更新就诊人失败",
      error: error.message,
    });
  }
});

/**
 * 更新就诊人信息（PUT - 全量更新）
 * PUT /api/patients/:patientId
 */
router.put("/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    const { patientName, birthDate, gender } = req.body;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "就诊人不存在",
      });
    }

    if (req.user?.userId && patient.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "无权访问该用户数据",
      });
    }

    if (!patientName || !birthDate || !gender) {
      return res.status(400).json({
        success: false,
        message: "姓名、出生日期和性别为必填项",
      });
    }

    await patient.update({ patientName, birthDate, gender });

    res.json({
      success: true,
      message: "就诊人信息更新成功",
      data: patient,
    });
  } catch (error) {
    console.error("更新就诊人失败:", error);
    res.status(500).json({
      success: false,
      message: "更新就诊人失败",
      error: error.message,
    });
  }
});

/**
 * 删除就诊人
 * DELETE /api/patients/:patientId
 */
router.delete("/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "就诊人不存在",
      });
    }

    if (req.user?.userId && patient.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "无权访问该用户数据",
      });
    }

    await patient.destroy();

    res.json({
      success: true,
      message: "就诊人删除成功",
    });
  } catch (error) {
    console.error("删除就诊人失败:", error);
    res.status(500).json({
      success: false,
      message: "删除就诊人失败",
      error: error.message,
    });
  }
});

export default router;
