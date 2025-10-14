import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
import joblib
import json

# Step 1: Load dataset
df = pd.read_csv("cookies.csv")  # assumes the file has columns: name, purpose

# Step 2: Split input and labels
X = df['name']
y = df['purpose']

# Step 3: Vectorize text data
vectorizer = CountVectorizer()
X_vectorized = vectorizer.fit_transform(X)

# Step 4: Train a simple Naive Bayes model
model = MultinomialNB()
model.fit(X_vectorized, y)

# Step 5: Save model and vectorizer for future use
joblib.dump(model, 'cookie_model.pkl')
joblib.dump(vectorizer, 'vectorizer.pkl')

# Step 6: Predict and save to JSON for use in the Chrome extension
cookie_map = {}
for name in X:
    purpose = model.predict(vectorizer.transform([name]))[0]
    cookie_map[name] = purpose

with open("cookie_prediction_map.json", "w") as f:
    json.dump(cookie_map, f, indent=2)

print("✅ Model trained. Prediction map saved as cookie_prediction_map.json")
