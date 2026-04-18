chrome.runtime.onInstalled.addListener(() => {
  console.log('WA Chat Summariser starter extension installed.');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getVersion') {
    sendResponse({version: chrome.runtime.getManifest().version});
  }
});
