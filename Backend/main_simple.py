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
    structured_analysis: Dict[str, str]  # New structured format

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

def build_structured_analysis(content: str) -> Dict[str, str]:
    """Build structured analysis in user-friendly format"""
    content_lower = content.lower()
    
    # Extract key information for each section
    structured = {
        "summary": "This website's terms outline the basic service agreement and user responsibilities.",
        "key_points": extract_key_points_text(content),
        "data_collected": extract_data_collection_info(content_lower),
        "data_usage": extract_data_usage_info(content_lower),
        "data_sharing": extract_data_sharing_info(content_lower),
        "user_rights": extract_user_rights_info(content_lower),
        "company_rights": extract_company_rights_info(content_lower),
        "termination": extract_termination_info(content_lower),
        "liability": extract_liability_info(content_lower),
        "dispute_resolution": extract_dispute_resolution_info(content_lower),
        "cookies_tracking": extract_cookies_info(content_lower),
        "privacy_protection": extract_privacy_protection_info(content_lower)
    }
    
    return structured

def extract_key_points_text(content: str) -> str:
    """Extract key points as readable text"""
    key_points = extract_key_points(content)
    if key_points:
        return "• " + " • ".join(key_points[:3])  # Top 3 points
    return "Key terms include service usage guidelines, user responsibilities, and data handling practices."

def extract_data_collection_info(content_lower: str) -> str:
    """Extract data collection information"""
    if any(term in content_lower for term in ["personal information", "user data", "collect data"]):
        if "email" in content_lower and "name" in content_lower:
            return "Collects personal information including name, email address, and contact details."
        elif "email" in content_lower:
            return "Collects email addresses and basic contact information."
        else:
            return "Collects personal information as specified in their privacy policy."
    return "Data collection practices are outlined in their privacy policy."

def extract_data_usage_info(content_lower: str) -> str:
    """Extract data usage information"""
    if "marketing" in content_lower and "advertising" in content_lower:
        return "Uses collected data for marketing, advertising, and service improvement."
    elif "marketing" in content_lower:
        return "Uses data for marketing purposes and service enhancement."
    elif "service" in content_lower and "improve" in content_lower:
        return "Uses data to improve services and user experience."
    return "Uses collected data to provide and improve services."

def extract_data_sharing_info(content_lower: str) -> str:
    """Extract data sharing information"""
    if "third party" in content_lower or "third-party" in content_lower:
        if "partner" in content_lower:
            return "Shares data with third-party partners and service providers."
        else:
            return "May share data with third parties as outlined in their privacy policy."
    elif "share" in content_lower and "data" in content_lower:
        return "Has provisions for sharing user data under certain circumstances."
    return "Data sharing practices are detailed in their privacy policy."

def extract_user_rights_info(content_lower: str) -> str:
    """Extract user rights information"""
    if "delete" in content_lower and "account" in content_lower:
        return "Users can delete their accounts and request data removal."
    elif "opt out" in content_lower or "unsubscribe" in content_lower:
        return "Users have rights to opt out of certain data uses and communications."
    elif "access" in content_lower and "data" in content_lower:
        return "Users have rights to access and control their personal data."
    return "User rights are outlined in accordance with applicable privacy laws."

def extract_company_rights_info(content_lower: str) -> str:
    """Extract company rights information"""
    if "terminate" in content_lower and "account" in content_lower:
        return "Company reserves the right to terminate accounts for policy violations."
    elif "suspend" in content_lower:
        return "Company can suspend or restrict access to services."
    elif "modify" in content_lower and "terms" in content_lower:
        return "Company can modify terms and conditions with notice to users."
    return "Company reserves standard rights to manage the service and user accounts."

def extract_termination_info(content_lower: str) -> str:
    """Extract termination information"""
    if "cancel" in content_lower and "any time" in content_lower:
        return "Users can cancel their accounts at any time."
    elif "terminate" in content_lower:
        return "Either party can terminate the agreement under specified conditions."
    return "Termination policies are outlined in the terms and conditions."

def extract_liability_info(content_lower: str) -> str:
    """Extract liability information"""
    if "not responsible" in content_lower or "not liable" in content_lower:
        return "Company limits liability for damages and service interruptions."
    elif "disclaimer" in content_lower:
        return "Service is provided 'as is' with standard disclaimers."
    return "Liability limitations are specified in accordance with applicable law."

def extract_dispute_resolution_info(content_lower: str) -> str:
    """Extract dispute resolution information"""
    if "arbitration" in content_lower:
        return "Disputes are resolved through binding arbitration."
    elif "court" in content_lower and "jurisdiction" in content_lower:
        return "Disputes are resolved in specified courts and jurisdictions."
    return "Dispute resolution procedures are outlined in the terms."

def extract_cookies_info(content_lower: str) -> str:
    """Extract cookies and tracking information"""
    if "cookies" in content_lower and "tracking" in content_lower:
        return "Uses cookies and tracking technologies for analytics and personalization."
    elif "cookies" in content_lower:
        return "Uses cookies to enhance user experience and analyze site usage."
    return "Cookie usage is detailed in their privacy policy."

def extract_privacy_protection_info(content_lower: str) -> str:
    """Extract privacy protection information"""
    if "gdpr" in content_lower or "ccpa" in content_lower:
        return "Complies with GDPR, CCPA, and other privacy regulations."
    elif "privacy" in content_lower and "protect" in content_lower:
        return "Implements measures to protect user privacy and data security."
    return "Privacy protection measures are outlined in their privacy policy."

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
        
        # Create summary with structured analysis
        summary_data = Summary(
            executive_summary=create_summary(content),
            key_points=key_points,
            important_clauses=important_clauses,
            categories=categories,
            word_count=word_count,
            estimated_reading_time=reading_time,
            readability_score=readability,
            structured_analysis=build_structured_analysis(content)
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