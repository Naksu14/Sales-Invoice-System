import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3004";

const api = axios.create({
  baseURL: API_URL,
});

import { setupInterceptors } from './sessionManager'
setupInterceptors(api)


const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};


export const updateUserProfile = async (userId, updatedData) => {
  try {
    const response = await api.patch(`/si-users/${userId}`, updatedData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  } 
};

export const getUsers = async () => {
  try {
    const response = await api.get('/si-users', {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const createUser = async (payload) => {
  try {
    const response = await api.post('/si-users', payload, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const updateUser = async (userId, payload) => {
  try {
    const response = await api.patch(`/si-users/${userId}`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/si-users/${userId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    const response = await api.get(`/si-users/${userId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
    } catch (error) {
    throw error.response ? error.response.data : error;
  }
};