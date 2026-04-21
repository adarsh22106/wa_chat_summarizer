// panel.js - Handles UI interactions in the injected panel

document.addEventListener('DOMContentLoaded', () => {
    const summarizeBtn = document.getElementById('summarize-btn');
    const optionSelect = document.getElementById('option-select');
    const lastXInput = document.getElementById('last-x-input');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const outputDiv = document.getElementById('output');

    // Toggle input visibility based on option
    optionSelect.addEventListener('change', () => {
        const value = optionSelect.value;
        lastXInput.style.display = value === 'last-x' ? 'block' : 'none';
        startDateInput.style.display = value === 'time-range' ? 'block' : 'none';
        endDateInput.style.display = value === 'time-range' ? 'block' : 'none';
    });

    // Summarize button click
    summarizeBtn.addEventListener('click', async () => {
        console.log('Summarize button clicked');
        const option = optionSelect.value;
        let params = {};

        if (option === 'last-x') {
            const num = parseInt(lastXInput.value);
            console.log('Last X messages option selected with num:', num);
            if (!num || num <= 0) {
                showError('Please enter a valid number for last X messages.');
                return;
            }
            params = { type: 'last-x', num };
        } else if (option === 'time-range') {
            const start = startDateInput.value;
            const end = endDateInput.value;
            if (!start || !end) {
                showError('Please select both start and end dates.');
                return;
            }
            params = { type: 'time-range', start, end };
        }

        showLoading();

        try {
            // Send message to content script to extract messages
            const messages = await extractMessages(params);
            console.log('Extracted messages:', messages);
            if (!messages || messages.length === 0) {
                showError('No messages found.');
                return;
            }

            // Send to background for API call
            const result = await summarizeMessages(messages);
            displayResult(result);
        } catch (error) {
            showError('An error occurred: ' + error.message);
        }
    });

    function showLoading() {
        outputDiv.innerHTML = '<div class="loading">Processing...</div>';
    }

    function showError(message) {
        outputDiv.innerHTML = `<div class="error">${message}</div>`;
    }

    function displayResult(result) {
        const { summary, topics } = result;
        outputDiv.innerHTML = `
      <div class="summary">
        <h3>Summary</h3>
        <p>${summary}</p>
      </div>
      <div class="topics">
        <h3>Key Topics</h3>
        <ul>
        ${topics}
          ${topics.map(topic => `<li>${topic}</li>`).join('')}
        </ul>
      </div>
    `;
    }

    // Communicate with content script using postMessage
    function extractMessages(params) {
        return new Promise((resolve, reject) => {
            const messageId = Math.random().toString(36).substr(2, 9);
            const listener = (event) => {
                if (event.data.type === 'extractMessages-response' && event.data.messageId === messageId) {
                    window.removeEventListener('message', listener);
                    if (event.data.error) {
                        reject(new Error(event.data.error));
                    } else {
                        resolve(event.data.messages);
                    }
                }
            };
            window.addEventListener('message', listener);
            window.postMessage({ action: 'extractMessages', params, messageId }, '*');
        });
    }

    function summarizeMessages(messages) {
        return new Promise((resolve, reject) => {
            const messageId = Math.random().toString(36).substr(2, 9);
            const listener = (event) => {
                if (event.data.type === 'summarize-response' && event.data.messageId === messageId) {
                    window.removeEventListener('message', listener);
                    if (event.data.error) {
                        reject(new Error(event.data.error));
                    } else {
                        resolve(event.data.result);
                    }
                }
            };
            window.addEventListener('message', listener);
            window.postMessage({ action: 'summarize', messages, messageId }, '*');
        });
    }
});