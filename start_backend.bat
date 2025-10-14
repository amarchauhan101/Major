@echo off
echo 🌍 Starting Unified Extension Backend Server...
echo.

REM Navigate to backend directory
cd /d "%~dp0Backend"

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.7+ from https://python.org
    pause
    exit /b 1
)

echo ✅ Python found
echo.

REM Install requirements
echo 📚 Installing/updating requirements...
pip install --upgrade pip
pip install fastapi uvicorn transformers torch beautifulsoup4 requests nltk googletrans==4.0.0rc1 numpy

REM Download NLTK data
echo 📖 Downloading NLTK data...
python -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True)"

echo.
echo 🚀 Starting FastAPI server...
echo 📍 Server will be available at: http://localhost:8000
echo 🌐 Extension should connect automatically
echo.
echo ⚠️  Keep this window open while using the extension
echo 🛑 Press Ctrl+C to stop the server
echo.

REM Start the simple server (since that's what the extension expects)
python main_simple.py

echo.
echo 👋 Server stopped
pause