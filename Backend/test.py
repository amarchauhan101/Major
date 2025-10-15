# ============================================================
# 🧠 Lightweight NLP Backend: BERT + Sentiment + Summarizer + Risk Analyzer
# ============================================================
# 🚀 Requirements:
# pip install transformers torch fastapi uvicorn beautifulsoup4 requests nltk
# Run server:
#     uvicorn main:app --reload
# ============================================================

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import (
    BertTokenizer, BertModel,
    AutoTokenizer, AutoModelForSeq2SeqLM,
    AutoModelForSequenceClassification, pipeline
)
from bs4 import BeautifulSoup
import requests
import re
import nltk
import os

# Download tokenizer for sentence splitting
nltk.download('punkt', quiet=True)
from nltk.tokenize import sent_tokenize


# ============================================================
# 🧩 PART 1 — BERT Model Example
# ============================================================

print("🔹 Running BERT model test...")

tokenizer_bert = BertTokenizer.from_pretrained("bert-base-uncased")
model_bert = BertModel.from_pretrained("bert-base-uncased")

text = "Hugging Face makes using transformers easy!"
inputs = tokenizer_bert(text, return_tensors="pt")
outputs = model_bert(**inputs)
print("✅ BERT last hidden states shape:", outputs.last_hidden_state.shape)


# ============================================================
# 🧩 PART 2 — Sentiment Analysis Example
# ============================================================

print("🔹 Running Sentiment Analysis test...")
sentiment_pipeline = pipeline("sentiment-analysis")
result = sentiment_pipeline("I love using Hugging Face, it's awesome!")
print("✅ Sentiment Result:", result)


# ============================================================
# 🧩 PART 3 — T&C Summarizer + Risk Analyzer API
# ============================================================

os.makedirs("./models/summarizer", exist_ok=True)
os.makedirs("./models/risk_analyzer", exist_ok=True)

def ensure_models():
    """Download smaller, optimized models."""
    if not os.path.exists("./models/summarizer/pytorch_model.bin"):
        print("⬇️ Downloading lightweight summarization model (DistilBART)...")
        summ_model = AutoModelForSeq2SeqLM.from_pretrained("sshleifer/distilbart-cnn-12-6")
        summ_tokenizer = AutoTokenizer.from_pretrained("sshleifer/distilbart-cnn-12-6")
        summ_model.save_pretrained("./models/summarizer")
        summ_tokenizer.save_pretrained("./models/summarizer")

    if not os.path.exists("./models/risk_analyzer/pytorch_model.bin"):
        print("⬇️ Downloading lightweight risk analyzer model (DistilBART-MNLI)...")
        risk_model = AutoModelForSequenceClassification.from_pretrained("valhalla/distilbart-mnli-12-1")
        risk_tokenizer = AutoTokenizer.from_pretrained("valhalla/distilbart-mnli-12-1")
        risk_model.save_pretrained("./models/risk_analyzer")
        risk_tokenizer.save_pretrained("./models/risk_analyzer")

    print("✅ Lightweight models ready (stored locally in ./models)")

ensure_models()


# ============================================================
# 🚀 Initialize FastAPI App and Load Pipelines
# ============================================================

app = FastAPI(title="🧠 Lightweight T&C Summarizer + Risk Analyzer API")

print("🔹 Loading local summarizer and risk analyzer pipelines...")
summarizer = pipeline("summarization", model="./models/summarizer", tokenizer="./models/summarizer", device=-1)
classifier = pipeline("zero-shot-classification", model="./models/risk_analyzer", tokenizer="./models/risk_analyzer", device=-1)
print("✅ Models loaded successfully!\n")


# ============================================================
# 🧰 Utility Functions
# ============================================================

def extract_text_from_url(url):
    """Extract visible text content from a webpage."""
    try:
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, "html.parser")
        for tag in soup(["script", "style", "noscript", "iframe"]):
            tag.extract()
        text = soup.get_text(separator="\n")
        text = re.sub(r'\n\s*\n+', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Unable to fetch or parse the URL: {e}")


def summarize_text(text):
    """Summarize long text in chunks."""
    sentences = sent_tokenize(text)
    chunks = [" ".join(sentences[i:i+10]) for i in range(0, len(sentences), 10)]
    summaries = []
    for chunk in chunks:
        try:
            out = summarizer(chunk, max_length=120, min_length=30, do_sample=False)
            summaries.append(out[0]['summary_text'])
        except Exception:
            summaries.append(" ".join(sentences[:3]))
    return " ".join(summaries)


def analyze_risk(text):
    """Perform risk analysis using zero-shot classification."""
    candidate_labels = [
        "privacy risk", "data sharing with third parties", "automatic renewal",
        "hidden fees", "difficult cancellation", "arbitration clause",
        "high liability", "low risk / consumer friendly"
    ]
    result = classifier(text, candidate_labels, multi_label=True)
    scores = dict(zip(result['labels'], result['scores']))

    risk_score = sum(s for l, s in scores.items() if l != "low risk / consumer friendly") * 12.5
    risk_score = min(round(risk_score, 2), 100)

    return {
        "label_scores": scores,
        "overall_risk": risk_score,
        "risk_level": (
            "HIGH" if risk_score >= 75 else
            "MEDIUM" if risk_score >= 40 else
            "LOW" if risk_score >= 15 else
            "VERY LOW"
        )
    }


# ============================================================
# 📡 API Endpoints
# ============================================================

class URLInput(BaseModel):
    url: str

class TextInput(BaseModel):
    text: str

@app.get("/")
def home():
    return {"message": "✅ Lightweight T&C Summarizer + Risk Analyzer API is running!"}

@app.post("/analyze_url")
async def analyze_url(data: URLInput):
    text = extract_text_from_url(data.url)
    summary = summarize_text(text)
    risk = analyze_risk(summary)
    return {"summary": summary, "risk_analysis": risk}

@app.post("/analyze_text")
async def analyze_text(data: TextInput):
    summary = summarize_text(data.text)
    risk = analyze_risk(summary)
    return {"summary": summary, "risk_analysis": risk}

# ============================================================
# ✅ End of File
# ============================================================
