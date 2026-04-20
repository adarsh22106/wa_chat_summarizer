const chatInput = document.getElementById('chatInput');
const summariseBtn = document.getElementById('summariseBtn');
const result = document.getElementById('result');
const versionLabel = document.getElementById('version');

summariseBtn.addEventListener('click', () => {
  const text = chatInput.value.trim();
  if (!text) {
    result.textContent = 'Please paste chat text to summarise.';
    result.classList.add('warning');
    return;
  }

  const lines = text.split('\n').filter(line => line.trim() !== '');
  const summary = lines.slice(0, 5).join('\n');
  result.textContent = `Preview summary:\n${summary}`;
  result.classList.remove('warning');
});

chrome.runtime.sendMessage({type: 'getVersion'}, response => {
  if (response?.version) {
    versionLabel.textContent = `Version ${response.version}`;
  }
});
