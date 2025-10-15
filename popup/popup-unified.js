// Unified Extension Popup Controller
class UnifiedExtensionPopup {
    constructor() {
        this.cookieCount = 0;
        this.termsStatus = 'Ready';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupMessageListener();
        this.updateStatus();
    }

    setupMessageListener() {
        // Listen for cookie report from background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === "showCookieReport") {
                this.cookieCount = message.cookies ? message.cookies.length : 0;
                this.updateStatus();
                this.showSuccess(`Cookie analysis complete! Found ${this.cookieCount} cookies with ${message.stats?.high || 0} high-risk cookies.`);
            }
        });
    }

    setupEventListeners() {
        // Cookie Guard actions
        document.getElementById('open-cookie-guard').addEventListener('click', () => {
            this.openCookieGuard();
        });

        document.getElementById('scan-cookies').addEventListener('click', () => {
            this.quickCookieScan();
        });

        // Terms AI actions
        document.getElementById('open-terms-ai').addEventListener('click', () => {
            this.openTermsAI();
        });

        document.getElementById('analyze-terms').addEventListener('click', () => {
            this.quickTermsAnalysis();
        });

        // Unified actions
        document.getElementById('full-analysis').addEventListener('click', () => {
            this.fullPrivacyAnalysis();
        });
    }

    // Open Cookie Guard in new popup window
    openCookieGuard() {
        const cookieGuardUrl = chrome.runtime.getURL('popup/popup.html');
        chrome.windows.create({
            url: cookieGuardUrl,
            type: 'popup',
            width: 400,
            height: 600,
            focused: true
        });
    }

    // Open Terms AI in new popup window
    async openTermsAI() {
        try {
            // Get current tab info before opening popup
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab || !tab.url) {
                this.showError('Cannot get current tab information');
                return;
            }

            // Store tab info for the Terms AI popup to use
            await chrome.storage.local.set({
                currentTabForAnalysis: {
                    id: tab.id,
                    url: tab.url,
                    title: tab.title,
                    timestamp: Date.now()
                }
            });

            const termsAIUrl = chrome.runtime.getURL('popup/terms/popup_fixed.html');
            chrome.windows.create({
                url: termsAIUrl,
                type: 'popup',
                width: 450,
                height: 700,
                focused: true
            });
        } catch (error) {
            console.error('Error opening Terms AI:', error);
            this.showError('Failed to open Terms AI popup');
        }
    }

    // Quick cookie scan
    async quickCookieScan() {
        this.showLoading(true);
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Send message to background script (same as standalone cookie-guard)
            chrome.runtime.sendMessage({
                action: "scanCookies",
                url: tab.url
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Cookie scan error:', chrome.runtime.lastError);
                    this.showError('Failed to scan cookies');
                } else if (response && response.success) {
                    this.cookieCount = response.count || 0;
                    this.updateStatus();
                    this.showSuccess(`Found ${this.cookieCount} cookies on this page`);
                } else {
                    this.showError('Cookie scan failed. Please try again.');
                }
                this.showLoading(false);
            });
        } catch (error) {
            console.error('Quick cookie scan error:', error);
            this.showError('Failed to scan cookies');
            this.showLoading(false);
        }
    }

    // Quick terms analysis
    async quickTermsAnalysis() {
        this.showLoading(true);
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Send message to terms content script
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'analyzeTerms'
            });

            if (response && response.success) {
                this.termsStatus = 'Analyzed';
                this.updateStatus();
                this.showSuccess('Terms analysis completed');
            } else {
                this.showError(response?.error || 'Terms analysis failed. Please ensure AI server is running.');
            }
        } catch (error) {
            console.error('Quick terms analysis error:', error);
            this.showError('Failed to analyze terms');
        } finally {
            this.showLoading(false);
        }
    }

    // Full privacy analysis using both extensions
    async fullPrivacyAnalysis() {
        this.showLoading(true);
        
        try {
            // Run both analyses in parallel
            const [cookieResult, termsResult] = await Promise.allSettled([
                this.runCookieAnalysis(),
                this.runTermsAnalysis()
            ]);

            let successCount = 0;
            let errors = [];

            if (cookieResult.status === 'fulfilled' && cookieResult.value.success) {
                successCount++;
                this.cookieCount = cookieResult.value.cookies ? cookieResult.value.cookies.length : 0;
            } else {
                errors.push('Cookie analysis failed');
            }

            if (termsResult.status === 'fulfilled' && termsResult.value.success) {
                successCount++;
                this.termsStatus = 'Analyzed';
            } else {
                errors.push('Terms analysis failed');
            }

            this.updateStatus();

            if (successCount === 2) {
                this.showSuccess('Full privacy analysis completed successfully!');
            } else if (successCount === 1) {
                this.showSuccess('Privacy analysis partially completed. ' + errors.join(', '));
            } else {
                this.showError('Privacy analysis failed: ' + errors.join(', '));
            }

        } catch (error) {
            console.error('Full analysis error:', error);
            this.showError('Full privacy analysis failed');
        } finally {
            this.showLoading(false);
        }
    }

    // Helper method to run cookie analysis
    async runCookieAnalysis() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return await chrome.tabs.sendMessage(tab.id, { action: 'scanCookies' });
    }

    // Helper method to run terms analysis
    async runTermsAnalysis() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return await chrome.tabs.sendMessage(tab.id, { action: 'analyzeTerms' });
    }

    // Update status display
    updateStatus() {
        document.getElementById('cookie-count').textContent = this.cookieCount;
        document.getElementById('terms-status').textContent = this.termsStatus;
    }

    // Show loading state
    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        loadingElement.style.display = show ? 'block' : 'none';
        
        // Disable buttons during loading
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            btn.disabled = show;
            btn.style.opacity = show ? '0.6' : '1';
        });
    }

    // Show success message
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    // Show error message
    showError(message) {
        this.showNotification(message, 'error');
    }

    // Show notification
    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10000;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 12px;
            max-width: 250px;
            ${type === 'success' 
                ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;'
                : 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'
            }
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UnifiedExtensionPopup();
});

// Handle messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateStats') {
        // Update popup stats if needed
        console.log('Stats update received:', message);
    }
});

console.log('Unified Extension popup loaded');