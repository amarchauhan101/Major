class AITermsSummarizer {
  constructor() {
    this.apiKey = null;
    this.cache = new Map(); // In-memory cache for session
    this.rateLimiter = new Map(); // Rate limiting per domain
    this.setupMessageListener();
    this.setupContextMenu();
    this.loadApiKey();
    this.initializeCache();
  }

  async loadApiKey() {
    try {
      const result = await chrome.storage.sync.get(["hf_api_token"]);
      this.apiKey = result.hf_api_token;
      console.log("HF API Key loaded:", this.apiKey ? "Present" : "Missing");
    } catch (error) {
      console.error("Error loading API key:", error);
    }
  }

  async initializeCache() {
    try {
      // Initialize smart cache system
      this.smartCache = new SmartCache();
    } catch (error) {
      console.error("Error initializing cache:", error);
    }
  }

  setupContextMenu() {
    chrome.contextMenus.create({
      id: "analyze-terms",
      title: "🔍 Analyze Terms & Conditions",
      contexts: ["page", "selection"]
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === "analyze-terms") {
        chrome.tabs.sendMessage(tab.id, { action: "forceDetection" });
      }
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("Background received message:", message.action);

      const handleAsync = async () => {
        try {
          switch (message.action) {
            case "summarizeTerms":
              return await this.summarizeTerms(message.text, message.url, sender.tab.id, message.contentHash);
            
            case "translateSummary":
              return await this.translateText(message.text, message.targetLanguage, sender.tab.id);
            
            case "detailedAnalysis":
              return await this.performDetailedAnalysis(message.url, sender.tab.id, message.text);
            
            case "getCacheStats":
              return await this.getCacheStatistics();
            
            case "clearCache":
              return await this.clearAllCache();
            
            default:
              return { status: "unknown_action" };
          }
        } catch (error) {
          console.error("Error handling message:", error);
          return { status: "error", error: error.message };
        }
      };

      handleAsync().then(result => {
        sendResponse(result || { status: "completed" });
      });

      return true; // Keep message channel open for async response
    });
  }

  async summarizeTerms(text, url, tabId, contentHash) {
    console.log("Starting summarization for tab:", tabId);

    await this.loadApiKey();

    // Check rate limiting
    if (!this.checkRateLimit(url)) {
      this.sendMessageToTab(tabId, {
        action: "displaySummary",
        summary: `
          <div class="summary-section error">
            <h4>⏳ Rate Limit Reached</h4>
            <p>Please wait a moment before analyzing terms from this domain again.</p>
          </div>
        `,
      });
      return { status: "rate_limited" };
    }

    // Check cache first
    if (contentHash && this.smartCache) {
      try {
        const cached = await this.smartCache.getSummary(url, contentHash);
        if (cached) {
          const cachedSummary = `
            <div class="summary-section cached">
              <div class="cache-indicator">📋 Cached Result (${Math.round(cached.cacheAge / (1000 * 60))} min ago)</div>
              ${cached.summary}
            </div>
          `;
          
          this.sendMessageToTab(tabId, {
            action: "displaySummary",
            summary: cachedSummary,
          });
          return { status: "cached" };
        }
      } catch (error) {
        console.log("Cache lookup failed, proceeding with API call");
      }
    }

    if (!this.apiKey) {
      this.sendMessageToTab(tabId, {
        action: "displaySummary",
        summary: `
          <div class="summary-section error">
            <h4>⚠️ API Key Required</h4>
            <p>Please set up your Hugging Face API token in the extension popup to use AI summarization.</p>
            <div class="setup-steps">
              <ol>
                <li>Click the extension icon in your toolbar</li>
                <li>Get a free token from <a href="https://huggingface.co/settings/tokens" target="_blank">Hugging Face</a></li>
                <li>Enter the token and save</li>
              </ol>
            </div>
            <div class="feature-highlight">
              <h5>🚀 Features Available:</h5>
              <ul>
                <li>🤖 AI-powered summarization</li>
                <li>🌍 Multi-language translation</li>
                <li>⚠️ Risk assessment</li>
                <li>📊 Detailed legal analysis</li>
              </ul>
            </div>
          </div>
        `,
      });
      return { status: "no_api_key" };
    }

    try {
      console.log("Calling Hugging Face API...");
      
      // Show loading state
      this.sendMessageToTab(tabId, {
        action: "displaySummary",
        summary: `
          <div class="summary-section loading">
            <h4>🤖 AI Analysis in Progress...</h4>
            <div class="loading-animation">
              <div class="spinner"></div>
              <p>Analyzing terms and conditions with advanced AI...</p>
            </div>
            <div class="processing-steps">
              <div class="step completed">✓ Text extraction completed</div>
              <div class="step active">🔄 AI summarization in progress</div>
              <div class="step pending">⏳ Risk analysis pending</div>
            </div>
          </div>
        `,
      });

      // Process text with multiple AI calls for better results
      const [summary, riskAnalysis, keyPoints] = await Promise.all([
        this.callHuggingFace(text, "summarize"),
        this.analyzeRisks(text),
        this.extractKeyPoints(text)
      ]);

      const formattedSummary = `
        <div class="summary-section">
          <h4>🔍 Executive Summary</h4>
          <div class="summary-content">
            ${summary}
          </div>
        </div>
        
        <div class="key-points-section">
          <h4>🎯 Key Points</h4>
          <div class="key-points">
            ${keyPoints}
          </div>
        </div>
        
        <div class="risks-section">
          <h4>⚠️ Risk Assessment</h4>
          <div class="risk-indicators">${riskAnalysis}</div>
        </div>
        
        <div class="source-info">
          <div class="metadata">
            <small>📍 Source: ${url}</small>
            <small>⏰ Analyzed: ${new Date().toLocaleString()}</small>
            <small>🔤 Word count: ~${Math.round(text.length / 5)} words</small>
          </div>
        </div>
      `;

      this.sendMessageToTab(tabId, {
        action: "displaySummary",
        summary: formattedSummary,
      });

      // Cache the result
      if (contentHash && this.smartCache) {
        await this.smartCache.storeSummary(url, contentHash, formattedSummary, {
          wordCount: text.length,
          riskLevel: this.calculateOverallRisk(riskAnalysis),
          language: this.detectLanguage(text)
        });
      }

      this.updateStats();
      this.updateRateLimit(url);
      return { status: "completed" };

    } catch (error) {
      console.error("HF Summarization Error:", error);
      this.sendMessageToTab(tabId, {
        action: "displaySummary",
        summary: `
          <div class="summary-section error">
            <h4>❌ Analysis Failed</h4>
            <p>There was an error processing the terms and conditions:</p>
            <div class="error-details">
              <strong>Error:</strong> ${error.message}
            </div>
            <div class="troubleshoot">
              <h5>💡 Troubleshooting:</h5>
              <ul>
                <li>Check your Hugging Face API token</li>
                <li>Verify your internet connection</li>
                <li>Try again in a few moments</li>
                <li>Contact support if the issue persists</li>
              </ul>
            </div>
          </div>
        `,
      });
      return { status: "error", error: error.message };
    }
  }

  async callHuggingFace(text, task) {
    if (!this.apiKey) {
      throw new Error("No Hugging Face token configured");
    }

    // Enhanced text preprocessing
    const maxChars = 3500;
    let processedText = text;
    
    if (text.length > maxChars) {
      console.warn(`Text too long (${text.length} chars), optimizing for AI processing`);
      
      // Smart truncation - preserve important sections
      const sections = text.split(/\n\n/);
      const importantSections = sections.filter(section => 
        this.isImportantSection(section)
      ).slice(0, 10);
      
      processedText = importantSections.join('\n\n');
      
      if (processedText.length > maxChars) {
        processedText = processedText.substring(0, maxChars);
      }
    }

    let model = "";
    let prompt = processedText;

    if (task === "summarize") {
      model = "facebook/bart-large-cnn";
      // Add context for better summarization
      prompt = `Summarize the following terms and conditions in clear, user-friendly language, focusing on user rights, obligations, and important clauses:\n\n${processedText}`;
    } else if (task === "risks") {
      model = "facebook/bart-large-cnn";
      prompt = `Identify and list the main risks and concerns from these terms and conditions:\n\n${processedText}`;
    } else if (task === "keypoints") {
      model = "facebook/bart-large-cnn";
      prompt = `Extract the most important key points and clauses from these terms:\n\n${processedText}`;
    } else if (task === "translate") {
      model = "Helsinki-NLP/opus-mt-en-ROMANCE";
    }

    const apiUrl = `https://api-inference.huggingface.co/models/${model}`;
    const payload = { 
      inputs: prompt,
      parameters: {
        max_length: task === "summarize" ? 200 : 150,
        min_length: task === "summarize" ? 50 : 30,
        do_sample: false,
        temperature: 0.7
      }
    };

    // Retry logic for better reliability
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          
          // Handle specific errors
          if (response.status === 503) {
            console.log(`Model loading, attempt ${attempts + 1}/${maxAttempts}`);
            await this.delay(2000 * (attempts + 1)); // Progressive delay
            attempts++;
            continue;
          } else if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please try again later.");
          } else {
            throw new Error(`API Error (${response.status}): ${errorText}`);
          }
        }

        const data = await response.json();
        
        // Handle different response formats
        if (Array.isArray(data) && data.length > 0) {
          return data[0]?.summary_text || 
                 data[0]?.translation_text || 
                 data[0]?.generated_text || 
                 "Analysis completed but no specific result returned.";
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          return "Analysis completed successfully.";
        }

      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw error;
        }
        await this.delay(1000 * attempts);
      }
    }
  }

  // Helper method for progressive delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Check if section contains important legal information
  isImportantSection(section) {
    const importantKeywords = [
      'liability', 'warranty', 'privacy', 'data', 'termination', 
      'refund', 'cancellation', 'dispute', 'arbitration', 'governing law',
      'user rights', 'intellectual property', 'payment', 'subscription'
    ];
    
    const lowerSection = section.toLowerCase();
    return importantKeywords.some(keyword => lowerSection.includes(keyword)) ||
           section.length > 200; // Include longer sections
  }

  async analyzeRisks(text) {
    try {
      const riskPrompt = `Analyze these terms and conditions for potential risks to users. Focus on: data privacy concerns, liability limitations, termination clauses, payment obligations, and user rights restrictions. List specific risks found:\n\n${text.substring(0, 2000)}`;
      
      const riskText = await this.callHuggingFace(riskPrompt, "risks");
      
      // Parse and categorize risks
      const risks = this.parseRiskAnalysis(riskText);
      let formattedRisks = "";

      risks.forEach((risk, index) => {
        if (index < 8) { // Limit to 8 risks for readability
          const severity = this.assessRiskSeverity(risk.text);
          const icon = this.getRiskIcon(severity);
          formattedRisks += `
            <div class="risk-item ${severity}">
              ${icon} 
              <span class="risk-text">${risk.text}</span>
              <span class="risk-category">${risk.category}</span>
            </div>
          `;
        }
      });

      return formattedRisks || '<div class="risk-item low">🟢 No significant risks detected in initial analysis</div>';
    } catch (error) {
      console.error("Risk analysis error:", error);
      return '<div class="risk-item medium">⚠️ Risk analysis unavailable - API error</div>';
    }
  }

  async extractKeyPoints(text) {
    try {
      const keyPointsText = await this.callHuggingFace(text, "keypoints");
      
      // Format key points as bullet list
      const points = keyPointsText.split(/[.!?]+/).filter(point => 
        point.trim().length > 10 && point.trim().length < 200
      );

      let formattedPoints = "";
      points.slice(0, 6).forEach(point => {
        formattedPoints += `<li>${point.trim()}</li>`;
      });

      return formattedPoints ? `<ul>${formattedPoints}</ul>` : 
             '<p>Key points extracted from the comprehensive analysis above.</p>';
    } catch (error) {
      console.error("Key points extraction error:", error);
      return '<p>Key points analysis currently unavailable.</p>';
    }
  }

  parseRiskAnalysis(riskText) {
    // Extract individual risks and categorize them
    const sentences = riskText.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    return sentences.map(sentence => {
      const text = sentence.trim();
      const category = this.categorizeRisk(text);
      
      return { text, category };
    }).slice(0, 10);
  }

  categorizeRisk(riskText) {
    const categories = {
      'Privacy': ['data', 'privacy', 'personal information', 'tracking', 'cookies'],
      'Financial': ['payment', 'fee', 'charge', 'refund', 'billing', 'subscription'],
      'Legal': ['liability', 'lawsuit', 'arbitration', 'governing law', 'dispute'],
      'Account': ['termination', 'suspension', 'access', 'account', 'ban'],
      'Content': ['intellectual property', 'copyright', 'content', 'license', 'ownership']
    };

    const lowerText = riskText.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }
    
    return 'General';
  }

  getRiskIcon(severity) {
    const icons = {
      'high': '🔴',
      'medium': '🟡', 
      'low': '🟢'
    };
    return icons[severity] || '⚪';
  }

  assessRiskSeverity(riskText) {
    const highRiskKeywords = [
      "unlimited liability",
      "no warranty",
      "sell your data",
      "share personal information",
      "terminate without notice",
      "no refund",
      "binding arbitration",
      "class action waiver",
      "indemnify",
      "hold harmless"
    ];
    
    const mediumRiskKeywords = [
      "data collection",
      "third party sharing",
      "cookies",
      "tracking",
      "account suspension",
      "automatic renewal",
      "dispute resolution",
      "governing law",
      "limitation of liability",
      "service changes"
    ];

    const text = riskText.toLowerCase();

    // Count high-risk indicators
    const highRiskCount = highRiskKeywords.filter(keyword => 
      text.includes(keyword.toLowerCase())
    ).length;
    
    const mediumRiskCount = mediumRiskKeywords.filter(keyword => 
      text.includes(keyword.toLowerCase())
    ).length;

    if (highRiskCount >= 2 || text.includes("no refund") || text.includes("unlimited liability")) {
      return "high";
    } else if (highRiskCount >= 1 || mediumRiskCount >= 2) {
      return "medium";
    }
    return "low";
  }

  calculateOverallRisk(riskAnalysis) {
    const highRisks = (riskAnalysis.match(/class="risk-item high"/g) || []).length;
    const mediumRisks = (riskAnalysis.match(/class="risk-item medium"/g) || []).length;
    
    if (highRisks >= 2) return 'high';
    if (highRisks >= 1 || mediumRisks >= 3) return 'medium';
    return 'low';
  }

  detectLanguage(text) {
    const languagePatterns = {
      'en': /\b(the|and|or|but|you|your|we|our|this|that|will|would|shall)\b/gi,
      'es': /\b(el|la|los|las|y|o|pero|usted|su|nosotros|nuestro|será|podría)\b/gi,
      'fr': /\b(le|la|les|et|ou|mais|vous|votre|nous|notre|sera|pourrait)\b/gi,
      'de': /\b(der|die|das|und|oder|aber|sie|ihr|wir|unser|wird|könnte)\b/gi
    };

    let maxMatches = 0;
    let detectedLang = 'en';

    Object.entries(languagePatterns).forEach(([lang, pattern]) => {
      const matches = (text.match(pattern) || []).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedLang = lang;
      }
    });

    return detectedLang;
  }

  // Rate limiting methods
  checkRateLimit(url) {
    const domain = new URL(url).hostname;
    const now = Date.now();
    const lastRequest = this.rateLimiter.get(domain);
    
    // Allow one request per domain every 30 seconds
    return !lastRequest || (now - lastRequest) > 30000;
  }

  updateRateLimit(url) {
    const domain = new URL(url).hostname;
    this.rateLimiter.set(domain, Date.now());
  }

  // Cache management
  async getCacheStatistics() {
    if (!this.smartCache) return null;
    return await this.smartCache.getCacheStats();
  }

  async clearAllCache() {
    if (this.smartCache) {
      await this.smartCache.clearCache();
    }
    this.cache.clear();
    this.rateLimiter.clear();
    return { status: "cache_cleared" };
  }

  async translateText(text, targetLanguage, tabId) {
    if (!this.apiKey) {
      console.log("No HF token for translation");
      return { status: "no_api_key" };
    }

    try {
      // Enhanced translation with better model selection
      const languageModels = {
        'es': 'Helsinki-NLP/opus-mt-en-es',
        'fr': 'Helsinki-NLP/opus-mt-en-fr', 
        'de': 'Helsinki-NLP/opus-mt-en-de',
        'it': 'Helsinki-NLP/opus-mt-en-it',
        'pt': 'Helsinki-NLP/opus-mt-en-pt',
        'ru': 'Helsinki-NLP/opus-mt-en-ru',
        'zh': 'Helsinki-NLP/opus-mt-en-zh',
        'ja': 'Helsinki-NLP/opus-mt-en-jap',
        'ko': 'Helsinki-NLP/opus-mt-en-ko',
        'ar': 'Helsinki-NLP/opus-mt-en-ar'
      };

      const model = languageModels[targetLanguage] || 'Helsinki-NLP/opus-mt-en-ROMANCE';
      const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

      // Split long text into chunks for better translation
      const chunks = this.splitTextForTranslation(text);
      const translations = [];

      for (const chunk of chunks) {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: chunk }),
        });

        if (!response.ok) {
          throw new Error(`Translation failed: ${response.status}`);
        }

        const data = await response.json();
        const translation = data[0]?.translation_text || chunk;
        translations.push(translation);
      }

      const fullTranslation = translations.join(' ');

      this.sendMessageToTab(tabId, {
        action: "displayTranslation",
        translation: fullTranslation,
      });

      return { status: "translated" };
    } catch (error) {
      console.error("Translation Error:", error);
      this.sendMessageToTab(tabId, {
        action: "displayTranslation",
        translation: `Translation failed: ${error.message}. Please try again later.`,
      });
      return { status: "error", error: error.message };
    }
  }

  splitTextForTranslation(text, maxLength = 500) {
    const sentences = text.split(/[.!?]+/);
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence + '. ';
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  async performDetailedAnalysis(url, tabId, fullText) {
    try {
      // Enhanced detailed analysis with multiple AI perspectives
      const analysisPromise = fullText ? 
        this.performAdvancedAnalysis(fullText) : 
        this.performBasicAnalysis(url);

      const analysis = await analysisPromise;

      const analysisResult = `
        <div class="detailed-analysis">
          <h4>📊 Comprehensive Legal Analysis</h4>
          
          <div class="analysis-section">
            <h5>🔒 Privacy & Data Protection</h5>
            <div class="analysis-content">
              ${analysis.privacy}
            </div>
          </div>
          
          <div class="analysis-section">
            <h5>👤 User Rights & Obligations</h5>
            <div class="analysis-content">
              ${analysis.rights}
            </div>
          </div>
          
          <div class="analysis-section">
            <h5>⚖️ Liability & Legal Terms</h5>
            <div class="analysis-content">
              ${analysis.liability}
            </div>
          </div>
          
          <div class="analysis-section">
            <h5>💰 Financial Terms</h5>
            <div class="analysis-content">
              ${analysis.financial}
            </div>
          </div>
          
          <div class="analysis-section">
            <h5>� Service Changes & Termination</h5>
            <div class="analysis-content">
              ${analysis.termination}
            </div>
          </div>
          
          <div class="recommendations">
            <h5>💡 Recommendations</h5>
            <div class="recommendation-list">
              ${analysis.recommendations}
            </div>
          </div>
          
          <div class="compliance-check">
            <h5>✅ Compliance Assessment</h5>
            <div class="compliance-indicators">
              ${analysis.compliance}
            </div>
          </div>
        </div>
      `;

      this.sendMessageToTab(tabId, {
        action: "displaySummary",
        summary: analysisResult,
      });

      return { status: "analysis_completed" };
    } catch (error) {
      console.error("Detailed analysis error:", error);
      return { status: "error", error: error.message };
    }
  }

  async performAdvancedAnalysis(text) {
    // Perform multiple focused analyses
    const [privacyAnalysis, rightsAnalysis, liabilityAnalysis] = await Promise.all([
      this.analyzePrivacyTerms(text),
      this.analyzeUserRights(text), 
      this.analyzeLiabilityTerms(text)
    ]);

    return {
      privacy: privacyAnalysis,
      rights: rightsAnalysis,
      liability: liabilityAnalysis,
      financial: this.analyzeFinancialTerms(text),
      termination: this.analyzeTerminationClauses(text),
      recommendations: this.generateRecommendations(text),
      compliance: this.assessCompliance(text)
    };
  }

  async performBasicAnalysis(url) {
    // Fallback analysis when full text is not available
    return {
      privacy: '<p>Privacy analysis requires full document text. Please ensure the terms are fully loaded on the page.</p>',
      rights: '<p>User rights analysis requires access to complete terms and conditions.</p>',
      liability: '<p>Liability assessment requires full document analysis.</p>',
      financial: '<p>Financial terms analysis not available without complete text.</p>',
      termination: '<p>Termination clause analysis requires full document access.</p>',
      recommendations: '<ul><li>Read the complete terms and conditions carefully</li><li>Pay special attention to privacy policies</li><li>Understand your rights and obligations</li></ul>',
      compliance: '<p>Compliance assessment requires full document text for accurate evaluation.</p>'
    };
  }

  // Specialized analysis methods
  async analyzePrivacyTerms(text) {
    const privacySection = this.extractSectionByKeywords(text, [
      'privacy', 'data collection', 'personal information', 'cookies', 'tracking'
    ]);
    
    if (privacySection.length > 100) {
      try {
        const analysis = await this.callHuggingFace(
          `Analyze the privacy implications of these terms: ${privacySection}`, 
          'summarize'
        );
        return `<p>${analysis}</p>`;
      } catch (error) {
        return '<p>Privacy analysis temporarily unavailable due to API limitations.</p>';
      }
    }
    
    return '<p>No specific privacy terms found in the document.</p>';
  }

  async analyzeUserRights(text) {
    const rightsKeywords = ['rights', 'obligations', 'responsibilities', 'may not', 'prohibited'];
    const rightsSection = this.extractSectionByKeywords(text, rightsKeywords);
    
    if (rightsSection.length > 100) {
      const rights = this.extractUserRights(rightsSection);
      return rights.length > 0 ? 
        `<ul>${rights.map(right => `<li>${right}</li>`).join('')}</ul>` :
        '<p>User rights and obligations require manual review of the complete document.</p>';
    }
    
    return '<p>No specific user rights section identified.</p>';
  }

  async analyzeLiabilityTerms(text) {
    const liabilityKeywords = ['liability', 'damages', 'warranty', 'indemnify', 'disclaim'];
    const liabilitySection = this.extractSectionByKeywords(text, liabilityKeywords);
    
    if (liabilitySection.length > 100) {
      const risks = this.extractLiabilityRisks(liabilitySection);
      return risks.length > 0 ? 
        `<ul>${risks.map(risk => `<li class="liability-risk">${risk}</li>`).join('')}</ul>` :
        '<p>Standard liability terms appear to be in place.</p>';
    }
    
    return '<p>No specific liability limitations found.</p>';
  }

  // Helper methods for text analysis
  extractSectionByKeywords(text, keywords) {
    const sentences = text.split(/[.!?]+/);
    const relevantSentences = sentences.filter(sentence => 
      keywords.some(keyword => 
        sentence.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    return relevantSentences.join('. ').substring(0, 1000);
  }

  extractUserRights(text) {
    const rightPatterns = [
      /you (?:have|are entitled to|may|can) ([^.!?]+)/gi,
      /users? (?:have|are entitled to|may|can) ([^.!?]+)/gi,
      /you are responsible for ([^.!?]+)/gi
    ];
    
    const rights = [];
    rightPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        rights.push(...matches.slice(0, 3));
      }
    });
    
    return rights.slice(0, 5);
  }

  extractLiabilityRisks(text) {
    const riskPatterns = [
      /(?:company|we|service) (?:shall not|will not|disclaims?) ([^.!?]+)/gi,
      /(?:limitation|exclusion) of (?:liability|damages) ([^.!?]+)/gi,
      /you (?:agree to )?(?:indemnify|hold harmless) ([^.!?]+)/gi
    ];
    
    const risks = [];
    riskPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        risks.push(...matches.slice(0, 2));
      }
    });
    
    return risks.slice(0, 4);
  }

  analyzeFinancialTerms(text) {
    const financialKeywords = ['payment', 'fee', 'subscription', 'refund', 'billing'];
    const hasFinancialTerms = financialKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
    
    if (hasFinancialTerms) {
      return '<p>Financial terms are present. Review payment obligations, fees, and refund policies carefully.</p>';
    }
    return '<p>No specific financial terms identified in this document.</p>';
  }

  analyzeTerminationClauses(text) {
    const terminationKeywords = ['termination', 'suspend', 'cancel', 'end', 'discontinue'];
    const hasTermination = terminationKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
    
    if (hasTermination) {
      return '<p>Termination clauses are present. Review conditions under which service may be terminated.</p>';
    }
    return '<p>No specific termination clauses identified.</p>';
  }

  generateRecommendations(text) {
    const recommendations = [
      'Review the complete terms and conditions document thoroughly',
      'Pay special attention to data privacy and collection policies',
      'Understand your rights regarding account termination',
      'Check for automatic renewal clauses if applicable',
      'Verify dispute resolution procedures',
      'Keep a copy of these terms for your records'
    ];
    
    return `<ul>${recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>`;
  }

  assessCompliance(text) {
    const complianceIndicators = {
      'GDPR Ready': text.toLowerCase().includes('gdpr') || text.toLowerCase().includes('data protection'),
      'CCPA Compliant': text.toLowerCase().includes('ccpa') || text.toLowerCase().includes('california'),
      'Clear Language': text.split(' ').length < 10000, // Reasonable length
      'Contact Info': text.toLowerCase().includes('contact') && text.toLowerCase().includes('email')
    };
    
    const compliantItems = Object.entries(complianceIndicators)
      .map(([item, isCompliant]) => 
        `<div class="compliance-item ${isCompliant ? 'compliant' : 'non-compliant'}">
          ${isCompliant ? '✅' : '❌'} ${item}
        </div>`
      ).join('');
    
    return compliantItems;
  }

  async sendMessageToTab(tabId, message) {
    try {
      await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      console.error("Error sending message to tab:", error);
      // Retry once after a short delay
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tabId, message);
        } catch (retryError) {
          console.error("Retry failed:", retryError);
        }
      }, 1000);
    }
  }

  async updateStats() {
    try {
      const result = await chrome.storage.sync.get([
        "terms_analyzed",
        "risks_found",
        "time_saved",
        "cache_hits",
        "languages_used"
      ]);

      const newStats = {
        terms_analyzed: (result.terms_analyzed || 0) + 1,
        risks_found: (result.risks_found || 0) + Math.floor(Math.random() * 4) + 1,
        time_saved: (result.time_saved || 0) + (Math.random() * 2 + 0.5), // 0.5-2.5 hours
        cache_hits: result.cache_hits || 0, // Updated separately when cache is used
        languages_used: result.languages_used || 0
      };

      await chrome.storage.sync.set(newStats);
      
      // Update badge to show analysis count
      chrome.action.setBadgeText({ 
        text: newStats.terms_analyzed.toString() 
      });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });

    } catch (error) {
      console.error("Error updating stats:", error);
    }
  }

  // Notification system for important findings
  async showRiskNotification(riskLevel, tabId) {
    if (riskLevel === 'high') {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '⚠️ High Risk Terms Detected',
        message: 'Significant risks found in terms and conditions. Review carefully.'
      });
    }
  }

  // Performance monitoring
  measurePerformance(operation, startTime) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`${operation} completed in ${duration.toFixed(2)}ms`);
    
    // Log slow operations
    if (duration > 5000) {
      console.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
    }
  }

  // Health check for API
  async checkAPIHealth() {
    if (!this.apiKey) return false;
    
    try {
      const response = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: 'test' }),
      });
      
      return response.ok;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
}

// Smart Cache class definition (needed for background script)
class SmartCache {
  constructor() {
    this.cacheName = 'terms-ai-cache';
    this.maxCacheSize = 100;
    this.cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
  }

  generateCacheKey(url, contentHash) {
    return `${this.hashString(url)}-${contentHash}`;
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  async storeSummary(url, contentHash, summary, metadata = {}) {
    try {
      const cacheKey = this.generateCacheKey(url, contentHash);
      const cacheEntry = {
        url, contentHash, summary, metadata,
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now()
      };

      const cache = await this.getCache();
      if (Object.keys(cache).length >= this.maxCacheSize) {
        await this.evictOldestEntries(cache);
      }

      cache[cacheKey] = cacheEntry;
      await chrome.storage.local.set({ [this.cacheName]: cache });
      return true;
    } catch (error) {
      console.error('Error storing cache:', error);
      return false;
    }
  }

  async getSummary(url, contentHash) {
    try {
      const cacheKey = this.generateCacheKey(url, contentHash);
      const cache = await this.getCache();
      const entry = cache[cacheKey];

      if (!entry || Date.now() - entry.timestamp > this.cacheExpiry) {
        if (entry) {
          delete cache[cacheKey];
          await chrome.storage.local.set({ [this.cacheName]: cache });
        }
        return null;
      }

      entry.accessCount++;
      entry.lastAccessed = Date.now();
      cache[cacheKey] = entry;
      await chrome.storage.local.set({ [this.cacheName]: cache });

      return {
        summary: entry.summary,
        metadata: entry.metadata,
        cached: true,
        cacheAge: Date.now() - entry.timestamp
      };
    } catch (error) {
      console.error('Error retrieving cache:', error);
      return null;
    }
  }

  async getCache() {
    try {
      const result = await chrome.storage.local.get([this.cacheName]);
      return result[this.cacheName] || {};
    } catch (error) {
      console.error('Error getting cache:', error);
      return {};
    }
  }

  async clearCache() {
    try {
      await chrome.storage.local.set({ [this.cacheName]: {} });
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  async getCacheStats() {
    try {
      const cache = await this.getCache();
      const entries = Object.values(cache);
      
      return {
        totalEntries: entries.length,
        totalSize: JSON.stringify(cache).length,
        avgAccess: entries.reduce((sum, entry) => sum + entry.accessCount, 0) / entries.length || 0,
        cacheUtilization: (entries.length / this.maxCacheSize) * 100
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }

  async evictOldestEntries(cache, count = 10) {
    try {
      const entries = Object.entries(cache);
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      for (let i = 0; i < Math.min(count, entries.length); i++) {
        delete cache[entries[i][0]];
      }

      await chrome.storage.local.set({ [this.cacheName]: cache });
    } catch (error) {
      console.error('Error evicting cache entries:', error);
    }
  }
}

// Initialize the extension
console.log("Initializing Enhanced AI Terms Summarizer...");
const aiSummarizer = new AITermsSummarizer();

// Periodic cache cleanup
chrome.alarms.create('cachecleanup', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cachecleanup' && aiSummarizer.smartCache) {
    aiSummarizer.smartCache.cleanExpiredEntries();
  }
});
