# WhatsApp Chat Summarizer

A productivity focused Chrome extension that enhances WhatsApp Web by delivering fast, concise summaries of group chats. Powered by local LLMs via Ollama, it processes conversations entirely on your device ensuring complete data privacy. Designed for users in high-traffic WhatsApp groups, the extension highlights key discussions, important dates, and deadlines so you can stay informed without scrolling through endless messages.

## Features

- **Full Chat Summary** - Summarize entire group conversation
- **Last X Messages** - Summarize recent messages (configurable count)
- **Time-based Summary** - Summarize messages within a specific time range
- **Privacy-First** - All processing happens locally via Ollama (no cloud API)

## Project Structure

```
wa_chat_summariser/
├── extension/          # Chrome Extension (Manifest v3)
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── panel.js
│   ├── panel.css
│   └── popup.html
├── server/             # FastAPI backend
│   ├── main.py
│   ├── requirements.txt
│   └── README.md
└── README.md
```

---

## Setup Guide

### Prerequisites

- **Python 3.8+** - For the backend server
- **Chrome/Edge Browser** - To install the extension
- **Ollama** - Local LLM runtime ([ollama.ai](https://ollama.ai))

---

### Step 1: Set Up the Server

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate   # Windows
   # source venv/bin/activate  # macOS/Linux
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. **Install and start Ollama:**
   - Download from [ollama.ai](https://ollama.ai)
   - Pull a model:
     ```bash
     ollama pull llama3
     ```
   - Ollama runs on `localhost:11434` by default

5. Start the server:
   ```bash
   python main.py
   ```
   Server runs at `http://localhost:8000`

---

### Step 2: Load the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension/` folder from this project
5. The extension icon should appear in your toolbar

---

### Step 3: Use the Extension

1. Open [web.whatsapp.com](https://web.whatsapp.com) and log in
2. Open any group chat
3. Click on the Extension button for **"Chat Summarizer"** side panel.
4. Choose your summary option:
   - **Summarize Chat** - Entire conversation
   - **Last X Messages** - Recent N messages
   - **Time Range** - Messages between two timestamps
5. Click the button to generate summary
6. View the AI-generated summary in the panel
