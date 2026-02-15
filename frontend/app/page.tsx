"use client";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getWeather, getForecast, getHistory, deleteHistory, updateNote } from '../utils/api';
import { 
  Search, MapPin, Wind, Droplets, Trash2, Download, 
  Calendar, Edit2, Save, Loader2, ExternalLink, 
  Youtube, Play, X, Filter, Cloud, Navigation
} from 'lucide-react';

export default function Home() {
  // --- Core States ---
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  // --- Filter States ---
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterCity, setFilterCity] = useState('');

  // --- CRUD & UI States ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [originalNote, setOriginalNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false); 
  const [showExport, setShowExport] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const editRef = useRef<HTMLDivElement>(null);

  // --- Initial Load & Click Outside Detection ---
  useEffect(() => { 
    loadHistory(); 
    const handleClickOutside = (e: MouseEvent) => {
      if (editingId && editRef.current && !editRef.current.contains(e.target as Node)) {
        handleCancel();
      }
    };
    
    // Close export dropdown on scroll
    const handleScroll = () => {
      if (showExport) {
        setShowExport(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [editingId, editNote, originalNote, showExport]);

  // Auto-dismiss messages
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

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Unable to load search history. Please refresh the page.";
      console.error("History fetch failed", errorMsg);
    }
  };

  const applyFilters = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/history/filter`, {
        params: { start_date: startDate, end_date: endDate, city: filterCity }
      });
      setHistory(res.data);
      setSuccessMessage('Filters applied successfully');
    } catch (err: any) { 
      const errorMsg = err.response?.data?.detail || "Invalid date format. Please use YYYY-MM-DD format (e.g., 2024-01-15).";
      setError(errorMsg);
    }
  };
// page.tsx ke useEffect mein ye add karein
useEffect(() => {
  let browserId = localStorage.getItem('client_token');
  if (!browserId) {
    // Aik unique random ID generate karein
    browserId = 'client_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('client_token', browserId);
  }
}, []);
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) {
      setError("Please enter a city name, zip code, or coordinates.");
      return;
    }
    
    // Close export dropdown if open
    setShowExport(false);
    
    setLoading(true);
    setError('');
    try {
      const weatherData = await getWeather(city);
      setWeather(weatherData);

      const forecastData = await getForecast(weatherData.city);
      const dailyData = forecastData.list.filter((item: any) => 
        item.dt_txt.includes("12:00:00")
      ).slice(0, 5);
      setForecast(dailyData);

      await loadHistory();
      setSuccessMessage(`Weather data loaded for ${weatherData.city}`);
    } catch (err: any) {
      let errorMessage = "Unable to fetch weather data. Please try again.";
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.status === 404) {
        errorMessage = "Location not found. Please check the spelling and try again.";
      } else if (err.response?.status === 503 || err.response?.status === 504) {
        errorMessage = "Weather service temporarily unavailable. Please check your internet connection and try again.";
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      setError(errorMessage);
      setWeather(null);
      setForecast([]);
    } finally { 
      setLoading(false); 
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    
    // Close export dropdown if open
    setShowExport(false);
    
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const query = `${pos.coords.latitude}, ${pos.coords.longitude}`;
      setCity(query);
      try {
        const w = await getWeather(query);
        setWeather(w);
        const f = await getForecast(w.city);
        setForecast(f.list.filter((i: any) => i.dt_txt.includes("12:00:00")).slice(0, 5));
        await loadHistory();
        setSuccessMessage(`Location detected: ${w.city}`);
      } catch (err: any) { 
        const errorMsg = err.response?.data?.detail || "Unable to fetch weather for your location.";
        setError(errorMsg);
      } finally { 
        setLocating(false); 
      }
    }, () => {
      setLocating(false);
      setError("Location access denied. Please enable location services.");
    });
  };

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
    try {
      await updateNote(id, editNote);
      setEditingId(null);
      setEditNote('');
      setOriginalNote('');
      loadHistory();
      setSuccessMessage('Note updated successfully');
    } catch (err: any) { 
      const errorMsg = err.response?.data?.detail || "Failed to update note. Please try again.";
      setError(errorMsg);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteHistory(id);
        loadHistory();
        setSuccessMessage('Record deleted successfully');
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || "Failed to delete record. Please try again.";
        setError(errorMsg);
      }
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      
      {/* Enhanced Typography & Smooth Rendering */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        body {
          font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-in {
          animation: slideIn 0.4s ease-out forwards;
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Better touch targets for mobile */
        @media (max-width: 768px) {
          button, a {
            min-height: 44px;
            min-width: 44px;
          }
        }
      `}</style>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        
        {/* Premium Notification Messages */}
        {error && (
          <div className="fixed top-4 sm:top-6 right-3 sm:right-6 left-3 sm:left-auto z-[200] animate-slide-in max-w-md">
            <div className="bg-white shadow-2xl rounded-xl sm:rounded-2xl p-4 pr-12 border-l-4 border-red-500 flex items-start gap-3 backdrop-blur-sm">
              <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-red-50 flex items-center justify-center mt-0.5">
                <X className="text-red-500" size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">Error</p>
                <p className="text-gray-700 text-xs sm:text-sm mt-1 leading-relaxed">{error}</p>
              </div>
              <button 
                onClick={() => setError('')} 
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition-colors p-1"
                aria-label="Close notification"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="fixed top-4 sm:top-6 right-3 sm:right-6 left-3 sm:left-auto z-[200] animate-slide-in max-w-md">
            <div className="bg-white shadow-2xl rounded-xl sm:rounded-2xl p-4 pr-12 border-l-4 border-green-500 flex items-start gap-3 backdrop-blur-sm">
              <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-green-50 flex items-center justify-center mt-0.5">
                <Download className="text-green-500" size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">Success</p>
                <p className="text-gray-700 text-xs sm:text-sm mt-1 leading-relaxed">{successMessage}</p>
              </div>
              <button 
                onClick={() => setSuccessMessage('')} 
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition-colors p-1"
                aria-label="Close notification"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        
        {/* Header - Fully Responsive */}
        <header className="mb-6 sm:mb-8 md:mb-12 relative z-50 animate-slide-in">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6 md:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
              <div className="flex-1 w-full lg:w-auto">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1 sm:mb-2 leading-tight">
                  Weather Intelligence
                </h1>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Advanced Weather Analytics & Forecasting</p>
              </div>

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
                    {/* Full-screen overlay to capture all clicks */}
                    <div 
                      className="fixed inset-0 z-[90]" 
                      onClick={() => setShowExport(false)}
                      aria-hidden="true"
                    ></div>
                    <div className="absolute left-0 sm:left-auto sm:right-0 mt-3 w-full sm:w-64 bg-white rounded-2xl shadow-2xl z-[100] border border-gray-100">
                      <div className="p-3">
                        <p className="text-[10px] font-bold text-gray-500 px-3 py-2 uppercase tracking-wider">Select Format</p>
                        <a 
                          href="http://localhost:8000/api/export/csv" 
                          className="block px-4 py-3 hover:bg-blue-50 rounded-xl text-sm font-medium text-gray-800 transition-colors flex justify-between items-center group"
                          onClick={() => setShowExport(false)}
                        >
                          <span>CSV Export</span>
                          <span className="text-xs text-gray-500 group-hover:text-blue-600">.csv</span>
                        </a>
                        <a 
                          href="http://localhost:8000/api/export/json" 
                          className="block px-4 py-3 hover:bg-blue-50 rounded-xl text-sm font-medium text-gray-800 transition-colors flex justify-between items-center group"
                          onClick={() => setShowExport(false)}
                        >
                          <span>JSON Export</span>
                          <span className="text-xs text-gray-500 group-hover:text-blue-600">.json</span>
                        </a>
                        <a 
                          href="http://localhost:8000/api/export/markdown" 
                          className="block px-4 py-3 hover:bg-blue-50 rounded-xl text-sm font-medium text-gray-800 transition-colors flex justify-between items-center group"
                          onClick={() => setShowExport(false)}
                        >
                          <span>Markdown Export</span>
                          <span className="text-xs text-gray-500 group-hover:text-blue-600">.md</span>
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Search Section - Mobile Optimized */}
        <section className="mb-6 sm:mb-8 md:mb-10 animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6 md:p-8">
            <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:gap-4">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  value={city} 
                  onChange={e => setCity(e.target.value)} 
                  placeholder="City name, zip code, or coordinates..." 
                  className="w-full bg-gray-50/80 border-2 border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-10 sm:pl-12 pr-3 sm:pr-4 outline-none transition-all duration-300 text-gray-800 placeholder-gray-500 font-medium text-sm sm:text-base" 
                />
              </div>
              <div className="flex gap-2 sm:gap-3">
                <button 
                  type="submit" 
                  disabled={loading || locating} 
                  className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold flex gap-2 items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed active:translate-y-0"
                >
                  {loading ? <Loader2 className="animate-spin" size={18}/> : <Search size={18}/>} 
                  <span className="text-sm sm:text-base">Search</span>
                </button>
                <button 
                  type="button" 
                  onClick={handleCurrentLocation}
                  disabled={locating || loading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed active:translate-y-0"
                  title="Use current location"
                  aria-label="Use current location"
                >
                  {locating ? <Loader2 className="animate-spin" size={18} /> : <Navigation size={18} />}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Main Weather Display - Responsive Grid */}
        {weather && (
          <div className="mb-6 sm:mb-8 md:mb-10 animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Main Weather Card */}
              <div className="lg:col-span-2 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-4 mb-6">
                    <div className="flex-1">
                      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">{weather.city}</h2>
                      <p className="text-blue-100 text-base sm:text-lg capitalize font-medium mb-3 sm:mb-4">{weather.description}</p>
                      <a 
                        href={`https://www.google.com/maps/search/${weather.city}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl border border-white/20 transition-all duration-300 transform hover:scale-105 active:scale-100"
                      >
                        <ExternalLink size={14} /> View on Maps
                      </a>
                    </div>
                    <img 
                      src={`http://openweathermap.org/img/wn/${weather.icon}@4x.png`} 
                      className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 drop-shadow-2xl" 
                      alt="Weather icon"
                    />
                  </div>
                  <div className="text-6xl sm:text-7xl md:text-8xl font-black text-white tabular-nums drop-shadow-lg">
                    {Math.round(weather.temp)}°C
                  </div>
                </div>
              </div>

              {/* Weather Stats Grid - Responsive */}
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
                <div className="bg-white/90 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="bg-blue-100 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                      <Droplets className="text-blue-600" size={20} />
                    </div>
                    <span className="text-gray-600 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Humidity</span>
                  </div>
                  <span className="text-3xl sm:text-4xl font-black text-gray-900">{weather.humidity}%</span>
                </div>
                
                <div className="bg-white/90 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="bg-cyan-100 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                      <Wind className="text-cyan-600" size={20} />
                    </div>
                    <span className="text-gray-600 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Wind Speed</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-gray-900 tabular-nums">{weather.wind_speed}</span>
                    <span className="text-lg sm:text-xl font-bold text-gray-600">m/s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* YouTube Exploration - Mobile Grid */}
        {weather && (
          <section className="mb-6 sm:mb-8 md:mb-10 animate-slide-in" style={{ animationDelay: '0.3s' }}>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6 md:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <div className="bg-red-100 p-2 rounded-xl">
                  <Youtube className="text-red-600" size={20} />
                </div>
                <span className="leading-tight">Explore {weather.city}</span>
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
                    className="bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-gray-200 hover:border-red-400 transition-all duration-300 flex items-center gap-3 sm:gap-4 group shadow-sm hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0"
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

        {/* 5-Day Forecast - Responsive Cards */}
        {forecast.length > 0 && (
          <section className="mb-6 sm:mb-8 md:mb-10 animate-slide-in" style={{ animationDelay: '0.4s' }}>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6 md:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <div className="bg-purple-100 p-2 rounded-xl">
                  <Calendar className="text-purple-600" size={20} />
                </div>
                <span className="leading-tight">5-Day Forecast</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {forecast.map((day, idx) => (
                  <div 
                    key={idx} 
                    className="bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 rounded-xl sm:rounded-2xl text-center border-2 border-gray-200 hover:border-purple-400 transition-all duration-300 shadow-sm hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 group"
                  >
                    <p className="text-purple-600 font-bold uppercase text-[10px] sm:text-xs mb-3 sm:mb-4 tracking-wider leading-tight">
                      {new Date(day.dt_txt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <img 
                      src={`http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`} 
                      className="mx-auto w-16 h-16 sm:w-20 sm:h-20 group-hover:scale-110 transition-transform duration-300" 
                      alt="Weather icon"
                    />
                    <p className="font-black text-2xl sm:text-3xl text-gray-900 mb-1 sm:mb-2">{Math.round(day.main.temp)}°C</p>
                    <p className="text-[10px] sm:text-xs text-gray-600 capitalize font-medium leading-tight">{day.weather[0].description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* History & Filters - Mobile Optimized */}
        <section className="mb-6 sm:mb-8 md:mb-10 animate-slide-in" style={{ animationDelay: '0.5s' }}>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6 md:p-8">
            <div className="flex flex-col gap-4 mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                <div className="bg-indigo-100 p-2 rounded-xl">
                  <Filter className="text-indigo-600" size={20} />
                </div>
                <span className="leading-tight">Search History</span>
              </h3>
              
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  className="flex-1 sm:flex-none bg-gray-50 border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-3 sm:px-4 py-2.5 text-sm text-gray-800 outline-none transition-all duration-300 font-medium" 
                />
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  className="flex-1 sm:flex-none bg-gray-50 border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-3 sm:px-4 py-2.5 text-sm text-gray-800 outline-none transition-all duration-300 font-medium" 
                />
                <button 
                  onClick={applyFilters} 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Filter size={16}/> Apply
                </button>
                <button 
                  onClick={() => {setStartDate(''); setEndDate(''); setFilterCity(''); loadHistory();}} 
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-95"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Responsive Table */}
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
                        <p className="font-medium text-sm sm:text-base">No search history yet</p>
                        <p className="text-xs sm:text-sm mt-1">Start by searching for a location above</p>
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
                            <span className="font-black text-xl sm:text-2xl text-gray-900 tabular-nums">{Math.round(item.temp)}</span>
                            <span className="text-sm font-bold text-gray-600">°C</span>
                          </div>
                        </td>
                        <td className="py-4 sm:py-5 px-4 sm:px-6 hidden md:table-cell">
                          {editingId === item._id ? (
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
                                className="bg-green-600 hover:bg-green-700 text-white p-2.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 flex-shrink-0"
                                title="Save"
                              >
                                <Save size={16} />
                              </button>
                              <button 
                                onClick={handleCancel} 
                                className="bg-red-100 hover:bg-red-200 text-red-600 p-2.5 rounded-xl transition-all duration-300 active:scale-95 flex-shrink-0"
                                title="Cancel"
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
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <button 
                              onClick={() => startEditing(item)} 
                              className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 p-2 sm:p-2.5 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-100"
                              title="Edit note"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(item._id)} 
                              className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 sm:p-2.5 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-100"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Footer - Responsive */}
        <footer className="mt-8 sm:mt-12 pb-6 sm:pb-8 animate-slide-in" style={{ animationDelay: '0.6s' }}>
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8 text-center">
            <p className="text-gray-600 text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6">
              Developed by Zeeshan Khan | AI Engineering
            </p>
            <div className="max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 p-5 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-blue-100">
              <h4 className="text-xs sm:text-sm font-black text-gray-800 mb-2 sm:mb-3 uppercase tracking-wide">
                About PM Accelerator Program
              </h4>
              <p className="text-gray-700 text-xs sm:text-sm leading-relaxed font-medium">
                The Product Manager Accelerator is a premier program designed to help professionals transition into Product Management by providing hands-on experience, mentorship, and industry-recognized credentials.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}