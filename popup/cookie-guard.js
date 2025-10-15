// 🍪 COOKIE GUARD - ADVANCED COOKIE MANAGEMENT 🍪

class CookieGuard {
    constructor() {
        this.cookies = [];
        this.cookiePreferences = {};
        this.currentFilter = 'all';
        this.cookieData = {};
        
        this.init();
    }

    async init() {
        console.log('🍪 Cookie Guard initialized');
        
        // Load cookie data
        await this.loadCookieData();
        
        // Load user preferences
        await this.loadUserPreferences();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Scan current page cookies
        await this.scanCookies();
    }

    async loadCookieData() {
        try {
            const response = await fetch(chrome.runtime.getURL('cookie_prediction_map.json'));
            this.cookieData = await response.json();
            console.log('✅ Cookie data loaded:', Object.keys(this.cookieData).length, 'cookies');
        } catch (error) {
            console.error('❌ Failed to load cookie data:', error);
        }
    }

    async loadUserPreferences() {
        try {
            const result = await chrome.storage.local.get(['cookiePreferences']);
            this.cookiePreferences = result.cookiePreferences || {};
            console.log('✅ User preferences loaded:', this.cookiePreferences);
        } catch (error) {
            console.error('❌ Failed to load user preferences:', error);
        }
    }

    async saveUserPreferences() {
        try {
            await chrome.storage.local.set({ cookiePreferences: this.cookiePreferences });
            console.log('✅ User preferences saved');
        } catch (error) {
            console.error('❌ Failed to save user preferences:', error);
        }
    }

    setupEventListeners() {
        // Back button
        document.getElementById('backBtn').addEventListener('click', () => {
            this.goBack();
        });

        // Action buttons
        document.getElementById('acceptEssentialBtn').addEventListener('click', () => {
            this.acceptEssentialCookies();
        });

        document.getElementById('acceptAllBtn').addEventListener('click', () => {
            this.acceptAllCookies();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Modal close
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('modalCloseBtn').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal on outside click
        document.getElementById('cookieModal').addEventListener('click', (e) => {
            if (e.target.id === 'cookieModal') {
                this.closeModal();
            }
        });
    }

    async scanCookies() {
        try {
            // Show loading state
            this.showLoadingState();

            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab?.url) {
                this.showError('No active tab found');
                return;
            }

            // Get cookies for current domain
            const cookies = await chrome.cookies.getAll({ url: tab.url });
            
            // Process cookies with enhanced data
            this.cookies = cookies.map(cookie => this.enhanceCookieData(cookie));
            
            // Update statistics
            this.updateStatistics();
            
            // Render cookies
            this.renderCookies();
            
            console.log('✅ Cookies scanned:', this.cookies.length);
            
        } catch (error) {
            console.error('❌ Failed to scan cookies:', error);
            this.showError('Failed to scan cookies');
        }
    }

    enhanceCookieData(cookie) {
        const cookieInfo = this.cookieData[cookie.name] || {
            category: 'Unknown',
            purpose: 'Unknown purpose',
            risk: 'Medium',
            essential: false,
            description: 'No detailed information available for this cookie',
            data_collected: ['Unknown'],
            retention: 'Unknown',
            third_party: false
        };

        return {
            ...cookie,
            category: cookieInfo.category,
            purpose: cookieInfo.purpose,
            risk: cookieInfo.risk,
            essential: cookieInfo.essential,
            description: cookieInfo.description,
            data_collected: cookieInfo.data_collected,
            retention: cookieInfo.retention,
            third_party: cookieInfo.third_party,
            isAllowed: this.cookiePreferences[`${cookie.name}|${cookie.domain}`] !== false,
            riskLevel: cookieInfo.risk.toLowerCase()
        };
    }

    updateStatistics() {
        const total = this.cookies.length;
        const essential = this.cookies.filter(c => c.essential).length;
        const tracking = this.cookies.filter(c => c.category === 'Tracking' || c.category === 'Marketing').length;
        const lowRisk = this.cookies.filter(c => c.risk === 'Low').length;
        const mediumRisk = this.cookies.filter(c => c.risk === 'Medium').length;
        const highRisk = this.cookies.filter(c => c.risk === 'High').length;

        // Update header stats
        document.getElementById('totalCookies').textContent = total;
        document.getElementById('essentialCookies').textContent = essential;
        document.getElementById('trackingCookies').textContent = tracking;

        // Update risk stats
        document.getElementById('lowRiskCount').textContent = lowRisk;
        document.getElementById('mediumRiskCount').textContent = mediumRisk;
        document.getElementById('highRiskCount').textContent = highRisk;
    }

    renderCookies() {
        const cookieList = document.getElementById('cookieList');
        const filteredCookies = this.getFilteredCookies();

        if (filteredCookies.length === 0) {
            cookieList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🍪</div>
                    <p>No cookies found matching the current filter</p>
                </div>
            `;
            return;
        }

        cookieList.innerHTML = filteredCookies.map(cookie => this.createCookieCard(cookie)).join('');
        
        // Add event listeners to cookie cards
        this.attachCookieEventListeners();
    }

    getFilteredCookies() {
        switch (this.currentFilter) {
            case 'essential':
                return this.cookies.filter(c => c.essential);
            case 'tracking':
                return this.cookies.filter(c => c.category === 'Tracking' || c.category === 'Marketing');
            case 'marketing':
                return this.cookies.filter(c => c.category === 'Marketing');
            default:
                return this.cookies;
        }
    }

    createCookieCard(cookie) {
        const riskClass = `risk-${cookie.riskLevel}`;
        const isEssential = cookie.essential;
        const isAllowed = cookie.isAllowed;

        return `
            <div class="cookie-item ${riskClass}" data-cookie-name="${cookie.name}" data-cookie-domain="${cookie.domain}">
                <div class="cookie-header">
                    <div class="cookie-name">${cookie.name}</div>
                    <div class="risk-badge ${cookie.riskLevel}">${cookie.risk}</div>
                </div>
                
                <div class="cookie-details">
                    <div class="cookie-detail-row">
                        <span class="cookie-detail-label">Domain:</span>
                        <span class="cookie-detail-value">${cookie.domain}</span>
                    </div>
                    <div class="cookie-detail-row">
                        <span class="cookie-detail-label">Category:</span>
                        <span class="cookie-detail-value">${cookie.category}</span>
                    </div>
                    <div class="cookie-detail-row">
                        <span class="cookie-detail-label">Type:</span>
                        <span class="cookie-detail-value">${cookie.third_party ? 'Third-Party' : 'First-Party'}</span>
                    </div>
                    <div class="cookie-detail-row">
                        <span class="cookie-detail-label">Retention:</span>
                        <span class="cookie-detail-value">${cookie.retention}</span>
                    </div>
                </div>
                
                <div class="cookie-description ${cookie.riskLevel}">
                    <strong>Purpose:</strong> ${cookie.purpose}
                </div>
                
                <div class="cookie-toggle-container">
                    <label class="cookie-toggle-label">
                        <input type="checkbox" 
                               class="cookie-toggle" 
                               data-name="${cookie.name}" 
                               data-domain="${cookie.domain}"
                               ${isAllowed ? 'checked' : ''}
                               ${isEssential ? 'disabled' : ''}>
                        <span>Allow this cookie</span>
                    </label>
                    ${isEssential ? '<span class="essential-badge">Essential</span>' : ''}
                </div>
            </div>
        `;
    }

    attachCookieEventListeners() {
        // Cookie card click for details
        document.querySelectorAll('.cookie-item').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('cookie-toggle') && !e.target.closest('.cookie-toggle-container')) {
                    const cookieName = card.dataset.cookieName;
                    const cookie = this.cookies.find(c => c.name === cookieName);
                    if (cookie) {
                        this.showCookieDetails(cookie);
                    }
                }
            });
        });

        // Toggle changes
        document.querySelectorAll('.cookie-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const cookieName = e.target.dataset.name;
                const cookieDomain = e.target.dataset.domain;
                const isAllowed = e.target.checked;
                
                this.updateCookiePreference(cookieName, cookieDomain, isAllowed);
            });
        });
    }

    async updateCookiePreference(cookieName, cookieDomain, isAllowed) {
        const key = `${cookieName}|${cookieDomain}`;
        this.cookiePreferences[key] = isAllowed;
        
        // Save preferences
        await this.saveUserPreferences();
        
        // Update cookie in the array
        const cookie = this.cookies.find(c => c.name === cookieName && c.domain === cookieDomain);
        if (cookie) {
            cookie.isAllowed = isAllowed;
        }
        
        console.log(`🔧 Updated preference: ${key} = ${isAllowed}`);
    }

    showCookieDetails(cookie) {
        const modal = document.getElementById('cookieModal');
        const modalBody = document.getElementById('modalBody');
        
        document.getElementById('modalCookieName').textContent = cookie.name;
        
        modalBody.innerHTML = `
            <div class="cookie-detail-section">
                <h4>📊 Cookie Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Domain:</strong> ${cookie.domain}
                    </div>
                    <div class="detail-item">
                        <strong>Category:</strong> ${cookie.category}
                    </div>
                    <div class="detail-item">
                        <strong>Risk Level:</strong> <span class="risk-badge ${cookie.riskLevel}">${cookie.risk}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Essential:</strong> ${cookie.essential ? 'Yes' : 'No'}
                    </div>
                    <div class="detail-item">
                        <strong>Third-Party:</strong> ${cookie.third_party ? 'Yes' : 'No'}
                    </div>
                    <div class="detail-item">
                        <strong>Retention:</strong> ${cookie.retention}
                    </div>
                </div>
            </div>
            
            <div class="cookie-detail-section">
                <h4>🎯 Purpose</h4>
                <p>${cookie.purpose}</p>
            </div>
            
            <div class="cookie-detail-section">
                <h4>📝 Description</h4>
                <p>${cookie.description}</p>
            </div>
            
            <div class="cookie-detail-section">
                <h4>📊 Data Collected</h4>
                <ul>
                    ${cookie.data_collected.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            
            <div class="cookie-detail-section">
                <h4>🔧 Technical Details</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Path:</strong> ${cookie.path}
                    </div>
                    <div class="detail-item">
                        <strong>Secure:</strong> ${cookie.secure ? 'Yes' : 'No'}
                    </div>
                    <div class="detail-item">
                        <strong>HttpOnly:</strong> ${cookie.httpOnly ? 'Yes' : 'No'}
                    </div>
                    <div class="detail-item">
                        <strong>SameSite:</strong> ${cookie.sameSite || 'None'}
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.add('show');
    }

    closeModal() {
        document.getElementById('cookieModal').classList.remove('show');
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        // Re-render cookies
        this.renderCookies();
    }

    async acceptEssentialCookies() {
        console.log('🛡️ Accepting essential cookies only');
        
        // Update preferences for essential cookies only
        this.cookies.forEach(cookie => {
            const key = `${cookie.name}|${cookie.domain}`;
            this.cookiePreferences[key] = cookie.essential;
        });
        
        await this.saveUserPreferences();
        
        // Update UI
        this.renderCookies();
        
        // Show success message
        this.showSuccessMessage('Essential cookies accepted');
    }

    async acceptAllCookies() {
        console.log('✅ Accepting all cookies');
        
        // Update preferences for all cookies
        this.cookies.forEach(cookie => {
            const key = `${cookie.name}|${cookie.domain}`;
            this.cookiePreferences[key] = true;
        });
        
        await this.saveUserPreferences();
        
        // Update UI
        this.renderCookies();
        
        // Show success message
        this.showSuccessMessage('All cookies accepted');
    }

    showLoadingState() {
        const cookieList = document.getElementById('cookieList');
        cookieList.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Scanning cookies...</p>
            </div>
        `;
    }

    showError(message) {
        const cookieList = document.getElementById('cookieList');
        cookieList.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <p>${message}</p>
            </div>
        `;
    }

    showSuccessMessage(message) {
        // Create temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <div class="success-content">
                <span class="success-icon">✅</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(successDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    goBack() {
        // Navigate back to the main multilingual popup
        window.location.href = 'popup-multilingual.html';
    }
}

// Initialize Cookie Guard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CookieGuard();
});

// Add CSS for success message
const style = document.createElement('style');
style.textContent = `
    .success-message {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
        z-index: 1001;
        animation: slideInRight 0.3s ease-out;
    }
    
    .success-content {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
    }
    
    .success-icon {
        font-size: 16px;
    }
    
    @keyframes slideInRight {
        0% {
            opacity: 0;
            transform: translateX(100%);
        }
        100% {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
    }
    
    .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
    }
    
    .empty-state p {
        color: #6b7280;
        font-size: 14px;
        font-weight: 500;
    }
    
    .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
    }
    
    .error-icon {
        font-size: 48px;
        margin-bottom: 16px;
        color: #ef4444;
    }
    
    .error-state p {
        color: #dc2626;
        font-size: 14px;
        font-weight: 500;
    }
    
    .cookie-detail-section {
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid #e2e8f0;
    }
    
    .cookie-detail-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
    }
    
    .cookie-detail-section h4 {
        font-size: 16px;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .detail-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }
    
    .detail-item {
        font-size: 13px;
        color: #4b5563;
        line-height: 1.4;
    }
    
    .detail-item strong {
        color: #374151;
        font-weight: 600;
    }
    
    .cookie-detail-section ul {
        list-style: none;
        padding: 0;
    }
    
    .cookie-detail-section li {
        padding: 4px 0;
        color: #4b5563;
        font-size: 13px;
        position: relative;
        padding-left: 16px;
    }
    
    .cookie-detail-section li::before {
        content: '•';
        color: #667eea;
        font-weight: bold;
        position: absolute;
        left: 0;
    }
`;
document.head.appendChild(style);
