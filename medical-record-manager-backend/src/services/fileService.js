import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import FormData from "form-data";
import config from "../config/environment.js";

// 提取文件服务器所需的相对路径
const getRelativePath = (filePath) => {
  if (!filePath) return "";
  try {
    if (filePath.startsWith("http")) {
      const url = new URL(filePath);
      return decodeURIComponent(
        url.pathname.replace("/file_store/", "").replace(/^\/+/, ""),
      );
    }
    return filePath.replace(/^\/+/, "");
  } catch (error) {
    console.error("[FileService] 解析文件路径失败:", error.message);
    return filePath;
  }
};

/**
 * 文件管理服务
 * 支持本地存储和远程文件服务器上传
 */

/**
 * 上传文件到文件服务器
 * @param {Buffer} fileBuffer - 文件 Buffer
 * @param {string} fileName - 文件名
 * @param {string} saveDir - 保存路径（userId/patientId 格式）
 * @returns {Promise<Object>} - { fileUrl, filePath }
 */
export const uploadToFileServer = async (fileBuffer, fileName, saveDir) => {
  try {
    const form = new FormData();
    form.append("file", fileBuffer, fileName);

    console.log(
      `[FileService] 上传文件到服务器: ${config.fileServiceBaseUrl}/upload`,
    );
    if (saveDir) {
      console.log(`[FileService] 保存路径: ${saveDir}`);
    }

    const headers = form.getHeaders();
    if (config.uploadApiToken) {
      headers[config.uploadApiTokenHeader] = config.uploadApiToken;
    }

    const response = await axios.post(
      `${config.fileServiceBaseUrl}/upload`,
      form,
      {
        headers,
        timeout: 30000,
        params: {
          dir: saveDir || "",
          on_exists: "overwrite",
        },
      },
    );

    console.log(`[FileService] 文件上传成功:`, response.data.files[0]);

    return {
      fileUrl: response.data.files[0].url,
      filePath: response.data.files[0].path,
    };
  } catch (error) {
    console.error("[FileService] 上传到文件服务器失败:", error.message);
    throw new Error(`上传到文件服务器失败: ${error.message}`);
  }
};

/**
 * 从文件服务器下载文件
 * @param {string} fileUrl - 文件 URL（相对路径或完整 URL）
 * @returns {Promise<Buffer>} - 文件 Buffer
 */
export const downloadFromFileServer = async (fileUrl) => {
  try {
    // 如果是相对路径，构造完整 URL
    let fullUrl = fileUrl;
    if (!fileUrl.startsWith("http")) {
      const baseUrl = config.fileServiceBaseUrl;
      fullUrl = `${baseUrl}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
    }

    console.log(`[FileService] 从文件服务器下载: ${fullUrl}`);

    const headers = {};
    if (config.uploadApiToken) {
      headers[config.uploadApiTokenHeader] = config.uploadApiToken;
    }

    const response = await axios.get(fullUrl, {
      headers,
      responseType: "arraybuffer",
      timeout: 30000,
    });

    console.log(`[FileService] 文件下载成功: ${fullUrl}`);

    return response.data;
  } catch (error) {
    console.error("[FileService] 从文件服务器下载失败:", error.message);
    throw new Error(`从文件服务器下载失败: ${error.message}`);
  }
};

/**
 * 删除文件服务器上的文件
 * @param {string} fileUrl - 文件 URL
 * @returns {Promise<void>}
 */
export const deleteFromFileServer = async (filePath) => {
  if (!filePath) {
    throw new Error("缺少文件路径，无法删除文件");
  }

  const relativePath = getRelativePath(filePath);

  try {
    console.log(
      `[FileService] 删除文件服务器上的文件: ${config.fileServiceBaseUrl}/delete?path=${relativePath}`,
    );

    const headers = {};
    if (config.uploadApiToken) {
      headers[config.uploadApiTokenHeader] = config.uploadApiToken;
    }

    const response = await axios.delete(`${config.fileServiceBaseUrl}/delete`, {
      headers,
      timeout: 30000,
      params: { path: relativePath },
    });

    // 服务端约定返回 deleted 计数
    if (response.data?.deleted === 0) {
      throw new Error("文件服务器未删除任何文件");
    }

    console.log(`[FileService] 文件删除成功: ${relativePath}`);
  } catch (error) {
    console.error("[FileService] 从文件服务器删除文件失败:", error.message);
    throw new Error(`从文件服务器删除失败: ${error.message}`);
  }
};

/**
 * 保存上传的文件到文件服务器
 * @param {Buffer} fileBuffer - 文件 Buffer
 * @param {string} userId - 用户 ID
 * @param {string} patientId - 就诊人 ID
 * @param {string} originalFileName - 原始文件名
 * @returns {Promise<Object>} - { fileUrl, filePath, originalFileName }
 */
export const saveUploadedFile = async (
  fileBuffer,
  userId,
  patientId,
  originalFileName,
) => {
  try {
    // 确保原始文件名是正确的 UTF-8 编码
    let cleanedFileName = originalFileName;
    if (typeof originalFileName === "string") {
      cleanedFileName = Buffer.from(originalFileName, "utf8").toString("utf8");
    }

    // 生成唯一的文件名（保留原始后缀名）
    const ext = path.extname(cleanedFileName);
    const fileName = `${
      new Date().toISOString().split("T")[0]
    }_${uuidv4()}${ext}`;

    // 构建保存路径（userId/patientId 格式）
    const saveDir = `${config.uploadDir}/${userId}/${patientId}`;

    // 上传到文件服务器
    const result = await uploadToFileServer(fileBuffer, fileName, saveDir);

    return {
      fileUrl: result.fileUrl,
      filePath: result.filePath,
      fileName,
      originalFileName: cleanedFileName,
    };
  } catch (error) {
    console.error("[FileService] 文件保存失败:", error.message);
    throw new Error(`文件保存失败: ${error.message}`);
  }
};

/**
 * 删除文件
 * @param {string} filePath - 文件路径 URL
 * @returns {Promise<void>}
 */
export const deleteFile = async (filePath) => {
  try {
    await deleteFromFileServer(filePath);
    console.log(`[FileService] 文件已删除: ${filePath}`);
  } catch (error) {
    console.error("[FileService] 文件删除失败:", error.message);
    throw new Error(`文件删除失败: ${error.message}`);
  }
};

/**
 * 读取文件内容（从文件服务器下载）
 * @param {string} filePath - 文件路径 URL
 * @returns {Promise<Buffer>} - 文件 Buffer
 */
export const readFile = async (filePath) => {
  try {
    const fileBuffer = await downloadFromFileServer(filePath);
    return fileBuffer;
  } catch (error) {
    console.error("[FileService] 文件读取失败:", error.message);
    throw new Error(`文件读取失败: ${error.message}`);
  }
};

/**
 * 检查文件大小
 * @param {number} fileSize - 文件大小（字节）
 * @returns {boolean}
 */
export const validateFileSize = (fileSize) => {
  return fileSize <= config.maxFileSize;
};

/**
 * 验证文件类型
 * @param {string} mimeType - MIME 类型
 * @returns {Object} - { isValid: boolean, fileType: 'image' | 'pdf' }
 */
export const validateFileType = (mimeType) => {
  const imageTypes = ["image/jpeg", "image/png", "image/jpg"];
  const pdfTypes = ["application/pdf"];

  if (imageTypes.includes(mimeType)) {
    return { isValid: true, fileType: "image" };
  }

  if (pdfTypes.includes(mimeType)) {
    return { isValid: true, fileType: "pdf" };
  }

  return { isValid: false, fileType: null };
};

export default {
  uploadToFileServer,
  downloadFromFileServer,
  deleteFromFileServer,
  saveUploadedFile,
  deleteFile,
  readFile,
  validateFileSize,
  validateFileType,
};
