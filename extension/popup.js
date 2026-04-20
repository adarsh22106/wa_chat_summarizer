const chatInput = document.getElementById('chatInput');
const summariseBtn = document.getElementById('summariseBtn');
const extractBtn = document.getElementById('extractBtn');
const cards = document.getElementById('cards');
const statusLabel = document.getElementById('status');
const loader = document.getElementById('loader');
const versionLabel = document.getElementById('version');

const SUMMARIZE_URL = 'http://172.13.12.240:8000/summarize';
const ENTITIES_URL = 'http://172.13.12.240:8000/extract_entities';

function setLoading(isLoading) {
  loader.style.display = isLoading ? 'block' : 'none';
  summariseBtn.disabled = isLoading;
  extractBtn.disabled = isLoading;
  statusLabel.textContent = isLoading ? 'Processing… please wait.' : 'Ready to process chat content.';
}

async function callAPI(actionType, chatText) {
  const url = actionType === 'summarize' ? SUMMARIZE_URL : ENTITIES_URL;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: chatText
    })
  });

  if (!response.ok) {
    throw new Error(`API responded with ${response.status}`);
  }

  const data = await response.json();
  return data;
}

function clearResults() {
  cards.innerHTML = '';
}

function renderCard(title, content) {
  const card = document.createElement('div');
  card.className = 'card';

  const heading = document.createElement('h2');
  heading.textContent = title;
  card.appendChild(heading);

  const body = document.createElement('pre');
  body.textContent = content;
  card.appendChild(body);

  cards.appendChild(card);
}

function renderEntitiesCard(title, entities) {
  const card = document.createElement('div');
  card.className = 'card';

  const heading = document.createElement('h2');
  heading.textContent = title;
  card.appendChild(heading);

  if (!entities || entities.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No entities detected.';
    card.appendChild(empty);
    cards.appendChild(card);
    return;
  }

  const list = document.createElement('div');
  list.className = 'entity-list';

  entities.forEach(item => {
    const row = document.createElement('div');
    row.className = 'entity-row';

    const label = document.createElement('span');
    label.className = 'entity-type';
    label.textContent = item.type;
    row.appendChild(label);

    const values = document.createElement('span');
    values.className = 'entity-values';
    values.textContent = Array.isArray(item.items) ? item.items.join(', ') : String(item.items);
    row.appendChild(values);

    list.appendChild(row);
  });

  card.appendChild(list);
  cards.appendChild(card);
}

async function handleAction(actionType) {
  const chatText = chatInput.value.trim();
  if (!chatText) {
    statusLabel.textContent = 'Please paste chat text to continue.';
    return;
  }

  clearResults();
  setLoading(true);

  try {
    const response = await callAPI(actionType, chatText);

    if (actionType === 'summarize') {
      const summary = typeof response === 'string' ? response : response.summary || JSON.stringify(response);
      renderCard('Summary', summary.trim());
      statusLabel.textContent = 'Summary generated successfully.';
    } else {
      let entities = null;

      if (typeof response === 'string') {
        try {
          const parsed = JSON.parse(response.trim());
          if (Array.isArray(parsed)) {
            entities = parsed;
          } else if (parsed?.entities) {
            entities = parsed.entities;
          }
        } catch (_err) {
          entities = null;
        }
      } else if (Array.isArray(response)) {
        entities = response;
      } else if (response?.entities) {
        entities = response.entities;
      }

      if (entities) {
        renderEntitiesCard('Extracted Entities', entities);
        statusLabel.textContent = 'Entities extracted successfully.';
      } else {
        renderCard('Extracted Entities', JSON.stringify(response, null, 2));
        statusLabel.textContent = 'Entities response received.';
      }
    }
  } catch (error) {
    clearResults();
    renderCard('Error', error.message || 'Unable to contact API.');
    statusLabel.textContent = 'Failed to process request.';
  } finally {
    setLoading(false);
  }
}

/**
 * Extract messages from the active WhatsApp Web chat
 */
async function extractMessagesFromChat() {
  try {
    statusLabel.textContent = 'Extracting messages from WhatsApp...';

    // Query the active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    // Check if we're on WhatsApp Web
    if (!tab.url.includes('web.whatsapp.com')) {
      statusLabel.textContent = 'Please open WhatsApp Web (web.whatsapp.com) first.';
      return;
    }

    // Send message to content script to extract messages
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'extractMessages'
    });

    if (response.success && response.transcript) {
      // Auto-populate the chat input with extracted messages
      chatInput.value = response.transcript;
      statusLabel.textContent = `Extracted ${response.messageCount} messages from chat.`;

      clearResults();
    } else {
      statusLabel.textContent = 'No messages found in current chat. Make sure a chat is open.';
    }
  } catch (error) {
    statusLabel.textContent = `Error: ${error.message}. Make sure WhatsApp Web is open.`;
    console.error('Message extraction error:', error);
  }
}

summariseBtn.addEventListener('click', () => handleAction('summarize'));
extractBtn.addEventListener('click', () => handleAction('extract'));

// Extract from WhatsApp Web chat
const fetchWhatsAppBtn = document.getElementById('fetchWhatsAppBtn');
if (fetchWhatsAppBtn) {
  fetchWhatsAppBtn.addEventListener('click', extractMessagesFromChat);
}

chrome.runtime.sendMessage({ type: 'getVersion' }, response => {
  if (response?.version) {
    versionLabel.textContent = `Version ${response.version}`;
  }
});
