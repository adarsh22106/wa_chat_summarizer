# WhatsApp Chat Summarizer

A productivity focused Chrome extension that enhances WhatsApp Web by delivering fast, concise summaries of group chats. Powered by local LLMs via Ollama, it processes conversations entirely on your device ensuring complete data privacy. Designed for users in high-traffic WhatsApp groups, the extension highlights key discussions, important dates, and deadlines so you can stay informed without scrolling through endless messages.

## Features

- **Full Chat Summary** - Summarize entire group conversation
- **Last X Messages** - Summarize recent messages (configurable count)
- **Time-based Summary** - Summarize messages within a specific time range
- **Privacy-First** - All processing happens locally via Ollama (no cloud API)

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER (Chrome)                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                     WhatsApp Web (web.whatsapp.com)            │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │  Chat Window (DOM)                                       │ │ │
│  │  │  - Messages with sender, text, timestamp                │ │ │
│  │  │  - Message Container Class: x9f619 x1hx0egp ...         │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  │                           ↓                                    │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │  Chrome Extension (Manifest v3)                         │ │ │
│  │  │  ┌────────────────────────────────────────────────────┐ │ │ │
│  │  │  │ Content Script (content.js)                        │ │ │ │
│  │  │  │ - DOM scraper for WhatsApp messages               │ │ │ │
│  │  │  │ - Extracts: sender, message, timestamp            │ │ │ │
│  │  │  │ - Handles lazy loading & auto-scroll              │ │ │ │
│  │  │  └────────────────────────────────────────────────────┘ │ │ │
│  │  │           ↓                                              │ │ │
│  │  │  ┌────────────────────────────────────────────────────┐ │ │ │
│  │  │  │ Background Service Worker (background.js)          │ │ │ │
│  │  │  │ - Message router                                   │ │ │ │
│  │  │  │ - Handles communication with server                │ │ │ │
│  │  │  └────────────────────────────────────────────────────┘ │ │ │
│  │  │           ↓                                              │ │ │
│  │  │  ┌────────────────────────────────────────────────────┐ │ │ │
│  │  │  │ UI Panel (panel.js + panel.css)                    │ │ │ │
│  │  │  │ - Right-side injected panel (Shadow DOM)           │ │ │ │
│  │  │  │ - Summarize Chat button                            │ │ │ │
│  │  │  │ - Last X Messages + Time Range options             │ │ │ │
│  │  │  │ - Displays summary & key topics                    │ │ │ │
│  │  │  └────────────────────────────────────────────────────┘ │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
              ↓ (HTTP API Request - JSON)
┌─────────────────────────────────────────────────────────────────────┐
│                    Backend Server (localhost:8000)                   │
│                                                                      │
│  FastAPI Application (main.py)                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ POST /summarize                                                │ │
│  │ - Accepts: { messages: [{text, sender, timestamp}] }          │ │
│  │ - Returns: { summary: str, important_topics: [str] }          │ │
│  │                                                                │ │
│  │ CORS Middleware: Allow requests from Chrome extension         │ │
│  └────────────────────────────────────────────────────────────────┘ │
│              ↓ (Format chat + send to Ollama)                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Ollama Integration (localhost:11434/api/generate)              │ │
│  │ - Model: gemma4:e4b (or smollm:latest)                         │ │
│  │ - Processes chat text locally                                  │ │
│  │ - Generates summary & extracts key topics                      │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
              ↓ (Summary Response)
        [Display in Extension Panel]
```

### Component Breakdown

#### 1. **Chrome Extension** (Manifest v3)
- **content.js**: Injects scripts into WhatsApp Web, extracts chat messages from DOM, handles dynamic message loading
- **background.js**: Service worker that manages communication between content script and local server
- **panel.js + panel.css**: UI panel injected on the right side of WhatsApp Web with summarization options
- **popup.html**: Extension popup (if needed for settings)
- **manifest.json**: Declares permissions, host permissions for WhatsApp Web, content scripts, and background worker

#### 2. **FastAPI Backend Server** (main.py)
- Receives POST requests from the extension with extracted messages
- Formats chat messages into readable text
- Calls Ollama API for LLM-based summarization
- Returns structured response: `{ summary: string, important_topics: string[] }`
- CORS enabled for cross-origin requests from the extension
- Runs on `http://localhost:8000`

#### 3. **Ollama (Local LLM)**
- Runs on `http://localhost:11434`
- Handles all AI processing **locally** (no cloud, complete privacy)
- Current model: `gemma4:e4b` (or configurable to `smollm:latest`)
- Processes chat context and generates summaries

#### 4. **Model Training** (model/)
- `text_summarizer_training.ipynb`: Jupyter notebook for fine-tuning or experimenting with LLM models
- Can be used for custom model development

### Data Flow

1. **Extraction Phase**: User clicks "Summarize" → Extension's content script scrapes WhatsApp DOM for messages
2. **Formatting Phase**: Messages are structured as: `[timestamp] sender: message_text`
3. **Request Phase**: Extension sends `POST /summarize` with message array to backend
4. **Processing Phase**: Backend sends formatted chat to Ollama for summarization
5. **Response Phase**: Ollama generates summary and key topics, backend returns to extension
6. **Display Phase**: Extension displays summary and topics in the right-side panel

### Key Features

- **Privacy-First**: All processing happens locally via Ollama (no cloud API)
- **Real-time**: Extracts messages as they appear in the chat
- **Flexible**: Three summarization modes (full chat, last X messages, time range)
- **Shadow DOM**: UI panel isolated from WhatsApp styles to prevent conflicts
- **Lazy Loading**: Handles WhatsApp's dynamic message loading by auto-scrolling

---

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
├── model/              # ML/LLM training
│   └── text_summarizer_training.ipynb
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
