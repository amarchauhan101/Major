// summarizer.js (background context)
async function summarizeContent(text, language) {
  // Client-side option (requires large libraries)
  if (USE_CLIENT_SIDE_NLP) {
    const { pipeline } = await import('@xenova/transformers');
    const summarizer = await pipeline('summarization');
    const summary = await summarizer(text, { max_length: 300 });
    return summary[0].summary_text;
  }
  
  // Server-based option (recommended)
  const API_URL = "https://your-nlp-service.com/summarize";
  
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language })
  });
  
  const { summary } = await response.json();
  return summary;
}