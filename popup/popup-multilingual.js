// Multilingual Popup JavaScript for Cookie Guard + Terms AI Extension

// Translation data structure
const translations = {
    en: {
        title: "Privacy Protection Suite",
        subtitle: "Cookie Guard + Terms AI Extension",
        cookie_guard_title: "Cookie Guard",
        cookie_guard_desc: "Analyze and manage cookies on this page with AI-powered classification and privacy protection.",
        open_cookie_guard: "Open Cookie Guard",
        quick_scan: "Quick Scan",
        terms_ai_title: "Terms AI", 
        terms_ai_desc: "AI-powered analysis of Terms & Conditions with smart summarization and risk assessment.",
        open_terms_ai: "Open Terms AI",
        quick_analysis: "Quick Analysis",
        combined_actions: "Combined Actions",
        full_privacy_analysis: "Full Privacy Analysis",
        cookies: "Cookies",
        terms_status_label: "Terms Status",
        ready: "Ready",
        risk_level: "Risk Level",
        view_details: "View Details",
        processing: "Processing...",
        error_occurred: "An error occurred while processing your request.",
        footer_text: "Cookie Guard + Terms AI • Privacy Protection Suite",
        analyzing: "Analyzing...",
        low_risk: "Low Risk",
        medium_risk: "Medium Risk",
        high_risk: "High Risk",
        privacy_analysis_complete: "Privacy analysis completed successfully!",
        no_terms_found: "No Terms & Conditions found on this page.",
        analysis_failed: "Analysis failed. Please try again."
    },
    hi: {
        title: "गोपनीयता सुरक्षा सूट",
        subtitle: "कुकी गार्ड + शर्तें AI एक्सटेंशन",
        cookie_guard_title: "कुकी गार्ड",
        cookie_guard_desc: "AI-संचालित वर्गीकरण और गोपनीयता सुरक्षा के साथ इस पृष्ठ पर कुकीज़ का विश्लेषण और प्रबंधन करें।",
        open_cookie_guard: "कुकी गार्ड खोलें",
        quick_scan: "त्वरित स्कैन",
        terms_ai_title: "शर्तें AI",
        terms_ai_desc: "स्मार्ट सारांश और जोखिम मूल्यांकन के साथ नियम व शर्तों का AI-संचालित विश्लेषण।",
        open_terms_ai: "शर्तें AI खोलें",
        quick_analysis: "त्वरित विश्लेषण",
        combined_actions: "संयुक्त कार्य",
        full_privacy_analysis: "पूर्ण गोपनीयता विश्लेषण",
        cookies: "कुकीज़",
        terms_status_label: "शर्तों की स्थिति",
        ready: "तैयार",
        risk_level: "जोखिम स्तर",
        view_details: "विवरण देखें",
        processing: "प्रक्रिया में...",
        error_occurred: "आपके अनुरोध को संसाधित करते समय एक त्रुटि हुई।",
        footer_text: "कुकी गार्ड + शर्तें AI • गोपनीयता सुरक्षा सूट",
        analyzing: "विश्लेषण कर रहे हैं...",
        low_risk: "कम जोखिम",
        medium_risk: "मध्यम जोखिम",
        high_risk: "उच्च जोखिम",
        privacy_analysis_complete: "गोपनीयता विश्लेषण सफलतापूर्वक पूर्ण!",
        no_terms_found: "इस पृष्ठ पर कोई नियम व शर्तें नहीं मिलीं।",
        analysis_failed: "विश्लेषण असफल। कृपया पुनः प्रयास करें।"
    },
    mr: {
        title: "गोपनीयता संरक्षण संच",
        subtitle: "कुकी गार्ड + अटी AI विस्तार",
        cookie_guard_title: "कुकी गार्ड",
        cookie_guard_desc: "AI-चालित वर्गीकरण आणि गोपनीयता संरक्षणासह या पृष्ठावरील कुकीजचे विश्लेषण आणि व्यवस्थापन करा।",
        open_cookie_guard: "कुकी गार्ड उघडा",
        quick_scan: "द्रुत स्कॅन",
        terms_ai_title: "अटी AI",
        terms_ai_desc: "स्मार्ट सारांश आणि जोखीम मूल्यांकनासह नियम आणि अटींचे AI-चालित विश्लेषण।",
        open_terms_ai: "अटी AI उघडा",
        quick_analysis: "द्रुत विश्लेषण",
        combined_actions: "एकत्रित क्रिया",
        full_privacy_analysis: "संपूर्ण गोपनीयता विश्लेषण",
        cookies: "कुकीज",
        terms_status_label: "अटींची स्थिती",
        ready: "तयार",
        risk_level: "जोखीम स्तर",
        view_details: "तपशील पहा",
        processing: "प्रक्रिया करत आहे...",
        error_occurred: "तुमची विनंती प्रक्रिया करताना त्रुटी झाली।",
        footer_text: "कुकी गार्ड + अटी AI • गोपनीयता संरक्षण संच",
        analyzing: "विश्लेषण करत आहे...",
        low_risk: "कमी जोखीम",
        medium_risk: "मध्यम जोखीम", 
        high_risk: "उच्च जोखीम",
        privacy_analysis_complete: "गोपनीयता विश्लेषण यशस्वीरीत्या पूर्ण!",
        no_terms_found: "या पृष्ठावर कोणत्याही नियम आणि अटी सापडल्या नाहीत।",
        analysis_failed: "विश्लेषण अयशस्वी. कृपया पुन्हा प्रयत्न करा।"
    },
    bn: {
        title: "গোপনীয়তা সুরক্ষা স্যুট",
        subtitle: "কুকি গার্ড + শর্তাবলী AI এক্সটেনশন",
        cookie_guard_title: "কুকি গার্ড",
        cookie_guard_desc: "AI-চালিত শ্রেণীবিভাগ এবং গোপনীয়তা সুরক্ষা সহ এই পৃষ্ঠায় কুকিজ বিশ্লেষণ এবং পরিচালনা করুন।",
        open_cookie_guard: "কুকি গার্ড খুলুন",
        quick_scan: "দ্রুত স্ক্যান",
        terms_ai_title: "শর্তাবলী AI",
        terms_ai_desc: "স্মার্ট সংক্ষিপ্তসার এবং ঝুঁকি মূল্যায়ন সহ নিয়ম ও শর্তাবলীর AI-চালিত বিশ্লেষণ।",
        open_terms_ai: "শর্তাবলী AI খুলুন",
        quick_analysis: "দ্রুত বিশ্লেষণ",
        combined_actions: "সম্মিলিত কর্ম",
        full_privacy_analysis: "সম্পূর্ণ গোপনীয়তা বিশ্লেষণ",
        cookies: "কুকিজ",
        terms_status_label: "শর্তাবলীর অবস্থা",
        ready: "প্রস্তুত",
        risk_level: "ঝুঁকির স্তর",
        view_details: "বিস্তারিত দেখুন",
        processing: "প্রক্রিয়াকরণ...",
        error_occurred: "আপনার অনুরোধ প্রক্রিয়াকরণে একটি ত্রুটি ঘটেছে।",
        footer_text: "কুকি গার্ড + শর্তাবলী AI • গোপনীয়তা সুরক্ষা স্যুট",
        analyzing: "বিশ্লেষণ করছে...",
        low_risk: "কম ঝুঁকি",
        medium_risk: "মাঝারি ঝুঁকি",
        high_risk: "উচ্চ ঝুঁকি",
        privacy_analysis_complete: "গোপনীয়তা বিশ্লেষণ সফলভাবে সম্পন্ন!",
        no_terms_found: "এই পৃষ্ঠায় কোনো নিয়ম ও শর্তাবলী পাওয়া যায়নি।",
        analysis_failed: "বিশ্লেষণ ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।"
    }
};

// Current language state
let currentLanguage = 'en';
let isAnalyzing = false;

// DOM elements
const languageSelect = document.getElementById('languageSelect');
const currentLangIndicator = document.getElementById('currentLang');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const analysisResult = document.getElementById('analysisResult');

// Initialize the popup
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserLanguagePreference();
    updateLanguageDisplay();
    attachEventListeners();
    loadCurrentPageStatus();
});

// Load user's saved language preference
async function loadUserLanguagePreference() {
    try {
        const result = await chrome.storage.sync.get(['userLanguage']);
        if (result.userLanguage) {
            currentLanguage = result.userLanguage;
            languageSelect.value = currentLanguage;
        }
    } catch (error) {
        console.error('Error loading language preference:', error);
    }
}

// Save user's language preference
async function saveUserLanguagePreference(language) {
    try {
        await chrome.storage.sync.set({ userLanguage: language });
    } catch (error) {
        console.error('Error saving language preference:', error);
    }
}

// Update all text content based on current language
function updateLanguageDisplay() {
    const elements = document.querySelectorAll('[data-translate]');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
    
    // Update language indicator
    currentLangIndicator.textContent = currentLanguage.toUpperCase();
    
    // Update language selector
    languageSelect.value = currentLanguage;
}

// Attach event listeners
function attachEventListeners() {
    // Language selector change
    languageSelect.addEventListener('change', async (e) => {
        currentLanguage = e.target.value;
        await saveUserLanguagePreference(currentLanguage);
        updateLanguageDisplay();
        
        // Re-translate any existing analysis results
        if (analysisResult.classList.contains('show')) {
            // Optionally refresh analysis with new language
        }
    });

    // Cookie Guard actions
    document.getElementById('open-cookie-guard').addEventListener('click', openCookieGuard);
    document.getElementById('scan-cookies').addEventListener('click', scanCookies);

    // Terms AI actions
    document.getElementById('open-terms-ai').addEventListener('click', openTermsAI);
    document.getElementById('analyze-terms').addEventListener('click', analyzeTerms);

    // Combined action
    document.getElementById('full-analysis').addEventListener('click', runFullAnalysis);

    // View details
    document.getElementById('view-details').addEventListener('click', viewDetails);
}

// Load current page status
async function loadCurrentPageStatus() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        
        // Automatically scan cookies for current page
        await autoScanCookies();
        
        // Check if page has been analyzed
        const result = await chrome.storage.local.get([`analysis_${currentTab.id}`]);
        if (result[`analysis_${currentTab.id}`]) {
            displayPreviousAnalysis(result[`analysis_${currentTab.id}`]);
            document.getElementById('terms-status').textContent = 'Analyzed';
        } else {
            // Automatically analyze terms if not already analyzed
            await autoAnalyzeTerms();
        }
    } catch (error) {
        console.error('Error loading page status:', error);
    }
}

// Automatically scan cookies for current page
async function autoScanCookies() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        
        // Get cookies for current URL (same method as Cookie Guard)
        const cookies = await chrome.cookies.getAll({ url: currentTab.url });
        document.getElementById('cookie-count').textContent = cookies.length.toString();
        
        console.log(`🍪 Auto-scanned ${cookies.length} cookies for ${currentTab.url}`);
        
        // Store cookie count for later use
        await chrome.storage.local.set({
            [`cookies_${currentTab.id}`]: {
                count: cookies.length,
                timestamp: Date.now(),
                domain: new URL(currentTab.url).hostname
            }
        });
        
    } catch (error) {
        console.error('Error auto-scanning cookies:', error);
        document.getElementById('cookie-count').textContent = '0';
    }
}

// Automatically analyze terms for current page
async function autoAnalyzeTerms() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        
        // Update status to analyzing
        document.getElementById('terms-status').textContent = 'Analyzing...';
        
        // Extract content from the current page
        const results = await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            function: extractTermsContent
        });
        
        if (results && results[0] && results[0].result) {
            const content = results[0].result;
            
            if (content && content.length > 100) {
                console.log('📄 Extracted content for auto-analysis:', content.length, 'characters');
                
                // Send message to background script for terms analysis
                const response = await chrome.runtime.sendMessage({
                    action: 'analyze_content',
                    content: content,
                    url: currentTab.url,
                    language: currentLanguage
                });
                
                if (response && response.success) {
                    displayAnalysisResult(response.data);
                    document.getElementById('terms-status').textContent = 'Analyzed';
                    
                    // Save analysis for later
                    await chrome.storage.local.set({
                        [`analysis_${currentTab.id}`]: {
                            ...response.data,
                            timestamp: Date.now(),
                            language: currentLanguage
                        }
                    });
                } else {
                    document.getElementById('terms-status').textContent = 'Ready';
                    console.log('Terms analysis failed or no terms found');
                }
            } else {
                document.getElementById('terms-status').textContent = 'Ready';
                console.log('No significant content found for analysis');
            }
        } else {
            document.getElementById('terms-status').textContent = 'Ready';
            console.log('Failed to extract content from page');
        }
    } catch (error) {
        console.error('Error auto-analyzing terms:', error);
        document.getElementById('terms-status').textContent = 'Ready';
    }
}

// Content extraction function (same as in background script)
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

// Cookie Guard functions
function openCookieGuard() {
    // Navigate to Cookie Guard specific view
    window.location.href = 'cookie-guard.html';
}

async function scanCookies() {
    if (isAnalyzing) return;
    
    showLoading(translations[currentLanguage].analyzing);
    
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Send message to content script to scan cookies
        const response = await chrome.tabs.sendMessage(tabs[0].id, { 
            action: 'scanCookies', 
            language: currentLanguage 
        });
        
        hideLoading();
        
        if (response && response.success) {
            document.getElementById('cookie-count').textContent = response.cookieCount || '0';
        } else {
            showError(translations[currentLanguage].analysis_failed);
        }
    } catch (error) {
        hideLoading();
        showError(translations[currentLanguage].error_occurred);
        console.error('Cookie scan error:', error);
    }
}

// Terms AI functions
function openTermsAI() {
    // Navigate to Terms AI specific view
    window.location.href = 'terms/popup.html';
}

async function analyzeTerms() {
    if (isAnalyzing) return;
    
    showLoading(translations[currentLanguage].analyzing);
    
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Send message to background script for terms analysis
        const response = await chrome.runtime.sendMessage({
            action: 'analyzeTerms',
            url: tabs[0].url,
            language: currentLanguage
        });
        
        hideLoading();
        
        if (response && response.success) {
            displayAnalysisResult(response.data);
            document.getElementById('terms-status').textContent = 'Analyzed';
        } else {
            showError(response?.error || translations[currentLanguage].analysis_failed);
        }
    } catch (error) {
        hideLoading();
        showError(translations[currentLanguage].error_occurred);
        console.error('Terms analysis error:', error);
    }
}

// Combined analysis function
async function runFullAnalysis() {
    if (isAnalyzing) return;
    
    isAnalyzing = true;
    showLoading(translations[currentLanguage].processing);
    
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Send comprehensive analysis request
        const response = await chrome.runtime.sendMessage({
            action: 'fullPrivacyAnalysis',
            url: tabs[0].url,
            language: currentLanguage
        });
        
        hideLoading();
        isAnalyzing = false;
        
        if (response && response.success) {
            displayAnalysisResult(response.data);
            
            // Update status indicators
            document.getElementById('cookie-count').textContent = response.data.cookieCount || '0';
            document.getElementById('terms-status').textContent = 'Analyzed';
            
            // Save analysis for later
            await chrome.storage.local.set({
                [`analysis_${tabs[0].id}`]: {
                    ...response.data,
                    timestamp: Date.now(),
                    language: currentLanguage
                }
            });
            
        } else {
            showError(response?.error || translations[currentLanguage].analysis_failed);
        }
    } catch (error) {
        hideLoading();
        isAnalyzing = false;
        showError(translations[currentLanguage].error_occurred);
        console.error('Full analysis error:', error);
    }
}

// Display analysis results
function displayAnalysisResult(data) {
    const riskBadge = document.getElementById('riskBadge');
    const summaryText = document.getElementById('summaryText');
    
    // Set risk level and styling
    const riskLevel = data.risk_analysis?.risk_level || 'UNKNOWN';
    const riskText = getRiskLevelText(riskLevel);
    
    riskBadge.textContent = riskText;
    riskBadge.className = `risk-badge risk-${riskLevel.toLowerCase()}`;
    
    // Set summary text
    const summary = data.summary?.executive_summary || 
                   translations[currentLanguage].privacy_analysis_complete;
    summaryText.textContent = summary;
    
    // Show the result
    analysisResult.classList.add('show');
    hideError();
}

// Display previous analysis
function displayPreviousAnalysis(data) {
    if (data.language === currentLanguage) {
        displayAnalysisResult(data);
    }
}

// Get risk level text in current language
function getRiskLevelText(riskLevel) {
    const riskMap = {
        'LOW': translations[currentLanguage].low_risk,
        'MEDIUM': translations[currentLanguage].medium_risk,
        'HIGH': translations[currentLanguage].high_risk,
        'VERY LOW': translations[currentLanguage].low_risk
    };
    
    return riskMap[riskLevel] || riskLevel;
}

// View detailed analysis
function viewDetails() {
    // Open detailed view (could be new tab or expanded popup)
    chrome.tabs.create({
        url: chrome.runtime.getURL('popup/terms/popup_fixed.html')
    });
}

// Loading and error management
function showLoading(message) {
    loading.querySelector('p').textContent = message || translations[currentLanguage].processing;
    loading.classList.add('show');
    hideError();
    analysisResult.classList.remove('show');
}

function hideLoading() {
    loading.classList.remove('show');
}

function showError(message) {
    errorMessage.querySelector('span').textContent = message;
    errorMessage.classList.add('show');
    hideLoading();
}

function hideError() {
    errorMessage.classList.remove('show');
}

// Message listener for background communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateLanguage') {
        currentLanguage = message.language;
        updateLanguageDisplay();
    } else if (message.action === 'analysisComplete') {
        displayAnalysisResult(message.data);
    } else if (message.action === 'analysisError') {
        showError(message.error);
    } else if (message.action === 'autoAnalysisComplete') {
        // Handle automatic analysis completion
        displayAnalysisResult(message.data);
        document.getElementById('terms-status').textContent = 'Analyzed';
        console.log('✅ Auto-analysis completed and displayed');
    }
});

// Export functions for external use
window.CookieGuardPopup = {
    updateLanguage: (lang) => {
        currentLanguage = lang;
        updateLanguageDisplay();
    },
    getCurrentLanguage: () => currentLanguage,
    showAnalysisResult: displayAnalysisResult
};