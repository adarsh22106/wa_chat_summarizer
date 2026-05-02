import json
from pathlib import Path

import torch
import torch.nn as nn
from transformers import BertTokenizer, BertModel


class SummarizationModel(nn.Module):
    def __init__(self, encoder: nn.Module, vocab_size: int):
        super().__init__()
        self.encoder = encoder
        self.decoder = nn.LSTM(vocab_size, 768, batch_first=True)
        self.fc = nn.Linear(768, vocab_size)

    def forward(self, input_ids, attention_mask, labels=None):
        encoder_outputs = self.encoder(input_ids=input_ids, attention_mask=attention_mask)
        encoder_hidden = encoder_outputs.last_hidden_state
        decoder_output, _ = self.decoder(encoder_hidden)
        logits = self.fc(decoder_output)

        if labels is not None:
            loss = nn.CrossEntropyLoss()(logits.view(-1, logits.size(-1)), labels.view(-1))
            return loss

        return logits


def load_checkpoint(model_path: Path, device: torch.device):
    checkpoint = torch.load(model_path, map_location=device)

    tokenizer = checkpoint.get("tokenizer")
    if tokenizer is None:
        tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")

    vocab_size = checkpoint.get("vocab_size")
    if vocab_size is None:
        raise ValueError("Saved checkpoint does not contain vocab_size.")

    encoder = BertModel.from_pretrained("bert-base-uncased")
    model = SummarizationModel(encoder=encoder, vocab_size=vocab_size)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()

    return model, tokenizer


def summarize(text: str, model: SummarizationModel, tokenizer: BertTokenizer, device: torch.device):
    inputs = tokenizer(
        text,
        return_tensors="pt",
        max_length=128,
        truncation=True,
        padding="max_length",
    )

    input_ids = inputs["input_ids"].to(device)
    attention_mask = inputs["attention_mask"].to(device)

    with torch.no_grad():
        logits = model(input_ids=input_ids, attention_mask=attention_mask)
        predicted_ids = torch.argmax(logits, dim=-1)
        summary = tokenizer.decode(predicted_ids[0], skip_special_tokens=True, clean_up_tokenization_spaces=True)

    return summary.strip()


def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model_path = Path(__file__).resolve().parent.parent / "model" / "model" / "summarizer_model.pt"

    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")

    model, tokenizer = load_checkpoint(model_path, device)

    sample_text = (
        "The quarterly sales meeting has been moved from Wednesday to Friday at 2 PM in the main conference room. "
        "Please prepare the budget report and presentation slides before Thursday."
    )

    summary = summarize(sample_text, model, tokenizer, device)
    print("Sample text:")
    print(sample_text)
    print("\nGenerated summary:")
    print(summary)


if __name__ == "__main__":
    main()
