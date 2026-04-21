# WhatsApp Chat Summarizer Server

A FastAPI-based server that summarizes WhatsApp group chat messages using Ollama LLM models.

## Features

- Accepts a list of chat messages via REST API
- Generates concise summaries of conversations
- Extracts important topics like deadlines, dates, and key decisions
- CORS enabled for Chrome extension integration
- Production-ready with logging and error handling

## Prerequisites

- Python 3.8+
- Ollama installed and running locally
- A suitable LLM model (e.g., llama3) pulled in Ollama

## Installation

1. Clone the repository and navigate to the server directory:
   ```bash
   cd server
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Install and start Ollama:
   - Download and install Ollama from [ollama.ai](https://ollama.ai)
   - Pull the required model:
     ```bash
     ollama pull llama3
     ```
   - Start Ollama service (it runs on localhost:11434 by default)

## Running the Server

Start the FastAPI server:
```bash
python main.py
```

The server will start on `http://localhost:8000`

## API Usage

### POST /summarize

Summarizes a list of chat messages.

**Request Body:**
```json
{
  "messages": [
    {
      "text": "Hey everyone, the project deadline is next Friday!",
      "sender": "Alice",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "text": "Okay, I'll make sure to finish my part by then.",
      "sender": "Bob",
      "timestamp": "2024-01-15T10:32:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "summary": "The group discussed the upcoming project deadline set for next Friday, with Bob confirming he will complete his part on time.",
  "important_topics": [
    "Project deadline: next Friday"
  ]
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy"
}
```

## Configuration

- **OLLAMA_URL**: Default is `http://localhost:11434/api/generate`. Change if Ollama is running on a different host/port.
- **MODEL**: Default is `llama3`. Change to your preferred Ollama model.
- **CORS**: Currently allows all origins. In production, restrict to your Chrome extension's origin.

## Production Deployment

For production deployment:

1. Use a production ASGI server like Gunicorn with Uvicorn workers:
   ```bash
   pip install gunicorn
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

2. Set environment variables for configuration
3. Add authentication/API keys for security
4. Use a reverse proxy like Nginx
5. Enable HTTPS
6. Monitor logs and performance

## Troubleshooting

- **Ollama connection issues**: Ensure Ollama is running and accessible at localhost:11434
- **Model not found**: Run `ollama pull llama3` to download the model
- **CORS errors**: Check the Chrome extension's origin is allowed
- **Timeout errors**: Increase the timeout in the httpx client if needed

## License

[Add your license here]