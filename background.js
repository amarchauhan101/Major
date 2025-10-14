// ============================================================
// 🔒 Privacy Lens - Background Service Worker
// ============================================================
// Handles cookie management, TOS analysis, and communication
// between content scripts, popup, and backend API

console.log('🚀 Privacy Lens Background Service Worker Starting...');

// ============================================================
// 📋 Configuration & Constants
// ============================================================

const CONFIG = {
    BACKEND_URL: 'http://localhost:8000',
    CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
    MAX_ANALYSES: 50,
    COOKIE_ANALYSIS_INTERVAL: 5000, // 5 seconds
    HEALTH_CHECK_INTERVAL: 30000 // 30 seconds
};

// ============================================================
// 🗄️ State Management
// ============================================================

class StateManager {
    constructor() {
        this.isProcessing = false;
        this.analysisCache = new Map();
        this.cookiePredictionMap = null;
        this.backendHealth = false;
        this.lastHealthCheck = 0;
    }

    async initialize() {
        try {
            await this.loadCookiePredictionMap();
            await this.checkBackendHealth();
            this.startHealthCheckInterval();
            console.log('✅ State Manager initialized successfully');
        } catch (error) {
            console.error('❌ State Manager initialization failed:', error);
        }
    }

    async loadCookiePredictionMap() {
        try {
            const response = await fetch(chrome.runtime.getURL('cookie_prediction_map.json'));
            this.cookiePredictionMap = await response.json();
            console.log(`✅ Loaded cookie prediction map with ${Object.keys(this.cookiePredictionMap).length} entries`);
        } catch (error) {
            console.warn('⚠️ Using fallback cookie prediction map');
            this.cookiePredictionMap = this.getFallbackPredictionMap();
        }
    }

    getFallbackPredictionMap() {
        return {
            "_ga": "Analytics",
            "_gid": "Analytics", 
            "_fbp": "Marketing",
            "_gcl_au": "Marketing",
            "session": "Essential",
            "auth": "Essential",
            "login": "Essential",
            "csrf": "Essential",
            "cart": "Essential",
            "preferences": "Essential"
        };
    }

    async checkBackendHealth() {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/health`, {
                method: 'GET',
                timeout: 5000
            });
            this.backendHealth = response.ok;
            this.lastHealthCheck = Date.now();
            
            if (this.backendHealth) {
                console.log('✅ Backend is healthy');
            } else {
                console.warn('⚠️ Backend health check failed');
            }
        } catch (error) {
            this.backendHealth = false;
            this.lastHealthCheck = Date.now();
            console.warn('⚠️ Backend is not accessible:', error.message);
        }
    }

    startHealthCheckInterval() {
        setInterval(() => {
            this.checkBackendHealth();
        }, CONFIG.HEALTH_CHECK_INTERVAL);
    }

    isBackendHealthy() {
        const timeSinceLastCheck = Date.now() - this.lastHealthCheck;
        return this.backendHealth && timeSinceLastCheck < CONFIG.HEALTH_CHECK_INTERVAL * 2;
    }
}

// ============================================================
// 🍪 Cookie Management System
// ============================================================

class CookieManager {
    constructor(stateManager) {
        this.state = stateManager;
    }

    async scanCookies(url) {
        try {
            console.log('🔍 Scanning cookies for:', url);
            
            const domain = new URL(url).hostname;
            const cookies = await chrome.cookies.getAll({ domain: domain });
            
            console.log(`📊 Found ${cookies.length} cookies for domain: ${domain}`);
            
            const analyzedCookies = cookies.map(cookie => this.analyzeCookie(cookie));
            
            // Store results
            await this.storeCookieResults(analyzedCookies, url);
            
            return {
                success: true,
                cookies: analyzedCookies,
                domain: domain,
                totalCount: cookies.length,
                essentialCount: analyzedCookies.filter(c => c.isEssential).length,
                nonEssentialCount: analyzedCookies.filter(c => !c.isEssential).length
            };
            
        } catch (error) {
            console.error('❌ Cookie scan failed:', error);
            return {
                success: false,
                error: error.message,
                cookies: [],
                domain: new URL(url).hostname
            };
        }
    }

    analyzeCookie(cookie) {
        const prediction = this.state.cookiePredictionMap[cookie.name] || 'Unknown';
        const isEssential = this.isEssentialCookie(cookie, prediction);
        const riskLevel = this.calculateRiskLevel(cookie, prediction);
        
        return {
            name: cookie.name,
            domain: cookie.domain,
            value: cookie.value.substring(0, 50) + (cookie.value.length > 50 ? '...' : ''),
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            sameSite: cookie.sameSite,
            expirationDate: cookie.expirationDate,
            isThirdParty: this.isThirdPartyCookie(cookie),
            isEssential: isEssential,
            purpose: prediction,
            riskLevel: riskLevel,
            category: this.categorizeCookie(prediction)
        };
    }

    isEssentialCookie(cookie, prediction) {
        const essentialPatterns = [
            'session', 'auth', 'login', 'token', 'csrf', 'security',
            'user', 'account', 'preference', 'language', 'theme',
            'cart', 'checkout', 'payment', 'order', 'essential'
        ];
        
        const cookieName = cookie.name.toLowerCase();
        const predictionLower = prediction.toLowerCase();
        
        // Check if cookie name matches essential patterns
        if (essentialPatterns.some(pattern => cookieName.includes(pattern))) {
            return true;
        }
        
        // Check if prediction indicates essential
        if (predictionLower === 'essential') {
            return true;
        }
        
        // Check if it's a session cookie (no expiration)
        if (!cookie.expirationDate) {
            return true;
        }
        
        // Check if it's a first-party cookie for essential functionality
        if (!cookie.name.includes('_ga') && 
            !cookie.name.includes('_gid') && 
            !cookie.name.includes('_fb') &&
            !cookie.name.includes('analytics') &&
            !cookie.name.includes('tracking') &&
            !cookie.name.includes('marketing') &&
            !cookie.name.includes('advertising')) {
            return true;
        }
        
        return false;
    }

    isThirdPartyCookie(cookie) {
        // Simplified third-party detection
        return cookie.name.includes('_ga') || 
               cookie.name.includes('_gid') || 
               cookie.name.includes('_fb') ||
               cookie.name.includes('doubleclick') ||
               cookie.name.includes('google-analytics');
    }

    calculateRiskLevel(cookie, prediction) {
        const highRiskPatterns = ['tracking', 'marketing', 'advertising', 'analytics'];
        const mediumRiskPatterns = ['preference', 'functional', 'performance'];
        
        const predictionLower = prediction.toLowerCase();
        
        if (highRiskPatterns.some(pattern => predictionLower.includes(pattern))) {
            return 'High';
        }
        
        if (mediumRiskPatterns.some(pattern => predictionLower.includes(pattern))) {
            return 'Medium';
        }
        
        return 'Low';
    }

    categorizeCookie(prediction) {
        const categoryMap = {
            'Analytics': 'Analytics',
            'Marketing': 'Marketing',
            'Essential': 'Essential',
            'Functional': 'Functional',
            'Performance': 'Performance',
            'Unknown': 'Other'
        };
        
        return categoryMap[prediction] || 'Other';
    }

    async acceptEssentialOnly(url) {
        try {
            console.log('🍪 Accepting essential cookies only for:', url);
            
            const domain = new URL(url).hostname;
            const cookies = await chrome.cookies.getAll({ domain: domain });
            
            let removedCount = 0;
            let essentialCount = 0;
            
            for (const cookie of cookies) {
                const analyzed = this.analyzeCookie(cookie);
                
                if (analyzed.isEssential) {
                    essentialCount++;
                    console.log(`✅ Keeping essential cookie: ${cookie.name}`);
                } else {
                    try {
                        const removeUrl = `https://${cookie.domain}${cookie.path}`;
                        await chrome.cookies.remove({
                            url: removeUrl,
                            name: cookie.name
                        });
                        removedCount++;
                        console.log(`🗑️ Removed non-essential cookie: ${cookie.name}`);
                    } catch (error) {
                        console.warn(`Failed to remove cookie ${cookie.name}:`, error);
                    }
                }
            }
            
            console.log(`✅ Cookie cleanup complete: ${removedCount} removed, ${essentialCount} kept`);
            
            return {
                success: true,
                removedCount,
                essentialCount,
                totalCookies: cookies.length,
                domain: domain
            };
            
        } catch (error) {
            console.error('❌ Error accepting essential cookies:', error);
            throw error;
        }
    }

    async acceptAllCookies() {
        try {
            console.log('🍪 Accepting all cookies');
            
            // Store user preference
            await chrome.storage.local.set({
                cookiePreference: 'accept_all',
                timestamp: Date.now()
            });
            
            return {
                success: true,
                message: 'All cookies accepted',
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error('❌ Error accepting all cookies:', error);
            throw error;
        }
    }

    async updateCookieSetting(cookieName, cookieDomain, isAllowed) {
        try {
            console.log(`🍪 Updating cookie setting: ${cookieName} = ${isAllowed}`);
            
            if (!isAllowed) {
                // Remove the cookie
                try {
                    await chrome.cookies.remove({
                        url: `https://${cookieDomain}`,
                        name: cookieName
                    });
                    console.log(`✅ Removed cookie: ${cookieName}`);
                } catch (error) {
                    console.warn(`Failed to remove cookie ${cookieName}:`, error);
                }
            }
            
            // Store user preference
            const preferences = await chrome.storage.local.get(['cookiePreferences']) || {};
            const cookiePreferences = preferences.cookiePreferences || {};
            cookiePreferences[`${cookieDomain}:${cookieName}`] = isAllowed;
            
            await chrome.storage.local.set({
                cookiePreferences: cookiePreferences,
                timestamp: Date.now()
            });
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Error updating cookie setting:', error);
            throw error;
        }
    }

    async storeCookieResults(cookies, url) {
        try {
            const result = {
                url: url,
                domain: new URL(url).hostname,
                cookies: cookies,
                timestamp: Date.now(),
                totalCount: cookies.length,
                essentialCount: cookies.filter(c => c.isEssential).length,
                nonEssentialCount: cookies.filter(c => !c.isEssential).length
            };
            
            await chrome.storage.local.set({
                lastCookieAnalysis: result,
                cookieReport: cookies
            });
            
            console.log('✅ Cookie results stored successfully');
        } catch (error) {
            console.error('❌ Failed to store cookie results:', error);
        }
    }
}

// ============================================================
// 🤖 TOS Analysis System
// ============================================================

class TOSAnalyzer {
    constructor(stateManager) {
        this.state = stateManager;
    }

    async analyzeContent(content, url, language = 'en') {
        try {
            console.log('🔍 Starting TOS analysis...');
            
            if (!this.state.isBackendHealthy()) {
                throw new Error('Backend server is not running. Please start it with: python main_simple.py');
            }
            
            if (!content || content.length < 100) {
                throw new Error('Insufficient content for analysis. Please provide substantial text.');
            }
            
            console.log(`📄 Analyzing content (${content.length} characters) from: ${url}`);
            
            // Check cache first
            const cacheKey = this.generateCacheKey(content + language);
            if (this.state.analysisCache.has(cacheKey)) {
                console.log('📋 Using cached analysis');
                const cachedResult = this.state.analysisCache.get(cacheKey);
                await this.storeAnalysis(cachedResult, url);
                return { success: true, data: cachedResult };
            }
            
            // Call backend API
            const response = await fetch(`${CONFIG.BACKEND_URL}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: content,
                    url: url,
                    language: language
                })
            });

            if (!response.ok) {
                throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Backend analysis failed');
            }
            
            console.log('✅ TOS analysis completed successfully');
            
            // Cache and store result
            this.state.analysisCache.set(cacheKey, result.data);
            await this.storeAnalysis(result.data, url);
            
            // Show notification
            this.showNotification(result.data.risk_analysis.risk_level, url);
            
            return { success: true, data: result.data };
            
        } catch (error) {
            console.error('❌ TOS analysis failed:', error);
            return { success: false, error: error.message };
        }
    }

    generateCacheKey(content) {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    async storeAnalysis(analysisData, url) {
        try {
            const result = await chrome.storage.local.get(['analyses']);
            const analyses = result.analyses || [];
            
            const newAnalysis = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                url: url,
                domain: new URL(url).hostname,
                summary: analysisData.summary,
                risk_analysis: analysisData.risk_analysis,
                structured_analysis: analysisData.summary?.structured_analysis || {}
            };
            
            analyses.push(newAnalysis);
            
            // Keep only last N analyses
            if (analyses.length > CONFIG.MAX_ANALYSES) {
                analyses.splice(0, analyses.length - CONFIG.MAX_ANALYSES);
            }
            
            await chrome.storage.local.set({ 
                analyses: analyses,
                lastTermsAnalysis: newAnalysis
            });
            
            console.log('✅ Analysis stored successfully');
        } catch (error) {
            console.error('❌ Failed to store analysis:', error);
        }
    }

    showNotification(riskLevel, url) {
        const domain = new URL(url).hostname;
        
        const notifications = {
            'HIGH': {
                title: '⚠️ High Privacy Risk Detected',
                message: `${domain} has high-risk privacy practices. Review the analysis for details.`,
                iconUrl: 'icons/icon48.png'
            },
            'MEDIUM': {
                title: '⚡ Medium Privacy Risk',
                message: `${domain} has some privacy concerns. Check the analysis for details.`,
                iconUrl: 'icons/icon48.png'
            },
            'LOW': {
                title: '✅ Low Privacy Risk',
                message: `${domain} appears to have reasonable privacy practices.`,
                iconUrl: 'icons/icon48.png'
            }
        };
        
        const notification = notifications[riskLevel] || notifications['MEDIUM'];
        
        chrome.notifications.create({
            type: 'basic',
            iconUrl: notification.iconUrl,
            title: notification.title,
            message: notification.message
        });
    }
}

// ============================================================
// 🔄 Message Handler
// ============================================================

class MessageHandler {
    constructor(stateManager, cookieManager, tosAnalyzer) {
        this.state = stateManager;
        this.cookieManager = cookieManager;
        this.tosAnalyzer = tosAnalyzer;
    }

    async handleMessage(request, sender, sendResponse) {
        console.log('📨 Received message:', request.action);
        
        try {
            switch (request.action) {
                // Cookie Management
                case 'scanCookies':
                    const cookieResult = await this.cookieManager.scanCookies(request.url);
                    sendResponse(cookieResult);
                    break;
                    
                case 'acceptEssentialCookies':
                    const essentialResult = await this.cookieManager.acceptEssentialOnly(request.url);
                    sendResponse(essentialResult);
                    break;
                    
                case 'acceptAllCookies':
                    const allResult = await this.cookieManager.acceptAllCookies();
                    sendResponse(allResult);
                    break;
                    
                case 'updateCookieSetting':
                    const updateResult = await this.cookieManager.updateCookieSetting(
                        request.cookieName, 
                        request.cookieDomain, 
                        request.isAllowed
                    );
                    sendResponse(updateResult);
                    break;
                
                // TOS Analysis
                case 'analyze_content':
                    if (this.state.isProcessing) {
                        sendResponse({ 
                            success: false, 
                            error: 'Analysis already in progress. Please wait.' 
                        });
                        return;
                    }
                    
                    this.state.isProcessing = true;
                    try {
                        const analysisResult = await this.tosAnalyzer.analyzeContent(
                            request.content, 
                            request.url, 
                            request.language
                        );
                        sendResponse(analysisResult);
                    } finally {
                        this.state.isProcessing = false;
                    }
                    break;
                
                // Health Check
                case 'checkBackendHealth':
                    await this.state.checkBackendHealth();
                    sendResponse({ 
                        success: true, 
                        healthy: this.state.isBackendHealthy() 
                    });
                    break;
                
                // Data Retrieval
                case 'getAnalysisData':
                    const analysisData = await chrome.storage.local.get(['analyses', 'lastTermsAnalysis']);
                    sendResponse({ 
                        success: true, 
                        data: analysisData 
                    });
                    break;
                    
                case 'getCookieData':
                    const cookieData = await chrome.storage.local.get(['lastCookieAnalysis', 'cookieReport']);
                    sendResponse({ 
                        success: true, 
                        data: cookieData 
                    });
                    break;
                
                // Clear Cache
                case 'clearCache':
                    await chrome.storage.local.clear();
                    this.state.analysisCache.clear();
                    sendResponse({ success: true });
                    break;
                
                default:
                    sendResponse({ 
                        success: false, 
                        error: `Unknown action: ${request.action}` 
                    });
            }
        } catch (error) {
            console.error('❌ Message handling error:', error);
            sendResponse({ 
                success: false, 
                error: error.message 
            });
        }
    }
}

// ============================================================
// 🚀 Initialization
// ============================================================

const stateManager = new StateManager();
const cookieManager = new CookieManager(stateManager);
const tosAnalyzer = new TOSAnalyzer(stateManager);
const messageHandler = new MessageHandler(stateManager, cookieManager, tosAnalyzer);

// Initialize the extension
stateManager.initialize().then(() => {
    console.log('✅ Privacy Lens Background Service Worker Ready');
});

// Set up message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    messageHandler.handleMessage(request, sender, sendResponse);
    return true; // Keep message channel open for async responses
});

// Set up context menus
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'analyzePrivacy',
        title: '🔍 Analyze Privacy',
        contexts: ['page']
    });
    
    chrome.contextMenus.create({
        id: 'scanCookies',
        title: '🍪 Scan Cookies',
        contexts: ['page']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case 'analyzePrivacy':
            chrome.tabs.sendMessage(tab.id, { action: 'extractTOSContent' });
            break;
        case 'scanCookies':
            chrome.tabs.sendMessage(tab.id, { action: 'scanCookies' });
            break;
    }
});

// Keep service worker alive
setInterval(() => {
    console.log('💓 Privacy Lens heartbeat');
}, 30000);

console.log('✅ Privacy Lens Background Service Worker Loaded');