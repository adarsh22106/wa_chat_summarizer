/**
 * Content Script for WhatsApp Web Chat Summarizer
 * Extracts messages from web.whatsapp.com and sends to popup
 */

// Function to extract messages from the current chat
function extractChatMessages() {
  const messages = [];

  // WhatsApp Web stores messages in divs with specific attributes
  // Look for message containers
  const messageElements = document.querySelectorAll(
    'div[data-testid="msg-container"]'
  );

  if (messageElements.length === 0) {
    // Fallback to alternative selector for different WhatsApp versions
    const altMessages = document.querySelectorAll(
      '.message-group, [role="region"]'
    );
    if (altMessages.length === 0) {
      console.log('WhatsApp Chat Summarizer: No messages found in current view');
      return messages;
    }
  }

  messageElements.forEach(messageElement => {
    try {
      // Extract sender name
      const senderElement = messageElement.querySelector(
        'span[aria-label*=":"], .copyable-text span'
      );
      const sender =
        senderElement?.getAttribute('aria-label')?.split(':')[0] ||
        senderElement?.textContent ||
        'Unknown';

      // Extract message text - look for text content in message body
      const messageBody = messageElement.querySelector(
        '.copyable-text, [data-testid="msg-text"], .selectable-text'
      );
      const messageText = messageBody?.textContent?.trim() || '';

      // Only add non-empty messages
      if (messageText) {
        messages.push({
          sender: sender.trim(),
          text: messageText,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.log('WhatsApp Chat Summarizer: Error extracting message', error);
    }
  });

  return messages;
}

// Function to format extracted messages into chat transcript
function formatChatTranscript(messages) {
  if (messages.length === 0) {
    return '';
  }

  return messages
    .map(msg => `${msg.sender}: ${msg.text}`)
    .join('\n');
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractMessages') {
    const messages = extractChatMessages();
    const transcript = formatChatTranscript(messages);

    sendResponse({
      success: true,
      messageCount: messages.length,
      transcript: transcript,
      messages: messages
    });
  }
});

// Auto-extract and notify when chat changes (optional monitoring)
function setupChatMonitor() {
  // Watch for changes to the message list
  const chatContainer = document.querySelector(
    '[role="main"], .message-group, ._1cokc'
  );

  if (!chatContainer) {
    return;
  }

  // Use MutationObserver to detect when new messages arrive
  const observer = new MutationObserver(mutations => {
    // Debounce to avoid excessive extraction
    clearTimeout(observer.debounceTimer);
    observer.debounceTimer = setTimeout(() => {
      const messages = extractChatMessages();
      if (messages.length > 0) {
        // Notify popup that new messages are available
        chrome.runtime.sendMessage({
          action: 'messagesUpdated',
          messageCount: messages.length
        }).catch(() => {
          // Popup may not be open, ignore error
        });
      }
    }, 500);
  });

  observer.observe(chatContainer, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

// Initialize monitoring when page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupChatMonitor);
} else {
  setupChatMonitor();
}

console.log('WhatsApp Chat Summarizer content script loaded');
