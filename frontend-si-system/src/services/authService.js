import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_URL,
});

export const login = async (email, password) => {
  try {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const sendOtp = async (email) => {
  try {
    const response = await api.post("/auth/send-otp", { email });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const verifyOtp = async (email, otp) => {
  try {
    const response = await api.post("/auth/verify-otp", { email, otp: Number(otp) });
    return response.data;
    } catch (error) {   
    throw error.response ? error.response.data : error;
  }
};

export const resetPassword = async (email, newPassword) => {
  try {
    const response = await api.patch("/auth/reset-password", { email, newPassword });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

