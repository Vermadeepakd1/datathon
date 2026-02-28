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

export const listUsers = async (limit = 20) => {
  const response = await api.get(`/users?limit=${limit}`);
  return response.data.data;
};

export const updateDonorStatus = async (userId, payload) => {
  const response = await api.patch(`/users/${userId}/donor-status`, payload);
  return response.data.data;
};

export default api;
