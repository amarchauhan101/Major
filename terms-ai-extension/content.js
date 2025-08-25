// Content script to detect Terms & Conditions
class TermsDetector {
  constructor() {
    this.termsKeywords = [
      "terms of service",
      "terms and conditions",
      "terms & conditions",
      "privacy policy",
      "user agreement",
      "service agreement",
      "terms of use",
      "legal terms",
      "conditions of use",
      "end user license agreement",
      "eula",
    ];

    this.hasShownNotification = false;
    this.isProcessing = false;
    this.init();
  }

  init() {
    // Only run detection after page is fully loaded
    if (document.readyState === "complete") {
      this.detectTermsAndConditions();
    } else {
      window.addEventListener("load", () => {
        this.detectTermsAndConditions();
      });
    }

    this.observeDOM();
  }

  detectTermsAndConditions() {
    // Prevent multiple notifications on the same page
    if (this.hasShownNotification) return;

    // Check for terms in links
    const links = document.querySelectorAll(
      'a[href*="terms"], a[href*="privacy"], a[href*="legal"], a[href*="conditions"]'
    );

    // Check for terms in text content (be more selective)
    const potentialTermsElements = [];
    const textElements = document.querySelectorAll(
      "div, section, article, main, p"
    );

    textElements.forEach((element) => {
      const text = element.textContent.toLowerCase();
      if (this.termsKeywords.some((keyword) => text.includes(keyword))) {
        // Check if it's a substantial terms document (more than 1000 chars)
        if (text.length > 1000) {
          potentialTermsElements.push(element);
        }
      }
    });

    // Check for modal dialogs or popups with terms
    const modals = document.querySelectorAll(
      '[class*="modal"], [class*="popup"], [class*="dialog"], [role="dialog"]'
    );
    modals.forEach((modal) => {
      if (modal.offsetParent !== null) {
        // Only visible modals
        const text = modal.textContent.toLowerCase();
        if (
          this.termsKeywords.some((keyword) => text.includes(keyword)) &&
          text.length > 500
        ) {
          potentialTermsElements.push(modal);
        }
      }
    });

    if (links.length > 0 || potentialTermsElements.length > 0) {
      this.showTermsDetected(links, potentialTermsElements);
    }
  }

  showTermsDetected(links, elements) {
    if (this.hasShownNotification) return;
    this.hasShownNotification = true;

    // Remove any existing notification
    const existingNotification = document.getElementById(
      "terms-ai-notification"
    );
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create floating notification
    const notification = document.createElement("div");
    notification.id = "terms-ai-notification";
    notification.innerHTML = `
      <div class="terms-ai-content">
        <h4>📋 Terms & Conditions Detected!</h4>
        <p>AI can summarize this for you</p>
        <button id="summarize-btn">Summarize with AI</button>
        <button id="close-notification">×</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Add event listeners
    document.getElementById("summarize-btn").addEventListener("click", () => {
      if (!this.isProcessing) {
        this.extractAndSummarize(links, elements);
      }
    });

    document
      .getElementById("close-notification")
      .addEventListener("click", () => {
        notification.remove();
      });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (document.getElementById("terms-ai-notification")) {
        notification.remove();
      }
    }, 10000);
  }

  async extractAndSummarize(links, elements) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    let termsText = "";

    // Extract text from detected elements
    elements.forEach((element) => {
      const text = element.textContent.trim();
      if (text.length > 100) {
        termsText += text + "\n\n";
      }
    });

    // If we have links, try to fetch their content (limit to first 3 links)
    const linksToFetch = Array.from(links).slice(0, 3);
    for (const link of linksToFetch) {
      try {
        // Only fetch if it's from the same domain or a relative link
        const url = new URL(link.href, window.location.href);
        if (url.hostname === window.location.hostname) {
          const response = await fetch(link.href);
          if (response.ok) {
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const bodyText = doc.body.textContent.trim();
            if (bodyText.length > 100) {
              termsText += bodyText + "\n\n";
            }
          }
        }
      } catch (error) {
        console.log("Could not fetch:", link.href, error);
      }
    }

    if (termsText.length > 100) {
      // Send to background script for AI processing
      this.showSummaryModal("🤖 Processing with AI...");

      chrome.runtime.sendMessage(
        {
          action: "summarizeTerms",
          text: termsText.substring(0, 80000), // Limit text size for API
          url: window.location.href,
        },
        (response) => {
          this.isProcessing = false;
          if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError);
            this.showSummaryModal(`
              <div class="summary-section">
                <h4>❌ Connection Error</h4>
                <p>Unable to connect to the AI service. This might be because:</p>
                <ul>
                  <li>Your Hugging Face API token is not set up</li>
                  <li>There's a network connectivity issue</li>
                </ul>
                <p>Please check your API token in the extension popup and try again.</p>
              </div>
            `);
          }
        }
      );
    } else {
      this.isProcessing = false;
      this.showSummaryModal(
        "⚠️ No substantial terms content found to analyze."
      );
    }
  }

  showSummaryModal(content) {
    // Remove existing modal if any
    const existingModal = document.getElementById("terms-ai-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "terms-ai-modal";
    modal.innerHTML = `
      <div class="terms-ai-modal-content">
        <div class="terms-ai-header">
          <h3>📋 Terms & Conditions Summary</h3>
          <div class="terms-ai-controls">
            <select id="language-select">
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="hi">हिन्दी</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
              <option value="ar">العربية</option>
            </select>
            <button id="close-modal">×</button>
          </div>
        </div>
        <div class="terms-ai-body">
          <div id="summary-content">${content}</div>
        </div>
        <div class="terms-ai-footer">
          <button id="translate-btn">Translate</button>
          <button id="detailed-analysis">Detailed Analysis</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    document.getElementById("close-modal").addEventListener("click", () => {
      modal.remove();
    });

    document.getElementById("translate-btn").addEventListener("click", () => {
      const selectedLang = document.getElementById("language-select").value;
      const summaryContent =
        document.getElementById("summary-content").textContent;

      if (summaryContent && summaryContent.length > 10) {
        chrome.runtime.sendMessage({
          action: "translateSummary",
          text: summaryContent,
          targetLanguage: selectedLang,
        });
      }
    });

    document
      .getElementById("detailed-analysis")
      .addEventListener("click", () => {
        chrome.runtime.sendMessage({
          action: "detailedAnalysis",
          url: window.location.href,
        });
      });
  }

  observeDOM() {
    // Watch for dynamically loaded content (but throttle it)
    let timeout;
    const observer = new MutationObserver((mutations) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        // Only check if we haven't shown notification yet
        if (!this.hasShownNotification) {
          this.detectTermsAndConditions();
        }
      }, 2000); // Wait 2 seconds after last change
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "displaySummary") {
    const summaryModal = document.getElementById("terms-ai-modal");
    if (summaryModal) {
      document.getElementById("summary-content").innerHTML = message.summary;
    } else {
      // Create new modal if it doesn't exist
      const detector = new TermsDetector();
      detector.showSummaryModal(message.summary);
    }
  } else if (message.action === "displayTranslation") {
    const summaryContent = document.getElementById("summary-content");
    if (summaryContent) {
      summaryContent.innerHTML = message.translation;
    }
  } else if (message.action === "forceDetection") {
    const detector = new TermsDetector();
    detector.hasShownNotification = false; // Reset flag
    detector.detectTermsAndConditions();
  }

  sendResponse({ received: true });
});

// Initialize when DOM is ready - but only once
if (!window.termsDetectorInitialized) {
  window.termsDetectorInitialized = true;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      new TermsDetector();
    });
  } else {
    new TermsDetector();
  }
}
