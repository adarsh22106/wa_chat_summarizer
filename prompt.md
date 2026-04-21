You are an expert Chrome Extension developer. Build a production-ready Chrome Extension (Manifest v3) that integrates with WhatsApp Web and provides chat summarization features.

## PROJECT GOAL

Create a Chrome extension that injects a custom UI panel into WhatsApp Web (right side of the screen) to allow users to:

* Summarize full group chats
* Summarize last X messages
* Summarize messages between timestamps

The extension should extract chat messages from the DOM, structure them cleanly, send them to an API, and display the response.

---

## CORE REQUIREMENTS

### 1. UI INJECTION (VERY IMPORTANT)

* Inject a fixed panel on the **right side of WhatsApp Web**
* Panel should look modern (dark theme, matching WhatsApp)
* Should NOT break existing layout
* Use Shadow DOM to avoid CSS conflicts

### Panel Features:

* Title: "Chat Summarizer"
* Buttons:

  * "Summarize Chat"
* Options (radio/select):

  * "Last X Messages"
  * "Time Range"
* Dynamic inputs:

  * If "Last X": input field for number (e.g., 50, 100)
  * If "Time Range": start date + end date picker
* Output section:

  * Summary
  * Key topics

---

### 2. DOM TARGETING (WHATSAPP WEB)
Note: The whole object is given in obj.html

Target message container using class:

```
x9f619 x1hx0egp x1yrsyyn xf159sx xwib8y2 x7coems
```

Each message block contains:

* Sender name
* Message text
* Timestamp (inside `data-pre-plain-text`)

Example structure:

* Sender: inside span with aria-label
* Message: inside span with `data-testid="selectable-text"`
* Timestamp: inside `data-pre-plain-text`

---

### 3. MESSAGE EXTRACTION LOGIC

Implement a robust scraper that:

* Iterates through all message nodes
* Extracts:

  * sender
  * messages
  * timestamp

### Output format:

```json
{
  "messages": [
    { "user": "Mariyam yaseen", "message": "cooling coil kitne ka aata h btana", "time": "3:34 PM", "date": "18 April 2026"}
  ]
}
```

---

### 4. SCROLLING + LAZY LOAD HANDLING

* WhatsApp loads messages dynamically
* Implement auto-scroll to load older messages

### Requirements:

* Scroll upwards programmatically
* Continue until:

  * X messages collected OR
  * Timestamp condition satisfied

### IMPORTANT:

* Always start from **bottom (latest messages)**

---

### 5. FILTERING LOGIC

#### Case 1: Last X Messages

* Collect last X messages from bottom

#### Case 2: Time Range

* Parse timestamp from `data-pre-plain-text`
* Filter messages between start and end date

---

### 6. STORAGE

* Store extracted messages in:

```js
chrome.storage.local
```

---

### 7. API INTEGRATION

Send POST request:

```json
{
  "messages": [...]
}
```

Receive:

```json
{
  "summary": "...",
  "topics": ["...", "..."]
}
```

---

### 8. DISPLAY RESULTS

Render inside panel:

* Summary (paragraph)
* Topics (bullet list)

---

## FILE STRUCTURE

```
/extension
  ├── manifest.json
  ├── background.js
  ├── content.js
  ├── panel.js
  ├── panel.css
  ├── popup.html (optional)
```

---

## TECHNICAL DETAILS

### Manifest v3

* permissions: activeTab, scripting, storage
* host_permissions: https://web.whatsapp.com/*

---

### Content Script Responsibilities

* Inject UI panel
* Extract messages
* Handle scrolling
* Communicate with background

---

### Background Script Responsibilities

* Handle API calls
* Return summary

---

### UI Behavior

* Smooth animations
* Loading spinner during processing
* Error handling

---

## EDGE CASES

* Messages like "ok", "hmm" → ignore
* Media messages → skip or mark

---

## PERFORMANCE

* Avoid blocking UI
* Use async/await
* Debounce scrolling

---

## SECURITY

* Do NOT send unnecessary personal data
* Only send message text + sender (name / number anyone)

---

## BONUS FEATURES (OPTIONAL, LEAVE THIS FOR PHASE 2)

* Highlight important messages in chat
* Export summary as PDF
* Toggle panel visibility
* Offline summarization support

---

## OUTPUT EXPECTATION

Generate full working code:

* manifest.json
* content.js (DOM + scraping + scroll)
* panel UI injection
* API call logic
* message parsing functions

Ensure clean, modular, production-level code with comments.
