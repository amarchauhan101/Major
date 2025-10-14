# ============================================================
# 🚀 FastAPI Backend for T&C Summarizer + Risk Analyzer
# (Using Local Models)
# ============================================================
# Run: uvicorn main:app --reload
# ============================================================

try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    from transformers import pipeline
    from bs4 import BeautifulSoup
    import requests
    import re
    import nltk
    import os
    from googletrans import Translator
    import json
    
    # Download NLTK punkt (for text splitting)
    nltk.download('punkt', quiet=True)
    from nltk.tokenize import sent_tokenize

    # Initialize translator
    translator = Translator()
    
    DEPENDENCIES_AVAILABLE = True
    print("✅ All dependencies loaded successfully")
    
except ImportError as e:
    print(f"⚠️ Some dependencies missing: {e}")
    print("🔄 Running in fallback mode...")
    DEPENDENCIES_AVAILABLE = False
    
    # Fallback imports
    import re
    import os
    import json
    
    # Mock classes for development
    class FastAPI:
        def __init__(self, **kwargs): pass
        def add_middleware(self, *args, **kwargs): pass
        def get(self, path): return lambda f: f
        def post(self, path): return lambda f: f
    
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
    
    class HTTPException(Exception):
        def __init__(self, status_code, detail):
            self.status_code = status_code
            self.detail = detail
    
    def sent_tokenize(text):
        return re.split(r'[.!?]+', text)
    
    translator = None

# ============================================================
# ✅ Load Local Models
# ============================================================

if not os.path.exists("./models/summarizer/pytorch_model.bin") or not os.path.exists("./models/risk_analyzer/pytorch_model.bin"):
    raise RuntimeError("❌ Models not found! Please run your model download script first.")

print("🔹 Loading summarizer and risk analyzer models from local storage...")
summarizer = pipeline("summarization", model="./models/summarizer", tokenizer="./models/summarizer")
classifier = pipeline("zero-shot-classification", model="./models/risk_analyzer", tokenizer="./models/risk_analyzer")
print("✅ Models loaded successfully!\n")

# ============================================================
# 🧰 Helper Functions
# ============================================================

def extract_text_from_url(url: str) -> str:
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
        raise HTTPException(status_code=400, detail=f"Unable to fetch or parse URL: {e}")

def count_tokens(text: str, tokenizer) -> int:
    """Count tokens in text using the model's tokenizer."""
    try:
        return len(tokenizer.encode(text, truncation=False))
    except Exception:
        # Fallback: rough approximation (1 token ≈ 0.75 words)
        return int(len(text.split()) * 1.33)

def create_safe_chunks(text: str, tokenizer, max_tokens: int = 512) -> list:
    """Create text chunks that respect token limits."""
    sentences = sent_tokenize(text)
    chunks = []
    current_chunk = []
    current_tokens = 0
    
    for sentence in sentences:
        sentence_tokens = count_tokens(sentence, tokenizer)
        
        # If single sentence is too long, split it further
        if sentence_tokens > max_tokens:
            # Split by words if sentence is too long
            words = sentence.split()
            word_chunk = []
            word_tokens = 0
            
            for word in words:
                word_token_count = count_tokens(word, tokenizer)
                if word_tokens + word_token_count > max_tokens and word_chunk:
                    chunks.append(" ".join(word_chunk))
                    word_chunk = [word]
                    word_tokens = word_token_count
                else:
                    word_chunk.append(word)
                    word_tokens += word_token_count
            
            if word_chunk:
                chunks.append(" ".join(word_chunk))
            continue
        
        # Check if adding this sentence exceeds token limit
        if current_tokens + sentence_tokens > max_tokens and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = [sentence]
            current_tokens = sentence_tokens
        else:
            current_chunk.append(sentence)
            current_tokens += sentence_tokens
    
    # Add remaining chunk
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    
    return chunks

def summarize_text(text: str) -> dict:
    """Summarize long text in chunks and create structured output."""
    try:
        # Create safe chunks that respect token limits
        chunks = create_safe_chunks(text, summarizer.tokenizer, max_tokens=512)
        summaries = []
        
        for chunk in chunks:
            try:
                # Double-check token count before processing
                token_count = count_tokens(chunk, summarizer.tokenizer)
                if token_count > 512:
                    print(f"Warning: Chunk still too long ({token_count} tokens), truncating...")
                    # Truncate the chunk to fit
                    words = chunk.split()
                    truncated_words = words[:int(len(words) * 0.7)]  # Take 70% of words as safety
                    chunk = " ".join(truncated_words)
                
                out = summarizer(chunk, max_length=150, min_length=40, do_sample=False, truncation=True)
                summaries.append(out[0]['summary_text'])
            except Exception as e:
                print(f"Summarization error for chunk: {e}")
                # Fallback to first few sentences of the chunk
                fallback_sentences = sent_tokenize(chunk)
                summaries.append(" ".join(fallback_sentences[:2]))
        
        full_summary = " ".join(summaries)
        
        # Create structured summary
        structured_summary = create_structured_summary(full_summary, text)
        
        return structured_summary
    
    except Exception as e:
        print(f"Critical error in summarize_text: {e}")
        # Return a basic fallback summary
        sentences = sent_tokenize(text)
        return {
            "executive_summary": " ".join(sentences[:3]),
            "key_points": ["Analysis temporarily unavailable"],
            "important_clauses": [],
            "categories": {},
            "readability_score": 50,
            "word_count": len(text.split()),
            "estimated_reading_time": max(1, len(text.split()) // 200)
        }

def create_structured_summary(summary: str, original_text: str) -> dict:
    """Create a comprehensive structured summary with enhanced categories."""
    
    # Extract key topics and create bullet points
    key_points = extract_key_points(summary)
    
    # Identify important clauses
    important_clauses = identify_important_clauses(original_text)
    
    # Create user-friendly categories
    categories = categorize_content(original_text)
    
    # Enhanced analysis categories
    enhanced_categories = analyze_comprehensive_categories(original_text)
    
    return {
        "executive_summary": summary[:200] + "..." if len(summary) > 200 else summary,
        "key_points": key_points,
        "important_clauses": important_clauses,
        "categories": categories,
        "enhanced_analysis": enhanced_categories,
        "readability_score": calculate_readability_score(summary),
        "word_count": len(original_text.split()),
        "estimated_reading_time": max(1, len(original_text.split()) // 200)  # minutes
    }

def extract_key_points(text: str) -> list:
    """Extract key points from summary text."""
    sentences = sent_tokenize(text)
    
    # Keywords that indicate important points
    important_keywords = [
        'personal data', 'privacy', 'cookies', 'third party', 'liability',
        'cancellation', 'refund', 'payment', 'subscription', 'automatic',
        'intellectual property', 'user content', 'termination', 'dispute'
    ]
    
    key_points = []
    for sentence in sentences[:6]:  # Limit to top 6 points
        if any(keyword in sentence.lower() for keyword in important_keywords):
            key_points.append(sentence.strip())
        elif len(sentence.split()) > 8:  # Substantive sentences
            key_points.append(sentence.strip())
    
    return key_points[:5]  # Return top 5 key points

def identify_important_clauses(text: str) -> list:
    """Identify potentially concerning clauses."""
    concerning_patterns = [
        r'(automatic renewal|auto-renewal|automatically renew)',
        r'(non-refundable|no refund|cannot be refunded)',
        r'(arbitration|binding arbitration|waive.*right.*jury)',
        r'(liable|liability|damages|loss)',
        r'(third party|third-party|share.*information)',
        r'(cookies|tracking|analytics|advertising)',
        r'(cancel|cancellation|terminate|termination)',
        r'(intellectual property|copyright|trademark)'
    ]
    
    important_clauses = []
    text_lower = text.lower()
    
    for pattern in concerning_patterns:
        matches = re.finditer(pattern, text_lower, re.IGNORECASE)
        for match in matches:
            # Extract surrounding context (±50 characters)
            start = max(0, match.start() - 50)
            end = min(len(text), match.end() + 50)
            context = text[start:end].strip()
            
            if context and len(context) > 20:
                important_clauses.append({
                    "clause": context,
                    "type": pattern.replace(r'(', '').replace(r')', '').replace('|', ' or '),
                    "concern_level": "high" if any(word in pattern for word in ['arbitration', 'non-refundable', 'liable']) else "medium"
                })
    
    return important_clauses[:4]  # Return top 4 concerning clauses

def analyze_comprehensive_categories(text: str) -> dict:
    """Analyze text for comprehensive T&C categories with detailed breakdown."""
    print(f"🔍 Starting comprehensive analysis for text length: {len(text)}")
    text_lower = text.lower()
    
    try:
        # Initialize all categories
        comprehensive_analysis = {
            "summary_key_points": extract_auto_summary_points(text),
            "data_collected": analyze_data_collection(text_lower),
            "data_usage": analyze_data_usage(text_lower),
            "data_sharing": analyze_data_sharing(text_lower),
            "user_rights": analyze_user_rights(text_lower),
            "liabilities": analyze_liabilities(text_lower),
            "automatic_renewals": analyze_automatic_renewals(text_lower),
            "termination_clauses": analyze_termination_clauses(text_lower),
            "risk_score_breakdown": calculate_detailed_risk_score(text_lower)
        }
        
        print(f"✅ Comprehensive analysis completed with {len(comprehensive_analysis)} categories")
        return comprehensive_analysis
    
    except Exception as e:
        print(f"⚠️ Error in comprehensive analysis: {e}")
        # Return fallback data
        return {
            "summary_key_points": {"main_purpose": "Analysis temporarily unavailable", "key_highlights": [], "document_type": "T&C"},
            "data_collected": {"types_collected": {}, "collection_methods": [], "opt_out_available": False},
            "data_usage": {"purposes": {}, "consent_required": False, "opt_out_mechanisms": []},
            "data_sharing": {"sharing_entities": {}, "user_control": False, "anonymization": False},
            "user_rights": {"available_rights": {}, "contact_method": [], "response_time": "Not specified"},
            "liabilities": {"liability_clauses": {}, "user_protection_level": "Unknown", "legal_jurisdiction": "Not specified"},
            "automatic_renewals": {"renewal_practices": {}, "cancellation_difficulty": "Unknown", "refund_policy": {"available": "unknown", "conditions": "Not specified"}},
            "termination_clauses": {"termination_rights": {}, "user_notice_period": "Not specified", "data_deletion_policy": {"automatic_deletion": False, "timeline": "Not specified"}},
            "risk_score_breakdown": {"category_scores": {"privacy_risk": 50, "financial_risk": 50, "control_risk": 50, "legal_risk": 50}, "overall_score": 50.0, "risk_level": "MEDIUM", "risk_color": "#f59e0b", "recommendations": ["Analysis temporarily unavailable"]}
        }

def extract_auto_summary_points(text: str) -> dict:
    """Generate 3-5 sentence auto-summary of the entire T&C."""
    sentences = sent_tokenize(text)
    
    # Find most important sentences based on key terms
    important_terms = ['privacy', 'data', 'personal', 'collect', 'use', 'share', 'rights', 'terminate', 'cancel', 'refund', 'liability', 'responsible']
    
    sentence_scores = []
    for i, sentence in enumerate(sentences):
        score = sum(1 for term in important_terms if term in sentence.lower())
        sentence_scores.append((score, i, sentence))
    
    # Get top 5 sentences
    top_sentences = sorted(sentence_scores, key=lambda x: x[0], reverse=True)[:5]
    top_sentences = sorted(top_sentences, key=lambda x: x[1])  # Maintain original order
    
    summary_points = [sentence[2].strip() for sentence in top_sentences if sentence[0] > 0]
    
    return {
        "main_purpose": " ".join(summary_points[:3]) if summary_points else "Terms and Conditions governing service usage.",
        "key_highlights": summary_points[3:] if len(summary_points) > 3 else [],
        "document_type": "Terms and Conditions"
    }

def analyze_data_collection(text: str) -> dict:
    """Analyze what data is collected."""
    data_types = {
        "email": r'(email|e-mail|mail address)',
        "location": r'(location|gps|geographic|geolocation)',
        "contacts": r'(contact|address book|phone book)',
        "device_info": r'(device|hardware|software|operating system|browser)',
        "usage_data": r'(usage|activity|behavior|interaction)',
        "cookies": r'(cookie|tracking|pixel|beacon)',
        "personal_info": r'(name|age|gender|birthday|personal information)',
        "financial": r'(payment|credit card|billing|financial)'
    }
    
    collected_data = {}
    for data_type, pattern in data_types.items():
        matches = re.findall(pattern, text, re.IGNORECASE)
        collected_data[data_type] = {
            "detected": len(matches) > 0,
            "frequency": len(matches),
            "examples": list(set(matches))[:3] if matches else []
        }
    
    return {
        "types_collected": collected_data,
        "collection_methods": find_collection_methods(text),
        "opt_out_available": "opt-out" in text or "opt out" in text
    }

def analyze_data_usage(text: str) -> dict:
    """Analyze how data is used."""
    usage_patterns = {
        "advertising": r'(advertis|marketing|promotional|ads)',
        "analytics": r'(analytic|analysis|tracking|statistics)',
        "personalization": r'(personaliz|customiz|tailor|recommend)',
        "service_improvement": r'(improve|enhance|develop|optimize)',
        "security": r'(security|fraud|protection|safety)',
        "legal_compliance": r'(legal|compliance|law|regulation)'
    }
    
    usage_purposes = {}
    for purpose, pattern in usage_patterns.items():
        matches = re.findall(pattern, text, re.IGNORECASE)
        usage_purposes[purpose] = {
            "mentioned": len(matches) > 0,
            "frequency": len(matches),
            "risk_level": get_usage_risk_level(purpose)
        }
    
    return {
        "purposes": usage_purposes,
        "consent_required": "consent" in text,
        "opt_out_mechanisms": find_opt_out_mechanisms(text)
    }

def analyze_data_sharing(text: str) -> dict:
    """Analyze data sharing practices."""
    sharing_patterns = {
        "third_parties": r'(third.?part|partner|vendor|contractor)',
        "affiliates": r'(affiliate|subsidiary|parent company)',
        "advertisers": r'(advertiser|ad network|marketing)',
        "government": r'(government|law enforcement|legal|court)',
        "merger_acquisition": r'(merger|acquisition|business transfer|sale)'
    }
    
    sharing_practices = {}
    for entity, pattern in sharing_patterns.items():
        matches = re.findall(pattern, text, re.IGNORECASE)
        sharing_practices[entity] = {
            "shares_with": len(matches) > 0,
            "frequency": len(matches),
            "risk_level": get_sharing_risk_level(entity)
        }
    
    return {
        "sharing_entities": sharing_practices,
        "user_control": "control" in text and "sharing" in text,
        "anonymization": "anonymous" in text or "anonymize" in text
    }

def analyze_user_rights(text: str) -> dict:
    """Analyze user rights and control options."""
    rights_patterns = {
        "delete_data": r'(delete|remove|erasure|right to be forgotten)',
        "export_data": r'(export|download|portability|copy)',
        "opt_out": r'(opt.?out|unsubscribe|withdraw)',
        "access_data": r'(access|view|see.*data)',
        "correct_data": r'(correct|update|modify|rectif)',
        "restrict_processing": r'(restrict|limit|object.*processing)'
    }
    
    user_rights = {}
    for right, pattern in rights_patterns.items():
        matches = re.findall(pattern, text, re.IGNORECASE)
        user_rights[right] = {
            "available": len(matches) > 0,
            "frequency": len(matches),
            "compliance_score": 10 if len(matches) > 0 else 0
        }
    
    return {
        "available_rights": user_rights,
        "contact_method": find_contact_methods(text),
        "response_time": find_response_timeframes(text)
    }

def analyze_liabilities(text: str) -> dict:
    """Analyze liability and responsibility clauses."""
    liability_patterns = {
        "not_responsible": r'(not responsible|not liable|disclaim)',
        "limitation_damages": r'(limit.*damage|limit.*liabilit)',
        "indemnification": r'(indemnif|hold harmless)',
        "warranty_disclaimer": r'(no warrant|disclaim.*warrant|as.?is)',
        "force_majeure": r'(force majeure|act of god|beyond.*control)'
    }
    
    liability_clauses = {}
    for clause_type, pattern in liability_patterns.items():
        matches = re.findall(pattern, text, re.IGNORECASE)
        liability_clauses[clause_type] = {
            "present": len(matches) > 0,
            "frequency": len(matches),
            "user_risk": get_liability_risk(clause_type)
        }
    
    return {
        "liability_clauses": liability_clauses,
        "user_protection_level": calculate_user_protection(liability_clauses),
        "legal_jurisdiction": find_legal_jurisdiction(text)
    }

def analyze_automatic_renewals(text: str) -> dict:
    """Analyze automatic renewal and subscription clauses."""
    renewal_patterns = {
        "auto_renewal": r'(auto.?renew|automatic.?renew|automatically renew)',
        "hidden_charges": r'(additional.*fee|extra.*charge|hidden.*cost)',
        "cancellation_deadline": r'(cancel.*before|notice.*period|deadline)',
        "renewal_terms": r'(renew.*term|subscription.*period)',
        "price_changes": r'(price.*change|rate.*change|fee.*increase)'
    }
    
    renewal_info = {}
    for aspect, pattern in renewal_patterns.items():
        matches = re.findall(pattern, text, re.IGNORECASE)
        renewal_info[aspect] = {
            "mentioned": len(matches) > 0,
            "frequency": len(matches),
            "financial_risk": get_financial_risk(aspect)
        }
    
    return {
        "renewal_practices": renewal_info,
        "cancellation_difficulty": assess_cancellation_difficulty(text),
        "refund_policy": analyze_refund_policy(text)
    }

def analyze_termination_clauses(text: str) -> dict:
    """Analyze termination and account closure clauses."""
    termination_patterns = {
        "immediate_termination": r'(immediate.?terminat|without notice)',
        "at_will_termination": r'(at will|any time|sole discretion)',
        "breach_termination": r'(breach|violation|non.?compliance)',
        "data_retention": r'(retain.*data|keep.*information)',
        "account_suspension": r'(suspend|disable|deactivate)'
    }
    
    termination_clauses = {}
    for clause_type, pattern in termination_patterns.items():
        matches = re.findall(pattern, text, re.IGNORECASE)
        termination_clauses[clause_type] = {
            "present": len(matches) > 0,
            "frequency": len(matches),
            "control_risk": get_control_risk(clause_type)
        }
    
    return {
        "termination_rights": termination_clauses,
        "user_notice_period": find_user_notice_requirements(text),
        "data_deletion_policy": analyze_data_deletion_policy(text)
    }

def calculate_detailed_risk_score(text: str) -> dict:
    """Calculate detailed risk score breakdown."""
    risk_categories = {
        "privacy_risk": calculate_privacy_risk(text),
        "financial_risk": calculate_financial_risk(text),
        "control_risk": calculate_control_risk(text),
        "legal_risk": calculate_legal_risk(text)
    }
    
    # Calculate overall risk
    total_risk = sum(risk_categories.values()) / len(risk_categories)
    
    # Risk level determination
    if total_risk >= 75:
        risk_level = "HIGH"
        risk_color = "#ef4444"
    elif total_risk >= 50:
        risk_level = "MEDIUM"
        risk_color = "#f59e0b"
    elif total_risk >= 25:
        risk_level = "LOW"
        risk_color = "#3b82f6"
    else:
        risk_level = "VERY LOW"
        risk_color = "#22c55e"
    
    return {
        "category_scores": risk_categories,
        "overall_score": round(total_risk, 1),
        "risk_level": risk_level,
        "risk_color": risk_color,
        "recommendations": generate_risk_recommendations(risk_categories)
    }

# Helper functions for analysis
def find_collection_methods(text: str) -> list:
    methods = []
    if "cookie" in text: methods.append("Cookies")
    if "form" in text: methods.append("Forms")
    if "automatic" in text: methods.append("Automatic")
    if "third party" in text: methods.append("Third Parties")
    return methods

def find_opt_out_mechanisms(text: str) -> list:
    mechanisms = []
    if "unsubscribe" in text: mechanisms.append("Unsubscribe")
    if "opt-out" in text or "opt out" in text: mechanisms.append("Opt-out")
    if "settings" in text: mechanisms.append("Account Settings")
    if "contact" in text: mechanisms.append("Contact Support")
    return mechanisms

def find_contact_methods(text: str) -> list:
    methods = []
    if re.search(r'email|e-mail', text): methods.append("Email")
    if "phone" in text: methods.append("Phone")
    if "mail" in text and "address" in text: methods.append("Mail")
    if "form" in text: methods.append("Online Form")
    return methods

def find_response_timeframes(text: str) -> str:
    timeframes = re.findall(r'(\d+)\s*(day|week|month|business day)', text, re.IGNORECASE)
    if timeframes:
        return f"{timeframes[0][0]} {timeframes[0][1]}s"
    return "Not specified"

def get_usage_risk_level(purpose: str) -> str:
    high_risk = ["advertising", "analytics"]
    medium_risk = ["personalization"]
    return "high" if purpose in high_risk else "medium" if purpose in medium_risk else "low"

def get_sharing_risk_level(entity: str) -> str:
    high_risk = ["third_parties", "advertisers"]
    medium_risk = ["affiliates", "government"]
    return "high" if entity in high_risk else "medium" if entity in medium_risk else "low"

def get_liability_risk(clause_type: str) -> str:
    high_risk = ["not_responsible", "limitation_damages", "warranty_disclaimer"]
    return "high" if clause_type in high_risk else "medium"

def get_financial_risk(aspect: str) -> str:
    high_risk = ["auto_renewal", "hidden_charges", "price_changes"]
    return "high" if aspect in high_risk else "medium"

def get_control_risk(clause_type: str) -> str:
    high_risk = ["immediate_termination", "at_will_termination"]
    return "high" if clause_type in high_risk else "medium"

def calculate_user_protection(liability_clauses: dict) -> str:
    protection_count = sum(1 for clause in liability_clauses.values() if not clause["present"])
    total_clauses = len(liability_clauses)
    protection_ratio = protection_count / total_clauses
    
    if protection_ratio >= 0.7: return "High"
    elif protection_ratio >= 0.4: return "Medium"
    else: return "Low"

def find_legal_jurisdiction(text: str) -> str:
    jurisdictions = re.findall(r'(law.*of|jurisdiction.*of|governed.*by).*?([A-Z][a-z]+)', text, re.IGNORECASE)
    return jurisdictions[0][1] if jurisdictions else "Not specified"

def assess_cancellation_difficulty(text: str) -> str:
    difficulty_indicators = ["difficult", "complex", "notice period", "penalty", "fee"]
    difficulty_count = sum(1 for indicator in difficulty_indicators if indicator in text.lower())
    
    if difficulty_count >= 3: return "High"
    elif difficulty_count >= 1: return "Medium"
    else: return "Low"

def analyze_refund_policy(text: str) -> dict:
    if "no refund" in text.lower() or "non-refundable" in text.lower():
        return {"available": False, "conditions": "No refunds"}
    elif "refund" in text.lower():
        return {"available": True, "conditions": "Conditional refunds"}
    else:
        return {"available": "unknown", "conditions": "Not specified"}

def find_user_notice_requirements(text: str) -> str:
    notice_patterns = re.findall(r'(\d+)\s*(day|week|month).*notice', text, re.IGNORECASE)
    return f"{notice_patterns[0][0]} {notice_patterns[0][1]}s" if notice_patterns else "Not specified"

def analyze_data_deletion_policy(text: str) -> dict:
    if "delete" in text.lower() and "data" in text.lower():
        return {"automatic_deletion": True, "timeline": "As specified"}
    else:
        return {"automatic_deletion": False, "timeline": "Not specified"}

def calculate_privacy_risk(text: str) -> float:
    risk_factors = ["share", "third party", "advertising", "tracking", "cookies"]
    risk_count = sum(text.count(factor) for factor in risk_factors)
    return min(100, risk_count * 5)

def calculate_financial_risk(text: str) -> float:
    risk_factors = ["auto-renew", "hidden", "fee", "penalty", "non-refundable"]
    risk_count = sum(text.count(factor) for factor in risk_factors)
    return min(100, risk_count * 8)

def calculate_control_risk(text: str) -> float:
    risk_factors = ["terminate", "suspend", "discretion", "without notice"]
    risk_count = sum(text.count(factor) for factor in risk_factors)
    return min(100, risk_count * 7)

def calculate_legal_risk(text: str) -> float:
    risk_factors = ["arbitration", "not liable", "disclaim", "waive"]
    risk_count = sum(text.count(factor) for factor in risk_factors)
    return min(100, risk_count * 10)

def generate_risk_recommendations(risk_categories: dict) -> list:
    recommendations = []
    
    if risk_categories.get("privacy_risk", 0) > 50:
        recommendations.append("Review data sharing practices carefully")
    if risk_categories.get("financial_risk", 0) > 50:
        recommendations.append("Check cancellation and refund policies")
    if risk_categories.get("control_risk", 0) > 50:
        recommendations.append("Understand termination conditions")
    if risk_categories.get("legal_risk", 0) > 50:
        recommendations.append("Consider legal implications carefully")
    
    return recommendations or ["Generally acceptable terms"]

def categorize_content(text: str) -> dict:
    """Categorize the content into different sections."""
    text_lower = text.lower()
    
    categories = {
        "privacy_data": 0,
        "payments_billing": 0,
        "user_obligations": 0,
        "company_rights": 0,
        "dispute_resolution": 0,
        "cookies_tracking": 0
    }
    
    # Count occurrences of category-related terms
    category_keywords = {
        "privacy_data": ['personal data', 'privacy', 'information', 'data collection', 'personal information'],
        "payments_billing": ['payment', 'billing', 'subscription', 'fee', 'refund', 'price'],
        "user_obligations": ['user', 'obligation', 'prohibited', 'not allowed', 'must', 'shall'],
        "company_rights": ['right', 'reserve', 'may', 'company', 'service provider'],
        "dispute_resolution": ['dispute', 'arbitration', 'court', 'legal', 'resolution'],
        "cookies_tracking": ['cookie', 'tracking', 'analytics', 'advertising', 'pixel']
    }
    
    for category, keywords in category_keywords.items():
        for keyword in keywords:
            categories[category] += text_lower.count(keyword)
    
    # Normalize scores (0-100)
    max_score = max(categories.values()) if categories.values() else 1
    for category in categories:
        categories[category] = min(100, int((categories[category] / max_score) * 100)) if max_score > 0 else 0
    
    return categories

def calculate_readability_score(text: str) -> int:
    """Calculate a simple readability score (0-100, higher is more readable)."""
    sentences = sent_tokenize(text)
    words = text.split()
    
    if not sentences or not words:
        return 50
    
    avg_sentence_length = len(words) / len(sentences)
    avg_word_length = sum(len(word) for word in words) / len(words)
    
    # Simple readability calculation
    score = 100 - (avg_sentence_length * 2) - (avg_word_length * 5)
    return max(0, min(100, int(score)))

def translate_comprehensive_analysis(summary_data: dict, target_language: str) -> dict:
    """Translate comprehensive analysis results to target language."""
    try:
        # Translate basic fields
        summary_data["executive_summary"] = translate_text(summary_data["executive_summary"], target_language)
        summary_data["key_points"] = [translate_text(point, target_language) for point in summary_data["key_points"]]
        
        # Translate important clauses
        for clause in summary_data["important_clauses"]:
            clause["clause"] = translate_text(clause["clause"], target_language)
        
        # Translate enhanced analysis if available
        if "enhanced_analysis" in summary_data:
            enhanced = summary_data["enhanced_analysis"]
            
            # Translate summary key points
            if "summary_key_points" in enhanced:
                enhanced["summary_key_points"]["main_purpose"] = translate_text(
                    enhanced["summary_key_points"]["main_purpose"], target_language
                )
                enhanced["summary_key_points"]["key_highlights"] = [
                    translate_text(highlight, target_language) 
                    for highlight in enhanced["summary_key_points"]["key_highlights"]
                ]
        
        return summary_data
    except Exception as e:
        print(f"Translation error in comprehensive analysis: {e}")
        return summary_data

def translate_text(text: str, target_language: str) -> str:
    """Translate text to target language."""
    try:
        if target_language == 'en':
            return text
        
        # Translate in chunks to avoid API limits
        sentences = sent_tokenize(text)
        translated_sentences = []
        
        for sentence in sentences:
            if len(sentence.strip()) > 0:
                try:
                    result = translator.translate(sentence, dest=target_language)
                    translated_sentences.append(result.text)
                except:
                    translated_sentences.append(sentence)  # Fallback to original
        
        return " ".join(translated_sentences)
    except Exception as e:
        print(f"Translation error: {e}")
        return text  # Return original text if translation fails

def analyze_risk(text: str):
    """Perform risk analysis using zero-shot classification."""
    try:
        # Ensure text is within token limits for the classifier
        token_count = count_tokens(text, classifier.tokenizer)
        if token_count > 512:
            print(f"Text too long for risk analysis ({token_count} tokens), truncating...")
            # Truncate text while preserving meaning
            sentences = sent_tokenize(text)
            truncated_text = ""
            current_tokens = 0
            
            for sentence in sentences:
                sentence_tokens = count_tokens(sentence, classifier.tokenizer)
                if current_tokens + sentence_tokens > 512:
                    break
                truncated_text += sentence + " "
                current_tokens += sentence_tokens
            
            text = truncated_text.strip()
        
        candidate_labels = [
            "privacy risk", "data sharing with third parties", "automatic renewal",
            "hidden fees", "difficult cancellation", "arbitration clause",
            "high liability", "low risk / consumer friendly"
        ]
        
        result = classifier(text, candidate_labels, multi_label=True)
        scores = dict(zip(result['labels'], result['scores']))

        # Compute risk score (0–100)
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
    except Exception as e:
        print(f"Risk analysis error: {e}")
        return {
            "label_scores": {},
            "overall_risk": 50,
            "risk_level": "UNKNOWN",
            "error": "Risk analysis temporarily unavailable"
        }

# ============================================================
# 📡 FastAPI Endpoints
# ============================================================

app = FastAPI(title="📜 T&C Summarizer + Risk Analyzer API (Local Models)")

# Add CORS middleware for browser extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextInput(BaseModel):
    text: str
    language: str = "en"  # Default to English

class URLInput(BaseModel):
    url: str
    language: str = "en"  # Default to English

@app.get("/")
def home():
    return {"message": "✅ API running — models connected locally!"}

@app.post("/analyze_text")
async def analyze_text(data: TextInput):
    """Analyze T&C text directly from user input with language support."""
    try:
        # Create structured summary
        summary_data = summarize_text(data.text)
        
        # Perform risk analysis
        risk = analyze_risk(summary_data["executive_summary"])
        
        # Translate if needed
        if data.language != "en":
            summary_data = translate_comprehensive_analysis(summary_data, data.language)
        
        return {
            "summary": summary_data,
            "risk_analysis": risk,
            "language": data.language,
            "metadata": {
                "processed_at": str(os.times()),
                "original_length": len(data.text),
                "summary_compression": len(summary_data["executive_summary"]) / len(data.text) if len(data.text) > 0 else 0
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/analyze_url")
async def analyze_url(data: URLInput):
    """Analyze Terms & Conditions directly from a website URL with language support."""
    try:
        text = extract_text_from_url(data.url)
        
        # Create structured summary
        summary_data = summarize_text(text)
        
        # Perform risk analysis
        risk = analyze_risk(summary_data["executive_summary"])
        
        # Translate if needed
        if data.language != "en":
            summary_data = translate_comprehensive_analysis(summary_data, data.language)
        
        return {
            "summary": summary_data,
            "risk_analysis": risk,
            "language": data.language,
            "source_url": data.url,
            "metadata": {
                "processed_at": str(os.times()),
                "original_length": len(text),
                "summary_compression": len(summary_data["executive_summary"]) / len(text) if len(text) > 0 else 0
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/supported_languages")
async def get_supported_languages():
    """Get list of supported languages for translation."""
    return {
        "languages": {
            "en": "English",
            "es": "Spanish",
            "fr": "French",
            "de": "German",
            "it": "Italian",
            "pt": "Portuguese",
            "ru": "Russian",
            "ja": "Japanese",
            "ko": "Korean",
            "zh": "Chinese",
            "ar": "Arabic",
            "hi": "Hindi",
            "nl": "Dutch",
            "sv": "Swedish",
            "da": "Danish",
            "no": "Norwegian",
            "fi": "Finnish"
        }
    }
