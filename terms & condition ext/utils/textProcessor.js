/**
 * Advanced Text Processing Utilities
 * Handles text extraction, cleaning, and optimization for AI processing
 */
class TextProcessor {
  constructor() {
    this.maxTokens = 4000; // Safe limit for most models
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'
    ]);
  }

  /**
   * Extract and clean text from elements with intelligent prioritization
   */
  extractText(elements) {
    if (!Array.isArray(elements)) {
      elements = [elements];
    }

    let extractedText = '';
    let priorityScore = 0;

    elements.forEach(element => {
      const text = this.cleanElementText(element);
      const score = this.calculateTextPriority(text, element);
      
      if (score > 0.3) { // Only include meaningful content
        extractedText += `\n\n--- Section (Priority: ${score.toFixed(2)}) ---\n${text}`;
        priorityScore += score;
      }
    });

    return {
      text: extractedText.trim(),
      avgPriority: priorityScore / elements.length,
      wordCount: this.countWords(extractedText)
    };
  }

  /**
   * Clean and normalize text from DOM element
   */
  cleanElementText(element) {
    let text = element.textContent || element.innerText || '';
    
    // Remove excessive whitespace
    text = text.replace(/\s+/g, ' ');
    
    // Remove common UI elements
    text = text.replace(/^\s*(home|menu|navigation|search|login|sign up|subscribe)\s*$/gmi, '');
    
    // Remove email addresses and URLs for privacy
    text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
    text = text.replace(/https?:\/\/[^\s]+/g, '[URL]');
    
    // Remove excessive punctuation
    text = text.replace(/[.]{3,}/g, '...');
    text = text.replace(/[!]{2,}/g, '!');
    text = text.replace(/[?]{2,}/g, '?');
    
    return text.trim();
  }

  /**
   * Calculate priority score for text content
   */
  calculateTextPriority(text, element) {
    let score = 0;
    const lowerText = text.toLowerCase();

    // Length factor
    if (text.length > 500) score += 0.3;
    if (text.length > 1500) score += 0.2;
    
    // Legal keywords
    const legalKeywords = ['shall', 'hereby', 'whereas', 'liability', 'warranty', 'indemnify'];
    const legalMatches = legalKeywords.filter(keyword => lowerText.includes(keyword)).length;
    score += Math.min(legalMatches * 0.1, 0.4);

    // Structure indicators
    if (element.querySelector('ol, ul')) score += 0.1;
    if (element.querySelectorAll('p').length > 3) score += 0.1;
    
    // Policy-specific terms
    const policyTerms = ['policy', 'agreement', 'terms', 'conditions', 'privacy'];
    const policyMatches = policyTerms.filter(term => lowerText.includes(term)).length;
    score += Math.min(policyMatches * 0.05, 0.2);

    return Math.min(score, 1);
  }

  /**
   * Optimize text for AI processing with smart truncation
   */
  optimizeForAI(text, maxTokens = this.maxTokens) {
    const words = text.split(/\s+/);
    const estimatedTokens = words.length * 1.3; // Rough token estimation
    
    if (estimatedTokens <= maxTokens) {
      return {
        text: text,
        truncated: false,
        originalLength: words.length,
        finalLength: words.length
      };
    }

    // Smart truncation preserving important sections
    const sections = text.split(/\n\n---[^-]+---\n/);
    let optimizedText = '';
    let tokenCount = 0;
    const targetTokens = maxTokens * 0.8; // Leave buffer

    // Prioritize sections by importance indicators
    const rankedSections = sections.map(section => ({
      text: section,
      priority: this.calculateSectionPriority(section)
    })).sort((a, b) => b.priority - a.priority);

    for (const section of rankedSections) {
      const sectionTokens = section.text.split(/\s+/).length * 1.3;
      if (tokenCount + sectionTokens <= targetTokens) {
        optimizedText += section.text + '\n\n';
        tokenCount += sectionTokens;
      }
    }

    return {
      text: optimizedText.trim(),
      truncated: true,
      originalLength: words.length,
      finalLength: optimizedText.split(/\s+/).length
    };
  }

  /**
   * Calculate section priority for smart truncation
   */
  calculateSectionPriority(section) {
    const lowerSection = section.toLowerCase();
    let priority = 0;

    // High-value legal terms
    const highValueTerms = [
      'liability', 'warranty', 'indemnification', 'termination', 
      'privacy', 'data collection', 'user rights', 'refund', 'cancellation'
    ];
    
    highValueTerms.forEach(term => {
      if (lowerSection.includes(term)) priority += 0.2;
    });

    // Section length factor
    if (section.length > 200) priority += 0.1;
    if (section.length > 500) priority += 0.1;

    return Math.min(priority, 1);
  }

  /**
   * Extract key phrases for summarization hints
   */
  extractKeyPhrases(text, maxPhrases = 10) {
    const sentences = text.split(/[.!?]+/);
    const phrases = [];

    sentences.forEach(sentence => {
      const cleanSentence = sentence.trim().toLowerCase();
      if (cleanSentence.length > 20 && cleanSentence.length < 200) {
        // Look for important legal constructs
        if (this.isImportantPhrase(cleanSentence)) {
          phrases.push(sentence.trim());
        }
      }
    });

    return phrases.slice(0, maxPhrases);
  }

  /**
   * Check if phrase contains important legal information
   */
  isImportantPhrase(phrase) {
    const importantPatterns = [
      /you agree/,
      /we (may|will|shall)/,
      /your (data|information|privacy)/,
      /in case of/,
      /you are responsible/,
      /we reserve the right/,
      /by using/,
      /if you do not agree/
    ];

    return importantPatterns.some(pattern => pattern.test(phrase));
  }

  /**
   * Count words in text
   */
  countWords(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Create summary metadata
   */
  createSummaryMetadata(originalText, processedText) {
    return {
      originalWordCount: this.countWords(originalText),
      processedWordCount: this.countWords(processedText),
      compressionRatio: this.countWords(processedText) / this.countWords(originalText),
      timestamp: new Date().toISOString(),
      language: this.detectLanguage(originalText)
    };
  }

  /**
   * Simple language detection
   */
  detectLanguage(text) {
    const languagePatterns = {
      'en': /\b(the|and|or|but|for|with|you|your|we|our|this|that|they|have|will|would|could|should)\b/gi,
      'es': /\b(el|la|los|las|y|o|pero|para|con|usted|su|nosotros|nuestro|esto|eso|ellos|tienen|será|podría|debería)\b/gi,
      'fr': /\b(le|la|les|et|ou|mais|pour|avec|vous|votre|nous|notre|ceci|cela|ils|ont|sera|pourrait|devrait)\b/gi,
      'de': /\b(der|die|das|und|oder|aber|für|mit|sie|ihr|wir|unser|dies|das|sie|haben|wird|könnte|sollte)\b/gi
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
}

// Export for use in content script
window.TextProcessor = TextProcessor;
