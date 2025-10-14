# Privacy Protection Suite - Cookie Guard + Terms AI

A unified Chrome extension that combines the full functionality of both Cookie Guard and Terms AI extensions into one powerful privacy protection tool.

## 🚀 Features

### 🍪 Cookie Guard (Fully Integrated)
- **AI-Powered Cookie Classification**: Intelligent categorization of cookies
- **Real-time Cookie Analysis**: Instant cookie detection and risk assessment
- **Advanced Cookie Management**: Block, accept, or customize cookie preferences
- **Privacy Protection**: Automated tracking cookie blocking
- **Beautiful Visualizations**: Enhanced UI with detailed cookie information

### 📋 Terms AI (Fully Integrated)  
- **Intelligent Terms Analysis**: AI-powered analysis of Terms & Conditions
- **Smart Summarization**: Get plain English summaries of complex legal documents
- **Risk Assessment**: Identify potentially problematic clauses
- **Multi-language Support**: Analysis in 12+ languages
- **Visual Analytics**: Comprehensive charts and insights

### 🛡️ Unified Experience
- **Single Extension**: Get both tools in one installation
- **Unified Popup**: Easy access to both Cookie Guard and Terms AI
- **Combined Analysis**: Run full privacy analysis with both tools
- **Seamless Integration**: Both extensions work together perfectly
- **No Conflicts**: Designed to avoid any interference between functionalities

## 📦 Installation

### Quick Setup
1. **Download the Extension**: Clone or download this repository
2. **Start AI Server** (for Terms AI functionality):
   ```bash
   cd Backend
   python main.py
   ```
3. **Load Extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the `unified-extension` folder
   - Extension ready to use! ✅

## 🎯 How to Use

### Main Popup Interface
When you click the extension icon, you'll see a unified popup with three options:

#### 🍪 Cookie Guard Section
- **"Open Cookie Guard"**: Opens the full Cookie Guard interface in a new popup window
- **"Quick Scan"**: Performs instant cookie analysis on current page
- **Full Cookie Management**: Access all Cookie Guard features exactly as before

#### 📋 Terms AI Section  
- **"Open Terms AI"**: Opens the full Terms AI interface in a new popup window
- **"Quick Analysis"**: Performs instant terms analysis on current page
- **Full Terms Analysis**: Access all Terms AI features exactly as before

#### 🚀 Combined Actions
- **"Full Privacy Analysis"**: Runs both cookie scan and terms analysis simultaneously
- **Status Dashboard**: See real-time stats from both tools
- **Unified Privacy Score**: Combined privacy assessment

### Individual Extension Access
Each extension maintains its **full original functionality**:

1. **Cookie Guard**: Click "Open Cookie Guard" for the complete cookie management interface
2. **Terms AI**: Click "Open Terms AI" for the complete terms analysis interface
3. **Original Features**: Every button, feature, and capability from both extensions is preserved

## 🔧 Technical Details

### Architecture
- **Unified Background Script**: Handles both cookie and terms functionality
- **Dual Content Scripts**: Separate scripts for cookie detection and terms analysis
- **Independent Popups**: Each extension opens in its own dedicated popup window
- **Shared Resources**: Common icons, styles, and utilities
- **No Interference**: Both extensions operate independently while sharing the same installation

### File Structure
```
unified-extension/
├── manifest.json                 # Unified manifest with both sets of permissions
├── background-unified.js         # Combined background script
├── content-enhanced.js           # Cookie Guard content script (unchanged)
├── terms-content.js             # Terms AI content script (unchanged)
├── popup/
│   ├── popup-unified.html       # Main unified popup
│   ├── popup-unified.js         # Unified popup controller
│   ├── popup.html              # Original Cookie Guard popup (unchanged)
│   ├── popup.js                # Original Cookie Guard popup JS (unchanged)
│   └── terms/
│       ├── popup.html          # Original Terms AI popup (unchanged)
│       ├── popup.js            # Original Terms AI popup JS (unchanged)
│       └── styles.css          # Original Terms AI styles (unchanged)
├── Backend/                     # Terms AI backend (unchanged)
├── ml-training/                 # Cookie Guard ML models (unchanged)
├── icons/                       # Combined icons
└── [other original files]       # All original files preserved
```

### Preserved Functionality
✅ **Cookie Guard**: 100% original functionality preserved  
✅ **Terms AI**: 100% original functionality preserved  
✅ **All Features**: Every button, option, and capability works exactly as before  
✅ **No Changes**: Original code remains untouched  
✅ **No Conflicts**: Extensions don't interfere with each other  

## 🛠️ Prerequisites

### For Terms AI Features
- **Python 3.7+**: Required for AI server
- **Dependencies**: Flask, transformers, torch
- **AI Server**: Must be running at `http://localhost:8000`

### Installation Commands
```bash
# Navigate to Backend folder
cd Backend

# Install dependencies
pip install flask flask-cors transformers torch

# Start AI server
python main.py
```

### For Cookie Guard Features
- **No Additional Setup**: Works immediately after extension installation
- **ML Models**: Included in the extension
- **No External Dependencies**: Fully self-contained

## 🎮 Usage Examples

### Scenario 1: Cookie Management
1. Visit any website
2. Click the extension icon
3. Click "Open Cookie Guard" 
4. Use exactly as you would the standalone Cookie Guard extension
5. All original features available: scan, block, manage, visualize

### Scenario 2: Terms Analysis
1. Visit a website with Terms & Conditions
2. Click the extension icon  
3. Click "Open Terms AI"
4. Use exactly as you would the standalone Terms AI extension
5. All original features available: analyze, summarize, translate, export

### Scenario 3: Combined Privacy Analysis
1. Visit any website
2. Click the extension icon
3. Click "Full Privacy Analysis"
4. Get comprehensive privacy assessment using both tools
5. View combined results and statistics

## 🔍 Benefits of Unified Extension

### For Users
- **Single Installation**: Get both tools with one download
- **Unified Interface**: Easy access to both functionalities
- **Combined Analysis**: Run both tools together for comprehensive privacy assessment
- **No Conflicts**: Extensions work together seamlessly
- **Space Saving**: One extension instead of two

### For Developers
- **Code Preservation**: Original code remains unchanged
- **Modular Design**: Extensions can be updated independently
- **Clean Architecture**: Clear separation of concerns
- **Easy Maintenance**: Each extension maintains its own logic

## 🚀 Advanced Features

### Unified Privacy Dashboard
- **Combined Statistics**: See data from both extensions
- **Privacy Score**: Calculated using both cookie and terms analysis
- **Historical Data**: Track privacy improvements over time
- **Export Options**: Download combined privacy reports

### Context Menu Integration
- **Right-click Cookie Analysis**: Analyze cookies from context menu
- **Right-click Terms Analysis**: Analyze terms from context menu
- **Quick Actions**: Fast access to common features

### Keyboard Shortcuts
- **Cookie Scan**: Trigger cookie analysis
- **Terms Analysis**: Trigger terms analysis  
- **Full Analysis**: Run both analyses

## 🛡️ Privacy & Security

### Data Protection
- **Local Processing**: All analysis happens locally
- **No External APIs**: Terms AI uses local server only
- **User Control**: Complete control over data and privacy settings
- **Transparent Operation**: Open source with visible processing

### Security Features
- **Secure Communication**: Safe messaging between extension components
- **Isolated Processing**: Extensions don't interfere with each other
- **Permission Control**: Only requests necessary permissions
- **Safe Defaults**: Privacy-first configuration

## 📋 Troubleshooting

### Common Issues

**Extension Not Loading**
- Check that all files are present in the unified-extension folder
- Ensure manifest.json is valid
- Try reloading the extension in Chrome

**Cookie Guard Not Working**
- Refresh the page and try again
- Check browser console for errors
- Ensure page has cookies to analyze

**Terms AI Not Working**  
- Ensure AI server is running: `python Backend/main.py`
- Check that server is accessible at `http://localhost:8000`
- Verify Python dependencies are installed

**Both Extensions Conflicting**
- This shouldn't happen - extensions are designed to work together
- If issues occur, try reloading the extension
- Check browser console for error messages

### Debug Steps
1. **Check Extension Status**: Go to `chrome://extensions/` and verify extension is active
2. **Check Console**: Look for errors in browser developer tools
3. **Test Individual Features**: Try Cookie Guard and Terms AI separately
4. **Restart Browser**: Sometimes helps with extension issues

## 🔄 Updates & Maintenance

### Updating Cookie Guard Features
- Modify files in the cookie-guard section
- Original functionality remains untouched
- Test both extensions after updates

### Updating Terms AI Features  
- Modify files in the terms-ai section
- Backend updates require server restart
- Test both extensions after updates

### Updating Unified Interface
- Modify `popup-unified.html` and `popup-unified.js`
- Ensure both individual popups continue working
- Test combined functionality

## 📞 Support

### Getting Help
- **Documentation**: Read this README thoroughly
- **Issues**: Check troubleshooting section first
- **Testing**: Try individual extensions separately if issues occur

### Reporting Bugs
- **Specify Component**: Cookie Guard, Terms AI, or Unified Interface
- **Include Steps**: How to reproduce the issue
- **Browser Info**: Chrome version and OS
- **Console Logs**: Any error messages

## 🏆 Success Metrics

### Verification That Unified Extension Works
✅ **Cookie Guard Opens**: Clicking "Open Cookie Guard" opens original popup  
✅ **Terms AI Opens**: Clicking "Open Terms AI" opens original popup  
✅ **All Features Work**: Every original feature functions exactly as before  
✅ **No Conflicts**: Both extensions work simultaneously without issues  
✅ **Combined Analysis**: Full privacy analysis runs both tools successfully  
✅ **Status Updates**: Unified popup shows real-time data from both extensions  

### Performance
- **Fast Loading**: Extension loads quickly with all components
- **Responsive UI**: Both individual and unified interfaces respond smoothly  
- **Memory Efficient**: No significant memory increase compared to running both separately
- **Resource Sharing**: Efficient use of shared resources and permissions

---

## 🎉 Conclusion

This unified extension provides the **best of both worlds** - complete Cookie Guard functionality and full Terms AI capabilities in a single, easy-to-use package. Users get comprehensive privacy protection without sacrificing any features from either original extension.

**Key Achievement**: Successfully combined two complex extensions while preserving 100% of their original functionality and providing an enhanced unified experience.
