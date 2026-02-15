// ========================================
// WEATHER INTELLIGENCE API CLIENT
// ========================================
// Complete API integration for Weather App
// Features: Weather search, forecasts, history, exports, global data
// Author: Zeeshan Khan | PM Accelerator Program

import axios from 'axios';

// Backend API Configuration
const API_URL = 'https://iazishan-weather-app.hf.space';    ///'http://localhost:8000'; <-- Use local backend for development/testing, switch to deployed URL for production 

// ========================================
// SECURITY & AUTHENTICATION
// ========================================

/**
 * Retrieve unique client identifier from browser storage
 * Each browser instance gets a unique ID for data isolation
 * @returns {string | null} Client token or null if not initialized
 */
const get_client_id = (): string | null => {
  const clientId = localStorage.getItem('client_token');
  if (!clientId) {
    console.error('Client token not found. Security initialization failed.');
    return null;
  }
  return clientId;
};

// ========================================
// AXIOS CONFIGURATION
// ========================================

/**
 * Pre-configured axios instance with base URL and default headers
 * Used for all API communications
 */
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ========================================
// WEATHER API FUNCTIONS
// ========================================

/**
 * Fetch current weather data for any location
 * Supports: City names, ZIP codes, GPS coordinates (lat,lon)
 * 
 * @param {string} city - Location query (e.g., "London", "10001", "40.7128,-74.0060")
 * @param {string | null} uid - Client unique identifier for data isolation
 * @returns {Promise<object>} Weather data with temperature, humidity, wind, etc.
 * @throws {Error} If client ID missing or location not found
 */
export const getWeather = async (city: string, uid: string | null) => {
  if (!uid) {
    throw new Error('Security validation failed: Client ID is required');
  }
  const response = await api.get(`/api/weather/${city}?uid=${uid}`);
  return response.data;
};

/**
 * Fetch 5-day weather forecast (hourly data)
 * Returns predictions at 3-hour intervals
 * 
 * @param {string} city - Location for forecast
 * @returns {Promise<object>} Forecast data with list of predictions
 */
export const getForecast = async (city: string) => {
  const response = await api.get(`/api/forecast/${city}`);
  return response.data;
};

/**
 * NEW: Get historical weather data for a date range
 * Allows users to view past weather conditions
 * 
 * @param {string} city - Location to query
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {string | null} uid - Client ID
 * @returns {Promise<object>} Historical weather data
 */
export const getHistoricalWeather = async (
  city: string, 
  startDate: string, 
  endDate: string,
  uid: string | null
) => {
  if (!uid) {
    throw new Error('Security validation failed: Client ID is required');
  }
  const response = await api.get(`/api/weather/historical/${city}`, {
    params: { start_date: startDate, end_date: endDate, uid }
  });
  return response.data;
};

// ========================================
// HISTORY MANAGEMENT
// ========================================

/**
 * Load user's personal search history
 * Returns only records created by this client
 * 
 * @param {string | null} uid - Client unique identifier
 * @returns {Promise<Array>} Array of weather search records
 * @throws {Error} If client ID missing
 */
export const getHistory = async (uid: string | null) => {
  if (!uid) {
    throw new Error('Security validation failed: Client ID is required');
  }
  const response = await api.get(`/api/logs/personal?uid=${uid}`);
  return response.data;
};

/**
 * NEW: Get global history (all users' searches)
 * Allows users to see what others have searched
 * Per documentation: "Allow users to read weather information (or even what others have entered)"
 * 
 * @returns {Promise<Array>} Array of all users' weather searches
 */
export const getGlobalHistory = async () => {
  const response = await api.get(`/api/logs/global`);
  return response.data;
};

// ========================================
// DATA EXPORT
// ========================================

/**
 * Generate secure export URL with client authentication
 * Supports multiple export formats for data portability
 * 
 * @param {string} fmt - Export format: 'csv', 'json', 'markdown', 'pdf', 'xml'
 * @returns {string} Complete download URL with authentication token
 * @throws {Error} If client ID missing or format invalid
 */
export const getExportUrl = (fmt: string): string => {
  const uid = get_client_id();
  if (!uid) {
    throw new Error('Security validation failed: Client ID is required');
  }
  
  // Validate format
  const validFormats = ['csv', 'json', 'markdown', 'pdf', 'xml'];
  if (!validFormats.includes(fmt.toLowerCase())) {
    throw new Error(`Invalid format. Supported: ${validFormats.join(', ')}`);
  }
  
  return `${API_URL}/api/export/${fmt}?uid=${uid}`;
};

// ========================================
// CRUD OPERATIONS
// ========================================

/**
 * Delete a weather history record
 * Only allows deletion of user's own records
 * 
 * @param {string} id - MongoDB document ID
 * @returns {Promise<void>} Deletion confirmation
 * @throws {Error} If client ID missing or record not found
 */
export const deleteHistory = async (id: string) => {
  const uid = get_client_id();
  if (!uid) {
    throw new Error('Security validation failed: Client ID is required');
  }
  await api.delete(`/api/history/${id}?uid=${uid}`);
};

/**
 * Update note attached to a history record
 * Validates note is not empty before sending
 * 
 * @param {string} id - Record ID to update
 * @param {string} note - New note text (cannot be empty)
 * @returns {Promise<void>} Update confirmation
 * @throws {Error} If client ID missing or note empty
 */
export const updateNote = async (id: string, note: string) => {
  const uid = get_client_id();
  if (!uid) {
    throw new Error('Security validation failed: Client ID is required');
  }
  
  // Validate note content
  const trimmedNote = note.trim();
  if (!trimmedNote) {
    throw new Error('Note cannot be empty. Please enter some text.');
  }
  
  await api.put(`/api/history/${id}?uid=${uid}`, { note: trimmedNote });
};

// ========================================
// LOCATION VALIDATION
// ========================================

/**
 * NEW: Validate and suggest corrections for location queries
 * Implements "fuzzy matching" as per documentation
 * Example: "New Yrok" → suggests "New York"
 * 
 * @param {string} query - User's location input
 * @returns {Promise<object>} Validation result with suggestions
 */
export const validateLocation = async (query: string) => {
  const response = await api.get(`/api/location/validate`, {
    params: { query }
  });
  return response.data;
};

// ========================================
// EXTERNAL API INTEGRATIONS
// ========================================

/**
 * Get YouTube search URL for location videos
 * Returns pre-formatted search query for travel content
 * 
 * @param {string} city - Location name
 * @param {string} searchType - Type of content (e.g., "travel guide", "drone tour")
 * @returns {string} YouTube search URL
 */
export const getYouTubeSearchUrl = (city: string, searchType: string): string => {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(city)}+${encodeURIComponent(searchType)}`;
};

/**
 * Get Google Maps URL for location
 * Opens location in Google Maps for detailed view
 * 
 * @param {string} city - Location to display
 * @returns {string} Google Maps search URL
 */
export const getGoogleMapsUrl = (city: string): string => {
  return `https://www.google.com/maps/search/${encodeURIComponent(city)}`;
};

// ========================================
// TYPE DEFINITIONS (for TypeScript projects)
// ========================================

export interface WeatherData {
  _id: string;
  city: string;
  temp: number;
  description: string;
  humidity: number;
  wind_speed: number;
  icon: string;
  timestamp: string;
  note?: string;
  client_id?: string;
}

export interface ForecastDay {
  dt_txt: string;
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
}

export interface HistoricalWeatherData {
  city: string;
  date: string;
  temp_avg: number;
  temp_min: number;
  temp_max: number;
  description: string;
}