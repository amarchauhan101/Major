/**
 * Enhanced Terms & Conditions Detection Engine
 * Uses ML-like scoring and advanced pattern matching
 */
class EnhancedTermsDetector {
  constructor() {
    this.termsPatterns = this.initializePatterns();
    this.confidenceThreshold = 0.7;
    this.cache = new Map();
  }

  initializePatterns() {
    return {
      // High confidence patterns
      highConfidence: [
        {
          regex: /terms\s+(of\s+)?service/gi,
          score: 0.9,
          type: 'terms'
        },
        {
          regex: /terms\s+(&|and)\s+conditions/gi,
          score: 0.95,
          type: 'terms'
        },
        {
          regex: /privacy\s+policy/gi,
          score: 0.85,
          type: 'privacy'
        },
        {
          regex: /user\s+agreement/gi,
          score: 0.8,
          type: 'agreement'
        },
        {
          regex: /end\s+user\s+license\s+agreement/gi,
          score: 0.9,
          type: 'eula'
        }
      ],
      
      // Medium confidence patterns
      mediumConfidence: [
        {
          regex: /legal\s+(terms|notice|disclaimer)/gi,
          score: 0.7,
          type: 'legal'
        },
        {
          regex: /data\s+(processing|collection|usage)\s+(policy|agreement)/gi,
          score: 0.75,
          type: 'data'
        },
        {
          regex: /cookie\s+(policy|notice)/gi,
          score: 0.6,
          type: 'cookies'
        }
      ],

      // Context indicators
      contextual: [
        {
          regex: /by\s+(using|accessing|continuing)/gi,
          score: 0.3,
          type: 'usage_condition'
        },
        {
          regex: /you\s+(agree|consent|acknowledge)/gi,
          score: 0.4,
          type: 'consent'
        },
        {
          regex: /(accept|decline|agree)\s+(to\s+)?(these\s+)?terms/gi,
          score: 0.6,
          type: 'acceptance'
        }
      ]
    };
  }

  /**
   * Analyze element for terms content with confidence scoring
   */
  analyzeElement(element) {
    const text = element.textContent.toLowerCase();
    const html = element.innerHTML.toLowerCase();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(text);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let totalScore = 0;
    let matches = [];

    // Analyze all pattern categories
    [...this.termsPatterns.highConfidence, 
     ...this.termsPatterns.mediumConfidence, 
     ...this.termsPatterns.contextual].forEach(pattern => {
      const textMatches = text.match(pattern.regex);
      const htmlMatches = html.match(pattern.regex);
      
      if (textMatches || htmlMatches) {
        const matchCount = (textMatches?.length || 0) + (htmlMatches?.length || 0);
        const adjustedScore = pattern.score * Math.min(matchCount / 3, 1);
        totalScore += adjustedScore;
        
        matches.push({
          type: pattern.type,
          score: adjustedScore,
          count: matchCount
        });
      }
    });

    // Length bonus for substantial content
    if (text.length > 1000) {
      totalScore += 0.2;
    }
    if (text.length > 5000) {
      totalScore += 0.1;
    }

    // Structure bonus for organized content
    const hasHeaders = element.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 2;
    const hasList = element.querySelectorAll('ul, ol, li').length > 5;
    if (hasHeaders && hasList) {
      totalScore += 0.15;
    }

    const result = {
      confidence: Math.min(totalScore, 1),
      matches: matches,
      isTermsContent: totalScore >= this.confidenceThreshold,
      textLength: text.length,
      element: element
    };

    // Cache result
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Generate cache key for element content
   */
  generateCacheKey(text) {
    return btoa(text.substring(0, 200)).substring(0, 20);
  }

  /**
   * Detect terms across entire page with priority scoring
   */
  detectTermsOnPage() {
    const candidates = [];
    
    // Priority selectors for terms content
    const prioritySelectors = [
      '[class*="terms"]',
      '[class*="privacy"]',
      '[class*="legal"]',
      '[id*="terms"]',
      '[id*="privacy"]',
      'main[class*="terms"]',
      'section[class*="terms"]',
      'div[class*="terms"]'
    ];

    // Check priority selectors first
    prioritySelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        if (this.isValidElement(element)) {
          const analysis = this.analyzeElement(element);
          if (analysis.confidence > 0.5) {
            candidates.push(analysis);
          }
        }
      });
    });

    // If no high-confidence matches, check broader elements
    if (candidates.length === 0) {
      const genericSelectors = ['main', 'article', 'section', '.content', '#content'];
      genericSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
          if (this.isValidElement(element)) {
            const analysis = this.analyzeElement(element);
            if (analysis.confidence > 0.6) {
              candidates.push(analysis);
            }
          }
        });
      });
    }

    // Sort by confidence and return best matches
    return candidates
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  /**
   * Check if element is valid for analysis
   */
  isValidElement(element) {
    // Skip hidden elements
    if (element.offsetParent === null && element.style.display !== 'none') {
      return false;
    }

    // Skip very small elements
    if (element.textContent.trim().length < 100) {
      return false;
    }

    // Skip navigation and header elements
    const skipTags = ['nav', 'header', 'footer', 'aside'];
    if (skipTags.includes(element.tagName.toLowerCase())) {
      return false;
    }

    return true;
  }

  /**
   * Clear cache to prevent memory leaks
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export for use in content script
window.EnhancedTermsDetector = EnhancedTermsDetector;
