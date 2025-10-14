/* 🎨 ENHANCED COOKIE GUARD POPUP - STUNNING USER EXPERIENCE! 🎨 */

document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ Enhanced Popup script loaded");

    const scanBtn = document.getElementById("scanBtn");
    const acceptEssential = document.getElementById("acceptEssential");
    const acceptAll = document.getElementById("acceptAll");
    const cookieList = document.getElementById("cookieList");
    const settingsBtn = document.getElementById("settingsBtn");

    // Initialize enhanced features
    initializeEnhancedFeatures();
    loadCookieReport();
    updateStats();

    // 🔍 Enhanced scan with loading animation
    scanBtn.addEventListener("click", () => {
      showLoadingState();
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          chrome.runtime.sendMessage({
            action: "scanCookies",
            url: tabs[0].url,
          });
        }
      });
    });

    // 📩 Enhanced message handling
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === "showCookieReport") {
        hideLoadingState();
        renderEnhancedCookies(message.cookies);
        updateCategoryChart(message.cookies);
        updateStats();
      }
    });

    // 🧠 Load existing data with enhanced visualization
    function loadCookieReport() {
      chrome.storage.local.get("cookieReport", (data) => {
        console.log("data in popup", data);
        if (data.cookieReport) {
          renderEnhancedCookies(data.cookieReport);
          updateCategoryChart(data.cookieReport);
          updateStats();
        } else {
          showWelcomeState();
        }
      });
    }

    // 🎨 Enhanced cookie rendering with beautiful visualizations
    function renderEnhancedCookies(cookies) {
      cookieList.innerHTML = "";

      if (cookies.length === 0) {
        showEmptyState();
        return;
      }

      // Add statistics header
      const statsContainer = createStatsContainer(cookies);
      cookieList.appendChild(statsContainer);

      // Add category chart
      const categoryChart = createCategoryChart(cookies);
      cookieList.appendChild(categoryChart);

      // Render individual cookies with enhanced design
      cookies.forEach((cookie, index) => {
        const cookieEl = createEnhancedCookieElement(cookie, index);
        cookieList.appendChild(cookieEl);
      });

      // Add enhanced interaction handlers
      setupEnhancedInteractions();
    }

    // 📊 Create beautiful statistics container
    function createStatsContainer(cookies) {
      const stats = analyzeCookieStats(cookies);
      const container = document.createElement("div");
      container.className = "stats-container";
      
      container.innerHTML = `
        <div class="stat-card" title="Total cookies found on this page">
          <span class="stat-number">${cookies.length}</span>
          <span class="stat-label">Total Cookies</span>
        </div>
        <div class="stat-card" title="Essential cookies needed for website functionality">
          <span class="stat-number">${stats.essential}</span>
          <span class="stat-label">Essential</span>
        </div>
        <div class="stat-card" title="Tracking cookies that monitor your activity">
          <span class="stat-number">${stats.tracking}</span>
          <span class="stat-label">Tracking</span>
        </div>
        <div class="stat-card" title="High-risk cookies that pose privacy concerns">
          <span class="stat-number">${stats.highRisk}</span>
          <span class="stat-label">High Risk</span>
        </div>
      `;

      // Add animation delay for each card
      container.querySelectorAll('.stat-card').forEach((card, index) => {
        card.style.animationDelay = `${index * 0.15}s`;
        card.style.animation = 'slideInUp 0.6s ease-out forwards';
      });

      return container;
    }

    // 📈 Create interactive category chart
    function createCategoryChart(cookies) {
      const categories = categorizeCookies(cookies);
      const container = document.createElement("div");
      container.className = "category-chart";
      
      const maxCount = Math.max(...Object.values(categories));
      
      container.innerHTML = `
        <div class="chart-header">
          <h3 class="chart-title">🍪 Cookie Categories</h3>
        </div>
        <div class="chart-bars">
          ${Object.entries(categories).map(([category, count]) => `
            <div class="chart-bar">
              <div class="bar-label">${getCategoryIcon(category)} ${category}</div>
              <div class="bar-track">
                <div class="bar-fill ${category.toLowerCase()}" 
                     style="width: ${(count / maxCount) * 100}%"
                     data-count="${count}">
                </div>
              </div>
              <div class="bar-count">${count}</div>
            </div>
          `).join('')}
        </div>
      `;

      // Animate bars on load
      setTimeout(() => {
        container.querySelectorAll('.bar-fill').forEach((bar, index) => {
          bar.style.animationDelay = `${index * 0.2}s`;
          bar.style.animation = 'slideInRight 0.8s ease-out forwards';
        });
      }, 100);

      return container;
    }

    // 🍪 Create enhanced cookie element with modern design
    function createEnhancedCookieElement(cookie, index) {
      const cookieEl = document.createElement("div");
      cookieEl.className = "cookie-item";
      cookieEl.style.animationDelay = `${index * 0.1}s`;

      const riskClass = cookie.riskLevel ? `risk-${cookie.riskLevel.toLowerCase()}` : "risk-low";
      const riskIcon = getRiskIcon(cookie.riskLevel);
      const purposeIcon = getPurposeIcon(cookie.purpose);

      cookieEl.innerHTML = `
        <h3>${purposeIcon} ${cookie.name}</h3>
        <div class="cookie-details">
          <p><strong>🌐 Domain:</strong> ${cookie.domain}</p>
          <p><strong>🔗 Type:</strong> ${cookie.isThirdParty ? "🔗 Third-Party" : "🏠 First-Party"}</p>
          <p><strong>${riskIcon} Risk Level:</strong> <span class="${riskClass}">${cookie.riskLevel || "Low"}</span></p>
          <p><strong>🎯 Purpose:</strong> ${cookie.purpose}</p>
          <p><strong>⚡ Essential:</strong> ${cookie.isEssential ? "✅ Yes" : "❌ No"}</p>
          ${cookie.expires ? `<p><strong>⏰ Expires:</strong> ${cookie.expires}</p>` : ''}
          ${cookie.secure ? `<p><strong>🔒 Secure:</strong> ✅ Yes</p>` : ''}
          ${cookie.httpOnly ? `<p><strong>🚫 HTTP Only:</strong> ✅ Yes</p>` : ''}
        </div>
        
        <div class="cookie-toggle-container">
          <label>
            <input type="checkbox" class="cookie-toggle" 
                  data-name="${cookie.name}" 
                  data-domain="${cookie.domain}" 
                  ${cookie.isEssential ? "checked disabled" : "checked"}>
            <span>${cookie.isEssential ? "🛡️ Required (Essential)" : "🍪 Allow this cookie"}</span>
          </label>
          ${!cookie.isEssential ? `
            <div class="risk-explanation">
              ${getRiskExplanation(cookie.riskLevel, cookie.purpose)}
            </div>
          ` : ''}
        </div>
      `;

      return cookieEl;
    }

    // 🎭 Enhanced interaction setup
    function setupEnhancedInteractions() {
      document.querySelectorAll(".cookie-toggle").forEach((toggle) => {
        toggle.addEventListener("change", (e) => {
          const cookieName = e.target.dataset.name;
          const cookieDomain = e.target.dataset.domain;
          const isAllowed = e.target.checked;

          // Add visual feedback
          const container = e.target.closest('.cookie-item');
          container.style.transform = 'scale(1.02)';
          setTimeout(() => {
            container.style.transform = '';
          }, 200);

          chrome.runtime.sendMessage({
            action: "updateCookieSetting",
            cookieName,
            cookieDomain,
            isAllowed,
          });
        });
      });

      // Add hover effects for cookie items
      document.querySelectorAll('.cookie-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
          item.style.transform = 'translateY(-2px) scale(1.01)';
        });
        
        item.addEventListener('mouseleave', () => {
          item.style.transform = '';
        });
      });
    }

    // ✅ Enhanced accept essential with visual feedback
    acceptEssential.addEventListener("click", () => {
      showActionFeedback(acceptEssential, "⚡ Keeping Essential Only...");
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          chrome.runtime.sendMessage({ 
            action: "acceptEssentialCookies",
            url: tabs[0].url 
          });
        }
      });
    });

    // ✅ Enhanced accept all with visual feedback
    acceptAll.addEventListener("click", () => {
      showActionFeedback(acceptAll, "🍪 Accepting All Cookies...");
      chrome.runtime.sendMessage({ action: "acceptAllCookies" });
    });

    // ⚙️ Settings button handler
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        chrome.runtime.openOptionsPage();
      });
    }

    // 🎨 Enhanced visual states
    function showLoadingState() {
      cookieList.innerHTML = `
        <div class="loading">
          <div class="loading-spinner"></div>
          <div class="loading-text">🔍 Scanning for cookies...</div>
          <div class="loading-text" style="font-size: 12px; opacity: 0.8;">Analyzing privacy implications</div>
        </div>
      `;
    }

    function hideLoadingState() {
      const loading = cookieList.querySelector('.loading');
      if (loading) {
        loading.style.opacity = '0';
        setTimeout(() => loading.remove(), 300);
      }
    }

    function showWelcomeState() {
      cookieList.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 48px; margin-bottom: 16px; animation: bounceIcon 2s ease-in-out infinite;">🍪</div>
          <h3 style="color: #374151; margin-bottom: 8px;">Welcome to Cookie Guard!</h3>
          <p style="color: #6b7280; margin-bottom: 20px;">Click "Scan Current Page" to analyze cookies and protect your privacy</p>
          <div style="display: flex; gap: 8px; justify-content: center; opacity: 0.6;">
            <span>🛡️</span>
            <span>🔍</span>
            <span>📊</span>
            <span>⚡</span>
          </div>
        </div>
      `;
    }

    function showEmptyState() {
      cookieList.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
          <h3 style="color: #059669; margin-bottom: 8px;">No Cookies Found!</h3>
          <p style="color: #6b7280;">This page doesn't set any cookies. Your privacy is protected!</p>
        </div>
      `;
    }

    function showActionFeedback(button, text) {
      const originalText = button.innerHTML;
      button.innerHTML = text;
      button.style.opacity = '0.7';
      button.disabled = true;
      
      setTimeout(() => {
        button.innerHTML = originalText;
        button.style.opacity = '';
        button.disabled = false;
      }, 2000);
    }

    // 📊 Helper functions for enhanced features
    function analyzeCookieStats(cookies) {
      return {
        essential: cookies.filter(c => c.isEssential).length,
        tracking: cookies.filter(c => 
          c.purpose.toLowerCase().includes('analytics') || 
          c.purpose.toLowerCase().includes('marketing') ||
          c.purpose.toLowerCase().includes('tracking')).length,
        thirdParty: cookies.filter(c => c.isThirdParty).length,
        highRisk: cookies.filter(c => c.riskLevel === 'High').length,
        mediumRisk: cookies.filter(c => c.riskLevel === 'Medium').length,
        lowRisk: cookies.filter(c => c.riskLevel === 'Low').length
      };
    }

    function categorizeCookies(cookies) {
      const categories = {};
      cookies.forEach(cookie => {
        const category = getCookieCategory(cookie);
        categories[category] = (categories[category] || 0) + 1;
      });
      return categories;
    }

    function getCookieCategory(cookie) {
      const purpose = cookie.purpose.toLowerCase();
      if (purpose.includes('analytics')) return 'Analytics';
      if (purpose.includes('marketing') || purpose.includes('advertising')) return 'Marketing';
      if (cookie.isEssential) return 'Essential';
      return 'Tracking';
    }

    function getCategoryIcon(category) {
      const icons = {
        'Analytics': '📊',
        'Marketing': '📢',
        'Essential': '⚡',
        'Tracking': '👁️'
      };
      return icons[category] || '🍪';
    }

    function getRiskIcon(riskLevel) {
      const icons = {
        'High': '🚨',
        'Medium': '⚠️',
        'Low': '✅'
      };
      return icons[riskLevel] || '✅';
    }

    function getPurposeIcon(purpose) {
      const purposeLower = purpose.toLowerCase();
      if (purposeLower.includes('analytics')) return '📊';
      if (purposeLower.includes('marketing') || purposeLower.includes('advertising')) return '📢';
      if (purposeLower.includes('session')) return '🔐';
      if (purposeLower.includes('auth')) return '🗝️';
      if (purposeLower.includes('security')) return '🛡️';
      if (purposeLower.includes('performance')) return '⚡';
      if (purposeLower.includes('social')) return '👥';
      if (purposeLower.includes('tracking')) return '👁️';
      return '🍪';
    }

    function getRiskExplanation(riskLevel, purpose) {
      const explanations = {
        'High': '⚠️ This cookie may track you across websites and collect personal data for advertising purposes.',
        'Medium': '🔍 This cookie collects usage data for analytics. It helps improve the website but tracks your behavior.',
        'Low': '✅ This cookie is necessary for basic website functionality and poses minimal privacy risk.'
      };
      
      return explanations[riskLevel] || explanations['Low'];
    }

    function updateCategoryChart(cookies) {
      // This will be called when new data is available
      const existingChart = document.querySelector('.category-chart');
      if (existingChart) {
        const newChart = createCategoryChart(cookies);
        existingChart.replaceWith(newChart);
      }
    }

    function updateStats() {
      chrome.storage.local.get(['cookieReport'], (data) => {
        if (data.cookieReport) {
          const stats = analyzeCookieStats(data.cookieReport);
          const statCards = document.querySelectorAll('.stat-number');
          if (statCards.length >= 3) {
            statCards[0].textContent = data.cookieReport.length;
            statCards[1].textContent = stats.essential;
            statCards[2].textContent = stats.tracking;
          }
        }
      });
    }

    function initializeEnhancedFeatures() {
      // Add any initialization code for enhanced features
      console.log("🎨 Enhanced features initialized");
      
      // Add keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        if (e.key === 's' && e.ctrlKey) {
          e.preventDefault();
          scanBtn.click();
        }
        if (e.key === 'e' && e.ctrlKey) {
          e.preventDefault();
          acceptEssential.click();
        }
        if (e.key === 'a' && e.ctrlKey) {
          e.preventDefault();
          acceptAll.click();
        }
      });
    }

    // Terms summary handling with enhanced UI
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === "TERMS_SUMMARY") {
        showEnhancedTermsSummary(msg.summary);
      }
    });

    function showEnhancedTermsSummary(summary) {
      const termsSection = document.createElement('div');
      termsSection.className = 'section';
      termsSection.id = 'terms-section';
      
      termsSection.innerHTML = `
        <h3>📄 Terms Summary</h3>
        <div id="terms-summary">${summary}</div>
        <div class="actions">
          <button id="accept-terms">✅ Accept Terms</button>
          <button id="reject-terms">❌ Reject Terms</button>
        </div>
      `;
      
      cookieList.appendChild(termsSection);
      
      // Add event listeners for terms buttons
      document.getElementById('accept-terms').addEventListener('click', () => {
        chrome.tabs.query({active: true}, ([tab]) => {
          chrome.tabs.sendMessage(tab.id, {type: "TERMS_ACCEPTED"});
        });
        termsSection.remove();
      });
      
      document.getElementById('reject-terms').addEventListener('click', () => {
        chrome.tabs.query({active: true}, ([tab]) => {
          chrome.tabs.sendMessage(tab.id, {type: "TERMS_REJECTED"});
        });
        termsSection.remove();
      });
    }
  });
