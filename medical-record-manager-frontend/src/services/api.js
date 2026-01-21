import axios from "axios";
import { ElMessage } from "element-plus";
import router from "../router";

const API_BASE_URL = "/medical-record-manager-server";

const TOKEN_KEY = "token";
const TOKEN_EXPIRES_KEY = "tokenExpiresAt";
const USER_ID_KEY = "userId";
const USERNAME_KEY = "username";

const clearAuthCache = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRES_KEY);
  sessionStorage.removeItem(USER_ID_KEY);
  sessionStorage.removeItem(USERNAME_KEY);
};

// 创建 axios 实例
const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

instance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthCache();
      const message = error.response?.data?.message || "未登录或登录已过期";
      ElMessage.error(message);
      if (router.currentRoute.value.path !== "/login") {
        router.push({ path: "/login" });
      }
    }
    return Promise.reject(error);
  },
);

/**
 * 用户认证相关 API
 */
export const authAPI = {
  login: (username, password) =>
    instance.post("/api/auth/login", { username, password }),

  register: (username, password) =>
    instance.post("/api/auth/register", { username, password }),

  logout: () => instance.post("/api/auth/logout"),
};

/**
 * 就诊人相关 API
 */
export const patientAPI = {
  getPatients: (userId) => instance.get(`/api/patients/${userId}`),

  getPatientDetail: (patientId) =>
    instance.get(`/api/patients/${patientId}/detail`),

  addPatient: (data) => instance.post("/api/patients", data),

  updatePatient: (patientId, data) =>
    instance.patch(`/api/patients/${patientId}`, data),

  deletePatient: (patientId) => instance.delete(`/api/patients/${patientId}`),
};

/**
 * 病例相关 API
 */
export const medicalRecordAPI = {
  getRecords: (patientId, params = {}) =>
    instance.get(`/api/medical-records/${patientId}`, { params }),

  uploadRecord: (formData) =>
    instance.post("/api/medical-records/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getFilePreview: (recordId) =>
    instance.get(`/api/medical-records/preview/${recordId}`, {
      responseType: "arraybuffer",
    }),

  updateRecord: (recordId, data) =>
    instance.patch(`/api/medical-records/${recordId}`, data),

  deleteRecord: (recordId) =>
    instance.delete(`/api/medical-records/${recordId}`),
};

/**
 * 聊天相关 API（待实现）
 */
export const chatAPI = {
  sendMessage: (data) => instance.post("/api/chat/message", data),

  getHistory: (userId, patientId) =>
    instance.get(`/api/chat/history/${userId}`, { params: { patientId } }),
};

export default instance;
