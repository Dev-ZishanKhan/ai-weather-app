from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from datetime import datetime, time
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from bson import ObjectId
from io import StringIO
from fastapi.responses import StreamingResponse
import pandas as pd
from typing import Optional

load_dotenv()
MONGO_DETAILS = os.getenv("MONGO_DETAILS")
API_KEY = os.getenv("API_KEY")

app = FastAPI(title="Zeeshan Weather AI Backend - Professional Edition")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncIOMotorClient(MONGO_DETAILS)
database = client.weather_db
collection = database.weather_history

class NoteUpdate(BaseModel):
    note: str = Field(..., min_length=1, max_length=500)

# --- 2.1 CREATE & UPSERT (No Duplicates) ---
@app.get("/api/weather/{query}")
async def get_weather(query: str):
    query = query.strip()
    url = ""
    
    if "," in query:
        try:
            parts = query.split(",")
            lat, lon = float(parts[0]), float(parts[1])
            if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
                raise HTTPException(status_code=400, detail="Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.")
            url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid coordinate format. Please use: latitude, longitude (e.g., 40.7128, -74.0060)")
    elif query.isdigit():
        url = f"https://api.openweathermap.org/data/2.5/weather?zip={query}&appid={API_KEY}&units=metric"
    else:
        url = f"https://api.openweathermap.org/data/2.5/weather?q={query}&appid={API_KEY}&units=metric"

    async with httpx.AsyncClient() as http_client:
        try:
            response = await http_client.get(url, timeout=10.0)
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Location not found. Please check the spelling and try again.")
            elif response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Weather service temporarily unavailable. Please try again later.")
            
            data = response.json()
            
            weather_data = {
                "city": data["name"],
                "temp": data["main"]["temp"],
                "description": data["weather"][0]["description"],
                "humidity": data["main"]["humidity"],
                "wind_speed": data.get("wind", {}).get("speed", 0),
                "icon": data["weather"][0]["icon"],
                "timestamp": datetime.now()
            }
            
            # Upsert: Prevent duplicate cities
            await collection.update_one(
                {"city": data["name"]},
                {"$set": weather_data, "$setOnInsert": {"note": ""}},
                upsert=True
            )
            record = await collection.find_one({"city": data["name"]})
            record["_id"] = str(record["_id"])
            return record
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Weather service timeout. Please check your internet connection and try again.")
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Unable to connect to weather service. Please check your internet connection.")

# --- NEW: 2.1 READ with DATE RANGE FILTER ---
@app.get("/api/history/filter")
async def filter_history(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    city: Optional[str] = None
):
    query = {}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    
    if start_date and end_date:
        try:
            # Convert string to datetime objects
            start = datetime.combine(datetime.strptime(start_date, "%Y-%m-%d"), time.min)
            end = datetime.combine(datetime.strptime(end_date, "%Y-%m-%d"), time.max)
            query["timestamp"] = {"$gte": start, "$lte": end}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Please use YYYY-MM-DD format (e.g., 2024-01-15).")

    try:
        cursor = collection.find(query).sort("timestamp", -1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            doc["timestamp"] = doc["timestamp"].isoformat()
            results.append(doc)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unable to retrieve history. Please try again later.")

@app.get("/api/history")
async def get_history():
    try:
        cursor = collection.find().sort("timestamp", -1).limit(20)
        history = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if "timestamp" in doc: doc["timestamp"] = doc["timestamp"].isoformat()
            history.append(doc)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unable to load search history. Please refresh the page.")

# [UPDATE]
@app.put("/api/history/{record_id}")
async def update_note(record_id: str, update: NoteUpdate):
    if not ObjectId.is_valid(record_id): 
        raise HTTPException(status_code=400, detail="Invalid record ID format.")
    
    try:
        result = await collection.update_one({"_id": ObjectId(record_id)}, {"$set": {"note": update.note}})
        if result.matched_count == 0: 
            raise HTTPException(status_code=404, detail="Record not found. It may have been deleted.")
        return {"message": "Note updated successfully"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to update note. Please try again.")

# [DELETE]
@app.delete("/api/history/{record_id}")
async def delete_record(record_id: str):
    if not ObjectId.is_valid(record_id): 
        raise HTTPException(status_code=400, detail="Invalid record ID format.")
    
    try:
        result = await collection.delete_one({"_id": ObjectId(record_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Record not found. It may have already been deleted.")
        return {"message": "Record deleted successfully"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to delete record. Please try again.")

# [READ] 5-Day Forecast - FULLY FIXED for GPS/ZIP/CITY
@app.get("/api/forecast/{query}")
async def get_forecast(query: str):
    query = query.strip()
    url = ""
    
    if "," in query: # GPS Handling
        parts = query.split(",")
        url = f"https://api.openweathermap.org/data/2.5/forecast?lat={parts[0].strip()}&lon={parts[1].strip()}&appid={API_KEY}&units=metric"
    elif query.isdigit(): # Zip Handling
        url = f"https://api.openweathermap.org/data/2.5/forecast?zip={query}&appid={API_KEY}&units=metric"
    else: # City Name Handling
        url = f"https://api.openweathermap.org/data/2.5/forecast?q={query}&appid={API_KEY}&units=metric"

    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(url, timeout=10.0)
            if res.status_code == 404:
                raise HTTPException(status_code=404, detail="Forecast not available for this location.")
            elif res.status_code != 200:
                raise HTTPException(status_code=res.status_code, detail="Weather forecast service temporarily unavailable.")
            return res.json()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Forecast service timeout. Please try again.")
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Unable to connect to forecast service.")
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail="Unable to retrieve forecast data.")

# [EXPORT] Dynamic Data Export (Requirement 2.3)
@app.get("/api/export/{fmt}")
async def export_data(fmt: str):
    try:
        cursor = collection.find().sort("timestamp", -1)
        data = await cursor.to_list(length=None)
        if not data:
            raise HTTPException(status_code=404, detail="No data available to export. Search for locations first.")

        df = pd.DataFrame(data)
        df["_id"] = df["_id"].astype(str)
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"]).dt.strftime("%Y-%m-%d %H:%M:%S")

        if fmt == "json":
            content = df.to_json(orient="records", indent=4)
            media_type, filename = "application/json", "weather_history.json"
        elif fmt == "markdown":
            content = df.to_markdown(index=False)
            media_type, filename = "text/markdown", "weather_history.md"
        elif fmt == "csv":
            stream = StringIO()
            df.to_csv(stream, index=False)
            content, media_type, filename = stream.getvalue(), "text/csv", "weather_history.csv"
        else:
            raise HTTPException(status_code=400, detail="Invalid export format. Please choose csv, json, or markdown.")

        return StreamingResponse(
            iter([content]),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to export data. Please try again.")