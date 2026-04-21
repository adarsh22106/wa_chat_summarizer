// content.js - Content script for WhatsApp Web

// Inject the panel when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectPanel);
} else {
  injectPanel();
}

function injectPanel() {
  // Create shadow root to avoid CSS conflicts
  const shadowHost = document.createElement('div');
  shadowHost.id = 'wa-chat-summarizer-shadow-host';
  shadowHost.style.position = 'fixed';
  shadowHost.style.top = '0';
  shadowHost.style.right = '0';
  shadowHost.style.width = '360px';
  shadowHost.style.height = '100vh';
  shadowHost.style.zIndex = '10000';
  shadowHost.style.display = 'none'; // Initially hidden
  document.body.appendChild(shadowHost);

  const shadow = shadowHost.attachShadow({ mode: 'open' });

  // Inject CSS as a style element (more reliable in content scripts)
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    :host {
      all: initial;
      font-family: 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }

    #wrapper {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      background: rgba(17, 27, 33, 0.95);
      backdrop-filter: blur(10px);
      color: #e9edef;
      border-left: 1px solid #2a3942;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background-color: #202c33;
      border-bottom: 1px solid #2a3942;
      flex-shrink: 0;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
      font-weight: 600;
      color: #e9edef;
    }

    #close-panel-btn {
      background: none;
      border: none;
      color: #aebac1;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    #close-panel-btn:hover {
      background: rgba(255,255,255,0.1);
      color: #fff;
    }

    .panel-content {
      padding: 20px;
      overflow-y: auto;
      flex-shrink: 0;
    }

    .control-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      font-size: 12px;
      color: #8696a0;
      margin-bottom: 8px;
      font-weight: 500;
    }

    input[type="number"], 
    input[type="date"], 
    select {
      width: 100%;
      background: #2a3942;
      border: 1px solid #3b4a54;
      border-radius: 6px;
      padding: 10px;
      color: #e9edef;
      font-size: 14px;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.2s;
      font-family: inherit;
    }

    input:focus, select:focus {
      border-color: #00a884;
    }

    .date-group {
      background: #2a3942;
      padding: 10px;
      border-radius: 6px;
    }

    .date-input-row {
      display: flex;
      gap: 10px;
    }

    .date-input-row > div {
      flex: 1;
    }

    .date-input-row label {
      margin-bottom: 4px;
      font-size: 11px;
    }

    .select-wrapper {
      position: relative;
    }

    .select-wrapper::after {
      content: '';
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      border: 5px solid transparent;
      border-top-color: #8696a0;
      pointer-events: none;
    }

    select {
      appearance: none;
      cursor: pointer;
    }

    .btn-primary {
      width: 100%;
      padding: 12px;
      background-color: #00a884;
      border: none;
      border-radius: 24px;
      color: #111b21;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.2s;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .btn-primary:hover {
      background-color: #008f6f;
    }

    .btn-primary:disabled {
      background-color: #2a3942;
      color: #8696a0;
      cursor: not-allowed;
    }

    .panel-output {
      flex-grow: 1;
      padding: 0 20px 20px 20px;
      overflow-y: auto;
      border-top: 1px solid #2a3942;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      color: #8696a0;
      padding-top: 40px;
    }

    .empty-state p {
      margin-top: 15px;
      font-size: 14px;
      line-height: 1.4;
    }

    .result-card {
      margin-top: 15px;
      animation: fadeIn 0.3s ease;
    }

    .result-title {
      font-size: 14px;
      color: #00a884;
      margin-bottom: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .result-text {
      font-size: 14px;
      line-height: 1.5;
      color: #e9edef;
      white-space: pre-wrap;
    }

    .topic-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .topic-list li {
      padding: 8px 12px;
      background: #2a3942;
      border-radius: 6px;
      margin-bottom: 6px;
      font-size: 13px;
      color: #d1d7db;
      border-left: 3px solid #00a884;
    }

    .loading-spinner {
      border: 3px solid rgba(255,255,255,0.1);
      border-top: 3px solid #00a884;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }

    .error-msg {
      color: #ef5350;
      background: rgba(239, 83, 80, 0.1);
      padding: 12px;
      border-radius: 6px;
      font-size: 13px;
      text-align: center;
    }

    ::-webkit-scrollbar {
      width: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(134, 150, 160, 0.3);
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(134, 150, 160, 0.5);
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  shadow.appendChild(styleElement);

  // Create the panel structure inside the shadow root
  const wrapper = document.createElement('div');
  wrapper.id = 'wrapper';
  wrapper.innerHTML = `
    <div class="panel-header">
      <div class="header-title">Chat Summarizer</div>
      <button id="close-panel-btn" title="Close">×</button>
    </div>
    <div class="panel-content">
      <div class="control-group">
        <label for="option-select">Summarize</label>
        <div class="select-wrapper">
          <select id="option-select">
            <option value="last-x">Last X Messages</option>
            <option value="time-range">Time Range</option>
          </select>
        </div>
      </div>
      <div class="control-group" id="last-x-group">
        <label for="last-x-input">Last X messages</label>
        <input type="number" id="last-x-input" value="50" min="1" />
      </div>
      <div class="control-group date-group" id="time-range-group" style="display: none;">
        <div class="date-input-row">
          <div>
            <label for="start-date">Start date</label>
            <input type="date" id="start-date" />
          </div>
          <div>
            <label for="end-date">End date</label>
            <input type="date" id="end-date" />
          </div>
        </div>
      </div>
      <button class="btn-primary" id="summarize-btn">Summarize Chat</button>
    </div>
    <div class="panel-output" id="output">
      <div class="empty-state">
        <p>Select a summary option and click "Summarize Chat".</p>
      </div>
    </div>
  `;

  shadow.appendChild(wrapper);
  attachPanelHandlers(shadow, shadowHost);

  // Listen for toggle messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'togglePanel') {
      shadowHost.style.display = shadowHost.style.display === 'none' ? 'block' : 'none';
      sendResponse({ success: true });
    }
  });

  // Listen for postMessage events from panel.js
  window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    
    if (event.data.action === 'extractMessages') {
      try {
        const messages = await extractMessages(event.data.params);
        window.postMessage({
          type: 'extractMessages-response',
          messageId: event.data.messageId,
          messages
        }, '*');
      } catch (error) {
        window.postMessage({
          type: 'extractMessages-response',
          messageId: event.data.messageId,
          error: error.message
        }, '*');
      }
    } else if (event.data.action === 'summarize') {
      try {
        const result = await summarizeMessages(event.data.messages);
        window.postMessage({
          type: 'summarize-response',
          messageId: event.data.messageId,
          result
        }, '*');
      } catch (error) {
        window.postMessage({
          type: 'summarize-response',
          messageId: event.data.messageId,
          error: error.message
        }, '*');
      }
    }
  });
}

function attachPanelHandlers(shadow, shadowHost) {
  const summarizeBtn = shadow.querySelector('#summarize-btn');
  const optionSelect = shadow.querySelector('#option-select');
  const lastXGroup = shadow.querySelector('#last-x-group');
  const timeRangeGroup = shadow.querySelector('#time-range-group');
  const outputDiv = shadow.querySelector('#output');
  const closeBtn = shadow.querySelector('#close-panel-btn');

  optionSelect.addEventListener('change', () => {
    const value = optionSelect.value;
    lastXGroup.style.display = value === 'last-x' ? 'block' : 'none';
    timeRangeGroup.style.display = value === 'time-range' ? 'block' : 'none';
  });

  closeBtn.addEventListener('click', () => {
    shadowHost.style.display = 'none';
  });

  summarizeBtn.addEventListener('click', async () => {
    const option = optionSelect.value;
    const numInput = shadow.querySelector('#last-x-input');
    const startDateInput = shadow.querySelector('#start-date');
    const endDateInput = shadow.querySelector('#end-date');

    let params = {};
    if (option === 'last-x') {
      const num = parseInt(numInput.value, 10);
      if (!num || num <= 0) {
        return showError('Please enter a valid number for last X messages.');
      }
      params = { type: 'last-x', num };
    } else {
      const start = startDateInput.value;
      const end = endDateInput.value;
      if (!start || !end) {
        return showError('Please select both start and end dates.');
      }
      params = { type: 'time-range', start, end };
    }

    showLoading();
    try {
      const messages = await extractMessages(params);
      if (!messages || messages.length === 0) {
        showError('No messages found.');
        return;
      }

      const result = await summarizeMessages(messages);
      displayResult(result);
    } catch (error) {
      showError('An error occurred: ' + error.message);
    }
  });

  function showLoading() {
    outputDiv.innerHTML = '<div class="empty-state">Processing...</div>';
  }

  function showError(message) {
    outputDiv.innerHTML = `<div class="empty-state"><p>${message}</p></div>`;
  }

  function displayResult(result) {
    const { summary, topics } = result;
    outputDiv.innerHTML = `
      <div class="result-card">
        <div class="result-title">Summary</div>
        <p>${summary}</p>
      </div>
      <div class="result-card">
        <div class="result-title">Key Topics</div>
        <ul>
          ${Array.isArray(topics) ? topics.map(topic => `<li>${topic}</li>`).join('') : '<li>No topics found</li>'}
        </ul>
      </div>
    `;
  }
}

// Wrapper function for internal use in postMessage event listeners
function extractMessages(params) {
  return extractMessagesInternal(params);
}

function parseMessageInternal(node) {
  // Extract sender
  const senderSpan = node.querySelector('[data-testid="author"]') ||
                     node.querySelector('span[aria-label]');
  const sender = senderSpan ? senderSpan.textContent.trim() : 'Unknown';

  // Extract message text
  const messageSpan = node.querySelector('[data-testid="msg-text"]') ||
                      node.querySelector('span[data-testid="selectable-text"]');
  const text = messageSpan ? messageSpan.textContent.trim() : '';

  // Skip if message is empty or just media
  if (!text || text.includes('[Media]') || text.length < 3) {
    return null;
  }

  // Extract timestamp
  const timeAttr = node.getAttribute('data-pre-plain-text') ||
                   node.querySelector('[data-testid="msg-time"]')?.textContent;
  let timestamp = '';
  if (timeAttr) {
    timestamp = timeAttr;
  }

  return { sender, text, timestamp };
}

async function loadMessagesInternal(params) {
  const container = document.querySelector('[data-testid="conversation-panel-messages"]') ||
                    document.querySelector('.x9f619.x1hx0egp.x1yrsyyn.xf159sx.xwib8y2.x7coems');

  if (!container) return;

  let scrollAttempts = 0;
  const maxScrolls = 50;

  while (scrollAttempts < maxScrolls) {
    const initialHeight = container.scrollHeight;
    container.scrollTop = 0;

    await new Promise(resolve => setTimeout(resolve, 500));

    if (container.scrollHeight === initialHeight) {
      break;
    }

    scrollAttempts++;

    if (params.type === 'last-x' && container.querySelectorAll('.message-in, .message-out').length >= params.num) {
      break;
    }
  }
}

function filterMessagesInternal(messages, params) {
  if (params.type === 'last-x') {
    return messages.slice(-params.num);
  } else if (params.type === 'time-range') {
    const start = new Date(params.start);
    const end = new Date(params.end);
    return messages.filter(msg => {
      if (!msg.timestamp) return false;
      const msgDate = new Date(msg.timestamp);
      return msgDate >= start && msgDate <= end;
    });
  }
  return messages;
}

// Extract messages from WhatsApp Web
async function extractMessagesInternal(params) {
  const messageContainer = document.querySelector('[data-testid="conversation-panel-messages"]') ||
                           document.querySelector('.x9f619.x1hx0egp.x1yrsyyn.xf159sx.xwib8y2.x7coems');

  if (!messageContainer) {
    throw new Error('Message container not found. Make sure you are on a chat page.');
  }

  await loadMessagesInternal(params);

  const messages = [];
  const messageNodes = messageContainer.querySelectorAll('[data-testid="msg-container"]') ||
                       messageContainer.querySelectorAll('.message-in, .message-out');

  for (const node of messageNodes) {
    const messageData = parseMessageInternal(node);
    if (messageData) {
      messages.push(messageData);
    }
  }

  return filterMessagesInternal(messages, params);
}

// Wrapper for the message event listener
function extractMessages(params) {
  return extractMessagesInternal(params);
}

// Send summarize request to background script
function summarizeMessages(messages) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'summarize', messages }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response && response.error) {
        reject(new Error(response.error));
      } else if (response) {
        resolve(response);
      } else {
        reject(new Error('No response from background script'));
      }
    });
  });
}

// Extract messages from content script (internal function)
async function extractMessagesInternal(params) {
  const messageContainer = document.querySelector('[data-testid="conversation-panel-messages"]') ||
                           document.querySelector('.x9f619.x1hx0egp.x1yrsyyn.xf159sx.xwib8y2.x7coems');

  if (!messageContainer) {
    throw new Error('Message container not found. Make sure you are on a chat page.');
  }

  // Scroll to load messages if needed
  await loadMessagesInternal(params);

  const messages = [];
  const messageNodes = messageContainer.querySelectorAll('[data-testid="msg-container"]') ||
                       messageContainer.querySelectorAll('.message-in, .message-out');

  for (const node of messageNodes) {
    const messageData = parseMessageInternal(node);
    if (messageData) {
      messages.push(messageData);
    }
  }

  // Filter based on params
  return filterMessagesInternal(messages, params);
}

function parseMessageInternal(node) {
  // Extract sender
  const senderSpan = node.querySelector('[data-testid="author"]') ||
                     node.querySelector('span[aria-label]');
  const sender = senderSpan ? senderSpan.textContent.trim() : 'Unknown';

  // Extract message text
  const messageSpan = node.querySelector('[data-testid="msg-text"]') ||
                      node.querySelector('span[data-testid="selectable-text"]');
  const text = messageSpan ? messageSpan.textContent.trim() : '';

  // Skip if message is empty or just media
  if (!text || text.includes('[Media]') || text.length < 3) {
    return null;
  }

  // Extract timestamp
  const timeAttr = node.getAttribute('data-pre-plain-text') ||
                   node.querySelector('[data-testid="msg-time"]')?.textContent;
  let timestamp = '';
  if (timeAttr) {
    timestamp = timeAttr;
  }

  return { sender, text, timestamp };
}

async function loadMessagesInternal(params) {
  const container = document.querySelector('[data-testid="conversation-panel-messages"]') ||
                    document.querySelector('.x9f619.x1hx0egp.x1yrsyyn.xf159sx.xwib8y2.x7coems');

  if (!container) return;

  let scrollAttempts = 0;
  const maxScrolls = 50;

  while (scrollAttempts < maxScrolls) {
    const initialHeight = container.scrollHeight;
    container.scrollTop = 0;

    await new Promise(resolve => setTimeout(resolve, 500));

    if (container.scrollHeight === initialHeight) {
      break;
    }

    scrollAttempts++;

    if (params.type === 'last-x' && container.querySelectorAll('.message-in, .message-out').length >= params.num) {
      break;
    }
  }
}

function filterMessagesInternal(messages, params) {
  if (params.type === 'last-x') {
    return messages.slice(-params.num);
  } else if (params.type === 'time-range') {
    const start = new Date(params.start);
    const end = new Date(params.end);
    return messages.filter(msg => {
      if (!msg.timestamp) return false;
      const msgDate = new Date(msg.timestamp);
      return msgDate >= start && msgDate <= end;
    });
  }
  return messages;
}
