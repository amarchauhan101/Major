// ============================================================
// 🔧 Background Service Worker - FastAPI Backend Integration
// ============================================================

const BACKEND_URL = 'http://localhost:8000';
let analysisCache = new Map();
let isProcessing = false;

console.log('🚀 Terms & Conditions AI Analyzer - Background Service Worker Loaded');

chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed/updated:', details.reason);
    
    chrome.storage.local.set({
        analyses: [],
        settings: {
            backend_url: BACKEND_URL,
            auto_detect: true,
            show_notifications: true
        }
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Message received:', request.action);

    switch (request.action) {
        case 'analyze_content':
            handleContentAnalysis(request, sendResponse);
            return true;

        case 'get_analysis_data':
            handleGetAnalysisData(request, sendResponse);
            return true;

        case 'check_backend_status':
            handleBackendStatusCheck(sendResponse);
            return true;

        case 'clear_cache':
            handleClearCache(sendResponse);
            return true;

        default:
            console.warn('Unknown action:', request.action);
            sendResponse({ success: false, error: 'Unknown action' });
    }
});

async function handleContentAnalysis(request, sendResponse) {
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
}

async function analyzeWithBackend(content, language = 'en') {
    try {
        console.log('🔗 Calling FastAPI backend...');
        
        const response = await fetch(`${BACKEND_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                content: content,
                language: language 
            })
        });

        if (!response.ok) {
            throw new Error(`Backend server responded with ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Backend response received');
        
        if (result.success) {
            return { success: true, data: result.data };
        } else {
            throw new Error(result.error || 'Backend analysis failed');
        }

    } catch (error) {
        console.error('🚨 Backend communication error:', error);
        
        return {
            success: false,
            error: `Backend connection failed: ${error.message}. Please ensure your FastAPI server is running on ${BACKEND_URL}`
        };
    }
}

async function handleGetAnalysisData(request, sendResponse) {
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
}

async function handleBackendStatusCheck(sendResponse) {
    try {
        const response = await fetch(`${BACKEND_URL}/`, {
            method: 'GET',
            timeout: 5000
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
}

function handleClearCache(sendResponse) {
    analysisCache.clear();
    chrome.storage.local.set({ analyses: [] });
    console.log('🗑️ Cache cleared');
    sendResponse({ success: true });
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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        console.log(`📄 Tab updated: ${tab.url}`);
    }
});

self.addEventListener('error', (error) => {
    console.error('💥 Unhandled error in background script:', error);
});

setInterval(() => {
    console.log('🔄 Background service worker heartbeat');
}, 30000);

console.log('✅ Background script fully initialized');