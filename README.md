# 🛡️ Privacy Protection Suite - Unified Extension

A comprehensive Chrome extension that combines **Cookie Guard** and **Terms AI** into one powerful privacy protection tool.

## 🚀 Features

### Cookie Guard 🍪
- Real-time cookie monitoring and classification
- ML-powered tracking cookie detection
- Cookie blocking and management
- Privacy risk assessment

### Terms AI 📋
- Intelligent Terms & Conditions analysis
- AI-powered risk assessment
- Automatic summarization
- Multi-language support

## 🔧 Installation & Setup

### 1. Install the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked" and select this folder

### 2. Start the AI Backend
1. Double-click `start_backend.bat` 
2. Wait for the server to start (you'll see "🚀 Starting FastAPI server...")
3. Keep the terminal window open while using the extension

**Backend URL:** http://localhost:8000

### 3. Using the Extension
- Click the extension icon in Chrome toolbar
- Access both Cookie Guard and Terms AI from the unified popup
- Right-click on pages for quick analysis options

## 📁 Project Structure

```
unified-extension/
├── manifest.json              # Extension configuration
├── background-unified.js      # Unified service worker
├── start_backend.bat         # AI backend startup script
├── Backend/                  # AI server and models
│   ├── main_simple.py       # FastAPI server
│   └── models/              # Local AI models
├── popup/
│   ├── popup-unified.html   # Main interface
│   └── popup-unified.js     # Popup functionality
├── content-enhanced.js       # Cookie Guard content script
├── terms-content.js         # Terms AI content script
└── icons/                   # Extension icons
```

## 🔄 How It Works

### Cookie Guard
1. Monitors cookies as they're set
2. Uses ML classification to identify tracking cookies
3. Provides real-time blocking and management
4. Shows privacy risk scores

### Terms AI
1. Detects Terms & Conditions on web pages
2. Sends content to local AI backend for analysis
3. Provides intelligent summaries and risk assessments
4. No data sent to external servers - all processing is local

## 🛠️ Backend Requirements

The AI backend requires:
- Python 3.7+
- FastAPI
- Transformers
- Local AI models (included)

Dependencies are automatically installed by `start_backend.bat`.

## 🔐 Privacy

- **Cookie Guard**: All cookie analysis is done locally in the browser
- **Terms AI**: All AI processing is done on your local machine
- **No Data Collection**: No personal data is sent to external servers
- **Open Source**: All code is transparent and auditable

## 📊 API Endpoints

When backend is running on http://localhost:8000:

- `POST /analyze` - Analyze Terms & Conditions text
- `GET /` - Backend status check
- `GET /docs` - API documentation

## 🐛 Troubleshooting

### Backend Connection Issues
1. Ensure `start_backend.bat` is running
2. Check that port 8000 is not blocked
3. Verify Python is installed and accessible

### Extension Issues
1. Check Chrome extensions page for errors
2. Reload the extension if needed
3. Check browser console for error messages

### Terms AI Not Working
1. Verify backend is running at http://localhost:8000
2. Check backend terminal for error messages
3. Try restarting the backend

## 🎯 Quick Start

1. **Install Extension** → Load in Chrome developer mode
2. **Start Backend** → Run `start_backend.bat`
3. **Test Cookie Guard** → Visit any website and click extension icon
4. **Test Terms AI** → Go to a site with Terms & Conditions and analyze

## 📈 Version History

- **v1.0.0** - Initial unified release combining Cookie Guard and Terms AI

---

**Made with ❤️ for better privacy protection**