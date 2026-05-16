import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.database.config import engine, Base
from backend.routes import analyze, chat, history

# Initialize DB
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CodeMentor AI API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, restrict to actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analyze.router, prefix="/api", tags=["analyze"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(history.router, prefix="/api", tags=["history"])

frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")

@app.get("/dashboard")
async def serve_dashboard():
    return FileResponse(os.path.join(frontend_path, "dashboard.html"))

@app.get("/login")
async def serve_login():
    return FileResponse(os.path.join(frontend_path, "login.html"))

@app.get("/signup")
async def serve_signup():
    return FileResponse(os.path.join(frontend_path, "signup.html"))

@app.get("/history")
async def serve_history_page():
    return FileResponse(os.path.join(frontend_path, "history.html"))

# Mount static frontend
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
else:
    print(f"Warning: Frontend directory not found at {frontend_path}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
