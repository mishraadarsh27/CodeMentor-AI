# CodeMentor AI 

A production-grade AI platform for developers. Built with FastAPI, Llama-3.3, and modern UI/UX principles.

## ✨ Features
- **Intelligent Analysis**: Real-time code auditing with Llama-3.3.
- **Resilient AI Engine**: Modular architecture with automatic retries and fallback logic.
- **Secure Auth**: JWT-based authentication with bcrypt password hashing.
- **Premium UX**: Skeleton loaders, rotating technical tips, and real-time AI status.
- **Docker Ready**: Production-ready containerization.

## 🛠️ Tech Stack
- **Backend**: FastAPI, SQLAlchemy, Pydantic, Groq SDK.
- **Frontend**: Vanilla JS, TailwindCSS, Monaco Editor.
- **Database**: SQLite (local) / PostgreSQL (production).
- **Deployment**: Docker, Docker Compose, Render.

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.11+
- [Groq API Key](https://console.groq.com/)

### 2. Local Setup
```bash
# Clone the repository
git clone https://github.com/mishraadarsh27/CodeMentor-AI.git
cd CodeMentor-AI

# Create virtual environment
python -m venv venv
source venv/bin/scripts/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Setup environment variables
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

### 3. Database Migrations
```bash
alembic upgrade head
```

### 4. Run the Application
```bash
uvicorn backend.main:app --reload
```
Visit [http://localhost:8000](http://localhost:8000)

## 🐳 Docker Instructions
```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 🧪 Testing
```bash
pytest
```

## 📁 Project Structure
```text
CodeMentorAI/
├── backend/
│   ├── ai_engine/      # AI Resilience Layer
│   ├── routes/         # API Endpoints
│   ├── database.py     # DB Config
│   ├── models.py       # DB Models
│   ├── auth.py         # JWT & Security
│   └── main.py         # App Entry Point
├── frontend/           # Static Files
├── alembic/            # DB Migrations
├── tests/              # Pytest Suite
├── Dockerfile          # Production Build
├── docker-compose.yml  # Local Dev Environment
└── requirements.txt    # Pinned Dependencies
```

## 🔑 Environment Variables
| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./codementor.db` |
| `GROQ_API_KEY` | Your Groq Cloud API Key | REQUIRED |
| `SECRET_KEY` | Used for JWT signing | `prod-secret-key` |
| `ALLOWED_ORIGINS`| CORS allowed domains | `*` |

## 📄 License
MIT
