/* 🚀 ENHANCED COOKIE GUARD BACKGROUND - PERFECT SCANNING & ANALYSIS! 🚀 */

console.log("✅ Enhanced Cookie Guard Service Worker started at", new Date().toLocaleTimeString());

let cookiePredictionMap = null;

// 🧠 Load prediction map at startup
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

// 🎯 Enhanced AI Cookie Classification
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

// 🔍 Pattern-based classification for unknown cookies
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

// 🎨 Smart risk and purpose inference
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

// ⚡ Enhanced essential cookie detection
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

// 🗑️ Enhanced cookie removal
function removeCookie(cookie) {
  try {
    const domain = cookie.domain.startsWith(".") ? cookie.domain.substring(1) : cookie.domain;
    const protocol = cookie.secure ? "https:" : "http:";
    const url = `${protocol}//${domain}${cookie.path}`;
    
    console.log(`🗑️ Removing cookie: ${cookie.name} from ${url}`);
    
    chrome.cookies.remove({ url, name: cookie.name }, (details) => {
      if (chrome.runtime.lastError) {
        console.error(`❌ Error removing ${cookie.name}:`, chrome.runtime.lastError);
      } else {
        console.log(`✅ Successfully removed ${cookie.name}`);
      }
    });
  } catch (error) {
    console.error(`❌ Exception removing cookie ${cookie.name}:`, error);
  }
}

// 🔄 Installation handler
chrome.runtime.onInstalled.addListener(() => {
  console.log("🎉 Enhanced Cookie Guard installed and ready!");
  
  // Initialize storage with default settings
  chrome.storage.local.set({
    'cookieGuard_initialized': true,
    'cookieGuard_version': '2.0',
    'cookieGuard_lastUpdate': Date.now()
  });
});

// 👁️ Real-time cookie monitoring
chrome.cookies.onChanged.addListener((changeInfo) => {
  if (changeInfo.removed) return;
  
  const cookie = changeInfo.cookie;
  const key = `${cookie.name}|${cookie.domain}`;
  
  chrome.storage.local.get(key, (result) => {
    if (result[key] === false) {
      console.log(`🚫 Blocking cookie based on user preference: ${key}`);
      removeCookie(cookie);
    }
  });
});

// 📡 Enhanced message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📨 Received message:", request.action);

  // Ping test
  if (request.action === "ping") {
    sendResponse({ status: "pong", timestamp: Date.now() });
    return true;
  }

  // 🔍 Enhanced cookie scanning
  if (request.action === "scanCookies") {
    console.log("🔍 Starting enhanced cookie scan for:", request.url);
    
    chrome.cookies.getAll({ url: request.url }, (cookies) => {
      console.log(`📊 Found ${cookies.length} cookies to analyze`);
      
      if (chrome.runtime.lastError) {
        console.error("❌ Error getting cookies:", chrome.runtime.lastError);
        sendResponse({ error: chrome.runtime.lastError });
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
    
    return true; // Indicate async response
  }

  // 🎛️ Update cookie settings
  if (request.action === "updateCookieSetting") {
    const key = `${request.cookieName}|${request.cookieDomain}`;
    chrome.storage.local.set({ [key]: request.isAllowed }, () => {
      console.log(`⚙️ Updated setting for ${key}: ${request.isAllowed}`);
      sendResponse({ success: true });
    });
    return true;
  }

  // ⚡ Accept essential cookies only
  if (request.action === "acceptEssentialCookies") {
    const targetUrl = sender?.tab?.url || request?.url;
    
    if (!targetUrl) {
      console.warn("⚠️ Cannot process cookies - URL not available");
      sendResponse({ error: "URL not available" });
      return;
    }

    console.log("⚡ Accepting essential cookies only for:", targetUrl);
    
    chrome.cookies.getAll({ url: targetUrl }, (cookies) => {
      let removedCount = 0;
      const promises = [];
      
      cookies.forEach((cookie) => {
        const classification = aiClassifyCookie(cookie.name, cookie.domain);
        const isEssential = isEssentialCookie(cookie.name, classification.purpose);
        
        if (!isEssential) {
          promises.push(new Promise((resolve) => {
            removeCookie(cookie);
            removedCount++;
            setTimeout(resolve, 100); // Small delay between removals
          }));
        }
      });

      Promise.all(promises).then(() => {
        console.log(`🧹 Removed ${removedCount} non-essential cookies`);
        
        // Trigger rescan
        setTimeout(() => {
          chrome.runtime.sendMessage({
            action: "scanCookies",
            url: targetUrl
          });
        }, 500);
        
        sendResponse({ success: true, removed: removedCount });
      });
    });

    return true;
  }

  // ✅ Accept all cookies
  if (request.action === "acceptAllCookies") {
    console.log("✅ User accepted all cookies");
    // Clear any previous blocking preferences
    chrome.storage.local.clear(() => {
      console.log("🧹 Cleared cookie blocking preferences");
      sendResponse({ success: true });
    });
    return true;
  }

  // 📄 Terms summarization (future enhancement)
  if (request.action === "summarizeTerms") {
    console.log("📄 Terms summarization requested");
    // This can be enhanced with AI summarization
    sendResponse({ summary: "Terms summarization feature coming soon!" });
    return true;
  }

  sendResponse({ error: "Unknown action" });
  return true;
});

// 🎯 Enhanced error handling
chrome.runtime.onStartup.addListener(() => {
  console.log("🚀 Enhanced Cookie Guard startup complete");
});

// 📊 Performance monitoring
setInterval(() => {
  chrome.storage.local.getBytesInUse(null, (bytes) => {
    if (bytes > 1000000) { // 1MB threshold
      console.warn("⚠️ Storage usage high:", bytes, "bytes");
    }
  });
}, 300000); // Check every 5 minutes

console.log("🎉 Enhanced Cookie Guard Background Script loaded successfully!");
