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


export const getColumns = async (sheetId) => {
  try {
    const response = await api.get(`/sheet-column/columns/${sheetId}`, {
        headers: getAuthHeaders(),
    });
    return response.data;
  }
    catch (error) {
    console.error('Failed to fetch columns:', error);
    return [];
    }
};

export const updateColumn = async (columnId, columnData) => {
  try {
    const response = await api.patch(`/sheet-column/${columnId}`, columnData, {
        headers: getAuthHeaders(),
    });
    return response.data;
  }
    catch (error) {
    console.error('Failed to update column:', error);
    throw error.response ? error.response.data : error;
    }
};

export const createColumn = async (columnData) => {
    try {
        const response = await api.post('/sheet-column', columnData, {
            headers: getAuthHeaders(),
        });
        return response.data;
    }
    catch (error) {        console.error('Failed to create column:', error);
        throw error.response ? error.response.data : error;
    }
};

export const deleteColumn = async (columnId) => {
  try {
    const response = await api.delete(`/sheet-column/${columnId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  }
  catch (error) {
    console.error('Failed to delete column:', error);
    throw error.response ? error.response.data : error;
  }
};
