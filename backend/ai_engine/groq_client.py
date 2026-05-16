import os
import logging
from groq import Groq
from dotenv import load_dotenv

from .prompt_builder import PromptBuilder
from .response_parser import ResponseParser
from .error_mapper import ErrorMapper
from .fallback_handler import FallbackHandler
from .retry_handler import RetryHandler

load_dotenv()

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class GroqClient:
    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
        # Updated to new supported model
        self.model = "llama-3.3-70b-versatile"

    def analyze_code(self, code: str, syntax_errors: list, linting_issues: list) -> dict:
        if not self.client:
            return FallbackHandler.get_analysis_fallback(code, "API Key missing.")

        prompt = PromptBuilder.build_analysis_prompt(code, syntax_errors, linting_issues)
        
        try:
            def _make_call():
                return self.client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a strict JSON-only AI mentor."},
                        {"role": "user", "content": prompt}
                    ],
                    model=self.model,
                    temperature=0.1, # Lower temperature for more stable JSON
                    response_format={"type": "json_object"}
                )

            response = RetryHandler.execute_with_retry(_make_call)
            raw_content = response.choices[0].message.content
            
            parsed_data = ResponseParser.parse_analysis_response(raw_content)
            if not parsed_data:
                return FallbackHandler.get_analysis_fallback(code, "Failed to parse AI response.")
            
            return parsed_data

        except Exception as e:
            friendly_msg = ErrorMapper.map_to_user_friendly(e)
            logger.error(f"AI Analysis Error: {str(e)}")
            return FallbackHandler.get_analysis_fallback(code, friendly_msg)

    def chat(self, message: str, context_code: str = None) -> str:
        if not self.client:
            return FallbackHandler.get_chat_fallback("API Key missing.")

        prompt = PromptBuilder.build_chat_prompt(message, context_code)
        
        try:
            def _make_call():
                return self.client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a helpful coding mentor."},
                        {"role": "user", "content": prompt}
                    ],
                    model=self.model,
                    temperature=0.7,
                )

            response = RetryHandler.execute_with_retry(_make_call)
            return response.choices[0].message.content

        except Exception as e:
            friendly_msg = ErrorMapper.map_to_user_friendly(e)
            logger.error(f"AI Chat Error: {str(e)}")
            return FallbackHandler.get_chat_fallback(friendly_msg)

groq_client = GroqClient()
