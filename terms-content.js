// ============================================================
// 🔍 Content Script - T&C Detection & Extraction
// ============================================================

(function() {
    'use strict';

    if (window.tcAnalyzerInitialized) {
        return;
    }
    window.tcAnalyzerInitialized = true;

    class TCDetector {
        constructor() {
            this.termsKeywords = [
                'terms and conditions', 'terms of service', 'terms of use',
                'user agreement', 'service agreement', 'privacy policy',
                'end user license', 'acceptable use', 'legal terms',
                'terms & conditions', 'tos', 'eula', 'user terms'
            ];
            this.isProcessing = false;
            this.addDetectionButton();
            this.setupMessageListener();
        }

        detectTermsContent() {
            console.log('🔍 Scanning page for Terms & Conditions...');
            
            const pageTitle = document.title.toLowerCase();
            const pageUrl = window.location.href.toLowerCase();
            
            if (this.containsTermsKeywords(pageTitle) || this.containsTermsKeywords(pageUrl)) {
                console.log('✅ T&C page detected via title/URL');
                return this.extractMainContent();
            }

            const tcContainers = this.findTCContainers();
            if (tcContainers.length > 0) {
                console.log('✅ T&C content detected via containers');
                return this.extractFromContainers(tcContainers);
            }

            const tcLinks = this.findTCLinks();
            if (tcLinks.length > 0) {
                console.log('✅ T&C links found on page');
                return this.extractNearbyContent(tcLinks);
            }

            const mainContent = this.extractMainContent();
            if (mainContent && mainContent.length > 500) {
                console.log('📄 Substantial content found, analyzing...');
                return mainContent;
            }

            console.log('❌ No T&C content detected');
            return null;
        }

        containsTermsKeywords(text) {
            return this.termsKeywords.some(keyword => text.includes(keyword));
        }

        findTCContainers() {
            const selectors = [
                '[class*="terms"]', '[class*="condition"]', '[class*="agreement"]',
                '[class*="policy"]', '[class*="legal"]', '[class*="tos"]',
                '[id*="terms"]', '[id*="condition"]', '[id*="agreement"]',
                '[id*="policy"]', '[id*="legal"]', '[id*="tos"]'
            ];

            const containers = [];
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el.textContent.length > 200) {
                        containers.push(el);
                    }
                });
            });

            return containers;
        }

        findTCLinks() {
            const links = Array.from(document.querySelectorAll('a'));
            return links.filter(link => {
                const linkText = link.textContent.toLowerCase();
                const linkHref = link.href.toLowerCase();
                return this.containsTermsKeywords(linkText) || this.containsTermsKeywords(linkHref);
            });
        }

        extractFromContainers(containers) {
            let content = '';
            containers.forEach(container => {
                content += this.cleanText(container.textContent) + '\n\n';
            });
            return content.trim();
        }

        extractNearbyContent(links) {
            let content = '';
            links.forEach(link => {
                const parent = link.closest('section, div, article, main');
                if (parent) {
                    content += this.cleanText(parent.textContent) + '\n\n';
                }
            });
            return content.trim();
        }

        extractMainContent() {
            const contentSelectors = [
                'main', 'article', '[role="main"]', '.main-content',
                '.content', '.page-content', '.post-content', '.entry-content',
                '#content', '#main', '.container', '.wrapper'
            ];

            for (const selector of contentSelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.length > 300) {
                    return this.cleanText(element.textContent);
                }
            }

            return this.cleanText(document.body.textContent);
        }

        cleanText(text) {
            return text
                .replace(/\s+/g, ' ')
                .replace(/\n\s*\n/g, '\n')
                .trim();
        }

        addDetectionButton() {
            const existingBtn = document.getElementById('tc-analyzer-btn');
            if (existingBtn) existingBtn.remove();

            const button = document.createElement('div');
            button.id = 'tc-analyzer-btn';
            button.innerHTML = `
                <div class="tc-btn-icon">📋</div>
                <div class="tc-btn-text">Analyze T&C</div>
            `;
            
            button.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 10000;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
                font-family: 'Segoe UI', sans-serif;
                color: white;
                font-size: 12px;
                font-weight: 600;
                text-align: center;
                user-select: none;
            `;

            button.addEventListener('mouseenter', () => {
                button.style.transform = 'scale(1.1)';
                button.style.boxShadow = '0 6px 25px rgba(0,0,0,0.4)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'scale(1)';
                button.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
            });

            button.addEventListener('click', () => this.handleAnalyzeClick());

            document.body.appendChild(button);
        }

        async handleAnalyzeClick() {
            if (this.isProcessing) return;

            this.isProcessing = true;
            const button = document.getElementById('tc-analyzer-btn');
            
            button.innerHTML = `
                <div style="animation: spin 1s linear infinite;">⏳</div>
                <div style="font-size: 10px;">Processing...</div>
            `;

            if (!document.querySelector('#tc-spin-style')) {
                const style = document.createElement('style');
                style.id = 'tc-spin-style';
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }

            try {
                const content = this.detectTermsContent();
                
                if (!content) {
                    this.showMessage('❌ No Terms & Conditions found on this page', 'error');
                    return;
                }

                if (content.length < 100) {
                    this.showMessage('⚠️ Content too short for meaningful analysis', 'warning');
                    return;
                }

                chrome.runtime.sendMessage({
                    action: 'analyze_content',
                    content: content,
                    url: window.location.href
                }, (response) => {
                    if (response && response.success) {
                        this.showMessage('✅ Analysis complete! Check extension popup.', 'success');
                    } else {
                        this.showMessage('❌ Analysis failed. Please try again.', 'error');
                    }
                });

            } catch (error) {
                console.error('T&C Analysis error:', error);
                this.showMessage('❌ Analysis failed. Please try again.', 'error');
            } finally {
                this.isProcessing = false;
                setTimeout(() => {
                    button.innerHTML = `
                        <div class="tc-btn-icon">📋</div>
                        <div class="tc-btn-text">Analyze T&C</div>
                    `;
                }, 2000);
            }
        }

        showMessage(text, type) {
            const existingMsg = document.getElementById('tc-message');
            if (existingMsg) existingMsg.remove();

            const message = document.createElement('div');
            message.id = 'tc-message';
            message.textContent = text;
            
            const colors = {
                success: '#4CAF50',
                error: '#f44336',
                warning: '#ff9800'
            };

            message.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${colors[type] || '#2196F3'};
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 10001;
                font-family: 'Segoe UI', sans-serif;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                max-width: 300px;
                word-wrap: break-word;
                animation: slideIn 0.3s ease;
            `;

            if (!document.querySelector('#tc-slide-style')) {
                const style = document.createElement('style');
                style.id = 'tc-slide-style';
                style.textContent = `
                    @keyframes slideIn {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }

            document.body.appendChild(message);

            setTimeout(() => {
                if (message.parentNode) {
                    message.style.animation = 'slideIn 0.3s ease reverse';
                    setTimeout(() => message.remove(), 300);
                }
            }, 4000);
        }

        setupMessageListener() {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (request.action === 'get_page_content') {
                    const content = this.detectTermsContent();
                    sendResponse({
                        success: !!content,
                        content: content,
                        url: window.location.href,
                        title: document.title
                    });
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new TCDetector());
    } else {
        new TCDetector();
    }

})();