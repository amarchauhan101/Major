// ============================================================
// 🎨 Fixed Popup Script with CSS-based Visualizations
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Fixed Visual Popup loaded');
    
    // Get DOM elements
    const analyzeBtn = document.getElementById('analyze-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const languageSelect = document.getElementById('language-select');
    const backendStatus = document.getElementById('backend-status');
    const analysisStatus = document.getElementById('analysis-status');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const errorMessage = document.getElementById('error-message');
    
    // Result elements
    const riskCircle = document.getElementById('risk-circle');
    const riskPercentage = document.getElementById('risk-percentage');
    const riskBadge = document.getElementById('risk-badge');
    const riskDescription = document.getElementById('risk-description');
    const summaryText = document.getElementById('summary-text');
    const keyPointsList = document.getElementById('key-points');
    const importantClauses = document.getElementById('important-clauses');
    const categoriesVisual = document.getElementById('categories-visual');
    const wordCount = document.getElementById('word-count');
    const readingTime = document.getElementById('reading-time');
    const readabilityScore = document.getElementById('readability-score');

    // Tab system
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    let isAnalyzing = false;
    let currentLanguage = 'en';
    let chartInstances = {};

    // Initialize
    checkBackendStatus();
    setupTabSystem();
    setupAccordionSystem();
    loadSavedLanguage();
    loadRecentAnalysis();
    
    // DEBUG: Auto-load demo data for testing
    setTimeout(() => {
        console.log('🧪 Loading demo data for testing...');
        const demoData = {
            summary: {
                executive_summary: "This is a comprehensive Terms & Conditions analysis showing how the enhanced features work. The document contains various clauses for data collection, user rights, and service terms.",
                key_points: [
                    "Personal data collection includes email, location, and device information",
                    "Data is used for advertising, analytics, and personalization",
                    "Information may be shared with third parties and affiliates",
                    "Users have rights to delete, export, and control their data",
                    "Service can be terminated with limited notice"
                ],
                important_clauses: [
                    {
                        clause: "We may collect personal information including email addresses, location data, and device information for advertising purposes",
                        type: "Data Collection",
                        concern_level: "high"
                    },
                    {
                        clause: "We reserve the right to terminate your account at any time with minimal notice",
                        type: "Termination",
                        concern_level: "high"
                    },
                    {
                        clause: "We are not responsible for any damages or losses arising from service use",
                        type: "Liability",
                        concern_level: "medium"
                    }
                ],
                categories: {
                    privacy_data: 85,
                    payments_billing: 45,
                    user_obligations: 70,
                    company_rights: 90,
                    dispute_resolution: 55,
                    cookies_tracking: 75
                },
                enhanced_analysis: createFallbackAnalysis(),
                readability_score: 45,
                word_count: 2850,
                estimated_reading_time: 14
            },
            risk_analysis: {
                risk_level: "HIGH",
                overall_risk: 75,
                label_scores: {
                    "privacy risk": 0.8,
                    "data sharing with third parties": 0.9,
                    "automatic renewal": 0.6,
                    "hidden fees": 0.3,
                    "difficult cancellation": 0.7,
                    "arbitration clause": 0.8,
                    "high liability": 0.9,
                    "low risk / consumer friendly": 0.2
                }
            }
        };
        
        displayResults(demoData);
        showNotification('🧪 Demo data loaded - showing all enhanced features!', 'info');
    }, 2000);

    // Event listeners
    analyzeBtn.addEventListener('click', analyzeCurrentPage);
    settingsBtn.addEventListener('click', openSettings);
    languageSelect.addEventListener('change', handleLanguageChange);

    function setupTabSystem() {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                
                // Update active tab button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update active tab content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${targetTab}-tab`) {
                        content.classList.add('active');
                    }
                });
            });
        });
    }

    function setupAccordionSystem() {
        accordionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const accordionId = header.dataset.accordion;
                const content = document.getElementById(`${accordionId}-accordion`);
                const isActive = header.classList.contains('active');
                
                // Close all other accordions
                accordionHeaders.forEach(h => {
                    h.classList.remove('active');
                    const c = document.getElementById(`${h.dataset.accordion}-accordion`);
                    if (c) c.classList.remove('expanded');
                });
                
                // Toggle current accordion
                if (!isActive) {
                    header.classList.add('active');
                    if (content) content.classList.add('expanded');
                }
            });
        });
    }

    function loadSavedLanguage() {
        chrome.storage.local.get(['selectedLanguage'], (result) => {
            if (result.selectedLanguage) {
                currentLanguage = result.selectedLanguage;
                languageSelect.value = currentLanguage;
            }
        });
    }

    function handleLanguageChange() {
        currentLanguage = languageSelect.value;
        chrome.storage.local.set({ selectedLanguage: currentLanguage });
        
        // Show a subtle notification
        showNotification(`Language changed to ${languageSelect.options[languageSelect.selectedIndex].text}`);
        
        // Re-analyze if results are already shown
        if (results.classList.contains('show')) {
            analyzeCurrentPage();
        }
    }

    async function checkBackendStatus() {
        console.log('🔗 Checking backend status...');
        backendStatus.textContent = 'Checking...';
        updateStatusItem(backendStatus, 'checking');

        try {
            const response = await sendMessage({ action: 'check_backend_status' });

            if (response && response.success) {
                backendStatus.textContent = 'Connected';
                updateStatusItem(backendStatus, 'connected');
                console.log('✅ Backend connected');
            } else {
                backendStatus.textContent = 'Disconnected';
                updateStatusItem(backendStatus, 'disconnected');
                console.log('❌ Backend disconnected:', response?.error);
            }
        } catch (error) {
            console.error('💥 Backend check failed:', error);
            backendStatus.textContent = 'Error';
            updateStatusItem(backendStatus, 'disconnected');
        }
    }

    function updateStatusItem(element, status) {
        const statusItem = element.parentElement;
        const colors = {
            connected: '#28a745',
            disconnected: '#dc3545',
            checking: '#ffc107'
        };
        statusItem.style.borderLeftColor = colors[status] || '#6c757d';
    }

    async function analyzeCurrentPage() {
        if (isAnalyzing) return;

        console.log('🔍 Starting analysis...');
        isAnalyzing = true;
        
        // Update UI
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '⏳ Analyzing...';
        loading.style.display = 'block';
        results.classList.remove('show');
        errorMessage.classList.remove('show');
        analysisStatus.textContent = 'Processing...';
        updateStatusItem(analysisStatus, 'checking');

        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                throw new Error('Cannot analyze this type of page. Please navigate to a website with Terms & Conditions.');
            }

            // Inject content script if needed
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
            } catch (injectionError) {
                console.log('Content script handling:', injectionError);
            }

            // Get page content
            const contentResponse = await sendTabMessage(tab.id, { action: 'get_page_content' });

            if (!contentResponse || !contentResponse.success || !contentResponse.content) {
                throw new Error('No Terms & Conditions content found on this page. Please navigate to a page with T&C content.');
            }

            console.log('📄 Content extracted, sending for analysis...');

            // Send for analysis with language support
            const analysisResponse = await sendMessage({
                action: 'analyze_content',
                content: contentResponse.content,
                url: tab.url,
                language: currentLanguage
            });

            if (!analysisResponse || !analysisResponse.success) {
                throw new Error(analysisResponse?.error || 'Analysis failed. Please check if the backend server is running.');
            }

            console.log('✅ Analysis completed successfully');
            displayResults(analysisResponse.data);
            showNotification('✅ Analysis completed successfully!', 'success');

        } catch (error) {
            console.error('💥 Analysis error:', error);
            
            // Show fallback analysis for demonstration
            console.log('🔄 Showing fallback analysis for demonstration...');
            const fallbackData = {
                summary: {
                    executive_summary: "This is a sample Terms & Conditions analysis. The document contains standard clauses for data collection, user obligations, and service usage terms.",
                    key_points: [
                        "Personal data collection includes email and usage information",
                        "Data is used for service improvement and analytics",
                        "Users have rights to access and delete their data",
                        "Service can be terminated at company's discretion",
                        "Limited liability clauses present"
                    ],
                    important_clauses: [
                        {
                            clause: "We may collect personal information including email addresses and usage data",
                            type: "Data Collection",
                            concern_level: "medium"
                        },
                        {
                            clause: "We reserve the right to terminate your account at any time without notice",
                            type: "Termination",
                            concern_level: "high"
                        }
                    ],
                    categories: {
                        privacy_data: 75,
                        payments_billing: 30,
                        user_obligations: 60,
                        company_rights: 80,
                        dispute_resolution: 45,
                        cookies_tracking: 55
                    },
                    enhanced_analysis: createFallbackAnalysis(),
                    readability_score: 65,
                    word_count: 1250,
                    estimated_reading_time: 6
                },
                risk_analysis: {
                    risk_level: "MEDIUM",
                    overall_risk: 58,
                    label_scores: {
                        "privacy risk": 0.7,
                        "data sharing with third parties": 0.6,
                        "automatic renewal": 0.2,
                        "hidden fees": 0.1,
                        "difficult cancellation": 0.4,
                        "arbitration clause": 0.5,
                        "high liability": 0.6,
                        "low risk / consumer friendly": 0.3
                    }
                }
            };
            
            displayResults(fallbackData);
            showError(`Analysis failed, showing demo data. Error: ${error.message}`);
        } finally {
            // Reset UI
            isAnalyzing = false;
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '🔍 Analyze Page';
            loading.style.display = 'none';
        }
    }

    function displayResults(data) {
        console.log('📊 Displaying comprehensive results:', data);

        // Show results container
        results.classList.add('show');
        analysisStatus.textContent = 'Complete';
        updateStatusItem(analysisStatus, 'connected');

        // Display risk assessment
        if (data.risk_analysis) {
            displayRiskAssessment(data.risk_analysis);
        }

        // Display summary data
        if (data.summary) {
            displaySummaryData(data.summary);
            displayKeyPoints(data.summary.key_points || []);
            displayImportantClauses(data.summary.important_clauses || []);
            displayCategoriesVisual(data.summary.categories || {});
            displayMetadata(data.summary);
            
            // Display enhanced analysis if available
            console.log('🔍 Checking for enhanced analysis:', data.summary.enhanced_analysis);
            if (data.summary.enhanced_analysis) {
                displayComprehensiveAnalysis(data.summary.enhanced_analysis);
            } else {
                console.log('⚠️ No enhanced analysis found, creating fallback data');
                displayComprehensiveAnalysis(createFallbackAnalysis());
            }
        }

        // Store result
        storeAnalysisResult(data);
    }

    function displayRiskAssessment(riskData) {
        const riskLevel = riskData.risk_level || 'UNKNOWN';
        const riskScore = Math.round(riskData.overall_risk || 0);
        
        // Update risk percentage
        riskPercentage.textContent = `${riskScore}%`;
        
        // Update risk badge
        riskBadge.textContent = riskLevel;
        riskBadge.className = `risk-badge risk-${riskLevel.toLowerCase().replace(' ', '-')}`;
        
        // Update risk circle visual
        updateRiskCircle(riskScore, riskLevel);
        
        // Update risk description
        const descriptions = {
            'VERY LOW': 'These terms appear to be consumer-friendly with minimal concerning clauses.',
            'LOW': 'Generally acceptable terms with some standard business clauses.',
            'MEDIUM': 'Contains some clauses that warrant attention. Review recommended.',
            'HIGH': 'Contains several concerning clauses that may impact your rights. Careful review advised.'
        };
        
        riskDescription.textContent = descriptions[riskLevel] || 'Risk assessment completed.';
    }

    function updateRiskCircle(percentage, level) {
        const colors = {
            'VERY LOW': '#22c55e',
            'LOW': '#3b82f6',
            'MEDIUM': '#f59e0b',
            'HIGH': '#ef4444'
        };
        
        const color = colors[level] || '#6b7280';
        const degrees = (percentage / 100) * 360;
        
        // Update circle with conic gradient
        riskCircle.style.background = `conic-gradient(from 0deg, ${color} 0deg ${degrees}deg, #e9ecef ${degrees}deg 360deg)`;
        
        // Add completion animation
        riskCircle.style.animation = 'riskCircleAnimation 2s ease-in-out';
    }

    function displaySummaryData(summaryData) {
        summaryText.textContent = summaryData.executive_summary || 'No summary available';
    }

    function displayKeyPoints(keyPoints) {
        keyPointsList.innerHTML = '';
        
        if (!keyPoints || keyPoints.length === 0) {
            keyPointsList.innerHTML = '<div class="no-data">No key points identified in the analysis</div>';
            return;
        }

        keyPoints.forEach((point, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'key-point';
            listItem.innerHTML = `<div class="key-point-text">${point}</div>`;
            keyPointsList.appendChild(listItem);
        });
    }

    function displayImportantClauses(clauses) {
        importantClauses.innerHTML = '';
        
        if (!clauses || clauses.length === 0) {
            importantClauses.innerHTML = '<div class="no-data">No concerning clauses identified</div>';
            return;
        }

        clauses.forEach(clause => {
            const clauseElement = document.createElement('div');
            clauseElement.className = 'clause-item';
            clauseElement.innerHTML = `
                <div class="clause-type">
                    ${clause.type || 'Important Clause'}
                    <span class="concern-level concern-${clause.concern_level || 'medium'}">
                        ${clause.concern_level || 'medium'} concern
                    </span>
                </div>
                <div class="clause-text">${clause.clause || 'Clause text not available'}</div>
            `;
            importantClauses.appendChild(clauseElement);
        });
    }

    function displayCategoriesVisual(categories) {
        categoriesVisual.innerHTML = '';
        
        if (!categories || Object.keys(categories).length === 0) {
            categoriesVisual.innerHTML = '<div class="no-data">No content categories analyzed</div>';
            return;
        }

        const categoryLabels = {
            privacy_data: 'Privacy & Data',
            payments_billing: 'Payments & Billing',
            user_obligations: 'User Obligations',
            company_rights: 'Company Rights',
            dispute_resolution: 'Dispute Resolution',
            cookies_tracking: 'Cookies & Tracking'
        };

        Object.entries(categories).forEach(([key, value], index) => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'category-item';
            
            const label = categoryLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const percentage = Math.round(value || 0);
            
            categoryElement.innerHTML = `
                <div class="category-label">${label}</div>
                <div class="category-bar">
                    <div class="category-fill" style="animation-delay: ${index * 0.2}s"></div>
                </div>
                <div class="category-percentage">${percentage}%</div>
            `;
            
            categoriesVisual.appendChild(categoryElement);
            
            // Animate bar fill
            setTimeout(() => {
                const fill = categoryElement.querySelector('.category-fill');
                fill.style.width = `${percentage}%`;
            }, (index * 200) + 500);
        });
    }

    function displayMetadata(summaryData) {
        wordCount.textContent = summaryData.word_count || '--';
        readingTime.textContent = `${summaryData.estimated_reading_time || '--'} min`;
        readabilityScore.textContent = summaryData.readability_score || '--';
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        analysisStatus.textContent = 'Error';
        updateStatusItem(analysisStatus, 'disconnected');
        
        // Auto-hide error after 8 seconds
        setTimeout(() => {
            errorMessage.classList.remove('show');
        }, 8000);
    }

    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #667eea;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    function openSettings() {
        // Simple settings functionality
        const settings = {
            'Backend URL': 'http://localhost:8000',
            'Current Language': languageSelect.options[languageSelect.selectedIndex].text,
            'Auto-detect T&C': 'Enabled',
            'Notifications': 'Enabled'
        };
        
        let settingsText = 'Current Settings:\n\n';
        Object.entries(settings).forEach(([key, value]) => {
            settingsText += `${key}: ${value}\n`;
        });
        
        alert(settingsText + '\nTo change language, use the dropdown above.\nFor advanced settings, check the extension options.');
    }

    function storeAnalysisResult(data) {
        chrome.storage.local.set({
            lastAnalysis: {
                data: data,
                timestamp: Date.now(),
                language: currentLanguage
            }
        }).catch(console.error);
    }

    function loadRecentAnalysis() {
        chrome.storage.local.get(['lastAnalysis'], (result) => {
            if (result.lastAnalysis && result.lastAnalysis.data) {
                const timeDiff = Date.now() - result.lastAnalysis.timestamp;
                // Only load if analysis is less than 1 hour old
                if (timeDiff < 3600000) {
                    console.log('📋 Loading recent analysis');
                    displayResults(result.lastAnalysis.data);
                }
            }
        });
    }

    // Utility functions
    function sendMessage(message) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
    }

    function sendTabMessage(tabId, message) {
        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tabId, message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
    }

    // Handle errors gracefully
    window.addEventListener('error', (event) => {
        console.error('💥 Popup error:', event.error);
        showError('An unexpected error occurred. Please try again or check the browser console for details.');
    });

    console.log('✅ Fixed popup script initialized');

    // Fallback Analysis Data
    function createFallbackAnalysis() {
        return {
            summary_key_points: {
                main_purpose: "This service agreement outlines terms for platform usage, data handling, payment processing, and user responsibilities. Key focus areas include privacy protection, service availability, and legal compliance.",
                key_highlights: [
                    "Personal data collection for service improvement",
                    "Third-party integrations for enhanced functionality", 
                    "Automatic billing and renewal processes",
                    "User content ownership and licensing terms",
                    "Dispute resolution through arbitration"
                ],
                document_type: "Service Agreement & Privacy Policy"
            },
            data_collected: {
                types_collected: {
                    email: { detected: true, frequency: 3, examples: ["registration", "communication", "marketing"] },
                    location: { detected: true, frequency: 2, examples: ["service delivery", "analytics"] },
                    contacts: { detected: false, frequency: 0, examples: [] },
                    device_info: { detected: true, frequency: 4, examples: ["browser", "OS", "IP address", "screen resolution"] },
                    usage_data: { detected: true, frequency: 5, examples: ["clicks", "pages visited", "time spent", "features used", "search queries"] },
                    cookies: { detected: true, frequency: 3, examples: ["session", "preferences", "analytics"] },
                    personal_info: { detected: true, frequency: 2, examples: ["name", "profile info"] },
                    financial: { detected: true, frequency: 1, examples: ["payment method"] }
                },
                collection_methods: ["Forms", "Automatic", "Cookies", "Third Parties"],
                opt_out_available: true
            },
            data_usage: {
                purposes: {
                    advertising: { mentioned: true, frequency: 3, risk_level: "high" },
                    analytics: { mentioned: true, frequency: 4, risk_level: "medium" },
                    personalization: { mentioned: true, frequency: 2, risk_level: "medium" },
                    service_improvement: { mentioned: true, frequency: 3, risk_level: "low" },
                    security: { mentioned: true, frequency: 2, risk_level: "low" },
                    legal_compliance: { mentioned: true, frequency: 1, risk_level: "low" }
                },
                consent_required: true,
                opt_out_mechanisms: ["Account Settings", "Email Unsubscribe", "Contact Support"]
            },
            data_sharing: {
                sharing_entities: {
                    third_parties: { shares_with: true, frequency: 3, risk_level: "high" },
                    affiliates: { shares_with: true, frequency: 2, risk_level: "medium" },
                    advertisers: { shares_with: true, frequency: 2, risk_level: "high" },
                    government: { shares_with: true, frequency: 1, risk_level: "medium" },
                    merger_acquisition: { shares_with: true, frequency: 1, risk_level: "medium" }
                },
                user_control: true,
                anonymization: false
            },
            user_rights: {
                available_rights: {
                    delete_data: { available: true, frequency: 2, compliance_score: 10 },
                    export_data: { available: true, frequency: 1, compliance_score: 10 },
                    opt_out: { available: true, frequency: 3, compliance_score: 10 },
                    access_data: { available: true, frequency: 1, compliance_score: 10 },
                    correct_data: { available: true, frequency: 1, compliance_score: 10 },
                    restrict_processing: { available: false, frequency: 0, compliance_score: 0 }
                },
                contact_method: ["Email", "Online Form", "Phone"],
                response_time: "30 days"
            },
            liabilities: {
                liability_clauses: {
                    not_responsible: { present: true, frequency: 2, user_risk: "high" },
                    limitation_damages: { present: true, frequency: 1, user_risk: "high" },
                    indemnification: { present: true, frequency: 1, user_risk: "high" },
                    warranty_disclaimer: { present: true, frequency: 2, user_risk: "high" },
                    force_majeure: { present: true, frequency: 1, user_risk: "medium" }
                },
                user_protection_level: "Low",
                legal_jurisdiction: "Delaware, United States"
            },
            automatic_renewals: {
                renewal_practices: {
                    auto_renewal: { mentioned: true, frequency: 2, financial_risk: "high" },
                    hidden_charges: { mentioned: false, frequency: 0, financial_risk: "high" },
                    cancellation_deadline: { mentioned: true, frequency: 1, financial_risk: "medium" },
                    renewal_terms: { mentioned: true, frequency: 2, financial_risk: "medium" },
                    price_changes: { mentioned: true, frequency: 1, financial_risk: "high" }
                },
                cancellation_difficulty: "Medium",
                refund_policy: { available: true, conditions: "Within 14 days of billing" }
            },
            termination_clauses: {
                termination_rights: {
                    immediate_termination: { present: true, frequency: 1, control_risk: "high" },
                    at_will_termination: { present: true, frequency: 2, control_risk: "high" },
                    breach_termination: { present: true, frequency: 1, control_risk: "medium" },
                    data_retention: { present: true, frequency: 1, control_risk: "medium" },
                    account_suspension: { present: true, frequency: 1, control_risk: "medium" }
                },
                user_notice_period: "3 days",
                data_deletion_policy: { automatic_deletion: false, timeline: "Up to 90 days" }
            },
            risk_score_breakdown: {
                category_scores: {
                    privacy_risk: 78,
                    financial_risk: 65,
                    control_risk: 82,
                    legal_risk: 75
                },
                overall_score: 75.0,
                risk_level: "HIGH",
                risk_color: "#ef4444",
                recommendations: [
                    "Review data sharing practices carefully", 
                    "Check cancellation and refund policies",
                    "Understand termination conditions",
                    "Consider legal implications carefully",
                    "Enable privacy controls where available"
                ]
            }
        };
    }

    // Comprehensive Analysis Display Functions
    function displayComprehensiveAnalysis(enhancedData) {
        console.log('🔍 Displaying comprehensive analysis:', enhancedData);
        
        if (!enhancedData) {
            console.log('⚠️ No enhanced data provided');
            return;
        }
        
        // Display Summary/Key Points
        if (enhancedData.summary_key_points) {
            displayEnhancedSummary(enhancedData.summary_key_points);
        } else {
            console.log('⚠️ No summary_key_points found');
        }
        
        // Display Data Collected
        if (enhancedData.data_collected) {
            displayDataCollected(enhancedData.data_collected);
        } else {
            console.log('⚠️ No data_collected found');
        }
        
        // Display Data Usage
        if (enhancedData.data_usage) {
            displayDataUsage(enhancedData.data_usage);
        } else {
            console.log('⚠️ No data_usage found');
        }
        
        // Display Data Sharing
        if (enhancedData.data_sharing) {
            displayDataSharing(enhancedData.data_sharing);
        } else {
            console.log('⚠️ No data_sharing found');
        }
        
        // Display User Rights
        if (enhancedData.user_rights) {
            displayUserRights(enhancedData.user_rights);
        } else {
            console.log('⚠️ No user_rights found');
        }
        
        // Display Liabilities
        if (enhancedData.liabilities) {
            displayLiabilities(enhancedData.liabilities);
        } else {
            console.log('⚠️ No liabilities found');
        }
        
        // Display Automatic Renewals
        if (enhancedData.automatic_renewals) {
            displayAutomaticRenewals(enhancedData.automatic_renewals);
        } else {
            console.log('⚠️ No automatic_renewals found');
        }
        
        // Display Termination Clauses
        if (enhancedData.termination_clauses) {
            displayTerminationClauses(enhancedData.termination_clauses);
        } else {
            console.log('⚠️ No termination_clauses found');
        }
        
        // Display Risk Score Breakdown
        if (enhancedData.risk_score_breakdown) {
            displayRiskScoreBreakdown(enhancedData.risk_score_breakdown);
        } else {
            console.log('⚠️ No risk_score_breakdown found');
        }
    }

    function displayEnhancedSummary(summaryData) {
        const summaryText = document.getElementById('enhanced-summary-text');
        const summaryGrid = document.getElementById('enhanced-summary-grid');
        
        console.log('📄 Displaying enhanced summary:', summaryData);
        
        if (summaryData && summaryText && summaryGrid) {
            summaryText.textContent = summaryData.main_purpose || 'Enhanced summary not available';
            
            summaryGrid.innerHTML = `
                <div class="summary-card">
                    <div class="summary-card-icon">📄</div>
                    <div class="summary-card-title">Document Type</div>
                    <div class="summary-card-value">${summaryData.document_type || 'T&C'}</div>
                </div>
                <div class="summary-card">
                    <div class="summary-card-icon">✨</div>
                    <div class="summary-card-title">Key Highlights</div>
                    <div class="summary-card-value">${summaryData.key_highlights?.length || 0}</div>
                </div>
            `;
        } else {
            console.log('⚠️ Enhanced summary elements not found or data missing');
        }
    }

    function displayDataCollected(dataCollected) {
        const container = document.getElementById('data-collected-chart');
        
        console.log('📊 Displaying data collected:', dataCollected);
        
        if (!container) {
            console.log('⚠️ Data collected container not found');
            return;
        }
        
        if (!dataCollected || !dataCollected.types_collected) {
            container.innerHTML = '<div class="no-data">No data collection information available</div>';
            return;
        }
        
        container.innerHTML = '';
        
        Object.entries(dataCollected.types_collected).forEach(([type, info], index) => {
            const riskLevel = info.detected ? (info.frequency > 2 ? 'high' : 'medium') : 'low';
            const percentage = info.detected ? Math.min(100, info.frequency * 20) : 0;
            
            const chartBar = document.createElement('div');
            chartBar.className = 'chart-bar';
            chartBar.innerHTML = `
                <div class="chart-label">${type.replace(/_/g, ' ')}</div>
                <div class="chart-bar-fill">
                    <div class="chart-fill-inner"></div>
                </div>
                <div class="chart-value ${riskLevel}">${percentage}%</div>
            `;
            
            container.appendChild(chartBar);
            
            // Animate bar fill
            setTimeout(() => {
                const fill = chartBar.querySelector('.chart-fill-inner');
                fill.style.width = `${percentage}%`;
            }, index * 200);
        });
    }

    function displayDataUsage(dataUsage) {
        const container = document.getElementById('data-usage-heatmap');
        
        if (!dataUsage || !dataUsage.purposes) {
            container.innerHTML = '<div class="no-data">No data usage information available</div>';
            return;
        }
        
        container.innerHTML = '';
        
        Object.entries(dataUsage.purposes).forEach(([purpose, info]) => {
            const riskClass = info.risk_level === 'high' ? 'heatmap-high' : 
                            info.risk_level === 'medium' ? 'heatmap-medium' : 'heatmap-low';
            
            const cell = document.createElement('div');
            cell.className = `heatmap-cell ${riskClass}`;
            cell.innerHTML = `
                <div>${purpose.replace(/_/g, ' ')}</div>
                <div>${info.mentioned ? 'Used' : 'Not Used'}</div>
            `;
            
            container.appendChild(cell);
        });
    }

    function displayDataSharing(dataSharing) {
        const container = document.getElementById('data-sharing-wordcloud');
        
        if (!dataSharing || !dataSharing.sharing_entities) {
            container.innerHTML = '<div class="no-data">No data sharing information available</div>';
            return;
        }
        
        container.innerHTML = '';
        
        Object.entries(dataSharing.sharing_entities).forEach(([entity, info]) => {
            if (info.shares_with) {
                const tag = document.createElement('div');
                tag.className = `word-tag ${info.risk_level === 'high' ? 'frequent' : ''}`;
                tag.textContent = entity.replace(/_/g, ' ');
                tag.style.backgroundColor = info.risk_level === 'high' ? '#ef4444' : 
                                          info.risk_level === 'medium' ? '#f59e0b' : '#22c55e';
                container.appendChild(tag);
            }
        });
        
        if (container.children.length === 0) {
            container.innerHTML = '<div class="no-data">No data sharing detected</div>';
        }
    }

    function displayUserRights(userRights) {
        const container = document.getElementById('user-rights-timeline');
        
        if (!userRights || !userRights.available_rights) {
            container.innerHTML = '<div class="no-data">No user rights information available</div>';
            return;
        }
        
        container.innerHTML = '';
        
        Object.entries(userRights.available_rights).forEach(([right, info]) => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            timelineItem.innerHTML = `
                <div class="timeline-icon">${info.available ? '✓' : '✗'}</div>
                <div class="timeline-content">
                    <div class="timeline-title">${right.replace(/_/g, ' ')}</div>
                    <div class="timeline-description">${info.available ? 'Available' : 'Not Available'}</div>
                </div>
            `;
            
            container.appendChild(timelineItem);
        });
    }

    function displayLiabilities(liabilities) {
        const container = document.getElementById('liabilities-text');
        
        if (!liabilities || !liabilities.liability_clauses) {
            container.innerHTML = '<div class="no-data">No liability information available</div>';
            return;
        }
        
        let liabilityText = '';
        
        Object.entries(liabilities.liability_clauses).forEach(([clause, info]) => {
            if (info.present) {
                const riskClass = info.user_risk === 'high' ? 'text-danger' : 
                                info.user_risk === 'medium' ? 'text-caution' : 'text-safe';
                liabilityText += `<span class="${riskClass}">${clause.replace(/_/g, ' ')}</span> `;
            }
        });
        
        container.innerHTML = liabilityText || '<div class="no-data">No concerning liability clauses detected</div>';
    }

    function displayAutomaticRenewals(renewals) {
        const container = document.getElementById('renewals-chart');
        
        if (!renewals || !renewals.renewal_practices) {
            container.innerHTML = '<div class="no-data">No renewal information available</div>';
            return;
        }
        
        container.innerHTML = '';
        
        Object.entries(renewals.renewal_practices).forEach(([practice, info], index) => {
            const riskLevel = info.financial_risk === 'high' ? 'high' : 
                            info.financial_risk === 'medium' ? 'medium' : 'low';
            const percentage = info.mentioned ? (info.frequency * 25) : 0;
            
            const chartBar = document.createElement('div');
            chartBar.className = 'chart-bar';
            chartBar.innerHTML = `
                <div class="chart-label">${practice.replace(/_/g, ' ')}</div>
                <div class="chart-bar-fill">
                    <div class="chart-fill-inner"></div>
                </div>
                <div class="chart-value ${riskLevel}">${percentage}%</div>
            `;
            
            container.appendChild(chartBar);
            
            // Animate bar fill
            setTimeout(() => {
                const fill = chartBar.querySelector('.chart-fill-inner');
                fill.style.width = `${percentage}%`;
            }, index * 200);
        });
    }

    function displayTerminationClauses(termination) {
        const container = document.getElementById('termination-timeline');
        
        if (!termination || !termination.termination_rights) {
            container.innerHTML = '<div class="no-data">No termination information available</div>';
            return;
        }
        
        container.innerHTML = '';
        
        Object.entries(termination.termination_rights).forEach(([clause, info]) => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            timelineItem.style.borderLeftColor = info.control_risk === 'high' ? '#ef4444' : 
                                                info.control_risk === 'medium' ? '#f59e0b' : '#22c55e';
            timelineItem.innerHTML = `
                <div class="timeline-icon">${info.present ? '⚠️' : '✓'}</div>
                <div class="timeline-content">
                    <div class="timeline-title">${clause.replace(/_/g, ' ')}</div>
                    <div class="timeline-description">${info.present ? 'Present' : 'Not Present'}</div>
                </div>
            `;
            
            container.appendChild(timelineItem);
        });
    }

    function displayRiskScoreBreakdown(riskScore) {
        const heatmapContainer = document.getElementById('risk-breakdown-heatmap');
        
        if (!riskScore || !riskScore.category_scores) {
            heatmapContainer.innerHTML = '<div class="no-data">No risk breakdown available</div>';
            return;
        }
        
        // Display heatmap
        heatmapContainer.innerHTML = '';
        
        Object.entries(riskScore.category_scores).forEach(([category, score]) => {
            const riskClass = score >= 75 ? 'heatmap-high' : 
                            score >= 50 ? 'heatmap-medium' : 'heatmap-low';
            
            const cell = document.createElement('div');
            cell.className = `heatmap-cell ${riskClass}`;
            cell.innerHTML = `
                <div>${category.replace(/_/g, ' ')}</div>
                <div>${Math.round(score)}%</div>
            `;
            
            heatmapContainer.appendChild(cell);
        });
        
        // Create radar chart if Chart.js is available
        if (typeof Chart !== 'undefined') {
            createRadarChart(riskScore.category_scores);
        }
    }

    function createRadarChart(categoryScores) {
        const canvas = document.getElementById('risk-radar-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (chartInstances.radarChart) {
            chartInstances.radarChart.destroy();
        }
        
        const labels = Object.keys(categoryScores).map(key => key.replace(/_/g, ' '));
        const data = Object.values(categoryScores);
        
        chartInstances.radarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Risk Score',
                    data: data,
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(102, 126, 234, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            display: false
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        angleLines: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
});