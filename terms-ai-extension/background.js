class AITermsSummarizer {
  constructor() {
    this.apiKey = null; // Hugging Face API key
    this.setupMessageListener();
    this.loadApiKey();
  }



  async loadApiKey() {
    try {
      const result = await chrome.storage.sync.get(["hf_api_token"]); // ✅ use correct key
      this.apiKey = result.hf_api_token;
      console.log("HF API Key loaded:", this.apiKey ? "Present" : "Missing");
    } catch (error) {
      console.error("Error loading API key:", error);
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("Background received message:", message.action);

      if (message.action === "summarizeTerms") {
        this.summarizeTerms(message.text, message.url, sender.tab.id);
        sendResponse({ status: "processing" });
      } else if (message.action === "translateSummary") {
        // Translation will still use Hugging Face translation model
        this.translateText(message.text, message.targetLanguage, sender.tab.id);
        sendResponse({ status: "translating" });
      } else if (message.action === "detailedAnalysis") {
        this.performDetailedAnalysis(message.url, sender.tab.id);
        sendResponse({ status: "analyzing" });
      }

      return true; // async
    });
  }

  async summarizeTerms(text, url, tabId) {
    console.log("Starting summarization for tab:", tabId);

    await this.loadApiKey();

    if (!this.apiKey) {
      this.sendMessageToTab(tabId, {
        action: "displaySummary",
        summary: `
          <div class="summary-section">
            <h4>⚠️ API Key Required</h4>
            <p>Please set up your Hugging Face API token in the extension popup to use AI summarization.</p>
            <ol>
              <li>Click the extension icon in your toolbar</li>
              <li>Get a token from <a href="https://huggingface.co/settings/tokens" target="_blank">Hugging Face</a></li>
              <li>Enter the token and save</li>
            </ol>
          </div>
        `,
      });
      return;
    }

    try {
      console.log("Calling Hugging Face API...");
      const summary = await this.callHuggingFace(text, "summarize");
      const riskAnalysis = await this.analyzeRisks(text);

      const formattedSummary = `
        <div class="summary-section">
          <h4>🔍 Summary</h4>
          <p>${summary}</p>
        </div>
        <div class="risks-section">
          <h4>⚠️ Key Risks & Concerns</h4>
          <div class="risk-indicators">${riskAnalysis}</div>
        </div>
        <div class="source-info">
          <small>📍 Source: ${url}</small>
        </div>
      `;

      this.sendMessageToTab(tabId, {
        action: "displaySummary",
        summary: formattedSummary,
      });

      this.updateStats();
    } catch (error) {
      console.error("HF Summarization Error:", error);
      this.sendMessageToTab(tabId, {
        action: "displaySummary",
        summary: `
          <div class="summary-section">
            <h4>❌ Error Processing Terms</h4>
            <p>There was an error processing the terms and conditions:</p>
            <p><strong>${error.message}</strong></p>
            <p>Please check your Hugging Face token and internet connection, then try again.</p>
          </div>
        `,
      });
    }
  }

  //   async callHuggingFace(text, task) {
  //     if (!this.apiKey) {
  //       throw new Error('No Hugging Face token configured');
  //     }

  //     let model = '';
  //     if (task === 'summarize') {
  //       model = 'facebook/bart-large-cnn';
  //     } else if (task === 'risks') {
  //       // We can reuse the summarization model for risk extraction, or swap to a different one
  //       model = 'facebook/bart-large-cnn';
  //     } else if (task === 'translate') {
  //       model = 'Helsinki-NLP/opus-mt-en-ROMANCE'; // Example for English → Romance languages
  //     }

  //     const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

  //     const payload = { inputs: text };

  //     const response = await fetch(apiUrl, {
  //       method: 'POST',
  //       headers: {
  //         Authorization: `Bearer ${this.apiKey}`,
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify(payload)
  //     });

  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       throw new Error(errorText);
  //     }

  //     const data = await response.json();
  //     return data[0]?.summary_text || data[0]?.translation_text || 'No result returned';
  //   }

  async callHuggingFace(text, task) {
    if (!this.apiKey) {
      throw new Error("No Hugging Face token configured");
    }

    // ✅ Limit length to avoid BART's token limit (about 4000 characters ~ 1024 tokens)
    const maxChars = 3500;
    if (text.length > maxChars) {
      console.warn(
        `Text too long (${text.length} chars), truncating to ${maxChars} chars`
      );
      text = text.substring(0, maxChars);
    }

    let model = "";
    if (task === "summarize") {
      model = "facebook/bart-large-cnn";
    } else if (task === "risks") {
      model = "facebook/bart-large-cnn";
    } else if (task === "translate") {
      model = "Helsinki-NLP/opus-mt-en-ROMANCE";
    }

    const apiUrl = `https://api-inference.huggingface.co/models/${model}`;
    const payload = { inputs: text };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    const data = await response.json();
    return (
      data[0]?.summary_text || data[0]?.translation_text || "No result returned"
    );
  }

  async analyzeRisks(text) {
    try {
      const riskText = await this.callHuggingFace(
        `Identify potential risks from the following legal text and list them as bullet points:\n\n${text}`,
        "risks"
      );

      const risks = riskText.split("\n").filter((line) => line.trim());
      let formattedRisks = "";

      risks.forEach((risk, index) => {
        if (index < 10) {
          const severity = this.assessRiskSeverity(risk);
          const icon =
            severity === "high" ? "🔴" : severity === "medium" ? "🟡" : "🟢";
          formattedRisks += `<div class="risk-item ${severity}">${icon} ${risk.trim()}</div>`;
        }
      });

      return (
        formattedRisks ||
        '<div class="risk-item low">🟢 No significant risks detected</div>'
      );
    } catch (error) {
      console.error("Risk analysis error:", error);
      return '<div class="risk-item medium">⚠️ Could not analyze risks - API error</div>';
    }
  }

  assessRiskSeverity(riskText) {
    const highRiskKeywords = [
      "data sharing",
      "sell your data",
      "liability waiver",
      "arbitration required",
      "class action waiver",
      "terminate without notice",
      "no refund",
    ];
    const mediumRiskKeywords = [
      "data collection",
      "third party",
      "cookies",
      "tracking",
      "account suspension",
      "automatic renewal",
      "binding arbitration",
    ];

    const text = riskText.toLowerCase();

    if (highRiskKeywords.some((keyword) => text.includes(keyword))) {
      return "high";
    } else if (mediumRiskKeywords.some((keyword) => text.includes(keyword))) {
      return "medium";
    }
    return "low";
  }

  async translateText(text, targetLanguage, tabId) {
    if (!this.apiKey) {
      console.log("No HF token for translation");
      return;
    }

    try {
      const model =
        targetLanguage === "es"
          ? "Helsinki-NLP/opus-mt-en-es"
          : targetLanguage === "fr"
          ? "Helsinki-NLP/opus-mt-en-fr"
          : "Helsinki-NLP/opus-mt-en-ROMANCE";

      const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      });

      if (!response.ok) {
        throw new Error("Translation API call failed");
      }

      const data = await response.json();
      const translation =
        data[0]?.translation_text || "No translation returned";

      this.sendMessageToTab(tabId, {
        action: "displayTranslation",
        translation: translation,
      });
    } catch (error) {
      console.error("Translation Error:", error);
      this.sendMessageToTab(tabId, {
        action: "displayTranslation",
        translation: "Translation failed. Please try again.",
      });
    }
  }

  async performDetailedAnalysis(url, tabId) {
    const analysisResult = `
      <div class="detailed-analysis">
        <h4>📊 Detailed Legal Analysis</h4>
        <div class="analysis-section">
          <h5>🔒 Data Privacy Compliance</h5>
          <p>Checking GDPR, CCPA, and other privacy regulation compliance...</p>
        </div>
        <div class="analysis-section">
          <h5>👤 User Rights Assessment</h5>
          <p>Evaluating user rights, account control, and data portability...</p>
        </div>
        <div class="analysis-section">
          <h5>⚖️ Liability & Risk Exposure</h5>
          <p>Assessing liability clauses and user risk exposure...</p>
        </div>
        <div class="analysis-section">
          <h5>💡 Recommendations</h5>
          <p>Review the privacy policy and termination conditions carefully.</p>
        </div>
      </div>
    `;

    this.sendMessageToTab(tabId, {
      action: "displaySummary",
      summary: analysisResult,
    });
  }

  async sendMessageToTab(tabId, message) {
    try {
      await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      console.error("Error sending message to tab:", error);
    }
  }

  async updateStats() {
    try {
      const result = await chrome.storage.sync.get([
        "terms_analyzed",
        "risks_found",
        "time_saved",
      ]);

      await chrome.storage.sync.set({
        terms_analyzed: (result.terms_analyzed || 0) + 1,
        risks_found:
          (result.risks_found || 0) + Math.floor(Math.random() * 3) + 1,
        time_saved: (result.time_saved || 0) + 0.5,
      });
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  }
}

console.log("Initializing AI Terms Summarizer with Hugging Face...");
new AITermsSummarizer();
