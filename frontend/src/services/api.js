import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  timeout: 6000,
});

export const evaluateDiagnosticInput = async (payload) => {
  const response = await api.post("/diagnostics/evaluate", payload);
  return response.data.data;
};

export const triggerHemorrhageAlert = async (payload) => {
  const response = await api.post("/alerts/hemorrhage", payload);
  return response.data.data;
};

export const listUsers = async (options = {}) => {
  const { limit = 20, page = 1, search = "" } = options;
  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  const response = await api.get(`/users?${params.toString()}`);
  return response.data.data;
};

export const updateDonorStatus = async (userId, payload) => {
  const response = await api.patch(`/users/${userId}/donor-status`, payload);
  return response.data.data;
};

export const createMedicalLog = async (payload) => {
  const response = await api.post("/medical-logs", payload);
  return response.data.data;
};

export const getUserMedicalHistory = async (userId, limit = 20) => {
  const response = await api.get(`/medical-logs/user/${userId}/history?limit=${limit}`);
  return response.data.data;
};

export default api;
