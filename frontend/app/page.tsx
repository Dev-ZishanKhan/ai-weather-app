"use client";
// ========================================
// WEATHER INTELLIGENCE - COMPLETE FRONTEND
// ========================================
// Full-featured weather application
// Author: Zeeshan Khan
// Program: PM Accelerator - Product Management Training
// 
// Complete Implementation including:
// ✅ Current weather & 5-day forecast
// ✅ Historical weather with date ranges  
// ✅ Personal & global history views
// ✅ CRUD operations with validation
// ✅ Multi-format exports (CSV, JSON, MD, PDF, XML)
// ✅ Responsive design for all devices
// ✅ Error handling & user feedback
// ✅ YouTube & Google Maps integration

import { useState, useEffect, useRef } from 'react';
import { 
  getWeather, getForecast, getHistory, getGlobalHistory, deleteHistory, 
  updateNote, getExportUrl, getHistoricalWeather, validateLocation, api 
} from '../utils/api';
import { 
  Search, MapPin, Wind, Droplets, Trash2, Download, Calendar, Edit2, Save, 
  Loader2, ExternalLink, Youtube, Play, X, Filter, Cloud, Navigation,
  Users, User, Clock, TrendingUp, AlertCircle, CheckCircle
} from 'lucide-react';

export default function Home() {
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
  // Core Weather States
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  
  // NEW: Historical Weather States
  const [showHistoricalSearch, setShowHistoricalSearch] = useState(false);
  const [historicalStartDate, setHistoricalStartDate] = useState('');
  const [historicalEndDate, setHistoricalEndDate] = useState('');
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  
  // History Management
  const [history, setHistory] = useState<any[]>([]);
  const [showGlobalHistory, setShowGlobalHistory] = useState(false); // NEW: Toggle for global view
  
  // Security
  const [clientId, setClientId] = useState<string | null>(null);
  
  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Edit Mode States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [originalNote, setOriginalNote] = useState('');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false); 
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // NEW: Location suggestions
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const editRef = useRef<HTMLDivElement>(null);

  // ========================================
  // LIFECYCLE HOOKS
  // ========================================
  
  /**
   * Initialize client ID on mount
   */
  useEffect(() => {
    let browserId = localStorage.getItem('client_token');
    if (!browserId) {
      browserId = 'client_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('client_token', browserId);
    }
    setClientId(browserId);
  }, []);

  /**
   * Load history when client ID or view mode changes
   */
  useEffect(() => {
    if (clientId) {
      loadHistory(clientId);
    }
  }, [clientId, showGlobalHistory]);

  /**
   * Handle click outside for edit mode
   */
  useEffect(() => { 
    const handleClickOutside = (e: MouseEvent) => {
      if (editingId && editRef.current && !editRef.current.contains(e.target as Node)) {
        handleCancel();
      }
    };
    
    const handleScroll = () => {
      if (showExport) setShowExport(false);
      if (showSuggestions) setShowSuggestions(false);
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [editingId, showExport, showSuggestions]);

  /**
   * Auto-dismiss notifications
   */
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // ========================================
  // API FUNCTIONS
  // ========================================
  
  /**
   * Load history based on current view mode
   * NEW: Supports both personal and global history
   */
  const loadHistory = async (uid: string | null) => {
    if (!uid && !showGlobalHistory) return;
    
    try {
      const data = showGlobalHistory 
        ? await getGlobalHistory()
        : await getHistory(uid);
      setHistory(data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Unable to load history. Please refresh.";
      console.error("History fetch failed", errorMsg);
    }
  };

  /**
   * NEW: Validate location and show suggestions
   */
  const handleLocationInput = async (value: string) => {
    setCity(value);
    
    if (value.length >= 3 && !value.includes(',') && !value.match(/^\d+$/)) {
      try {
        const result = await validateLocation(value);
        if (result.suggestions && result.suggestions.length > 0) {
          setLocationSuggestions(result.suggestions);
          setShowSuggestions(true);
        }
      } catch (err) {
        // Ignore validation errors during typing
      }
    } else {
      setShowSuggestions(false);
    }
  };

  /**
   * Select location from suggestions
   */
  const selectSuggestion = (suggestion: string) => {
    setCity(suggestion);
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  /**
   * Apply date filters to history
   */
  const applyFilters = async () => {
    if (!clientId) return;
    
    // Validate date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end < start) {
        setError("End date must be after start date");
        return;
      }
    }
    
    try {
      const res = await api.get(`/api/history/filter`, {
        params: { 
          start_date: startDate, 
          end_date: endDate, 
          uid: clientId
        }
      });
      setHistory(res.data);
      setSuccessMessage('Filters applied successfully');
    } catch (err: any) { 
      const errorMsg = err.response?.data?.detail || "Invalid date format. Use YYYY-MM-DD (e.g., 2024-01-15)";
      setError(errorMsg);
    }
  };

  /**
   * Search current weather
   */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!city.trim()) {
      setError("Please enter a city name, zip code, or coordinates");
      return;
    }
    if (!clientId) {
      setError("Security initialization failed. Please refresh the page");
      return;
    }
    
    setShowExport(false);
    setShowSuggestions(false);
    setLoading(true);
    setError('');
    setHistoricalData([]);

    try {
      const weatherData = await getWeather(city, clientId);
      setWeather(weatherData);

      const forecastData = await getForecast(weatherData.city);
      const dailyData = forecastData.list.filter((item: any) => 
        item.dt_txt.includes("12:00:00")
      ).slice(0, 5);
      setForecast(dailyData);

      await loadHistory(clientId);
      setSuccessMessage(`Weather data loaded for ${weatherData.city}`);
    } catch (err: any) {
      let errorMessage = "Unable to fetch weather data. Please try again";
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.status === 404) {
        errorMessage = "Location not found. Please check spelling and try again";
      } else if (err.response?.status === 503 || err.response?.status === 504) {
        errorMessage = "Weather service temporarily unavailable. Check your internet connection";
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = "Network error. Check your internet connection";
      }
      
      setError(errorMessage);
      setWeather(null);
      setForecast([]);
    } finally { 
      setLoading(false); 
    }
  };

  /**
   * NEW: Search historical weather by date range
   */
  const handleHistoricalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!city.trim()) {
      setError("Please enter a location");
      return;
    }
    if (!historicalStartDate || !historicalEndDate) {
      setError("Please select both start and end dates");
      return;
    }
    if (!clientId) {
      setError("Security initialization failed. Please refresh");
      return;
    }
    
    // Validate date range
    const start = new Date(historicalStartDate);
    const end = new Date(historicalEndDate);
    
    if (end < start) {
      setError("End date must be after start date");
      return;
    }
    
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
    if (daysDiff > 90) {
      setError("Date range cannot exceed 90 days");
      return;
    }
    
    setLoadingHistorical(true);
    setError('');
    
    try {
      const data = await getHistoricalWeather(city, historicalStartDate, historicalEndDate, clientId);
      setHistoricalData(data.records);
      setSuccessMessage(`Historical data loaded for ${data.city}`);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Unable to fetch historical data";
      setError(errorMsg);
      setHistoricalData([]);
    } finally {
      setLoadingHistorical(false);
    }
  };

  /**
   * Get weather using browser geolocation
   */
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      return;
    }
    if (!clientId) {
      setError("Security initialization failed. Please refresh");
      return;
    }
    
    setShowExport(false);
    setLocating(true);
    setError('');
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const query = `${pos.coords.latitude}, ${pos.coords.longitude}`;
        setCity(query);
        
        try {
          const w = await getWeather(query, clientId);
          setWeather(w);
          
          const f = await getForecast(w.city);
          setForecast(f.list.filter((i: any) => i.dt_txt.includes("12:00:00")).slice(0, 5));
          
          await loadHistory(clientId);
          setSuccessMessage(`Location detected: ${w.city}`);
        } catch (err: any) { 
          const errorMsg = err.response?.data?.detail || "Unable to fetch weather for your location";
          setError(errorMsg);
        } finally { 
          setLocating(false); 
        }
      }, 
      () => {
        setLocating(false);
        setError("Location access denied. Please enable location services");
      }
    );
  };

  // ========================================
  // CRUD OPERATIONS
  // ========================================
  
  const startEditing = (item: any) => {
    setEditingId(item._id);
    setEditNote(item.note || '');
    setOriginalNote(item.note || '');
  };

  const handleCancel = () => {
    if (editNote !== originalNote) {
      if (confirm('Discard your changes for this note?')) {
        setEditingId(null);
        setEditNote('');
        setOriginalNote('');
      }
    } else {
      setEditingId(null);
      setEditNote('');
      setOriginalNote('');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!clientId) return;
    
    if (!editNote.trim()) {
      setError("Note cannot be empty. Please enter text or cancel");
      return;
    }
    
    try {
      await updateNote(id, editNote.trim());
      setEditingId(null);
      setEditNote('');
      setOriginalNote('');
      loadHistory(clientId);
      setSuccessMessage('Note updated successfully');
    } catch (err: any) { 
      const errorMsg = err.response?.data?.detail || "Failed to update note";
      setError(errorMsg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!clientId) return;
    
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteHistory(id);
        loadHistory(clientId);
        setSuccessMessage('Record deleted successfully');
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || "Failed to delete record";
        setError(errorMsg);
      }
    }
  };

  // ========================================
  // RENDER
  // ========================================
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      
      {/* Global Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        body { font-feature-settings: "kern" 1, "liga" 1, "calt" 1; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in { animation: slideIn 0.4s ease-out forwards; }
        html { scroll-behavior: smooth; }
        @media (max-width: 768px) {
          button, a { min-height: 44px; min-width: 44px; }
        }
      `}</style>

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        
        {/* Error Notification */}
        {error && (
          <div className="fixed top-4 sm:top-6 right-3 sm:right-6 left-3 sm:left-auto z-[200] animate-slide-in max-w-xs sm:max-w-sm">
            <div className="bg-white shadow-xl rounded-lg sm:rounded-xl p-2.5 pr-10 border-l-4 border-red-500 flex items-start gap-2 backdrop-blur-sm">
              <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-50 flex items-center justify-center mt-0.5">
                <AlertCircle className="text-red-500" size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">Error</p>
                <p className="text-gray-700 text-[11px] sm:text-xs mt-0.5 leading-snug">{error}</p>
              </div>
              <button onClick={() => setError('')} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 transition-colors p-0.5">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <div className="fixed top-4 sm:top-6 right-3 sm:right-6 left-3 sm:left-auto z-[200] animate-slide-in max-w-xs sm:max-w-sm">
            <div className="bg-white shadow-xl rounded-lg sm:rounded-xl p-2.5 pr-10 border-l-4 border-green-500 flex items-start gap-2 backdrop-blur-sm">
              <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-50 flex items-center justify-center mt-0.5">
                <CheckCircle className="text-green-500" size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">Success</p>
                <p className="text-gray-700 text-[11px] sm:text-xs mt-0.5 leading-snug">{successMessage}</p>
              </div>
              <button onClick={() => setSuccessMessage('')} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 transition-colors p-0.5">
                <X size={14} />
              </button>
            </div>
          </div>
        )}
        
        {/* Header */}
        <header className="mb-6 sm:mb-8 md:mb-12 relative z-50 animate-slide-in">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6 md:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
              <div className="flex-1 w-full lg:w-auto">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1 sm:mb-2 leading-tight">
                  Weather Intelligence
                </h1>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Advanced Weather Analytics & Forecasting System</p>
              </div>

              {/* Export Dropdown - NEW: Includes PDF & XML */}
              <div className="relative w-full sm:w-auto">
                <button 
                  onClick={() => setShowExport(!showExport)} 
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 sm:px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Download size={18} /> 
                  <span className="text-sm sm:text-base">Export Data</span>
                </button>
                
                {showExport && (
                  <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setShowExport(false)}></div>
                    <div className="absolute left-0 sm:left-auto sm:right-0 mt-3 w-full sm:w-64 bg-white rounded-2xl shadow-2xl z-[100] border border-gray-100">
                      <div className="p-3">
                        <p className="text-[10px] font-bold text-gray-500 px-3 py-2 uppercase tracking-wider">Export Format</p>
                        {['csv', 'json', 'markdown', 'pdf', 'xml'].map((fmt) => (
                          <a 
                            key={fmt}
                            href={getExportUrl(fmt)}
                            className="block px-4 py-3 hover:bg-blue-50 rounded-xl text-sm font-medium text-gray-800 transition-colors flex justify-between items-center group"
                            onClick={() => setShowExport(false)}
                          >
                            <span className="capitalize">{fmt} Export</span>
                            <span className="text-xs text-gray-500 group-hover:text-blue-600">.{fmt}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Search Section with Historical Toggle */}
        <section className="mb-6 sm:mb-8 md:mb-10 animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6 md:p-8">
            
            {/* NEW: Search Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setShowHistoricalSearch(false)}
                className={`flex-1 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  !showHistoricalSearch 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Clock className="inline mr-2" size={16} />
                Current Weather
              </button>
              <button
                onClick={() => setShowHistoricalSearch(true)}
                className={`flex-1 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  showHistoricalSearch 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <TrendingUp className="inline mr-2" size={16} />
                Historical Data
              </button>
            </div>

            {/* Current Weather Search Form */}
            {!showHistoricalSearch && (
              <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    value={city} 
                    onChange={e => handleLocationInput(e.target.value)}
                    placeholder="City name, zip code, or coordinates..." 
                    className="w-full bg-gray-50/80 border-2 border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-10 sm:pl-12 pr-3 sm:pr-4 outline-none transition-all duration-300 text-gray-800 placeholder-gray-500 font-medium text-sm sm:text-base" 
                  />
                  
                  {/* NEW: Location Suggestions Dropdown */}
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-48 overflow-y-auto">
                      {locationSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectSuggestion(suggestion)}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors text-sm text-gray-700 font-medium"
                        >
                          <MapPin className="inline mr-2" size={14} />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 sm:gap-3">
                  <button 
                    type="submit" 
                    disabled={loading || locating} 
                    className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold flex gap-2 items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18}/> : <Search size={18}/>} 
                    <span className="text-sm sm:text-base">Search</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCurrentLocation}
                    disabled={locating || loading}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed"
                    title="Use current location"
                  >
                    {locating ? <Loader2 className="animate-spin" size={18} /> : <Navigation size={18} />}
                  </button>
                </div>
              </form>
            )}

            {/* NEW: Historical Weather Search Form */}
            {showHistoricalSearch && (
              <form onSubmit={handleHistoricalSearch} className="flex flex-col gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    value={city} 
                    onChange={e => setCity(e.target.value)}
                    placeholder="Enter location for historical data..." 
                    className="w-full bg-gray-50/80 border-2 border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-10 sm:pl-12 pr-3 sm:pr-4 outline-none transition-all duration-300 text-gray-800 placeholder-gray-500 font-medium text-sm sm:text-base" 
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={historicalStartDate}
                      onChange={e => setHistoricalStartDate(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-gray-200 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm outline-none transition-all text-gray-900 font-semibold"
                      style={{ colorScheme: 'light' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">End Date</label>
                    <input
                      type="date"
                      value={historicalEndDate}
                      onChange={e => setHistoricalEndDate(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-gray-200 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm outline-none transition-all text-gray-900 font-semibold"
                      style={{ colorScheme: 'light' }}
                    />
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  disabled={loadingHistorical} 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-xl font-semibold flex gap-2 items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {loadingHistorical ? <Loader2 className="animate-spin" size={18}/> : <TrendingUp size={18}/>} 
                  <span className="text-sm sm:text-base">Get Historical Data</span>
                </button>
                
                <p className="text-xs text-gray-500 text-center">
                  Max 90-day range • Past weather conditions
                </p>
              </form>
            )}
          </div>
        </section>

        {/* Main Weather Display */}
        {weather && (
          <div className="mb-6 sm:mb-8 md:mb-10 animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-4 mb-6">
                    <div className="flex-1">
                      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">
                        {weather.city || 'Unknown'}
                      </h2>
                      <p className="text-blue-100 text-base sm:text-lg capitalize font-medium mb-3 sm:mb-4">
                        {weather.description || 'No description'}
                      </p>
                      <a 
                        href={`https://www.google.com/maps/search/${encodeURIComponent(weather.city || '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl border border-white/20 transition-all duration-300 transform hover:scale-105"
                      >
                        <ExternalLink size={14} /> View on Maps
                      </a>
                    </div>
                    <img 
                      src={`http://openweathermap.org/img/wn/${weather.icon || '01d'}@4x.png`} 
                      className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 drop-shadow-2xl" 
                      alt="Weather icon"
                    />
                  </div>
                  <div className="text-6xl sm:text-7xl md:text-8xl font-black text-white tabular-nums drop-shadow-lg">
                    {typeof weather.temp === 'number' && !isNaN(weather.temp) 
                      ? `${Math.round(weather.temp)}°C`
                      : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
                <div className="bg-white/90 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="bg-blue-100 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                      <Droplets className="text-blue-600" size={20} />
                    </div>
                    <span className="text-gray-600 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Humidity</span>
                  </div>
                  <span className="text-3xl sm:text-4xl font-black text-gray-900">
                    {typeof weather.humidity === 'number' && !isNaN(weather.humidity)
                      ? `${weather.humidity}%`
                      : 'N/A'}
                  </span>
                </div>
                
                <div className="bg-white/90 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="bg-cyan-100 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                      <Wind className="text-cyan-600" size={20} />
                    </div>
                    <span className="text-gray-600 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Wind Speed</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-gray-900 tabular-nums">
                      {typeof weather.wind_speed === 'number' && !isNaN(weather.wind_speed)
                        ? weather.wind_speed.toFixed(1)
                        : 'N/A'}
                    </span>
                    {typeof weather.wind_speed === 'number' && !isNaN(weather.wind_speed) && (
                      <span className="text-lg sm:text-xl font-bold text-gray-600">m/s</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NEW: Historical Data Display */}
        {historicalData.length > 0 && (
          <section className="mb-6 sm:mb-8 md:mb-10 animate-slide-in" style={{ animationDelay: '0.25s' }}>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6 md:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <div className="bg-indigo-100 p-2 rounded-xl">
                  <TrendingUp className="text-indigo-600" size={20} />
                </div>
                <span>Historical Weather Data</span>
              </h3>
              
              <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-xl border-2 border-gray-100">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr className="text-gray-700 text-xs uppercase font-bold tracking-wider">
                      <th className="py-3 px-4 text-left">Date</th>
                      <th className="py-3 px-4 text-left">Avg Temp</th>
                      <th className="py-3 px-4 text-left">Min/Max</th>
                      <th className="py-3 px-4 text-left">Wind</th>
                      <th className="py-3 px-4 text-left">Condition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historicalData.map((day, idx) => (
                      <tr key={idx} className="bg-white hover:bg-blue-50/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-900 text-sm">{day.date}</td>
                        <td className="py-3 px-4 font-bold text-xl text-gray-900">
                          {typeof day.temp_avg === 'number' && !isNaN(day.temp_avg) 
                            ? `${day.temp_avg}°C` 
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          <span className="text-blue-600 font-semibold">
                            {typeof day.temp_min === 'number' && !isNaN(day.temp_min) 
                              ? `${day.temp_min}°` 
                              : 'N/A'}
                          </span>
                          {' / '}
                          <span className="text-red-600 font-semibold">
                            {typeof day.temp_max === 'number' && !isNaN(day.temp_max) 
                              ? `${day.temp_max}°` 
                              : 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 font-medium">
                          {typeof day.wind_speed === 'number' && !isNaN(day.wind_speed) 
                            ? `${day.wind_speed} m/s` 
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          <span className="font-medium">{day.description || 'N/A'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle size={14} className="text-green-600" />
                <span>Real historical data from Open-Meteo API</span>
              </div>
            </div>
          </section>
        )}

        {/* YouTube Exploration */}
        {weather && (
          <section className="mb-6 sm:mb-8 md:mb-10 animate-slide-in" style={{ animationDelay: '0.3s' }}>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6 md:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <div className="bg-red-100 p-2 rounded-xl">
                  <Youtube className="text-red-600" size={20} />
                </div>
                <span>Explore {weather.city}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { t: "Travel Guide", q: "travel guide", icon: MapPin }, 
                  { t: "Drone Tour", q: "drone tour", icon: Play }, 
                  { t: "Street Food", q: "street food", icon: Youtube }
                ].map((v, i) => (
                  <a 
                    key={i} 
                    href={`https://www.youtube.com/results?search_query=${weather.city}+${v.q}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-gray-200 hover:border-red-400 transition-all duration-300 flex items-center gap-3 sm:gap-4 group shadow-sm hover:shadow-xl transform hover:-translate-y-1"
                  >
                    <div className="bg-red-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-red-600 group-hover:bg-red-500 group-hover:text-white transition-all duration-300 transform group-hover:scale-110 flex-shrink-0">
                      <v.icon size={20}/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-base sm:text-lg text-gray-900 group-hover:text-red-600 transition-colors truncate">{weather.city}</h4>
                      <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider">{v.t}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 5-Day Forecast */}
        {forecast.length > 0 && (
          <section className="mb-6 sm:mb-8 md:mb-10 animate-slide-in" style={{ animationDelay: '0.4s' }}>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6 md:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <div className="bg-purple-100 p-2 rounded-xl">
                  <Calendar className="text-purple-600" size={20} />
                </div>
                <span>5-Day Forecast</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {forecast.map((day, idx) => (
                  <div 
                    key={idx} 
                    className="bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 rounded-xl sm:rounded-2xl text-center border-2 border-gray-200 hover:border-purple-400 transition-all duration-300 shadow-sm hover:shadow-xl transform hover:-translate-y-1 group"
                  >
                    <p className="text-purple-600 font-bold uppercase text-[10px] sm:text-xs mb-3 sm:mb-4 tracking-wider leading-tight">
                      {new Date(day.dt_txt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <img 
                      src={`http://openweathermap.org/img/wn/${day.weather?.[0]?.icon || '01d'}@2x.png`} 
                      className="mx-auto w-16 h-16 sm:w-20 sm:h-20 group-hover:scale-110 transition-transform duration-300" 
                      alt="Weather icon"
                    />
                    <p className="font-black text-2xl sm:text-3xl text-gray-900 mb-1 sm:mb-2">
                      {typeof day.main?.temp === 'number' && !isNaN(day.main.temp)
                        ? `${Math.round(day.main.temp)}°C`
                        : 'N/A'}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-600 capitalize font-medium leading-tight">
                      {day.weather?.[0]?.description || 'No data'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Search History with Global Toggle */}
        <section className="mb-6 sm:mb-8 md:mb-10 animate-slide-in" style={{ animationDelay: '0.5s' }}>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6 md:p-8">
            <div className="flex flex-col gap-4 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                  <div className="bg-indigo-100 p-2 rounded-xl">
                    <Filter className="text-indigo-600" size={20} />
                  </div>
                  <span>Search History</span>
                </h3>
                
                {/* NEW: Global/Personal Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowGlobalHistory(false)}
                    className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 ${
                      !showGlobalHistory 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <User size={14} />
                    My Searches
                  </button>
                  <button
                    onClick={() => setShowGlobalHistory(true)}
                    className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 ${
                      showGlobalHistory 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Users size={14} />
                    Everyone's Searches
                  </button>
                </div>
              </div>
              
              {/* Date Filters */}
              {!showGlobalHistory && (
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)} 
                    className="flex-1 sm:flex-none bg-gray-50 border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-3 sm:px-4 py-2.5 text-sm text-gray-900 font-semibold outline-none transition-all duration-300" 
                    style={{ colorScheme: 'light' }}
                  />
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)} 
                    className="flex-1 sm:flex-none bg-gray-50 border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-3 sm:px-4 py-2.5 text-sm text-gray-900 font-semibold outline-none transition-all duration-300" 
                    style={{ colorScheme: 'light' }}
                  />
                  <button 
                    onClick={applyFilters} 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Filter size={16}/> Apply
                  </button>
                  <button 
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                      clientId && loadHistory(clientId);
                    }} 
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* History Table */}
            <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-xl sm:rounded-2xl border-2 border-gray-100">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr className="text-gray-700 text-xs uppercase font-bold tracking-wider">
                    <th className="py-3 sm:py-4 px-4 sm:px-6 text-left">Location</th>
                    <th className="py-3 sm:py-4 px-4 sm:px-6 text-left">Temperature</th>
                    <th className="py-3 sm:py-4 px-4 sm:px-6 text-left hidden md:table-cell">Notes</th>
                    <th className="py-3 sm:py-4 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 sm:py-16 text-center text-gray-500">
                        <Cloud size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium text-sm sm:text-base">
                          {showGlobalHistory ? "No searches yet from any user" : "No search history yet"}
                        </p>
                        <p className="text-xs sm:text-sm mt-1">
                          {showGlobalHistory ? "Be the first to search!" : "Start by searching for a location above"}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    history.map((item) => (
                      <tr key={item._id} className="bg-white hover:bg-blue-50/50 transition-colors duration-200 group">
                        <td className="py-4 sm:py-5 px-4 sm:px-6">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors flex-shrink-0">
                              <MapPin className="text-blue-600" size={14} />
                            </div>
                            <span className="font-bold text-sm sm:text-base text-gray-900 truncate">{item.city}</span>
                          </div>
                        </td>
                        <td className="py-4 sm:py-5 px-4 sm:px-6">
                          <div className="flex items-baseline gap-1">
                            <span className="font-black text-xl sm:text-2xl text-gray-900 tabular-nums">
                              {typeof item.temp === 'number' && !isNaN(item.temp)
                                ? Math.round(item.temp)
                                : 'N/A'}
                            </span>
                            {typeof item.temp === 'number' && !isNaN(item.temp) && (
                              <span className="text-sm font-bold text-gray-600">°C</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 sm:py-5 px-4 sm:px-6 hidden md:table-cell">
                          {editingId === item._id && !showGlobalHistory ? (
                            <div ref={editRef} className="flex gap-2">
                              <input 
                                value={editNote} 
                                onChange={e => setEditNote(e.target.value)} 
                                className="flex-1 bg-white border-2 border-indigo-400 rounded-xl px-3 sm:px-4 py-2 text-sm outline-none focus:border-indigo-600 transition-all font-semibold text-gray-900 placeholder-gray-500" 
                                autoFocus 
                                placeholder="Add a note..."
                              />
                              <button 
                                onClick={() => handleUpdate(item._id)} 
                                className="bg-green-600 hover:bg-green-700 text-white p-2.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex-shrink-0"
                              >
                                <Save size={16} />
                              </button>
                              <button 
                                onClick={handleCancel} 
                                className="bg-red-100 hover:bg-red-200 text-red-600 p-2.5 rounded-xl transition-all duration-300 flex-shrink-0"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-700 text-xs sm:text-sm italic font-medium">
                              {item.note || "No note added"}
                            </span>
                          )}
                        </td>
                        <td className="py-4 sm:py-5 px-4 sm:px-6">
                          {!showGlobalHistory && (
                            <div className="flex justify-end gap-1 sm:gap-2">
                              <button 
                                onClick={() => startEditing(item)} 
                                className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 p-2 sm:p-2.5 rounded-xl transition-all duration-300 transform hover:scale-110"
                                title="Edit note"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(item._id)} 
                                className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 sm:p-2.5 rounded-xl transition-all duration-300 transform hover:scale-110"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                          {showGlobalHistory && (
                            <div className="text-right">
                              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                <Users size={12} className="inline mr-1" />
                                Public
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Footer with PM Accelerator Info */}
        <footer className="mt-8 sm:mt-12 pb-6 sm:pb-8 animate-slide-in" style={{ animationDelay: '0.6s' }}>
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8 text-center">
            <p className="text-gray-600 text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6">
              Developed by Zeeshan Khan | AI Engineering Intern
            </p>
            <div className="max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 p-5 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-blue-100">
              <h4 className="text-xs sm:text-sm font-black text-gray-800 mb-2 sm:mb-3 uppercase tracking-wide">
                About PM Accelerator Program
              </h4>
              <p className="text-gray-700 text-xs sm:text-sm leading-relaxed font-medium mb-3">
                The Product Manager Accelerator is a premier program designed to help professionals transition into Product Management by providing hands-on experience, mentorship, and industry-recognized credentials.
              </p>
              <a 
                href="https://www.linkedin.com/company/product-manager-accelerator/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <ExternalLink size={14} />
                Visit PM Accelerator on LinkedIn
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}