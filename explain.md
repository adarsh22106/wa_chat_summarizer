# How the Summarization Model Works

This explanation describes how the local summarization model in this project works from scratch.
It is based on the notebook `model/text_summarizer_training.ipynb` and the saved model file `model/model/summarizer_model.pt`.

## 1. Overview

The model is a simple encoder-decoder summarizer built with PyTorch and Transformers.
It uses:
- a pre-trained BERT encoder to convert input text into dense representations,
- an LSTM decoder to generate summary token logits,
- a linear layer to project decoder outputs back into token vocabulary space.

The process has two main phases:
1. training the model on sample text-summary pairs,'
2. using the trained model to infer/generate summaries.

## 2. Tokenization

The tokenizer used is `BertTokenizer.from_pretrained('bert-base-uncased')`.
Tokenization is important because the model works with integer token IDs, not raw text.

During training and inference:
- input text is converted to token IDs,
- the tokenizer produces `input_ids` and `attention_mask`,
- `input_ids` represent the words/subwords,
- `attention_mask` marks which tokens are real and which are padding.

## 3. Encoder: BERT

The encoder is a pre-trained BERT model (`BertModel`).
BERT takes the tokenized input and produces a sequence of hidden states.

In this project:
- `input_ids` and `attention_mask` are passed to the BERT encoder,
- the encoder returns `last_hidden_state`,
- this tensor has shape `[batch_size, sequence_length, hidden_size]`.

The encoder output is the contextual representation of each input token.

## 4. Decoder: LSTM

The decoder is a single-layer LSTM that receives the encoder hidden states as input.
This design is unusual compared to typical seq2seq models, but it works as an example:
- the decoder uses `vocab_size` as input feature size,
- it produces an output sequence of hidden states with shape `[batch_size, sequence_length, 768]`.

Because the decoder input is given `encoder_hidden`, the model learns a mapping from encoded input text to decoder hidden states.

## 5. Output Projection

After the decoder, a linear layer maps the decoder hidden state into vocabulary logits:
- `self.fc = nn.Linear(768, vocab_size)`
- this produces a tensor of shape `[batch_size, sequence_length, vocab_size]`
- each position now has a probability distribution over possible tokens

During training, the model compares these logits with the target summary tokens.

## 6. Training Objective

For training, the model calculates cross-entropy loss between predicted logits and actual summary token IDs:
- the target labels are the tokenized summary text,
- `nn.CrossEntropyLoss()` is applied to the flattened logits and labels,
- the model learns to assign higher probability to the correct summary tokens.

Training steps in the notebook:
- create a `SummarizationDataset` with source-summary pairs,
- use `DataLoader` with `batch_size=2`,
- use `AdamW` optimizer with learning rate `2e-5`,
- run for `10` epochs,
- perform forward pass, backward pass, and optimizer step.

## 7. Model Saving

After training, the notebook saves:
- `model_state_dict`: the learned weights of the model,
- `tokenizer`: the tokenizer object,
- `vocab_size`: the vocabulary size used for decoder input/output.

The file is saved as `model/summarizer_model.pt`.

## 8. Inference / Summary Generation

The inference process in the notebook is simplified and uses greedy decoding:
1. tokenize the input text with the same tokenizer,
2. run the BERT encoder on the tokenized input,
3. pass the encoder outputs through the decoder,
4. project decoder outputs to vocabulary logits,
5. choose the token with the highest logit at each position (`argmax`),
6. decode the predicted token IDs back to text.

The inference function looks like this:
- `inputs = tokenizer(text, return_tensors='pt', max_length=128, truncation=True)`
- `encoder_outputs = model.encoder(input_ids=input_ids, attention_mask=attention_mask)`
- `decoder_output, _ = model.decoder(encoder_outputs.last_hidden_state)`
- `logits = model.fc(decoder_output)`
- `predicted_ids = torch.argmax(logits, dim=-1)`
- `summary = tokenizer.decode(predicted_ids[0], skip_special_tokens=True)`

## 9. Important Notes

- This is a toy summarization architecture, not a production-grade seq2seq model.
- A more reliable approach would use a proper encoder-decoder transformer like T5, BART, or standard seq2seq training with teacher forcing.
- The current decoder is not trained with explicit teacher forcing or autoregressive generation, so it is primarily useful for sample or demonstration purposes.

## 10. Summary

From scratch, the summarization model works by:
- converting text into tokens,
- encoding text with BERT,
- decoding encoded representations with an LSTM,
- projecting outputs back to vocabulary space,
- training with cross-entropy loss against target summary tokens,
- generating text by choosing the highest-scoring token at each position.

This explains how the local sample model in this repo turns WhatsApp chat text into a short summary using a custom encoder-decoder pipeline.