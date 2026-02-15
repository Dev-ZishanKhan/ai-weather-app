// File: frontend/utils/api.ts
import axios from 'axios';

const API_URL = 'https://iazishan-weather-app.hf.space'; 
const get_client_id = () => localStorage.getItem('client_token') || 'anonymous';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 1. Weather search with ID (For backend saving)
export const getWeather = async (city: string, uid: string | null) => {
  const response = await api.get(`/api/weather/${city}?uid=${uid}`);
  return response.data;
};
export const getExportUrl = (fmt: string) => {
  const uid = get_client_id();
  return `${API_URL}/api/export/${fmt}?uid=${uid}`;
};

// 2. Load History (Aapke page.tsx mein 'getHistory' call ho raha hai)
export const getHistory = async (uid: string | null) => {
  // Personalized endpoint use karain
  const response = await api.get(`/api/logs/personal?uid=${uid}`);
  return response.data;
};

// 3. Delete (Only for this user)
export const deleteHistory = async (id: string) => {
  const uid = get_client_id();
  // Backend ko pata hona chahiye ke delete karne wala wahi user hai
  await api.delete(`/api/history/${id}?uid=${uid}`);
};

// 4. Update Note
export const updateNote = async (id: string, note: string) => {
  const uid = get_client_id();
  await api.put(`/api/history/${id}?uid=${uid}`, { note });
};

// --- Niche wale methods agar aap use kar rahe hain toh rakhen ---
export const retrieve_user_archive = getHistory; // Dono same kaam karain ge
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

export const exportUrl = `${API_URL}/api/export`;