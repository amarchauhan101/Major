// options.js
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get('language', (data) => {
    if (data.language) {
      document.getElementById('language-preference').value = data.language;
    }
  });

  document.getElementById('save-options').addEventListener('click', () => {
    const language = document.getElementById('language-preference').value;
    chrome.storage.sync.set({ language });
  });
});