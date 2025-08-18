/**
 * Smart Caching System for Terms & Conditions Analysis
 * Reduces API calls and improves performance
 */
class SmartCache {
  constructor() {
    this.cacheName = 'terms-ai-cache';
    this.maxCacheSize = 100; // Maximum cached items
    this.cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    this.init();
  }

  async init() {
    // Clean expired cache entries on initialization
    await this.cleanExpiredEntries();
  }

  /**
   * Generate cache key from URL and content hash
   */
  generateCacheKey(url, contentHash) {
    const urlHash = this.hashString(url);
    return `${urlHash}-${contentHash}`;
  }

  /**
   * Simple string hashing function
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate content hash from text
   */
  generateContentHash(text) {
    // Use first and last 500 chars + length for content fingerprint
    const start = text.substring(0, 500);
    const end = text.substring(Math.max(0, text.length - 500));
    const content = start + end + text.length;
    return this.hashString(content);
  }

  /**
   * Store analysis result in cache
   */
  async storeSummary(url, contentHash, summary, metadata = {}) {
    try {
      const cacheKey = this.generateCacheKey(url, contentHash);
      const cacheEntry = {
        url,
        contentHash,
        summary,
        metadata,
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now()
      };

      // Get current cache
      const cache = await this.getCache();
      
      // Check cache size and remove oldest if necessary
      if (Object.keys(cache).length >= this.maxCacheSize) {
        await this.evictOldestEntries(cache);
      }

      cache[cacheKey] = cacheEntry;
      await chrome.storage.local.set({ [this.cacheName]: cache });

      console.log(`Cached summary for: ${url.substring(0, 50)}...`);
      return true;
    } catch (error) {
      console.error('Error storing cache:', error);
      return false;
    }
  }

  /**
   * Retrieve summary from cache
   */
  async getSummary(url, contentHash) {
    try {
      const cacheKey = this.generateCacheKey(url, contentHash);
      const cache = await this.getCache();
      const entry = cache[cacheKey];

      if (!entry) {
        return null;
      }

      // Check if entry is expired
      if (Date.now() - entry.timestamp > this.cacheExpiry) {
        delete cache[cacheKey];
        await chrome.storage.local.set({ [this.cacheName]: cache });
        return null;
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      cache[cacheKey] = entry;
      await chrome.storage.local.set({ [this.cacheName]: cache });

      console.log(`Cache hit for: ${url.substring(0, 50)}...`);
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

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const cache = await this.getCache();
      const entries = Object.values(cache);
      
      const totalEntries = entries.length;
      const totalSize = JSON.stringify(cache).length;
      const avgAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0) / totalEntries;
      const oldestEntry = Math.min(...entries.map(entry => entry.timestamp));
      const newestEntry = Math.max(...entries.map(entry => entry.timestamp));

      return {
        totalEntries,
        totalSize,
        avgAccess: avgAccess || 0,
        oldestEntry: oldestEntry || 0,
        newestEntry: newestEntry || 0,
        cacheUtilization: (totalEntries / this.maxCacheSize) * 100
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }

  /**
   * Clear all cache entries
   */
  async clearCache() {
    try {
      await chrome.storage.local.set({ [this.cacheName]: {} });
      console.log('Cache cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  /**
   * Get cache object from storage
   */
  async getCache() {
    try {
      const result = await chrome.storage.local.get([this.cacheName]);
      return result[this.cacheName] || {};
    } catch (error) {
      console.error('Error getting cache:', error);
      return {};
    }
  }

  /**
   * Remove expired cache entries
   */
  async cleanExpiredEntries() {
    try {
      const cache = await this.getCache();
      const now = Date.now();
      let cleanedCount = 0;

      Object.keys(cache).forEach(key => {
        if (now - cache[key].timestamp > this.cacheExpiry) {
          delete cache[key];
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        await chrome.storage.local.set({ [this.cacheName]: cache });
        console.log(`Cleaned ${cleanedCount} expired cache entries`);
      }

      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning expired entries:', error);
      return 0;
    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  async evictOldestEntries(cache, count = 10) {
    try {
      const entries = Object.entries(cache);
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      // Remove oldest entries
      for (let i = 0; i < Math.min(count, entries.length); i++) {
        delete cache[entries[i][0]];
      }

      await chrome.storage.local.set({ [this.cacheName]: cache });
      console.log(`Evicted ${count} oldest cache entries`);
    } catch (error) {
      console.error('Error evicting cache entries:', error);
    }
  }

  /**
   * Check if URL should be cached
   */
  shouldCache(url) {
    // Don't cache certain types of URLs
    const excludePatterns = [
      /localhost/,
      /127\.0\.0\.1/,
      /\.local$/,
      /\/api\//,
      /\/ajax\//,
      /\.(json|xml|txt)$/
    ];

    return !excludePatterns.some(pattern => pattern.test(url));
  }

  /**
   * Preload cache for common terms pages
   */
  async preloadCommonTerms() {
    const commonTermsUrls = [
      'google.com/policies/terms',
      'facebook.com/legal/terms',
      'twitter.com/en/tos',
      'microsoft.com/en-us/servicesagreement',
      'apple.com/legal/internet-services/terms/site.html'
    ];

    // This would be implemented to preload common terms
    console.log('Preloading common terms URLs...');
  }
}

// Export for use in content script and background
window.SmartCache = SmartCache;
