// // // Popup script for extension settings
// // document.addEventListener('DOMContentLoaded', async () => {
// //   // Load saved settings
// //   await loadSettings();
// //   await loadStats();

// //   // Event listeners
// //   document.getElementById('save-key').addEventListener('click', saveApiKey);
// //   document.getElementById('auto-detect').addEventListener('change', saveAutoDetect);
// //   document.getElementById('default-language').addEventListener('change', saveDefaultLanguage);
// //   document.getElementById('scan-current-page').addEventListener('click', scanCurrentPage);
// //   document.getElementById('clear-data').addEventListener('click', clearAllData);
// // });

// // async function loadSettings() {
// //   try {
// //     const result = await chrome.storage.sync.get([
// //       'openai_api_key',
// //       'auto_detect',
// //       'default_language'
// //     ]);

// //     if (result.openai_api_key) {
// //       // Show masked API key
// //       document.getElementById('api-key').value = '••••••••••••••••••••' + result.openai_api_key.slice(-4);
// //     }

// //     document.getElementById('auto-detect').checked = result.auto_detect !== false;
// //     document.getElementById('default-language').value = result.default_language || 'en';

// //   } catch (error) {
// //     showStatus('Error loading settings', 'error');
// //   }
// // }

// // async function loadStats() {
// //   try {
// //     const result = await chrome.storage.sync.get([
// //       'terms_analyzed',
// //       'risks_found',
// //       'time_saved'
// //     ]);

// //     document.getElementById('terms-analyzed').textContent = result.terms_analyzed || 0;
// //     document.getElementById('risks-found').textContent = result.risks_found || 0;
// //     document.getElementById('time-saved').textContent = result.time_saved || 0;

// //   } catch (error) {
// //     console.error('Error loading stats:', error);
// //   }
// // }

// // async function saveApiKey() {
// //   const apiKey = document.getElementById('api-key').value.trim();

// //   if (!apiKey || apiKey.startsWith('••••')) {
// //     showStatus('Please enter a valid API key', 'error');
// //     return;
// //   }

// //   if (!apiKey.startsWith('sk-')) {
// //     showStatus('Invalid API key format', 'error');
// //     return;
// //   }

// //   try {
// //     await chrome.storage.sync.set({ openai_api_key: apiKey });
// //     showStatus('API key saved successfully!', 'success');

// //     // Mask the key in the input
// //     setTimeout(() => {
// //       document.getElementById('api-key').value = '••••••••••••••••••••' + apiKey.slice(-4);
// //     }, 1000);

// //   } catch (error) {
// //     showStatus('Error saving API key', 'error');
// //   }
// // }

// // async function saveAutoDetect() {
// //   const autoDetect = document.getElementById('auto-detect').checked;

// //   try {
// //     await chrome.storage.sync.set({ auto_detect: autoDetect });
// //     showStatus('Settings saved!', 'success');
// //   } catch (error) {
// //     showStatus('Error saving settings', 'error');
// //   }
// // }

// // async function saveDefaultLanguage() {
// //   const language = document.getElementById('default-language').value;

// //   try {
// //     await chrome.storage.sync.set({ default_language: language });
// //     showStatus('Language preference saved!', 'success');
// //   } catch (error) {
// //     showStatus('Error saving language', 'error');
// //   }
// // }

// // async function scanCurrentPage() {
// //   try {
// //     // Get current active tab
// //     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

// //     if (!tab) {
// //       showStatus('No active tab found', 'error');
// //       return;
// //     }

// //     // Inject content script to scan for terms
// //     await chrome.scripting.executeScript({
// //       target: { tabId: tab.id },
// //       func: () => {
// //         // Force detection on current page
// //         const detector = new TermsDetector();
// //         detector.detectTermsAndConditions();
// //       }
// //     });

// //     showStatus('Scanning current page...', 'success');
// //     window.close();

// //   } catch (error) {
// //     showStatus('Error scanning page', 'error');

// // Popup script for extension settings
// document.addEventListener('DOMContentLoaded', async () => {
//   // Load saved settings
//   await loadSettings();
//   await loadStats();

//   // Event listeners
//   document.getElementById('save-key').addEventListener('click', saveApiKey);
//   document.getElementById('auto-detect').addEventListener('change', saveAutoDetect);
//   document.getElementById('default-language').addEventListener('change', saveDefaultLanguage);
//   document.getElementById('scan-current-page').addEventListener('click', scanCurrentPage);
//   document.getElementById('clear-data').addEventListener('click', clearAllData);
// });

// async function loadSettings() {
//   try {
//     const result = await chrome.storage.sync.get([
//       'openai_api_key',
//       'auto_detect',
//       'default_language'
//     ]);

//     if (result.openai_api_key) {
//       // Show masked API key
//       document.getElementById('api-key').value = '••••••••••••••••••••' + result.openai_api_key.slice(-4);
//     }

//     document.getElementById('auto-detect').checked = result.auto_detect !== false;
//     document.getElementById('default-language').value = result.default_language || 'en';

//   } catch (error) {
//     showStatus('Error loading settings', 'error');
//   }
// }

// async function loadStats() {
//   try {
//     const result = await chrome.storage.sync.get([
//       'terms_analyzed',
//       'risks_found',
//       'time_saved'
//     ]);

//     document.getElementById('terms-analyzed').textContent = result.terms_analyzed || 0;
//     document.getElementById('risks-found').textContent = result.risks_found || 0;
//     document.getElementById('time-saved').textContent = result.time_saved || 0;

//   } catch (error) {
//     console.error('Error loading stats:', error);
//   }
// }

// async function saveApiKey() {
//   const apiKey = document.getElementById('api-key').value.trim();

//   if (!apiKey || apiKey.startsWith('••••')) {
//     showStatus('Please enter a valid API key', 'error');
//     return;
//   }

//   if (!apiKey.startsWith('sk-')) {
//     showStatus('Invalid API key format', 'error');
//     return;
//   }

//   try {
//     await chrome.storage.sync.set({ openai_api_key: apiKey });
//     showStatus('API key saved successfully!', 'success');

//     // Mask the key in the input
//     setTimeout(() => {
//       document.getElementById('api-key').value = '••••••••••••••••••••' + apiKey.slice(-4);
//     }, 1000);

//   } catch (error) {
//     showStatus('Error saving API key', 'error');
//   }
// }

// async function saveAutoDetect() {
//   const autoDetect = document.getElementById('auto-detect').checked;

//   try {
//     await chrome.storage.sync.set({ auto_detect: autoDetect });
//     showStatus('Settings saved!', 'success');
//   } catch (error) {
//     showStatus('Error saving settings', 'error');
//   }
// }

// async function saveDefaultLanguage() {
//   const language = document.getElementById('default-language').value;

//   try {
//     await chrome.storage.sync.set({ default_language: language });
//     showStatus('Language preference saved!', 'success');
//   } catch (error) {
//     showStatus('Error saving language', 'error');
//   }
// }

// async function scanCurrentPage() {
//   try {
//     // Get current active tab
//     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//     if (!tab) {
//       showStatus('No active tab found', 'error');
//       return;
//     }

//     // Inject content script to scan for terms
//     await chrome.scripting.executeScript({
//       target: { tabId: tab.id },
//       func: () => {
//         // Force detection on current page
//         const detector = new TermsDetector();
//         detector.detectTermsAndConditions();
//       }
//     });

//     showStatus('Scanning current page...', 'success');
//     window.close();

//   } catch (error) {
//     showStatus('Error scanning page', 'error');
//   }
// }

// async function clearAllData() {
//   if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) {
//     return;
//   }

//   try {
//     await chrome.storage.sync.clear();
//     document.getElementById('api-key').value = '';
//     document.getElementById('auto-detect').checked = true;
//     document.getElementById('default-language').value = 'en';
//     document.getElementById('terms-analyzed').textContent = '0';
//     document.getElementById('risks-found').textContent = '0';
//     document.getElementById('time-saved').textContent = '0';

//     showStatus('All data cleared!', 'success');
//   } catch (error) {
//     showStatus('Error clearing data', 'error');
//   }
// }

// function showStatus(message, type) {
//   const statusDiv = document.getElementById('status');
//   statusDiv.textContent = message;
//   statusDiv.className = `status ${type}`;

//   setTimeout(() => {
//     statusDiv.textContent = '';
//     statusDiv.className = '';
//   }, 3000);
// }

// Popup script for extension settings
document.addEventListener("DOMContentLoaded", async () => {
  // Load saved settings
  await loadSettings();
  await loadStats();

  // Event listeners
  document.getElementById("save-key").addEventListener("click", saveApiKey);
  document
    .getElementById("auto-detect")
    .addEventListener("change", saveAutoDetect);
  document
    .getElementById("default-language")
    .addEventListener("change", saveDefaultLanguage);
  document
    .getElementById("scan-current-page")
    .addEventListener("click", scanCurrentPage);
  document.getElementById("clear-data").addEventListener("click", clearAllData);
});

async function loadSettings() {
  try {
    // const result = await chrome.storage.sync.get([
    //   'openai_api_key',
    //   'auto_detect',
    //   'default_language'
    // ]);

    // if (result.openai_api_key) {
    //   // Show masked API key
    //   document.getElementById('api-key').value = '••••••••••••••••••••' + result.openai_api_key.slice(-4);
    // }

    const result = await chrome.storage.sync.get([
      "hf_api_token",
      "auto_detect",
      "default_language",
    ]);

    if (result.hf_api_token) {
      document.getElementById("api-key").value =
        "••••••••••••••••••••" + result.hf_api_token.slice(-4);
    }

    document.getElementById("auto-detect").checked =
      result.auto_detect !== false;
    document.getElementById("default-language").value =
      result.default_language || "en";
  } catch (error) {
    showStatus("Error loading settings", "error");
  }
}

async function loadStats() {
  try {
    const result = await chrome.storage.sync.get([
      "terms_analyzed",
      "risks_found",
      "time_saved",
    ]);

    document.getElementById("terms-analyzed").textContent =
      result.terms_analyzed || 0;
    document.getElementById("risks-found").textContent =
      result.risks_found || 0;
    document.getElementById("time-saved").textContent = Math.floor(
      result.time_saved || 0
    );
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

// async function saveApiKey() {
//   const apiKey = document.getElementById('api-key').value.trim();

//   if (!apiKey || apiKey.startsWith('••••')) {
//     showStatus('Please enter a valid API key', 'error');
//     return;
//   }

//   if (!apiKey.startsWith('sk-')) {
//     showStatus('Invalid API key format. Must start with "sk-"', 'error');
//     return;
//   }

//   try {
//     await chrome.storage.sync.set({ openai_api_key: apiKey });
//     showStatus('API key saved successfully!', 'success');

//     // Mask the key in the input
//     setTimeout(() => {
//       document.getElementById('api-key').value = '••••••••••••••••••••' + apiKey.slice(-4);
//     }, 1000);

//   } catch (error) {
//     showStatus('Error saving API key', 'error');
//   }
// }

async function saveApiKey() {
  const apiKey = document.getElementById("api-key").value.trim();

  if (!apiKey || apiKey.startsWith("••••")) {
    showStatus("Please enter a valid Hugging Face API token", "error");
    return;
  }

  if (!apiKey.startsWith("hf_")) {
    showStatus('Invalid token format. Must start with "hf_"', "error");
    return;
  }

  try {
    await chrome.storage.sync.set({ hf_api_token: apiKey });
    showStatus("Hugging Face token saved successfully!", "success");

    setTimeout(() => {
      document.getElementById("api-key").value =
        "••••••••••••••••••••" + apiKey.slice(-4);
    }, 1000);
  } catch (error) {
    showStatus("Error saving API token", "error");
  }
}

async function saveAutoDetect() {
  const autoDetect = document.getElementById("auto-detect").checked;

  try {
    await chrome.storage.sync.set({ auto_detect: autoDetect });
    showStatus("Settings saved!", "success");
  } catch (error) {
    showStatus("Error saving settings", "error");
  }
}

async function saveDefaultLanguage() {
  const language = document.getElementById("default-language").value;

  try {
    await chrome.storage.sync.set({ default_language: language });
    showStatus("Language preference saved!", "success");
  } catch (error) {
    showStatus("Error saving language", "error");
  }
}

async function scanCurrentPage() {
  try {
    // Get current active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      showStatus("No active tab found", "error");
      return;
    }

    // Send message to content script to force detection
    chrome.tabs.sendMessage(
      tab.id,
      {
        action: "forceDetection",
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.log("Content script not ready, injecting...");
          // If content script isn't loaded, inject it
          chrome.scripting
            .executeScript({
              target: { tabId: tab.id },
              files: ["content.js"],
            })
            .then(() => {
              // Try sending message again after injection
              setTimeout(() => {
                chrome.tabs.sendMessage(tab.id, { action: "forceDetection" });
              }, 500);
            })
            .catch((error) => {
              console.error("Error injecting script:", error);
              showStatus("Error scanning page", "error");
            });
        } else {
          console.log("Force detection message sent successfully");
        }
      }
    );

    showStatus("Scanning current page...", "success");

    // Close popup after a short delay
    setTimeout(() => {
      window.close();
    }, 1500);
  } catch (error) {
    console.error("Error in scanCurrentPage:", error);
    showStatus("Error scanning page", "error");
  }
}

async function clearAllData() {
  if (
    !confirm("Are you sure you want to clear all data? This cannot be undone.")
  ) {
    return;
  }

  try {
    await chrome.storage.sync.clear();
    document.getElementById("api-key").value = "";
    document.getElementById("auto-detect").checked = true;
    document.getElementById("default-language").value = "en";
    document.getElementById("terms-analyzed").textContent = "0";
    document.getElementById("risks-found").textContent = "0";
    document.getElementById("time-saved").textContent = "0";

    showStatus("All data cleared!", "success");
  } catch (error) {
    showStatus("Error clearing data", "error");
  }
}

function showStatus(message, type) {
  const statusDiv = document.getElementById("status");
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;

  setTimeout(() => {
    statusDiv.textContent = "";
    statusDiv.className = "";
  }, 3000);
}
