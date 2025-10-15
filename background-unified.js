// Unified Extension - Cookie Guard + Terms AI
// This script combines both extensions while preserving their original functionality

console.log('🚀 Unified Extension: Cookie Guard + Terms AI loaded');

// Backend Configuration
const BACKEND_URL = 'http://localhost:8000';

// Cookie Guard Variables and Initialization
let cookiePredictionMap = null;

// Load prediction map at startup
fetch(chrome.runtime.getURL("cookie_prediction_map.json"))
  .then((res) => res.json())
  .then((data) => {
    cookiePredictionMap = data;
    console.log("✅ Loaded cookie prediction map with", Object.keys(data).length, "entries");
  })
  .catch((err) => {
    console.error("❌ Failed to load prediction map:", err);
    // Fallback prediction map
    cookiePredictionMap = {
      "_ga": "Analytics",
      "_gid": "Analytics", 
      "_fbp": "Marketing",
      "sessionid": "Session",
      "authToken": "Authentication",
      "csrftoken": "Security",
      "ads_user": "Marketing"
    };
  });

// Cookie Guard Functions
function aiClassifyCookie(name, domain) {
  const lowered = name.toLowerCase();

  // 1. Exact match from trained model
  if (cookiePredictionMap?.[name]) {
    console.log("🎯 AI HIT (exact):", name, "=>", cookiePredictionMap[name]);
    return inferRiskAndPurpose(cookiePredictionMap[name]);
  }

  // 2. Partial match with smart matching
  const matchedKey = Object.keys(cookiePredictionMap || {}).find(key =>
    lowered.includes(key.toLowerCase()) || key.toLowerCase().includes(lowered)
  );
  if (matchedKey) {
    console.log("🎯 AI HIT (partial):", name, "=>", cookiePredictionMap[matchedKey]);
    return inferRiskAndPurpose(cookiePredictionMap[matchedKey]);
  }

  // 3. Pattern-based classification
  return classifyByPattern(name, domain);
}

function classifyByPattern(name, domain) {
  const n = name.toLowerCase();
  const d = domain.toLowerCase();

  // Analytics patterns
  if (n.includes("ga") || n.includes("gid") || n.includes("gtag") || 
      n.includes("analytics") || n.includes("_utm") || n.includes("gtm")) {
    return { purpose: "Analytics", riskLevel: "Medium" };
  }

  // Marketing/Advertising patterns
  if (n.includes("fbp") || n.includes("ad") || n.includes("marketing") || 
      n.includes("track") || n.includes("campaign") || n.includes("doubleclick")) {
    return { purpose: "Marketing", riskLevel: "High" };
  }

  // Session management patterns
  if (n.includes("sess") || n.includes("phpsessid") || n.includes("jsessionid")) {
    return { purpose: "Session Management", riskLevel: "Low" };
  }

  // Authentication patterns
  if (n.includes("auth") || n.includes("token") || n.includes("login") || 
      n.includes("user") || n.includes("account")) {
    return { purpose: "Authentication", riskLevel: "Low" };
  }

  // Security patterns
  if (n.includes("csrf") || n.includes("xsrf") || n.includes("security") || 
      n.includes("secure")) {
    return { purpose: "Security", riskLevel: "Low" };
  }

  // Shopping patterns
  if (n.includes("cart") || n.includes("basket") || n.includes("shop") || 
      n.includes("order") || n.includes("checkout")) {
    return { purpose: "Shopping Cart", riskLevel: "Low" };
  }

  // Performance patterns
  if (n.includes("perf") || n.includes("speed") || n.includes("load") || 
      n.includes("timing")) {
    return { purpose: "Performance", riskLevel: "Low" };
  }

  // Social media patterns
  if (d.includes("facebook") || d.includes("twitter") || d.includes("linkedin") || 
      d.includes("instagram") || n.includes("social")) {
    return { purpose: "Social Media", riskLevel: "Medium" };
  }

  // Third-party tracking
  if (d.includes("google") && !n.includes("auth") && !n.includes("session")) {
    return { purpose: "Third-Party Tracking", riskLevel: "High" };
  }

  return { purpose: "Functional", riskLevel: "Low" };
}

function inferRiskAndPurpose(purpose) {
  const purposeLower = purpose.toLowerCase();
  
  let riskLevel = "Low";
  if (purposeLower.includes("marketing") || purposeLower.includes("advertising") || 
      purposeLower.includes("tracking")) {
    riskLevel = "High";
  } else if (purposeLower.includes("analytics") || purposeLower.includes("social")) {
    riskLevel = "Medium";
  }

  return { purpose, riskLevel };
}

function isEssentialCookie(name, purpose) {
  const nameLower = name.toLowerCase();
  const purposeLower = purpose?.toLowerCase() || "";
  
  // Definitely non-essential patterns
  const nonEssentialPatterns = [
    "_ga", "_gid", "_gat", "_fbp", "gclid", "doubleclick", "_utm"
  ];
  if (nonEssentialPatterns.some(p => nameLower.includes(p))) return false;

  // Purpose-based classification
  if (purposeLower.includes("marketing") || purposeLower.includes("advertising") || 
      purposeLower.includes("analytics") || purposeLower.includes("tracking")) {
    return false;
  }

  // Essential patterns
  const essentialPatterns = [
    "session", "auth", "token", "csrf", "xsrf", "basket", "cart", 
    "userid", "login", "secure", "phpsessid", "jsessionid"
  ];
  if (essentialPatterns.some(p => nameLower.includes(p))) return true;

  // Purpose-based essential
  if (purposeLower.includes("session") || purposeLower.includes("authentication") || 
      purposeLower.includes("security") || purposeLower.includes("functional")) {
    return true;
  }

  return false;
}

// Enhanced message routing for both extensions
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Unified Extension received message:', request);
    
    // Handle cookie-related messages
    if (request.action && (
        request.action.includes('cookie') || 
        request.action === 'scanCookies' ||
        request.action === 'classifyCookie' ||
        request.action === 'blockTrackingCookies'
    )) {
        console.log('🍪 Handling Cookie Guard functionality');
        handleCookieGuard(request, sender, sendResponse);
        return true;
    }
    
    // Route terms-related messages  
    if (request.action && (
        request.action.includes('terms') ||
        request.action.includes('analyze') ||
        request.action === 'analyzeTerms' ||
        request.action === 'quickSummary' ||
        request.action === 'check_backend_status' ||
        request.action === 'analyze_content' ||
        request.action === 'get_analysis_data' ||
        request.action === 'clear_cache'
    )) {
        console.log('📋 Routing to Terms AI functionality');
        handleTermsAI(request, sender, sendResponse);
        return true;
    }
    
    // Handle unified extension actions
    if (request.action === 'getExtensionInfo') {
        sendResponse({
            success: true,
            extensions: ['Cookie Guard', 'Terms AI'],
            version: '1.0.0'
        });
        return true;
    }
    
    return true;
});

// Cookie Guard Message Handler
async function handleCookieGuard(request, sender, sendResponse) {
    console.log("📨 Received cookie message:", request.action);

    // Ping test
    if (request.action === "ping") {
        sendResponse({ status: "pong", timestamp: Date.now() });
        return;
    }

    // Enhanced cookie scanning
    if (request.action === "scanCookies") {
        console.log("🔍 Starting enhanced cookie scan for:", request.url);
        
        if (!request.url) {
            console.error("❌ No URL provided for cookie scan");
            sendResponse({ error: "No URL provided" });
            return;
        }
        
        chrome.cookies.getAll({ url: request.url }, (cookies) => {
            console.log(`📊 Found ${cookies.length} cookies to analyze`);
            
            if (chrome.runtime.lastError) {
                console.error("❌ Error getting cookies:", chrome.runtime.lastError);
                sendResponse({ error: chrome.runtime.lastError });
                return;
            }

            if (!cookies || cookies.length === 0) {
                console.log("ℹ️ No cookies found for this URL");
                sendResponse({ success: true, count: 0 });
                
                // Send empty report to popup
                chrome.runtime.sendMessage({
                    action: "showCookieReport",
                    cookies: [],
                    stats: {
                        total: 0,
                        essential: 0,
                        thirdParty: 0,
                        high: 0,
                        medium: 0,
                        low: 0
                    }
                });
                return;
            }

            const currentHost = new URL(request.url).hostname;
            
            const classified = cookies.map((cookie) => {
                const isThirdParty = !cookie.domain.replace(/^\./, '').includes(currentHost.replace(/^www\./, ''));
                const classification = aiClassifyCookie(cookie.name, cookie.domain);
                const isEssential = isEssentialCookie(cookie.name, classification.purpose);
                
                return {
                    name: cookie.name,
                    domain: cookie.domain,
                    purpose: classification.purpose,
                    riskLevel: classification.riskLevel,
                    isThirdParty,
                    isEssential,
                    value: cookie.value?.substring(0, 50) + (cookie.value?.length > 50 ? '...' : ''),
                    secure: cookie.secure,
                    httpOnly: cookie.httpOnly,
                    expires: cookie.expirationDate ? new Date(cookie.expirationDate * 1000).toLocaleDateString() : 'Session',
                    path: cookie.path
                };
            });

            // Sort by risk level (High -> Medium -> Low)
            classified.sort((a, b) => {
                const riskOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
                return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
            });

            console.log("✅ Classification complete:", classified);

            // Save to storage
            chrome.storage.local.set({ cookieReport: classified }, () => {
                if (chrome.runtime.lastError) {
                    console.error("❌ Error saving to storage:", chrome.runtime.lastError);
                } else {
                    console.log("💾 Cookie report saved to storage");
                }
            });

            // Send to popup with enhanced data
            try {
                chrome.runtime.sendMessage({
                    action: "showCookieReport",
                    cookies: classified,
                    stats: {
                        total: classified.length,
                        essential: classified.filter(c => c.isEssential).length,
                        thirdParty: classified.filter(c => c.isThirdParty).length,
                        high: classified.filter(c => c.riskLevel === 'High').length,
                        medium: classified.filter(c => c.riskLevel === 'Medium').length,
                        low: classified.filter(c => c.riskLevel === 'Low').length
                    }
                });
                console.log("📤 Enhanced cookie report sent to popup");
            } catch (error) {
                console.error("❌ Error sending message:", error);
            }

            sendResponse({ success: true, count: classified.length });
        });
        
        return;
    }

    // Update cookie settings
    if (request.action === "updateCookieSetting") {
        const key = `${request.cookieName}|${request.cookieDomain}`;
        chrome.storage.local.set({ [key]: request.isAllowed }, () => {
            console.log(`⚙️ Updated setting for ${key}: ${request.isAllowed}`);
            sendResponse({ success: true });
        });
        return;
    }

    // Remove tracking cookies
    if (request.action === "removeTrackingCookies") {
        chrome.cookies.getAll({ url: request.url }, (cookies) => {
            const trackingCookies = cookies.filter(cookie => {
                const classification = aiClassifyCookie(cookie.name, cookie.domain);
                return classification.riskLevel === 'High' || classification.purpose === 'Marketing';
            });

            console.log(`🗑️ Removing ${trackingCookies.length} tracking cookies`);
            
            trackingCookies.forEach(cookie => {
                const domain = cookie.domain.startsWith(".") ? cookie.domain.substring(1) : cookie.domain;
                const protocol = cookie.secure ? "https:" : "http:";
                const url = `${protocol}//${domain}${cookie.path}`;
                
                chrome.cookies.remove({ url, name: cookie.name }, (details) => {
                    if (chrome.runtime.lastError) {
                        console.error(`❌ Error removing ${cookie.name}:`, chrome.runtime.lastError);
                    } else {
                        console.log(`✅ Successfully removed ${cookie.name}`);
                    }
                });
            });

            sendResponse({ success: true, removed: trackingCookies.length });
        });
        return;
    }

    // Accept only essential cookies
    if (request.action === "acceptEssentialCookies") {
        chrome.cookies.getAll({ url: request.url }, (cookies) => {
            cookies.forEach(cookie => {
                const classification = aiClassifyCookie(cookie.name, cookie.domain);
                const isEssential = isEssentialCookie(cookie.name, classification.purpose);
                
                if (!isEssential) {
                    const domain = cookie.domain.startsWith(".") ? cookie.domain.substring(1) : cookie.domain;
                    const protocol = cookie.secure ? "https:" : "http:";
                    const url = `${protocol}//${domain}${cookie.path}`;
                    
                    chrome.cookies.remove({ url, name: cookie.name }, (details) => {
                        if (!chrome.runtime.lastError) {
                            console.log(`✅ Removed non-essential cookie: ${cookie.name}`);
                        }
                    });
                }
            });
            
            sendResponse({ success: true, message: "Non-essential cookies removed" });
        });
        return;
    }

    // Accept all cookies (just store preference)
    if (request.action === "acceptAllCookies") {
        chrome.storage.local.set({ 
            cookiePreference: 'all',
            lastUpdated: Date.now()
        }, () => {
            console.log("✅ User accepted all cookies");
            sendResponse({ success: true, message: "All cookies accepted" });
        });
        return;
    }

    sendResponse({ success: false, error: 'Unknown cookie action' });
}

// Terms AI functionality (copied from working extension)
let isProcessing = false;
let analysisCache = new Map();

async function handleTermsAI(request, sender, sendResponse) {
    switch (request.action) {
        case 'analyzeTerms':
            if (isProcessing) {
                sendResponse({ success: false, error: 'Analysis already in progress' });
                return;
            }
            
            isProcessing = true;
            try {
                console.log('🤖 Starting Terms AI analysis...');
                
                const response = await fetch(`${BACKEND_URL}/analyze_text`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: request.text,
                        language: 'en'
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Server responded with ${response.status}`);
                }
                
                const result = await response.json();
                
                // Backend returns data directly
                sendResponse({ success: true, analysis: result });
                
            } catch (error) {
                console.error('❌ Terms AI analysis failed:', error);
                sendResponse({ 
                    success: false, 
                    error: 'AI server unavailable. Please start the backend at localhost:8000' 
                });
            } finally {
                isProcessing = false;
            }
            break;
            
        case 'quickSummary':
            try {
                const response = await fetch(`${BACKEND_URL}/analyze_text`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: request.text,
                        language: 'en'
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Backend returned ${response.status}`);
                }
                
                const result = await response.json();
                
                // Backend returns data directly
                sendResponse({ success: true, summary: result });
                
            } catch (error) {
                sendResponse({ 
                    success: false, 
                    error: 'Quick summary failed. Check if AI server is running.' 
                });
            }
            break;
            
        case 'analyze_content':
            // Handle content analysis (original Terms AI functionality)
            if (isProcessing) {
                sendResponse({ success: false, error: 'Analysis already in progress' });
                return;
            }

            try {
                isProcessing = true;
                
                const { content, url, language = 'en' } = request;
                console.log(`🔍 Analyzing content from: ${url} (Language: ${language})`);
                console.log(`📄 Content length: ${content.length} characters`);

                const cacheKey = generateCacheKey(content + language);
                if (analysisCache.has(cacheKey)) {
                    console.log('📋 Using cached analysis');
                    const cachedResult = analysisCache.get(cacheKey);
                    await storeAnalysis(cachedResult, url);
                    sendResponse({ success: true, data: cachedResult });
                    return;
                }

                const analysisResult = await analyzeWithBackend(content, language);
                
                if (analysisResult.success) {
                    analysisCache.set(cacheKey, analysisResult.data);
                    await storeAnalysis(analysisResult.data, url);
                    showNotification(analysisResult.data.risk_analysis.risk_level, url);
                    
                    console.log('✅ Analysis completed successfully');
                    sendResponse({ success: true, data: analysisResult.data });
                } else {
                    console.error('❌ Analysis failed:', analysisResult.error);
                    sendResponse({ success: false, error: analysisResult.error });
                }

            } catch (error) {
                console.error('💥 Analysis error:', error);
                sendResponse({ success: false, error: error.message });
            } finally {
                isProcessing = false;
            }
            break;
            
        case 'get_analysis_data':
            try {
                const result = await chrome.storage.local.get(['analyses']);
                const analyses = result.analyses || [];
                
                let targetAnalysis = null;
                
                if (request.url) {
                    targetAnalysis = analyses.find(a => a.url === request.url);
                } else {
                    targetAnalysis = analyses[analyses.length - 1];
                }

                sendResponse({ success: true, data: targetAnalysis });
            } catch (error) {
                console.error('Error retrieving analysis data:', error);
                sendResponse({ success: false, error: error.message });
            }
            break;
            
        case 'clear_cache':
            try {
                await chrome.storage.local.set({ analyses: [] });
                console.log('🗑️ Cache cleared');
                sendResponse({ success: true });
            } catch (error) {
                sendResponse({ success: false, error: error.message });
            }
            break;
            
        case 'check_backend_status':
            try {
                const response = await fetch(`${BACKEND_URL}/`, {
                    method: 'GET'
                });
                
                if (response.ok) {
                    sendResponse({ success: true, status: 'connected', backend_url: BACKEND_URL });
                } else {
                    sendResponse({ success: false, status: 'error', error: 'Backend not responding' });
                }
            } catch (error) {
                sendResponse({ 
                    success: false, 
                    status: 'disconnected', 
                    error: `Cannot connect to backend at ${BACKEND_URL}. Please start your FastAPI server.`
                });
            }
            break;
            
        default:
            sendResponse({ success: false, error: 'Unknown terms action' });
    }
}

// Extension lifecycle
chrome.runtime.onInstalled.addListener(() => {
    console.log('✅ Unified Extension installed successfully');
    
    // Initialize Cookie Guard storage with default settings
    chrome.storage.local.set({
        'cookieGuard_initialized': true,
        'cookieGuard_version': '2.0',
        'cookieGuard_lastUpdate': Date.now()
    });
    
    // Create context menu for both functionalities
    chrome.contextMenus.create({
        id: 'cookieGuard',
        title: 'Analyze Cookies',
        contexts: ['page']
    });
    
    chrome.contextMenus.create({
        id: 'termsAI',
        title: 'Analyze Terms & Conditions',
        contexts: ['page']
    });
});

// Monitor tab updates for automatic analysis
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Only analyze when page is completely loaded
    if (changeInfo.status === 'complete' && tab.url) {
        try {
            // Skip chrome:// and extension pages
            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                return;
            }
            
            console.log('🔄 Tab updated, checking for automatic analysis:', tab.url);
            
            // Check if we've already analyzed this page recently
            const result = await chrome.storage.local.get([`analysis_${tabId}`]);
            if (result[`analysis_${tabId}`]) {
                const analysis = result[`analysis_${tabId}`];
                const timeSinceAnalysis = Date.now() - analysis.timestamp;
                
                // Only re-analyze if it's been more than 5 minutes
                if (timeSinceAnalysis < 5 * 60 * 1000) {
                    console.log('⏭️ Skipping analysis - recently analyzed');
                    return;
                }
            }
            
            // Auto-analyze terms for new pages
            await autoAnalyzePage(tabId, tab.url);
            
        } catch (error) {
            console.error('Error in tab update listener:', error);
        }
    }
});

// Auto-analyze page content
async function autoAnalyzePage(tabId, url) {
    try {
        console.log('🤖 Auto-analyzing page:', url);
        
        // Inject content script to extract terms content
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: extractTermsContent
        });
        
        if (results && results[0] && results[0].result) {
            const content = results[0].result;
            
            if (content && content.length > 100) {
                console.log('📄 Extracted content for analysis:', content.length, 'characters');
                
                // Analyze with backend
                const analysisResult = await analyzeWithBackend(content, 'en');
                
                if (analysisResult.success) {
                    // Store analysis
                    await chrome.storage.local.set({
                        [`analysis_${tabId}`]: {
                            ...analysisResult.data,
                            timestamp: Date.now(),
                            language: 'en',
                            url: url
                        }
                    });
                    
                    console.log('✅ Auto-analysis completed for:', url);
                    
                    // Send notification to popup if it's open
                    chrome.runtime.sendMessage({
                        action: 'autoAnalysisComplete',
                        data: analysisResult.data,
                        tabId: tabId
                    }).catch(() => {
                        // Popup might not be open, ignore error
                    });
                    
                } else {
                    console.log('⚠️ Auto-analysis failed for:', url);
                }
            } else {
                console.log('ℹ️ No significant content found for analysis');
            }
        }
        
    } catch (error) {
        console.error('Error in auto-analyze page:', error);
    }
}

// Content extraction function to be injected
function extractTermsContent() {
    // Look for terms and conditions content
    const termsSelectors = [
        'div[class*="terms"]',
        'div[class*="conditions"]',
        'div[class*="privacy"]',
        'div[id*="terms"]',
        'div[id*="conditions"]',
        'div[id*="privacy"]',
        'main',
        'article',
        '.content',
        '#content'
    ];
    
    let content = '';
    
    for (const selector of termsSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
            const text = element.textContent || element.innerText || '';
            if (text.length > content.length) {
                content = text;
            }
        }
    }
    
    // If no specific terms content found, get general page content
    if (content.length < 500) {
        content = document.body.textContent || document.body.innerText || '';
    }
    
    // Clean up content
    content = content.replace(/\s+/g, ' ').trim();
    
    return content;
}

// Real-time cookie monitoring (Cookie Guard functionality)
chrome.cookies.onChanged.addListener((changeInfo) => {
    if (changeInfo.removed) return;
    
    const cookie = changeInfo.cookie;
    const key = `${cookie.name}|${cookie.domain}`;
    
    chrome.storage.local.get(key, (result) => {
        if (result[key] === false) {
            // User has blocked this cookie, remove it
            const domain = cookie.domain.startsWith(".") ? cookie.domain.substring(1) : cookie.domain;
            const protocol = cookie.secure ? "https:" : "http:";
            const url = `${protocol}//${domain}${cookie.path}`;
            
            chrome.cookies.remove({ url, name: cookie.name }, (details) => {
                console.log(`🛡️ Auto-removed blocked cookie: ${cookie.name}`);
            });
        }
    });
});

// Context menu handling
chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case 'cookieGuard':
            chrome.tabs.sendMessage(tab.id, { action: 'scanCookies' });
            break;
        case 'termsAI':
            chrome.tabs.sendMessage(tab.id, { action: 'analyzeTerms' });
            break;
    }
});

// Keep service worker alive
setInterval(() => {
    console.log('💓 Unified Extension heartbeat');
}, 30000);

console.log('✅ Unified Extension background fully initialized');

// Helper functions for Terms AI functionality (from original extension)
async function analyzeWithBackend(content, language = 'en') {
    try {
        console.log('🔗 Calling FastAPI backend...');
        
        const response = await fetch(`${BACKEND_URL}/analyze_text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                text: content,
                language: language 
            })
        });

        if (!response.ok) {
            throw new Error(`Backend server responded with ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Backend response received');
        
        // Backend returns data directly, not wrapped in success field
        return { success: true, data: result };

    } catch (error) {
        console.error('🚨 Backend communication error:', error);
        
        return {
            success: false,
            error: `Backend connection failed: ${error.message}. Please ensure your FastAPI server is running on ${BACKEND_URL}`
        };
    }
}

async function storeAnalysis(analysisData, url) {
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
            processed_at: new Date().toLocaleString()
        };
        
        analyses.push(newAnalysis);
        if (analyses.length > 10) {
            analyses.shift();
        }
        
        await chrome.storage.local.set({ analyses: analyses });
        console.log('💾 Analysis stored successfully');
        
    } catch (error) {
        console.error('Storage error:', error);
    }
}

function showNotification(riskLevel, url) {
    const domain = new URL(url).hostname;
    
    const notifications = {
        'HIGH': {
            title: '⚠️ High Risk Terms Detected!',
            message: `Terms from ${domain} contain high-risk clauses that require your attention.`,
            iconUrl: 'icons/icon48.png'
        },
        'MEDIUM': {
            title: '🔶 Medium Risk Terms Found',
            message: `Terms from ${domain} contain some concerning clauses. Review recommended.`,
            iconUrl: 'icons/icon48.png'
        },
        'LOW': {
            title: '✅ Low Risk Terms',
            message: `Terms from ${domain} appear to be relatively safe.`,
            iconUrl: 'icons/icon48.png'
        },
        'VERY LOW': {
            title: '✅ Very Safe Terms',
            message: `Terms from ${domain} are consumer-friendly with minimal risks.`,
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

function generateCacheKey(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}