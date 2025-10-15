console.log("✅ Service worker started at", new Date().toLocaleTimeString());

console.log("Background script started");

function aiClassifyCookie(name, domain) {
  const n = name.toLowerCase();
  if (n.includes("ga") || n.includes("gid")) {
    return { purpose: "Google Analytics", riskLevel: "Medium" };
  }
  if (n.includes("fbp") || n.includes("ad")) {
    return { purpose: "Marketing", riskLevel: "High" };
  }
  if (n.includes("sess") || n.includes("auth")) {
    return { purpose: "Session Management", riskLevel: "Low" };
  }
  return { purpose: "Unknown", riskLevel: "Low" };
}

function isEssentialCookie(name) {
  const nameLower = name.toLowerCase();
  const essentialPatterns = [
    "session",
    "auth",
    "token",
    "csrf",
    "xsrf",
    "basket",
    "cart",
    "userid",
    "login",
    "secure",
  ];
  const nonEssentialPatterns = [
    "_ga",
    "_gid",
    "_gat",
    "_fbp",
    "gclid",
    "track",
    "analytics",
    "ad",
    "doubleclick",
    "marketing",
  ];
  if (nonEssentialPatterns.some((p) => nameLower.includes(p))) return false;
  if (essentialPatterns.some((p) => nameLower.includes(p))) return true;
  return false;
}

function removeCookie(cookie) {
  const domain = cookie.domain.startsWith(".")
    ? cookie.domain.substring(1)
    : cookie.domain;
  const protocol = cookie.secure ? "https:" : "http:";
  const url = `${protocol}//${domain}${cookie.path}`;
  console.log(`Removing cookie: ${cookie.name} from ${url}`);
  chrome.cookies.remove({ url, name: cookie.name }, (details) => {
    if (chrome.runtime.lastError) {
      console.error(`Error removing ${cookie.name}:`, chrome.runtime.lastError);
    } else {
      console.log(`Successfully removed ${cookie.name}`);
    }
  });
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("Cookie Guard installed and storage initialized");
});

chrome.cookies.onChanged.addListener((changeInfo) => {
  if (changeInfo.removed) return;
  const cookie = changeInfo.cookie;
  const key = `${cookie.name}|${cookie.domain}`;
  chrome.storage.local.get(key, (result) => {
    if (result[key] === false) {
      console.log(`Blocking cookie based on preference: ${key}`);
      removeCookie(cookie);
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ping") {
    sendResponse({ status: "pong" });
    return true;
  }

  if (request.action === "scanCookies") {
    chrome.cookies.getAll({ url: request.url }, (cookies) => {
      const classified = cookies.map((cookie) => {
        const currentHost = new URL(request.url).hostname;
        const isThirdParty = !cookie.domain.includes(currentHost);
        const classification = aiClassifyCookie(cookie.name, cookie.domain);
        return {
          name: cookie.name,
          domain: cookie.domain,
          purpose: classification.purpose,
          riskLevel: classification.riskLevel,
          isThirdParty,
          isEssential: isEssentialCookie(cookie.name),
        };
      });

      // Save the result in storage
      chrome.storage.local.set({ cookieReport: classified }, () => {
        console.log("✅ Cookie report saved to storage");
      });

      // Send it to whoever is listening (popup)
      chrome.runtime.sendMessage({
        action: "showCookieReport",
        cookies: classified,
      });
    });
    return true;
  }

  if (request.action === "updateCookieSetting") {
    const key = `${request.cookieName}|${request.cookieDomain}`;
    chrome.storage.local.set({ [key]: request.isAllowed });
  }

  if (request.action === "acceptEssentialCookies") {
    const targetUrl = sender?.tab?.url || request?.url || "";
    if (!targetUrl) {
      console.warn("⚠️ Cannot process cookies - URL not available");
      return;
    }

    chrome.cookies.getAll({ url: targetUrl }, (cookies) => {
      cookies.forEach((cookie) => {
        if (!isEssentialCookie(cookie.name)) {
          removeCookie(cookie);
        }
      });
    });

    return true;
  }


  if (request.action === "acceptAllCookies") {
    console.log("Accepting all cookies");
  }
});



console.log("✅ Service worker started at", new Date().toLocaleTimeString());
console.log("Background script started");

let cookiePredictionMap = null;

// ✅ Load prediction map at startup
fetch(chrome.runtime.getURL("cookie_prediction_map.json"))
  .then((res) => res.json())
  .then((data) => {
    cookiePredictionMap = data;
    console.log("✅ Loaded prediction map");
  })
  .catch((err) => {
    console.error("❌ Failed to load prediction map:", err);
  });

function aiClassifyCookie(name, domain) {
  const lowered = name.toLowerCase();

  // 1. Exact match
  if (cookiePredictionMap?.[name]) {
    console.log("AI hit(exact):",name, "=>", cookiePredictionMap[name]);
    return inferRisk(cookiePredictionMap[name]);
  }

  // 2. Partial match
  const matchedKey = Object.keys(cookiePredictionMap).find(key =>
    lowered.includes(key.toLowerCase())
  );
  if (matchedKey) {
    console.log("🎯 AI HIT (partial):", name, "=>", cookiePredictionMap[matchedKey]);
    return inferRisk(cookiePredictionMap[matchedKey]);
  }

  // 3. Fallback
  console.log("❌ AI fallback:", name);
  return { purpose: "Unknown", riskLevel: "Low" };
}

function inferRisk(purpose) {
  let riskLevel = "Low";
  if (purpose.toLowerCase().includes("marketing")) riskLevel = "High";
  else if (purpose.toLowerCase().includes("analytics")) riskLevel = "Medium";
  return { purpose, riskLevel };
}

function isEssentialCookie(name) {
  const nameLower = name.toLowerCase();
  const essentialPatterns = [
    "session", "auth", "token", "csrf", "xsrf", "basket", "cart", "userid", "login", "secure"
  ];
  const nonEssentialPatterns = [
    "_ga", "_gid", "_gat", "_fbp", "gclid", "track", "analytics", "ad", "doubleclick", "marketing"
  ];
  if (nonEssentialPatterns.some((p) => nameLower.includes(p))) return false;
  if (essentialPatterns.some((p) => nameLower.includes(p))) return true;
  return false;
}

function removeCookie(cookie) {
  const domain = cookie.domain.startsWith(".") ? cookie.domain.substring(1) : cookie.domain;
  const protocol = cookie.secure ? "https:" : "http:";
  const url = `${protocol}//${domain}${cookie.path}`;
  console.log(`Removing cookie: ${cookie.name} from ${url}`);
  chrome.cookies.remove({ url, name: cookie.name }, (details) => {
    if (chrome.runtime.lastError) {
      console.error(`Error removing ${cookie.name}:`, chrome.runtime.lastError);
    } else {
      console.log(`Successfully removed ${cookie.name}`);
    }
  });
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("Cookie Guard installed and storage initialized");
});

chrome.cookies.onChanged.addListener((changeInfo) => {
  if (changeInfo.removed) return;
  const cookie = changeInfo.cookie;
  const key = `${cookie.name}|${cookie.domain}`;
  chrome.storage.local.get(key, (result) => {
    if (result[key] === false) {
      console.log(`Blocking cookie based on preference: ${key}`);
      removeCookie(cookie);
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ping") {
    sendResponse({ status: "pong" });
    return true;
  }

  if (request.action === "scanCookies") {
    chrome.cookies.getAll({ url: request.url }, (cookies) => {
      const classified = cookies.map((cookie) => {
        const currentHost = new URL(request.url).hostname;
        const isThirdParty = !cookie.domain.includes(currentHost);
        const classification = aiClassifyCookie(cookie.name, cookie.domain);
        return {
          name: cookie.name,
          domain: cookie.domain,
          purpose: classification.purpose,
          riskLevel: classification.riskLevel,
          isThirdParty,
          isEssential: isEssentialCookie(cookie.name),
        };
      });

      chrome.storage.local.set({ cookieReport: classified }, () => {
        console.log("✅ Cookie report saved to storage");
      });

      chrome.runtime.sendMessage({
        action: "showCookieReport",
        cookies: classified,
      });
    });
    return true;
  }

  if (request.action === "updateCookieSetting") {
    const key = `${request.cookieName}|${request.cookieDomain}`;
    chrome.storage.local.set({ [key]: request.isAllowed });
  }

  if (request.action === "acceptEssentialCookies") {
    const targetUrl = sender?.tab?.url || request?.url || "";
    if (!targetUrl) {
      console.warn("⚠️ Cannot process cookies - URL not available");
      return;
    }
    chrome.cookies.getAll({ url: targetUrl }, (cookies) => {
      cookies.forEach((cookie) => {
        if (!isEssentialCookie(cookie.name)) {
          removeCookie(cookie);
        }
      });
    });
    return true;
  }

  if (request.action === "acceptAllCookies") {
    console.log("Accepting all cookies");
  }
});



console.log("📡 Content script injected on", window.location.href);


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "scanCookies") {
    chrome.cookies.getAll({ url: message.url }, (cookies) => {
      console.log("Scanned cookies:", cookies);

      // Add custom riskLevel, purpose, etc. if needed
      const cookieReport = cookies.map(cookie => ({
        name: cookie.name,
        domain: cookie.domain,
        isThirdParty: !message.url.includes(cookie.domain),
        riskLevel: "Low", // placeholder
        purpose: "Unknown", // placeholder
        isEssential: false // placeholder
      }));

      // Save to storage so popup can read it
      chrome.storage.local.set({ cookieReport });

      // Send directly to popup
      chrome.runtime.sendMessage({
        action: "showCookieReport",
        cookies: cookieReport
      });
    });
  }
});


class TermsExtractor {
  constructor() {
    this.termsKeywords = [
      'terms', 'conditions', 'policy', 'privacy', 'legal', 'agreement',
      'disclaimer', 'terms of service', 'terms of use', 'user agreement'
    ];
  }

  // Enhanced terms and conditions detection
  findTermsAndConditions() {
    const selectors = [
      // Direct selectors
      '[class*="terms" i]', '[class*="policy" i]', '[class*="legal" i]',
      '[id*="terms" i]', '[id*="policy" i]', '[id*="legal" i]',
      
      // Content areas
      'main', '.content', '#content', '.main-content', '.page-content',
      '.legal-content', '.terms-content', '.policy-content',
      
      // Common wrapper classes
      '.container', '.wrapper', '.inner', '.text-content'
    ];

    let bestMatch = null;
    let maxScore = 0;

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      
      for (const element of elements) {
        const text = element.innerText || element.textContent || '';
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
    this.termsKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
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
      /\bterms.{0,10}conditions\b/gi
    ];

    legalPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length * 5;
      }
    });

    // Bonus for structure
    if (element.tagName === 'MAIN') score += 20;
    if (element.className.toLowerCase().includes('content')) score += 15;
    if (element.id.toLowerCase().includes('content')) score += 15;

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
      language: document.documentElement.lang || 
                document.querySelector('meta[http-equiv="content-language"]')?.content ||
                navigator.language.split('-')[0] || 'en'
    };

    // Look for terms-specific page indicators
    const indicators = {
      isTermsPage: false,
      isPrivacyPage: false,
      isLegalPage: false
    };

    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();

    if (url.includes('terms') || title.includes('terms')) {
      indicators.isTermsPage = true;
    }
    if (url.includes('privacy') || title.includes('privacy')) {
      indicators.isPrivacyPage = true;
    }
    if (url.includes('legal') || title.includes('legal')) {
      indicators.isLegalPage = true;
    }

    return { ...metadata, ...indicators };
  }

  // Get user's preferred language from browser
  getUserLanguage() {
    // Check localStorage for saved preference
    const savedLang = localStorage.getItem('cookieGuard_language');
    if (savedLang) return savedLang;

    // Get from browser
    const browserLang = navigator.language.split('-')[0];
    
    // Supported languages mapping
    const supportedLanguages = {
      'en': 'en', 'es': 'es', 'fr': 'fr', 'de': 'de', 'it': 'it',
      'pt': 'pt', 'ru': 'ru', 'ja': 'ja', 'ko': 'ko', 'zh': 'zh',
      'ar': 'ar', 'hi': 'hi', 'mr': 'mr', 'te': 'te', 'ta': 'ta',
      'bn': 'bn', 'gu': 'gu'
    };

    return supportedLanguages[browserLang] || 'en';
  }
}

// Initialize extractor
const termsExtractor = new TermsExtractor();

// Wait for page to load, then extract and analyze
setTimeout(() => {
  console.log("🔍 Starting cookie and terms analysis...");
  
  // 1. Trigger cookie scan (existing functionality)
  chrome.runtime.sendMessage({
    action: "scanCookies",
    url: window.location.href,
  });

  // 2. Extract and analyze terms & conditions
  const pageMetadata = termsExtractor.extractPageMetadata();
  const userLanguage = termsExtractor.getUserLanguage();
  
  console.log("📄 Page metadata:", pageMetadata);
  console.log("🌍 User language:", userLanguage);

  let termsText = "";
  
  // Try to find terms content on current page
  const termsMatch = termsExtractor.findTermsAndConditions();
  
  if (termsMatch) {
    console.log("✅ Found terms content with score:", termsMatch.score);
    termsText = termsMatch.text;
  } else {
    // Look for terms links and try to fetch content
    const termsLinks = findTermsLinks();
    if (termsLinks.length > 0) {
      console.log("🔗 Found terms links:", termsLinks);
      // For now, send the first link to background for processing
      chrome.runtime.sendMessage({
        action: "extractTermsFromUrl",
        url: termsLinks[0],
        language: userLanguage
      });
      return;
    } else {
      // Fallback: use page content
      termsText = document.body.innerText.substring(0, 10000); // Limit size
    }
  }

  // Send terms for summarization
  if (termsText && termsText.length > 200) {
    chrome.runtime.sendMessage({
      action: "summarizeTerms",
      text: termsText,
      language: userLanguage,
      metadata: pageMetadata
    });
  } else {
    console.log("⚠️ Insufficient terms content found");
  }

}, 4000); // Delay to ensure page is fully loaded

// Helper function to find terms and conditions links
function findTermsLinks() {
  const links = Array.from(document.querySelectorAll('a'));
  const termsLinks = [];
  
  const termsPatterns = [
    /terms/i, /conditions/i, /privacy/i, /policy/i, /legal/i,
    /user.{0,10}agreement/i, /terms.{0,10}service/i
  ];

  links.forEach(link => {
    const href = link.getAttribute('href');
    const text = link.textContent || link.innerText;
    
    if (href && text) {
      const matchesPattern = termsPatterns.some(pattern => 
        pattern.test(text) || pattern.test(href)
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
window.addEventListener('message', (event) => {
  if (event.data.action === 'changeLanguage') {
    localStorage.setItem('cookieGuard_language', event.data.language);
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
  attributes: true 
});

console.log("✅ Enhanced Cookie Guard content script loaded");

