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
            // Get current tab - check if we have stored tab info first (for unified extension)
            let tab;
            const storedTabInfo = await getStoredTabInfo();
            
            if (storedTabInfo && storedTabInfo.url && !storedTabInfo.url.startsWith('chrome://') && !storedTabInfo.url.startsWith('chrome-extension://')) {
                // Use stored tab info from unified extension
                tab = storedTabInfo;
                console.log('🔗 Using stored tab info from unified extension:', tab.url);
            } else {
                // Fallback to getting active tab (for standalone usage)
                const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                tab = activeTab;
                console.log('🔗 Using active tab:', tab?.url);
            }
            
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
            
            // Generate dynamic enhanced analysis from real API data
            console.log('🔍 Generating dynamic analysis from API data');
            const dynamicAnalysis = generateDynamicAnalysis(data);
            displayComprehensiveAnalysis(dynamicAnalysis);
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
        
        // Update risk description with more detailed information
        const riskDescription = generateDetailedRiskDescription(riskData, riskLevel, riskScore);
        document.querySelector('.risk-description').textContent = riskDescription;
        
        // Display organized risk factors if available
        if (riskData.risk_factors && riskData.risk_factors.length > 0) {
            displayOrganizedRiskFactors(riskData.risk_factors);
        }
        
        // Display label scores if available
        if (riskData.label_scores) {
            displayLabelScores(riskData.label_scores);
        }
    }

    function generateDetailedRiskDescription(riskData, level, score) {
        const descriptions = {
            'VERY LOW': `Score: ${score}%. These terms appear to be consumer-friendly with minimal concerning clauses. Most provisions are standard and reasonable.`,
            'LOW': `Score: ${score}%. Generally acceptable terms with some standard business clauses. No major red flags detected.`,
            'MEDIUM': `Score: ${score}%. Contains some clauses that warrant attention. We recommend reviewing the highlighted sections before accepting.`,
            'HIGH': `Score: ${score}%. Contains several concerning clauses that may significantly impact your rights. Careful review strongly advised.`,
            'VERY HIGH': `Score: ${score}%. Multiple high-risk clauses detected. Consider seeking legal advice before accepting these terms.`
        };
        
        return descriptions[level] || `Score: ${score}%. Risk assessment completed. Please review the analysis details.`;
    }

    // Display risk factors in an organized, readable format
    function displayOrganizedRiskFactors(riskFactors) {
        const riskFactorsContainer = document.getElementById('risk-factors-container') || createRiskFactorsContainer();
        riskFactorsContainer.innerHTML = '';
        
        // Clean and categorize risk factors
        const organizedFactors = organizeRiskFactors(riskFactors);
        
        if (organizedFactors.length === 0) {
            riskFactorsContainer.innerHTML = '<div class="no-data">No specific risk factors identified</div>';
            return;
        }
        
        organizedFactors.forEach((factor, index) => {
            const factorElement = document.createElement('div');
            factorElement.className = 'risk-factor-item';
            factorElement.innerHTML = `
                <div class="risk-factor-header">
                    <span class="risk-factor-icon">${factor.icon}</span>
                    <span class="risk-factor-title">${factor.title}</span>
                    <span class="risk-factor-level risk-${factor.level}">${factor.level.toUpperCase()}</span>
                </div>
                <div class="risk-factor-description">${factor.description}</div>
            `;
            riskFactorsContainer.appendChild(factorElement);
        });
    }

    // Create risk factors container if it doesn't exist
    function createRiskFactorsContainer() {
        const container = document.createElement('div');
        container.id = 'risk-factors-container';
        container.className = 'risk-factors-section';
        
        // Insert after risk assessment section
        const riskSection = document.querySelector('.risk-assessment');
        if (riskSection) {
            riskSection.appendChild(container);
        }
        
        return container;
    }

    // Organize raw risk factors into readable, categorized format
    function organizeRiskFactors(rawFactors) {
        const organizedFactors = [];
        
        rawFactors.forEach(factor => {
            // Skip HTML/CSS content and meaningless text
            if (isHtmlCssCode(factor) || isNotMeaningful(factor)) {
                return;
            }
            
            // Clean the factor text
            const cleanedFactor = cleanTextContent(factor);
            
            if (cleanedFactor.length < 10) {
                return;
            }
            
            // Categorize and format the factor
            const categorizedFactor = categorizeRiskFactor(cleanedFactor);
            
            if (categorizedFactor && !organizedFactors.some(f => f.title === categorizedFactor.title)) {
                organizedFactors.push(categorizedFactor);
            }
        });
        
        return organizedFactors.slice(0, 8); // Limit to top 8 factors
    }

    // Categorize risk factors by type and content
    function categorizeRiskFactor(factorText) {
        const lowerText = factorText.toLowerCase();
        
        // Data Privacy Factors
        if (lowerText.includes('data') && (lowerText.includes('share') || lowerText.includes('collect'))) {
            return {
                icon: '🔒',
                title: 'Data Privacy Concern',
                description: 'Personal information may be collected, used, or shared in ways that could impact your privacy.',
                level: lowerText.includes('third party') ? 'high' : 'medium'
            };
        }
        
        // Financial Factors
        if (lowerText.includes('payment') || lowerText.includes('billing') || lowerText.includes('fee') || lowerText.includes('charge')) {
            return {
                icon: '💳',
                title: 'Financial Terms',
                description: 'Billing, payment, or fee-related terms that may affect your financial obligations.',
                level: lowerText.includes('automatic') || lowerText.includes('hidden') ? 'high' : 'medium'
            };
        }
        
        // Legal/Arbitration Factors
        if (lowerText.includes('arbitration') || lowerText.includes('court') || lowerText.includes('legal')) {
            return {
                icon: '⚖️',
                title: 'Legal Resolution',
                description: 'Dispute resolution terms that may limit your legal options.',
                level: lowerText.includes('binding') ? 'high' : 'medium'
            };
        }
        
        // Account Control Factors
        if (lowerText.includes('terminate') || lowerText.includes('suspend') || lowerText.includes('cancel')) {
            return {
                icon: '🚫',
                title: 'Account Control',
                description: 'Terms related to account termination, suspension, or service cancellation.',
                level: lowerText.includes('any time') || lowerText.includes('without notice') ? 'high' : 'medium'
            };
        }
        
        // Liability Factors
        if (lowerText.includes('liability') || lowerText.includes('responsible') || lowerText.includes('damage')) {
            return {
                icon: '🛡️',
                title: 'Liability Limitation',
                description: 'Terms that may limit the company\'s responsibility for damages or issues.',
                level: lowerText.includes('not responsible') || lowerText.includes('exclude') ? 'high' : 'medium'
            };
        }
        
        // User Obligations
        if (lowerText.includes('user') && (lowerText.includes('must') || lowerText.includes('shall') || lowerText.includes('agree'))) {
            return {
                icon: '📋',
                title: 'User Obligations',
                description: 'Requirements and responsibilities that you must fulfill when using the service.',
                level: 'medium'
            };
        }
        
        // Default category for other important factors
        return {
            icon: '⚠️',
            title: 'Important Notice',
            description: cleanTextContent(factorText),
            level: 'medium'
        };
    }

    // Display label scores in a more organized way
    function displayLabelScores(labelScores) {
        const scoresContainer = document.getElementById('label-scores-container') || createLabelScoresContainer();
        scoresContainer.innerHTML = '';
        
        // Sort scores by value (highest first)
        const sortedScores = Object.entries(labelScores)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6); // Show top 6 scores
        
        sortedScores.forEach(([label, score]) => {
            const scoreValue = Math.round(score * 100);
            const scoreElement = document.createElement('div');
            scoreElement.className = 'label-score-item';
            
            const riskLevel = scoreValue >= 70 ? 'high' : scoreValue >= 40 ? 'medium' : 'low';
            
            scoreElement.innerHTML = `
                <div class="label-score-bar">
                    <div class="label-score-fill risk-${riskLevel}" style="width: ${scoreValue}%"></div>
                </div>
                <div class="label-score-info">
                    <span class="label-score-title">${formatLabelTitle(label)}</span>
                    <span class="label-score-value">${scoreValue}%</span>
                </div>
            `;
            
            scoresContainer.appendChild(scoreElement);
        });
    }

    // Create label scores container if it doesn't exist
    function createLabelScoresContainer() {
        const container = document.createElement('div');
        container.id = 'label-scores-container';
        container.className = 'label-scores-section';
        
        // Insert after risk factors
        const riskFactorsContainer = document.getElementById('risk-factors-container');
        if (riskFactorsContainer) {
            riskFactorsContainer.parentNode.insertBefore(container, riskFactorsContainer.nextSibling);
        }
        
        return container;
    }

    // Format label titles for better readability
    function formatLabelTitle(label) {
        return label
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .replace('Arbitration Clause', 'Arbitration Required')
            .replace('Data Sharing With Third Parties', 'Third-Party Data Sharing')
            .replace('Difficult Cancellation', 'Cancellation Difficulty')
            .replace('Low Risk Consumer Friendly', 'Consumer Friendly Terms');
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

        // Clean and process key points to ensure readability
        const cleanedKeyPoints = cleanAndExtractMeaningfulKeyPoints(keyPoints);
        
        if (cleanedKeyPoints.length === 0) {
            keyPointsList.innerHTML = '<div class="no-data">Key points are being processed...</div>';
            return;
        }

        cleanedKeyPoints.forEach((point, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'key-point';
            listItem.innerHTML = `
                <div class="key-point-icon">🔑</div>
                <div class="key-point-text">${point}</div>
            `;
            keyPointsList.appendChild(listItem);
        });
    }

    // Clean and extract meaningful key points from potentially messy content
    function cleanAndExtractMeaningfulKeyPoints(rawKeyPoints) {
        const meaningfulPoints = [];
        
        rawKeyPoints.forEach(point => {
            // Skip if point is just HTML/CSS or contains too much code
            if (isHtmlCssCode(point)) {
                return;
            }
            
            // Clean the point and extract meaningful content
            const cleanedPoint = cleanTextContent(point);
            
            // Skip if too short or meaningless after cleaning
            if (cleanedPoint.length < 20 || isNotMeaningful(cleanedPoint)) {
                return;
            }
            
            // Convert to user-friendly format
            const userFriendlyPoint = convertToUserFriendlyPoint(cleanedPoint);
            
            if (userFriendlyPoint && !meaningfulPoints.includes(userFriendlyPoint)) {
                meaningfulPoints.push(userFriendlyPoint);
            }
        });
        
        // If no meaningful points found, generate from content analysis
        if (meaningfulPoints.length === 0) {
            return generateFallbackKeyPoints();
        }
        
        return meaningfulPoints.slice(0, 6); // Limit to top 6 points
    }

    // Check if content is HTML/CSS code
    function isHtmlCssCode(text) {
        const htmlCssIndicators = [
            'font-smoothing:', 'webkit-font-smoothing:', 'moz-osx-font-smoothing:',
            'text-rendering:', 'antialiased', 'optimizeLegibility',
            '{ font-size:', '{ color:', '{ background:', '} body {',
            'nav styles', '/*', '*/', 'px;', 'rem;', '#', 'rgba(',
            'class=', 'id=', '<div', '</div>', '<span', '</span>',
            'Download', 'Nitro', 'Discover', 'Safety', 'Resources'
        ];
        
        return htmlCssIndicators.some(indicator => 
            text.toLowerCase().includes(indicator.toLowerCase())
        );
    }

    // Clean text content from HTML and unwanted characters
    function cleanTextContent(text) {
        return text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/[{}();]/g, '') // Remove code characters
            .replace(/\d+px|\d+rem|\d+em/g, '') // Remove CSS units
            .replace(/font-[a-z-]+:/gi, '') // Remove CSS properties
            .replace(/webkit-[a-z-]+:/gi, '')
            .replace(/moz-[a-z-]+:/gi, '')
            .replace(/color:\s*[#\w]+/gi, '')
            .replace(/background:\s*[#\w]+/gi, '')
            .trim();
    }

    // Check if text is not meaningful for users
    function isNotMeaningful(text) {
        const meaninglessPatterns = [
            /^[a-z-]+:\s*[a-z-]+;?$/i, // CSS properties
            /^Download|Nitro|Discover|Safety|Resources/i, // Navigation items
            /^\d+\s*$/, // Just numbers
            /^[{}();,.\s]+$/, // Just punctuation
            /^nav\s|styles$/i, // Navigation/style references
        ];
        
        return meaninglessPatterns.some(pattern => pattern.test(text)) ||
               text.split(' ').length < 4; // Too short to be meaningful
    }

    // Convert technical content to user-friendly language
    function convertToUserFriendlyPoint(text) {
        // Common terms to user-friendly language mapping
        const conversions = {
            'data collection': 'Information we collect about you',
            'third party': 'external companies',
            'arbitration': 'dispute resolution outside of court',
            'liability': 'legal responsibility',
            'terminate': 'end or cancel',
            'indemnify': 'protect from legal claims',
            'cookies': 'tracking technologies',
            'processing': 'using or handling',
            'consent': 'permission'
        };
        
        let friendlyText = text;
        
        // Apply conversions
        Object.entries(conversions).forEach(([technical, friendly]) => {
            const regex = new RegExp(`\\b${technical}\\b`, 'gi');
            friendlyText = friendlyText.replace(regex, friendly);
        });
        
        // Ensure proper sentence structure
        friendlyText = friendlyText.charAt(0).toUpperCase() + friendlyText.slice(1);
        if (!/[.!?]$/.test(friendlyText)) {
            friendlyText += '.';
        }
        
        return friendlyText;
    }

    // Generate fallback key points when none are meaningful
    function generateFallbackKeyPoints() {
        return [
            "Review this document carefully before accepting the terms",
            "Key privacy and data handling policies are outlined",
            "User rights and responsibilities are specified", 
            "Service limitations and company policies are detailed",
            "Contact information for questions is provided"
        ];
    }

    function displayImportantClauses(clauses) {
        importantClauses.innerHTML = '';
        
        if (!clauses || clauses.length === 0) {
            importantClauses.innerHTML = '<div class="no-data">No concerning clauses identified</div>';
            return;
        }

        // Clean and organize clauses for better readability
        const processedClauses = processImportantClauses(clauses);
        
        if (processedClauses.length === 0) {
            importantClauses.innerHTML = '<div class="no-data">Important clauses are being processed...</div>';
            return;
        }

        processedClauses.forEach(clause => {
            const clauseElement = document.createElement('div');
            clauseElement.className = 'clause-item';
            
            // Get appropriate icon for clause type
            const typeIcon = getClauseTypeIcon(clause.type);
            const riskColor = getRiskColor(clause.concern_level);
            
            clauseElement.innerHTML = `
                <div class="clause-header">
                    <div class="clause-type">
                        <span class="clause-icon">${typeIcon}</span>
                        ${clause.type || 'Important Clause'}
                    </div>
                    <span class="concern-level concern-${clause.concern_level || 'medium'}" 
                          style="background-color: ${riskColor}">
                        ${(clause.concern_level || 'medium').toUpperCase()} RISK
                    </span>
                </div>
                <div class="clause-content">
                    <div class="clause-text">${clause.clause_summary || clause.clause || 'Clause text not available'}</div>
                    ${clause.user_impact ? `<div class="clause-impact">
                        <strong>Impact:</strong> ${clause.user_impact}
                    </div>` : ''}
                    ${clause.recommendation ? `<div class="clause-recommendation">
                        <strong>Recommendation:</strong> ${clause.recommendation}
                    </div>` : ''}
                </div>
            `;
            importantClauses.appendChild(clauseElement);
        });
    }

    // Process and clean important clauses for better readability
    function processImportantClauses(rawClauses) {
        const processedClauses = [];
        
        rawClauses.forEach(clause => {
            // Skip if clause is HTML/CSS or too messy
            if (isHtmlCssCode(clause.clause || '')) {
                return;
            }
            
            // Clean the clause text
            const cleanedClause = cleanClauseText(clause.clause || '');
            
            // Skip if too short or meaningless after cleaning
            if (cleanedClause.length < 30) {
                return;
            }
            
            // Create processed clause with additional context
            const processedClause = {
                type: clause.type || 'Important Clause',
                concern_level: clause.concern_level || 'medium',
                clause: cleanedClause,
                clause_summary: summarizeClause(cleanedClause),
                user_impact: generateUserImpact(clause.type, clause.concern_level),
                recommendation: generateRecommendation(clause.type, clause.concern_level)
            };
            
            processedClauses.push(processedClause);
        });
        
        return processedClauses;
    }

    // Clean clause text for better readability
    function cleanClauseText(text) {
        return text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/[{}();]/g, '') // Remove code characters
            .replace(/^\W+/, '') // Remove leading punctuation
            .replace(/\W+$/, '') // Remove trailing punctuation
            .trim();
    }

    // Create user-friendly summary of complex clauses
    function summarizeClause(clauseText) {
        // If clause is very long, create a summary
        if (clauseText.length > 200) {
            const sentences = clauseText.split(/[.!?]+/);
            const firstSentence = sentences[0]?.trim();
            if (firstSentence && firstSentence.length > 50) {
                return firstSentence + (firstSentence.endsWith('.') ? '' : '...');
            }
        }
        return clauseText;
    }

    // Generate user impact description based on clause type
    function generateUserImpact(clauseType, concernLevel) {
        const impacts = {
            'Data Sharing': {
                high: 'Your personal information may be shared with external companies without explicit consent.',
                medium: 'Your data may be shared with partners under certain conditions.',
                low: 'Limited data sharing with trusted partners only.'
            },
            'Arbitration': {
                high: 'You cannot sue the company in court and must use private arbitration.',
                medium: 'Disputes are resolved through binding arbitration rather than courts.',
                low: 'Alternative dispute resolution options are available.'
            },
            'Automatic Renewal': {
                high: 'Your subscription will automatically renew and charge you without notice.',
                medium: 'Service automatically renews unless you cancel before the deadline.',
                low: 'You will be notified before automatic renewal occurs.'
            },
            'Termination Rights': {
                high: 'The company can terminate your account at any time without reason.',
                medium: 'Your account may be suspended or terminated for policy violations.',
                low: 'Account termination follows standard procedures and warnings.'
            },
            'Liability Limitation': {
                high: 'The company is not responsible for damages even if caused by their negligence.',
                medium: 'Company liability is limited in certain situations.',
                low: 'Standard liability protections are in place.'
            }
        };

        return impacts[clauseType]?.[concernLevel] || 'This clause may affect your rights or obligations when using the service.';
    }

    // Generate recommendations based on clause type and risk level
    function generateRecommendation(clauseType, concernLevel) {
        const recommendations = {
            'Data Sharing': {
                high: 'Consider if you\'re comfortable with extensive data sharing before agreeing.',
                medium: 'Review the privacy policy for more details on data sharing practices.',
                low: 'Data sharing appears to be limited and reasonable.'
            },
            'Arbitration': {
                high: 'Be aware you\'re waiving your right to sue in court.',
                medium: 'Understand that disputes will be handled through arbitration.',
                low: 'Standard dispute resolution process is in place.'
            },
            'Automatic Renewal': {
                high: 'Set a calendar reminder to cancel before renewal if you don\'t want to continue.',
                medium: 'Note the cancellation deadline to avoid unwanted charges.',
                low: 'You should receive adequate notice before renewal.'
            },
            'Termination Rights': {
                high: 'Understand that your access could be terminated suddenly.',
                medium: 'Be aware of the conditions that could lead to account termination.',
                low: 'Standard account termination policies apply.'
            },
            'Liability Limitation': {
                high: 'Consider additional insurance or protection for important uses.',
                medium: 'Understand the limitations on company responsibility.',
                low: 'Standard liability protections are reasonable.'
            }
        };

        return recommendations[clauseType]?.[concernLevel] || 'Review this clause carefully and consider how it affects your use of the service.';
    }

    // Get appropriate icon for clause type
    function getClauseTypeIcon(clauseType) {
        const icons = {
            'Data Sharing': '🔗',
            'Arbitration': '⚖️',
            'Automatic Renewal': '🔄',
            'Termination Rights': '🚫',
            'Liability Limitation': '🛡️',
            'Privacy Policy': '🔒',
            'Payment Terms': '💳',
            'User Obligations': '📋'
        };
        
        return icons[clauseType] || '📄';
    }

    // Get color for risk level
    function getRiskColor(riskLevel) {
        const colors = {
            'high': '#ef4444',
            'medium': '#f59e0b',
            'low': '#22c55e'
        };
        
        return colors[riskLevel] || '#6b7280';
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

    // Generate Dynamic Analysis from Real API Data
    function generateDynamicAnalysis(apiData) {
        console.log('🔄 Generating dynamic analysis from API response:', apiData);
        
        const summary = apiData.summary || {};
        const riskAnalysis = apiData.risk_analysis || {};
        const categories = summary.categories || {};
        const importantClauses = summary.important_clauses || [];
        const riskFactors = riskAnalysis.risk_factors || [];
        
        // Generate data collection analysis based on important clauses
        const dataCollected = generateDataCollectionAnalysis(importantClauses, riskFactors);
        
        // Generate data usage analysis based on risk factors and categories
        const dataUsage = generateDataUsageAnalysis(riskFactors, categories);
        
        // Generate data sharing analysis
        const dataSharing = generateDataSharingAnalysis(importantClauses, riskFactors);
        
        // Generate user rights analysis
        const userRights = generateUserRightsAnalysis(importantClauses, summary.key_points || []);
        
        // Generate liabilities analysis
        const liabilities = generateLiabilitiesAnalysis(importantClauses, riskFactors);
        
        // Generate automatic renewals analysis
        const automaticRenewals = generateAutomaticRenewalsAnalysis(importantClauses, riskFactors);
        
        // Generate termination clauses analysis
        const terminationClauses = generateTerminationAnalysis(importantClauses, riskFactors);
        
        // Generate risk score breakdown
        const riskScoreBreakdown = generateRiskScoreBreakdown(riskAnalysis, categories);
        
        return {
            summary_key_points: {
                main_purpose: summary.executive_summary || "Analysis of terms and conditions document focusing on privacy, user rights, and service obligations.",
                key_highlights: summary.key_points || [],
                document_type: determineDocumentType(categories)
            },
            data_collected: dataCollected,
            data_usage: dataUsage,
            data_sharing: dataSharing,
            user_rights: userRights,
            liabilities: liabilities,
            automatic_renewals: automaticRenewals,
            termination_clauses: terminationClauses,
            risk_score_breakdown: riskScoreBreakdown
        };
    }

    function generateDataCollectionAnalysis(clauses, riskFactors) {
        const dataTypes = {
            email: { detected: false, frequency: 0, examples: [] },
            location: { detected: false, frequency: 0, examples: [] },
            contacts: { detected: false, frequency: 0, examples: [] },
            device_info: { detected: false, frequency: 0, examples: [] },
            usage_data: { detected: false, frequency: 0, examples: [] },
            cookies: { detected: false, frequency: 0, examples: [] },
            personal_info: { detected: false, frequency: 0, examples: [] },
            financial: { detected: false, frequency: 0, examples: [] }
        };

        const collectionMethods = [];
        let optOutAvailable = false;

        // Analyze clauses for data collection patterns
        clauses.forEach(clause => {
            const text = clause.clause?.toLowerCase() || '';
            
            if (text.includes('email')) {
                dataTypes.email.detected = true;
                dataTypes.email.frequency++;
                dataTypes.email.examples.push('Email communication');
            }
            
            if (text.includes('location') || text.includes('gps')) {
                dataTypes.location.detected = true;
                dataTypes.location.frequency++;
                dataTypes.location.examples.push('Location services');
            }
            
            if (text.includes('device') || text.includes('browser') || text.includes('ip')) {
                dataTypes.device_info.detected = true;
                dataTypes.device_info.frequency++;
                dataTypes.device_info.examples.push('Device information');
            }
            
            if (text.includes('usage') || text.includes('activity') || text.includes('behavior')) {
                dataTypes.usage_data.detected = true;
                dataTypes.usage_data.frequency++;
                dataTypes.usage_data.examples.push('Usage patterns');
            }
            
            if (text.includes('cookie') || text.includes('tracking')) {
                dataTypes.cookies.detected = true;
                dataTypes.cookies.frequency++;
                dataTypes.cookies.examples.push('Tracking cookies');
            }
            
            if (text.includes('personal') || text.includes('profile')) {
                dataTypes.personal_info.detected = true;
                dataTypes.personal_info.frequency++;
                dataTypes.personal_info.examples.push('Personal details');
            }
            
            if (text.includes('payment') || text.includes('billing') || text.includes('financial')) {
                dataTypes.financial.detected = true;
                dataTypes.financial.frequency++;
                dataTypes.financial.examples.push('Payment information');
            }
            
            if (text.includes('opt out') || text.includes('unsubscribe')) {
                optOutAvailable = true;
            }
            
            if (text.includes('automatic') || text.includes('cookie')) {
                collectionMethods.push('Automatic');
            }
            if (text.includes('form') || text.includes('registration')) {
                collectionMethods.push('Forms');
            }
            if (text.includes('third party') || text.includes('partner')) {
                collectionMethods.push('Third Parties');
            }
        });

        return {
            types_collected: dataTypes,
            collection_methods: [...new Set(collectionMethods)],
            opt_out_available: optOutAvailable
        };
    }

    function generateDataUsageAnalysis(riskFactors, categories) {
        const purposes = {
            advertising: { mentioned: false, frequency: 0, risk_level: "high" },
            analytics: { mentioned: false, frequency: 0, risk_level: "medium" },
            personalization: { mentioned: false, frequency: 0, risk_level: "medium" },
            service_improvement: { mentioned: false, frequency: 0, risk_level: "low" },
            security: { mentioned: false, frequency: 0, risk_level: "low" },
            legal_compliance: { mentioned: false, frequency: 0, risk_level: "low" }
        };

        // Check risk factors for usage purposes
        riskFactors.forEach(factor => {
            const factorLower = factor.toLowerCase();
            
            if (factorLower.includes('data sharing') || factorLower.includes('marketing')) {
                purposes.advertising.mentioned = true;
                purposes.advertising.frequency++;
            }
            if (factorLower.includes('analytic') || factorLower.includes('track')) {
                purposes.analytics.mentioned = true;
                purposes.analytics.frequency++;
            }
            if (factorLower.includes('personal') || factorLower.includes('customize')) {
                purposes.personalization.mentioned = true;
                purposes.personalization.frequency++;
            }
            if (factorLower.includes('improve') || factorLower.includes('enhance')) {
                purposes.service_improvement.mentioned = true;
                purposes.service_improvement.frequency++;
            }
            if (factorLower.includes('security') || factorLower.includes('protect')) {
                purposes.security.mentioned = true;
                purposes.security.frequency++;
            }
            if (factorLower.includes('legal') || factorLower.includes('compliance')) {
                purposes.legal_compliance.mentioned = true;
                purposes.legal_compliance.frequency++;
            }
        });

        // Infer from categories
        if (categories.cookies_tracking > 50) {
            purposes.advertising.mentioned = true;
            purposes.analytics.mentioned = true;
        }

        return {
            purposes: purposes,
            consent_required: true,
            opt_out_mechanisms: ["Account Settings", "Email Preferences", "Contact Support"]
        };
    }

    function generateDataSharingAnalysis(clauses, riskFactors) {
        const sharingEntities = {
            third_parties: { shares_with: false, frequency: 0, risk_level: "high" },
            affiliates: { shares_with: false, frequency: 0, risk_level: "medium" },
            advertisers: { shares_with: false, frequency: 0, risk_level: "high" },
            government: { shares_with: false, frequency: 0, risk_level: "medium" },
            merger_acquisition: { shares_with: false, frequency: 0, risk_level: "medium" }
        };

        let userControl = false;
        let anonymization = false;

        // Check for data sharing indicators
        [...clauses, ...riskFactors.map(f => ({clause: f}))].forEach(item => {
            const text = (item.clause || '').toLowerCase();
            
            if (text.includes('third party') || text.includes('third-party')) {
                sharingEntities.third_parties.shares_with = true;
                sharingEntities.third_parties.frequency++;
            }
            if (text.includes('affiliate') || text.includes('subsidiary')) {
                sharingEntities.affiliates.shares_with = true;
                sharingEntities.affiliates.frequency++;
            }
            if (text.includes('advertis') || text.includes('marketing')) {
                sharingEntities.advertisers.shares_with = true;
                sharingEntities.advertisers.frequency++;
            }
            if (text.includes('government') || text.includes('legal request') || text.includes('court')) {
                sharingEntities.government.shares_with = true;
                sharingEntities.government.frequency++;
            }
            if (text.includes('merger') || text.includes('acquisition') || text.includes('business transfer')) {
                sharingEntities.merger_acquisition.shares_with = true;
                sharingEntities.merger_acquisition.frequency++;
            }
            if (text.includes('control') || text.includes('opt out') || text.includes('manage')) {
                userControl = true;
            }
            if (text.includes('anonymous') || text.includes('aggregate')) {
                anonymization = true;
            }
        });

        return {
            sharing_entities: sharingEntities,
            user_control: userControl,
            anonymization: anonymization
        };
    }

    function generateUserRightsAnalysis(clauses, keyPoints) {
        const rights = {
            delete_data: { available: false, frequency: 0, compliance_score: 0 },
            export_data: { available: false, frequency: 0, compliance_score: 0 },
            opt_out: { available: false, frequency: 0, compliance_score: 0 },
            access_data: { available: false, frequency: 0, compliance_score: 0 },
            correct_data: { available: false, frequency: 0, compliance_score: 0 },
            restrict_processing: { available: false, frequency: 0, compliance_score: 0 }
        };

        [...clauses, ...keyPoints.map(p => ({clause: p}))].forEach(item => {
            const text = (item.clause || '').toLowerCase();
            
            if (text.includes('delete') || text.includes('remove') || text.includes('right to deletion')) {
                rights.delete_data.available = true;
                rights.delete_data.frequency++;
                rights.delete_data.compliance_score = 10;
            }
            if (text.includes('export') || text.includes('download') || text.includes('portability')) {
                rights.export_data.available = true;
                rights.export_data.frequency++;
                rights.export_data.compliance_score = 10;
            }
            if (text.includes('opt out') || text.includes('unsubscribe') || text.includes('withdraw consent')) {
                rights.opt_out.available = true;
                rights.opt_out.frequency++;
                rights.opt_out.compliance_score = 10;
            }
            if (text.includes('access') || text.includes('view') || text.includes('see your data')) {
                rights.access_data.available = true;
                rights.access_data.frequency++;
                rights.access_data.compliance_score = 10;
            }
            if (text.includes('correct') || text.includes('update') || text.includes('modify')) {
                rights.correct_data.available = true;
                rights.correct_data.frequency++;
                rights.correct_data.compliance_score = 10;
            }
            if (text.includes('restrict') || text.includes('limit processing')) {
                rights.restrict_processing.available = true;
                rights.restrict_processing.frequency++;
                rights.restrict_processing.compliance_score = 10;
            }
        });

        return {
            available_rights: rights,
            contact_method: ["Email", "Support Form"],
            response_time: "30 days"
        };
    }

    function generateLiabilitiesAnalysis(clauses, riskFactors) {
        const liabilityClauses = {
            not_responsible: { present: false, frequency: 0, user_risk: "high" },
            limitation_damages: { present: false, frequency: 0, user_risk: "high" },
            indemnification: { present: false, frequency: 0, user_risk: "high" },
            warranty_disclaimer: { present: false, frequency: 0, user_risk: "high" },
            force_majeure: { present: false, frequency: 0, user_risk: "medium" }
        };

        let userProtectionLevel = "Medium";

        [...clauses, ...riskFactors.map(f => ({clause: f}))].forEach(item => {
            const text = (item.clause || '').toLowerCase();
            
            if (text.includes('not responsible') || text.includes('not liable')) {
                liabilityClauses.not_responsible.present = true;
                liabilityClauses.not_responsible.frequency++;
                userProtectionLevel = "Low";
            }
            if (text.includes('limit') && text.includes('damage')) {
                liabilityClauses.limitation_damages.present = true;
                liabilityClauses.limitation_damages.frequency++;
                userProtectionLevel = "Low";
            }
            if (text.includes('indemnif') || text.includes('defend') || text.includes('hold harmless')) {
                liabilityClauses.indemnification.present = true;
                liabilityClauses.indemnification.frequency++;
                userProtectionLevel = "Low";
            }
            if (text.includes('warranty') && text.includes('disclaim')) {
                liabilityClauses.warranty_disclaimer.present = true;
                liabilityClauses.warranty_disclaimer.frequency++;
            }
            if (text.includes('force majeure') || text.includes('beyond our control')) {
                liabilityClauses.force_majeure.present = true;
                liabilityClauses.force_majeure.frequency++;
            }
        });

        return {
            liability_clauses: liabilityClauses,
            user_protection_level: userProtectionLevel,
            legal_jurisdiction: "As specified in terms"
        };
    }

    function generateAutomaticRenewalsAnalysis(clauses, riskFactors) {
        const renewalPractices = {
            auto_renewal: { mentioned: false, frequency: 0, financial_risk: "high" },
            hidden_charges: { mentioned: false, frequency: 0, financial_risk: "high" },
            cancellation_deadline: { mentioned: false, frequency: 0, financial_risk: "medium" },
            renewal_terms: { mentioned: false, frequency: 0, financial_risk: "medium" },
            price_changes: { mentioned: false, frequency: 0, financial_risk: "high" }
        };

        let cancellationDifficulty = "Easy";
        let refundPolicy = { available: false, conditions: "None specified" };

        [...clauses, ...riskFactors.map(f => ({clause: f}))].forEach(item => {
            const text = (item.clause || '').toLowerCase();
            
            if (text.includes('automatic') && (text.includes('renew') || text.includes('billing'))) {
                renewalPractices.auto_renewal.mentioned = true;
                renewalPractices.auto_renewal.frequency++;
                cancellationDifficulty = "Medium";
            }
            if (text.includes('fee') && text.includes('additional')) {
                renewalPractices.hidden_charges.mentioned = true;
                renewalPractices.hidden_charges.frequency++;
            }
            if (text.includes('cancel') && text.includes('before')) {
                renewalPractices.cancellation_deadline.mentioned = true;
                renewalPractices.cancellation_deadline.frequency++;
            }
            if (text.includes('renewal') && text.includes('term')) {
                renewalPractices.renewal_terms.mentioned = true;
                renewalPractices.renewal_terms.frequency++;
            }
            if (text.includes('price') && text.includes('change')) {
                renewalPractices.price_changes.mentioned = true;
                renewalPractices.price_changes.frequency++;
            }
            if (text.includes('refund')) {
                refundPolicy.available = true;
                refundPolicy.conditions = "As specified in terms";
            }
        });

        return {
            renewal_practices: renewalPractices,
            cancellation_difficulty: cancellationDifficulty,
            refund_policy: refundPolicy
        };
    }

    function generateTerminationAnalysis(clauses, riskFactors) {
        const terminationRights = {
            immediate_termination: { present: false, frequency: 0, control_risk: "high" },
            at_will_termination: { present: false, frequency: 0, control_risk: "high" },
            breach_termination: { present: false, frequency: 0, control_risk: "medium" },
            data_retention: { present: false, frequency: 0, control_risk: "medium" },
            account_suspension: { present: false, frequency: 0, control_risk: "medium" }
        };

        let userNoticeError = "Not specified";
        let dataDeletionPolicy = { automatic_deletion: false, timeline: "Not specified" };

        [...clauses, ...riskFactors.map(f => ({clause: f}))].forEach(item => {
            const text = (item.clause || '').toLowerCase();
            
            if (text.includes('immediately') && text.includes('terminat')) {
                terminationRights.immediate_termination.present = true;
                terminationRights.immediate_termination.frequency++;
            }
            if (text.includes('at any time') && text.includes('terminat')) {
                terminationRights.at_will_termination.present = true;
                terminationRights.at_will_termination.frequency++;
            }
            if (text.includes('breach') && text.includes('terminat')) {
                terminationRights.breach_termination.present = true;
                terminationRights.breach_termination.frequency++;
            }
            if (text.includes('retain') && text.includes('data')) {
                terminationRights.data_retention.present = true;
                terminationRights.data_retention.frequency++;
            }
            if (text.includes('suspend') && text.includes('account')) {
                terminationRights.account_suspension.present = true;
                terminationRights.account_suspension.frequency++;
            }
            if (text.includes('notice') && text.includes('day')) {
                userNoticeError = "As specified in terms";
            }
            if (text.includes('delete') && text.includes('data')) {
                dataDeletionPolicy.automatic_deletion = true;
                dataDeletionPolicy.timeline = "As specified in terms";
            }
        });

        return {
            termination_rights: terminationRights,
            user_notice_period: userNoticeError,
            data_deletion_policy: dataDeletionPolicy
        };
    }

    function generateRiskScoreBreakdown(riskAnalysis, categories) {
        const categoryScores = {};
        
        // Convert category percentages to risk scores
        Object.entries(categories).forEach(([key, value]) => {
            let riskScore = 0;
            
            // Higher category presence = higher risk for certain categories
            if (key === 'privacy_data' || key === 'cookies_tracking') {
                riskScore = Math.min(value * 0.8, 100); // High risk categories
            } else if (key === 'dispute_resolution' || key === 'company_rights') {
                riskScore = Math.min(value * 0.9, 100); // Very high risk categories
            } else {
                riskScore = Math.min(value * 0.6, 100); // Medium risk categories
            }
            
            categoryScores[key] = Math.round(riskScore);
        });

        return {
            category_scores: categoryScores,
            overall_assessment: riskAnalysis.risk_level || 'UNKNOWN',
            recommendation: generateRecommendation(riskAnalysis.overall_risk || 0)
        };
    }

    function determineDocumentType(categories) {
        const maxCategory = Object.entries(categories).reduce((a, b) => 
            categories[a] > categories[b] ? a : b, 'privacy_data'
        );
        
        const typeMap = {
            privacy_data: "Privacy Policy & Terms of Service",
            payments_billing: "Service Agreement with Billing Terms",
            user_obligations: "User Agreement & Code of Conduct",
            company_rights: "License Agreement & Terms of Use",
            dispute_resolution: "Legal Agreement with Dispute Resolution",
            cookies_tracking: "Privacy Policy with Tracking Terms"
        };
        
        return typeMap[maxCategory] || "Terms & Conditions Document";
    }

    function generateRecommendation(riskScore) {
        if (riskScore >= 75) {
            return "High risk detected. Carefully review all clauses before agreeing. Consider seeking legal advice.";
        } else if (riskScore >= 50) {
            return "Medium risk level. Review key sections, particularly data sharing and liability clauses.";
        } else if (riskScore >= 25) {
            return "Low to medium risk. Standard terms with some areas requiring attention.";
        } else {
            return "Low risk. Terms appear to be consumer-friendly with standard protections.";
        }
    }

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

// Helper function to get stored tab info (for unified extension)
async function getStoredTabInfo() {
    try {
        const result = await chrome.storage.local.get(['currentTabForAnalysis']);
        const tabInfo = result.currentTabForAnalysis;
        
        // Check if tab info is recent (within 5 minutes)
        if (tabInfo && tabInfo.timestamp && (Date.now() - tabInfo.timestamp) < 300000) {
            return tabInfo;
        }
        
        return null;
    } catch (error) {
        console.error('Error getting stored tab info:', error);
        return null;
    }
}