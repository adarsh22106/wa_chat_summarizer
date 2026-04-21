// background.js - Background service worker for API calls and storage

// Handle extension button click
chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes('web.whatsapp.com')) {
    chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Content script not ready');
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    summarizeMessages(request.messages)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Async response
  }
});

async function summarizeMessages(messages) {
  // Store messages in local storage
  await chrome.storage.local.set({ lastMessages: messages });

  // Send to API
  const apiUrl = 'http://localhost:8000/summarize'; // Replace with actual API endpoint
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Add API key if needed: 'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({ messages })
  });

  if (!response.ok) {
    throw new Error('API request failed: ' + response.statusText);
  }

  const data = await response.json();
  return {
    summary: data.summary || 'No summary available.',
    topics: data.topics || []
  };
}