console.log("📡 Content script injected on", window.location.href);

// Cookie Guard Functionality
class EnhancedCookieDetector {
  constructor() {
    this.lastScan = 0;
    this.scanInterval = 3000; // 3 seconds
    this.cookieCache = new Map();
    this.monitoringActive = false;
    this.cookieCheckInterval = null;
  }

  // Cleanup method to prevent memory leaks
  cleanup() {
    if (this.cookieCheckInterval) {
      clearInterval(this.cookieCheckInterval);
      this.cookieCheckInterval = null;
    }
    if (this.cookieChangeTimeout) {
      clearTimeout(this.cookieChangeTimeout);
    }
    if (this.domChangeTimeout) {
      clearTimeout(this.domChangeTimeout);
    }
    this.monitoringActive = false;
  }

  // Trigger enhanced cookie scan
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

  // Monitor real-time cookie changes (optimized for performance)
  setupCookieMonitoring() {
    // Only enable monitoring if not already active
    if (this.monitoringActive) return;
    this.monitoringActive = true;
    
    // Monitor document.cookie changes with reduced frequency
    let lastCookieValue = document.cookie;
    
    const checkCookieChanges = () => {
      const currentCookies = document.cookie;
      if (currentCookies !== lastCookieValue) {
        console.log("🍪 Cookie change detected");
        lastCookieValue = currentCookies;
        
        // Debounced scan trigger with longer delay to avoid spam
        clearTimeout(this.cookieChangeTimeout);
        this.cookieChangeTimeout = setTimeout(() => {
          this.triggerCookieScan();
        }, 2000); // Increased from 1000ms to 2000ms
      }
    };

    // Reduced frequency: Check every 5 seconds instead of 2
    this.cookieCheckInterval = setInterval(checkCookieChanges, 5000);

    // Optimized DOM mutation observer with throttling
    let mutationTimeout;
    const observer = new MutationObserver((mutations) => {
      // Throttle mutation processing
      if (mutationTimeout) return;
      
      mutationTimeout = setTimeout(() => {
        mutationTimeout = null;
        
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
          }, 3000); // Increased delay
        }
      }, 500); // Throttle mutations to max once per 500ms
    });

    observer.observe(document, {
      childList: true,
      subtree: true
    });

    console.log("🔒 Optimized cookie monitoring active");
  }
}

class TermsExtractor {
  constructor() {
    this.termsKeywords = [
      "terms",
      "conditions",
      "policy",
      "privacy",
      "legal",
      "agreement",
      "disclaimer",
      "terms of service",
      "terms of use",
      "user agreement",
    ];
  }

  // Enhanced terms and conditions detection
  findTermsAndConditions() {
    const selectors = [
      // Direct selectors
      '[class*="terms" i]',
      '[class*="policy" i]',
      '[class*="legal" i]',
      '[id*="terms" i]',
      '[id*="policy" i]',
      '[id*="legal" i]',

      // Content areas
      "main",
      ".content",
      "#content",
      ".main-content",
      ".page-content",
      ".legal-content",
      ".terms-content",
      ".policy-content",

      // Common wrapper classes
      ".container",
      ".wrapper",
      ".inner",
      ".text-content",
    ];

    let bestMatch = null;
    let maxScore = 0;

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);

      for (const element of elements) {
        const text = element.innerText || element.textContent || "";
        const score = this.scoreTermsContent(text, element);

        if (score > maxScore && text.length > 500) {
          maxScore = score;
          bestMatch = { element, text, score };
        }
      }
    }

    return bestMatch;
  }

  // Score content based on terms-related keywords and structure
  scoreTermsContent(text, element) {
    let score = 0;
    const textLower = text.toLowerCase();

    // Check for terms keywords
    this.termsKeywords.forEach((keyword) => {
      const regex = new RegExp(keyword, "gi");
      const matches = textLower.match(regex);
      if (matches) {
        score += matches.length * 10;
      }
    });

    // Check for legal language patterns
    const legalPatterns = [
      /\byou agree\b/gi,
      /\bwe collect\b/gi,
      /\bpersonal information\b/gi,
      /\bthird.{0,5}part(y|ies)\b/gi,
      /\bcookies?\b/gi,
      /\bdata protection\b/gi,
      /\bprivacy rights\b/gi,
      /\bterms.{0,10}conditions\b/gi,
    ];

    legalPatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length * 5;
      }
    });

    // Bonus for structure
    if (element.tagName === "MAIN") score += 20;
    if (element.className.toLowerCase().includes("content")) score += 15;
    if (element.id.toLowerCase().includes("content")) score += 15;

    // Length bonus (but cap it)
    score += Math.min(text.length / 100, 50);

    return score;
  }

  // Extract metadata about the page
  extractPageMetadata() {
    const metadata = {
      title: document.title,
      url: window.location.href,
      domain: window.location.hostname,
      language:
        document.documentElement.lang ||
        document.querySelector('meta[http-equiv="content-language"]')
          ?.content ||
        navigator.language.split("-")[0] ||
        "en",
    };

    // Look for terms-specific page indicators
    const indicators = {
      isTermsPage: false,
      isPrivacyPage: false,
      isLegalPage: false,
    };

    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();

    if (url.includes("terms") || title.includes("terms")) {
      indicators.isTermsPage = true;
    }
    if (url.includes("privacy") || title.includes("privacy")) {
      indicators.isPrivacyPage = true;
    }
    if (url.includes("legal") || title.includes("legal")) {
      indicators.isLegalPage = true;
    }

    return { ...metadata, ...indicators };
  }

  // Get user's preferred language from browser
  getUserLanguage() {
    // Check localStorage for saved preference
    const savedLang = localStorage.getItem("cookieGuard_language");
    if (savedLang) return savedLang;

    // Get from browser
    const browserLang = navigator.language.split("-")[0];

    // Supported languages mapping
    const supportedLanguages = {
      en: "en",
      es: "es",
      fr: "fr",
      de: "de",
      it: "it",
      pt: "pt",
      ru: "ru",
      ja: "ja",
      ko: "ko",
      zh: "zh",
      ar: "ar",
      hi: "hi",
      mr: "mr",
      te: "te",
      ta: "ta",
      bn: "bn",
      gu: "gu",
    };

    return supportedLanguages[browserLang] || "en";
  }
}

// Initialize extractor
const termsExtractor = new TermsExtractor();

// Auto-analysis on page visit
function performAutoAnalysis() {
  console.log("🔍 Starting auto-analysis for:", window.location.href);

  // 1. Always trigger cookie scan
  chrome.runtime.sendMessage({
    action: "scanCookies",
    url: window.location.href,
  });

  // 2. Check for terms links first
  const termsLinks = findTermsLinks();
  const pageMetadata = termsExtractor.extractPageMetadata();
  const userLanguage = termsExtractor.getUserLanguage();

  console.log("📄 Page metadata:", pageMetadata);
  console.log("🌍 User language:", userLanguage);

  if (termsLinks.length > 0) {
    console.log("🔗 Found terms links:", termsLinks);
    // Analyze the best terms link
    analyzeTermsLink(termsLinks[0], userLanguage, pageMetadata);
  } else {
    // No terms links found, analyze current page
    console.log("📄 No terms links found, analyzing current page content");
    analyzeCurrentPage(userLanguage, pageMetadata);
  }
}

function analyzeTermsLink(linkUrl, language, metadata) {
  console.log("🔍 Analyzing terms link:", linkUrl);
  
  // Try to fetch content from the terms page
  fetch(linkUrl)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    })
    .then(html => {
      // Parse HTML and extract text content
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const content = extractCleanText(doc.body);
      
      if (content && content.length > 200) {
        console.log("✅ Successfully extracted terms content from link");
        sendForAnalysis(content, linkUrl, language, metadata);
      } else {
        console.log("⚠️ Insufficient content from terms link, falling back to current page");
        analyzeCurrentPage(language, metadata);
      }
    })
    .catch(error => {
      console.log("❌ Failed to fetch terms link:", error.message);
      console.log("📄 Falling back to current page analysis");
      analyzeCurrentPage(language, metadata);
    });
}

function analyzeCurrentPage(language, metadata) {
  console.log("📄 Analyzing current page content");

  // Try to find terms content on current page
  const termsMatch = termsExtractor.findTermsAndConditions();
  
  let termsText = "";

  if (termsMatch) {
    console.log("✅ Found terms content with score:", termsMatch.score);
    termsText = termsMatch.text;
  } else {
    // Fallback: use main content
    termsText = extractMainContent();
  }

  // Send for analysis if we have sufficient content
  if (termsText && termsText.length > 200) {
    console.log("📤 Sending content for analysis");
    sendForAnalysis(termsText, window.location.href, language, metadata);
    } else {
    console.log("⚠️ Insufficient terms content found on current page");
    }
  }

function sendForAnalysis(content, url, language, metadata) {
    chrome.runtime.sendMessage({
    action: "analyze_content",
    content: content,
    url: url,
    language: language,
    metadata: metadata,
    autoAnalysis: true // Flag to indicate this is auto-analysis
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("❌ Auto-analysis failed:", chrome.runtime.lastError);
    } else if (response && response.success) {
      console.log("✅ Auto-analysis completed successfully");
      // Store the analysis result for the popup to display
      chrome.storage.local.set({
        lastAutoAnalysis: {
          url: url,
          data: response.data,
          timestamp: Date.now()
        }
    });
  } else {
      console.error("❌ Auto-analysis failed:", response?.error);
    }
  });
}

function extractCleanText(element) {
  if (!element) return "";
  
  // Clone to avoid modifying original
  const clone = element.cloneNode(true);
  
  // Remove scripts, styles, and other non-content elements
  clone.querySelectorAll('script, style, noscript, nav, header, footer, aside').forEach(el => el.remove());
  
  let text = clone.textContent || clone.innerText || "";
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

function extractMainContent() {
  const contentSelectors = [
    'main', 'article', '[role="main"]', '.main-content',
    '.content', '.page-content', '.post-content', '.entry-content',
    '#content', '#main', '.container', '.wrapper'
  ];

  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.length > 300) {
      return extractCleanText(element);
    }
  }

  return extractCleanText(document.body);
}

// Wait for page to load, then perform auto-analysis
setTimeout(() => {
  performAutoAnalysis();
}, 3000); // Reduced delay for faster analysis

// Helper function to find terms and conditions links
function findTermsLinks() {
  const links = Array.from(document.querySelectorAll("a"));
  const termsLinks = [];

  const termsPatterns = [
    /terms/i,
    /conditions/i,
    /privacy/i,
    /policy/i,
    /legal/i,
    /user.{0,10}agreement/i,
    /terms.{0,10}service/i,
  ];

  links.forEach((link) => {
    const href = link.getAttribute("href");
    const text = link.textContent || link.innerText;

    if (href && text) {
      const matchesPattern = termsPatterns.some(
        (pattern) => pattern.test(text) || pattern.test(href)
      );

      if (matchesPattern) {
        // Convert relative URLs to absolute
        const absoluteUrl = new URL(href, window.location.href).href;
        termsLinks.push(absoluteUrl);
      }
    }
  });

  return [...new Set(termsLinks)]; // Remove duplicates
}

// Listen for language preference changes
window.addEventListener("message", (event) => {
  if (event.data.action === "changeLanguage") {
    localStorage.setItem("cookieGuard_language", event.data.language);
    console.log("🌍 Language preference updated:", event.data.language);
  }
});

// Enhanced cookie monitoring for real-time updates
const originalSetCookie = document.cookie;
let cookieChangeTimeout;

// Monitor cookie changes
const cookieObserver = new MutationObserver(() => {
  clearTimeout(cookieChangeTimeout);
  cookieChangeTimeout = setTimeout(() => {
    chrome.runtime.sendMessage({
      action: "scanCookies",
      url: window.location.href,
    });
  }, 1000);
});

// Start observing
cookieObserver.observe(document, {
  childList: true,
  subtree: true,
  attributes: true,
});

console.log("✅ Enhanced Cookie Guard content script loaded");

// 🚀 Enhanced Cookie Guard AI Extension loaded

class AITermsDetector {
  constructor() {
    this.termsPatterns = {
      // Advanced pattern matching for terms detection
      exact: [
        "terms of service",
        "terms and conditions",
        "privacy policy",
        "user agreement",
        "cookie policy",
        "data protection policy",
      ],
      partial: [
        "terms",
        "privacy",
        "conditions",
        "agreement",
        "policy",
        "legal",
        "disclaimer",
        "consent",
        "gdpr",
        "ccpa",
      ],
      legal: [
        /\b(you agree|we collect|personal information|third.{0,10}part(y|ies))\b/gi,
        /\b(data.{0,10}processing|liability|indemnif|arbitration)\b/gi,
        /\b(intellectual.{0,10}property|copyright|trademark)\b/gi,
      ],
    };

    this.aiCache = new Map();
    this.processingQueue = [];
    this.isProcessing = false;
    this.observerActive = false;

    this.initializeAdvancedDetection();
  }

  initializeAdvancedDetection() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        this.startDetection()
      );
    } else {
      this.startDetection();
    }
  }

  startDetection() {
    // Debounced detection to avoid performance issues
    this.debouncedDetect = this.debounce(() => {
      this.performIntelligentDetection();
    }, 1000);

    this.debouncedDetect();
    this.setupIntersectionObserver();
    this.monitorDynamicContent();
  }

  performIntelligentDetection() {
    console.log("🔍 Starting intelligent terms detection...");

    const detectionResults = {
      termsLinks: this.findTermsLinks(),
      termsContent: this.extractTermsContent(),
      modalTerms: this.detectModalTerms(),
      cookieBanners: this.detectCookieBanners(),
    };

    const confidence = this.calculateDetectionConfidence(detectionResults);

    if (confidence > 0.3) {
      this.triggerAIAnalysis(detectionResults, confidence);
    }

    // Always scan cookies regardless of terms detection
    this.scanCookiesAdvanced();
  }

  findTermsLinks() {
    const selectors = [
      'a[href*="terms" i]',
      'a[href*="privacy" i]',
      'a[href*="policy" i]',
      'a[href*="legal" i]',
      'a[href*="conditions" i]',
      'a[href*="agreement" i]',
    ];

    const links = [];
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((link) => {
        const text = link.textContent.toLowerCase();
        const href = link.href.toLowerCase();

        const relevanceScore = this.calculateLinkRelevance(text, href);
        if (relevanceScore > 0.5) {
          links.push({
            element: link,
            url: link.href,
            text: link.textContent,
            score: relevanceScore,
          });
        }
      });
    });

    return links.sort((a, b) => b.score - a.score);
  }

  extractTermsContent() {
    const contentSelectors = [
      '[class*="terms" i]',
      '[class*="policy" i]',
      '[class*="legal" i]',
      '[id*="terms" i]',
      '[id*="policy" i]',
      '[id*="legal" i]',
      "main",
      ".content",
      "#content",
      ".main-content",
      "article",
    ];

    let bestMatch = null;
    let maxScore = 0;

    contentSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        const text = this.extractCleanText(element);
        if (text.length < 500) return;

        const score = this.scoreContentRelevance(text, element);
        if (score > maxScore) {
          maxScore = score;
          bestMatch = {
            element,
            text,
            score,
            wordCount: text.split(" ").length,
          };
        }
      });
    });

    return bestMatch;
  }

  detectModalTerms() {
    const modalSelectors = [
      '[role="dialog"]',
      ".modal",
      ".popup",
      ".overlay",
      '[class*="consent" i]',
      '[class*="cookie" i]',
      '[class*="gdpr" i]',
    ];

    const visibleModals = [];
    modalSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((modal) => {
        if (this.isElementVisible(modal)) {
          const text = this.extractCleanText(modal);
          const score = this.scoreContentRelevance(text, modal);

          if (score > 0.3) {
            visibleModals.push({ element: modal, text, score });
          }
        }
      });
    });

    return visibleModals;
  }

  detectCookieBanners() {
    const cookieSelectors = [
      '[class*="cookie" i]',
      '[id*="cookie" i]',
      '[class*="consent" i]',
      '[class*="gdpr" i]',
      '[class*="privacy" i]',
    ];

    const banners = [];
    cookieSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((banner) => {
        if (this.isElementVisible(banner)) {
          const text = this.extractCleanText(banner);
          if (text.length > 50 && this.containsCookieKeywords(text)) {
            banners.push({ element: banner, text });
          }
        }
      });
    });

    return banners;
  }

  calculateDetectionConfidence(results) {
    let confidence = 0;

    // Links contribute to confidence
    confidence += Math.min(results.termsLinks.length * 0.2, 0.4);

    // Content relevance
    if (results.termsContent) {
      confidence += Math.min(results.termsContent.score * 0.4, 0.5);
    }

    // Modal presence
    confidence += Math.min(results.modalTerms.length * 0.15, 0.3);

    // Cookie banners
    confidence += Math.min(results.cookieBanners.length * 0.1, 0.2);

    return Math.min(confidence, 1.0);
  }

  async triggerAIAnalysis(detectionResults, confidence) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    console.log(
      `🎯 Triggering AI analysis with confidence: ${confidence.toFixed(2)}`
    );

    // Prepare text for analysis
    let analysisText = "";

    // Prioritize content over links
    if (detectionResults.termsContent) {
      analysisText = detectionResults.termsContent.text;
    } else if (detectionResults.termsLinks.length > 0) {
      // Try to fetch content from top-rated link
      try {
        const topLink = detectionResults.termsLinks[0];
        const fetchedContent = await this.fetchLinkContent(topLink.url);
        if (fetchedContent) analysisText = fetchedContent;
      } catch (error) {
        console.log("Could not fetch link content:", error);
      }
    }

    // Include modal content
    detectionResults.modalTerms.forEach((modal) => {
      analysisText += "\n\n" + modal.text;
    });

    if (analysisText.length > 200) {
      // Send to background for AI processing
      chrome.runtime.sendMessage({
        action: "summarizeTerms",
        text: analysisText.substring(0, 50000), // Limit size
        language: this.getUserLanguage(),
        metadata: this.extractPageMetadata(),
        confidence: confidence,
      });
    }

    this.isProcessing = false;
  }

  async fetchLinkContent(url) {
    try {
      const urlObj = new URL(url, window.location.href);
      if (urlObj.hostname !== window.location.hostname) return null;

      const response = await fetch(url);
      if (!response.ok) return null;

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      return this.extractCleanText(doc.body);
    } catch (error) {
      return null;
    }
  }

  scanCookiesAdvanced() {
    chrome.runtime.sendMessage({
      action: "scanCookies",
      url: window.location.href,
      enhanced: true,
      pageMetadata: this.extractPageMetadata(),
    });
  }

  // Helper methods
  extractCleanText(element) {
    if (!element) return "";

    // Clone to avoid modifying original
    const clone = element.cloneNode(true);

    // Remove scripts and styles
    clone
      .querySelectorAll("script, style, noscript")
      .forEach((el) => el.remove());

    let text = clone.textContent || clone.innerText || "";

    // Clean up whitespace
    text = text.replace(/\s+/g, " ").trim();

    return text;
  }

  scoreContentRelevance(text, element) {
    let score = 0;
    const textLower = text.toLowerCase();

    // Check for exact patterns
    this.termsPatterns.exact.forEach((pattern) => {
      if (textLower.includes(pattern)) score += 0.3;
    });

    // Check for partial patterns
    this.termsPatterns.partial.forEach((pattern) => {
      const regex = new RegExp(`\\b${pattern}\\b`, "gi");
      const matches = textLower.match(regex);
      if (matches) score += matches.length * 0.05;
    });

    // Check for legal patterns
    this.termsPatterns.legal.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) score += matches.length * 0.1;
    });

    // Element structure bonus
    const tagName = element.tagName.toLowerCase();
    if (["main", "article"].includes(tagName)) score += 0.2;
    if (["section", "div"].includes(tagName)) score += 0.1;

    // Length bonus (but capped)
    score += Math.min(text.length / 5000, 0.3);

    return Math.min(score, 1.0);
  }

  calculateLinkRelevance(text, href) {
    let score = 0;

    this.termsPatterns.exact.forEach((pattern) => {
      if (text.includes(pattern) || href.includes(pattern)) {
        score += 0.4;
      }
    });

    this.termsPatterns.partial.forEach((pattern) => {
      if (text.includes(pattern) || href.includes(pattern)) {
        score += 0.1;
      }
    });

    return Math.min(score, 1.0);
  }

  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  }

  containsCookieKeywords(text) {
    const cookieKeywords = [
      "cookie",
      "consent",
      "privacy",
      "gdpr",
      "ccpa",
      "tracking",
      "analytics",
      "accept",
      "decline",
    ];

    const textLower = text.toLowerCase();
    return cookieKeywords.some((keyword) => textLower.includes(keyword));
  }

  extractPageMetadata() {
    return {
      title: document.title,
      url: window.location.href,
      domain: window.location.hostname,
      language:
        document.documentElement.lang ||
        document.querySelector('meta[http-equiv="content-language"]')
          ?.content ||
        navigator.language.split("-")[0] ||
        "en",
      timestamp: Date.now(),
    };
  }

  getUserLanguage() {
    const savedLang = localStorage.getItem("cookieGuard_language");
    if (savedLang) return savedLang;

    return navigator.language.split("-")[0] || "en";
  }

  setupIntersectionObserver() {
    if (this.observerActive) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target;
            if (element.classList.contains("terms-potential")) {
              // Lazy load analysis for this element
              this.analyzeElement(element);
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    // Mark potential terms elements for lazy loading
    document
      .querySelectorAll('[class*="terms"], [class*="policy"], [class*="legal"]')
      .forEach((el) => {
        el.classList.add("terms-potential");
        observer.observe(el);
      });

    this.observerActive = true;
  }

  monitorDynamicContent() {
    const observer = new MutationObserver(
      this.debounce((mutations) => {
        let shouldRecheck = false;

        mutations.forEach((mutation) => {
          if (mutation.type === "childList") {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const text = node.textContent?.toLowerCase() || "";
                if (
                  this.termsPatterns.partial.some((pattern) =>
                    text.includes(pattern)
                  )
                ) {
                  shouldRecheck = true;
                }
              }
            });
          }
        });

        if (shouldRecheck) {
          this.debouncedDetect();
        }
      }, 2000)
    );

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Message handling for background communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "forceDetection":
      new AITermsDetector();
      sendResponse({ status: "detection_started" });
      break;
    case "displaySummary":
      displayEnhancedSummary(message.summary, message.metadata);
      sendResponse({ status: "summary_displayed" });
      break;
    case "showCookieReport":
      displayCookieReport(message.cookies);
      sendResponse({ status: "cookies_displayed" });
      break;
  }
  return true;
});

function displayEnhancedSummary(summary, metadata) {
  // Remove existing notification/modal
  const existing = document.querySelector("#ai-terms-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "ai-terms-overlay";
  overlay.innerHTML = `
    <div class="ai-terms-modal">
      <div class="ai-terms-header">
        <div class="ai-terms-title">
          <div class="ai-icon">🤖</div>
          <h3>AI Terms Analysis</h3>
        </div>
        <div class="ai-terms-controls">
          <select id="language-selector" class="language-select">
            <option value="en">🇺🇸 English</option>
            <option value="es">🇪🇸 Español</option>
            <option value="fr">🇫🇷 Français</option>
            <option value="de">🇩🇪 Deutsch</option>
            <option value="hi">🇮🇳 हिन्दी</option>
            <option value="zh">🇨🇳 中文</option>
          </select>
          <button id="close-ai-modal" class="close-btn">✕</button>
        </div>
      </div>
      <div class="ai-terms-body">
        <div id="summary-content">${summary}</div>
      </div>
      <div class="ai-terms-footer">
        <button id="translate-summary" class="action-btn primary">🌐 Translate</button>
        <button id="detailed-analysis" class="action-btn secondary">📊 Deep Analysis</button>
        <button id="export-summary" class="action-btn secondary">📥 Export</button>
      </div>
    </div>
  `;

  // Add enhanced styles
  if (!document.querySelector("#ai-terms-styles")) {
    const styles = document.createElement("style");
    styles.id = "ai-terms-styles";
    styles.textContent = getEnhancedStyles();
    document.head.appendChild(styles);
  }

  document.body.appendChild(overlay);

  // Add event listeners
  setupModalEventListeners();
}

function getEnhancedStyles() {
  return `
    #ai-terms-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(10px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease-out;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .ai-terms-modal {
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
      max-width: 90vw;
      max-height: 90vh;
      width: 800px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.4s ease-out;
    }

    .ai-terms-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .ai-terms-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .ai-icon {
      font-size: 24px;
      animation: pulse 2s infinite;
    }

    .ai-terms-title h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    .ai-terms-controls {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .language-select {
      padding: 8px 12px;
      border: none;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      font-size: 14px;
      backdrop-filter: blur(10px);
    }

    .close-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 35px;
      height: 35px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.3s ease;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    .ai-terms-body {
      flex: 1;
      padding: 25px;
      overflow-y: auto;
      line-height: 1.6;
      color: #333;
    }

    .summary-section, .risks-section {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      border-left: 4px solid #667eea;
    }

    .summary-section h4, .risks-section h4 {
      margin: 0 0 15px 0;
      color: #2c3e50;
      font-size: 18px;
      font-weight: 600;
    }

    .risk-item {
      background: white;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 8px;
      border-left: 4px solid;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .risk-item:hover {
      transform: translateX(5px);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .risk-item.high { border-left-color: #e74c3c; background: #ffeaea; }
    .risk-item.medium { border-left-color: #f39c12; background: #fff8e1; }
    .risk-item.low { border-left-color: #27ae60; background: #e8f5e8; }

    .ai-terms-footer {
      padding: 20px 25px;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .action-btn {
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .action-btn.primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .action-btn.secondary {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { transform: translateY(50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    @media (max-width: 768px) {
      .ai-terms-modal {
        margin: 20px;
        width: calc(100% - 40px);
        height: calc(100% - 40px);
      }
      
      .ai-terms-controls {
        flex-direction: column;
        gap: 8px;
      }
      
      .ai-terms-footer {
        flex-direction: column;
      }
    }
  `;
}

function setupModalEventListeners() {
  document.getElementById("close-ai-modal")?.addEventListener("click", () => {
    document.getElementById("ai-terms-overlay")?.remove();
  });

  document
    .getElementById("translate-summary")
    ?.addEventListener("click", () => {
      const language = document.getElementById("language-selector").value;
      const content = document.getElementById("summary-content").textContent;

      chrome.runtime.sendMessage({
        action: "translateSummary",
        text: content,
        targetLanguage: language,
      });
    });

  document
    .getElementById("detailed-analysis")
    ?.addEventListener("click", () => {
      chrome.runtime.sendMessage({
        action: "detailedAnalysis",
        url: window.location.href,
      });
    });

  document.getElementById("export-summary")?.addEventListener("click", () => {
    const content = document.getElementById("summary-content").textContent;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `terms-summary-${window.location.hostname}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// Initialize both Cookie Guard and Terms AI functionality with performance optimization
if (!window.unifiedExtensionInitialized) {
    window.unifiedExtensionInitialized = true;
    
    // Stagger initialization to avoid performance bottlenecks
    setTimeout(() => {
        // Initialize Cookie Guard with optimized monitoring
        const cookieDetector = new EnhancedCookieDetector();
        cookieDetector.setupCookieMonitoring();
        
        // Store reference for cleanup if needed
        window.cookieDetector = cookieDetector;
    }, 100);
    
    setTimeout(() => {
        // Initialize Terms AI
        new AITermsDetector();
    }, 200);
    
    // Cleanup on page unload to prevent memory leaks
    window.addEventListener('beforeunload', () => {
        if (window.cookieDetector) {
            window.cookieDetector.cleanup();
        }
    });
    
    console.log("✅ Unified Extension: Cookie Guard + Terms AI initialized with performance optimizations");
}

// Essential message listener for Terms AI functionality
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'get_page_content') {
        // Create a simple TCDetector instance for content extraction
        const detector = new (class {
            detectTermsContent() {
                console.log('🔍 Scanning page for Terms & Conditions...');
                
                const pageTitle = document.title.toLowerCase();
                const pageUrl = window.location.href.toLowerCase();
                
                const termsKeywords = [
                    'terms and conditions', 'terms of service', 'terms of use',
                    'user agreement', 'service agreement', 'privacy policy',
                    'end user license', 'acceptable use', 'legal terms',
                    'terms & conditions', 'tos', 'eula', 'user terms'
                ];
                
                const containsTermsKeywords = (text) => {
                    return termsKeywords.some(keyword => text.includes(keyword));
                };
                
                if (containsTermsKeywords(pageTitle) || containsTermsKeywords(pageUrl)) {
                    console.log('✅ T&C page detected via title/URL');
                    return this.extractMainContent();
                }

                const tcContainers = this.findTCContainers();
                if (tcContainers.length > 0) {
                    console.log('✅ T&C content detected via containers');
                    return this.extractFromContainers(tcContainers);
                }

                const mainContent = this.extractMainContent();
                if (mainContent && mainContent.length > 500) {
                    console.log('📄 Substantial content found, analyzing...');
                    return mainContent;
                }

                console.log('❌ No T&C content detected');
                return null;
            }
            
            findTCContainers() {
                const selectors = [
                    '[class*="terms"]', '[class*="condition"]', '[class*="agreement"]',
                    '[class*="policy"]', '[class*="legal"]', '[class*="tos"]',
                    '[id*="terms"]', '[id*="condition"]', '[id*="agreement"]',
                    '[id*="policy"]', '[id*="legal"]', '[id*="tos"]'
                ];

                const containers = [];
                selectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        if (el.textContent.length > 200) {
                            containers.push(el);
                        }
                    });
                });

                return containers;
            }
            
            extractFromContainers(containers) {
                let content = '';
                containers.forEach(container => {
                    content += this.cleanText(container.textContent) + '\n\n';
                });
                return content.trim();
            }
            
            extractMainContent() {
                const contentSelectors = [
                    'main', 'article', '[role="main"]', '.main-content',
                    '.content', '.page-content', '.post-content', '.entry-content',
                    '#content', '#main', '.container', '.wrapper'
                ];

                for (const selector of contentSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent.length > 300) {
                        return this.cleanText(element.textContent);
                    }
                }

                return this.cleanText(document.body.textContent);
            }
            
            cleanText(text) {
                return text
                    .replace(/\s+/g, ' ')
                    .replace(/\n\s*\n/g, '\n')
                    .trim();
            }
        })();
        
        const content = detector.detectTermsContent();
        sendResponse({
            success: !!content,
            content: content,
            url: window.location.href,
            title: document.title
        });
    }
    
    // Handle analyze_content action from popup
    if (request.action === 'analyze_content') {
        console.log('📋 Analyzing content for terms...');
        
        // Extract content from the page
        const detector = new (class {
            detectTermsContent() {
                console.log('🔍 Scanning page for Terms & Conditions...');
                
                const pageTitle = document.title.toLowerCase();
                const pageUrl = window.location.href.toLowerCase();
                
                const termsKeywords = [
                    'terms and conditions', 'terms of service', 'terms of use',
                    'user agreement', 'service agreement', 'privacy policy',
                    'end user license', 'acceptable use', 'legal terms',
                    'terms & conditions', 'tos', 'eula', 'user terms'
                ];
                
                const containsTermsKeywords = (text) => {
                    return termsKeywords.some(keyword => text.includes(keyword));
                };
                
                if (containsTermsKeywords(pageTitle) || containsTermsKeywords(pageUrl)) {
                    console.log('✅ T&C page detected via title/URL');
                    return this.extractMainContent();
                }

                const tcContainers = this.findTCContainers();
                if (tcContainers.length > 0) {
                    console.log('✅ T&C content detected via containers');
                    return this.extractFromContainers(tcContainers);
                }

                const mainContent = this.extractMainContent();
                if (mainContent && mainContent.length > 500) {
                    console.log('📄 Substantial content found, analyzing...');
                    return mainContent;
                }

                console.log('❌ No T&C content detected');
                return null;
            }
            
            findTCContainers() {
                const selectors = [
                    '[class*="terms"]', '[class*="condition"]', '[class*="agreement"]',
                    '[class*="policy"]', '[class*="legal"]', '[class*="tos"]',
                    '[id*="terms"]', '[id*="condition"]', '[id*="agreement"]',
                    '[id*="policy"]', '[id*="legal"]', '[id*="tos"]'
                ];

                const containers = [];
                selectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        if (el.textContent.length > 200) {
                            containers.push(el);
                        }
                    });
                });

                return containers;
            }
            
            extractFromContainers(containers) {
                let content = '';
                containers.forEach(container => {
                    content += this.cleanText(container.textContent) + '\n\n';
                });
                return content.trim();
            }
            
            extractMainContent() {
                const contentSelectors = [
                    'main', 'article', '[role="main"]', '.main-content',
                    '.content', '.page-content', '.post-content', '.entry-content',
                    '#content', '#main', '.container', '.wrapper'
                ];

                for (const selector of contentSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent.length > 300) {
                        return this.cleanText(element.textContent);
                    }
                }

                return this.cleanText(document.body.textContent);
            }
            
            cleanText(text) {
                return text
                    .replace(/\s+/g, ' ')
                    .replace(/\n\s*\n/g, '\n')
                    .trim();
            }
        })();
        
        const content = detector.detectTermsContent();
        
        if (!content) {
            sendResponse({
                success: false,
                error: 'No terms content found on this page'
            });
            return;
        }
        
        console.log('📤 Sending content to background for analysis...');
        
        // Send content to background script for analysis
        chrome.runtime.sendMessage({
            action: 'analyze_content',
            content: content,
            url: window.location.href,
            language: 'en'
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error analyzing content:', chrome.runtime.lastError);
                sendResponse({
                    success: false,
                    error: 'Failed to analyze content: ' + chrome.runtime.lastError.message
                });
            } else {
                console.log('✅ Analysis completed, sending response to popup');
                sendResponse(response);
            }
        });
        
        return true; // Keep message channel open for async response
    }
});

console.log("✅ Unified Extension: Cookie Guard + Terms AI content script loaded successfully");
