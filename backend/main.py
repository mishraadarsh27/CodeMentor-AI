import os
import sys
import asyncio
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi import Request
import traceback
from dotenv import load_dotenv

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from .database import engine, Base
from .routes import analyze, chat, history, auth_routes, projects, execute

load_dotenv()

# Initialize DB (Simple way for SQLite, for production use Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CodeMentor AI API",
    description="Production-grade AI Coding Mentor Platform",
    version="1.0.0"
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled Exception on {request.url.path}: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected internal server error occurred. Please try again later."}
    )

# CORS configuration
origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "CodeMentor AI"}

# Include routers
app.include_router(auth_routes.router, prefix="/api")
app.include_router(analyze.router, prefix="/api", tags=["analyze"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(history.router, prefix="/api", tags=["history"])
app.include_router(projects.router, prefix="/api", tags=["projects"])
app.include_router(execute.router, prefix="/api", tags=["execution"])

# Path to static frontend files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
frontend_path = os.path.join(BASE_DIR, "frontend")

# Route for specific pages to ensure they serve the correct HTML
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

@app.get("/ide")
async def serve_ide():
    return FileResponse(os.path.join(frontend_path, "ide.html"))

# Mount static frontend last so it doesn't shadow API routes
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
else:
    print(f"Warning: Frontend directory not found at {frontend_path}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
