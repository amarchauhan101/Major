"""
Test script to verify the unified extension backend is working correctly
"""

import requests
import json

BACKEND_URL = "http://localhost:8000"

def test_backend_connection():
    """Test if backend is running"""
    try:
        response = requests.get(f"{BACKEND_URL}/")
        if response.status_code == 200:
            print("✅ Backend is running successfully")
            return True
        else:
            print(f"❌ Backend returned status code: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to backend: {e}")
        return False

def test_analyze_endpoint():
    """Test the /analyze endpoint with sample terms"""
    sample_terms = """
    Terms of Service
    
    By using our service, you agree to the following terms:
    
    1. We may collect and share your personal data with third-party partners for marketing purposes.
    2. You waive your right to sue and agree to binding arbitration for any disputes.
    3. We may terminate your account at any time without notice.
    4. Your subscription will automatically renew and charge your credit card.
    5. We are not liable for any damages or losses.
    """
    
    try:
        payload = {
            "content": sample_terms,
            "language": "en"
        }
        
        response = requests.post(f"{BACKEND_URL}/analyze", json=payload)
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ Analysis endpoint working correctly")
                print(f"📊 Risk Level: {result['data']['risk_analysis']['risk_level']}")
                print(f"🎯 Risk Score: {result['data']['risk_analysis']['overall_risk']}")
                print(f"⚠️  Risk Factors: {', '.join(result['data']['risk_analysis']['risk_factors'])}")
                return True
            else:
                print(f"❌ Analysis failed: {result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ Analysis endpoint returned status code: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to analyze endpoint: {e}")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON response: {e}")
        return False

def main():
    print("🧪 Testing Unified Extension Backend")
    print("=" * 50)
    
    # Test backend connection
    if not test_backend_connection():
        print("\n💡 Make sure to start the backend by running: start_backend.bat")
        return
    
    print()
    
    # Test analyze endpoint
    if test_analyze_endpoint():
        print("\n🎉 All tests passed! The backend is ready for the unified extension.")
    else:
        print("\n❌ Some tests failed. Check the backend logs for errors.")

if __name__ == "__main__":
    main()