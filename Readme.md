🌦️ AI Weather Dashboard - Tech Assessment
Developed by: Zeeshan Khan (AI Engineer)
Role: AI Engineer Intern Candidate

📖 What I Did
I built a professional Full-Stack Weather Dashboard that covers both Frontend (#1) and Backend (#2) assessments.

Persistence (MongoDB): Implemented a complete CRUD system for search history.

Date Range Filtering: Built a custom history filter to retrieve temperatures within specific dates.

API Orchestration: Integrated real-time weather data with Google Maps (location visual) and YouTube (city exploration).

Data Export: Developed a multi-format export tool (CSV, JSON, Markdown).

Responsive UX: Created a mobile-friendly interface with advanced error handling and data validation.

🛠️ How to Run
1. Prerequisites
Ensure you have Node.js and Python 3.10+ installed. You will need an OpenWeatherMap API Key and a MongoDB connection string.

2. Backend Setup (FastAPI)
Navigate to the folder: cd backend

Install dependencies: pip install -r requirements.txt

Create a .env file and add your credentials:

Code snippet
MONGO_DETAILS=your_mongodb_uri
API_KEY=your_openweather_api_key
Start the server: uvicorn main:app --reload

3. Frontend Setup (Next.js)
Navigate to the folder: cd frontend

Install packages: npm install

Launch the dashboard: npm run dev

Open your browser at: http://localhost:3000

🏢 About PM Accelerator
The Product Manager Accelerator is a premier program designed to help professionals transition into Product Management by providing hands-on experience and mentorship.