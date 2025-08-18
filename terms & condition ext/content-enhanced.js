// Enhanced Content script for Terms & Conditions detection
class AdvancedTermsDetector {
  constructor() {
    this.detector = new EnhancedTermsDetector();
    this.textProcessor = new TextProcessor();
    this.smartCache = new SmartCache();
    
    this.hasShownNotification = false;
    this.isProcessing = false;
    this.lastAnalysisHash = null;
    this.observerActive = false;
    
    // Performance monitoring
    this.performanceMetrics = {
      detectionTime: 0,
      processingTime: 0,
      cacheHits: 0
    };

    this.init();
  }

  init() {
    // Enhanced initialization with performance tracking
    const startTime = performance.now();
    
    // Only run detection after page is fully loaded
    if (document.readyState === "complete") {
      this.detectTermsAndConditions();
    } else {
      window.addEventListener("load", () => {
        this.detectTermsAndConditions();
      });
    }

    this.setupAdvancedObserver();
    this.performanceMetrics.detectionTime = performance.now() - startTime;
  }

  async detectTermsAndConditions() {
    if (this.hasShownNotification) return;

    const startTime = performance.now();
    
    try {
      // Use enhanced detector for better accuracy
      const termsElements = this.detector.detectTermsOnPage();
      
      if (termsElements.length > 0) {
        // Sort by confidence and select best candidates
        const bestElements = termsElements
          .filter(element => element.confidence > 0.6)
          .slice(0, 3);

        if (bestElements.length > 0) {
          await this.showEnhancedTermsDetected(bestElements);
        }
      }

      this.performanceMetrics.detectionTime = performance.now() - startTime;
    } catch (error) {
      console.error('Terms detection error:', error);
    }
  }

  async showEnhancedTermsDetected(elements) {
    if (this.hasShownNotification) return;
    this.hasShownNotification = true;

    // Remove any existing notification
    const existingNotification = document.getElementById("terms-ai-notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    // Calculate confidence score
    const avgConfidence = elements.reduce((sum, el) => sum + el.confidence, 0) / elements.length;
    const confidencePercent = Math.round(avgConfidence * 100);

    // Create enhanced floating notification
    const notification = document.createElement("div");
    notification.id = "terms-ai-notification";
    notification.className = "terms-ai-notification enhanced";
    notification.innerHTML = `
      <div class="terms-ai-content">
        <div class="notification-header">
          <h4>📋 Terms & Conditions Detected!</h4>
          <div class="confidence-indicator">
            <span class="confidence-score">${confidencePercent}% confident</span>
          </div>
        </div>
        <p>AI can analyze and summarize this legal document for you</p>
        <div class="notification-actions">
          <button id="summarize-btn" class="primary-btn">
            🤖 Analyze with AI
          </button>
          <button id="quick-scan-btn" class="secondary-btn">
            ⚡ Quick Scan
          </button>
        </div>
        <div class="notification-footer">
          <small>Found ${elements.length} relevant section${elements.length !== 1 ? 's' : ''}</small>
          <button id="close-notification" class="close-btn">×</button>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Add enhanced event listeners
    this.setupNotificationEvents(elements, notification);

    // Enhanced auto-hide with user preference
    const autoHideDelay = await this.getAutoHidePreference();
    if (autoHideDelay > 0) {
      setTimeout(() => {
        if (document.getElementById("terms-ai-notification")) {
          this.fadeOutNotification(notification);
        }
      }, autoHideDelay);
    }
  }

  setupNotificationEvents(elements, notification) {
    document.getElementById("summarize-btn").addEventListener("click", () => {
      if (!this.isProcessing) {
        this.extractAndAnalyze(elements, 'full');
      }
    });

    document.getElementById("quick-scan-btn").addEventListener("click", () => {
      if (!this.isProcessing) {
        this.extractAndAnalyze(elements, 'quick');
      }
    });

    document.getElementById("close-notification").addEventListener("click", () => {
      this.fadeOutNotification(notification);
    });

    // Click outside to dismiss
    document.addEventListener('click', (e) => {
      if (!notification.contains(e.target) && notification.parentNode) {
        this.fadeOutNotification(notification);
      }
    }, { once: true });
  }

  async extractAndAnalyze(elements, analysisType = 'full') {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const startTime = performance.now();

    try {
      // Extract and process text using enhanced text processor
      const extractedData = this.textProcessor.extractText(
        elements.map(el => el.element)
      );

      if (extractedData.text.length < 100) {
        this.showAnalysisModal("⚠️ Insufficient content found for meaningful analysis.");
        return;
      }

      // Optimize text for AI processing
      const optimizedData = this.textProcessor.optimizeForAI(extractedData.text);
      
      // Generate content hash for caching
      const contentHash = this.generateContentHash(optimizedData.text);
      
      // Check cache first
      const cachedResult = await this.smartCache.getSummary(window.location.href, contentHash);
      if (cachedResult && analysisType === 'full') {
        this.showAnalysisModal(cachedResult.summary, true);
        this.performanceMetrics.cacheHits++;
        return;
      }

      // Show enhanced loading state
      this.showEnhancedLoadingState(analysisType, optimizedData);

      // Send to background script for AI processing
      const message = {
        action: analysisType === 'quick' ? 'quickAnalysis' : 'summarizeTerms',
        text: optimizedData.text,
        url: window.location.href,
        contentHash: contentHash,
        metadata: {
          wordCount: optimizedData.finalLength,
          truncated: optimizedData.truncated,
          confidence: elements[0]?.confidence || 0
        }
      };

      chrome.runtime.sendMessage(message, (response) => {
        this.isProcessing = false;
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError);
          this.showAnalysisModal(
            "❌ Error connecting to AI service. Please check your API configuration."
          );
        }
      });

      this.performanceMetrics.processingTime = performance.now() - startTime;

    } catch (error) {
      this.isProcessing = false;
      console.error('Analysis error:', error);
      this.showAnalysisModal("❌ An error occurred during analysis. Please try again.");
    }
  }

  showEnhancedLoadingState(analysisType, optimizedData) {
    const loadingContent = `
      <div class="loading-state enhanced">
        <div class="loading-header">
          <h4>🤖 AI Analysis in Progress</h4>
          <div class="loading-indicator">
            <div class="spinner-container">
              <div class="spinner"></div>
            </div>
          </div>
        </div>
        
        <div class="analysis-info">
          <div class="info-item">
            <span class="label">Analysis Type:</span>
            <span class="value">${analysisType === 'quick' ? 'Quick Scan' : 'Full Analysis'}</span>
          </div>
          <div class="info-item">
            <span class="label">Content Size:</span>
            <span class="value">${optimizedData.finalLength} words</span>
          </div>
          ${optimizedData.truncated ? 
            '<div class="info-item warning">⚠️ Content optimized for AI processing</div>' : ''
          }
        </div>
        
        <div class="processing-steps">
          <div class="step completed">
            <span class="step-icon">✓</span>
            <span class="step-text">Content extracted</span>
          </div>
          <div class="step active">
            <span class="step-icon">🔄</span>
            <span class="step-text">AI analysis in progress</span>
          </div>
          <div class="step pending">
            <span class="step-icon">⏳</span>
            <span class="step-text">Results pending</span>
          </div>
        </div>
        
        <div class="estimated-time">
          <small>⏱️ Estimated completion: ${analysisType === 'quick' ? '10-15' : '20-30'} seconds</small>
        </div>
      </div>
    `;

    this.showAnalysisModal(loadingContent);
  }

  showAnalysisModal(content, isCached = false) {
    // Remove existing modal if any
    const existingModal = document.getElementById("terms-ai-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "terms-ai-modal";
    modal.className = `terms-ai-modal ${isCached ? 'cached-result' : ''}`;
    modal.innerHTML = `
      <div class="terms-ai-modal-content">
        <div class="terms-ai-header">
          <h3>📋 Terms & Conditions Analysis</h3>
          <div class="terms-ai-controls">
            <select id="language-select">
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
              <option value="pt">Português</option>
              <option value="ru">Русский</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
              <option value="ar">العربية</option>
            </select>
            <button id="export-btn" class="control-btn" title="Export Summary">
              📄 Export
            </button>
            <button id="share-btn" class="control-btn" title="Share Analysis">
              🔗 Share
            </button>
            <button id="close-modal" class="close-btn">×</button>
          </div>
        </div>
        <div class="terms-ai-body">
          <div id="summary-content">${content}</div>
        </div>
        <div class="terms-ai-footer">
          <button id="translate-btn" class="footer-btn">🌍 Translate</button>
          <button id="detailed-analysis" class="footer-btn">📊 Detailed Analysis</button>
          <button id="risk-assessment" class="footer-btn">⚠️ Risk Assessment</button>
          <button id="save-summary" class="footer-btn">💾 Save Summary</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Enhanced event listeners
    this.setupModalEvents(modal);
  }

  setupModalEvents(modal) {
    // Close modal
    document.getElementById("close-modal").addEventListener("click", () => {
      this.fadeOutModal(modal);
    });

    // Translate functionality
    document.getElementById("translate-btn").addEventListener("click", () => {
      const selectedLang = document.getElementById("language-select").value;
      const summaryContent = document.getElementById("summary-content").textContent;

      if (summaryContent && summaryContent.length > 10) {
        this.translateSummary(summaryContent, selectedLang);
      }
    });

    // Detailed analysis
    document.getElementById("detailed-analysis").addEventListener("click", () => {
      chrome.runtime.sendMessage({
        action: "detailedAnalysis",
        url: window.location.href,
        text: this.lastAnalyzedText
      });
    });

    // Risk assessment
    document.getElementById("risk-assessment").addEventListener("click", () => {
      this.showRiskAssessment();
    });

    // Export functionality
    document.getElementById("export-btn").addEventListener("click", () => {
      this.exportSummary();
    });

    // Share functionality  
    document.getElementById("share-btn").addEventListener("click", () => {
      this.shareSummary();
    });

    // Save summary
    document.getElementById("save-summary").addEventListener("click", () => {
      this.saveSummaryToHistory();
    });

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.fadeOutModal(modal);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.fadeOutModal(modal);
      }
    }, { once: true });
  }

  async translateSummary(text, targetLanguage) {
    const loadingIndicator = this.showTranslationLoading();
    
    try {
      chrome.runtime.sendMessage({
        action: "translateSummary",
        text: text,
        targetLanguage: targetLanguage,
      }, (response) => {
        this.hideTranslationLoading(loadingIndicator);
      });
    } catch (error) {
      this.hideTranslationLoading(loadingIndicator);
      console.error('Translation error:', error);
    }
  }

  showTranslationLoading() {
    const indicator = document.createElement('div');
    indicator.className = 'translation-loading';
    indicator.innerHTML = '🌍 Translating...';
    
    const summaryContent = document.getElementById('summary-content');
    summaryContent.appendChild(indicator);
    
    return indicator;
  }

  hideTranslationLoading(indicator) {
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }

  async exportSummary() {
    const summaryContent = document.getElementById("summary-content").textContent;
    const metadata = {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      title: document.title
    };

    const exportData = {
      summary: summaryContent,
      metadata: metadata
    };

    // Create downloadable file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terms-analysis-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  async shareSummary() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Terms & Conditions Analysis',
          text: 'AI analysis of terms and conditions',
          url: window.location.href
        });
      } catch (error) {
        console.log('Sharing failed:', error);
        this.copyToClipboard();
      }
    } else {
      this.copyToClipboard();
    }
  }

  copyToClipboard() {
    const summaryContent = document.getElementById("summary-content").textContent;
    navigator.clipboard.writeText(summaryContent).then(() => {
      this.showToast('Summary copied to clipboard!');
    });
  }

  async saveSummaryToHistory() {
    const summaryContent = document.getElementById("summary-content").innerHTML;
    const historyEntry = {
      url: window.location.href,
      title: document.title,
      summary: summaryContent,
      timestamp: Date.now(),
      id: Date.now().toString()
    };

    try {
      const result = await chrome.storage.local.get(['summaryHistory']);
      const history = result.summaryHistory || [];
      
      history.unshift(historyEntry);
      
      // Keep only last 50 entries
      if (history.length > 50) {
        history.splice(50);
      }

      await chrome.storage.local.set({ summaryHistory: history });
      this.showToast('Summary saved to history!');
    } catch (error) {
      console.error('Error saving to history:', error);
      this.showToast('Failed to save summary', 'error');
    }
  }

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `terms-ai-toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  setupAdvancedObserver() {
    if (this.observerActive) return;
    
    let timeout;
    const observer = new MutationObserver((mutations) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        // Only check if we haven't shown notification yet
        if (!this.hasShownNotification) {
          this.detectTermsAndConditions();
        }
      }, 2000);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    this.observerActive = true;
  }

  generateContentHash(text) {
    // Simple hash function for content identification
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  async getAutoHidePreference() {
    try {
      const result = await chrome.storage.sync.get(['autoHideDelay']);
      return result.autoHideDelay || 15000; // Default 15 seconds
    } catch (error) {
      return 15000;
    }
  }

  fadeOutNotification(notification) {
    if (notification && notification.parentNode) {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }

  fadeOutModal(modal) {
    if (modal && modal.parentNode) {
      modal.style.opacity = '0';
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }, 300);
    }
  }

  showRiskAssessment() {
    // Enhanced risk assessment visualization
    const riskContent = `
      <div class="risk-assessment-detailed">
        <h4>🛡️ Comprehensive Risk Assessment</h4>
        <div class="risk-categories">
          <div class="risk-category">
            <h5>🔒 Privacy Risks</h5>
            <div class="risk-items" id="privacy-risks">
              <div class="loading-risk">Analyzing privacy implications...</div>
            </div>
          </div>
          <div class="risk-category">
            <h5>💰 Financial Risks</h5>
            <div class="risk-items" id="financial-risks">
              <div class="loading-risk">Evaluating financial obligations...</div>
            </div>
          </div>
          <div class="risk-category">
            <h5>⚖️ Legal Risks</h5>
            <div class="risk-items" id="legal-risks">
              <div class="loading-risk">Assessing legal implications...</div>
            </div>
          </div>
        </div>
        <div class="risk-recommendations">
          <h5>💡 Risk Mitigation Recommendations</h5>
          <ul id="risk-recommendations-list">
            <li>📋 Review all terms carefully before accepting</li>
            <li>🔍 Pay special attention to data collection policies</li>
            <li>💾 Keep a copy of terms for your records</li>
            <li>⚖️ Understand dispute resolution procedures</li>
          </ul>
        </div>
      </div>
    `;

    document.getElementById('summary-content').innerHTML = riskContent;
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    switch (message.action) {
      case "displaySummary":
        const summaryModal = document.getElementById("terms-ai-modal");
        if (summaryModal) {
          document.getElementById("summary-content").innerHTML = message.summary;
        } else {
          const detector = new AdvancedTermsDetector();
          detector.showAnalysisModal(message.summary);
        }
        break;

      case "displayTranslation":
        const summaryContent = document.getElementById("summary-content");
        if (summaryContent) {
          summaryContent.innerHTML = message.translation;
        }
        break;

      case "forceDetection":
        const detector = new AdvancedTermsDetector();
        detector.hasShownNotification = false;
        detector.detectTermsAndConditions();
        break;

      default:
        console.log('Unknown message action:', message.action);
    }

    sendResponse({ received: true });
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ error: error.message });
  }
});

// Initialize when DOM is ready - but only once
if (!window.termsDetectorInitialized) {
  window.termsDetectorInitialized = true;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      new AdvancedTermsDetector();
    });
  } else {
    new AdvancedTermsDetector();
  }
}
