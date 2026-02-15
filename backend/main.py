# ========================================
# WEATHER INTELLIGENCE API - COMPLETE BACKEND
# ========================================
# Full-stack weather application backend
# Author: Zeeshan Khan
# Program: PM Accelerator - Product Management Training
# 
# Features:
# - Current weather & 5-day forecast
# - Historical weather with date ranges
# - CRUD operations with MongoDB
# - Multi-format exports (CSV, JSON, Markdown, PDF, XML)
# - Global & personal history views
# - Fuzzy location matching
# - YouTube & Google Maps integration

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
import httpx
import os
from datetime import datetime, time, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, validator
from dotenv import load_dotenv
from bson import ObjectId
from io import StringIO, BytesIO
import pandas as pd
from typing import Optional, List
import xml.etree.ElementTree as ET
from xml.dom import minidom
from difflib import get_close_matches
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors

# ========================================
# CONFIGURATION & INITIALIZATION
# ========================================

load_dotenv()
MONGO_DETAILS = os.getenv("MONGO_DETAILS")
API_KEY = os.getenv("API_KEY")

app = FastAPI(
    title="Weather Intelligence API - Complete Edition",
    description="PM Accelerator Technical Assessment - Full Stack Weather Application",
    version="3.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
client = AsyncIOMotorClient(MONGO_DETAILS)
database = client.weather_db
collection = database.weather_history

# Known cities database for fuzzy matching - EXPANDED LIST
KNOWN_CITIES = [
    # USA
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
    "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
    "Fort Worth", "Columbus", "Charlotte", "San Francisco", "Indianapolis",
    "Seattle", "Denver", "Washington", "Boston", "El Paso", "Nashville",
    "Detroit", "Oklahoma City", "Portland", "Las Vegas", "Memphis", "Louisville",
    "Baltimore", "Milwaukee", "Albuquerque", "Tucson", "Fresno", "Sacramento",
    "Kansas City", "Mesa", "Atlanta", "Omaha", "Colorado Springs", "Raleigh",
    "Miami", "Long Beach", "Virginia Beach", "Oakland", "Minneapolis", "Tampa",
    "Tulsa", "Arlington", "New Orleans",
    
    # Europe
    "London", "Paris", "Berlin", "Madrid", "Rome", "Barcelona", "Vienna",
    "Amsterdam", "Prague", "Budapest", "Warsaw", "Brussels", "Munich",
    "Milan", "Hamburg", "Stockholm", "Copenhagen", "Oslo", "Helsinki",
    "Dublin", "Zurich", "Geneva", "Athens", "Lisbon", "Porto", "Manchester",
    "Edinburgh", "Glasgow", "Birmingham", "Liverpool", "Leeds", "Sheffield",
    "Frankfurt", "Cologne", "Stuttgart", "Dusseldorf", "Leipzig", "Dresden",
    "Marseille", "Lyon", "Toulouse", "Nice", "Naples", "Turin", "Venice",
    "Florence", "Valencia", "Seville", "Bilbao", "Rotterdam", "The Hague",
    
    # Asia
    "Tokyo", "Beijing", "Shanghai", "Mumbai", "Delhi", "Bangalore", "Hyderabad",
    "Chennai", "Kolkata", "Pune", "Ahmedabad", "Seoul", "Bangkok", "Singapore",
    "Hong Kong", "Dubai", "Abu Dhabi", "Riyadh", "Jeddah", "Tehran", "Istanbul",
    "Ankara", "Manila", "Jakarta", "Kuala Lumpur", "Taipei", "Osaka", "Kyoto",
    "Hanoi", "Ho Chi Minh City", "Karachi", "Lahore", "Islamabad", "Rawalpindi",
    "Faisalabad", "Multan", "Peshawar", "Quetta", "Dhaka", "Chittagong",
    "Kathmandu", "Colombo", "Kabul", "Tashkent", "Almaty",
    
    # Middle East
    "Jerusalem", "Tel Aviv", "Amman", "Beirut", "Damascus", "Baghdad",
    "Kuwait City", "Doha", "Manama", "Muscat", "Sana'a", "Erbil",
    
    # Africa
    "Cairo", "Lagos", "Johannesburg", "Cape Town", "Nairobi", "Addis Ababa",
    "Casablanca", "Algiers", "Tunis", "Accra", "Dar es Salaam", "Kampala",
    "Khartoum", "Luanda", "Kinshasa", "Dakar", "Abidjan", "Alexandria",
    
    # Oceania
    "Sydney", "Melbourne", "Brisbane", "Perth", "Auckland", "Wellington",
    "Adelaide", "Gold Coast", "Canberra", "Hobart", "Darwin",
    
    # South America
    "São Paulo", "Rio de Janeiro", "Buenos Aires", "Lima", "Bogotá",
    "Santiago", "Caracas", "Montevideo", "Quito", "La Paz", "Brasilia",
    "Medellin", "Cali", "Guadalajara", "Monterrey", "Mexico City",
    
    # Canada
    "Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa",
    "Winnipeg", "Quebec City", "Hamilton", "Halifax"
]

# ========================================
# PYDANTIC MODELS
# ========================================

class NoteUpdate(BaseModel):
    """Model for updating notes on weather records"""
    note: str = Field(..., min_length=1, max_length=500, description="Note text (1-500 characters)")
    
    @validator('note')
    def validate_note_content(cls, v):
        """Ensure note is not empty or whitespace only"""
        if not v or not v.strip():
            raise ValueError("Note cannot be empty or contain only whitespace")
        return v.strip()

class DateRangeQuery(BaseModel):
    """Model for date range weather queries"""
    city: str = Field(..., min_length=1, description="City name or location")
    start_date: str = Field(..., description="Start date (YYYY-MM-DD)")
    end_date: str = Field(..., description="End date (YYYY-MM-DD)")
    
    @validator('start_date', 'end_date')
    def validate_date_format(cls, v):
        """Validate date format is YYYY-MM-DD"""
        try:
            datetime.strptime(v, "%Y-%m-%d")
            return v
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format (e.g., 2024-01-15)")
    
    @validator('end_date')
    def validate_date_range(cls, v, values):
        """Ensure end date is after start date"""
        if 'start_date' in values:
            start = datetime.strptime(values['start_date'], "%Y-%m-%d")
            end = datetime.strptime(v, "%Y-%m-%d")
            
            if end < start:
                raise ValueError("End date must be after start date")
            
            # Limit range to 90 days for performance
            if (end - start).days > 90:
                raise ValueError("Date range cannot exceed 90 days")
            
            # Don't allow future dates beyond 5 days
            if end > datetime.now() + timedelta(days=5):
                raise ValueError("Cannot query weather data more than 5 days in the future")
        
        return v

# ========================================
# UTILITY FUNCTIONS
# ========================================

def validate_client_id(uid: Optional[str]) -> str:
    """
    Validate and sanitize client ID
    
    Args:
        uid: Client identifier from request
        
    Returns:
        Cleaned client ID string
        
    Raises:
        HTTPException: If client ID is missing or invalid
    """
    if not uid or uid.strip() == "":
        raise HTTPException(
            status_code=401, 
            detail="Unauthorized: Client ID is required for this operation"
        )
    return uid.strip()

def fuzzy_match_location(query: str, threshold: float = 0.5) -> List[str]:
    """
    Find close matches for misspelled city names
    IMPROVED: Better algorithm with case-insensitive matching
    
    Examples:
    - "new yrok" → "New York"
    - "tokio" → "Tokyo"
    - "paris" → "Paris"
    - "mumbi" → "Mumbai"
    - "rawalpindi" → "Rawalpindi"
    
    Args:
        query: User's location input
        threshold: Similarity threshold (0-1) - lowered to 0.5 for better matches
        
    Returns:
        List of suggested city names (max 5)
    """
    if not query or len(query) < 2:
        return []
    
    query_lower = query.lower()
    
    # 1. First try exact match (case insensitive)
    for city in KNOWN_CITIES:
        if city.lower() == query_lower:
            return [city]
    
    # 2. Try starts with match (high priority)
    starts_with = [city for city in KNOWN_CITIES if city.lower().startswith(query_lower)]
    if starts_with:
        return starts_with[:5]
    
    # 3. Try contains match (medium priority)
    contains = [city for city in KNOWN_CITIES if query_lower in city.lower()]
    if contains:
        return contains[:5]
    
    # 4. Fuzzy matching with get_close_matches (for typos)
    matches = get_close_matches(query, KNOWN_CITIES, n=10, cutoff=threshold)
    
    # 5. If no matches with current threshold, try lower threshold
    if not matches and threshold > 0.3:
        matches = get_close_matches(query, KNOWN_CITIES, n=10, cutoff=0.3)
    
    return matches[:5]  # Return top 5 matches

def create_pdf_export(data: pd.DataFrame) -> bytes:
    """
    Generate PDF export of weather data
    NEW FEATURE: PDF export as required by documentation
    
    Args:
        data: Pandas DataFrame with weather records
        
    Returns:
        PDF file as bytes
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=30,
        alignment=1  # Center
    )
    title = Paragraph("Weather Search History Report", title_style)
    elements.append(title)
    elements.append(Spacer(1, 0.3*inch))
    
    # Metadata
    meta_style = styles['Normal']
    meta_text = f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}<br/>Total Records: {len(data)}"
    elements.append(Paragraph(meta_text, meta_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Prepare table data
    table_data = [['City', 'Temperature (°C)', 'Humidity (%)', 'Wind (m/s)', 'Date']]
    
    for _, row in data.iterrows():
        table_data.append([
            str(row.get('city', 'N/A')),
            f"{row.get('temp', 0):.1f}",
            str(row.get('humidity', 'N/A')),
            f"{row.get('wind_speed', 0):.1f}",
            str(row.get('timestamp', 'N/A'))[:10] if 'timestamp' in row else 'N/A'
        ])
    
    # Create table
    table = Table(table_data, colWidths=[2*inch, 1.2*inch, 1*inch, 1*inch, 1.5*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Footer
    footer_text = "Weather Intelligence System | PM Accelerator Program"
    footer = Paragraph(footer_text, meta_style)
    elements.append(footer)
    
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

def create_xml_export(data: pd.DataFrame) -> str:
    """
    Generate XML export of weather data
    NEW FEATURE: XML export as required by documentation
    
    Args:
        data: Pandas DataFrame with weather records
        
    Returns:
        Formatted XML string
    """
    root = ET.Element("weather_history")
    root.set("generated", datetime.now().isoformat())
    root.set("total_records", str(len(data)))
    
    for _, row in data.iterrows():
        record = ET.SubElement(root, "record")
        
        for col in data.columns:
            if col != '_id' and col != 'client_id':  # Exclude internal fields
                elem = ET.SubElement(record, col)
                elem.text = str(row[col]) if pd.notna(row[col]) else ""
    
    # Pretty print XML
    xml_str = minidom.parseString(ET.tostring(root)).toprettyxml(indent="  ")
    return xml_str

# ========================================
# WEATHER API ENDPOINTS
# ========================================

@app.get("/api/weather/{query}")
async def get_weather(
    query: str, 
    uid: str = Query(..., description="Client unique identifier")
):
    """
    Fetch current weather and save to database
    
    Supports three query formats:
    - City name: "London"
    - Zip code: "10001"  
    - Coordinates: "40.7128, -74.0060"
    
    Implements fuzzy matching for city names
    """
    validated_uid = validate_client_id(uid)
    query = query.strip()
    
    # Fuzzy matching for city names
    if not "," in query and not query.isdigit():
        suggestions = fuzzy_match_location(query)
        if suggestions and suggestions[0].lower() != query.lower():
            # If we have a better match, suggest it
            if len(suggestions) > 0:
                query = suggestions[0]  # Use best match
    
    # Build API URL based on query type
    url = ""
    if "," in query:
        try:
            parts = query.split(",")
            lat, lon = float(parts[0]), float(parts[1])
            
            if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
                raise HTTPException(
                    status_code=400, 
                    detail="Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180."
                )
            url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail="Invalid coordinate format. Use: latitude, longitude (e.g., 40.7128, -74.0060)"
            )
    elif query.isdigit():
        url = f"https://api.openweathermap.org/data/2.5/weather?zip={query}&appid={API_KEY}&units=metric"
    else:
        url = f"https://api.openweathermap.org/data/2.5/weather?q={query}&appid={API_KEY}&units=metric"

    async with httpx.AsyncClient() as http_client:
        try:
            response = await http_client.get(url, timeout=10.0)
            
            if response.status_code == 404:
                # Suggest alternatives
                suggestions = fuzzy_match_location(query)
                suggestion_text = f" Did you mean: {', '.join(suggestions[:3])}?" if suggestions else ""
                raise HTTPException(
                    status_code=404, 
                    detail=f"Location '{query}' not found.{suggestion_text}"
                )
            elif response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code, 
                    detail="Weather service temporarily unavailable. Please try again later."
                )
            
            data = response.json()
            
            weather_data = {
                "city": data["name"],
                "temp": data["main"]["temp"],
                "description": data["weather"][0]["description"],
                "client_id": validated_uid,
                "humidity": data["main"]["humidity"],
                "wind_speed": data.get("wind", {}).get("speed", 0),
                "icon": data["weather"][0]["icon"],
                "timestamp": datetime.now()
            }
            
            # Upsert to prevent duplicates
            await collection.update_one(
                {"city": data["name"], "client_id": validated_uid},
                {"$set": weather_data, "$setOnInsert": {"note": ""}},
                upsert=True
            )
            
            record = await collection.find_one({
                "city": data["name"], 
                "client_id": validated_uid
            })
            
            if record:
                record["_id"] = str(record["_id"])
                return record
            else:
                raise HTTPException(status_code=500, detail="Failed to save weather data")
                
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=504, 
                detail="Weather service timeout. Check your internet connection and try again."
            )
        except httpx.RequestError:
            raise HTTPException(
                status_code=503, 
                detail="Unable to connect to weather service. Check your internet connection."
            )

@app.get("/api/forecast/{query}")
async def get_forecast(query: str):
    """
    Fetch 5-day weather forecast
    Returns hourly predictions at 3-hour intervals
    """
    query = query.strip()
    url = ""
    
    if "," in query:
        parts = query.split(",")
        url = f"https://api.openweathermap.org/data/2.5/forecast?lat={parts[0].strip()}&lon={parts[1].strip()}&appid={API_KEY}&units=metric"
    elif query.isdigit():
        url = f"https://api.openweathermap.org/data/2.5/forecast?zip={query}&appid={API_KEY}&units=metric"
    else:
        url = f"https://api.openweathermap.org/data/2.5/forecast?q={query}&appid={API_KEY}&units=metric"

    async with httpx.AsyncClient() as http_client:
        try:
            res = await http_client.get(url, timeout=10.0)
            
            if res.status_code == 404:
                raise HTTPException(
                    status_code=404, 
                    detail="Forecast not available for this location."
                )
            elif res.status_code != 200:
                raise HTTPException(
                    status_code=res.status_code, 
                    detail="Weather forecast service temporarily unavailable."
                )
            return res.json()
            
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Forecast service timeout.")
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Unable to connect to forecast service.")

@app.get("/api/weather/historical/{city}")
async def get_historical_weather(
    city: str,
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    uid: str = Query(..., description="Client unique identifier")
):
    """
    NEW FEATURE: Get REAL historical weather data for a date range
    Uses Open-Meteo API (FREE) for actual historical weather data
    Required by documentation: "Allow user(s) to enter both a location and a date range"
    
    Note: This is READ-ONLY - does not save to history
    """
    validated_uid = validate_client_id(uid)
    
    # Validate dates using Pydantic model
    try:
        date_query = DateRangeQuery(
            city=city,
            start_date=start_date,
            end_date=end_date
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # First, get coordinates for the city using OpenWeatherMap Geocoding API
    geocode_url = f"http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={API_KEY}"
    
    async with httpx.AsyncClient() as http_client:
        try:
            geo_response = await http_client.get(geocode_url, timeout=10.0)
            if geo_response.status_code != 200 or not geo_response.json():
                raise HTTPException(
                    status_code=404,
                    detail=f"Location '{city}' not found. Please check spelling."
                )
            
            geo_data = geo_response.json()[0]
            lat = geo_data['lat']
            lon = geo_data['lon']
            actual_city_name = geo_data['name']
            
            # Now get REAL historical weather data from Open-Meteo API (FREE!)
            # Open-Meteo provides actual historical weather data at no cost
            historical_url = (
                f"https://archive-api.open-meteo.com/v1/archive?"
                f"latitude={lat}&longitude={lon}"
                f"&start_date={start_date}&end_date={end_date}"
                f"&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,"
                f"precipitation_sum,windspeed_10m_max,weathercode"
                f"&timezone=auto"
            )
            
            hist_response = await http_client.get(historical_url, timeout=15.0)
            
            if hist_response.status_code != 200:
                raise HTTPException(
                    status_code=503,
                    detail="Historical weather service temporarily unavailable"
                )
            
            hist_data = hist_response.json()
            
            # Weather code to description mapping (WMO codes)
            weather_descriptions = {
                0: "Clear sky",
                1: "Mainly clear",
                2: "Partly cloudy",
                3: "Overcast",
                45: "Foggy",
                48: "Depositing rime fog",
                51: "Light drizzle",
                53: "Moderate drizzle",
                55: "Dense drizzle",
                61: "Slight rain",
                63: "Moderate rain",
                65: "Heavy rain",
                71: "Slight snow",
                73: "Moderate snow",
                75: "Heavy snow",
                77: "Snow grains",
                80: "Slight rain showers",
                81: "Moderate rain showers",
                82: "Violent rain showers",
                85: "Slight snow showers",
                86: "Heavy snow showers",
                95: "Thunderstorm",
                96: "Thunderstorm with slight hail",
                99: "Thunderstorm with heavy hail"
            }
            
            # Format the response data
            historical_data = []
            daily = hist_data.get('daily', {})
            dates = daily.get('time', [])
            
            for i, date in enumerate(dates):
                temp_max = daily['temperature_2m_max'][i] if daily.get('temperature_2m_max') else None
                temp_min = daily['temperature_2m_min'][i] if daily.get('temperature_2m_min') else None
                temp_mean = daily['temperature_2m_mean'][i] if daily.get('temperature_2m_mean') else None
                precipitation = daily['precipitation_sum'][i] if daily.get('precipitation_sum') else 0
                wind_speed = daily['windspeed_10m_max'][i] if daily.get('windspeed_10m_max') else 0
                weather_code = daily['weathercode'][i] if daily.get('weathercode') else 0
                
                # Get weather description
                description = weather_descriptions.get(weather_code, "Unknown")
                
                # Add precipitation info to description if significant
                if precipitation > 0:
                    description += f" ({precipitation}mm rain)"
                
                historical_data.append({
                    "date": date,
                    "city": actual_city_name,
                    "temp_avg": round(temp_mean, 1) if temp_mean is not None else "N/A",
                    "temp_min": round(temp_min, 1) if temp_min is not None else "N/A",
                    "temp_max": round(temp_max, 1) if temp_max is not None else "N/A",
                    "precipitation": round(precipitation, 1),
                    "description": description,
                    "wind_speed": round(wind_speed, 1)
                })
            
            return {
                "city": actual_city_name,
                "start_date": start_date,
                "end_date": end_date,
                "records": historical_data,
                "source": "Open-Meteo Historical Weather API"
            }
            
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=504,
                detail="Request timeout. Please try again."
            )
        except httpx.RequestError:
            raise HTTPException(
                status_code=503,
                detail="Unable to connect to weather services. Check your internet."
            )
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch historical data: {str(e)}"
            )

# ========================================
# LOCATION VALIDATION
# ========================================

@app.get("/api/location/validate")
async def validate_location(query: str = Query(..., description="Location to validate")):
    """
    NEW FEATURE: Validate location and provide suggestions
    Implements fuzzy matching as per documentation
    Example: "New Yrok" → suggests "New York"
    """
    suggestions = fuzzy_match_location(query, threshold=0.5)
    
    return {
        "query": query,
        "valid": len(suggestions) > 0,
        "suggestions": suggestions[:5],
        "best_match": suggestions[0] if suggestions else None
    }

# ========================================
# HISTORY ENDPOINTS
# ========================================

@app.get("/api/logs/personal")
async def fetch_personalized_logs(
    uid: str = Query(..., description="Client unique identifier")
):
    """
    Get user's personal search history
    Returns only records created by this client
    """
    validated_uid = validate_client_id(uid)
    
    try:
        cursor = collection.find({"client_id": validated_uid}).sort("timestamp", -1).limit(100)
        logs = await cursor.to_list(length=100)
        
        for log in logs:
            log["_id"] = str(log["_id"])
            if "timestamp" in log:
                log["timestamp"] = log["timestamp"].isoformat()
        return logs
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unable to load personalized logs")

@app.get("/api/logs/global")
async def fetch_global_logs():
    """
    NEW FEATURE: Get global history (all users)
    Required by documentation: "Allow users to read weather information 
    (or even what others have entered). Row level security is not necessary."
    
    Returns all users' searches for collaborative exploration
    """
    try:
        cursor = collection.find({}).sort("timestamp", -1).limit(200)
        logs = await cursor.to_list(length=200)
        
        for log in logs:
            log["_id"] = str(log["_id"])
            if "timestamp" in log:
                log["timestamp"] = log["timestamp"].isoformat()
            # Keep client_id visible to show it's from different users
        
        return logs
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unable to load global logs")

@app.get("/api/history")
async def get_history(
    uid: str = Query(..., description="Client unique identifier")
):
    """
    Get user's recent search history (20 records)
    """
    validated_uid = validate_client_id(uid)
    
    try:
        cursor = collection.find({"client_id": validated_uid}).sort("timestamp", -1).limit(20)
        history = []
        
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if "timestamp" in doc:
                doc["timestamp"] = doc["timestamp"].isoformat()
            history.append(doc)
        return history
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unable to load history")

@app.get("/api/history/filter")
async def filter_history(
    uid: str = Query(..., description="Client unique identifier"),
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None
):
    """
    Filter history by date range
    """
    validated_uid = validate_client_id(uid)
    query = {"client_id": validated_uid}
    
    if start_date and end_date:
        try:
            start = datetime.combine(
                datetime.strptime(start_date, "%Y-%m-%d"), 
                time.min
            )
            end = datetime.combine(
                datetime.strptime(end_date, "%Y-%m-%d"), 
                time.max
            )
            
            # Validate date range
            if end < start:
                raise HTTPException(
                    status_code=400,
                    detail="End date must be after start date"
                )
            
            query["timestamp"] = {"$gte": start, "$lte": end}
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail="Invalid date format. Use YYYY-MM-DD (e.g., 2024-01-15)"
            )

    try:
        cursor = collection.find(query).sort("timestamp", -1)
        results = []
        
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            doc["timestamp"] = doc["timestamp"].isoformat()
            results.append(doc)
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unable to retrieve history")

# ========================================
# CRUD OPERATIONS
# ========================================

@app.put("/api/history/{record_id}")
async def update_note(
    record_id: str, 
    update: NoteUpdate,
    uid: str = Query(..., description="Client unique identifier")
):
    """
    Update note for a history record
    Validates note is not empty
    """
    validated_uid = validate_client_id(uid)
    
    if not ObjectId.is_valid(record_id): 
        raise HTTPException(status_code=400, detail="Invalid record ID format")
    
    cleaned_note = update.note.strip()
    if not cleaned_note:
        raise HTTPException(
            status_code=400, 
            detail="Note cannot be empty. Please enter text or cancel"
        )
    
    try:
        result = await collection.update_one(
            {"_id": ObjectId(record_id), "client_id": validated_uid},
            {"$set": {"note": cleaned_note}}
        )
        
        if result.matched_count == 0: 
            raise HTTPException(
                status_code=404, 
                detail="Record not found or you don't have permission to edit it"
            )
        return {"message": "Note updated successfully"}
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to update note")

@app.delete("/api/history/{record_id}")
async def delete_record(
    record_id: str,
    uid: str = Query(..., description="Client unique identifier")
):
    """
    Delete a history record
    Only allows deletion of user's own records
    """
    validated_uid = validate_client_id(uid)
    
    if not ObjectId.is_valid(record_id): 
        raise HTTPException(status_code=400, detail="Invalid record ID format")
    
    try:
        result = await collection.delete_one({
            "_id": ObjectId(record_id),
            "client_id": validated_uid
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404, 
                detail="Record not found or you don't have permission to delete it"
            )
        return {"message": "Record deleted successfully"}
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to delete record")

# ========================================
# EXPORT ENDPOINTS - COMPLETE SUITE
# ========================================

@app.get("/api/export/{fmt}")
async def export_data(
    fmt: str,
    uid: str = Query(..., description="Client unique identifier")
):
    """
    COMPLETE EXPORT FEATURE: Export data in multiple formats
    Supports: CSV, JSON, Markdown, PDF, XML (as required by documentation)
    
    Documentation requirement: "Allow users to export data from the database 
    into JSON, XML, CSV (delimited), PDF, Markdown output format(s)"
    """
    validated_uid = validate_client_id(uid)
    fmt = fmt.lower()
    
    # Validate format
    valid_formats = ['csv', 'json', 'markdown', 'pdf', 'xml']
    if fmt not in valid_formats:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid format '{fmt}'. Supported: {', '.join(valid_formats)}"
        )
    
    try:
        cursor = collection.find({"client_id": validated_uid}).sort("timestamp", -1)
        data = await cursor.to_list(length=None)
        
        if not data:
            raise HTTPException(
                status_code=404, 
                detail="No data to export. Search for locations first"
            )

        df = pd.DataFrame(data)
        df["_id"] = df["_id"].astype(str)
        
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"]).dt.strftime("%Y-%m-%d %H:%M:%S")
        
        # Remove sensitive fields
        if "client_id" in df.columns:
            df = df.drop(columns=["client_id"])

        # Generate export based on format
        if fmt == "json":
            content = df.to_json(orient="records", indent=4)
            media_type = "application/json"
            filename = "weather_history.json"
            
        elif fmt == "markdown":
            content = df.to_markdown(index=False)
            media_type = "text/markdown"
            filename = "weather_history.md"
            
        elif fmt == "csv":
            stream = StringIO()
            df.to_csv(stream, index=False)
            content = stream.getvalue()
            media_type = "text/csv"
            filename = "weather_history.csv"
            
        elif fmt == "pdf":
            # NEW: PDF export
            content = create_pdf_export(df)
            return Response(
                content=content,
                media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=weather_history.pdf"}
            )
            
        elif fmt == "xml":
            # NEW: XML export
            content = create_xml_export(df)
            media_type = "application/xml"
            filename = "weather_history.xml"

        return StreamingResponse(
            iter([content]),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

# ========================================
# HEALTH CHECK & INFO
# ========================================

@app.get("/")
async def root():
    """
    API health check and information endpoint
    """
    return {
        "status": "healthy",
        "application": "Weather Intelligence System",
        "version": "3.0.0",
        "author": "Zeeshan Khan",
        "program": "PM Accelerator - Product Management Training",
        "description": "Full-stack weather application with advanced features",
        "features": [
            "Current weather & 5-day forecast",
            "Historical weather with date ranges",
            "CRUD operations (Create, Read, Update, Delete)",
            "Multi-format exports (CSV, JSON, Markdown, PDF, XML)",
            "Global & personal history views",
            "Fuzzy location matching",
            "YouTube & Google Maps integration"
        ],
        "security": "Client ID based data isolation with optional global view",
        "documentation": "PM Accelerator Technical Assessment - Complete Implementation"
    }

@app.get("/api/stats")
async def get_statistics():
    """
    Get database statistics
    """
    try:
        total_records = await collection.count_documents({})
        unique_cities = await collection.distinct("city")
        
        return {
            "total_searches": total_records,
            "unique_locations": len(unique_cities),
            "cities": unique_cities[:20]  # Top 20
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unable to fetch statistics")