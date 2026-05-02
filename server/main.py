from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import logging
import os
from groq import Groq
import os
from dotenv import load_dotenv
# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="WhatsApp Chat Summarizer", version="1.0.0")

# Add CORS middleware for Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
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

# Configure Groq API
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable not set.")

client = Groq(api_key=GROQ_API_KEY)
MODEL = "llama-3.3-70b-versatile" # You can also use "mixtral-8x7b-32768"

@app.post("/summarize", response_model=SummaryResponse)
async def summarize_chat(request: SummaryRequest):
    if not request.messages:
        raise HTTPException(status_code=400, detail="No messages provided")

    # Combine messages into a readable chat format
    chat_text = "\n".join([
        f"[{msg.timestamp or 'Unknown time'}] {msg.sender or 'Unknown'}: {msg.text}"
        for msg in request.messages
    ])

    # Craft a structured prompt
    prompt = f"""Analyze the following WhatsApp group chat conversation and provide a JSON response with exactly two fields:
- "summary": A concise summary of the overall conversation (2-3 sentences)
- "important_topics": A list of important topics discussed, such as deadlines, key decisions, or critical information

Chat conversation:
{chat_text}

Respond ONLY with valid JSON. Do not include any other text or markdown blocks.

Output format:
{{
  "summary": "summary of the chats",
  "important_topics": ["topic 1", "topic 2", ...]
}}
"""

    try:
        # Use Groq API to generate summary
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that outputs only valid JSON.",
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model=MODEL,
            temperature=0.1,
            max_tokens=500,
            # Groq supports JSON mode specifically
            response_format={"type": "json_object"}
        )

        generated_text = chat_completion.choices[0].message.content.strip()
        logger.info(f"Groq API response: {generated_text}")

        # Parse the JSON response
        try:
            data = json.loads(generated_text)
            summary = data.get("summary", "Unable to generate summary")
            important_topics = data.get("important_topics", [])
            
            if not isinstance(important_topics, list):
                important_topics = []
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse Groq response as JSON: {generated_text}")
            summary = "Error parsing summary."
            important_topics = []

    except Exception as e:
        logger.error(f"Request to Groq API failed: {e}")
        raise HTTPException(status_code=503, detail="LLM service unavailable")

    return SummaryResponse(summary=summary, important_topics=important_topics)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)