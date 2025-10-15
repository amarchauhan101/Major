@echo off
echo 🚀 Starting Cookie Guard Backend with Multilingual Support
echo.
echo 📍 Starting Python FastAPI Server...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check if required packages are installed
python -c "import fastapi, transformers, googletrans" >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing required packages...
    pip install fastapi uvicorn transformers torch googletrans==4.0.0rc1 beautifulsoup4 requests nltk
)

REM Navigate to backend directory
cd /d "%~dp0Backend"

REM Check if models exist
if not exist "models\risk_analyzer\pytorch_model.bin" (
    echo ❌ AI Models not found! Please ensure models are downloaded first.
    echo 💡 Run the model download script or check the setup instructions.
    pause
    exit /b 1
)

echo ✅ Starting FastAPI server with multilingual support...
echo 🌍 Supported languages: English, Hindi, Marathi, Bengali, Tamil, Telugu, and more!
echo.
echo 🔗 Server will be available at: http://localhost:8000
echo 📱 Extension popup supports language selection
echo.

REM Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause