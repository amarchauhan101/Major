// Enhanced Popup script for extension settings and management
class EnhancedPopupManager {
  constructor() {
    this.apiKey = null;
    this.settings = {};
    this.stats = {};
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadStats();
    await this.loadCacheStats();
    this.setupEventListeners();
    this.setupAdvancedFeatures();
    this.startStatsRefresh();
  }

  setupEventListeners() {
    // Basic event listeners
    document.getElementById('save-key').addEventListener('click', () => this.saveApiKey());
    document.getElementById('auto-detect').addEventListener('change', () => this.saveAutoDetect());
    document.getElementById('default-language').addEventListener('change', () => this.saveDefaultLanguage());
    document.getElementById('scan-current-page').addEventListener('click', () => this.scanCurrentPage());
    document.getElementById('clear-data').addEventListener('click', () => this.clearAllData());

    // Enhanced features
    document.getElementById('test-connection').addEventListener('click', () => this.testConnection());
    document.getElementById('view-history').addEventListener('click', () => this.viewHistory());
    document.getElementById('export-settings').addEventListener('click', () => this.exportSettings());
    document.getElementById('import-settings').addEventListener('click', () => this.importSettings());
    
    // Advanced settings toggles
    document.getElementById('enable-cache').addEventListener('change', () => this.toggleCache());
    document.getElementById('auto-translate').addEventListener('change', () => this.saveAutoTranslate());
    document.getElementById('risk-threshold').addEventListener('input', () => this.saveRiskThreshold());
  }

  setupAdvancedFeatures() {
    // Add advanced UI elements
    this.addAdvancedSettingsPanel();
    this.addPerformanceMetrics();
    this.addQuickActions();
  }

  addAdvancedSettingsPanel() {
    const advancedPanel = document.createElement('div');
    advancedPanel.className = 'section advanced-settings';
    advancedPanel.innerHTML = `
      <h3>🔧 Advanced Settings</h3>
      
      <div class="setting-group">
        <label>
          Enable Smart Cache
          <label class="toggle-switch">
            <input type="checkbox" id="enable-cache" checked>
            <span class="slider"></span>
          </label>
        </label>
        <small>Cache analysis results for faster repeated access</small>
      </div>

      <div class="setting-group">
        <label>
          Auto-translate Results
          <label class="toggle-switch">
            <input type="checkbox" id="auto-translate">
            <span class="slider"></span>
          </label>
        </label>
        <small>Automatically translate to your preferred language</small>
      </div>

      <div class="setting-group">
        <label for="risk-threshold">Risk Detection Sensitivity:</label>
        <input type="range" id="risk-threshold" min="0" max="100" value="70" class="slider-range">
        <span id="risk-threshold-value">70%</span>
        <small>Higher values detect more potential risks</small>
      </div>

      <div class="setting-group">
        <label for="auto-hide-delay">Notification Auto-hide (seconds):</label>
        <select id="auto-hide-delay">
          <option value="0">Never</option>
          <option value="5000">5 seconds</option>
          <option value="10000">10 seconds</option>
          <option value="15000" selected>15 seconds</option>
          <option value="30000">30 seconds</option>
        </select>
      </div>
    `;

    // Insert before the statistics section
    const statsSection = document.querySelector('.section:has(h3)');
    statsSection.parentNode.insertBefore(advancedPanel, statsSection);
  }

  addPerformanceMetrics() {
    const metricsPanel = document.createElement('div');
    metricsPanel.className = 'section performance-metrics';
    metricsPanel.innerHTML = `
      <h3>📊 Performance Metrics</h3>
      <div class="metrics-grid">
        <div class="metric-item">
          <span class="metric-number" id="cache-hit-rate">--%</span>
          <span class="metric-label">Cache Hit Rate</span>
        </div>
        <div class="metric-item">
          <span class="metric-number" id="avg-analysis-time">--s</span>
          <span class="metric-label">Avg Analysis Time</span>
        </div>
        <div class="metric-item">
          <span class="metric-number" id="api-reliability">--%</span>
          <span class="metric-label">API Reliability</span>
        </div>
        <div class="metric-item">
          <span class="metric-number" id="data-saved">--MB</span>
          <span class="metric-label">Bandwidth Saved</span>
        </div>
      </div>
    `;

    document.querySelector('.section:last-child').after(metricsPanel);
  }

  addQuickActions() {
    const actionsPanel = document.createElement('div');
    actionsPanel.className = 'section quick-actions';
    actionsPanel.innerHTML = `
      <h3>⚡ Quick Actions</h3>
      <div class="actions-grid">
        <button id="test-connection" class="action-btn">
          🔧 Test Connection
        </button>
        <button id="view-history" class="action-btn">
          📋 View History
        </button>
        <button id="export-settings" class="action-btn">
          📤 Export Settings
        </button>
        <button id="import-settings" class="action-btn">
          📥 Import Settings
        </button>
      </div>
    `;

    document.querySelector('.section:last-child').after(actionsPanel);
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'hf_api_token',
        'auto_detect',
        'default_language',
        'enable_cache',
        'auto_translate',
        'risk_threshold',
        'auto_hide_delay'
      ]);

      // Load API key
      if (result.hf_api_token) {
        this.apiKey = result.hf_api_token;
        document.getElementById('api-key').value = '••••••••••••••••••••' + result.hf_api_token.slice(-4);
      }

      // Load basic settings
      document.getElementById('auto-detect').checked = result.auto_detect !== false;
      document.getElementById('default-language').value = result.default_language || 'en';

      // Load advanced settings
      if (document.getElementById('enable-cache')) {
        document.getElementById('enable-cache').checked = result.enable_cache !== false;
      }
      if (document.getElementById('auto-translate')) {
        document.getElementById('auto-translate').checked = result.auto_translate || false;
      }
      if (document.getElementById('risk-threshold')) {
        const threshold = result.risk_threshold || 70;
        document.getElementById('risk-threshold').value = threshold;
        document.getElementById('risk-threshold-value').textContent = threshold + '%';
      }
      if (document.getElementById('auto-hide-delay')) {
        document.getElementById('auto-hide-delay').value = result.auto_hide_delay || 15000;
      }

      this.settings = result;
    } catch (error) {
      this.showStatus('Error loading settings', 'error');
    }
  }

  async loadStats() {
    try {
      const result = await chrome.storage.sync.get([
        'terms_analyzed',
        'risks_found',
        'time_saved',
        'cache_hits',
        'languages_used'
      ]);

      document.getElementById('terms-analyzed').textContent = result.terms_analyzed || 0;
      document.getElementById('risks-found').textContent = result.risks_found || 0;
      document.getElementById('time-saved').textContent = Math.floor(result.time_saved || 0);

      this.stats = result;
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async loadCacheStats() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getCacheStats' });
      if (response && response.totalEntries !== undefined) {
        document.getElementById('cache-hit-rate').textContent = 
          Math.round(response.avgAccess * 10) + '%';
        document.getElementById('data-saved').textContent = 
          Math.round(response.totalSize / 1024) + 'KB';
      }
    } catch (error) {
      console.error('Error loading cache stats:', error);
    }
  }

  async saveApiKey() {
    const apiKey = document.getElementById('api-key').value.trim();

    if (!apiKey || apiKey.startsWith('••••')) {
      this.showStatus('Please enter a valid Hugging Face API token', 'error');
      return;
    }

    if (!apiKey.startsWith('hf_')) {
      this.showStatus('Invalid token format. Must start with "hf_"', 'error');
      return;
    }

    try {
      await chrome.storage.sync.set({ hf_api_token: apiKey });
      this.apiKey = apiKey;
      this.showStatus('Hugging Face token saved successfully!', 'success');

      // Test connection automatically
      setTimeout(() => this.testConnection(), 1000);

      // Mask the key in the input
      setTimeout(() => {
        document.getElementById('api-key').value = '••••••••••••••••••••' + apiKey.slice(-4);
      }, 2000);

    } catch (error) {
      this.showStatus('Error saving API token', 'error');
    }
  }

  async testConnection() {
    if (!this.apiKey) {
      this.showStatus('Please save your API key first', 'error');
      return;
    }

    const testBtn = document.getElementById('test-connection');
    const originalText = testBtn.textContent;
    testBtn.textContent = '🔄 Testing...';
    testBtn.disabled = true;

    try {
      const response = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: 'test connection' }),
      });

      if (response.ok) {
        this.showStatus('✅ Connection successful!', 'success');
        document.getElementById('api-reliability').textContent = '100%';
      } else {
        this.showStatus('❌ Connection failed. Check your token.', 'error');
        document.getElementById('api-reliability').textContent = '0%';
      }
    } catch (error) {
      this.showStatus('❌ Network error. Check your connection.', 'error');
      document.getElementById('api-reliability').textContent = '0%';
    } finally {
      testBtn.textContent = originalText;
      testBtn.disabled = false;
    }
  }

  async scanCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab) {
        this.showStatus('No active tab found', 'error');
        return;
      }

      // Enhanced scanning with better feedback
      this.showStatus('🔍 Scanning page for terms...', 'info');

      chrome.tabs.sendMessage(tab.id, { action: "forceDetection" }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Content script not ready, injecting...');
          
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['utils/detector.js', 'utils/textProcessor.js', 'utils/cache.js', 'content-enhanced.js'],
          }).then(() => {
            setTimeout(() => {
              chrome.tabs.sendMessage(tab.id, { action: "forceDetection" });
              this.showStatus('✅ Scan initiated!', 'success');
            }, 500);
          }).catch((error) => {
            console.error('Error injecting script:', error);
            this.showStatus('❌ Cannot scan this page', 'error');
          });
        } else {
          this.showStatus('✅ Scan complete!', 'success');
        }
      });

      setTimeout(() => window.close(), 1500);
    } catch (error) {
      console.error('Error in scanCurrentPage:', error);
      this.showStatus('❌ Scan failed', 'error');
    }
  }

  async viewHistory() {
    try {
      const result = await chrome.storage.local.get(['summaryHistory']);
      const history = result.summaryHistory || [];

      if (history.length === 0) {
        this.showStatus('No analysis history found', 'info');
        return;
      }

      // Create history modal
      const modal = document.createElement('div');
      modal.className = 'history-modal';
      modal.innerHTML = `
        <div class="history-content">
          <div class="history-header">
            <h3>📋 Analysis History</h3>
            <button class="close-history">×</button>
          </div>
          <div class="history-list">
            ${history.slice(0, 10).map(entry => `
              <div class="history-item" data-id="${entry.id}">
                <div class="history-title">${entry.title}</div>
                <div class="history-url">${entry.url}</div>
                <div class="history-date">${new Date(entry.timestamp).toLocaleDateString()}</div>
                <button class="view-summary" data-id="${entry.id}">View</button>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Event listeners for history modal
      modal.querySelector('.close-history').addEventListener('click', () => {
        modal.remove();
      });

      modal.querySelectorAll('.view-summary').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const entryId = e.target.dataset.id;
          const entry = history.find(h => h.id === entryId);
          if (entry) {
            // Open in new tab or show in popup
            chrome.tabs.create({ url: entry.url });
          }
        });
      });

    } catch (error) {
      this.showStatus('Error loading history', 'error');
    }
  }

  async exportSettings() {
    try {
      const settings = await chrome.storage.sync.get();
      const exportData = {
        ...settings,
        exportDate: new Date().toISOString(),
        version: chrome.runtime.getManifest().version
      };

      // Remove sensitive data
      delete exportData.hf_api_token;

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `terms-ai-settings-${Date.now()}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      this.showStatus('✅ Settings exported!', 'success');
    } catch (error) {
      this.showStatus('❌ Export failed', 'error');
    }
  }

  async importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const settings = JSON.parse(text);
        
        // Validate settings
        if (!settings.version) {
          throw new Error('Invalid settings file');
        }

        // Import settings (excluding sensitive data)
        const { hf_api_token, ...safeSettings } = settings;
        await chrome.storage.sync.set(safeSettings);
        
        this.showStatus('✅ Settings imported! Refresh popup.', 'success');
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        this.showStatus('❌ Import failed: Invalid file', 'error');
      }
    });

    input.click();
  }

  async saveAutoDetect() {
    const autoDetect = document.getElementById('auto-detect').checked;
    try {
      await chrome.storage.sync.set({ auto_detect: autoDetect });
      this.showStatus('Settings saved!', 'success');
    } catch (error) {
      this.showStatus('Error saving settings', 'error');
    }
  }

  async saveDefaultLanguage() {
    const language = document.getElementById('default-language').value;
    try {
      await chrome.storage.sync.set({ default_language: language });
      this.showStatus('Language preference saved!', 'success');
    } catch (error) {
      this.showStatus('Error saving language', 'error');
    }
  }

  async toggleCache() {
    const enableCache = document.getElementById('enable-cache').checked;
    try {
      await chrome.storage.sync.set({ enable_cache: enableCache });
      this.showStatus('Cache setting updated!', 'success');
    } catch (error) {
      this.showStatus('Error updating cache setting', 'error');
    }
  }

  async saveAutoTranslate() {
    const autoTranslate = document.getElementById('auto-translate').checked;
    try {
      await chrome.storage.sync.set({ auto_translate: autoTranslate });
      this.showStatus('Auto-translate setting saved!', 'success');
    } catch (error) {
      this.showStatus('Error saving auto-translate', 'error');
    }
  }

  async saveRiskThreshold() {
    const threshold = document.getElementById('risk-threshold').value;
    document.getElementById('risk-threshold-value').textContent = threshold + '%';
    
    try {
      await chrome.storage.sync.set({ risk_threshold: parseInt(threshold) });
      this.showStatus('Risk threshold updated!', 'success');
    } catch (error) {
      this.showStatus('Error saving risk threshold', 'error');
    }
  }

  async clearAllData() {
    if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      return;
    }

    try {
      // Clear both sync and local storage
      await Promise.all([
        chrome.storage.sync.clear(),
        chrome.storage.local.clear(),
        chrome.runtime.sendMessage({ action: 'clearCache' })
      ]);

      // Reset UI
      document.getElementById('api-key').value = '';
      document.getElementById('auto-detect').checked = true;
      document.getElementById('default-language').value = 'en';
      document.getElementById('terms-analyzed').textContent = '0';
      document.getElementById('risks-found').textContent = '0';
      document.getElementById('time-saved').textContent = '0';

      this.showStatus('✅ All data cleared!', 'success');
    } catch (error) {
      this.showStatus('❌ Error clearing data', 'error');
    }
  }

  startStatsRefresh() {
    // Refresh stats every 30 seconds when popup is open
    setInterval(() => {
      this.loadStats();
      this.loadCacheStats();
    }, 30000);
  }

  showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;

    // Auto-clear status after 4 seconds
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = '';
    }, 4000);
  }
}

// Initialize enhanced popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new EnhancedPopupManager();
});
