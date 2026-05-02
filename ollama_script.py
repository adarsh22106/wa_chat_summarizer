from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="WhatsApp Chat Summarizer", version="1.0.0")

# Add CORS middleware for Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the extension's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    text: str
    sender: Optional[str] = None
    timestamp: Optional[str] = None

class SummaryRequest(BaseModel):
    messages: List[Message]

class SummaryResponse(BaseModel):
    summary: str
    important_topics: List[str]

OLLAMA_URL = "http://localhost:11434/api/generate"
# MODEL = "smollm:latest"
MODEL = "gemma4:e4b"

@app.post("/summarize", response_model=SummaryResponse)
async def summarize_chat(request: SummaryRequest):
    print(request)
    if not request.messages:
        raise HTTPException(status_code=400, detail="No messages provided")

    # Combine messages into a readable chat format
    chat_text = "\n".join([
        f"[{msg.timestamp or 'Unknown time'}] {msg.sender or 'Unknown'}: {msg.text}"
        for msg in request.messages
    ])

    # Craft a structured prompt for the LLM
    prompt = f"""
Analyze the following WhatsApp group chat conversation and provide a JSON response with exactly two fields:
- "summary": A concise summary of the overall conversation (2-3 sentences)
- "important_topics": A list of important topics discussed, such as deadlines, important dates, key decisions, action items, or critical information

Chat conversation:
{{chat_text}}

Respond ONLY with valid JSON. Do not include any other text. Return ONLY a valid JSON object in the following exact format:

Output format:
{{
  "summary": "summary of the chats",
  "important_topics": ["topic 1", "topic 2", ...]
}}

Requirements:
- The JSON must contain EXACTLY two fields: "summary" and "important_topics".
- "summary" must be 2–3 sentences.
- "important_topics" must be an array of strings (no objects, no extra structure).
- Do NOT add any extra keys.
- Do NOT include explanations, text, or formatting outside the JSON.
- Do NOT wrap the JSON in code blocks.
"""

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                OLLAMA_URL,
                json={
                    "model": MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,  # Low temperature for consistent output
                        "num_predict": 500   # Limit response length
                    }
                }
            )

            if response.status_code != 200:
                logger.error(f"Ollama API error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=503, detail="LLM service unavailable")

            result = response.json()
            generated_text = result.get("response", "").strip()

            # Parse the JSON response
            try:
                data = json.loads(generated_text)
                summary = data.get("summary", "Unable to generate summary")
                important_topics = data.get("important_topics", [])
                if not isinstance(important_topics, list):
                    important_topics = []
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse LLM response as JSON: {generated_text}")
                summary = generated_text
                important_topics =  []

    except httpx.RequestError as e:
        logger.error(f"Request to Ollama failed: {e}")
        raise HTTPException(status_code=503, detail="LLM service unavailable")

    return SummaryResponse(summary=summary, important_topics=important_topics)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)