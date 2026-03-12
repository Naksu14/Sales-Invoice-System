import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_URL,
});

import { setupInterceptors } from './sessionManager'
setupInterceptors(api)

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getInvoiceNames = async () => {
  try {
    const response = await api.get("/invoice-names", {
        headers: getAuthHeaders(),
    });
    return response.data;
  }
    catch (error) {
    console.error('Failed to fetch invoice names:', error);
    return [];
  }
};

export const createInvoiceName = async (payloadInvoiceName) => {
  try {
    const response = await api.post("/invoice-names", payloadInvoiceName, {
        headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const updateInvoiceName = async (id, payloadInvoiceName) => {
  try {
    const payload = typeof payloadInvoiceName === 'string'
      ? { name: payloadInvoiceName }
      : { name: payloadInvoiceName.name, description: payloadInvoiceName.description }

    const response = await api.patch(`/invoice-names/${id}`, payload, {
        headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const deleteInvoiceName = async (id) => {
    try {
        const response = await api.delete(`/invoice-names/${id}`, {
            headers: getAuthHeaders(),
        });
        return response.data;
    }
    catch (error) {
        throw error.response ? error.response.data : error;
    }
};