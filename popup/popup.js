
  document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ Popup script loaded");

    const scanBtn = document.getElementById("scanBtn");
    const acceptEssential = document.getElementById("acceptEssential");
    const acceptAll = document.getElementById("acceptAll");
    const cookieList = document.getElementById("cookieList");

    // Load any existing scan result from storage
    loadCookieReport();

    // 🔍 Scan current page
    scanBtn.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          chrome.runtime.sendMessage({
            action: "scanCookies",
            url: tabs[0].url,
          });
        }
      });
    });

    // 📩 Receive updated cookie report from background.js
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === "showCookieReport") {
        renderCookies(message.cookies);
      }
    });

    // 🧠 Load existing data from storage on popup load
    function loadCookieReport() {
      chrome.storage.local.get("cookieReport", (data) => {
        console.log("data in popup", data);
        if (data.cookieReport) {
          renderCookies(data.cookieReport);
        } else {
          console.warn("⚠️ cookieReport not found in storage");
        }
      });
    }

    // 🖼️ Display cookies in popup
    function renderCookies(cookies) {
      cookieList.innerHTML = "";

      if (cookies.length === 0) {
        cookieList.innerHTML = "<p>No cookies found on this page</p>";
        return;
      }

      cookies.forEach((cookie) => {
        const cookieEl = document.createElement("div");
        cookieEl.className = "cookie-item";

        const riskClass = cookie.riskLevel
          ? `risk-${cookie.riskLevel.toLowerCase()}`
          : "risk-low";

        cookieEl.innerHTML = `
          <h3>${cookie.name}</h3>
          <p><strong>Domain:</strong> ${cookie.domain}</p>
          <p><strong>Type:</strong> ${
            cookie.isThirdParty ? "Third-Party" : "First-Party"
          }</p>
          <p><strong>Risk:</strong> <span class="${riskClass}">${
          cookie.riskLevel || "Low"
        }</span></p>
          <p><strong>Purpose:</strong> ${cookie.purpose}</p>
          <p><strong>Essential:</strong> ${cookie.isEssential ? "Yes" : "No"}</p>
          <label>
            <input type="checkbox" class="cookie-toggle" 
                  data-name="${cookie.name}" 
                  data-domain="${cookie.domain}" 
                  ${cookie.isEssential ? "checked disabled" : "checked"}>
            Allow this cookie
          </label>
        `;

        cookieList.appendChild(cookieEl);
      });

      // 🧪 Handle toggle changes
      document.querySelectorAll(".cookie-toggle").forEach((toggle) => {
        toggle.addEventListener("change", (e) => {
          const cookieName = e.target.dataset.name;
          const cookieDomain = e.target.dataset.domain;
          const isAllowed = e.target.checked;

          chrome.runtime.sendMessage({
            action: "updateCookieSetting",
            cookieName,
            cookieDomain,
            isAllowed,
          });

          console.log(
            `🔧 Updated setting: ${cookieName}|${cookieDomain} = ${isAllowed}`
          );
        });
      });
    }

    // ✅ Accept only essential cookies
    acceptEssential.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          chrome.runtime.sendMessage({
            action: "acceptEssentialCookies",
            url: tabs[0].url,
          });
        }
      });
    });

    // ✅ Accept all cookies
    acceptAll.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "acceptAllCookies" });
    });
  });

  // popup.js
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "TERMS_SUMMARY") {
      document.getElementById('terms-summary').innerText = msg.summary;
      document.getElementById('terms-section').style.display = 'block';
    }
  });

  // Handle user actions
  document.getElementById('accept-terms').addEventListener('click', () => {
    chrome.tabs.query({active: true}, ([tab]) => {
      chrome.tabs.sendMessage(tab.id, {type: "TERMS_ACCEPTED"});
    });
  });



// document.addEventListener("DOMContentLoaded", () => {
//   console.log("✅ Popup script loaded");

//   // Existing cookie scanning code...

//   // Terms summary handling
//   const termsSection = document.getElementById("terms-section");
//   const termsSummary = document.getElementById("terms-summary");
//   const acceptTermsBtn = document.getElementById("accept-terms");
//   const rejectTermsBtn = document.getElementById("reject-terms");

//   chrome.runtime.onMessage.addListener((message) => {
//     // Cookie report message
//     if (message.action === "showCookieReport") {
//       renderCookies(message.cookies);
//     }
//     // Terms summary message
//     else if (message.type === "TERMS_SUMMARY") {
//       termsSummary.innerText = message.summary;
//       termsSection.style.display = 'block';
//     }
//   });

//   // Handle terms acceptance
//   acceptTermsBtn.addEventListener('click', () => {
//     chrome.tabs.query({active: true}, ([tab]) => {
//       chrome.tabs.sendMessage(tab.id, {type: "TERMS_ACCEPTED"});
//     });
//     termsSection.style.display = 'none';
//   });

//   // Handle terms rejection
//   rejectTermsBtn.addEventListener('click', () => {
//     chrome.tabs.query({active: true}, ([tab]) => {
//       chrome.tabs.sendMessage(tab.id, {type: "TERMS_REJECTED"});
//     });
//     termsSection.style.display = 'none';
//   });
// });

// document.getElementById("settingsBtn").addEventListener("click", () => {
//   chrome.runtime.openOptionsPage();
// });