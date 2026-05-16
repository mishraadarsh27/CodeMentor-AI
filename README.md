# CodeMentor AI

A complete production-ready full-stack AI web application. "CodeMentor AI" is an AI-powered Coding Mentor for Beginners. It provides AI-based code analysis, intelligent learning recommendations, and an interactive AI mentor chat, designed with a premium, modern UI inspired by Cursor AI and GitHub Copilot.

## Features
- **AI Code Analysis**: Instantly analyzes Python code for syntax errors, linting issues, and beginner mistakes using AST and Pylint.
- **Beginner-Friendly Feedback**: Powered by Groq API (`llama3-70b-8192`), the AI explains errors in simple, non-technical language.
- **Complexity Analyzer**: Detects Time and Space complexity.
- **Code Quality Score**: Rates code out of 100 based on readability and efficiency.
- **AI Chat Assistant**: A built-in chat panel to ask programming questions contextually.
- **Dark/Light Mode**: Smooth, animated theme switching.
- **Premium UI**: Glassmorphism, TailwindCSS-inspired styling, and Monaco Editor integration.

## Tech Stack
**Backend**: Python, FastAPI, SQLite, SQLAlchemy, Pydantic, Groq API, AST, Pylint
**Frontend**: HTML5, CSS3, JavaScript, TailwindCSS (CDN), Monaco Editor

## Setup Instructions

### Prerequisites
- Python 3.9+
- Groq API Key

### Installation

1. Clone or navigate to the repository directory:
   ```bash
   cd CodeMentorAI
   ```

2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On MacOS/Linux
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```

3. Configure Environment Variables:
   - Copy `.env.example` to `.env`
   - Add your `GROQ_API_KEY` to the `.env` file.

4. Run the application:
   ```bash
   uvicorn backend.main:app --reload
   ```

5. Open your browser and go to `http://localhost:8000`

## Deployment (Render-Ready)
To deploy this on Render:
1. Create a Web Service connected to your repository.
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Add the `GROQ_API_KEY` to Render's Environment Variables.
