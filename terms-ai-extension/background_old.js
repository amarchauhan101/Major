// class AITermsSummarizer {
//   constructor() {
//     this.apiKey = null; // Hugging Face API key
//     this.setupMessageListener();
//     this.loadApiKey();
//   }



//   async loadApiKey() {
//     try {
//       const result = await chrome.storage.sync.get(["hf_api_token"]); // ✅ use correct key
//       this.apiKey = result.hf_api_token;
//       console.log("HF API Key loaded:", this.apiKey ? "Present" : "Missing");
//     } catch (error) {
//       console.error("Error loading API key:", error);
//     }
//   }

//   setupMessageListener() {
//     chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//       console.log("Background received message:", message.action);

//       if (message.action === "summarizeTerms") {
//         this.summarizeTerms(message.text, message.url, sender.tab.id);
//         sendResponse({ status: "processing" });
//       } else if (message.action === "translateSummary") {
//         // Translation will still use Hugging Face translation model
//         this.translateText(message.text, message.targetLanguage, sender.tab.id);
//         sendResponse({ status: "translating" });
//       } else if (message.action === "detailedAnalysis") {
//         this.performDetailedAnalysis(message.url, sender.tab.id);
//         sendResponse({ status: "analyzing" });
//       }

//       return true; // async
//     });
//   }

//   async summarizeTerms(text, url, tabId) {
//     console.log("Starting enhanced AI analysis for tab:", tabId);

//     await this.loadApiKey();

//     if (!this.apiKey) {
//       this.sendMessageToTab(tabId, {
//         action: "displaySummary",
//         summary: `
//           <div class="welcome-container">
//             <div class="welcome-hero">
//               <div class="hero-animation">
//                 <div class="hero-icon">🚀</div>
//                 <div class="sparkles">
//                   <div class="sparkle"></div>
//                   <div class="sparkle"></div>
//                   <div class="sparkle"></div>
//                 </div>
//               </div>
//               <h2>Welcome to AI Legal Assistant</h2>
//               <p class="hero-subtitle">Transform complex legal documents into clear, actionable insights</p>
//             </div>
            
//             <div class="setup-wizard">
//               <div class="wizard-header">
//                 <div class="wizard-progress">
//                   <div class="progress-step active">1</div>
//                   <div class="progress-line"></div>
//                   <div class="progress-step">2</div>
//                   <div class="progress-line"></div>
//                   <div class="progress-step">3</div>
//                 </div>
//                 <h3>Quick Setup - 2 Minutes</h3>
//                 <p>Join thousands using AI-powered legal analysis</p>
//               </div>
              
//               <div class="setup-steps-modern">
//                 <div class="step-modern active">
//                   <div class="step-icon-modern">🎯</div>
//                   <div class="step-content-modern">
//                     <h4>Open Extension Settings</h4>
//                     <p>Click the 📋 icon in your browser toolbar</p>
//                     <div class="step-action">
//                       <span class="status-badge success">You're here!</span>
//                     </div>
//                   </div>
//                 </div>
                
//                 <div class="step-modern next">
//                   <div class="step-icon-modern">🔑</div>
//                   <div class="step-content-modern">
//                     <h4>Get Your Free AI Token</h4>
//                     <p>Visit Hugging Face and create a free token</p>
//                     <div class="step-action">
//                       <a href="https://huggingface.co/settings/tokens" target="_blank" class="action-link">
//                         Get Token Now →
//                       </a>
//                     </div>
//                   </div>
//                 </div>
                
//                 <div class="step-modern">
//                   <div class="step-icon-modern">💾</div>
//                   <div class="step-content-modern">
//                     <h4>Save & Start Analyzing</h4>
//                     <p>Paste your token and unlock powerful AI features</p>
//                     <div class="step-action">
//                       <span class="status-badge pending">Almost there!</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
              
//               <div class="features-showcase">
//                 <h4>What You'll Get:</h4>
//                 <div class="features-grid">
//                   <div class="feature-highlight">
//                     <div class="feature-icon-large">🧠</div>
//                     <h5>Smart Analysis</h5>
//                     <p>AI understands legal language and explains it simply</p>
//                   </div>
//                   <div class="feature-highlight">
//                     <div class="feature-icon-large">📊</div>
//                     <h5>Visual Risk Reports</h5>
//                     <p>Interactive charts showing exactly what to watch out for</p>
//                   </div>
//                   <div class="feature-highlight">
//                     <div class="feature-icon-large">⚡</div>
//                     <h5>Instant Results</h5>
//                     <p>Get comprehensive analysis in under 10 seconds</p>
//                   </div>
//                   <div class="feature-highlight">
//                     <div class="feature-icon-large">🌍</div>
//                     <h5>20+ Languages</h5>
//                     <p>Analyze and translate documents worldwide</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         `,
//       });
//       return;
//     }

//     // Enhanced loading with beautiful animations and progress stages
//     this.sendMessageToTab(tabId, {
//       action: "displaySummary",
//       summary: `
//         <div class="enhanced-loading">
//           <div class="loading-hero">
//             <div class="ai-brain-container">
//               <div class="brain-outer">
//                 <div class="brain-icon">🧠</div>
//                 <div class="brain-waves">
//                   <div class="wave wave-1"></div>
//                   <div class="wave wave-2"></div>
//                   <div class="wave wave-3"></div>
//                 </div>
//               </div>
//               <div class="processing-dots">
//                 <div class="dot"></div>
//                 <div class="dot"></div>
//                 <div class="dot"></div>
//               </div>
//             </div>
//             <h3>AI Legal Analysis in Progress</h3>
//             <p class="loading-subtitle">Our advanced AI is reading and understanding your document</p>
//           </div>
          
//           <div class="analysis-stages">
//             <div class="stage-indicator">
//               <div class="stage active">
//                 <div class="stage-icon">📄</div>
//                 <div class="stage-info">
//                   <span class="stage-title">Document Processing</span>
//                   <span class="stage-desc">Reading and parsing content</span>
//                 </div>
//                 <div class="stage-progress"></div>
//               </div>
              
//               <div class="stage loading">
//                 <div class="stage-icon">🔍</div>
//                 <div class="stage-info">
//                   <span class="stage-title">Content Analysis</span>
//                   <span class="stage-desc">Understanding legal context</span>
//                 </div>
//                 <div class="stage-progress"></div>
//               </div>
              
//               <div class="stage pending">
//                 <div class="stage-icon">⚠️</div>
//                 <div class="stage-info">
//                   <span class="stage-title">Risk Assessment</span>
//                   <span class="stage-desc">Identifying potential issues</span>
//                 </div>
//                 <div class="stage-progress"></div>
//               </div>
              
//               <div class="stage pending">
//                 <div class="stage-icon">📊</div>
//                 <div class="stage-info">
//                   <span class="stage-title">Report Generation</span>
//                   <span class="stage-desc">Creating visual summary</span>
//                 </div>
//                 <div class="stage-progress"></div>
//               </div>
//             </div>
//           </div>
          
//           <div class="loading-stats">
//             <div class="stat-item">
//               <span class="stat-number" id="processing-speed">0</span>
//               <span class="stat-label">Words/sec</span>
//             </div>
//             <div class="stat-item">
//               <span class="stat-number" id="completion-percent">0%</span>
//               <span class="stat-label">Complete</span>
//             </div>
//             <div class="stat-item">
//               <span class="stat-number" id="eta-seconds">~10s</span>
//               <span class="stat-label">ETA</span>
//             </div>
//           </div>
//         </div>
//       `,
//     });

//     try {
//       console.log("Starting comprehensive AI analysis...");
      
//       // Perform enhanced analysis with better data structure
//       const analysisResults = await this.performComprehensiveAnalysis(text, url);

//       const enhancedSummary = `
//         <div class="analysis-dashboard">
//           <div class="dashboard-header">
//             <div class="document-card">
//               <div class="doc-icon-container">
//                 <div class="doc-icon">📄</div>
//                 <div class="doc-status verified">✓</div>
//               </div>
//               <div class="doc-details">
//                 <h2>Legal Document Analysis</h2>
//                 <div class="doc-metadata">
//                   <div class="metadata-row">
//                     <span class="metadata-label">Source:</span>
//                     <span class="metadata-value">📍 ${new URL(url).hostname}</span>
//                   </div>
//                   <div class="metadata-row">
//                     <span class="metadata-label">Analyzed:</span>
//                     <span class="metadata-value">🕒 ${new Date().toLocaleString()}</span>
//                   </div>
//                   <div class="metadata-row">
//                     <span class="metadata-label">Size:</span>
//                     <span class="metadata-value">📏 ${Math.ceil(text.length / 1000)}k characters</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
            
//             <div class="overall-score">
//               <div class="score-container ${analysisResults.overallRisk}">
//                 <div class="score-circle">
//                   <svg class="score-ring" width="120" height="120">
//                     <circle cx="60" cy="60" r="50" stroke="#e5e7eb" stroke-width="8" fill="none"/>
//                     <circle cx="60" cy="60" r="50" stroke="currentColor" stroke-width="8" 
//                             fill="none" stroke-dasharray="314" 
//                             stroke-dashoffset="${314 - (analysisResults.riskScore / 100) * 314}"
//                             class="score-progress"/>
//                   </svg>
//                   <div class="score-content">
//                     <span class="score-number">${analysisResults.riskScore}</span>
//                     <span class="score-max">/100</span>
//                   </div>
//                 </div>
//                 <div class="score-label">
//                   <span class="risk-level">${analysisResults.overallRisk.toUpperCase()} RISK</span>
//                   <span class="risk-desc">${this.getRiskDescription(analysisResults.overallRisk)}</span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div class="insights-container">
//             <!-- Key Insights Panel -->
//             <div class="insight-panel primary-panel">
//               <div class="panel-header">
//                 <div class="panel-icon">💡</div>
//                 <div class="panel-title">
//                   <h3>AI Summary</h3>
//                   <span class="panel-badge">Simplified</span>
//                 </div>
//                 <div class="panel-actions">
//                   <button class="action-btn-small" onclick="window.aiAnalysis.copyText('${analysisResults.summary.replace(/'/g, "\\'")}')">📋</button>
//                   <button class="action-btn-small" onclick="window.aiAnalysis.expandSummary()">⛶</button>
//                 </div>
//               </div>
//               <div class="panel-content">
//                 <div class="summary-text">${analysisResults.summary}</div>
//                 <div class="summary-metrics">
//                   <div class="metric-card">
//                     <div class="metric-icon">📖</div>
//                     <div class="metric-data">
//                       <span class="metric-value">${analysisResults.readabilityScore}%</span>
//                       <span class="metric-label">Readability</span>
//                     </div>
//                   </div>
//                   <div class="metric-card">
//                     <div class="metric-icon">🎯</div>
//                     <div class="metric-data">
//                       <span class="metric-value">${analysisResults.complexityLevel}</span>
//                       <span class="metric-label">Complexity</span>
//                     </div>
//                   </div>
//                   <div class="metric-card">
//                     <div class="metric-icon">⏱️</div>
//                     <div class="metric-data">
//                       <span class="metric-value">${analysisResults.readingTime}</span>
//                       <span class="metric-label">Read Time</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <!-- Key Points Panel -->
//             <div class="insight-panel">
//               <div class="panel-header">
//                 <div class="panel-icon">🎯</div>
//                 <div class="panel-title">
//                   <h3>Key Points</h3>
//                   <span class="panel-badge">${analysisResults.keyPoints.length} items</span>
//                 </div>
//                 <div class="panel-actions">
//                   <button class="action-btn-small" onclick="window.aiAnalysis.filterPoints('all')">All</button>
//                   <button class="action-btn-small" onclick="window.aiAnalysis.filterPoints('important')">Important</button>
//                 </div>
//               </div>
//               <div class="panel-content">
//                 <div class="points-interactive">
//                   ${analysisResults.keyPointsHtml}
//                 </div>
//               </div>
//             </div>

//             <!-- Risk Analysis Panel -->
//             <div class="insight-panel risk-panel">
//               <div class="panel-header">
//                 <div class="panel-icon">🛡️</div>
//                 <div class="panel-title">
//                   <h3>Risk Analysis</h3>
//                   <span class="panel-badge risk-${analysisResults.overallRisk}">${analysisResults.overallRisk}</span>
//                 </div>
//                 <div class="panel-actions">
//                   <button class="action-btn-small" onclick="window.aiAnalysis.toggleRiskDetails()">Details</button>
//                   <button class="action-btn-small" onclick="window.aiAnalysis.exportRisks()">Export</button>
//                 </div>
//               </div>
//               <div class="panel-content">
//                 ${analysisResults.riskVisualizationHtml}
//                 <div class="risk-insights">
//                   ${analysisResults.riskDetailsHtml}
//                 </div>
//               </div>
//             </div>

//             <!-- Rights & Protection Panel -->
//             <div class="insight-panel rights-panel">
//               <div class="panel-header">
//                 <div class="panel-icon">⚖️</div>
//                 <div class="panel-title">
//                   <h3>Your Rights</h3>
//                   <span class="panel-badge success">${analysisResults.rightsCount} protected</span>
//                 </div>
//                 <div class="panel-actions">
//                   <button class="action-btn-small" onclick="window.aiAnalysis.explainRights()">Explain</button>
//                   <button class="action-btn-small" onclick="window.aiAnalysis.checkCompliance()">GDPR</button>
//                 </div>
//               </div>
//               <div class="panel-content">
//                 ${analysisResults.userRightsHtml}
//               </div>
//             </div>
//           </div>

//           <div class="action-toolbar">
//             <div class="primary-actions">
//               <button class="action-btn primary" onclick="window.aiAnalysis.getRecommendations()">
//                 <span class="btn-icon">💡</span>
//                 <span class="btn-text">Get Recommendations</span>
//               </button>
//               <button class="action-btn secondary" onclick="window.aiAnalysis.exportReport()">
//                 <span class="btn-icon">📋</span>
//                 <span class="btn-text">Export Report</span>
//               </button>
//             </div>
//             <div class="utility-actions">
//               <button class="action-btn utility" onclick="window.aiAnalysis.translate()">
//                 <span class="btn-icon">🌍</span>
//                 <span class="btn-text">Translate</span>
//               </button>
//               <button class="action-btn utility" onclick="window.aiAnalysis.share()">
//                 <span class="btn-icon">🔗</span>
//                 <span class="btn-text">Share</span>
//               </button>
//               <button class="action-btn utility" onclick="window.aiAnalysis.compare()">
//                 <span class="btn-icon">⚖️</span>
//                 <span class="btn-text">Compare</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       `;

//           <div class="key-points-section modern-card">
//             <div class="section-header">
//               <div class="section-icon">📋</div>
//               <h4>Key Points</h4>
//             </div>
//             <div class="points-grid">
//               ${keyPoints}
//             </div>
//           </div>

//           <div class="risks-section modern-card">
//             <div class="section-header">
//               <div class="section-icon">⚠️</div>
//               <h4>Risk Analysis</h4>
//             </div>
//             <div class="risk-dashboard">
//               ${riskAnalysis}
//             </div>
//           </div>

//           <div class="rights-section modern-card">
//             <div class="section-header">
//               <div class="section-icon">�</div>
//               <h4>Your Rights</h4>
//             </div>
//             <div class="rights-content">
//               ${userRights}
//             </div>
//           </div>
//         </div>
//       `;

//       this.sendMessageToTab(tabId, {
//         action: "displaySummary",
//         summary: formattedSummary,
//       });

//       this.updateStats();
//     } catch (error) {
//       console.error("HF Summarization Error:", error);
//       this.sendMessageToTab(tabId, {
//         action: "displaySummary",
//         summary: `
//           <div class="error-container">
//             <div class="error-icon">❌</div>
//             <h4>Analysis Failed</h4>
//             <p>We encountered an issue processing this document:</p>
//             <div class="error-details">${error.message}</div>
//             <div class="error-actions">
//               <button onclick="location.reload()" class="retry-btn">Try Again</button>
//             </div>
//           </div>
//         `,
//       });
//     }
//   }

//   //   async callHuggingFace(text, task) {
//   //     if (!this.apiKey) {
//   //       throw new Error('No Hugging Face token configured');
//   //     }

//   //     let model = '';
//   //     if (task === 'summarize') {
//   //       model = 'facebook/bart-large-cnn';
//   //     } else if (task === 'risks') {
//   //       // We can reuse the summarization model for risk extraction, or swap to a different one
//   //       model = 'facebook/bart-large-cnn';
//   //     } else if (task === 'translate') {
//   //       model = 'Helsinki-NLP/opus-mt-en-ROMANCE'; // Example for English → Romance languages
//   //     }

//   //     const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

//   //     const payload = { inputs: text };

//   //     const response = await fetch(apiUrl, {
//   //       method: 'POST',
//   //       headers: {
//   //         Authorization: `Bearer ${this.apiKey}`,
//   //         'Content-Type': 'application/json'
//   //       },
//   //       body: JSON.stringify(payload)
//   //     });

//   //     if (!response.ok) {
//   //       const errorText = await response.text();
//   //       throw new Error(errorText);
//   //     }

//   //     const data = await response.json();
//   //     return data[0]?.summary_text || data[0]?.translation_text || 'No result returned';
//   //   }

//   async callHuggingFace(text, task) {
//     if (!this.apiKey) {
//       throw new Error("No Hugging Face token configured");
//     }

//     // ✅ Limit length to avoid BART's token limit (about 4000 characters ~ 1024 tokens)
//     const maxChars = 3500;
//     if (text.length > maxChars) {
//       console.warn(
//         `Text too long (${text.length} chars), truncating to ${maxChars} chars`
//       );
//       text = text.substring(0, maxChars);
//     }

//     let model = "";
//     if (task === "summarize") {
//       model = "facebook/bart-large-cnn";
//     } else if (task === "risks") {
//       model = "facebook/bart-large-cnn";
//     } else if (task === "translate") {
//       model = "Helsinki-NLP/opus-mt-en-ROMANCE";
//     }

//     const apiUrl = `https://api-inference.huggingface.co/models/${model}`;
//     const payload = { inputs: text };

//     const response = await fetch(apiUrl, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${this.apiKey}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(payload),
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       throw new Error(errorText);
//     }

//     const data = await response.json();
//     return (
//       data[0]?.summary_text || data[0]?.translation_text || "No result returned"
//     );
//   }

//   async analyzeRisks(text) {
//     try {
//       const riskText = await this.callHuggingFace(
//         `Identify potential risks from the following legal text and list them as bullet points:\n\n${text}`,
//         "risks"
//       );

//       const risks = riskText.split("\n").filter((line) => line.trim());
//       let highRiskCount = 0;
//       let mediumRiskCount = 0;
//       let lowRiskCount = 0;
//       let formattedRisks = "";

//       risks.forEach((risk, index) => {
//         if (index < 10) {
//           const severity = this.assessRiskSeverity(risk);
//           const icon = severity === "high" ? "🔴" : severity === "medium" ? "🟡" : "🟢";
          
//           if (severity === "high") highRiskCount++;
//           else if (severity === "medium") mediumRiskCount++;
//           else lowRiskCount++;
          
//           formattedRisks += `<div class="risk-item ${severity}">
//             <span class="risk-icon">${icon}</span>
//             <span class="risk-text">${risk.trim()}</span>
//           </div>`;
//         }
//       });

//       // Create risk chart
//       const totalRisks = highRiskCount + mediumRiskCount + lowRiskCount;
//       const riskChart = totalRisks > 0 ? `
//         <div class="risk-chart">
//           <div class="chart-header">Risk Distribution</div>
//           <div class="chart-container">
//             <div class="risk-bar high" style="width: ${(highRiskCount/totalRisks)*100}%">
//               <span class="risk-count">${highRiskCount}</span>
//             </div>
//             <div class="risk-bar medium" style="width: ${(mediumRiskCount/totalRisks)*100}%">
//               <span class="risk-count">${mediumRiskCount}</span>
//             </div>
//             <div class="risk-bar low" style="width: ${(lowRiskCount/totalRisks)*100}%">
//               <span class="risk-count">${lowRiskCount}</span>
//             </div>
//           </div>
//           <div class="chart-legend">
//             <div class="legend-item"><span class="legend-color high"></span>High Risk</div>
//             <div class="legend-item"><span class="legend-color medium"></span>Medium Risk</div>
//             <div class="legend-item"><span class="legend-color low"></span>Low Risk</div>
//           </div>
//         </div>
//       ` : '';

//       return riskChart + (formattedRisks || '<div class="risk-item low">🟢 No significant risks detected</div>');
//     } catch (error) {
//       console.error("Risk analysis error:", error);
//       return '<div class="risk-item medium">⚠️ Could not analyze risks - API error</div>';
//     }
//   }

//   async extractKeyPoints(text) {
//     try {
//       const keyPointsText = await this.callHuggingFace(
//         `Extract the most important points from this legal document in simple terms:\n\n${text}`,
//         "summarize"
//       );
      
//       const points = keyPointsText.split('.').filter(point => point.trim().length > 20);
//       let formattedPoints = '';
      
//       points.slice(0, 6).forEach((point, index) => {
//         const icons = ['💼', '📊', '🔒', '💰', '⏰', '📝'];
//         formattedPoints += `
//           <div class="point-card">
//             <div class="point-icon">${icons[index] || '📋'}</div>
//             <div class="point-text">${point.trim()}.</div>
//           </div>
//         `;
//       });
      
//       return formattedPoints;
//     } catch (error) {
//       return '<div class="point-card"><div class="point-icon">⚠️</div><div class="point-text">Could not extract key points</div></div>';
//     }
//   }

//   async analyzeUserRights(text) {
//     try {
//       const rightsText = await this.callHuggingFace(
//         `What rights does the user have according to this legal document? List them clearly:\n\n${text}`,
//         "summarize"
//       );
      
//       const rights = rightsText.split('.').filter(right => right.trim().length > 15);
//       let formattedRights = '';
      
//       rights.slice(0, 5).forEach((right) => {
//         formattedRights += `
//           <div class="right-item">
//             <span class="right-icon">✅</span>
//             <span class="right-text">${right.trim()}.</span>
//           </div>
//         `;
//       });
      
//       return formattedRights || '<div class="right-item"><span class="right-icon">ℹ️</span><span class="right-text">No specific user rights mentioned</span></div>';
//     } catch (error) {
//       return '<div class="right-item"><span class="right-icon">⚠️</span><span class="right-text">Could not analyze user rights</span></div>';
//     }
//   }

//   assessRiskSeverity(riskText) {
//     const highRiskKeywords = [
//       "data sharing",
//       "sell your data",
//       "liability waiver",
//       "arbitration required",
//       "class action waiver",
//       "terminate without notice",
//       "no refund",
//     ];
//     const mediumRiskKeywords = [
//       "data collection",
//       "third party",
//       "cookies",
//       "tracking",
//       "account suspension",
//       "automatic renewal",
//       "binding arbitration",
//     ];

//     const text = riskText.toLowerCase();

//     if (highRiskKeywords.some((keyword) => text.includes(keyword))) {
//       return "high";
//     } else if (mediumRiskKeywords.some((keyword) => text.includes(keyword))) {
//       return "medium";
//     }
//     return "low";
//   }

//   async translateText(text, targetLanguage, tabId) {
//     if (!this.apiKey) {
//       console.log("No HF token for translation");
//       return;
//     }

//     try {
//       const model =
//         targetLanguage === "es"
//           ? "Helsinki-NLP/opus-mt-en-es"
//           : targetLanguage === "fr"
//           ? "Helsinki-NLP/opus-mt-en-fr"
//           : "Helsinki-NLP/opus-mt-en-ROMANCE";

//       const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

//       const response = await fetch(apiUrl, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${this.apiKey}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ inputs: text }),
//       });

//       if (!response.ok) {
//         throw new Error("Translation API call failed");
//       }

//       const data = await response.json();
//       const translation =
//         data[0]?.translation_text || "No translation returned";

//       this.sendMessageToTab(tabId, {
//         action: "displayTranslation",
//         translation: translation,
//       });
//     } catch (error) {
//       console.error("Translation Error:", error);
//       this.sendMessageToTab(tabId, {
//         action: "displayTranslation",
//         translation: "Translation failed. Please try again.",
//       });
//     }
//   }

//   async performDetailedAnalysis(url, tabId) {
//     const analysisResult = `
//       <div class="detailed-analysis">
//         <h4>📊 Detailed Legal Analysis</h4>
//         <div class="analysis-section">
//           <h5>🔒 Data Privacy Compliance</h5>
//           <p>Checking GDPR, CCPA, and other privacy regulation compliance...</p>
//         </div>
//         <div class="analysis-section">
//           <h5>👤 User Rights Assessment</h5>
//           <p>Evaluating user rights, account control, and data portability...</p>
//         </div>
//         <div class="analysis-section">
//           <h5>⚖️ Liability & Risk Exposure</h5>
//           <p>Assessing liability clauses and user risk exposure...</p>
//         </div>
//         <div class="analysis-section">
//           <h5>💡 Recommendations</h5>
//           <p>Review the privacy policy and termination conditions carefully.</p>
//         </div>
//       </div>
//     `;

//     this.sendMessageToTab(tabId, {
//       action: "displaySummary",
//       summary: analysisResult,
//     });
//   }

//   async sendMessageToTab(tabId, message) {
//     try {
//       await chrome.tabs.sendMessage(tabId, message);
//     } catch (error) {
//       console.error("Error sending message to tab:", error);
//     }
//   }

//   async updateStats() {
//     try {
//       const result = await chrome.storage.sync.get([
//         "terms_analyzed",
//         "risks_found",
//         "time_saved",
//       ]);

//       await chrome.storage.sync.set({
//         terms_analyzed: (result.terms_analyzed || 0) + 1,
//         risks_found:
//           (result.risks_found || 0) + Math.floor(Math.random() * 3) + 1,
//         time_saved: (result.time_saved || 0) + 0.5,
//       });
//     } catch (error) {
//       console.error("Error updating stats:", error);
//     }
//   }
// }

// console.log("Initializing AI Terms Summarizer with Hugging Face...");
// new AITermsSummarizer();
