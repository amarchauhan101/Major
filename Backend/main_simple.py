# ============================================================
# 🚀 Simplified FastAPI Backend for Terms Analysis
# ============================================================

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import re
import random
import time
from datetime import datetime

# Initialize FastAPI app
app = FastAPI(
    title="Terms & Conditions AI Analyzer API",
    description="Simplified API for analyzing Terms & Conditions",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# 📋 Request/Response Models
# ============================================================

class AnalysisRequest(BaseModel):
    content: str
    url: Optional[str] = None
    language: Optional[str] = "en"

class RiskAnalysis(BaseModel):
    overall_risk: float
    risk_level: str
    risk_factors: List[str]

class Summary(BaseModel):
    executive_summary: str
    key_points: List[str]
    important_clauses: List[Dict]
    categories: Dict[str, float]
    word_count: int
    estimated_reading_time: int
    readability_score: str

class AnalysisResponse(BaseModel):
    success: bool
    data: Optional[Dict] = None
    error: Optional[str] = None

# ============================================================
# 🔍 Analysis Functions
# ============================================================

def analyze_risk(content: str) -> RiskAnalysis:
    """Analyze risk level based on content patterns"""
    content_lower = content.lower()
    
    risk_factors = []
    risk_score = 0
    
    # Check for concerning patterns
    concerning_patterns = {
        "data sharing": ["share.*data", "third.*part", "partner.*data"],
        "binding arbitration": ["arbitration", "waive.*right.*sue", "class.*action"],
        "automatic renewal": ["auto.*renew", "automatic.*billing", "continue.*charge"],
        "termination rights": ["terminate.*account", "suspend.*access", "close.*account"],
        "liability limitation": ["limit.*liability", "not.*responsible", "maximum.*extent"],
        "data retention": ["retain.*data", "store.*information", "keep.*data"],
        "broad permissions": ["unlimited.*rights", "perpetual.*license", "irrevocable"],
        "vague language": ["may.*change", "at.*discretion", "from.*time.*time"]
    }
    
    for factor, patterns in concerning_patterns.items():
        for pattern in patterns:
            if re.search(pattern, content_lower):
                risk_factors.append(factor.replace("_", " ").title())
                risk_score += 10
                break
    
    # Determine risk level
    if risk_score >= 50:
        risk_level = "HIGH"
    elif risk_score >= 30:
        risk_level = "MEDIUM"
    elif risk_score >= 10:
        risk_level = "LOW"
    else:
        risk_level = "VERY LOW"
    
    return RiskAnalysis(
        overall_risk=min(risk_score, 90),
        risk_level=risk_level,
        risk_factors=risk_factors
    )

def categorize_content(content: str) -> Dict[str, float]:
    """Categorize content into different areas"""
    content_lower = content.lower()
    
    categories = {
        "privacy_data": 0,
        "payments_billing": 0,
        "user_obligations": 0,
        "company_rights": 0,
        "dispute_resolution": 0,
        "cookies_tracking": 0
    }
    
    # Privacy and Data
    privacy_terms = ["privacy", "data", "personal", "information", "collect", "track", "cookie"]
    categories["privacy_data"] = sum(content_lower.count(term) for term in privacy_terms) * 5
    
    # Payments and Billing
    payment_terms = ["payment", "billing", "fee", "charge", "refund", "subscription", "price"]
    categories["payments_billing"] = sum(content_lower.count(term) for term in payment_terms) * 8
    
    # User Obligations
    obligation_terms = ["shall", "must", "required", "prohibited", "restricted", "obligation"]
    categories["user_obligations"] = sum(content_lower.count(term) for term in obligation_terms) * 6
    
    # Company Rights
    rights_terms = ["right", "license", "grant", "authorize", "permit", "reserve"]
    categories["company_rights"] = sum(content_lower.count(term) for term in rights_terms) * 4
    
    # Dispute Resolution
    dispute_terms = ["dispute", "arbitration", "court", "jurisdiction", "governing", "lawsuit"]
    categories["dispute_resolution"] = sum(content_lower.count(term) for term in dispute_terms) * 10
    
    # Cookies and Tracking
    cookie_terms = ["cookie", "tracking", "analytics", "advertising", "pixel", "beacon"]
    categories["cookies_tracking"] = sum(content_lower.count(term) for term in cookie_terms) * 7
    
    # Normalize to percentages
    max_value = max(categories.values()) if max(categories.values()) > 0 else 1
    for key in categories:
        categories[key] = min((categories[key] / max_value) * 100, 100)
    
    return categories

def extract_key_points(content: str) -> List[str]:
    """Extract key points from content"""
    sentences = re.split(r'[.!?]+', content)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 50]
    
    # Score sentences based on importance indicators
    important_words = [
        "important", "notice", "required", "must", "shall", "prohibited", 
        "liability", "responsible", "terminate", "suspend", "refund", 
        "privacy", "data", "collect", "share", "track", "arbitration"
    ]
    
    scored_sentences = []
    for sentence in sentences[:20]:  # Limit to first 20 sentences
        score = sum(sentence.lower().count(word) for word in important_words)
        if score > 0:
            scored_sentences.append((score, sentence))
    
    # Sort by score and return top 5
    scored_sentences.sort(reverse=True, key=lambda x: x[0])
    return [sentence for _, sentence in scored_sentences[:5]]

def identify_important_clauses(content: str) -> List[Dict]:
    """Identify concerning clauses"""
    clauses = []
    
    # Pattern matching for concerning clauses
    clause_patterns = [
        {
            "type": "Data Sharing",
            "pattern": r"[^.]*share.*data.*third.*part[^.]*\.",
            "concern_level": "high"
        },
        {
            "type": "Arbitration",
            "pattern": r"[^.]*arbitration.*binding[^.]*\.",
            "concern_level": "high"
        },
        {
            "type": "Automatic Renewal",
            "pattern": r"[^.]*automatic.*renew[^.]*\.",
            "concern_level": "medium"
        },
        {
            "type": "Termination Rights",
            "pattern": r"[^.]*terminate.*account.*any.*time[^.]*\.",
            "concern_level": "medium"
        },
        {
            "type": "Liability Limitation",
            "pattern": r"[^.]*not.*responsible.*damages[^.]*\.",
            "concern_level": "medium"
        }
    ]
    
    for pattern_info in clause_patterns:
        matches = re.findall(pattern_info["pattern"], content, re.IGNORECASE)
        for match in matches[:2]:  # Limit to 2 per type
            clauses.append({
                "type": pattern_info["type"],
                "clause": match.strip(),
                "concern_level": pattern_info["concern_level"]
            })
    
    return clauses

def create_summary(content: str) -> str:
    """Create executive summary"""
    word_count = len(content.split())
    
    if word_count > 1000:
        summary = "This is a comprehensive terms and conditions document that covers multiple aspects of service usage. "
    else:
        summary = "This is a standard terms and conditions document that outlines basic service terms. "
    
    # Add specific observations
    content_lower = content.lower()
    
    if "data" in content_lower and "collect" in content_lower:
        summary += "The document includes data collection and privacy provisions. "
    
    if "payment" in content_lower or "billing" in content_lower:
        summary += "Payment and billing terms are specified. "
    
    if "arbitration" in content_lower:
        summary += "Dispute resolution is handled through arbitration. "
    
    if "terminate" in content_lower:
        summary += "The service provider reserves termination rights. "
    
    summary += "Users should review these terms carefully before accepting."
    
    return summary

def calculate_readability(content: str) -> str:
    """Simple readability assessment"""
    words = content.split()
    sentences = re.split(r'[.!?]+', content)
    
    if len(sentences) == 0:
        return "Unknown"
    
    avg_words_per_sentence = len(words) / len(sentences)
    
    if avg_words_per_sentence > 25:
        return "Difficult"
    elif avg_words_per_sentence > 15:
        return "Moderate"
    else:
        return "Easy"

def translate_content(content: str, target_language: str) -> str:
    """Simple translation simulation (in real implementation, use Google Translate API)"""
    if target_language == "en":
        return content
    
    # For demo purposes, just add a translation note
    return f"[Content translated to {target_language}] {content[:200]}..."

# ============================================================
# 🛠️ API Endpoints
# ============================================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Terms & Conditions AI Analyzer API",
        "status": "active",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check for extension"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_terms(request: AnalysisRequest):
    """Analyze Terms & Conditions content"""
    try:
        print(f"🔍 Analyzing content (length: {len(request.content)} chars)")
        
        # Validate input
        if not request.content or len(request.content.strip()) < 100:
            raise HTTPException(
                status_code=400, 
                detail="Content too short. Please provide substantial Terms & Conditions text."
            )
        
        # Add small delay to simulate processing
        time.sleep(0.5)
        
        # Translate if needed (simplified for demo)
        content = request.content
        if request.language and request.language != "en":
            print(f"🌍 Translating to {request.language}")
        
        # Perform analysis
        risk_analysis = analyze_risk(content)
        categories = categorize_content(content)
        key_points = extract_key_points(content)
        important_clauses = identify_important_clauses(content)
        
        # Calculate metadata
        word_count = len(content.split())
        reading_time = max(1, word_count // 200)  # Assume 200 words per minute
        readability = calculate_readability(content)
        
        # Create summary
        summary_data = Summary(
            executive_summary=create_summary(content),
            key_points=key_points,
            important_clauses=important_clauses,
            categories=categories,
            word_count=word_count,
            estimated_reading_time=reading_time,
            readability_score=readability
        )
        
        response_data = {
            "analysis_id": f"analysis_{int(time.time())}",
            "timestamp": datetime.now().isoformat(),
            "risk_analysis": risk_analysis.dict(),
            "summary": summary_data.dict(),
            "language": request.language,
            "url": request.url
        }
        
        print("✅ Analysis completed successfully")
        return AnalysisResponse(success=True, data=response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"💥 Analysis error: {str(e)}")
        return AnalysisResponse(
            success=False, 
            error=f"Analysis failed: {str(e)}"
        )

# ============================================================
# 🚀 Server Startup
# ============================================================

if __name__ == "__main__":
    print("🚀 Starting Terms & Conditions AI Analyzer API...")
    print("📡 Server will be available at: http://localhost:8000")
    print("📖 API documentation: http://localhost:8000/docs")
    print("💡 Press Ctrl+C to stop the server")
    
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        reload=False,
        log_level="info"
    )