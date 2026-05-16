import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class GroqClient:
    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
        self.model = "llama3-70b-8192"

    def analyze_code(self, code: str, syntax_errors: list, linting_issues: list) -> str:
        if not self.client:
            return '{"error": "Groq API key not configured."}'
        
        prompt = f"""
You are an expert AI Coding Mentor for beginners. The user has provided some Python code.
Your job is to analyze the code and return a JSON object containing beginner-friendly feedback.
Avoid overly technical jargon. Be supportive and encouraging.

Here is the code:
```python
{code}
```

Known Syntax Errors: {syntax_errors}
Known Linting Issues: {linting_issues}

Respond strictly with a JSON object in the following format, with no extra text or markdown formatting outside the JSON:
{{
    "score": <int 0-100 based on readability, conventions, efficiency>,
    "explanation": "<friendly explanation of errors or feedback in simple language>",
    "corrected_code": "<the corrected and improved version of the code>",
    "complexity": {{
        "time": "<e.g., O(n)>",
        "space": "<e.g., O(1)>",
        "explanation": "<simple explanation of why>"
    }},
    "optimization_suggestions": [
        "<suggestion 1>",
        "<suggestion 2>"
    ],
    "learning_recommendations": [
        "<topic 1>",
        "<topic 2>"
    ]
}}
"""
        try:
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a helpful JSON-generating AI mentor."},
                    {"role": "user", "content": prompt}
                ],
                model=self.model,
                temperature=0.2,
            )
            return response.choices[0].message.content
        except Exception as e:
            return f'{{"error": "{str(e)}"}}'

    def chat(self, message: str, context_code: str = None) -> str:
        if not self.client:
            return "Groq API key not configured."
            
        system_prompt = "You are a friendly, encouraging AI coding mentor for beginners. Use simple language, avoid jargon, and guide the user without just giving away the final answer. Use markdown for code."
        
        user_content = message
        if context_code:
            user_content = f"Context Code:\n```python\n{context_code}\n```\n\nUser Question: {message}"

        try:
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                model=self.model,
                temperature=0.5,
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error: {str(e)}"

groq_client = GroqClient()
