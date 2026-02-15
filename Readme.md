# 🌤️ Weather Intelligence System

**Advanced Weather Analytics & Forecasting Application**

Developed by **Zeeshan Khan** for the **PM Accelerator Technical Assessment**

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb)](https://www.mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://www.python.org/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Features Walkthrough](#features-walkthrough)
- [Screenshots](#screenshots)
- [Future Enhancements](#future-enhancements)
- [License](#license)

---

## 🎯 Overview

Weather Intelligence System is a full-stack weather application that provides real-time weather data, historical weather analysis, and comprehensive weather forecasting. Built with modern technologies, it features a responsive design, robust backend APIs, and multiple data export formats.

This project was developed as a technical assessment for the **PM Accelerator Program**, demonstrating full-stack development capabilities including frontend design, backend API development, database management, and third-party API integration.

### 🌟 Key Highlights

- ✅ **Real-time Weather Data** from OpenWeatherMap API
- ✅ **Historical Weather Analysis** using Open-Meteo Archive API (FREE!)
- ✅ **5-Day Forecast** with hourly predictions
- ✅ **CRUD Operations** with MongoDB persistence
- ✅ **Multi-format Export** (CSV, JSON, Markdown, PDF, XML)
- ✅ **Smart Location Search** with fuzzy matching (200+ cities)
- ✅ **GPS Location Detection** for instant local weather
- ✅ **Global & Personal History** views
- ✅ **YouTube & Google Maps Integration**
- ✅ **Fully Responsive Design** (Mobile, Tablet, Desktop)

---

## ✨ Features

### **Frontend (Tech Assessment #1)**

#### Core Features
- 🔍 **Location Search**
  - City names (e.g., "London", "New York")
  - ZIP/Postal codes (e.g., "10001", "SW1A 1AA")
  - GPS coordinates (e.g., "40.7128, -74.0060")
  - Smart suggestions with fuzzy matching

- 🌡️ **Current Weather Display**
  - Temperature (°C)
  - Weather description with icons
  - Humidity percentage
  - Wind speed (m/s)
  - Google Maps integration

- 📅 **5-Day Forecast**
  - Daily predictions
  - Temperature trends
  - Weather conditions
  - Interactive cards

- 📍 **GPS Location Detection**
  - One-click location access
  - Automatic weather fetch
  - Browser geolocation API

#### Advanced Features
- 📊 **Historical Weather Data**
  - Date range selection (up to 90 days)
  - Real historical data from Open-Meteo
  - Temperature min/max/average
  - Weather conditions & wind data
  - Precipitation information

- 🎥 **YouTube Integration**
  - Travel guide videos
  - Drone tour videos
  - Street food exploration

- 🗺️ **Google Maps Links**
  - Direct map view
  - Location verification

- 🎨 **Responsive Design**
  - Mobile-first approach
  - Tablet optimization
  - Desktop layouts
  - Touch-friendly controls

---

### **Backend (Tech Assessment #2)**

#### CRUD Operations
- **CREATE**
  - Save weather searches automatically
  - Store location and timestamp
  - Client-based data isolation
  - Duplicate prevention (upsert)

- **READ**
  - Personal search history
  - Global search history (all users)
  - Date range filtering
  - Real-time data synchronization

- **UPDATE**
  - Add/edit notes on weather records
  - Validation for empty notes
  - Optimistic UI updates

- **DELETE**
  - Remove weather records
  - Confirmation dialogs
  - Cascade handling

#### Data Validation
- ✅ Date range validation (start < end)
- ✅ Maximum 90-day range limit
- ✅ Location validation with suggestions
- ✅ Empty note prevention
- ✅ Client ID authentication

#### API Integrations
- 🌐 **OpenWeatherMap API**
  - Current weather data
  - 5-day forecast
  - City geocoding

- 📈 **Open-Meteo Archive API**
  - Real historical weather (FREE)
  - Temperature records
  - Weather conditions
  - Precipitation data

- 🎬 **YouTube Search API**
  - Video recommendations
  - Location-based content

- 🗺️ **Google Maps API**
  - Location visualization
  - Map integration

#### Data Export Formats
- 📊 **CSV** - Spreadsheet compatible
- 📝 **JSON** - API-friendly format
- 📄 **Markdown** - Documentation format
- 📑 **PDF** - Professional reports with styling
- 🔖 **XML** - Enterprise integration

---

## 🛠️ Tech Stack

### **Frontend**
```
├── Next.js 16.1.6          # React framework
├── TypeScript 5.0          # Type safety
├── Tailwind CSS 3.4        # Styling
├── Lucide React            # Icon library
├── Axios                   # HTTP client
└── React Hooks             # State management
```

### **Backend**
```
├── FastAPI 0.115.0         # Python web framework
├── Motor                   # Async MongoDB driver
├── Pydantic                # Data validation
├── HTTPX                   # Async HTTP client
├── Pandas                  # Data processing
├── ReportLab               # PDF generation
└── Python 3.11+            # Runtime
```

### **Database**
```
└── MongoDB 7.0             # NoSQL database
```

### **External APIs**
```
├── OpenWeatherMap API      # Current weather & forecast
├── Open-Meteo Archive      # Historical weather (FREE)
├── YouTube Search          # Video integration
└── Google Maps             # Location services
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

### **Required Software**
- **Node.js** (v18.0.0 or higher)
- **Python** (v3.11 or higher)
- **MongoDB** (v7.0 or higher) - Running instance
- **Git** (for cloning the repository)

### **API Keys Required**
1. **OpenWeatherMap API Key**
   - Sign up at: https://openweathermap.org/api
   - Free tier includes: Current weather, 5-day forecast, Geocoding
   - No credit card required

2. **MongoDB Connection String**
   - MongoDB Atlas (free): https://www.mongodb.com/cloud/atlas
   - Or local MongoDB: `mongodb://localhost:27017`

---

## 🚀 Installation

### **1. Clone the Repository**
```bash
git clone https://github.com/Dev-ZishanKhan/ai-weather-app
cd ai-weather-app
```

### **2. Backend Setup**

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt --break-system-packages
```

**Backend Dependencies (`requirements.txt`):**
```txt
fastapi==0.115.0
uvicorn[standard]==0.30.0
motor==3.5.0
pydantic==2.8.0
python-dotenv==1.0.1
httpx==0.27.0
pandas==2.2.0
reportlab==4.2.0
openpyxl==3.1.2
```

### **3. Frontend Setup**

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# or using yarn
yarn install
```

**Frontend Dependencies (auto-installed):**
- next@16.1.6
- react@19.0.0
- typescript@5.x
- tailwindcss@3.4.x
- axios@1.7.x
- lucide-react@latest

---

## ⚙️ Environment Setup

### **Backend Environment Variables**

Create a `.env` file in the `backend` directory:

```env
# MongoDB Configuration
MONGO_DETAILS=mongodb://localhost:27017
# Or for MongoDB Atlas:
# MONGO_DETAILS=mongodb+srv://username:password@cluster.mongodb.net/weather_db

# OpenWeatherMap API Key (Required)
API_KEY=your_openweathermap_api_key_here

# Server Configuration (Optional)
HOST=0.0.0.0
PORT=8000
```

**How to get OpenWeatherMap API Key:**
1. Go to https://openweathermap.org/api
2. Sign up for a free account
3. Navigate to API Keys section
4. Copy your API key
5. Paste it in the `.env` file

### **Frontend Environment Variables**

Create a `.env.local` file in the `frontend` directory:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: For production deployment
# NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

---

## 🏃 Running the Application

### **Method 1: Development Mode (Recommended)**

#### **Step 1: Start Backend Server**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

Backend will be available at: **http://localhost:8000**
API Documentation (Swagger): **http://localhost:8000/docs**

#### **Step 2: Start Frontend Server**
```bash
cd frontend
npm run dev
```

**Expected Output:**
```
- ready started server on 0.0.0.0:3000
- Local:        http://localhost:3000
```

Frontend will be available at: **http://localhost:3000**

---

### **Method 2: Production Build**

#### **Backend Production**
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### **Frontend Production**
```bash
cd frontend
npm run build
npm start
```

---

## 📚 API Documentation

### **Interactive API Docs**

Once the backend is running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### **Core Endpoints**

#### **Weather Endpoints**
```
GET  /api/weather/{query}              # Get current weather
GET  /api/forecast/{query}             # Get 5-day forecast
GET  /api/weather/historical/{city}    # Get historical data
```

#### **History Endpoints**
```
GET  /api/history                      # Get personal history
GET  /api/logs/personal               # Get detailed personal logs
GET  /api/logs/global                 # Get global history (all users)
GET  /api/history/filter              # Filter history by date
```

#### **CRUD Endpoints**
```
PUT    /api/history/{record_id}       # Update note
DELETE /api/history/{record_id}       # Delete record
```

#### **Export Endpoints**
```
GET  /api/export/csv                  # Export as CSV
GET  /api/export/json                 # Export as JSON
GET  /api/export/markdown             # Export as Markdown
GET  /api/export/pdf                  # Export as PDF
GET  /api/export/xml                  # Export as XML
```

#### **Utility Endpoints**
```
GET  /api/location/validate           # Validate location with suggestions
GET  /api/stats                       # Get database statistics
GET  /                                # Health check
```

### **Example API Calls**

**Get Weather:**
```bash
curl "http://localhost:8000/api/weather/London?uid=client_123"
```

**Get Historical Weather:**
```bash
curl "http://localhost:8000/api/weather/historical/Paris?start_date=2024-01-01&end_date=2024-01-07&uid=client_123"
```

**Export as PDF:**
```bash
curl "http://localhost:8000/api/export/pdf?uid=client_123" --output weather_history.pdf
```

---

## 📁 Project Structure

```
weather-intelligence/
│
├── backend/
│   ├── main.py                 # FastAPI application (main-FINAL.py)
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment variables
│   └── README.md              # Backend documentation
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx       # Main page component (page-FINAL.tsx)
│   │   │   └── layout.tsx     # Root layout
│   │   └── utils/
│   │       └── api.ts         # API client (api-FINAL.ts)
│   │
│   ├── public/                # Static assets
│   ├── package.json           # Node dependencies
│   ├── tsconfig.json          # TypeScript config
│   ├── tailwind.config.js     # Tailwind config
│   ├── next.config.js         # Next.js config
│   └── .env.local             # Environment variables
│
├── README.md                  # This file
└── .gitignore                 # Git ignore rules
```

---

## 🎮 Features Walkthrough

### **1. Current Weather Search**
1. Enter city name, ZIP code, or coordinates in search bar
2. Click "Search" or press Enter
3. View current temperature, humidity, wind speed
4. See weather icon and description
5. Click "View on Maps" to see location on Google Maps

### **2. GPS Location Detection**
1. Click the GPS/Navigation button
2. Allow location access in browser
3. Weather automatically loads for your current location
4. City name detected and displayed

### **3. Historical Weather Analysis**
1. Click "Historical Data" tab
2. Enter location name
3. Select start date and end date (max 90 days)
4. Click "Get Historical Data"
5. View table with daily temperature, wind, and conditions
6. All data is REAL from Open-Meteo API

### **4. 5-Day Forecast**
1. After searching current weather
2. Scroll to "5-Day Forecast" section
3. View daily predictions with icons
4. See temperature and weather conditions
5. Hover over cards for animation effects

### **5. Search History**
1. Toggle between "My Searches" and "Everyone's Searches"
2. View all previous weather searches
3. Add/edit notes on any search
4. Delete unwanted records
5. Filter by date range

### **6. CRUD Operations**
- **Create:** Automatic on weather search
- **Read:** View in history table
- **Update:** Click edit icon, type note, click save
- **Delete:** Click delete icon, confirm

### **7. Data Export**
1. Click "Export Data" button in header
2. Choose format: CSV, JSON, Markdown, PDF, or XML
3. File downloads automatically
4. Open in appropriate application

### **8. Location Suggestions**
1. Start typing city name (minimum 3 characters)
2. See dropdown with suggestions
3. Click suggestion to auto-fill
4. Works with typos (e.g., "tokio" → "Tokyo")

---

## 🎨 Design Features

### **Responsive Breakpoints**
- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

### **Color Scheme**
- **Primary:** Blue (#3b82f6)
- **Secondary:** Indigo (#6366f1)
- **Accent:** Purple (#a855f7)
- **Success:** Green (#10b981)
- **Error:** Red (#ef4444)

### **Typography**
- **Font Family:** Inter (Google Fonts)
- **Font Weights:** 300, 400, 500, 600, 700, 800, 900

### **Animations**
- Slide-in on page load
- Hover effects on cards
- Loading spinners
- Smooth transitions

---

## 🔒 Security Features

### **Client-Based Data Isolation**
- Each browser gets unique client ID
- Stored in localStorage as `client_token`
- Format: `client_<timestamp>_<random>`
- All database queries filtered by client ID

### **Data Validation**
- Date range validation (start < end, max 90 days)
- Location validation with fuzzy matching
- Empty note prevention
- Client ID verification on all operations

### **API Security**
- CORS middleware configured
- Input sanitization
- Error handling without exposing internals
- Rate limiting ready (can be enabled)

---

## 🧪 Testing

### **Manual Testing Checklist**

✅ **Current Weather:**
- [ ] Search by city name
- [ ] Search by ZIP code
- [ ] Search by coordinates
- [ ] GPS location detection
- [ ] Error handling for invalid locations

✅ **Historical Weather:**
- [ ] Date range selection
- [ ] Data displays correctly
- [ ] Different cities show different data
- [ ] Date validation works

✅ **CRUD Operations:**
- [ ] Add note to weather record
- [ ] Edit existing note
- [ ] Delete weather record
- [ ] Cancel edit without saving

✅ **Data Export:**
- [ ] CSV download works
- [ ] JSON format correct
- [ ] PDF generates properly
- [ ] XML structure valid
- [ ] Markdown readable

✅ **Responsive Design:**
- [ ] Works on mobile (< 640px)
- [ ] Works on tablet (640-1024px)
- [ ] Works on desktop (> 1024px)
- [ ] Touch controls functional

---

## 🐛 Troubleshooting

### **Backend Issues**

**Problem:** `ModuleNotFoundError: No module named 'fastapi'`
```bash
Solution: pip install -r requirements.txt --break-system-packages
```

**Problem:** `pymongo.errors.ServerSelectionTimeoutError`
```bash
Solution: 
1. Check MongoDB is running: mongod --version
2. Verify MONGO_DETAILS in .env file
3. For Atlas: Check network access whitelist
```

**Problem:** `HTTPException: Weather service unavailable`
```bash
Solution:
1. Verify API_KEY in .env file
2. Check OpenWeatherMap API key is active
3. Test API key: curl "api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_KEY"
```

### **Frontend Issues**

**Problem:** `Error: Cannot find module 'axios'`
```bash
Solution: npm install
```

**Problem:** `Network Error` when calling backend
```bash
Solution:
1. Check backend is running on port 8000
2. Verify NEXT_PUBLIC_API_URL in .env.local
3. Check CORS settings in backend
```

**Problem:** `localStorage is not defined`
```bash
Solution: 
This error appears during SSR. It's handled in useEffect.
If persists, clear browser cache and restart dev server.
```

---

## 📊 Database Schema

### **Collection: weather_history**

```javascript
{
  _id: ObjectId,
  city: String,              // City name
  temp: Number,              // Temperature in Celsius
  description: String,       // Weather description
  humidity: Number,          // Humidity percentage
  wind_speed: Number,        // Wind speed in m/s
  icon: String,              // Weather icon code
  client_id: String,         // User's unique identifier
  note: String,              // User's note (optional)
  timestamp: Date            // Search timestamp
}
```

### **Indexes**
```javascript
// For faster queries
{ client_id: 1, timestamp: -1 }
{ city: 1, client_id: 1 }     // Unique compound index
```

---

## 🚀 Future Enhancements

### **Planned Features**
- [ ] User authentication (JWT)
- [ ] Favorite locations
- [ ] Weather alerts/notifications
- [ ] Weather maps overlay
- [ ] Hourly forecast (24 hours)
- [ ] Air quality index
- [ ] UV index information
- [ ] Sunrise/sunset times
- [ ] Mobile app (React Native)
- [ ] Dark mode toggle
- [ ] Multi-language support
- [ ] Weather comparisons (city vs city)
- [ ] Historical trends charts
- [ ] Weather widgets
- [ ] Email weather reports

### **Technical Improvements**
- [ ] Redis caching layer
- [ ] WebSocket for live updates
- [ ] GraphQL API
- [ ] Docker containerization
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline
- [ ] Automated testing (Jest, Pytest)
- [ ] Performance monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics dashboard

---

## 📄 License

This project was developed as a technical assessment for the **PM Accelerator Program**.

**Author:** Zeeshan Khan  
**Program:** Product Manager Accelerator  
**Date:** February 2025  
**Contact:** [Your Email]  
**LinkedIn:** [PM Accelerator](https://www.linkedin.com/company/product-manager-accelerator/)

---

## 🙏 Acknowledgments

- **PM Accelerator Program** - For the opportunity and guidance
- **OpenWeatherMap** - For comprehensive weather API
- **Open-Meteo** - For free historical weather data
- **FastAPI** - For the amazing Python framework
- **Next.js** - For the powerful React framework
- **MongoDB** - For flexible NoSQL database
- **Tailwind CSS** - For utility-first styling
- **Lucide Icons** - For beautiful icon library

---

## 📞 Support

For questions or issues related to this project:

1. **Check Documentation:** Review this README and API docs
2. **Review Code Comments:** Code is extensively documented
3. **Check Logs:** Backend logs show detailed error messages
4. **GitHub Issues:** (If repository is public)

---

## ⭐ About PM Accelerator

The **Product Manager Accelerator** is a premier program designed to help professionals transition into Product Management by providing hands-on experience, mentorship, and industry-recognized credentials.

**Learn More:** [PM Accelerator on LinkedIn](https://www.linkedin.com/company/product-manager-accelerator/)

---

**Built with ❤️ by Zeeshan Khan for PM Accelerator Technical Assessment**

---

## 🎯 Quick Start Summary

```bash
# 1. Clone repository
git clone <https://github.com/Dev-ZishanKhan/ai-weather-app >
cd ai-weather-app

# 2. Setup backend
cd backend
pip install -r requirements.txt --break-system-packages
# Create .env with MONGO_DETAILS and API_KEY
uvicorn main:app --reload

# 3. Setup frontend (new terminal)
cd frontend
npm install
# Create .env.local with NEXT_PUBLIC_API_URL
npm run dev

# 4. Open browser
# Frontend: http://localhost:3000
# Backend API Docs: http://localhost:8000/docs
```

**That's it! You're ready to go! 🚀**