/* 🚀 ENHANCED COOKIE GUARD CONTENT SCRIPT - PERFECT DETECTION! 🚀 */

console.log("📡 Enhanced Cookie Guard content script injected on", window.location.href);

// 🎯 Enhanced Terms Extractor with AI-powered detection
class EnhancedTermsExtractor {
  constructor() {
    this.termsKeywords = [
      'terms', 'conditions', 'policy', 'privacy', 'legal', 'agreement',
      'disclaimer', 'terms of service', 'terms of use', 'user agreement',
      'cookie policy', 'data protection', 'gdpr', 'ccpa'
    ];
    this.initialized = false;
    this.lastScanTime = 0;
    this.scanCooldown = 2000; // 2 seconds between scans
  }

  // 🔍 Enhanced terms and conditions detection
  findTermsAndConditions() {
    const selectors = [
      // Direct selectors with priority
      '[class*="terms" i]', '[class*="policy" i]', '[class*="legal" i]',
      '[id*="terms" i]', '[id*="privacy" i]', '[id*="legal" i]',
      
      // Content areas
      'main', '.content', '#content', '.main-content', '.page-content',
      '.legal-content', '.terms-content', '.policy-content',
      '.privacy-content', '.gdpr-content',
      
      // Common wrapper classes
      '.container', '.wrapper', '.inner', '.text-content', '.article',
      '.document', '.legal-document', '.policy-document'
    ];

    let bestMatch = null;
    let maxScore = 0;

    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        
        for (const element of elements) {
          if (!this.isElementVisible(element)) continue;
          
          const text = this.extractCleanText(element);
          const score = this.scoreTermsContent(text, element);
          
          if (score > maxScore && text.length > 300) {
            maxScore = score;
            bestMatch = { element, text, score, selector };
          }
        }
      } catch (error) {
        console.error("Error processing selector:", selector, error);
      }
    }

    return bestMatch;
  }

  // 🎨 Extract clean, readable text from element
  extractCleanText(element) {
    if (!element) return '';
    
    // Clone element to avoid modifying original
    const clone = element.cloneNode(true);
    
    // Remove script and style elements
    const scripts = clone.querySelectorAll('script, style, noscript');
    scripts.forEach(el => el.remove());
    
    // Get text content and clean it
    let text = clone.textContent || clone.innerText || '';
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }

  // 📊 Enhanced content scoring with AI-like analysis
  scoreTermsContent(text, element) {
    if (!text || text.length < 100) return 0;
    
    let score = 0;
    const textLower = text.toLowerCase();
    
    // Primary terms keywords (high weight)
    this.termsKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = textLower.match(regex);
      if (matches) {
        score += matches.length * 15;
      }
    });

    // Legal language patterns (medium weight)
    const legalPatterns = [
      /\byou agree\b/gi,
      /\bwe collect\b/gi,
      /\bpersonal information\b/gi,
      /\bthird.{0,5}part(y|ies)\b/gi,
      /\bcookies?\b/gi,
      /\bdata protection\b/gi,
      /\bprivacy rights\b/gi,
      /\bterms.{0,10}(of.{0,5})?(service|use|conditions)\b/gi,
      /\buser.{0,5}agreement\b/gi,
      /\bgdpr\b/gi,
      /\bccpa\b/gi,
      /\bprocessing.{0,10}data\b/gi
    ];

    legalPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length * 8;
      }
    });

    // Structure and semantic bonuses
    if (element.tagName === 'MAIN') score += 25;
    if (element.className.toLowerCase().includes('content')) score += 20;
    if (element.id.toLowerCase().includes('content')) score += 20;
    if (element.className.toLowerCase().includes('terms')) score += 30;
    if (element.className.toLowerCase().includes('privacy')) score += 30;
    if (element.className.toLowerCase().includes('legal')) score += 25;

    // Length bonus (with diminishing returns)
    const lengthBonus = Math.min(text.length / 50, 100);
    score += lengthBonus;

    // Penalty for very short content
    if (text.length < 500) score *= 0.5;

    // Bonus for well-structured content
    const paragraphs = text.split(/\.\s+/).length;
    if (paragraphs > 10) score += 20;

    return Math.round(score);
  }

  // 👁️ Check if element is visible
  isElementVisible(element) {
    if (!element || !element.offsetParent) return false;
    
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }

  // 📊 Extract comprehensive page metadata
  extractPageMetadata() {
    const metadata = {
      title: document.title,
      url: window.location.href,
      domain: window.location.hostname,
      language: this.detectPageLanguage(),
      wordCount: this.extractCleanText(document.body).split(/\s+/).length,
      timestamp: Date.now()
    };

    // Page type detection with enhanced patterns
    const indicators = {
      isTermsPage: false,
      isPrivacyPage: false,
      isLegalPage: false,
      isCookiePage: false,
      confidence: 0
    };

    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();
    const bodyText = this.extractCleanText(document.body).toLowerCase();

    // URL-based detection
    if (url.includes('terms') || url.includes('tos')) {
      indicators.isTermsPage = true;
      indicators.confidence += 30;
    }
    if (url.includes('privacy')) {
      indicators.isPrivacyPage = true;
      indicators.confidence += 30;
    }
    if (url.includes('legal')) {
      indicators.isLegalPage = true;
      indicators.confidence += 25;
    }
    if (url.includes('cookie')) {
      indicators.isCookiePage = true;
      indicators.confidence += 25;
    }

    // Title-based detection
    if (title.includes('terms') || title.includes('conditions')) {
      indicators.isTermsPage = true;
      indicators.confidence += 20;
    }
    if (title.includes('privacy')) {
      indicators.isPrivacyPage = true;
      indicators.confidence += 20;
    }

    // Content-based detection
    const termsCount = (bodyText.match(/\bterms\b/g) || []).length;
    const privacyCount = (bodyText.match(/\bprivacy\b/g) || []).length;
    const cookieCount = (bodyText.match(/\bcookie\b/g) || []).length;

    if (termsCount > 5) {
      indicators.isTermsPage = true;
      indicators.confidence += Math.min(termsCount, 20);
    }
    if (privacyCount > 5) {
      indicators.isPrivacyPage = true;
      indicators.confidence += Math.min(privacyCount, 20);
    }
    if (cookieCount > 5) {
      indicators.isCookiePage = true;
      indicators.confidence += Math.min(cookieCount, 15);
    }

    return { ...metadata, ...indicators };
  }

  // 🌍 Detect page language with fallbacks
  detectPageLanguage() {
    // Check meta tag
    const langMeta = document.querySelector('meta[http-equiv="content-language"]');
    if (langMeta?.content) return langMeta.content.split('-')[0];
    
    // Check html lang attribute
    if (document.documentElement.lang) return document.documentElement.lang.split('-')[0];
    
    // Check browser language
    if (navigator.language) return navigator.language.split('-')[0];
    
    // Default fallback
    return 'en';
  }

  // 💾 Get user's preferred language
  getUserLanguage() {
    // Check Chrome storage first
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get('language', (data) => {
          if (data.language) {
            resolve(data.language);
          } else {
            resolve(this.detectPageLanguage());
          }
        });
      } else {
        resolve(this.detectPageLanguage());
      }
    });
  }
}

// 🔍 Advanced Cookie Detection and Monitoring
class EnhancedCookieDetector {
  constructor() {
    this.lastScan = 0;
    this.scanInterval = 3000; // 3 seconds
    this.cookieCache = new Map();
  }

  // 🎯 Trigger enhanced cookie scan
  triggerCookieScan() {
    const now = Date.now();
    if (now - this.lastScan < this.scanInterval) {
      console.log("⏰ Cookie scan cooldown active, skipping...");
      return;
    }

    this.lastScan = now;
    console.log("🔍 Triggering enhanced cookie scan...");

    try {
      chrome.runtime.sendMessage({
        action: "scanCookies",
        url: window.location.href,
        timestamp: now,
        userAgent: navigator.userAgent,
        referrer: document.referrer
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("❌ Cookie scan error:", chrome.runtime.lastError);
        } else {
          console.log("✅ Cookie scan completed:", response);
        }
      });
    } catch (error) {
      console.error("❌ Error sending cookie scan message:", error);
    }
  }

  // 👁️ Monitor real-time cookie changes
  setupCookieMonitoring() {
    // Monitor document.cookie changes
    let lastCookieValue = document.cookie;
    
    const checkCookieChanges = () => {
      if (document.cookie !== lastCookieValue) {
        console.log("🍪 Cookie change detected");
        lastCookieValue = document.cookie;
        
        // Debounced scan trigger
        clearTimeout(this.cookieChangeTimeout);
        this.cookieChangeTimeout = setTimeout(() => {
          this.triggerCookieScan();
        }, 1000);
      }
    };

    // Check every 2 seconds
    setInterval(checkCookieChanges, 2000);

    // Monitor DOM mutations that might affect cookies
    const observer = new MutationObserver((mutations) => {
      const hasRelevantChanges = mutations.some(mutation => {
        return mutation.type === 'childList' && 
               (mutation.target.tagName === 'HEAD' || 
                mutation.target.tagName === 'SCRIPT' ||
                Array.from(mutation.addedNodes).some(node => 
                  node.tagName === 'SCRIPT' || node.tagName === 'IFRAME'
                ));
      });

      if (hasRelevantChanges) {
        clearTimeout(this.domChangeTimeout);
        this.domChangeTimeout = setTimeout(() => {
          this.triggerCookieScan();
        }, 2000);
      }
    });

    observer.observe(document, {
      childList: true,
      subtree: true
    });

    console.log("👁️ Cookie monitoring enabled");
  }
}

// 🚀 Initialize Enhanced Detection System
function initializeEnhancedDetection() {
  console.log("🚀 Initializing enhanced detection system...");

  const termsExtractor = new EnhancedTermsExtractor();
  const cookieDetector = new EnhancedCookieDetector();

  // Wait for page to be fully loaded
  const initializationDelay = document.readyState === 'complete' ? 1000 : 3000;

  setTimeout(async () => {
    console.log("🔍 Starting comprehensive analysis...");

    // 1. Enhanced Cookie Scanning
    cookieDetector.triggerCookieScan();
    cookieDetector.setupCookieMonitoring();

    // 2. Enhanced Terms Detection
    try {
      const pageMetadata = termsExtractor.extractPageMetadata();
      const userLanguage = await termsExtractor.getUserLanguage();
      
      console.log("📄 Page metadata:", pageMetadata);
      console.log("🌍 User language:", userLanguage);

      // Find terms content
      const termsMatch = termsExtractor.findTermsAndConditions();
      
      if (termsMatch && termsMatch.score > 50) {
        console.log("✅ High-quality terms content found (score:", termsMatch.score + ")");
        
        // Send for summarization if substantial content
        if (termsMatch.text.length > 500) {
          chrome.runtime.sendMessage({
            action: "summarizeTerms",
            text: termsMatch.text.substring(0, 8000), // Limit size
            language: userLanguage,
            metadata: pageMetadata,
            confidence: termsMatch.score
          });
        }
      } else {
        console.log("ℹ️ No substantial terms content found on current page");
      }
    } catch (error) {
      console.error("❌ Error in terms detection:", error);
    }

    // 3. Look for cookie banners and privacy notices
    detectCookieBanners();

  }, initializationDelay);
}

// 🍪 Detect cookie banners and privacy notices
function detectCookieBanners() {
  const bannerSelectors = [
    '[class*="cookie" i]', '[id*="cookie" i]',
    '[class*="privacy" i]', '[id*="privacy" i]',
    '[class*="consent" i]', '[id*="consent" i]',
    '[class*="gdpr" i]', '[id*="gdpr" i]',
    '.banner', '.notice', '.popup', '.modal',
    '[class*="accept" i]', '[class*="decline" i]'
  ];

  const potentialBanners = [];
  
  bannerSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const text = element.textContent?.toLowerCase() || '';
        if (text.includes('cookie') || text.includes('privacy') || text.includes('consent')) {
          potentialBanners.push({
            element,
            selector,
            text: text.substring(0, 200),
            visible: element.offsetHeight > 0
          });
        }
      });
    } catch (error) {
      console.error("Error checking selector:", selector, error);
    }
  });

  if (potentialBanners.length > 0) {
    console.log("🍪 Detected cookie banners/notices:", potentialBanners.length);
    
    // Notify popup about cookie banners
    chrome.runtime.sendMessage({
      action: "cookieBannersDetected",
      banners: potentialBanners.map(b => ({
        selector: b.selector,
        text: b.text,
        visible: b.visible
      }))
    });
  }
}

// 📡 Enhanced message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Content script received message:", message.action);

  switch (message.action) {
    case "rescanCookies":
      const cookieDetector = new EnhancedCookieDetector();
      cookieDetector.triggerCookieScan();
      sendResponse({ success: true });
      break;
      
    case "getPageContent":
      const termsExtractor = new EnhancedTermsExtractor();
      const content = termsExtractor.extractCleanText(document.body);
      sendResponse({ content: content.substring(0, 10000) });
      break;
      
    case "detectTerms":
      const extractor = new EnhancedTermsExtractor();
      const termsMatch = extractor.findTermsAndConditions();
      sendResponse({ 
        found: !!termsMatch, 
        score: termsMatch?.score || 0,
        text: termsMatch?.text?.substring(0, 1000) || ""
      });
      break;

    default:
      sendResponse({ error: "Unknown action" });
  }

  return true;
});

// 🎯 Auto-trigger enhanced detection when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEnhancedDetection);
} else {
  initializeEnhancedDetection();
}

// 🔄 Re-scan on navigation (for SPAs)
let lastUrl = window.location.href;
new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    console.log("🔄 Navigation detected, re-initializing...");
    setTimeout(initializeEnhancedDetection, 2000);
  }
}).observe(document, { childList: true, subtree: true });

console.log("✅ Enhanced Cookie Guard content script loaded successfully!");
