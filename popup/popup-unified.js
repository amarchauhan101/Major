// Professional Privacy Lens Extension Controller
class PrivacyLensPopup {
    constructor() {
        this.cookieCount = 0;
        this.termsStatus = 'Ready';
        this.currentTab = null;
        this.analysisData = {
            cookies: null,
            terms: null
        };
        this.init();
    }

    async init() {
        await this.getCurrentTab();
        this.setupEventListeners();
        this.setupMessageListener();
        this.setupTabNavigation();
        this.updateStatus();
        this.loadExistingData();
    }

    async getCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tab;
            this.updateUrlDisplays();
        } catch (error) {
            console.error('Error getting current tab:', error);
        }
    }

    updateUrlDisplays() {
        if (this.currentTab) {
            const shortUrl = this.currentTab.url.length > 50 
                ? this.currentTab.url.substring(0, 47) + '...' 
                : this.currentTab.url;
            
            document.getElementById('analyzed-url').textContent = shortUrl;
            document.getElementById('terms-analyzed-url').textContent = shortUrl;
        }
    }

    setupTabNavigation() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
    }

    switchTab(tabName) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Load data for the active tab
        this.loadTabData(tabName);
    }

    loadTabData(tabName) {
        switch(tabName) {
            case 'cookies':
                this.loadCookieData();
                break;
            case 'terms':
                this.loadTermsData();
                break;
            case 'overview':
                this.loadOverviewData();
                break;
        }
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === "showCookieReport") {
                this.handleCookieReport(message);
            } else if (message.action === "termsAnalysisComplete") {
                this.handleTermsAnalysis(message);
            } else if (message.action === "updateStats") {
                this.updateStatus();
            }
        });
    }

    setupEventListeners() {
        // Overview tab actions
        document.getElementById('full-analysis').addEventListener('click', () => {
            this.fullPrivacyAnalysis();
        });

        document.getElementById('quick-scan').addEventListener('click', () => {
            this.quickScan();
        });

        // Cookie tab actions
        document.getElementById('scan-cookies').addEventListener('click', () => {
            this.scanCookies();
        });

        document.getElementById('manage-cookies').addEventListener('click', () => {
            this.manageCookies();
        });

        // Terms tab actions
        document.getElementById('analyze-terms').addEventListener('click', () => {
            this.analyzeTerms();
        });

        document.getElementById('view-summary').addEventListener('click', () => {
            this.viewSummary();
        });
    }

    async loadExistingData() {
        try {
            // Load cookie data
            const cookieData = await chrome.storage.local.get(['cookieReport', 'lastCookieAnalysis']);
            if (cookieData.cookieReport) {
                this.analysisData.cookies = cookieData.cookieReport;
                this.cookieCount = cookieData.cookieReport.length || 0;
            }

            // Load terms data - check multiple sources
            const termsData = await chrome.storage.local.get(['lastTermsAnalysis', 'lastAutoAnalysis', 'analyses']);
            
            // Priority: lastAutoAnalysis > lastTermsAnalysis > latest from analyses
            if (termsData.lastAutoAnalysis) {
                this.analysisData.terms = termsData.lastAutoAnalysis.data;
                this.termsStatus = 'Analyzed';
                console.log('✅ Loaded auto-analysis data');
            } else if (termsData.lastTermsAnalysis) {
                this.analysisData.terms = termsData.lastTermsAnalysis;
                this.termsStatus = 'Analyzed';
                console.log('✅ Loaded manual analysis data');
            } else if (termsData.analyses && termsData.analyses.length > 0) {
                // Get the latest analysis
                const latestAnalysis = termsData.analyses[termsData.analyses.length - 1];
                this.analysisData.terms = latestAnalysis;
                this.termsStatus = 'Analyzed';
                console.log('✅ Loaded latest analysis from storage');
            }

            this.updateStatus();
            
            // Update URL displays with actual analyzed URLs
            if (this.analysisData.terms && this.analysisData.terms.url) {
                const shortUrl = this.analysisData.terms.url.length > 50 
                    ? this.analysisData.terms.url.substring(0, 47) + '...' 
                    : this.analysisData.terms.url;
                document.getElementById('terms-analyzed-url').textContent = shortUrl;
            }
        } catch (error) {
            console.error('Error loading existing data:', error);
        }
    }

    // Cookie Analysis Methods
    async scanCookies() {
        this.showLoading(true, 'Scanning cookies...');
        
        try {
            if (!this.currentTab) {
                throw new Error('No active tab found');
            }

            const response = await chrome.runtime.sendMessage({
                action: "scanCookies",
                url: this.currentTab.url
            });

            if (response && response.success) {
                this.analysisData.cookies = response.cookies || [];
                this.cookieCount = this.analysisData.cookies.length;
                this.updateStatus();
                this.displayCookieResults();
                this.showSuccess(`Found ${this.cookieCount} cookies`);
            } else {
                throw new Error(response?.error || 'Cookie scan failed');
            }
        } catch (error) {
            console.error('Cookie scan error:', error);
            this.showError('Failed to scan cookies: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    displayCookieResults() {
        const resultsContainer = document.getElementById('cookie-results');
        
        if (!this.analysisData.cookies || this.analysisData.cookies.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🍪</div>
                    <div class="empty-title">No Cookies Found</div>
                    <div class="empty-description">No cookies detected on this page.</div>
                </div>
            `;
                return;
            }

        // Calculate statistics
        const totalCookies = this.analysisData.cookies.length;
        const essentialCookies = this.analysisData.cookies.filter(c => c.isEssential).length;
        const nonEssentialCookies = totalCookies - essentialCookies;
        const highRiskCookies = this.analysisData.cookies.filter(c => c.riskLevel === 'High').length;

        const cookiesHtml = `
            <div class="cookie-stats">
                <div class="stat-item">
                    <span class="stat-label">Total:</span>
                    <span class="stat-value">${totalCookies}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Essential:</span>
                    <span class="stat-value">${essentialCookies}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Optional:</span>
                    <span class="stat-value">${nonEssentialCookies}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">High Risk:</span>
                    <span class="stat-value">${highRiskCookies}</span>
                </div>
            </div>
            
            <div class="cookie-controls">
                <button class="btn btn-primary" id="accept-essential-only">
                    ✅ Accept Essential Only
                </button>
                <button class="btn btn-secondary" id="accept-all-cookies">
                    🍪 Accept All Cookies
                </button>
            </div>
            
            <div class="cookies-list">
                ${this.analysisData.cookies.map(cookie => {
                    const riskClass = cookie.riskLevel ? cookie.riskLevel.toLowerCase() : 'low';
                    const isEssential = cookie.isEssential;
                    const toggleDisabled = isEssential ? 'disabled' : '';
                    const toggleChecked = isEssential ? 'checked' : 'checked';
                    
                    return `
                        <div class="cookie-item ${isEssential ? 'essential' : ''}">
                            <div class="cookie-header">
                                <div class="cookie-info">
                                    <div class="cookie-name">${cookie.name}</div>
                                    <div class="cookie-domain">${cookie.domain}</div>
                                </div>
                                <div class="cookie-controls">
                                    <div class="risk-badge ${riskClass}">${cookie.riskLevel || 'Low'}</div>
                                    <label class="cookie-toggle">
                                        <input type="checkbox" 
                                               class="cookie-checkbox" 
                                               data-name="${cookie.name}" 
                                               data-domain="${cookie.domain}"
                                               ${toggleChecked}
                                               ${toggleDisabled}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                            <div class="cookie-details">
                                <div class="detail-item">
                                    <span class="detail-label">Type:</span>
                                    <span class="detail-value">${cookie.isThirdParty ? 'Third-Party' : 'First-Party'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Purpose:</span>
                                    <span class="detail-value">${cookie.purpose || 'Unknown'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Essential:</span>
                                    <span class="detail-value ${isEssential ? 'essential' : 'optional'}">${isEssential ? 'Yes' : 'No'}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        resultsContainer.innerHTML = cookiesHtml;
        
        // Add event listeners for cookie controls
        this.setupCookieControls();
    }

    setupCookieControls() {
        // Accept Essential Only button
        document.getElementById('accept-essential-only')?.addEventListener('click', () => {
            this.acceptEssentialOnly();
        });

        // Accept All Cookies button
        document.getElementById('accept-all-cookies')?.addEventListener('click', () => {
            this.acceptAllCookies();
        });

        // Individual cookie toggles
        document.querySelectorAll('.cookie-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const cookieName = e.target.dataset.name;
                const cookieDomain = e.target.dataset.domain;
                const isAllowed = e.target.checked;

                this.updateCookieSetting(cookieName, cookieDomain, isAllowed);
            });
        });
    }

    async acceptEssentialOnly() {
        this.showLoading(true, 'Removing non-essential cookies...');
        
        try {
            const response = await chrome.runtime.sendMessage({
                action: "acceptEssentialCookies",
                url: this.currentTab.url
            });

            if (response && response.success) {
                const removedCount = response.data?.removedCount || 0;
                this.showSuccess(`Removed ${removedCount} non-essential cookies successfully`);
                // Refresh cookie display
                await this.scanCookies();
            } else {
                this.showError('Failed to remove non-essential cookies: ' + (response?.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error accepting essential only:', error);
            this.showError('Failed to process cookie preferences: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async acceptAllCookies() {
        this.showLoading(true, 'Accepting all cookies...');
        
        try {
            const response = await chrome.runtime.sendMessage({
                action: "acceptAllCookies"
            });

            if (response && response.success) {
                this.showSuccess('All cookies accepted successfully');
                // Refresh cookie display
                await this.scanCookies();
            } else {
                this.showError('Failed to accept all cookies: ' + (response?.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error accepting all cookies:', error);
            this.showError('Failed to process cookie preferences: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async updateCookieSetting(cookieName, cookieDomain, isAllowed) {
        try {
            const response = await chrome.runtime.sendMessage({
                action: "updateCookieSetting",
                cookieName: cookieName,
                cookieDomain: cookieDomain,
                isAllowed: isAllowed
            });

            if (response && response.success) {
                console.log(`Cookie setting updated: ${cookieName} = ${isAllowed}`);
            } else {
                console.error('Failed to update cookie setting');
            }
        } catch (error) {
            console.error('Error updating cookie setting:', error);
        }
    }

    // Terms Analysis Methods
    async analyzeTerms() {
        this.showLoading(true, 'Analyzing terms...');
        
        try {
            if (!this.currentTab) {
                throw new Error('No active tab found');
            }

            console.log('🔍 Starting terms analysis for:', this.currentTab.url);

            // Get content from the current tab first
            const contentResponse = await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'get_page_content'
            });

            console.log('📋 Content extracted:', contentResponse);

            if (!contentResponse || !contentResponse.content) {
                throw new Error('No content found on this page');
            }

            // Send content directly to background script for analysis
            const analysisResponse = await chrome.runtime.sendMessage({
                action: 'analyze_content',
                content: contentResponse.content,
                url: this.currentTab.url,
                language: 'en'
            });

            console.log('📊 Analysis response:', analysisResponse);

            if (analysisResponse && analysisResponse.success) {
                this.analysisData.terms = analysisResponse.data;
                this.termsStatus = 'Analyzed';
                this.updateStatus();
                this.displayTermsResults();
                this.showSuccess('Terms analysis completed successfully');
                
                // Store the analysis result
                await chrome.storage.local.set({
                    lastTermsAnalysis: analysisResponse.data,
                    timestamp: Date.now()
                });
            } else {
                throw new Error(analysisResponse?.error || 'Terms analysis failed');
            }
        } catch (error) {
            console.error('Terms analysis error:', error);
            
            // Check if it's a backend connection error
            if (error.message.includes('Failed to fetch') || error.message.includes('net::ERR_CONNECTION_REFUSED')) {
                this.showError('Backend server not running. Please start the backend with: python main_simple.py');
            } else {
                this.showError('Failed to analyze terms: ' + error.message);
            }
        } finally {
            this.showLoading(false);
        }
    }

    displayTermsResults() {
        const resultsContainer = document.getElementById('terms-results');
        
        if (!this.analysisData.terms) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <div class="empty-title">No Terms Analysis Available</div>
                    <div class="empty-description">Terms analysis data not found.</div>
                </div>
            `;
            return;
        }

        const data = this.analysisData.terms;
        const riskScore = data.risk_analysis?.overall_risk || 0;
        const riskLevel = riskScore >= 50 ? 'high' : riskScore >= 30 ? 'medium' : 'low';

        let resultsHtml = `
            <div class="result-card">
                <div class="result-header">
                    <div class="result-title">Overall Risk Assessment</div>
                    <div class="risk-badge ${riskLevel}">${riskLevel.toUpperCase()}</div>
                </div>
                <div class="result-content">
                    <p><strong>Risk Score:</strong> ${riskScore}/100</p>
                    <p><strong>Summary:</strong> ${data.summary?.executive_summary || 'No summary available'}</p>
                </div>
            </div>
        `;

        // Add structured analysis if available
        if (data.summary?.structured_analysis) {
            const structured = data.summary.structured_analysis;
            
            // Define the order and titles for sections
            const sectionOrder = [
                { key: 'summary', title: 'Summary' },
                { key: 'key_points', title: 'Key Points' },
                { key: 'data_collected', title: 'Data Collected' },
                { key: 'data_usage', title: 'Data Usage' },
                { key: 'data_sharing', title: 'Data Sharing' },
                { key: 'user_rights', title: 'User Rights' },
                { key: 'company_rights', title: 'Company Rights' },
                { key: 'termination', title: 'Termination' },
                { key: 'liability', title: 'Liability' },
                { key: 'dispute_resolution', title: 'Dispute Resolution' },
                { key: 'cookies_tracking', title: 'Cookies & Tracking' },
                { key: 'privacy_protection', title: 'Privacy Protection' }
            ];
            
            sectionOrder.forEach(section => {
                const value = structured[section.key];
                if (value && value.trim() && value !== 'Not specified' && value !== 'Not found') {
                    resultsHtml += `
                        <div class="result-card">
                            <div class="result-header">
                                <div class="result-title">${section.title}</div>
                            </div>
                            <div class="result-content">
                                <p>${value}</p>
                            </div>
                        </div>
                    `;
                }
            });
        }

        resultsContainer.innerHTML = resultsHtml;
    }

    formatSectionTitle(key) {
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // Combined Analysis Methods
    async fullPrivacyAnalysis() {
        this.showLoading(true, 'Running complete privacy analysis...');
        this.startLogoAnimation();
        
        try {
            const [cookieResult, termsResult] = await Promise.allSettled([
                this.scanCookies(),
                this.analyzeTerms()
            ]);

            let successCount = 0;
            let errors = [];

            if (cookieResult.status === 'fulfilled') {
                successCount++;
            } else {
                errors.push('Cookie analysis failed');
            }

            if (termsResult.status === 'fulfilled') {
                successCount++;
            } else {
                errors.push('Terms analysis failed');
            }

            if (successCount === 2) {
                this.showSuccess('Complete privacy analysis finished successfully!');
                this.loadOverviewData();
            } else if (successCount === 1) {
                this.showSuccess('Privacy analysis partially completed. ' + errors.join(', '));
            } else {
                this.showError('Privacy analysis failed: ' + errors.join(', '));
            }

        } catch (error) {
            console.error('Full analysis error:', error);
            this.showError('Complete privacy analysis failed');
        } finally {
            this.showLoading(false);
            this.stopLogoAnimation();
        }
    }

    async quickScan() {
        this.showLoading(true, 'Quick scanning...');
        
        try {
            // Quick cookie scan only
            await this.scanCookies();
            this.showSuccess('Quick scan completed');
        } catch (error) {
            console.error('Quick scan error:', error);
            this.showError('Quick scan failed');
        } finally {
            this.showLoading(false);
        }
    }

    // Utility Methods
    loadCookieData() {
        if (this.analysisData.cookies) {
            this.displayCookieResults();
        }
    }

    loadTermsData() {
        if (this.analysisData.terms) {
            this.displayTermsResults();
        }
    }

    loadOverviewData() {
        const overviewResults = document.getElementById('overview-results');
        
        if (this.analysisData.cookies || this.analysisData.terms) {
            let overviewHtml = '';
            
            if (this.analysisData.cookies && this.analysisData.cookies.length > 0) {
                const highRiskCookies = this.analysisData.cookies.filter(c => c.riskLevel === 'High').length;
                overviewHtml += `
                    <div class="result-card">
                        <div class="result-header">
                            <div class="result-title">Cookie Analysis</div>
                            <div class="risk-badge ${highRiskCookies > 0 ? 'high' : 'low'}">${highRiskCookies > 0 ? 'HIGH RISK' : 'SAFE'}</div>
                        </div>
                        <div class="result-content">
                            <p>Found ${this.analysisData.cookies.length} cookies with ${highRiskCookies} high-risk cookies.</p>
                        </div>
                    </div>
                `;
            }

            if (this.analysisData.terms) {
                const riskScore = this.analysisData.terms.risk_score || 0;
                const riskLevel = riskScore >= 7 ? 'high' : riskScore >= 4 ? 'medium' : 'low';
                overviewHtml += `
                    <div class="result-card">
                        <div class="result-header">
                            <div class="result-title">Terms Analysis</div>
                            <div class="risk-badge ${riskLevel}">${riskLevel.toUpperCase()}</div>
                        </div>
                        <div class="result-content">
                            <p>Risk Score: ${riskScore}/10 - ${this.analysisData.terms.summary?.overview || 'Analysis completed'}</p>
                        </div>
                    </div>
                `;
            }

            overviewResults.innerHTML = overviewHtml;
        } else {
            overviewResults.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <div class="empty-title">No Analysis Data</div>
                    <div class="empty-description">Run a privacy analysis to see insights about this website.</div>
                </div>
            `;
        }
    }

    manageCookies() {
        chrome.tabs.create({ url: 'chrome://settings/cookies' });
    }

    viewSummary() {
        if (this.analysisData.terms) {
            this.switchTab('terms');
        } else {
            this.showError('No terms analysis available. Please analyze terms first.');
        }
    }

    // UI State Management
    updateStatus() {
        document.getElementById('cookie-count').textContent = this.cookieCount;
        document.getElementById('terms-status').textContent = this.termsStatus;
    }

    showLoading(show, text = 'Analyzing...') {
        const loadingElement = document.getElementById('loading');
        const loadingText = document.getElementById('loading-text');
        
        loadingElement.classList.toggle('active', show);
        loadingText.textContent = text;
        
        // Disable buttons during loading
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            btn.disabled = show;
            btn.style.opacity = show ? '0.6' : '1';
        });
    }

    startLogoAnimation() {
        document.getElementById('logo-icon').classList.add('loading');
    }

    stopLogoAnimation() {
        document.getElementById('logo-icon').classList.remove('loading');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10000;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            max-width: 280px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            ${type === 'success' 
                ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;'
                : 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'
            }
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
    }

    // Message Handlers
    handleCookieReport(message) {
        this.analysisData.cookies = message.cookies || [];
        this.cookieCount = this.analysisData.cookies.length;
        this.updateStatus();
        
        if (document.querySelector('.nav-tab.active').dataset.tab === 'cookies') {
            this.displayCookieResults();
        }
    }

    handleTermsAnalysis(message) {
        this.analysisData.terms = message.data;
        this.termsStatus = 'Analyzed';
        this.updateStatus();
        
        if (document.querySelector('.nav-tab.active').dataset.tab === 'terms') {
            this.displayTermsResults();
        }
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PrivacyLensPopup();
});

console.log('Privacy Lens Professional popup loaded');