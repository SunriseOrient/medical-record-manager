import { CozeAPI } from "@coze/api";
import axios from "axios";
import FormData from "form-data";
import config from "../config/environment.js";

const client = new CozeAPI({
  token: config.cozeApiKey,
  baseURL: config.cozeApiUrl,
});

/**
 * OCR 服务
 *
 * 用于提取图片和 PDF 中的文本内容
 * 使用 Coze 平台进行文本识别
 *
 * 流程：
 * 1. 上传文件到 Coze 平台，获取 file_id
 * 2. 调用工作流 workflow，传入 file_id
 * 3. 返回识别结果
 */

const COZE_USER_ID = "medical_record_user";

/**
 * 识别文件中的文本内容
 * @param {Buffer} fileBuffer - 文件的 Buffer 数据
 * @param {string} fileType - 文件类型 ('image' 或 'pdf')
 * @param {string} fileName - 文件名
 * @returns {Promise<string>} - 提取的文本内容
 */
export const extractTextFromFile = async (
  fileBuffer,
  fileType,
  fileName = "document"
) => {
  try {
    if (!fileBuffer) {
      throw new Error("文件 Buffer 不能为空");
    }

    if (!["image", "pdf"].includes(fileType)) {
      throw new Error("不支持的文件类型");
    }

    console.log(`[OCR] 正在识别 ${fileType} 文件: ${fileName}...`);

    // 步骤 1: 上传文件到 Coze 平台
    console.log("[OCR] 步骤 1: 上传文件到 Coze 平台...");
    const fileId = await uploadFileToCoze(fileBuffer, fileName, fileType);
    console.log(`[OCR] 文件上传成功，file_id: ${fileId}`);

    // 步骤 2: 调用工作流进行 OCR 识别
    console.log("[OCR] 步骤 2: 调用工作流进行文本识别...");
    const extractedText = await callCozeWorkflow(fileId, fileName);
    console.log(`[OCR] 文本识别成功，提取字符数: ${extractedText.length}`);

    return extractedText;
  } catch (error) {
    console.error("[OCR] 文本识别失败:", error.message);
    throw new Error(`OCR 识别失败: ${error.message}`);
  }
};

/**
 * 上传文件到 Coze 平台
 * @param {Buffer} fileBuffer - 文件 Buffer
 * @param {string} fileName - 文件名
 * @param {string} fileType - 文件类型
 * @returns {Promise<string>} - 文件 ID
 */
const uploadFileToCoze = async (fileBuffer, fileName, fileType) => {
  try {
    const formData = new FormData();
    formData.append("file", fileBuffer, {
      filename: fileName,
      contentType: fileType === "pdf" ? "application/pdf" : "image/jpeg",
    });

    const response = await axios.post(
      `${config.cozeApiUrl}/v1/files/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${config.cozeApiKey}`,
        },
      }
    );

    if (response.data.code !== 0) {
      throw new Error(`Coze API 错误: ${response.data.msg || "未知错误"}`);
    }

    return response.data.data.id;
  } catch (error) {
    console.error("[OCR] 文件上传失败:", error.message);
    throw new Error(`文件上传失败: ${error.message}`);
  }
};

/**
 * 调用 Coze 工作流进行 OCR 识别
 * @param {string} fileId - Coze 文件 ID
 * @param {string} fileName - 文件名
 * @returns {Promise<string>} - 识别的文本内容
 */
const callCozeWorkflow = async (fileId, fileName) => {
  try {

    // 构建请求参数
    const payload = {
      workflow_id: config.cozeWorkflowId,
      parameters: {
        file: {
          file_id: fileId,
        },
      },
    };

    // 发起对话
    console.log("[OCR] 发起 Coze 工作流对话...");
    const chatResponse = await axios.post(
      `${config.cozeApiUrl}/v1/workflow/run`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${config.cozeApiKey}`,
          "Content-Type": "application/json",
        }
      }
    );

    if (chatResponse.data.code !== 0) {
      throw new Error(
        `Coze 工作流错误: ${chatResponse.data.msg || "未知错误"}`
      );
    }

    const aiMessages = chatResponse.data.data;

    if (aiMessages.length === 0) {
      throw new Error("未能获取 AI 的识别结果");
    }

    console.log("[OCR] 文本提取成功");
    return aiMessages;
  } catch (error) {
    console.error("[OCR] 工作流调用失败:", error.message);
    throw new Error(`工作流调用失败: ${error.message}`);
  }
};

export default {
  extractTextFromFile,
};
