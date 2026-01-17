import axios from "axios";
import config from "../config/environment.js";

/**
 * DeepSeek AI 服务
 * 用于智能文本分析和对话
 */

const deepseekClient = axios.create({
  baseURL: config.deepseekApiUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.deepseekApiKey}`,
  },
});

/**
 * 调用 DeepSeek API 进行文本分析
 * @param {string} userMessage - 用户消息
 * @param {string} context - 上下文信息（病例数据等）
 * @returns {Promise<string>} - AI 回复内容
 */
export const analyzeWithDeepSeek = async (userMessage, context = "") => {
  try {
    if (!config.deepseekApiKey) {
      throw new Error("DeepSeek API Key 未配置");
    }

    const systemPrompt = `你是一个医疗记录分析助手。
    根据用户提供的病例数据和问题，进行专业的分析。
    分析结果应该清晰、结构化、易于理解。`;

    const fullMessage = context
      ? `${context}\n\n用户问题: ${userMessage}`
      : userMessage;

    // 构建请求体（根据 DeepSeek API 文档调整）
    const response = await deepseekClient.post("/chat/completions", {
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: fullMessage,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const aiReply = response.data.choices[0].message.content;
    return aiReply;
  } catch (error) {
    console.error("[DeepSeek] API 调用失败:", error.message);

    if (error.response?.status === 401) {
      throw new Error("DeepSeek API 认证失败，请检查 API Key");
    }

    throw new Error(`AI 分析失败: ${error.message}`);
  }
};

/**
 * 分析异常项
 * @param {Array} medicalRecords - 病例数据数组
 * @returns {Promise<string>} - 分析结果
 */
export const analyzeAbnormalItems = async (medicalRecords) => {
  const context = formatRecordsForAnalysis(medicalRecords);
  const message = "请列出这些病例中所有的异常项，并按重要程度排序。";

  return analyzeWithDeepSeek(message, context);
};

/**
 * 分析趋势
 * @param {Array} medicalRecords - 病例数据数组
 * @param {string} indicatorName - 指标名称
 * @returns {Promise<string>} - 分析结果
 */
export const analyzeTrend = async (medicalRecords, indicatorName) => {
  const context = formatRecordsForAnalysis(medicalRecords);
  const message = `请分析${indicatorName}的变化趋势，包括数值变化、变化速度、可能的原因等。`;

  return analyzeWithDeepSeek(message, context);
};

/**
 * 将医疗记录格式化为文本用于分析
 * @param {Array} medicalRecords - 病例数据
 * @returns {string} - 格式化后的文本
 */
const formatRecordsForAnalysis = (medicalRecords) => {
  return medicalRecords
    .map((record, index) => {
      return `
记录 ${index + 1}:
检查时间: ${record.checkTime}
类型: ${record.recordType}
内容: ${record.extractedText}
`;
    })
    .join("\n---\n");
};

export default {
  analyzeWithDeepSeek,
  analyzeAbnormalItems,
  analyzeTrend,
};
