// File: frontend/utils/api.ts
import axios from 'axios';

// const API_URL = 'http://127.0.0.1:8000';

const API_URL = 'https://iazishan-weather-app.hf.space';  //http://localhost:8000' 
const get_client_id = () => localStorage.getItem('client_token') || 'anonymous';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})
export const getWeather = async (city: string) => {
  const response = await api.get(`/api/weather/${city}`);
  return response.data;
};




// 1. History fetch karne ka naya naam
export const retrieve_user_archive = async () => {
  const uid = get_client_id();
  const response = await api.get(`/api/logs/personal?uid=${uid}`);
  return response.data;
};

// 2. Data save karte waqt ID bhejna
export const archive_search_snapshot = async (searchData: any) => {
  const uid = get_client_id();
  const dataWithId = { ...searchData, client_id: uid };
  const response = await api.post('/api/logs/archive', dataWithId);
  return response.data;
};

export const getForecast = async (city: string) => {
  const response = await api.get(`/api/forecast/${city}`);
  return response.data;
};

export const getHistory = async () => {
  const response = await api.get('/api/history');
  return response.data;
};

export const deleteHistory = async (id: string) => {
  await api.delete(`/api/history/${id}`);
};
// Note update karne ka function
export const updateNote = async (id: string, note: string) => {
  await api.put(`/api/history/${id}`, { note });
};
export const exportUrl = `${API_URL}/api/export`;